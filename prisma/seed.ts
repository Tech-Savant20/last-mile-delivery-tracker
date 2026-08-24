import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("?? Seeding Last-Mile Delivery Tracker database...");

  // 1. Clean existing records
  await prisma.notificationLog.deleteMany();
  await prisma.rescheduleRequest.deleteMany();
  await prisma.trackingEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.surchargeConfig.deleteMany();
  await prisma.rateCard.deleteMany();
  await prisma.area.deleteMany();
  await prisma.user.deleteMany();
  await prisma.zone.deleteMany();

  // 2. Create Zones
  const zoneNorth = await prisma.zone.create({
    data: {
      name: "Metro North Zone",
      code: "ZONE_NORTH",
      description: "North Metropolitan Commercial & Residential Hub",
    },
  });

  const zoneSouth = await prisma.zone.create({
    data: {
      name: "Metro South Zone",
      code: "ZONE_SOUTH",
      description: "South Metropolitan Tech & Business Corridor",
    },
  });

  const zoneEast = await prisma.zone.create({
    data: {
      name: "Metro East Zone",
      code: "ZONE_EAST",
      description: "East Industrial & Distribution Hub",
    },
  });

  const zoneWest = await prisma.zone.create({
    data: {
      name: "Metro West Zone",
      code: "ZONE_WEST",
      description: "West Logistics & Residential Suburbs",
    },
  });

  // 3. Create Areas
  const areaCP = await prisma.area.create({
    data: {
      name: "Connaught Place",
      pincode: "110001",
      zoneId: zoneNorth.id,
      defaultLat: 28.6315,
      defaultLng: 77.2167,
    },
  });

  const areaPitampura = await prisma.area.create({
    data: {
      name: "Pitampura Hub",
      pincode: "110034",
      zoneId: zoneNorth.id,
      defaultLat: 28.6990,
      defaultLng: 77.1384,
    },
  });

  const areaSaket = await prisma.area.create({
    data: {
      name: "Saket City Center",
      pincode: "110017",
      zoneId: zoneSouth.id,
      defaultLat: 28.5244,
      defaultLng: 77.2066,
    },
  });

  const areaCyberCity = await prisma.area.create({
    data: {
      name: "Cyber City Tech Park",
      pincode: "122002",
      zoneId: zoneSouth.id,
      defaultLat: 28.4900,
      defaultLng: 77.0800,
    },
  });

  const areaPreetVihar = await prisma.area.create({
    data: {
      name: "Preet Vihar Commercial",
      pincode: "110092",
      zoneId: zoneEast.id,
      defaultLat: 28.6415,
      defaultLng: 77.2952,
    },
  });

  const areaDwarka = await prisma.area.create({
    data: {
      name: "Dwarka Sector 10",
      pincode: "110075",
      zoneId: zoneWest.id,
      defaultLat: 28.5823,
      defaultLng: 77.0500,
    },
  });

  // 4. Create Rate Cards
  await prisma.rateCard.createMany({
    data: [
      {
        orderType: "B2C",
        zoneType: "INTRA_ZONE",
        baseWeightKg: 0.5,
        baseRate: 40.0,
        perExtraKgRate: 20.0,
        minCharge: 40.0,
      },
      {
        orderType: "B2C",
        zoneType: "INTER_ZONE",
        baseWeightKg: 0.5,
        baseRate: 70.0,
        perExtraKgRate: 35.0,
        minCharge: 70.0,
      },
      {
        orderType: "B2B",
        zoneType: "INTRA_ZONE",
        baseWeightKg: 2.0,
        baseRate: 120.0,
        perExtraKgRate: 15.0,
        minCharge: 120.0,
      },
      {
        orderType: "B2B",
        zoneType: "INTER_ZONE",
        baseWeightKg: 2.0,
        baseRate: 220.0,
        perExtraKgRate: 25.0,
        minCharge: 220.0,
      },
    ],
  });

  // 5. Create COD Surcharges
  await prisma.surchargeConfig.createMany({
    data: [
      {
        orderType: "B2C",
        surchargeType: "COD",
        feeType: "FIXED",
        feeValue: 30.0,
        minFee: 30.0,
      },
      {
        orderType: "B2B",
        surchargeType: "COD",
        feeType: "PERCENTAGE",
        feeValue: 2.0,
        minFee: 100.0,
      },
    ],
  });

  // 6. Create Users
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@tracker.com",
      name: "Alex Vance (Operations Admin)",
      role: "ADMIN",
      passwordHash: defaultPasswordHash,
      phone: "+1 555-0100",
    },
  });

  const customerB2C = await prisma.user.create({
    data: {
      email: "alice@customer.com",
      name: "Alice Green",
      role: "CUSTOMER",
      passwordHash: defaultPasswordHash,
      phone: "+1 555-0111",
    },
  });

  const customerB2B = await prisma.user.create({
    data: {
      email: "logistics@techcorp.com",
      name: "Marcus Vance",
      companyName: "TechCorp Enterprise Global",
      role: "CUSTOMER",
      passwordHash: defaultPasswordHash,
      phone: "+1 555-0122",
    },
  });

  // Agents
  const agentNorth = await prisma.user.create({
    data: {
      email: "agent.john@tracker.com",
      name: "John Miller (North Express)",
      role: "AGENT",
      passwordHash: defaultPasswordHash,
      phone: "+1 555-0201",
      currentZoneId: zoneNorth.id,
      currentLat: 28.6320,
      currentLng: 77.2180,
      isAvailable: true,
      maxCapacity: 6,
      activeDeliveries: 1,
    },
  });

  const agentSouth = await prisma.user.create({
    data: {
      email: "agent.sarah@tracker.com",
      name: "Sarah Chen (South Speed)",
      role: "AGENT",
      passwordHash: defaultPasswordHash,
      phone: "+1 555-0202",
      currentZoneId: zoneSouth.id,
      currentLat: 28.5250,
      currentLng: 77.2080,
      isAvailable: true,
      maxCapacity: 5,
      activeDeliveries: 0,
    },
  });

  const agentEast = await prisma.user.create({
    data: {
      email: "agent.mike@tracker.com",
      name: "Mike Rodriguez (East Cargo)",
      role: "AGENT",
      passwordHash: defaultPasswordHash,
      phone: "+1 555-0203",
      currentZoneId: zoneEast.id,
      currentLat: 28.6420,
      currentLng: 77.2960,
      isAvailable: true,
      maxCapacity: 5,
      activeDeliveries: 0,
    },
  });

  // 7. Seed Demo Orders

  // Order 1: IN_TRANSIT (Inter-zone B2C)
  const order1 = await prisma.order.create({
    data: {
      trackingNumber: "TRK-984210",
      customerId: customerB2C.id,
      agentId: agentNorth.id,
      orderType: "B2C",
      paymentType: "PREPAID",
      declaredValue: 120.0,
      lengthCm: 25,
      widthCm: 20,
      heightCm: 15,
      actualWeightKg: 1.2,
      volumetricWeightKg: 1.5, // 25*20*15/5000 = 1.5
      chargeableWeightKg: 1.5, // max(1.2, 1.5)
      pickupAddress: "Shop 14, Inner Circle, Connaught Place",
      pickupAreaId: areaCP.id,
      pickupZoneId: zoneNorth.id,
      dropAddress: "Block C, Saket District Centre",
      dropAreaId: areaSaket.id,
      dropZoneId: zoneSouth.id,
      baseShippingCharge: 70.0, // Inter-zone base
      extraWeightCharge: 35.0, // 1kg extra * 35
      codSurcharge: 0.0,
      totalCharge: 105.0,
      status: "IN_TRANSIT",
      scheduledDeliveryDate: new Date(Date.now() + 86400000),
    },
  });

  await prisma.trackingEvent.createMany({
    data: [
      {
        orderId: order1.id,
        status: "CREATED",
        actorId: customerB2C.id,
        actorRole: "CUSTOMER",
        actorName: customerB2C.name,
        note: "Order placed by customer.",
        timestamp: new Date(Date.now() - 7200000),
      },
      {
        orderId: order1.id,
        status: "ASSIGNED",
        actorId: admin.id,
        actorRole: "ADMIN",
        actorName: "Auto-Assignment Engine",
        note: "Auto-assigned to John Miller based on North zone proximity.",
        timestamp: new Date(Date.now() - 5400000),
      },
      {
        orderId: order1.id,
        status: "PICKED_UP",
        actorId: agentNorth.id,
        actorRole: "AGENT",
        actorName: agentNorth.name,
        note: "Package verified and picked up from sender.",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        orderId: order1.id,
        status: "IN_TRANSIT",
        actorId: agentNorth.id,
        actorRole: "AGENT",
        actorName: agentNorth.name,
        note: "Package in transit to South Distribution Center.",
        timestamp: new Date(Date.now() - 1800000),
      },
    ],
  });

  // Order 2: FAILED (Ready for customer reschedule demonstration)
  const order2 = await prisma.order.create({
    data: {
      trackingNumber: "TRK-552199",
      customerId: customerB2C.id,
      agentId: agentNorth.id,
      orderType: "B2C",
      paymentType: "COD",
      declaredValue: 85.0,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      actualWeightKg: 0.8,
      volumetricWeightKg: 0.6,
      chargeableWeightKg: 0.8,
      pickupAddress: "Flat 4B, Pitampura Heights",
      pickupAreaId: areaPitampura.id,
      pickupZoneId: zoneNorth.id,
      dropAddress: "House 102, Connaught Place",
      dropAreaId: areaCP.id,
      dropZoneId: zoneNorth.id,
      baseShippingCharge: 40.0, // Intra-zone
      extraWeightCharge: 20.0,
      codSurcharge: 30.0, // COD fixed
      totalCharge: 90.0,
      status: "FAILED",
      scheduledDeliveryDate: new Date(),
    },
  });

  await prisma.trackingEvent.createMany({
    data: [
      {
        orderId: order2.id,
        status: "CREATED",
        actorId: customerB2C.id,
        actorRole: "CUSTOMER",
        actorName: customerB2C.name,
        note: "Order created with COD payment.",
        timestamp: new Date(Date.now() - 14400000),
      },
      {
        orderId: order2.id,
        status: "OUT_FOR_DELIVERY",
        actorId: agentNorth.id,
        actorRole: "AGENT",
        actorName: agentNorth.name,
        note: "Out for delivery with delivery agent.",
        timestamp: new Date(Date.now() - 7200000),
      },
      {
        orderId: order2.id,
        status: "FAILED",
        actorId: agentNorth.id,
        actorRole: "AGENT",
        actorName: agentNorth.name,
        failureReason: "Customer unavailable / Gate locked",
        note: "Attempted 2 phone calls. Door locked. Delivery marked as failed.",
        timestamp: new Date(Date.now() - 1800000),
      },
    ],
  });

  // Seed notification for failed order
  await prisma.notificationLog.create({
    data: {
      orderId: order2.id,
      recipientEmail: customerB2C.email,
      recipientPhone: customerB2C.phone,
      channel: "EMAIL",
      subject: "Delivery Attempt Failed: Order #TRK-552199",
      content: "We attempted to deliver your order #TRK-552199, but the attempt was unsuccessful (Reason: Customer unavailable / Gate locked). Please visit the portal to reschedule your delivery.",
      status: "SENT",
      sentAt: new Date(Date.now() - 1700000),
    },
  });

  // Order 3: DELIVERED (B2B heavy volumetric order)
  const order3 = await prisma.order.create({
    data: {
      trackingNumber: "TRK-771802",
      customerId: customerB2B.id,
      agentId: agentSouth.id,
      orderType: "B2B",
      paymentType: "PREPAID",
      declaredValue: 2400.0,
      lengthCm: 60,
      widthCm: 50,
      heightCm: 40,
      actualWeightKg: 8.5,
      volumetricWeightKg: 24.0, // (60*50*40)/5000 = 24.0kg
      chargeableWeightKg: 24.0, // volumetric higher than 8.5kg
      pickupAddress: "Tower B, Cyber City Tech Park",
      pickupAreaId: areaCyberCity.id,
      pickupZoneId: zoneSouth.id,
      dropAddress: "Building 8, Preet Vihar Commercial Complex",
      dropAreaId: areaPreetVihar.id,
      dropZoneId: zoneEast.id,
      baseShippingCharge: 220.0,
      extraWeightCharge: 550.0, // 22 extra kg * $25
      codSurcharge: 0.0,
      totalCharge: 770.0,
      status: "DELIVERED",
      scheduledDeliveryDate: new Date(Date.now() - 86400000),
    },
  });

  await prisma.trackingEvent.createMany({
    data: [
      {
        orderId: order3.id,
        status: "CREATED",
        actorId: customerB2B.id,
        actorRole: "CUSTOMER",
        actorName: customerB2B.name,
        note: "B2B Bulk shipment booked.",
        timestamp: new Date(Date.now() - 172800000),
      },
      {
        orderId: order3.id,
        status: "DELIVERED",
        actorId: agentSouth.id,
        actorRole: "AGENT",
        actorName: agentSouth.name,
        note: "Delivered to warehouse loading dock. Received by Warehouse Lead.",
        timestamp: new Date(Date.now() - 86400000),
      },
    ],
  });

  // Order 4: CREATED (Ready for 1-click Auto Assignment demo)
  await prisma.order.create({
    data: {
      trackingNumber: "TRK-339011",
      customerId: customerB2C.id,
      orderType: "B2C",
      paymentType: "PREPAID",
      declaredValue: 45.0,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      actualWeightKg: 0.5,
      volumetricWeightKg: 0.6,
      chargeableWeightKg: 0.6,
      pickupAddress: "Preet Vihar Market Shop #2",
      pickupAreaId: areaPreetVihar.id,
      pickupZoneId: zoneEast.id,
      dropAddress: "Pocket 1, Dwarka Sector 10",
      dropAreaId: areaDwarka.id,
      dropZoneId: zoneWest.id,
      baseShippingCharge: 70.0,
      extraWeightCharge: 35.0,
      codSurcharge: 0.0,
      totalCharge: 105.0,
      status: "CREATED",
      scheduledDeliveryDate: new Date(Date.now() + 86400000),
    },
  });

  console.log("? Seeding completed successfully!");
  console.log(`Demo Logins:
  - Admin: admin@tracker.com / password123
  - Customer B2C: alice@customer.com / password123
  - Customer B2B: logistics@techcorp.com / password123
  - Agent North: agent.john@tracker.com / password123
  - Agent South: agent.sarah@tracker.com / password123
  - Agent East: agent.mike@tracker.com / password123`);
}

main()
  .catch((e) => {
    console.error("? Seed Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
