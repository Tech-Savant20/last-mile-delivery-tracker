import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const [rateCards, surcharges] = await Promise.all([
      prisma.rateCard.findMany({
        orderBy: [{ orderType: "asc" }, { zoneType: "asc" }],
      }),
      prisma.surchargeConfig.findMany({
        orderBy: { orderType: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, rateCards, surcharges });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load rate configurations" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ["ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { rateCards, surcharges } = body;

    // Update RateCards
    if (Array.isArray(rateCards)) {
      for (const card of rateCards) {
        if (card.id) {
          await prisma.rateCard.update({
            where: { id: card.id },
            data: {
              baseWeightKg: Number(card.baseWeightKg),
              baseRate: Number(card.baseRate),
              perExtraKgRate: Number(card.perExtraKgRate),
              minCharge: Number(card.minCharge || 0),
            },
          });
        }
      }
    }

    // Update Surcharges
    if (Array.isArray(surcharges)) {
      for (const sur of surcharges) {
        if (sur.id) {
          await prisma.surchargeConfig.update({
            where: { id: sur.id },
            data: {
              feeType: sur.feeType,
              feeValue: Number(sur.feeValue),
              minFee: Number(sur.minFee || 0),
            },
          });
        }
      }
    }

    const [updatedCards, updatedSurcharges] = await Promise.all([
      prisma.rateCard.findMany(),
      prisma.surchargeConfig.findMany(),
    ]);

    return NextResponse.json({
      success: true,
      message: "Rate configurations updated successfully",
      rateCards: updatedCards,
      surcharges: updatedSurcharges,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update configs" }, { status: 500 });
  }
}
