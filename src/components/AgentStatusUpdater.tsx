"use client";

import React, { useState } from "react";
import { Truck, CheckCircle2, AlertOctagon, ArrowRight, X, AlertCircle } from "lucide-react";
import { OrderStatus } from "@/lib/types";

interface AgentStatusUpdaterProps {
  order: any;
  onStatusUpdated: () => void;
  currentUser?: any;
}

export const AgentStatusUpdater: React.FC<AgentStatusUpdaterProps> = ({
  order,
  onStatusUpdated,
  currentUser,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [showFailureModal, setShowFailureModal] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string>("Customer unavailable / Phone unanswered");
  const [failureNote, setFailureNote] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const status = order.status as OrderStatus;

  const handleUpdateStatus = async (newStatus: OrderStatus, customNote?: string, failureR?: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus,
          note: customNote,
          failureReason: failureR,
          actorOverride: currentUser
            ? {
                id: currentUser.id,
                name: currentUser.name,
                role: currentUser.role,
              }
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update order status");
      }

      setShowFailureModal(false);
      onStatusUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f7f7f7] border border-[#dddddd] rounded-2xl p-4 sm:p-5 text-xs space-y-3 shadow-sm text-[#222222]">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[#222222] flex items-center gap-2 uppercase tracking-wider text-[11px]">
          <Truck className="w-4 h-4 text-[#ff385c]" />
          Field Rider Action Hub
        </span>
        <span className="text-[11px] text-[#6a6a6a]">
          Current Status: <strong className="text-[#222222] font-semibold">{status}</strong>
        </span>
      </div>

      {error && (
        <div className="p-3 bg-[#fff1f0] border border-[#ffccc7] rounded-xl text-[#c13515] text-[11px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Action Buttons based on status */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {status === "ASSIGNED" && (
          <button
            onClick={() => handleUpdateStatus("PICKED_UP", "Package collected from sender by delivery agent.")}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-[#222222] hover:bg-black text-white font-semibold rounded-full transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <span>Confirm Pickup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {status === "PICKED_UP" && (
          <button
            onClick={() => handleUpdateStatus("IN_TRANSIT", "Shipment departed pickup hub and is moving towards destination.")}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-[#222222] hover:bg-black text-white font-semibold rounded-full transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <span>Move to In Transit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {(status === "IN_TRANSIT" || status === "RESCHEDULED") && (
          <button
            onClick={() => handleUpdateStatus("OUT_FOR_DELIVERY", "Package is on delivery vehicle with agent for final-mile drop.")}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-[#222222] hover:bg-black text-white font-semibold rounded-full transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
          >
            <span>Mark Out for Delivery</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {status === "OUT_FOR_DELIVERY" && (
          <>
            <button
              onClick={() => handleUpdateStatus("DELIVERED", "Package handed over to recipient successfully.")}
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-[#137333] hover:bg-[#0d5924] text-white font-semibold rounded-full transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Delivered</span>
            </button>

            <button
              onClick={() => setShowFailureModal(true)}
              disabled={loading}
              className="py-2.5 px-4 bg-white hover:bg-[#fff1f0] text-[#c13515] border border-[#ffccc7] font-semibold rounded-full transition flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Report Failed Attempt</span>
            </button>
          </>
        )}

        {status === "DELIVERED" && (
          <div className="w-full bg-[#e6f4ea] border border-[#ceead6] rounded-xl p-3 text-[#137333] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Delivery completed & confirmed by recipient.</span>
          </div>
        )}

        {status === "FAILED" && (
          <div className="w-full bg-[#fff1f0] border border-[#ffccc7] rounded-xl p-3 text-[#c13515] font-semibold">
            Delivery marked as failed. Waiting for customer rescheduling.
          </div>
        )}
      </div>

      {/* Failure Report Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#dddddd] rounded-2xl w-full max-w-md p-6 text-[#222222] space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ebebeb] pb-4">
              <div className="flex items-center gap-2.5 text-[#c13515] font-bold">
                <AlertOctagon className="w-5 h-5" />
                <span className="text-base text-[#222222]">Report Delivery Attempt Failure</span>
              </div>
              <button
                onClick={() => setShowFailureModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                  Reason for Delivery Failure:
                </label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] text-xs focus:outline-none"
                >
                  <option value="Customer unavailable / Phone unanswered">Customer unavailable / Phone unanswered</option>
                  <option value="Premises / Gate locked">Premises / Gate locked</option>
                  <option value="Customer requested later delivery date">Customer requested later delivery date</option>
                  <option value="Incorrect or incomplete address">Incorrect or incomplete address</option>
                  <option value="COD cash payment not ready">COD cash payment not ready</option>
                  <option value="Customer refused package">Customer refused package</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                  Agent Operational Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Ringed door bell twice, dialed phone 3 times. Nobody answered."
                  value={failureNote}
                  onChange={(e) => setFailureNote(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl p-3 text-[#222222] text-xs focus:outline-none placeholder-[#929292]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#ebebeb]">
              <button
                onClick={() => setShowFailureModal(false)}
                className="px-4 py-2.5 rounded-full border border-[#dddddd] hover:border-[#222222] text-[#222222] text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleUpdateStatus(
                    "FAILED",
                    failureNote || `Delivery attempt failed: ${failureReason}`,
                    failureReason
                  )
                }
                disabled={loading}
                className="px-5 py-2.5 bg-[#c13515] hover:bg-[#b32505] text-white rounded-full text-xs font-bold shadow-sm transition active:scale-95"
              >
                {loading ? "Recording..." : "Confirm Failed Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
