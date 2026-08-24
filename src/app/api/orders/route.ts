import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth";
import { calculateShippingCharge } from "@/lib/services/rate-engine";
import { autoAssignOrder } from "@/lib/services/assignment-engine";
import { sendOrderStatusNotification } from "@/lib/services/notification-service";
import { OrderStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const zoneId = searchParams.get("zoneId");
    const agentId = searchParams.get("agentId");
    const orderType = searchParams.get("orderType");
    const search = searchParams.get("search");
    const customerId = searchParams.get("customerId");

    const where: any = {};

    // Role-based filtering
    if (session) {
      if (session.role === "CUSTOMER") {
        where.customerId = session.userId;
      } else if (session.role === "AGENT") {
        // Agent sees orders assigned to them, or created orders in their zone
        where.OR = [
          { agentId: session.userId },
        ];
      }
    }

    if (customerId) where.customerId = customerId;
    if (status && status !== "ALL") where.status = status;
    if (orderType && orderType !== "ALL") where.orderType = orderType;
    if (agentId && agentId !== "ALL") where.agentId = agentId;
    if (zoneId && zoneId !== "ALL") {
      where.OR = [{ pickupZoneId: zoneId }, { dropZoneId: zoneId }];
    }

    if (search) {
      where.OR = [
        { trackingNumber: { contains: search } },
        { pickupAddress: { contains: search } },
        { dropAddress: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true, email: true, phone: true, companyName: true },
        },
        agent: {
          select: { id: true, name: true, phone: true, isAvailable: true, currentLat: true, currentLng: true },
        },
        pickupArea: true,
        pickupZone: true,
        dropArea: true,
        dropZone: true,
        _count: {
          select: { trackingEvents: true, rescheduleRequests: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const body = await req.json();

    const {
      customerId: explicitCustomerId,
      orderType = "B2C",
      paymentType = "PREPAID",
      declaredValue = 0,
      lengthCm,
      widthCm,
      heightCm,
      actualWeightKg,
      pickupAddress,
      pickupAreaId,
      dropAddress,
      dropAreaId,
      autoAssign = true,
      scheduledDeliveryDate,
    } = body;

    // Determine customer ID
    let targetCustomerId = explicitCustomerId;
    if (!targetCustomerId) {
      if (session) {
        targetCustomerId = session.userId;
      } else {
        // Find or create default demo customer
        const defCustomer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
        targetCustomerId = defCustomer?.id;
      }
    }

    if (!targetCustomerId) {
      return NextResponse.json({ error: "Customer account required to place an order." }, { status: 400 });
    }

    if (!pickupAreaId || !dropAreaId || !pickupAddress || !dropAddress) {
      return NextResponse.json({ error: "Pickup and Drop locations are required." }, { status: 400 });
    }

    // Lookup areas to find zones
    const [pickupArea, dropArea, customer] = await Promise.all([
      prisma.area.findUnique({ where: { id: pickupAreaId }, include: { zone: true } }),
      prisma.area.findUnique({ where: { id: dropAreaId }, include: { zone: true } }),
      prisma.user.findUnique({ where: { id: targetCustomerId } }),
    ]);

    if (!pickupArea || !dropArea || !customer) {
      return NextResponse.json({ error: "Invalid pickup/drop area or customer." }, { status: 400 });
    }

    // Run dynamic rate calculation
    const rateBreakdown = await calculateShippingCharge({
      pickupAreaId,
      dropAreaId,
      pickupZoneId: pickupArea.zoneId,
      dropZoneId: dropArea.zoneId,
      lengthCm: Number(lengthCm),
      widthCm: Number(widthCm),
      heightCm: Number(heightCm),
      actualWeightKg: Number(actualWeightKg),
      orderType,
      paymentType,
      declaredValue: Number(declaredValue || 0),
    });

    // Generate unique tracking number
    const trackingNumber = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Order in DB
    const order = await prisma.order.create({
      data: {
        trackingNumber,
        customerId: targetCustomerId,
        orderType,
        paymentType,
        declaredValue: Number(declaredValue || 0),
        lengthCm: Number(lengthCm),
        widthCm: Number(widthCm),
        heightCm: Number(heightCm),
        actualWeightKg: rateBreakdown.actualWeightKg,
        volumetricWeightKg: rateBreakdown.volumetricWeightKg,
        chargeableWeightKg: rateBreakdown.chargeableWeightKg,
        pickupAddress,
        pickupAreaId,
        pickupZoneId: pickupArea.zoneId,
        dropAddress,
        dropAreaId,
        dropZoneId: dropArea.zoneId,
        baseShippingCharge: rateBreakdown.baseRate,
        extraWeightCharge: rateBreakdown.extraWeightCharge,
        codSurcharge: rateBreakdown.codSurcharge,
        totalCharge: rateBreakdown.totalCharge,
        status: "CREATED",
        scheduledDeliveryDate: scheduledDeliveryDate ? new Date(scheduledDeliveryDate) : new Date(Date.now() + 86400000),
      },
    });

    // Create initial immutable tracking event
    await prisma.trackingEvent.create({
      data: {
        orderId: order.id,
        status: "CREATED",
        actorId: session?.userId || customer.id,
        actorRole: session?.role || "CUSTOMER",
        actorName: session?.name || customer.name,
        note: `Order booked with charge $${rateBreakdown.totalCharge} (${rateBreakdown.zoneType}, ${rateBreakdown.chargeableWeightKg}kg billable).`,
      },
    });

    // Send confirmation notification
    await sendOrderStatusNotification({
      orderId: order.id,
      trackingNumber: order.trackingNumber,
      recipientEmail: customer.email,
      recipientPhone: customer.phone,
      status: "CREATED",
      actorName: customer.name,
      charge: order.totalCharge,
    });

    // Auto-assignment if enabled
    let assignmentResult = null;
    if (autoAssign) {
      assignmentResult = await autoAssignOrder(order.id, {
        id: session?.userId,
        name: "Auto-Assignment Pipeline",
        role: "ADMIN",
      });
    }

    const createdOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        customer: true,
        agent: true,
        pickupArea: true,
        pickupZone: true,
        dropArea: true,
        dropZone: true,
        trackingEvents: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        order: createdOrder,
        rateBreakdown,
        assignment: assignmentResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
