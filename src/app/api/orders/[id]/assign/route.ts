import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { autoAssignOrder, manuallyAssignAgent } from "@/lib/services/assignment-engine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getAuthSession(req);
    const body = await req.json();

    const { type = "auto", agentId } = body;

    const actor = {
      id: session?.userId || "admin",
      name: session?.name || "Admin Operations",
      role: session?.role || "ADMIN",
    };

    if (type === "auto") {
      const result = await autoAssignOrder(id, actor);
      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: 400 });
      }
      return NextResponse.json(result);
    } else if (type === "manual") {
      if (!agentId) {
        return NextResponse.json({ error: "agentId is required for manual assignment" }, { status: 400 });
      }
      const result = await manuallyAssignAgent(id, agentId, actor);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: "Invalid assignment type" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to assign agent" }, { status: 400 });
  }
}
