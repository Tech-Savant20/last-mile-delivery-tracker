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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dddddd] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#f7f7f7]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] flex items-center justify-center">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">Delivery Fleet & Field Workforce Hub</h3>
              <p className="text-xs text-[#6a6a6a]">
                Monitor real-time agent workloads, zone assignments, and dispatch availability.
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
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs text-[#222222]">
          {error && (
            <div className="p-3.5 bg-[#fff1f0] border border-[#ffccc7] rounded-xl text-[#c13515]">
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
                  className="p-5 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-[#222222] text-sm">{agent.name}</h4>
                      <p className="text-[11px] text-[#6a6a6a] mt-0.5">{agent.email} • {agent.phone || "No phone"}</p>
                    </div>

                    <button
                      onClick={() => toggleAvailability(agent)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                        agent.isAvailable
                          ? "bg-[#e6f4ea] text-[#137333] border border-[#ceead6] hover:bg-[#ceead6]"
                          : "bg-white text-[#6a6a6a] border border-[#dddddd] hover:bg-[#f2f2f2]"
                      }`}
                    >
                      {agent.isAvailable ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-[#137333]" />
                          <span>Online</span>
                        </>
                      ) : (
                        <>
                          <UserX className="w-3.5 h-3.5 text-[#6a6a6a]" />
                          <span>Offline</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Zone & Location */}
                  <div className="flex items-center justify-between text-[11px] bg-white p-2.5 rounded-xl border border-[#ebebeb]">
                    <span className="flex items-center gap-1 text-[#222222] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#ff385c]" />
                      {agent.currentZone?.name || "Global Zone"}
                    </span>
                    <span className="font-mono text-[10px] text-[#6a6a6a]">
                      GPS: {agent.currentLat || "28.61"}, {agent.currentLng || "77.20"}
                    </span>
                  </div>

                  {/* Active Workload Meter */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#6a6a6a]">Workload Capacity:</span>
                      <span className="font-bold text-[#222222] font-mono">
                        {agent.activeDeliveries} / {agent.maxCapacity || 5} active drops
                      </span>
                    </div>
                    <div className="h-2 w-full bg-[#ebebeb] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          capacityPercent > 80
                            ? "bg-[#c13515]"
                            : capacityPercent > 50
                            ? "bg-[#f29900]"
                            : "bg-[#137333]"
                        }`}
                        style={{ width: `${capacityPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Active Orders List preview */}
                  {agent.assignedOrders && agent.assignedOrders.length > 0 && (
                    <div className="pt-2 border-t border-[#ebebeb] space-y-1.5">
                      <span className="text-[10px] text-[#6a6a6a] uppercase font-bold tracking-wider block">
                        Assigned Active Routes:
                      </span>
                      <div className="space-y-1">
                        {agent.assignedOrders.map((ord: any) => (
                          <div
                            key={ord.id}
                            className="flex items-center justify-between text-[10px] bg-white px-2.5 py-1.5 rounded-lg border border-[#ebebeb]"
                          >
                            <span className="font-mono text-[#222222] font-bold">#{ord.trackingNumber}</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#f2f2f2] text-[#6a6a6a] font-medium">
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
        <div className="p-4 border-t border-[#ebebeb] bg-[#f7f7f7]/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#222222] hover:bg-black text-white rounded-full text-xs font-semibold transition active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
