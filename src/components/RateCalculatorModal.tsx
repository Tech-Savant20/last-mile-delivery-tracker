"use client";

import React, { useState, useEffect } from "react";
import { X, Calculator, ArrowRight, PackageCheck } from "lucide-react";
import { PriceBreakdownCard } from "./PriceBreakdownCard";
import { RateCalculationBreakdown } from "@/lib/types";

interface RateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: any[];
}

export const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({
  isOpen,
  onClose,
  areas,
}) => {
  const [pickupAreaId, setPickupAreaId] = useState<string>("");
  const [dropAreaId, setDropAreaId] = useState<string>("");
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [widthCm, setWidthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(10);
  const [actualWeightKg, setActualWeightKg] = useState<number>(1.0);
  const [orderType, setOrderType] = useState<"B2C" | "B2B">("B2C");
  const [paymentType, setPaymentType] = useState<"PREPAID" | "COD">("PREPAID");
  const [declaredValue, setDeclaredValue] = useState<number>(50);

  const [breakdown, setBreakdown] = useState<RateCalculationBreakdown | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial default areas if available
  useEffect(() => {
    if (areas && areas.length >= 2 && !pickupAreaId) {
      setPickupAreaId(areas[0].id);
      setDropAreaId(areas[1].id);
    }
  }, [areas, pickupAreaId]);

  // Recalculate on any input change
  useEffect(() => {
    if (!pickupAreaId || !dropAreaId || !isOpen) return;

    let isMounted = true;
    const fetchCalculation = async () => {
      setLoading(true);
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
            setError(data.error || "Failed to calculate quote");
          }
        }
      } catch (err: any) {
        if (isMounted) setError("Network error calculating rate");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchCalculation, 150);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dddddd] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#f7f7f7]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] flex items-center justify-center">
              <Calculator className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">Dynamic Rate Engine Calculator</h3>
              <p className="text-xs text-[#6a6a6a]">
                Standard Formula: max(Actual Weight, L×W×H / 5000) × Zone Rate Card + COD Surcharges.
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-[#222222]">
          {/* Controls Form */}
          <div className="space-y-4 text-xs">
            {/* Origin & Destination */}
            <div className="space-y-3 p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb]">
              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                  Pickup Area (Origin):
                </label>
                <select
                  value={pickupAreaId}
                  onChange={(e) => setPickupAreaId(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] text-xs focus:outline-none"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.pincode}) — [{a.zone?.name || "Zone"}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                  Drop Area (Destination):
                </label>
                <select
                  value={dropAreaId}
                  onChange={(e) => setDropAreaId(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2.5 text-[#222222] text-xs focus:outline-none"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.pincode}) — [{a.zone?.name || "Zone"}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Type & Payment Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1.5">Order Type:</label>
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

            {/* Dimensions (L x W x H) */}
            <div className="p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-2">
              <label className="block text-xs font-semibold text-[#222222]">
                Package Dimensions (cm):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Length:</span>
                  <input
                    type="number"
                    min="1"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Width:</span>
                  <input
                    type="number"
                    min="1"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Height:</span>
                  <input
                    type="number"
                    min="1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Weight & Declared Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                  Actual Weight (kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2 text-[#222222] text-xs focus:outline-none font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#222222] mb-1.5">
                  Declared Value ($):
                </label>
                <input
                  type="number"
                  min="0"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2 text-[#222222] text-xs focus:outline-none"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-[#fff1f0] border border-[#ffccc7] rounded-xl text-[#c13515] text-xs">
                {error}
              </div>
            )}
          </div>

          {/* Real-time Breakdown Result */}
          <div className="flex flex-col justify-center">
            <PriceBreakdownCard breakdown={breakdown} loading={loading} />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#ebebeb] bg-[#f7f7f7]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#222222] hover:bg-black text-white rounded-full text-xs font-semibold transition active:scale-95"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
