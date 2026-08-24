import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";

export async function GET() {
  try {
    const agents = await prisma.user.findMany({
      where: { role: "AGENT" },
      include: {
        currentZone: true,
        assignedOrders: {
          where: {
            status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY"] },
          },
          select: {
            id: true,
            trackingNumber: true,
            status: true,
            pickupAddress: true,
            dropAddress: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch agents" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const body = await req.json();
    const { agentId, isAvailable, currentZoneId, currentLat, currentLng } = body;

    const targetId = agentId || session?.userId;
    if (!targetId) {
      return NextResponse.json({ error: "Agent ID required" }, { status: 400 });
    }

    const data: any = {};
    if (isAvailable !== undefined) data.isAvailable = Boolean(isAvailable);
    if (currentZoneId) data.currentZoneId = currentZoneId;
    if (currentLat !== undefined) data.currentLat = Number(currentLat);
    if (currentLng !== undefined) data.currentLng = Number(currentLng);

    const updated = await prisma.user.update({
      where: { id: targetId },
      data,
      include: { currentZone: true },
    });

    return NextResponse.json({ success: true, agent: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update agent" }, { status: 500 });
  }
}
