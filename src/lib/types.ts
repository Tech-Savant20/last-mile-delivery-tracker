export type Role = "ADMIN" | "CUSTOMER" | "AGENT";
export type OrderType = "B2B" | "B2C";
export type PaymentType = "PREPAID" | "COD";
export type ZoneType = "INTRA_ZONE" | "INTER_ZONE";
export type SurchargeFeeType = "FIXED" | "PERCENTAGE";

export type OrderStatus =
  | "CREATED"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "FAILED"
  | "RESCHEDULED"
  | "CANCELLED";

export type RescheduleStatus = "PENDING" | "ASSIGNED" | "COMPLETED";
export type NotificationChannel = "EMAIL" | "SMS";
export type NotificationStatus = "SENT" | "FAILED" | "DELIVERED";

export interface RateCalculationInput {
  pickupAreaId?: string;
  dropAreaId?: string;
  pickupZoneId?: string;
  dropZoneId?: string;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  actualWeightKg: number;
  orderType: OrderType;
  paymentType: PaymentType;
  declaredValue?: number;
}

export interface RateCalculationBreakdown {
  actualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  isVolumetricCharged: boolean;
  zoneType: ZoneType;
  pickupZoneName: string;
  dropZoneName: string;
  baseWeightKg: number;
  baseRate: number;
  extraWeightKg: number;
  perExtraKgRate: number;
  extraWeightCharge: number;
  shippingCharge: number;
  codSurcharge: number;
  codCalculationNote?: string;
  totalCharge: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  companyName?: string | null;
}
