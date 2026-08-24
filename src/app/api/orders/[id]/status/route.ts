import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { transitionOrderStatus } from "@/lib/services/order-lifecycle";
import { OrderStatus, Role } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getAuthSession(req);
    const body = await req.json();

    const {
      newStatus,
      note,
      failureReason,
      locationLat,
      locationLng,
      isAdminOverride = false,
      actorOverride,
    } = body;

    if (!newStatus) {
      return NextResponse.json({ error: "newStatus is required" }, { status: 400 });
    }

    const actor = actorOverride || {
      id: session?.userId || "system",
      name: session?.name || "System Dispatcher",
      role: (session?.role || "ADMIN") as Role,
    };

    const result = await transitionOrderStatus({
      orderId: id,
      newStatus: newStatus as OrderStatus,
      actor,
      note,
      failureReason,
      locationLat,
      locationLng,
      isAdminOverride: Boolean(isAdminOverride || session?.role === "ADMIN"),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update order status" }, { status: 400 });
  }
}
