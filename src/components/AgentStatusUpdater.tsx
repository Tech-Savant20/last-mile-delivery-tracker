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
    <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 text-xs space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
          <Truck className="w-4 h-4 text-emerald-400" />
          Delivery Agent Action Bar
        </span>
        <span className="text-[11px] text-slate-400 font-mono">Current: <strong className="text-white">{status}</strong></span>
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-red-300 text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Action Buttons based on status */}
      <div className="flex flex-wrap items-center gap-2">
        {status === "ASSIGNED" && (
          <button
            onClick={() => handleUpdateStatus("PICKED_UP", "Package collected from sender by delivery agent.")}
            disabled={loading}
            className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>Confirm Pickup</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {status === "PICKED_UP" && (
          <button
            onClick={() => handleUpdateStatus("IN_TRANSIT", "Shipment departed pickup hub and is moving towards destination.")}
            disabled={loading}
            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>Move to In Transit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {(status === "IN_TRANSIT" || status === "RESCHEDULED") && (
          <button
            onClick={() => handleUpdateStatus("OUT_FOR_DELIVERY", "Package is on delivery vehicle with agent for final-mile drop.")}
            disabled={loading}
            className="flex-1 py-2 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
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
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Delivered</span>
            </button>

            <button
              onClick={() => setShowFailureModal(true)}
              disabled={loading}
              className="py-2 px-3 bg-red-600/80 hover:bg-red-600 text-white font-bold rounded-lg transition shadow flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Report Failed Attempt</span>
            </button>
          </>
        )}

        {status === "DELIVERED" && (
          <span className="text-emerald-400 font-semibold flex items-center gap-1.5 py-1">
            <CheckCircle2 className="w-4 h-4" />
            Delivery completed & confirmed.
          </span>
        )}

        {status === "FAILED" && (
          <span className="text-red-400 font-semibold py-1">
            Delivery marked as failed. Waiting for customer rescheduling.
          </span>
        )}
      </div>

      {/* Failure Report Modal */}
      {showFailureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-5 text-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold">
                <AlertOctagon className="w-5 h-5" />
                <span>Report Failed Delivery Attempt</span>
              </div>
              <button
                onClick={() => setShowFailureModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Reason for Failure:
                </label>
                <select
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
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
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Agent Operational Notes:
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Ringed door bell twice, dialed phone 3 times. Nobody answered."
                  value={failureNote}
                  onChange={(e) => setFailureNote(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowFailureModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
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
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-600/30"
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
