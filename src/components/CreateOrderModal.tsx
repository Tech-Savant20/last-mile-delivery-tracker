"use client";

import React, { useState, useEffect } from "react";
import { X, PlusCircle, Sparkles, Truck, Check, AlertCircle } from "lucide-react";
import { PriceBreakdownCard } from "./PriceBreakdownCard";
import { RateCalculationBreakdown } from "@/lib/types";

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: (newOrder: any) => void;
  areas: any[];
  currentUser: any;
  agents?: any[];
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  areas,
  currentUser,
  agents = [],
}) => {
  const [pickupAddress, setPickupAddress] = useState("Shop 101, Main Avenue");
  const [pickupAreaId, setPickupAreaId] = useState<string>("");
  const [dropAddress, setDropAddress] = useState("Tower 4, Suite 800, Business District");
  const [dropAreaId, setDropAreaId] = useState<string>("");

  const [lengthCm, setLengthCm] = useState<number>(30);
  const [widthCm, setWidthCm] = useState<number>(20);
  const [heightCm, setHeightCm] = useState<number>(15);
  const [actualWeightKg, setActualWeightKg] = useState<number>(1.5);
  const [orderType, setOrderType] = useState<"B2C" | "B2B">("B2C");
  const [paymentType, setPaymentType] = useState<"PREPAID" | "COD">("PREPAID");
  const [declaredValue, setDeclaredValue] = useState<number>(100);
  const [autoAssign, setAutoAssign] = useState<boolean>(true);

  const [breakdown, setBreakdown] = useState<RateCalculationBreakdown | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set default areas
  useEffect(() => {
    if (areas && areas.length >= 2 && !pickupAreaId) {
      setPickupAreaId(areas[0].id);
      setDropAreaId(areas[1].id);
    }
  }, [areas, pickupAreaId]);

  // Live recalculation
  useEffect(() => {
    if (!pickupAreaId || !dropAreaId || !isOpen) return;

    let isMounted = true;
    const fetchCalc = async () => {
      setCalculating(true);
      setError(null);
      try {
        const res = await fetch("/api/rates/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickupAreaId,
            dropAreaId,
            lengthCm: Number(lengthCm),
            widthCm: Number(widthCm),
            heightCm: Number(heightCm),
            actualWeightKg: Number(actualWeightKg),
            orderType,
            paymentType,
            declaredValue: Number(declaredValue),
          }),
        });

        const data = await res.json();
        if (isMounted) {
          if (res.ok && data.breakdown) {
            setBreakdown(data.breakdown);
          } else {
            setError(data.error || "Rate calculation failed");
          }
        }
      } catch (err: any) {
        if (isMounted) setError("Network error during calculation");
      } finally {
        if (isMounted) setCalculating(false);
      }
    };

    const timer = setTimeout(fetchCalc, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [
    pickupAreaId,
    dropAreaId,
    lengthCm,
    widthCm,
    heightCm,
    actualWeightKg,
    orderType,
    paymentType,
    declaredValue,
    isOpen,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupAddress || !dropAddress || !pickupAreaId || !dropAreaId) {
      setError("Please fill out complete pickup and drop addresses.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupAddress,
          pickupAreaId,
          dropAddress,
          dropAreaId,
          lengthCm: Number(lengthCm),
          widthCm: Number(widthCm),
          heightCm: Number(heightCm),
          actualWeightKg: Number(actualWeightKg),
          orderType,
          paymentType,
          declaredValue: Number(declaredValue),
          autoAssign,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create order");
      }

      onOrderCreated(data.order);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Create New Shipment Order</h3>
              <p className="text-xs text-slate-400">
                Auto-calculated pricing based on dimensions, weight, zones & COD surcharge.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Order Inputs */}
            <div className="lg:col-span-7 space-y-4 text-xs text-slate-300">
              {/* Pickup Info */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-400 uppercase tracking-wider text-[10px]">
                    ?? Pickup Location
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Street Address, Building, Floor"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 text-xs"
                  required
                />
                <select
                  value={pickupAreaId}
                  onChange={(e) => setPickupAreaId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                  required
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.pincode}) � Zone: {a.zone?.name || "Zone"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drop Info */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px]">
                    ?? Delivery Destination
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Destination Address, Apt / Suite / Landmark"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 text-xs"
                  required
                />
                <select
                  value={dropAreaId}
                  onChange={(e) => setDropAreaId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs"
                  required
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.pincode}) � Zone: {a.zone?.name || "Zone"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Specs */}
              <div className="p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
                <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                  ?? Package Specifications
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Length (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Width (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={widthCm}
                      onChange={(e) => setWidthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Height (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Actual Wt (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={actualWeightKg}
                      onChange={(e) => setActualWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs font-semibold text-cyan-300"
                    />
                  </div>
                </div>
              </div>

              {/* Order Classification & Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Order Class:</label>
                  <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setOrderType("B2C")}
                      className={`flex-1 py-1 text-center rounded text-xs font-medium transition ${
                        orderType === "B2C" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      B2C Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("B2B")}
                      className={`flex-1 py-1 text-center rounded text-xs font-medium transition ${
                        orderType === "B2B" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      B2B Commercial
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Payment Method:</label>
                  <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setPaymentType("PREPAID")}
                      className={`flex-1 py-1 text-center rounded text-xs font-medium transition ${
                        paymentType === "PREPAID" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Prepaid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType("COD")}
                      className={`flex-1 py-1 text-center rounded text-xs font-medium transition ${
                        paymentType === "COD" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      COD
                    </button>
                  </div>
                </div>
              </div>

              {/* Declared Value & Auto-Assignment Option */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Declared Value ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoAssign}
                      onChange={(e) => setAutoAssign(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-600 bg-slate-800 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Auto-assign nearest agent
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right Col: Dynamic Price Breakdown Quote */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block mb-2">
                  Live Quotation Preview
                </span>
                <PriceBreakdownCard breakdown={breakdown} loading={calculating} />
              </div>

              <div className="p-3.5 bg-slate-800/30 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">? Dispatch Guarantee:</span>
                <p>Calculated charges are locked on confirmation. Live tracking and status notifications are initialized automatically.</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || calculating}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/30 transition transform active:scale-95 disabled:opacity-50"
            >
              {submitting ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Confirm & Place Order (${breakdown?.totalCharge?.toFixed(2) || "0.00"})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
