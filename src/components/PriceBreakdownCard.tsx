"use client";

import React from "react";
import { RateCalculationBreakdown } from "@/lib/types";
import { Scale, Box, MapPin, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

interface PriceBreakdownCardProps {
  breakdown: RateCalculationBreakdown | null;
  loading?: boolean;
}

export const PriceBreakdownCard: React.FC<PriceBreakdownCardProps> = ({
  breakdown,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-slate-850 p-6 rounded-xl border border-slate-700/60 animate-pulse text-center">
        <div className="h-4 bg-slate-700 rounded w-1/3 mx-auto mb-4"></div>
        <div className="h-8 bg-slate-700 rounded w-1/2 mx-auto mb-2"></div>
        <div className="h-3 bg-slate-800 rounded w-2/3 mx-auto"></div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="bg-slate-850 p-6 rounded-xl border border-dashed border-slate-700 text-center text-slate-400">
        <Box className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-60" />
        <p className="text-sm">Select pickup & drop locations and package specs to calculate live delivery charges.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-xl text-slate-200">
      {/* Header with Total Price */}
      <div className="bg-gradient-to-r from-slate-800 via-indigo-950/40 to-slate-800 p-4 border-b border-slate-700/80 flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
            Calculated Delivery Quote
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-white">${breakdown.totalCharge.toFixed(2)}</span>
            <span className="text-[11px] text-slate-400 font-mono">USD</span>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
              breakdown.zoneType === "INTRA_ZONE"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            }`}
          >
            <MapPin className="w-3 h-3" />
            {breakdown.zoneType === "INTRA_ZONE" ? "Intra-Zone Route" : "Inter-Zone Route"}
          </span>
        </div>
      </div>

      {/* Weight & Billing Engine Comparison */}
      <div className="p-4 space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
          <div>
            <span className="text-slate-400 text-[11px]">Actual Weight:</span>
            <p className="font-semibold text-slate-200">{breakdown.actualWeightKg} kg</p>
          </div>
          <div>
            <span className="text-slate-400 text-[11px]">Volumetric Weight (L�W�H/5000):</span>
            <p className="font-semibold text-slate-200">{breakdown.volumetricWeightKg} kg</p>
          </div>
        </div>

        {/* Chargeable Weight Pill */}
        <div
          className={`p-2.5 rounded-lg flex items-start gap-2 border ${
            breakdown.isVolumetricCharged
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}
        >
          <Scale className="w-4 h-4 mt-0.5 shrink-0" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold">Billable Weight: {breakdown.chargeableWeightKg} kg</span>
            <p className="text-[10px] opacity-90">
              {breakdown.isVolumetricCharged
                ? "Billed on volumetric weight since package density is lower than standard volumetric factor."
                : "Billed on actual scale weight."}
            </p>
          </div>
        </div>

        {/* Itemized Price Breakdown */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800">
          <div className="flex justify-between items-center py-1 text-slate-300">
            <span className="text-slate-400">Base Shipping Rate (Up to {breakdown.baseWeightKg}kg):</span>
            <span className="font-medium text-white">${breakdown.baseRate.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-1 text-slate-300">
            <span className="text-slate-400">
              Extra Weight ({breakdown.extraWeightKg}kg @ ${breakdown.perExtraKgRate}/kg):
            </span>
            <span className="font-medium text-white">${breakdown.extraWeightCharge.toFixed(2)}</span>
          </div>

          {breakdown.codSurcharge > 0 ? (
            <div className="flex justify-between items-center py-1 text-amber-300 bg-amber-500/5 px-2 rounded">
              <span className="text-[11px]">COD Handling Surcharge:</span>
              <span className="font-semibold">+${breakdown.codSurcharge.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center py-1 text-slate-400">
              <span>COD Surcharge:</span>
              <span className="text-emerald-400 font-mono text-[11px]">Free ($0.00)</span>
            </div>
          )}

          {breakdown.codCalculationNote && (
            <p className="text-[10px] text-slate-500 italic text-right">
              {breakdown.codCalculationNote}
            </p>
          )}
        </div>

        {/* Route Summary */}
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Route: <strong className="text-slate-200">{breakdown.pickupZoneName}</strong> ? <strong className="text-slate-200">{breakdown.dropZoneName}</strong></span>
        </div>
      </div>
    </div>
  );
};
