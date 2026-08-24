import { prisma } from "../prisma";
import { sendOrderStatusNotification } from "./notification-service";

/**
 * Calculates great-circle distance between two points in km using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export interface AgentAssignmentResult {
  success: boolean;
  agentId?: string;
  agentName?: string;
  distanceKm?: number;
  message: string;
}

/**
 * Detects the nearest available agent and assigns them to the order.
 */
export async function autoAssignOrder(
  orderId: string,
  actor?: { id?: string; name?: string; role?: string }
): Promise<AgentAssignmentResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      pickupArea: true,
      pickupZone: true,
      customer: true,
    },
  });

  if (!order) {
    return { success: false, message: "Order not found." };
  }

  // Find all available agents who have not exceeded max capacity
  const candidateAgents = await prisma.user.findMany({
    where: {
      role: "AGENT",
      isAvailable: true,
    },
    include: {
      currentZone: true,
    },
  });

  // Filter agents with available capacity
  const eligibleAgents = candidateAgents.filter(
    (agent) => agent.activeDeliveries < agent.maxCapacity
  );

  if (eligibleAgents.length === 0) {
    return {
      success: false,
      message: "No available delivery agents found within capacity.",
    };
  }

  const pickupLat = order.pickupArea?.defaultLat ?? 28.6139;
  const pickupLng = order.pickupArea?.defaultLng ?? 77.2090;

  // Score and sort candidate agents
  // Scoring priority:
  // 1. Same pickup zone (proximity factor)
  // 2. Physical distance (Haversine)
  // 3. Lowest active deliveries (workload balancing)
  const scoredAgents = eligibleAgents.map((agent) => {
    const isSameZone = agent.currentZoneId === order.pickupZoneId;
    const agentLat = agent.currentLat ?? pickupLat;
    const agentLng = agent.currentLng ?? pickupLng;
    const distanceKm = calculateDistanceKm(agentLat, agentLng, pickupLat, pickupLng);

    // Composite score: lower is better
    // Penalty of +25km if agent is in a different zone
    const zonePenalty = isSameZone ? 0 : 25;
    // Workload penalty of +2km per active delivery
    const workloadPenalty = agent.activeDeliveries * 2;
    const finalScore = distanceKm + zonePenalty + workloadPenalty;

    return {
      agent,
      distanceKm,
      isSameZone,
      finalScore,
    };
  });

  scoredAgents.sort((a, b) => a.finalScore - b.finalScore);
  const bestMatch = scoredAgents[0];
  const assignedAgent = bestMatch.agent;

  // Update order with assigned agent and new status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      agentId: assignedAgent.id,
      status: "ASSIGNED",
    },
  });

  // Increment agent active deliveries
  await prisma.user.update({
    where: { id: assignedAgent.id },
    data: {
      activeDeliveries: { increment: 1 },
    },
  });

  // Create immutable tracking audit event
  await prisma.trackingEvent.create({
    data: {
      orderId,
      status: "ASSIGNED",
      actorId: actor?.id ?? assignedAgent.id,
      actorRole: actor?.role ?? "ADMIN",
      actorName: actor?.name ?? "Auto-Assignment Engine",
      note: `Auto-assigned to ${assignedAgent.name} (Dist: ${bestMatch.distanceKm}km, Zone: ${assignedAgent.currentZone?.name || "Global"}).`,
      locationLat: assignedAgent.currentLat,
      locationLng: assignedAgent.currentLng,
    },
  });

  // Send notifications to customer & agent
  await sendOrderStatusNotification({
    orderId: order.id,
    trackingNumber: order.trackingNumber,
    recipientEmail: order.customer.email,
    recipientPhone: order.customer.phone,
    status: "ASSIGNED",
    actorName: assignedAgent.name,
    note: `Assigned to delivery agent ${assignedAgent.name}.`,
    charge: order.totalCharge,
  });

  return {
    success: true,
    agentId: assignedAgent.id,
    agentName: assignedAgent.name,
    distanceKm: bestMatch.distanceKm,
    message: `Successfully assigned to ${assignedAgent.name}.`,
  };
}

/**
 * Manually assigns a designated agent to an order.
 */
export async function manuallyAssignAgent(
  orderId: string,
  agentId: string,
  actor: { id: string; name: string; role: string }
) {
  const [order, agent] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true },
    }),
    prisma.user.findUnique({
      where: { id: agentId },
    }),
  ]);

  if (!order) throw new Error("Order not found.");
  if (!agent || agent.role !== "AGENT") throw new Error("Invalid delivery agent specified.");

  // If previous agent was assigned, decrement their load
  if (order.agentId && order.agentId !== agentId) {
    await prisma.user.update({
      where: { id: order.agentId },
      data: {
        activeDeliveries: { decrement: 1 },
      },
    });
  }

  // Update order
  await prisma.order.update({
    where: { id: orderId },
    data: {
      agentId: agent.id,
      status: "ASSIGNED",
    },
  });

  // Increment new agent load if not already holding this order
  if (order.agentId !== agentId) {
    await prisma.user.update({
      where: { id: agent.id },
      data: {
        activeDeliveries: { increment: 1 },
      },
    });
  }

  // Log immutable tracking event
  await prisma.trackingEvent.create({
    data: {
      orderId,
      status: "ASSIGNED",
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      note: `Manually assigned to agent ${agent.name} by ${actor.name} (${actor.role}).`,
    },
  });

  // Notify customer
  await sendOrderStatusNotification({
    orderId: order.id,
    trackingNumber: order.trackingNumber,
    recipientEmail: order.customer.email,
    recipientPhone: order.customer.phone,
    status: "ASSIGNED",
    actorName: agent.name,
    note: `Assigned to delivery agent ${agent.name}.`,
    charge: order.totalCharge,
  });

  return { success: true, message: `Order assigned to ${agent.name}.` };
}
