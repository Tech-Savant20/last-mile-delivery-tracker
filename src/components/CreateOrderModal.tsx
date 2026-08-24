"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, PlusCircle, Sparkles, Truck, Check, AlertCircle } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dddddd] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#f7f7f7]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffd1da] text-[#ff385c] flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">Create New Shipment Order</h3>
              <p className="text-xs text-[#6a6a6a]">
                Auto-calculated rates based on package volume, scale weight, and zone routing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6a6a6a] hover:text-[#222222] hover:bg-[#ebebeb] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 text-[#222222]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Order Inputs */}
            <div className="lg:col-span-7 space-y-4 text-xs">
              {/* Pickup Info */}
              <div className="p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-2.5">
                <span className="font-bold text-[#222222] uppercase tracking-wider text-[10px] block">
                  📍 Pickup Location (Sender)
                </span>
                <input
                  type="text"
                  placeholder="Street Address, Building, Floor"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] placeholder-[#929292] text-xs focus:outline-none"
                  required
                />
                <select
                  value={pickupAreaId}
                  onChange={(e) => setPickupAreaId(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] text-xs focus:outline-none"
                  required
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.pincode}) — Zone: {a.zone?.name || "Zone"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Drop Info */}
              <div className="p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-2.5">
                <span className="font-bold text-[#222222] uppercase tracking-wider text-[10px] block">
                  🎯 Delivery Destination (Recipient)
                </span>
                <input
                  type="text"
                  placeholder="Destination Address, Apt / Suite / Landmark"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] placeholder-[#929292] text-xs focus:outline-none"
                  required
                />
                <select
                  value={dropAreaId}
                  onChange={(e) => setDropAreaId(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] text-xs focus:outline-none"
                  required
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.pincode}) — Zone: {a.zone?.name || "Zone"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Specs */}
              <div className="p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-3">
                <span className="font-bold text-[#222222] uppercase tracking-wider text-[10px] block">
                  📦 Package Dimensions & Weight
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Length (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Width (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={widthCm}
                      onChange={(e) => setWidthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      min="1"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Actual Wt (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={actualWeightKg}
                      onChange={(e) => setActualWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                      className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Order Classification & Payment */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">Service Classification:</label>
                  <div className="flex rounded-full bg-[#ebebeb] p-1">
                    <button
                      type="button"
                      onClick={() => setOrderType("B2C")}
                      className={`flex-1 py-1.5 text-center rounded-full text-xs font-semibold transition ${
                        orderType === "B2C" ? "bg-[#222222] text-white shadow-xs" : "text-[#6a6a6a] hover:text-[#222222]"
                      }`}
                    >
                      B2C Retail
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderType("B2B")}
                      className={`flex-1 py-1.5 text-center rounded-full text-xs font-semibold transition ${
                        orderType === "B2B" ? "bg-[#222222] text-white shadow-xs" : "text-[#6a6a6a] hover:text-[#222222]"
                      }`}
                    >
                      B2B Freight
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">Payment Method:</label>
                  <div className="flex rounded-full bg-[#ebebeb] p-1">
                    <button
                      type="button"
                      onClick={() => setPaymentType("PREPAID")}
                      className={`flex-1 py-1.5 text-center rounded-full text-xs font-semibold transition ${
                        paymentType === "PREPAID" ? "bg-[#222222] text-white shadow-xs" : "text-[#6a6a6a] hover:text-[#222222]"
                      }`}
                    >
                      Prepaid
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType("COD")}
                      className={`flex-1 py-1.5 text-center rounded-full text-xs font-semibold transition ${
                        paymentType === "COD" ? "bg-[#ff385c] text-white shadow-xs" : "text-[#6a6a6a] hover:text-[#222222]"
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
                  <label className="block text-xs font-semibold text-[#222222] mb-1.5">Declared Value ($):</label>
                  <input
                    type="number"
                    min="0"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2 text-[#222222] text-xs focus:outline-none"
                  />
                </div>

                <div className="pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoAssign}
                      onChange={(e) => setAutoAssign(e.target.checked)}
                      className="w-4 h-4 rounded border-[#dddddd] text-[#ff385c] focus:ring-[#ff385c]"
                    />
                    <span className="text-xs font-semibold text-[#222222] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#ff385c]" />
                      Auto-assign nearest rider
                    </span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#fff1f0] border border-[#ffccc7] rounded-xl text-[#c13515] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Right Col: Dynamic Price Breakdown Quote */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div>
                <span className="font-bold text-[#6a6a6a] uppercase tracking-wider text-[10px] block mb-2">
                  Live Quotation Preview
                </span>
                <PriceBreakdownCard breakdown={breakdown} loading={calculating} />
              </div>

              <div className="p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] text-xs text-[#6a6a6a] space-y-1">
                <span className="font-bold text-[#222222] block">✨ Dispatch Guarantee:</span>
                <p>Calculated charges are locked upon placement. Real-time timeline tracking and automated customer notifications are initialized instantly.</p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-6 pt-4 border-t border-[#ebebeb] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full border border-[#dddddd] hover:border-[#222222] text-[#222222] text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting || calculating}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full text-xs font-bold shadow-sm transition active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? (
                <span>Confirming Order...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
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
