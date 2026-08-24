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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Reschedule Delivery</h3>
              <p className="text-xs text-slate-400 font-mono">Order #{order.trackingNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-300">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-[11px]">
            <span>Previous Attempt Status: <strong>Delivery Failed</strong></span>
            <p className="mt-0.5 opacity-90">Please pick a new date when someone will be present at {order.dropAddress}.</p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Select New Delivery Date:
            </label>
            <input
              type="date"
              min={tomorrowStr}
              value={rescheduledDate}
              onChange={(e) => setRescheduledDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Preferred Time Slot:
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-purple-500"
            >
              <option value="Morning (09:00 - 12:00)">Morning (09:00 AM - 12:00 PM)</option>
              <option value="Afternoon (12:00 - 16:00)">Afternoon (12:00 PM - 04:00 PM)</option>
              <option value="Evening (16:00 - 20:00)">Evening (04:00 PM - 08:00 PM)</option>
              <option value="Flexible (All Day 09:00 - 19:00)">Flexible (All Day 09:00 AM - 07:00 PM)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Delivery Notes / Gate Code / Directions (Optional):
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please leave with security guard, or call upon arrival."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {submitting ? "Rescheduling & Reassigning..." : "Confirm Reschedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
