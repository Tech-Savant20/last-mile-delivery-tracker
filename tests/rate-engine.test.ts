import {
  calculateVolumetricWeight,
  calculateChargeableWeight,
  detectZoneType,
  calculateShippingCharge,
} from "../src/lib/services/rate-engine";
import { autoAssignOrder } from "../src/lib/services/assignment-engine";
import { transitionOrderStatus, rescheduleDelivery } from "../src/lib/services/order-lifecycle";
import { prisma } from "../src/lib/prisma";

async function runTests() {
  console.log("?? Starting Automated Test Suite for Last-Mile Delivery Tracker...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ? PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ? FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Volumetric Weight Calculation Tests
  console.log("?? 1. Volumetric Weight Formula Tests [(L*W*H)/5000]:");
  const vol1 = calculateVolumetricWeight(20, 15, 10);
  assert(vol1 === 0.6, `(20*15*10)/5000 = 0.60 kg [Got: ${vol1}]`);

  const vol2 = calculateVolumetricWeight(50, 40, 30);
  assert(vol2 === 12.0, `(50*40*30)/5000 = 12.00 kg [Got: ${vol2}]`);

  const vol3 = calculateVolumetricWeight(0, 10, 10);
  assert(vol3 === 0, `Zero dimension returns 0 kg [Got: ${vol3}]`);

  // 2. Chargeable Weight Tests [max(actual, volumetric)]
  console.log("\n?? 2. Chargeable Weight Calculation Tests:");
  const ch1 = calculateChargeableWeight(2.5, 1.2);
  assert(ch1 === 2.5, `max(2.5, 1.2) = 2.5 kg [Got: ${ch1}]`);

  const ch2 = calculateChargeableWeight(1.0, 4.8);
  assert(ch2 === 4.8, `max(1.0, 4.8) = 4.8 kg (volumetric applied) [Got: ${ch2}]`);

  // 3. Zone Detection Tests
  console.log("\n?? 3. Zone Type Detection Tests:");
  assert(detectZoneType("ZONE_1", "ZONE_1") === "INTRA_ZONE", "Same zone is INTRA_ZONE");
  assert(detectZoneType("ZONE_1", "ZONE_2") === "INTER_ZONE", "Different zones are INTER_ZONE");

  // 4. Rate Engine with Database Cards Tests
  console.log("\n?? 4. Dynamic Database Rate Calculation Engine Tests:");
  const northZone = await prisma.zone.findFirst({ where: { code: "ZONE_NORTH" } });
  const southZone = await prisma.zone.findFirst({ where: { code: "ZONE_SOUTH" } });

  if (northZone && southZone) {
    // B2C Intra-zone test: (20*15*10 = 0.6kg volumetric), actual 0.4kg => billable 0.6kg (0.5kg base $40 + 0.1kg extra ceil(0.1)=1kg extra @ $20 = $60)
    const quoteB2CIntra = await calculateShippingCharge({
      pickupZoneId: northZone.id,
      dropZoneId: northZone.id,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      actualWeightKg: 0.4,
      orderType: "B2C",
      paymentType: "PREPAID",
    });
    assert(quoteB2CIntra.zoneType === "INTRA_ZONE", "Correctly identified INTRA_ZONE");
    assert(quoteB2CIntra.baseRate === 40, `B2C Intra base rate is $40 [Got: $${quoteB2CIntra.baseRate}]`);
    assert(quoteB2CIntra.totalCharge === 60, `Total with extra weight is $60.00 [Got: $${quoteB2CIntra.totalCharge}]`);

    // B2C COD Surcharge test: COD fee $30 fixed
    const quoteB2CCOD = await calculateShippingCharge({
      pickupZoneId: northZone.id,
      dropZoneId: northZone.id,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      actualWeightKg: 0.4,
      orderType: "B2C",
      paymentType: "COD",
      declaredValue: 50,
    });
    assert(quoteB2CCOD.codSurcharge === 30, `B2C COD surcharge is $30 [Got: $${quoteB2CCOD.codSurcharge}]`);
    assert(quoteB2CCOD.totalCharge === 90, `B2C COD Total is $90.00 [Got: $${quoteB2CCOD.totalCharge}]`);

    // B2B Inter-zone test: (50*40*30 = 12kg volumetric), actual 15kg => billable 15kg. Base 2kg ($220) + 13kg extra * $25 ($325) = $545. COD 2% on $1000 = $20 (min $100 => $100 COD) => Total $645
    const quoteB2BInter = await calculateShippingCharge({
      pickupZoneId: northZone.id,
      dropZoneId: southZone.id,
      lengthCm: 50,
      widthCm: 40,
      heightCm: 30,
      actualWeightKg: 15.0,
      orderType: "B2B",
      paymentType: "COD",
      declaredValue: 1000,
    });
    assert(quoteB2BInter.zoneType === "INTER_ZONE", "Correctly identified INTER_ZONE for North to South");
    assert(quoteB2BInter.baseRate === 220, `B2B Inter base rate is $220 [Got: $${quoteB2BInter.baseRate}]`);
    assert(quoteB2BInter.codSurcharge === 100, `B2B COD surcharge adheres to $100 minimum [Got: $${quoteB2BInter.codSurcharge}]`);
    assert(quoteB2BInter.totalCharge === 645, `B2B Total charge is $645.00 [Got: $${quoteB2BInter.totalCharge}]`);
  }

  // 5. Order State Machine & Immutable Tracking Event Tests
  console.log("\n?? 5. Order Lifecycle & Immutable Tracking Tests:");
  const testOrder = await prisma.order.findFirst({ where: { trackingNumber: "TRK-984210" } });
  if (testOrder) {
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (adminUser) {
      const historyBefore = await prisma.trackingEvent.count({ where: { orderId: testOrder.id } });
      await transitionOrderStatus({
        orderId: testOrder.id,
        newStatus: "OUT_FOR_DELIVERY",
        actor: { id: adminUser.id, name: adminUser.name, role: "ADMIN" },
        note: "Automated test transit update.",
        isAdminOverride: true,
      });
      const historyAfter = await prisma.trackingEvent.count({ where: { orderId: testOrder.id } });
      assert(historyAfter === historyBefore + 1, "Immutable tracking event inserted for status transition");
    }
  }

  console.log(`\n=========================================`);
  console.log(`?? Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`=========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
