"use client";

import React, { useState, useEffect } from "react";
import { X, Sliders, Save, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface AdminRateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminRateManagerModal: React.FC<AdminRateManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [surcharges, setSurcharges] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rates/configs");
      const data = await res.json();
      if (data.success) {
        setRateCards(data.rateCards || []);
        setSurcharges(data.surcharges || []);
      } else {
        setError(data.error || "Failed to load rate cards");
      }
    } catch (err: any) {
      setError("Network error loading configs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchConfigs();
    }
  }, [isOpen]);

  const handleRateCardChange = (id: string, field: string, value: any) => {
    setRateCards((prev) =>
      prev.map((card) => (card.id === id ? { ...card, [field]: value } : card))
    );
  };

  const handleSurchargeChange = (id: string, field: string, value: any) => {
    setSurcharges((prev) =>
      prev.map((sur) => (sur.id === id ? { ...sur, [field]: value } : sur))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/rates/configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rateCards,
          surcharges,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage("Rate Cards and COD Surcharges updated successfully!");
        setRateCards(data.rateCards);
        setSurcharges(data.surcharges);
      } else {
        setError(data.error || "Failed to save configs");
      }
    } catch (err: any) {
      setError("Network error saving configs");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dddddd] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#f7f7f7]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] flex items-center justify-center">
              <Sliders className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">Dynamic Rate Card & Surcharge Configurator</h3>
              <p className="text-xs text-[#6a6a6a]">
                100% Admin Configurable (No hardcoded rates). Changes take effect instantly for all new quotes.
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-[#222222]">
          {message && (
            <div className="p-3.5 bg-[#e6f4ea] border border-[#ceead6] rounded-xl text-[#137333] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-[#fff1f0] border border-[#ffccc7] rounded-xl text-[#c13515] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Rate Cards Table */}
          <div className="space-y-3">
            <span className="font-bold text-[#222222] uppercase tracking-wider text-xs block">
              1. Base & Incremental Rate Cards
            </span>

            <div className="overflow-x-auto border border-[#ebebeb] rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f7f7f7] text-[#6a6a6a] border-b border-[#ebebeb] font-semibold">
                    <th className="py-3 px-4">Order Type</th>
                    <th className="py-3 px-4">Zone Type</th>
                    <th className="py-3 px-4">Base Wt (kg)</th>
                    <th className="py-3 px-4">Base Rate ($)</th>
                    <th className="py-3 px-4">Extra Rate ($/kg)</th>
                    <th className="py-3 px-4">Min Charge ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebebeb]">
                  {rateCards.map((rc) => (
                    <tr key={rc.id} className="hover:bg-[#f7f7f7]/60 transition">
                      <td className="py-3 px-4 font-semibold text-[#222222]">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            rc.orderType === "B2B" ? "bg-[#f2f2f2] text-[#222222]" : "bg-[#f7f7f7] text-[#6a6a6a] border border-[#dddddd]"
                          }`}
                        >
                          {rc.orderType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            rc.zoneType === "INTRA_ZONE"
                              ? "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]"
                              : "bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]"
                          }`}
                        >
                          {rc.zoneType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.1"
                          value={rc.baseWeightKg}
                          onChange={(e) =>
                            handleRateCardChange(rc.id, "baseWeightKg", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2 py-1 text-[#222222] text-xs focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.1"
                          value={rc.baseRate}
                          onChange={(e) =>
                            handleRateCardChange(rc.id, "baseRate", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2 py-1 text-[#222222] text-xs font-bold text-[#ff385c] focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.1"
                          value={rc.perExtraKgRate}
                          onChange={(e) =>
                            handleRateCardChange(rc.id, "perExtraKgRate", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2 py-1 text-[#222222] text-xs focus:outline-none"
                        />
                      </td>
                      <td className="py-2.5 px-4">
                        <input
                          type="number"
                          step="0.1"
                          value={rc.minCharge}
                          onChange={(e) =>
                            handleRateCardChange(rc.id, "minCharge", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2 py-1 text-[#222222] text-xs focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COD Surcharges Section */}
          <div className="space-y-3 pt-4 border-t border-[#ebebeb]">
            <span className="font-bold text-[#222222] uppercase tracking-wider text-xs block">
              2. Cash on Delivery (COD) Surcharge Policies
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {surcharges.map((sur) => (
                <div key={sur.id} className="p-4 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#222222] text-xs">
                      {sur.orderType} COD Surcharge
                    </span>
                    <span className="text-[10px] text-[#6a6a6a] font-mono">
                      Type: {sur.feeType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-[10px] text-[#6a6a6a] block mb-1 font-medium">
                        {sur.feeType === "PERCENTAGE" ? "Fee Rate (%)" : "Fixed Amount ($)"}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={sur.feeValue}
                        onChange={(e) =>
                          handleSurchargeChange(sur.id, "feeValue", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#6a6a6a] block mb-1 font-medium">Minimum Fee ($)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sur.minFee}
                        onChange={(e) =>
                          handleSurchargeChange(sur.id, "minFee", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-lg px-2.5 py-1.5 text-[#222222] text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#ebebeb] bg-[#f7f7f7]/60 flex items-center justify-between">
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#f7f7f7] border border-[#dddddd] text-[#222222] rounded-full text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#dddddd] hover:border-[#222222] text-[#222222] text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full text-xs font-bold shadow-sm transition disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Changes..." : "Save Rate Cards"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
