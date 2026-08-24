"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  Package,
  AlertTriangle,
  Calendar,
  RotateCcw,
  User,
  Shield,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";

interface TrackingTimelineProps {
  order: any;
  onOpenReschedule?: () => void;
  currentUser?: any;
}

const STEPS = [
  { key: "CREATED", label: "Booked", icon: Package },
  { key: "ASSIGNED", label: "Assigned", icon: User },
  { key: "PICKED_UP", label: "Picked Up", icon: Truck },
  { key: "IN_TRANSIT", label: "In Transit", icon: Clock },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({
  order,
  onOpenReschedule,
  currentUser,
}) => {
  if (!order) return null;

  const currentStatus = order.status;
  const isFailed = currentStatus === "FAILED";
  const isRescheduled = currentStatus === "RESCHEDULED";
  const isDelivered = currentStatus === "DELIVERED";

  const getStepIndex = (status: string) => {
    switch (status) {
      case "CREATED":
        return 0;
      case "ASSIGNED":
        return 1;
      case "PICKED_UP":
        return 2;
      case "IN_TRANSIT":
        return 3;
      case "OUT_FOR_DELIVERY":
        return 4;
      case "DELIVERED":
        return 5;
      case "FAILED":
        return 4; // paused at delivery attempt
      case "RESCHEDULED":
        return 1; // queued for delivery re-attempt
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  return (
    <div className="bg-white border border-[#dddddd] rounded-2xl p-5 sm:p-7 shadow-airbnb space-y-6 text-[#222222]">
      {/* Header Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#ebebeb]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#222222] font-bold bg-[#f7f7f7] px-3 py-1 rounded-full border border-[#dddddd]">
              #{order.trackingNumber}
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#f2f2f2] text-[#6a6a6a]">
              {order.orderType}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                order.paymentType === "COD"
                  ? "bg-[#fef7e0] text-[#7a4100] border border-[#feefc3]"
                  : "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]"
              }`}
            >
              {order.paymentType}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-[#222222] mt-2 flex items-center gap-2">
            {order.pickupArea?.name} <span className="text-[#929292]">→</span> {order.dropArea?.name}
          </h2>
          <p className="text-xs text-[#6a6a6a] mt-0.5" suppressHydrationWarning>
            Booked on {order.createdAt ? format(new Date(order.createdAt), "PPP p") : "Recent"}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-[#6a6a6a] font-semibold block">
            Total Charge
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#222222]">
            ${order.totalCharge?.toFixed(2)}
          </span>
          <span className="text-[11px] text-[#6a6a6a] block font-medium mt-0.5">
            Billable Wt: {order.chargeableWeightKg}kg ({order.lengthCm}×{order.widthCm}×{order.heightCm}cm)
          </span>
        </div>
      </div>

      {/* Prominent Failure Alert Banner */}
      {isFailed && (
        <div className="bg-[#fff1f0] border border-[#ffccc7] rounded-2xl p-5 text-[#c13515] animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2 rounded-full bg-[#ffccc7] text-[#c13515] shrink-0">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h4 className="font-bold text-[#c13515] text-sm">Delivery Attempt Failed</h4>
                <p className="text-xs text-[#3f3f3f] mt-0.5">
                  Reason: <strong className="text-[#222222]">{order.trackingEvents?.find((e: any) => e.status === "FAILED")?.failureReason || "Customer unreachable at destination"}</strong>
                </p>
                <p className="text-[11px] text-[#6a6a6a] mt-1">
                  Customer notification dispatched. Reschedule to pick a new preferred date and time slot.
                </p>
              </div>
            </div>

            {onOpenReschedule && (
              <button
                onClick={onOpenReschedule}
                className="px-5 py-2.5 bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95 shrink-0"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reschedule Delivery</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rescheduled Notice Banner */}
      {isRescheduled && (
        <div className="bg-[#f8f0fc] border border-[#e8d5f5] rounded-2xl p-4 text-[#460479] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#e8d5f5] text-[#460479] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#460479] text-xs">Delivery Rescheduled by Customer</h4>
              <p className="text-[11px] text-[#6a6a6a]">
                New delivery date:{" "}
                <strong className="text-[#222222]">
                  {order.scheduledDeliveryDate
                    ? format(new Date(order.scheduledDeliveryDate), "PPP")
                    : "Upcoming"}
                </strong>
                {order.rescheduleRequests?.[0]?.timeSlot && ` (${order.rescheduleRequests[0].timeSlot})`}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-3 py-1 bg-white border border-[#e8d5f5] text-[#460479] rounded-full font-semibold">
            Re-Queued
          </span>
        </div>
      )}

      {/* Visual Stepper Progress Bar */}
      <div className="py-4">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-[#ebebeb] -z-0">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isFailed ? "bg-[#c13515]" : "bg-[#ff385c]"
              }`}
              style={{
                width: `${(activeIndex / (STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          {/* Step Nodes */}
          <div className="relative z-10 flex justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPassed = idx <= activeIndex;
              const isCurrent = idx === activeIndex;

              return (
                <div key={step.key} className="flex flex-col items-center text-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-xs ${
                      isFailed && isCurrent
                        ? "bg-[#c13515] text-white ring-4 ring-[#ffccc7]"
                        : isCurrent
                        ? "bg-[#ff385c] text-white ring-4 ring-[#ffd1da]"
                        : isPassed
                        ? "bg-[#222222] text-white"
                        : "bg-white text-[#929292] border border-[#dddddd]"
                    }`}
                  >
                    <Icon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-2 max-w-[70px] leading-tight ${
                      isCurrent
                        ? isFailed
                          ? "text-[#c13515] font-bold"
                          : "text-[#ff385c] font-bold"
                        : isPassed
                        ? "text-[#222222] font-semibold"
                        : "text-[#929292]"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Assigned Agent & Delivery Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Delivery Route Addresses */}
        <div className="p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-2.5">
          <span className="font-bold text-[#6a6a6a] uppercase tracking-wider text-[10px] block">
            Route Addresses
          </span>
          <div className="space-y-2.5 text-[#3f3f3f]">
            <div>
              <span className="text-[10px] text-[#6a6a6a] font-medium block">Pickup:</span>
              <p className="font-semibold text-[#222222] text-xs">{order.pickupAddress}</p>
              <span className="text-[11px] text-[#6a6a6a]">{order.pickupArea?.name} ({order.pickupZone?.name})</span>
            </div>
            <div className="pt-2 border-t border-[#ebebeb]">
              <span className="text-[10px] text-[#6a6a6a] font-medium block">Drop:</span>
              <p className="font-semibold text-[#222222] text-xs">{order.dropAddress}</p>
              <span className="text-[11px] text-[#6a6a6a]">{order.dropArea?.name} ({order.dropZone?.name})</span>
            </div>
          </div>
        </div>

        {/* Assigned Agent & Customer info */}
        <div className="p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-2.5">
          <span className="font-bold text-[#6a6a6a] uppercase tracking-wider text-[10px] block">
            Personnel & Contact
          </span>
          <div className="space-y-2.5 text-[#3f3f3f]">
            <div>
              <span className="text-[10px] text-[#6a6a6a] font-medium block">Recipient:</span>
              <p className="font-semibold text-[#222222] text-xs">{order.customer?.name}</p>
              <span className="text-[11px] text-[#6a6a6a]">{order.customer?.email} • {order.customer?.phone || "No phone"}</span>
            </div>
            <div className="pt-2 border-t border-[#ebebeb]">
              <span className="text-[10px] text-[#6a6a6a] font-medium block">Assigned Rider:</span>
              {order.agent ? (
                <div>
                  <p className="font-semibold text-[#137333] flex items-center gap-1.5 text-xs">
                    <Truck className="w-3.5 h-3.5" />
                    {order.agent.name}
                  </p>
                  <span className="text-[11px] text-[#6a6a6a]">{order.agent.phone || "Active on delivery route"}</span>
                </div>
              ) : (
                <p className="text-[#b32505] italic font-medium">Unassigned (Pending Auto-Assignment)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Tracking History Event Log */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#222222] text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#222222]" />
            Audit Milestones ({order.trackingEvents?.length || 0} events)
          </span>
        </div>

        <div className="space-y-2">
          {order.trackingEvents?.map((event: any, index: number) => {
            const isEventFailed = event.status === "FAILED";
            return (
              <div
                key={event.id || index}
                className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition ${
                  isEventFailed
                    ? "bg-[#fff1f0] border-[#ffccc7] text-[#c13515]"
                    : "bg-white border-[#ebebeb] text-[#222222] hover:border-[#dddddd] shadow-xs"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isEventFailed
                          ? "bg-[#c13515] text-white"
                          : event.status === "DELIVERED"
                          ? "bg-[#137333] text-white"
                          : "bg-[#222222] text-white"
                      }`}
                    >
                      {event.status}
                    </span>
                    <span className="font-semibold text-[#222222]">{event.actorName || "System"}</span>
                    {event.actorRole && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#f2f2f2] text-[#6a6a6a] font-medium">
                        {event.actorRole}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#3f3f3f] mt-1">{event.note || "Status updated."}</p>

                  {event.failureReason && (
                    <p className="text-xs font-semibold text-[#c13515]">
                      Failure Detail: {event.failureReason}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-[#929292] block font-mono" suppressHydrationWarning>
                    {event.timestamp ? format(new Date(event.timestamp), "MMM dd, HH:mm:ss") : ""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
