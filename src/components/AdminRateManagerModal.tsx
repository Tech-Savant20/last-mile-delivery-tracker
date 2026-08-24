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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dynamic Rate Card & Surcharge Configurator</h3>
              <p className="text-xs text-slate-400">
                100% Admin Configurable (No hardcoded rates). Changes take effect instantly for all new quotes.
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

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {message && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Rate Cards Table */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-xs block">
              1. Base & Incremental Rate Cards
            </span>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80 text-slate-400 border-b border-slate-700">
                    <th className="py-2.5 px-3">Order Type</th>
                    <th className="py-2.5 px-3">Zone Type</th>
                    <th className="py-2.5 px-3">Base Wt (kg)</th>
                    <th className="py-2.5 px-3">Base Rate ($)</th>
                    <th className="py-2.5 px-3">Extra Rate ($/kg)</th>
                    <th className="py-2.5 px-3">Min Charge ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rateCards.map((rc) => (
                    <tr key={rc.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            rc.orderType === "B2B" ? "bg-indigo-500/20 text-indigo-300" : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {rc.orderType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] ${
                            rc.zoneType === "INTRA_ZONE"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {rc.zoneType}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.1"
                          value={rc.baseWeightKg}
                          onChange={(e) =>
                            handleRateCardChange(rc.id, "baseWeightKg", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.1"
                          value={rc.baseRate}
                          onChange={(e) =>
                            handleRateCardChange(rc.id, "baseRate", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs font-semibold text-cyan-400"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.1"
                          value={rc.perExtraKgRate}
                          onChange={(e) =>
                            handleRateCardChange(rc.id, "perExtraKgRate", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          step="0.1"
                          value={rc.minCharge}
                          onChange={(e) =>
                            handleRateCardChange(rc.id, "minCharge", parseFloat(e.target.value) || 0)
                          }
                          className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COD Surcharges Section */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <span className="font-bold text-white uppercase tracking-wider text-xs block">
              2. Cash on Delivery (COD) Surcharge Policies
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {surcharges.map((sur) => (
                <div key={sur.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">
                      {sur.orderType} COD Surcharge
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Type: {sur.feeType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">
                        {sur.feeType === "PERCENTAGE" ? "Fee Rate (%)" : "Fixed Amount ($)"}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={sur.feeValue}
                        onChange={(e) =>
                          handleSurchargeChange(sur.id, "feeValue", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs font-semibold text-amber-400"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Minimum Fee ($)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={sur.minFee}
                        onChange={(e) =>
                          handleSurchargeChange(sur.id, "minFee", parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Reload Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-purple-600/30 transition disabled:opacity-50"
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
