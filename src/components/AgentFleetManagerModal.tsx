"use client";

import React, { useState, useEffect } from "react";
import { X, Truck, UserCheck, UserX, MapPin, Activity, AlertCircle } from "lucide-react";

interface AgentFleetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentFleetManagerModal: React.FC<AgentFleetManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      if (data.success) {
        setAgents(data.agents || []);
      }
    } catch (err) {
      setError("Failed to load agent fleet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAgents();
  }, [isOpen]);

  const toggleAvailability = async (agent: any) => {
    try {
      const res = await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.id,
          isAvailable: !agent.isAvailable,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) =>
          prev.map((a) => (a.id === agent.id ? { ...a, isAvailable: !a.isAvailable } : a))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delivery Fleet & Workforce Control</h3>
              <p className="text-xs text-slate-400">
                Monitor agent capacity, active loads, zone placements, and availability status.
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-slate-300">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => {
              const capacityPercent = Math.min(
                100,
                Math.round((agent.activeDeliveries / (agent.maxCapacity || 5)) * 100)
              );

              return (
                <div
                  key={agent.id}
                  className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{agent.name}</h4>
                      <p className="text-[11px] text-slate-400">{agent.email} | {agent.phone || "No phone"}</p>
                    </div>

                    <button
                      onClick={() => toggleAvailability(agent)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition ${
                        agent.isAvailable
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                          : "bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600"
                      }`}
                    >
                      {agent.isAvailable ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Online</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5 text-slate-400" />
                          <span>Offline</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Zone & Location */}
                  <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-800/80 p-2 rounded-lg">
                    <span className="flex items-center gap-1 text-cyan-300">
                      <MapPin className="w-3.5 h-3.5" />
                      {agent.currentZone?.name || "Global Zone"}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      Lat: {agent.currentLat || "28.61"} Lng: {agent.currentLng || "77.20"}
                    </span>
                  </div>

                  {/* Active Workload Meter */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Workload Capacity:</span>
                      <span className="font-bold text-white font-mono">
                        {agent.activeDeliveries} / {agent.maxCapacity || 5} active shipments
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          capacityPercent > 80
                            ? "bg-red-500"
                            : capacityPercent > 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Orders List preview */}
                  {agent.assignedOrders && agent.assignedOrders.length > 0 && (
                    <div className="pt-2 border-t border-slate-750 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Assigned Active Routes:
                      </span>
                      <div className="space-y-1">
                        {agent.assignedOrders.map((ord: any) => (
                          <div
                            key={ord.id}
                            className="flex items-center justify-between text-[10px] bg-slate-850 px-2 py-1 rounded"
                          >
                            <span className="font-mono text-cyan-300 font-bold">#{ord.trackingNumber}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-750 text-slate-300">
                              {ord.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
