import { prisma } from "../prisma";
import { OrderStatus, Role } from "../types";
import { autoAssignOrder } from "./assignment-engine";
import { sendOrderStatusNotification } from "./notification-service";

export interface StatusTransitionRequest {
  orderId: string;
  newStatus: OrderStatus;
  actor: {
    id: string;
    name: string;
    role: Role;
  };
  note?: string;
  failureReason?: string;
  locationLat?: number;
  locationLng?: number;
  isAdminOverride?: boolean;
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  CREATED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["PICKED_UP", "ASSIGNED", "CANCELLED"],
  PICKED_UP: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "FAILED", "DELIVERED"],
  IN_TRANSIT: ["OUT_FOR_DELIVERY", "FAILED", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: ["RESCHEDULED", "CANCELLED", "ASSIGNED"],
  RESCHEDULED: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "FAILED"],
  CANCELLED: [],
};

/**
 * Executes a verified order status transition, maintains immutable tracking logs,
 * updates agent delivery metrics, and dispatches customer notifications.
 */
export async function transitionOrderStatus(params: StatusTransitionRequest) {
  const {
    orderId,
    newStatus,
    actor,
    note,
    failureReason,
    locationLat,
    locationLng,
    isAdminOverride = false,
  } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      agent: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const currentStatus = order.status as OrderStatus;

  // Verify transition validity unless Admin override is specified
  if (!isAdminOverride && actor.role !== "ADMIN") {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${newStatus}".`
      );
    }

    // Role-specific verification
    if (actor.role === "AGENT") {
      if (order.agentId && order.agentId !== actor.id) {
        throw new Error("You can only update status for orders assigned to you.");
      }
    }
  }

  // Update order status
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      updatedAt: new Date(),
    },
  });

  // If order is completed or cancelled, decrement agent's active load
  if (
    (newStatus === "DELIVERED" || newStatus === "CANCELLED") &&
    order.agentId &&
    currentStatus !== "DELIVERED" &&
    currentStatus !== "CANCELLED"
  ) {
    await prisma.user.update({
      where: { id: order.agentId },
      data: {
        activeDeliveries: { decrement: 1 },
      },
    });
  }

  // Create immutable tracking audit record
  await prisma.trackingEvent.create({
    data: {
      orderId,
      status: newStatus,
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      note: note || (isAdminOverride ? `Status overridden to ${newStatus} by Admin.` : `Status updated to ${newStatus}.`),
      failureReason: newStatus === "FAILED" ? failureReason || "Delivery attempt failed" : null,
      locationLat: locationLat ?? order.agent?.currentLat ?? null,
      locationLng: locationLng ?? order.agent?.currentLng ?? null,
      timestamp: new Date(),
    },
  });

  // Trigger automated notification
  await sendOrderStatusNotification({
    orderId: order.id,
    trackingNumber: order.trackingNumber,
    recipientEmail: order.customer.email,
    recipientPhone: order.customer.phone,
    status: newStatus,
    actorName: actor.name,
    note,
    failureReason,
    charge: order.totalCharge,
  });

  return { success: true, newStatus };
}

/**
 * Handles failed delivery rescheduling requested by the customer.
 */
export async function rescheduleDelivery(params: {
  orderId: string;
  rescheduledDate: string; // ISO date string
  timeSlot?: string;
  customerNotes?: string;
  actor: { id: string; name: string; role: Role };
}) {
  const { orderId, rescheduledDate, timeSlot, customerNotes, actor } = params;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: true,
      agent: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.status !== "FAILED" && actor.role !== "ADMIN") {
    throw new Error("Only failed orders can be rescheduled.");
  }

  const parsedDate = new Date(rescheduledDate);
  const now = new Date();

  // Create Reschedule Request Record
  const rescheduleRecord = await prisma.rescheduleRequest.create({
    data: {
      orderId,
      originalDate: order.scheduledDeliveryDate || order.createdAt,
      rescheduledDate: parsedDate,
      timeSlot: timeSlot || "Anytime (09:00 - 18:00)",
      customerNotes: customerNotes || null,
      status: "PENDING",
    },
  });

  // Update order status to RESCHEDULED
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "RESCHEDULED",
      scheduledDeliveryDate: parsedDate,
    },
  });

  // Append tracking event
  await prisma.trackingEvent.create({
    data: {
      orderId,
      status: "RESCHEDULED",
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      note: `Delivery rescheduled for ${parsedDate.toDateString()} [Slot: ${timeSlot || "Standard"}]. Note: ${customerNotes || "None"}`,
      timestamp: new Date(),
    },
  });

  // Trigger agent reassignment
  const assignResult = await autoAssignOrder(orderId, {
    id: actor.id,
    name: "Reschedule Reassigner",
    role: "ADMIN",
  });

  if (assignResult.success) {
    await prisma.rescheduleRequest.update({
      where: { id: rescheduleRecord.id },
      data: {
        status: "ASSIGNED",
        assignedAgentId: assignResult.agentId,
      },
    });
  }

  // Send Reschedule Confirmation Notification
  await sendOrderStatusNotification({
    orderId: order.id,
    trackingNumber: order.trackingNumber,
    recipientEmail: order.customer.email,
    recipientPhone: order.customer.phone,
    status: "RESCHEDULED",
    actorName: actor.name,
    rescheduledDate: parsedDate.toLocaleDateString(),
    timeSlot: timeSlot || "09:00 AM - 06:00 PM",
    charge: order.totalCharge,
  });

  return {
    success: true,
    rescheduleId: rescheduleRecord.id,
    assignedAgent: assignResult.agentName,
  };
}
