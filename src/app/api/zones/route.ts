import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const zones = await prisma.zone.findMany({
      include: {
        areas: true,
        agents: {
          select: {
            id: true,
            name: true,
            email: true,
            isAvailable: true,
            activeDeliveries: true,
          },
        },
        _count: {
          select: {
            pickupOrders: true,
            dropOrders: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, zones });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch zones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, ["ADMIN"]);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized. Admin only." }, { status: 403 });
    }

    const { name, code, description } = await req.json();

    if (!name || !code) {
      return NextResponse.json({ error: "Zone name and unique code are required" }, { status: 400 });
    }

    const zone = await prisma.zone.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || null,
      },
    });

    return NextResponse.json({ success: true, zone }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create zone" }, { status: 500 });
  }
}
