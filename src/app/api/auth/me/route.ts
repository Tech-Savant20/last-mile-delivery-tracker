import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { currentZone: true },
    });

    if (!dbUser) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        phone: dbUser.phone,
        companyName: dbUser.companyName,
        currentZoneId: dbUser.currentZoneId,
        currentZoneName: dbUser.currentZone?.name,
        isAvailable: dbUser.isAvailable,
        activeDeliveries: dbUser.activeDeliveries,
        maxCapacity: dbUser.maxCapacity,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Session error" }, { status: 500 });
  }
}

export async function POST() {
  // Logout endpoint: clear cookie
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
