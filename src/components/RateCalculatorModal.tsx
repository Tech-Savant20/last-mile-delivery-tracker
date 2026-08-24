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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Rate Calculator</h3>
              <p className="text-xs text-slate-400">
                Formula: Higher of actual vs volumetric weight (L�W�H / 5000) + Zone Rate Card + COD Surcharge
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls Form */}
          <div className="space-y-4 text-xs text-slate-300">
            {/* Origin & Destination */}
            <div className="space-y-3 p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Pickup Area (Origin):
                </label>
                <select
                  value={pickupAreaId}
                  onChange={(e) => setPickupAreaId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.pincode}) - [{a.zone?.name || "Zone"}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Drop Area (Destination):
                </label>
                <select
                  value={dropAreaId}
                  onChange={(e) => setDropAreaId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.pincode}) - [{a.zone?.name || "Zone"}]
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Type & Payment Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Order Type:</label>
                <div className="flex rounded-lg bg-slate-800 p-1 border border-slate-700">
                  <button
                    type="button"
                    onClick={() => setOrderType("B2C")}
                    className={`flex-1 py-1 text-center rounded text-xs font-medium transition ${
                      orderType === "B2C" ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-white"
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
                    B2B Freight
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

            {/* Dimensions (L x W x H) */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2">
              <label className="block text-[11px] font-semibold text-slate-300">
                Package Dimensions (cm):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] text-slate-400">Length (L):</span>
                  <input
                    type="number"
                    min="1"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Width (W):</span>
                  <input
                    type="number"
                    min="1"
                    value={widthCm}
                    onChange={(e) => setWidthCm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Height (H):</span>
                  <input
                    type="number"
                    min="1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Weight & Declared Value */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Actual Weight (kg):
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={actualWeightKg}
                  onChange={(e) => setActualWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Declared Value ($):
                </label>
                <input
                  type="number"
                  min="0"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-[11px]">
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
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Close Calculator
          </button>
        </div>
      </div>
    </div>
  );
};
