import { prisma } from "../prisma";
import { OrderStatus } from "../types";

export interface NotificationPayload {
  orderId: string;
  trackingNumber: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  status: OrderStatus;
  actorName?: string;
  note?: string;
  failureReason?: string;
  rescheduledDate?: string;
  timeSlot?: string;
  charge?: number;
}

export async function sendOrderStatusNotification(payload: NotificationPayload) {
  const {
    orderId,
    trackingNumber,
    recipientEmail,
    recipientPhone,
    status,
    note,
    failureReason,
    rescheduledDate,
    timeSlot,
  } = payload;

  let emailSubject = `Order #${trackingNumber} Update: ${status}`;
  let emailContent = "";
  let smsContent = "";

  switch (status) {
    case "CREATED":
      emailSubject = `Order #${trackingNumber} Confirmed!`;
      emailContent = `Hello! Your order #${trackingNumber} has been created and will be assigned to a delivery agent shortly. Total Charge: $${payload.charge || 0}.`;
      smsContent = `Order #${trackingNumber} confirmed! Track your shipment anytime in the portal.`;
      break;

    case "ASSIGNED":
      emailSubject = `Agent Assigned for Order #${trackingNumber}`;
      emailContent = `A delivery agent has been assigned to your order #${trackingNumber} and is heading to the pickup location.`;
      smsContent = `Agent assigned to order #${trackingNumber}. Pickup in progress.`;
      break;

    case "PICKED_UP":
      emailSubject = `Order #${trackingNumber} Picked Up`;
      emailContent = `Your package #${trackingNumber} has been picked up from the sender and is moving towards the distribution hub.`;
      smsContent = `Package #${trackingNumber} picked up successfully!`;
      break;

    case "IN_TRANSIT":
      emailSubject = `Order #${trackingNumber} In Transit`;
      emailContent = `Your order #${trackingNumber} is in transit between hubs. Note: ${note || "Moving according to schedule."}`;
      smsContent = `Order #${trackingNumber} is currently in transit.`;
      break;

    case "OUT_FOR_DELIVERY":
      emailSubject = `Out for Delivery: Order #${trackingNumber}`;
      emailContent = `Great news! Your order #${trackingNumber} is out for delivery today. Please ensure someone is available at the drop address.`;
      smsContent = `Out for delivery: Your package #${trackingNumber} will arrive today!`;
      break;

    case "DELIVERED":
      emailSubject = `Delivered: Order #${trackingNumber}`;
      emailContent = `Your package #${trackingNumber} has been successfully delivered! Thank you for choosing our delivery service.`;
      smsContent = `Delivered! Order #${trackingNumber} has been delivered successfully.`;
      break;

    case "FAILED":
      emailSubject = `Delivery Attempt Failed: Order #${trackingNumber}`;
      emailContent = `We attempted to deliver your order #${trackingNumber}, but the attempt was unsuccessful. Reason: "${failureReason || note || "Customer unavailable"}". You can reschedule delivery for a preferred date by visiting your tracking page.`;
      smsContent = `Delivery attempt failed for #${trackingNumber} (${failureReason || "Unavailable"}). Please visit your tracking link to reschedule.`;
      break;

    case "RESCHEDULED":
      emailSubject = `Order #${trackingNumber} Rescheduled`;
      emailContent = `Your order #${trackingNumber} has been rescheduled for ${rescheduledDate || "upcoming date"}${timeSlot ? ` (${timeSlot})` : ""}. A delivery agent will re-attempt delivery.`;
      smsContent = `Reschedule confirmed: Order #${trackingNumber} will be delivered on ${rescheduledDate || "selected date"}.`;
      break;

    default:
      emailContent = `Your order #${trackingNumber} status changed to ${status}.`;
      smsContent = `Order #${trackingNumber} status: ${status}.`;
  }

  // Create Email Notification Log
  if (recipientEmail) {
    await prisma.notificationLog.create({
      data: {
        orderId,
        recipientEmail,
        recipientPhone,
        channel: "EMAIL",
        subject: emailSubject,
        content: emailContent,
        status: "SENT",
        metadata: JSON.stringify({ status, trackingNumber, failureReason }),
      },
    });
  }

  // Create SMS Notification Log
  if (recipientPhone) {
    await prisma.notificationLog.create({
      data: {
        orderId,
        recipientEmail,
        recipientPhone,
        channel: "SMS",
        subject: `SMS Update`,
        content: smsContent,
        status: "DELIVERED",
        metadata: JSON.stringify({ status, trackingNumber }),
      },
    });
  }
}
