import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalOrders,
      orders,
      activeAgents,
      zones,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.findMany({
        select: {
          status: true,
          totalCharge: true,
          orderType: true,
          paymentType: true,
          pickupZoneId: true,
          dropZoneId: true,
          createdAt: true,
        },
      }),
      prisma.user.count({
        where: { role: "AGENT", isAvailable: true },
      }),
      prisma.zone.findMany({
        include: {
          _count: {
            select: { pickupOrders: true, dropOrders: true },
          },
        },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalCharge || 0), 0);
    const deliveredCount = orders.filter((o) => o.status === "DELIVERED").length;
    const failedCount = orders.filter((o) => o.status === "FAILED").length;
    const rescheduledCount = orders.filter((o) => o.status === "RESCHEDULED").length;
    const inTransitCount = orders.filter((o) =>
      ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(o.status)
    ).length;
    const pendingCount = orders.filter((o) =>
      ["CREATED", "ASSIGNED"].includes(o.status)
    ).length;

    const b2bCount = orders.filter((o) => o.orderType === "B2B").length;
    const b2cCount = orders.filter((o) => o.orderType === "B2C").length;
    const codCount = orders.filter((o) => o.paymentType === "COD").length;
    const prepaidCount = orders.filter((o) => o.paymentType === "PREPAID").length;

    const successRate = totalOrders > 0 ? ((deliveredCount / totalOrders) * 100).toFixed(1) : "0";

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        activeAgents,
        deliveredCount,
        failedCount,
        rescheduledCount,
        inTransitCount,
        pendingCount,
        b2bCount,
        b2cCount,
        codCount,
        prepaidCount,
        successRate: `${successRate}%`,
      },
      zones: zones.map((z) => ({
        id: z.id,
        name: z.name,
        code: z.code,
        pickupOrdersCount: z._count.pickupOrders,
        dropOrdersCount: z._count.dropOrders,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch analytics" }, { status: 500 });
  }
}
