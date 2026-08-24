"use client";

import React from "react";
import { RateCalculationBreakdown } from "@/lib/types";
import { Scale, Box, MapPin, Check, Info } from "lucide-react";

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
      <div className="bg-white p-6 rounded-2xl border border-[#dddddd] shadow-sm animate-pulse text-center space-y-3">
        <div className="h-4 bg-[#f2f2f2] rounded-full w-1/3 mx-auto"></div>
        <div className="h-8 bg-[#f2f2f2] rounded-full w-1/2 mx-auto"></div>
        <div className="h-3 bg-[#f2f2f2] rounded-full w-2/3 mx-auto"></div>
      </div>
    );
  }

  if (!breakdown) {
    return (
      <div className="bg-[#f7f7f7] p-6 rounded-2xl border border-dashed border-[#dddddd] text-center text-[#6a6a6a]">
        <Box className="w-8 h-8 mx-auto text-[#929292] mb-2 stroke-[1.5]" />
        <p className="text-sm font-medium text-[#222222]">No Quote Calculated Yet</p>
        <p className="text-xs text-[#6a6a6a] mt-1">Select pickup & drop locations and package specs to calculate live delivery charges.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#dddddd] overflow-hidden shadow-airbnb text-[#222222]">
      {/* Header with Total Price */}
      <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#f7f7f7]/60">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6a6a6a] block">
            Guaranteed Quote
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl sm:text-3xl font-bold text-[#222222] tracking-tight">
              ${breakdown.totalCharge.toFixed(2)}
            </span>
            <span className="text-xs text-[#6a6a6a] font-medium">USD</span>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
              breakdown.zoneType === "INTRA_ZONE"
                ? "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]"
                : "bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]"
            }`}
          >
            <MapPin className="w-3 h-3" />
            {breakdown.zoneType === "INTRA_ZONE" ? "Intra-Zone" : "Inter-Zone"}
          </span>
        </div>
      </div>

      {/* Weight & Billing Engine Comparison */}
      <div className="p-5 space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3 p-3 bg-[#f7f7f7] rounded-xl border border-[#ebebeb]">
          <div>
            <span className="text-[#6a6a6a] text-[11px] block">Scale Weight:</span>
            <p className="font-semibold text-[#222222] text-sm mt-0.5">{breakdown.actualWeightKg} kg</p>
          </div>
          <div>
            <span className="text-[#6a6a6a] text-[11px] block">Volumetric (L×W×H/5000):</span>
            <p className="font-semibold text-[#222222] text-sm mt-0.5">{breakdown.volumetricWeightKg} kg</p>
          </div>
        </div>

        {/* Chargeable Weight Pill */}
        <div
          className={`p-3 rounded-xl flex items-start gap-2.5 border ${
            breakdown.isVolumetricCharged
              ? "bg-[#fef7e0] border-[#feefc3] text-[#7a4100]"
              : "bg-[#f7f7f7] border-[#dddddd] text-[#222222]"
          }`}
        >
          <Scale className="w-4 h-4 mt-0.5 shrink-0 text-[#222222]" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold text-[#222222]">Billable Weight: {breakdown.chargeableWeightKg} kg</span>
            <p className="text-[10px] text-[#6a6a6a] mt-0.5">
              {breakdown.isVolumetricCharged
                ? "Charged by volumetric volume factor (package dimensions exceed scale weight ratio)."
                : "Charged on physical scale weight standard."}
            </p>
          </div>
        </div>

        {/* Itemized Price Breakdown */}
        <div className="space-y-2 pt-2 border-t border-[#ebebeb]">
          <div className="flex justify-between items-center py-0.5 text-[#3f3f3f]">
            <span className="text-[#6a6a6a]">Base Rate (Up to {breakdown.baseWeightKg}kg):</span>
            <span className="font-medium text-[#222222]">${breakdown.baseRate.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center py-0.5 text-[#3f3f3f]">
            <span className="text-[#6a6a6a]">
              Extra Weight ({breakdown.extraWeightKg}kg @ ${breakdown.perExtraKgRate}/kg):
            </span>
            <span className="font-medium text-[#222222]">${breakdown.extraWeightCharge.toFixed(2)}</span>
          </div>

          {breakdown.codSurcharge > 0 ? (
            <div className="flex justify-between items-center py-1 text-[#222222] bg-[#f7f7f7] px-2.5 rounded-lg">
              <span className="text-[11px] font-medium">COD Surcharge:</span>
              <span className="font-semibold text-[#ff385c]">+${breakdown.codSurcharge.toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center py-0.5 text-[#6a6a6a]">
              <span>COD Handling:</span>
              <span className="text-[#137333] font-medium text-[11px]">Free ($0.00)</span>
            </div>
          )}

          {breakdown.codCalculationNote && (
            <p className="text-[10px] text-[#929292] italic text-right">
              {breakdown.codCalculationNote}
            </p>
          )}
        </div>

        {/* Route Summary */}
        <div className="pt-3 border-t border-[#ebebeb] text-[11px] text-[#6a6a6a] flex items-center justify-between">
          <span>Route: <strong className="text-[#222222]">{breakdown.pickupZoneName}</strong> → <strong className="text-[#222222]">{breakdown.dropZoneName}</strong></span>
        </div>
      </div>
    </div>
  );
};
