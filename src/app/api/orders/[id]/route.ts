import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { trackingNumber: id }],
      },
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true, companyName: true },
        },
        agent: {
          select: { id: true, name: true, phone: true, email: true, isAvailable: true, currentLat: true, currentLng: true },
        },
        pickupArea: true,
        pickupZone: true,
        dropArea: true,
        dropZone: true,
        trackingEvents: {
          orderBy: { timestamp: "asc" },
        },
        rescheduleRequests: {
          orderBy: { createdAt: "desc" },
        },
        notifications: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve order" }, { status: 500 });
  }
}
