import { NextRequest, NextResponse } from "next/server";
import { calculateShippingCharge } from "@/lib/services/rate-engine";
import { RateCalculationInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pickupAreaId,
      dropAreaId,
      pickupZoneId,
      dropZoneId,
      lengthCm,
      widthCm,
      heightCm,
      actualWeightKg,
      orderType = "B2C",
      paymentType = "PREPAID",
      declaredValue = 0,
    } = body;

    if (
      (!pickupAreaId && !pickupZoneId) ||
      (!dropAreaId && !dropZoneId) ||
      lengthCm == null ||
      widthCm == null ||
      heightCm == null ||
      actualWeightKg == null
    ) {
      return NextResponse.json(
        { error: "Pickup & drop locations, dimensions (L, W, H), and actual weight are required." },
        { status: 400 }
      );
    }

    const input: RateCalculationInput = {
      pickupAreaId,
      dropAreaId,
      pickupZoneId,
      dropZoneId,
      lengthCm: Number(lengthCm),
      widthCm: Number(widthCm),
      heightCm: Number(heightCm),
      actualWeightKg: Number(actualWeightKg),
      orderType,
      paymentType,
      declaredValue: Number(declaredValue || 0),
    };

    const breakdown = await calculateShippingCharge(input);
    return NextResponse.json({ success: true, breakdown });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Rate calculation failed" }, { status: 400 });
  }
}
