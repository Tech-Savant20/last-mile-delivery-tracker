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
  DollarSign,
  Phone,
} from "lucide-react";
import { format } from "date-fns";

interface TrackingTimelineProps {
  order: any;
  onOpenReschedule?: () => void;
  currentUser?: any;
}

const STEPS = [
  { key: "CREATED", label: "Created", icon: Package },
  { key: "ASSIGNED", label: "Agent Assigned", icon: User },
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
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 text-slate-200">
      {/* Header Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/60">
              #{order.trackingNumber}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              {order.orderType}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                order.paymentType === "COD"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {order.paymentType}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            {order.pickupArea?.name} <span className="text-slate-500">?</span> {order.dropArea?.name}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5" suppressHydrationWarning>
            Booked on {order.createdAt ? format(new Date(order.createdAt), "PPP p") : "Recent"}
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs uppercase text-slate-400 font-semibold block">Total Charge</span>
          <span className="text-2xl font-black text-white">${order.totalCharge?.toFixed(2)}</span>
          <span className="text-[11px] text-slate-400 block font-mono">
            Wt: {order.chargeableWeightKg}kg ({order.lengthCm}�{order.widthCm}�{order.heightCm}cm)
          </span>
        </div>
      </div>

      {/* Prominent Failure Alert Banner */}
      {isFailed && (
        <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 sm:p-5 text-red-200 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Delivery Attempt Failed</h4>
                <p className="text-xs text-red-300 mt-0.5">
                  Reason: <strong className="text-white">{order.trackingEvents?.find((e: any) => e.status === "FAILED")?.failureReason || "Customer unreachable at address"}</strong>
                </p>
                <p className="text-[11px] text-red-400 mt-1">
                  Customer notification sent. You can select a new convenient date and time slot to reattempt delivery.
                </p>
              </div>
            </div>

            {onOpenReschedule && (
              <button
                onClick={onOpenReschedule}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition transform active:scale-95 shrink-0"
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
        <div className="bg-purple-500/10 border border-purple-500/40 rounded-xl p-4 text-purple-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-xs">Delivery Rescheduled</h4>
              <p className="text-[11px] text-purple-300">
                New delivery date:{" "}
                <strong className="text-white">
                  {order.scheduledDeliveryDate
                    ? format(new Date(order.scheduledDeliveryDate), "PPP")
                    : "Upcoming"}
                </strong>
                {order.rescheduleRequests?.[0]?.timeSlot && ` (${order.rescheduleRequests[0].timeSlot})`}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 bg-purple-900/60 border border-purple-700 text-purple-200 rounded-full font-mono font-semibold">
            Reassigned
          </span>
        </div>
      )}

      {/* Visual Stepper Progress Bar */}
      <div className="py-3">
        <div className="relative">
          {/* Progress Line */}
          <div className="absolute top-4 left-4 right-4 h-1 bg-slate-800 -z-0">
            <div
              className={`h-full transition-all duration-500 ${
                isFailed ? "bg-red-500" : "bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"
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
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                      isFailed && isCurrent
                        ? "bg-red-600 text-white ring-4 ring-red-900/60"
                        : isPassed
                        ? "bg-blue-600 text-white ring-4 ring-blue-900/40"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-2 max-w-[70px] leading-tight ${
                      isCurrent
                        ? isFailed
                          ? "text-red-400 font-bold"
                          : "text-blue-400 font-bold"
                        : isPassed
                        ? "text-slate-200"
                        : "text-slate-500"
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
        <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
            Route Addresses
          </span>
          <div className="space-y-2 text-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 block">Pickup:</span>
              <p className="font-medium text-white">{order.pickupAddress}</p>
              <span className="text-[10px] text-cyan-400">{order.pickupArea?.name} ({order.pickupZone?.name})</span>
            </div>
            <div className="pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 block">Drop:</span>
              <p className="font-medium text-white">{order.dropAddress}</p>
              <span className="text-[10px] text-indigo-400">{order.dropArea?.name} ({order.dropZone?.name})</span>
            </div>
          </div>
        </div>

        {/* Assigned Agent & Customer info */}
        <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
            Personnel & Contact
          </span>
          <div className="space-y-2 text-slate-300">
            <div>
              <span className="text-[10px] text-slate-500 block">Customer:</span>
              <p className="font-medium text-white">{order.customer?.name}</p>
              <span className="text-[10px] text-slate-400">{order.customer?.email} | {order.customer?.phone || "No phone"}</span>
            </div>
            <div className="pt-1 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 block">Assigned Delivery Agent:</span>
              {order.agent ? (
                <div>
                  <p className="font-medium text-emerald-400 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    {order.agent.name}
                  </p>
                  <span className="text-[10px] text-slate-400">{order.agent.phone || "Agent connected"}</span>
                </div>
              ) : (
                <p className="text-amber-400 italic">Unassigned (Queued for dispatcher)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Immutable Tracking History Event Log */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Immutable Audit Trail ({order.trackingEvents?.length || 0} events)
          </span>
        </div>

        <div className="space-y-2.5">
          {order.trackingEvents?.map((event: any, index: number) => {
            const isEventFailed = event.status === "FAILED";
            return (
              <div
                key={event.id || index}
                className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                  isEventFailed
                    ? "bg-red-500/10 border-red-500/30 text-red-200"
                    : "bg-slate-800/50 border-slate-700/60 text-slate-300"
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        isEventFailed
                          ? "bg-red-600 text-white"
                          : event.status === "DELIVERED"
                          ? "bg-emerald-600 text-white"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {event.status}
                    </span>
                    <span className="font-semibold text-white">{event.actorName || "System"}</span>
                    {event.actorRole && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-700 text-slate-300 font-mono">
                        {event.actorRole}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 mt-1">{event.note || "Status updated."}</p>

                  {event.failureReason && (
                    <p className="text-xs font-semibold text-red-300">
                      Failure Reason: {event.failureReason}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block font-mono" suppressHydrationWarning>
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
