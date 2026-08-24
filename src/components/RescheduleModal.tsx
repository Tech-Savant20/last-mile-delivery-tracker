"use client";

import React, { useState } from "react";
import { X, Calendar, Clock, RotateCcw, AlertCircle, CheckCircle } from "lucide-react";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onRescheduled: (result: any) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  order,
  onRescheduled,
}) => {
  // Default tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [rescheduledDate, setRescheduledDate] = useState<string>(tomorrowStr);
  const [timeSlot, setTimeSlot] = useState<string>("Morning (09:00 - 12:00)");
  const [customerNotes, setCustomerNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduledDate) {
      setError("Please select a valid delivery date.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${order.id}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rescheduledDate,
          timeSlot,
          customerNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to reschedule delivery");
      }

      onRescheduled(data);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to reschedule order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dddddd] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#f7f7f7]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f8f0fc] text-[#460479] border border-[#e8d5f5] flex items-center justify-center">
              <RotateCcw className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">Reschedule Delivery</h3>
              <p className="text-xs text-[#6a6a6a] font-mono">Shipment #{order.trackingNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6a6a6a] hover:text-[#222222] hover:bg-[#ebebeb] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-[#222222]">
          <div className="p-3.5 bg-[#fff1f0] border border-[#ffccc7] rounded-xl text-[#c13515] text-xs">
            <span className="font-semibold block">Previous Attempt Unsuccessful</span>
            <p className="mt-0.5 text-[11px] text-[#3f3f3f]">
              Pick a new preferred delivery date and time slot when someone will be present at {order.dropAddress}.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#222222] mb-1.5">
              Select Preferred Delivery Date:
            </label>
            <input
              type="date"
              min={tomorrowStr}
              value={rescheduledDate}
              onChange={(e) => setRescheduledDate(e.target.value)}
              className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] text-xs focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#222222] mb-1.5">
              Preferred Delivery Time Window:
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] text-xs focus:outline-none"
            >
              <option value="Morning (09:00 - 12:00)">Morning (09:00 AM - 12:00 PM)</option>
              <option value="Afternoon (12:00 - 16:00)">Afternoon (12:00 PM - 04:00 PM)</option>
              <option value="Evening (16:00 - 20:00)">Evening (04:00 PM - 08:00 PM)</option>
              <option value="Flexible (All Day 09:00 - 19:00)">Flexible (All Day 09:00 AM - 07:00 PM)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#222222] mb-1.5">
              Special Instructions / Landmark Notes (Optional):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Leave with building reception, call upon arrival."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl p-3 text-[#222222] text-xs focus:outline-none placeholder-[#929292]"
            />
          </div>

          {error && (
            <div className="p-3 bg-[#fff1f0] border border-[#ffccc7] rounded-xl text-[#c13515] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-4 border-t border-[#ebebeb] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-[#dddddd] hover:border-[#222222] text-[#222222] text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Rescheduling & Assigning..." : "Confirm Reschedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
