import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const areas = await prisma.area.findMany({
      include: {
        zone: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, areas });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch areas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ["ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 403 });
    }

    const { name, pincode, zoneId, defaultLat = 28.6139, defaultLng = 77.2090 } = await req.json();

    if (!name || !pincode || !zoneId) {
      return NextResponse.json({ error: "Name, pincode, and zoneId are required" }, { status: 400 });
    }

    const area = await prisma.area.create({
      data: {
        name,
        pincode,
        zoneId,
        defaultLat: Number(defaultLat),
        defaultLng: Number(defaultLng),
      },
      include: { zone: true },
    });

    return NextResponse.json({ success: true, area }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create area" }, { status: 500 });
  }
}
