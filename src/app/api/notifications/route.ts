import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (session && session.role === "CUSTOMER") {
      where.recipientEmail = session.email;
    }

    const notifications = await prisma.notificationLog.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            trackingNumber: true,
            status: true,
          },
        },
      },
      orderBy: { sentAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, notifications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}
