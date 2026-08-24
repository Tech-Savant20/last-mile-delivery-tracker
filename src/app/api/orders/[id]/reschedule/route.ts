import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { rescheduleDelivery } from "@/lib/services/order-lifecycle";
import { Role } from "@/lib/types";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getAuthSession(req);
    const body = await req.json();

    const { rescheduledDate, timeSlot, customerNotes } = body;

    if (!rescheduledDate) {
      return NextResponse.json({ error: "rescheduledDate is required" }, { status: 400 });
    }

    const actor = {
      id: session?.userId || "customer",
      name: session?.name || "Customer",
      role: (session?.role || "CUSTOMER") as Role,
    };

    const result = await rescheduleDelivery({
      orderId: id,
      rescheduledDate,
      timeSlot,
      customerNotes,
      actor,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to reschedule delivery" }, { status: 400 });
  }
}
