import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { Role } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { roleKey } = await req.json();

    let email = "admin@tracker.com";
    if (roleKey === "admin") email = "admin@tracker.com";
    else if (roleKey === "customer_b2c") email = "alice@customer.com";
    else if (roleKey === "customer_b2b") email = "logistics@techcorp.com";
    else if (roleKey === "agent_north") email = "agent.john@tracker.com";
    else if (roleKey === "agent_south") email = "agent.sarah@tracker.com";
    else if (roleKey === "agent_east") email = "agent.mike@tracker.com";

    const user = await prisma.user.findUnique({
      where: { email },
      include: { currentZone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Demo user not found. Please run seed script." }, { status: 404 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      companyName: user.companyName,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        companyName: user.companyName,
        currentZone: user.currentZone?.name,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Demo login failed" }, { status: 500 });
  }
}
