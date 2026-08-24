import { prisma } from "../prisma";
import { RateCalculationBreakdown, RateCalculationInput, ZoneType } from "../types";

/**
 * Calculates volumetric weight in kilograms: (Length * Width * Height) / 5000 (all dimensions in cm).
 */
export function calculateVolumetricWeight(lengthCm: number, widthCm: number, heightCm: number): number {
  if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) return 0;
  const volWeight = (lengthCm * widthCm * heightCm) / 5000;
  return Number(volWeight.toFixed(2));
}

/**
 * Returns the higher of actual weight or volumetric weight.
 */
export function calculateChargeableWeight(actualWeightKg: number, volumetricWeightKg: number): number {
  return Number(Math.max(actualWeightKg, volumetricWeightKg).toFixed(2));
}

/**
 * Determines whether the shipment is INTRA_ZONE or INTER_ZONE.
 */
export function detectZoneType(pickupZoneId: string, dropZoneId: string): ZoneType {
  return pickupZoneId === dropZoneId ? "INTRA_ZONE" : "INTER_ZONE";
}

/**
 * Core dynamic rate calculation engine.
 * Fetches configured rate cards and COD surcharge rules from the database.
 */
export async function calculateShippingCharge(input: RateCalculationInput): Promise<RateCalculationBreakdown> {
  const {
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg,
    orderType,
    paymentType,
    declaredValue = 0,
  } = input;

  let pickupZoneId = input.pickupZoneId;
  let dropZoneId = input.dropZoneId;
  let pickupZoneName = "Pickup Zone";
  let dropZoneName = "Drop Zone";

  // Resolve zones if area IDs provided
  if (input.pickupAreaId) {
    const pArea = await prisma.area.findUnique({
      where: { id: input.pickupAreaId },
      include: { zone: true },
    });
    if (pArea) {
      pickupZoneId = pArea.zoneId;
      pickupZoneName = pArea.zone.name;
    }
  } else if (pickupZoneId) {
    const pZone = await prisma.zone.findUnique({ where: { id: pickupZoneId } });
    if (pZone) pickupZoneName = pZone.name;
  }

  if (input.dropAreaId) {
    const dArea = await prisma.area.findUnique({
      where: { id: input.dropAreaId },
      include: { zone: true },
    });
    if (dArea) {
      dropZoneId = dArea.zoneId;
      dropZoneName = dArea.zone.name;
    }
  } else if (dropZoneId) {
    const dZone = await prisma.zone.findUnique({ where: { id: dropZoneId } });
    if (dZone) dropZoneName = dZone.name;
  }

  if (!pickupZoneId || !dropZoneId) {
    throw new Error("Both pickup and drop zones/areas must be specified.");
  }

  const zoneType = detectZoneType(pickupZoneId, dropZoneId);
  const volWeight = calculateVolumetricWeight(lengthCm, widthCm, heightCm);
  const chargeableWeight = calculateChargeableWeight(actualWeightKg, volWeight);
  const isVolumetricCharged = volWeight > actualWeightKg;

  // Query rate card from database (Admin-configurable, no hardcoding)
  const rateCard = await prisma.rateCard.findUnique({
    where: {
      orderType_zoneType: {
        orderType,
        zoneType,
      },
    },
  });

  if (!rateCard) {
    throw new Error(`Rate card not found for Order Type: ${orderType} and Zone: ${zoneType}. Please configure in Admin Settings.`);
  }

  const baseWeightKg = rateCard.baseWeightKg;
  const baseRate = rateCard.baseRate;
  const perExtraKgRate = rateCard.perExtraKgRate;

  // Extra weight calculation
  const extraWeight = Math.max(0, chargeableWeight - baseWeightKg);
  // Billable extra kg rounded up to whole increment or exact
  const extraKgBilled = Math.ceil(extraWeight);
  const extraWeightCharge = Number((extraKgBilled * perExtraKgRate).toFixed(2));
  const shippingCharge = Number(Math.max(rateCard.minCharge, baseRate + extraWeightCharge).toFixed(2));

  // COD Surcharge calculation
  let codSurcharge = 0;
  let codCalculationNote = "Prepaid order (No COD surcharge)";

  if (paymentType === "COD") {
    const surchargeConfig = await prisma.surchargeConfig.findUnique({
      where: {
        orderType_surchargeType: {
          orderType,
          surchargeType: "COD",
        },
      },
    });

    if (surchargeConfig) {
      if (surchargeConfig.feeType === "PERCENTAGE") {
        const calculatedFee = (declaredValue * surchargeConfig.feeValue) / 100;
        codSurcharge = Number(Math.max(surchargeConfig.minFee, calculatedFee).toFixed(2));
        codCalculationNote = `${surchargeConfig.feeValue}% of declared value ($${declaredValue}) [Min $${surchargeConfig.minFee}]`;
      } else {
        codSurcharge = Number(Math.max(surchargeConfig.minFee, surchargeConfig.feeValue).toFixed(2));
        codCalculationNote = `Fixed COD Fee: $${surchargeConfig.feeValue}`;
      }
    } else {
      // Default fallback if not yet set
      codSurcharge = orderType === "B2B" ? 50 : 25;
      codCalculationNote = `Standard COD Fee: $${codSurcharge}`;
    }
  }

  const totalCharge = Number((shippingCharge + codSurcharge).toFixed(2));

  return {
    actualWeightKg,
    volumetricWeightKg: volWeight,
    chargeableWeightKg: chargeableWeight,
    isVolumetricCharged,
    zoneType,
    pickupZoneName,
    dropZoneName,
    baseWeightKg,
    baseRate,
    extraWeightKg: Number(extraWeight.toFixed(2)),
    perExtraKgRate,
    extraWeightCharge,
    shippingCharge,
    codSurcharge,
    codCalculationNote,
    totalCharge,
  };
}
