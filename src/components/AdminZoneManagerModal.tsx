"use client";

import React, { useState, useEffect } from "react";
import { X, MapPin, Plus, CheckCircle2, AlertCircle, Building2 } from "lucide-react";

interface AdminZoneManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZonesUpdated?: () => void;
}

export const AdminZoneManagerModal: React.FC<AdminZoneManagerModalProps> = ({
  isOpen,
  onClose,
  onZonesUpdated,
}) => {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // New Zone state
  const [zoneName, setZoneName] = useState("");
  const [zoneCode, setZoneCode] = useState("");
  const [zoneDesc, setZoneDesc] = useState("");

  // New Area state
  const [areaName, setAreaName] = useState("");
  const [pincode, setPincode] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [lat, setLat] = useState("28.6139");
  const [lng, setLng] = useState("77.2090");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/zones");
      const data = await res.json();
      if (data.success) {
        setZones(data.zones || []);
        if (data.zones.length > 0 && !selectedZoneId) {
          setSelectedZoneId(data.zones[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchZones();
  }, [isOpen]);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: zoneName,
          code: zoneCode,
          description: zoneDesc,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Zone "${data.zone.name}" created successfully!`);
        setZoneName("");
        setZoneCode("");
        setZoneDesc("");
        fetchZones();
        onZonesUpdated?.();
      } else {
        setError(data.error || "Failed to create zone");
      }
    } catch (err: any) {
      setError("Network error creating zone");
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/zones/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: areaName,
          pincode,
          zoneId: selectedZoneId,
          defaultLat: parseFloat(lat),
          defaultLng: parseFloat(lng),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`Area "${data.area.name}" assigned to zone successfully!`);
        setAreaName("");
        setPincode("");
        fetchZones();
        onZonesUpdated?.();
      } else {
        setError(data.error || "Failed to create area");
      }
    } catch (err: any) {
      setError("Network error creating area");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Zone & Area Dispatch Manager</h3>
              <p className="text-xs text-slate-400">
                Define geographic operational zones and map postal codes/neighborhoods for automatic intra/inter-zone detection.
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

        {/* Body */}
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

          {/* Current Zones Grid */}
          <div className="space-y-3">
            <span className="font-bold text-white uppercase tracking-wider text-xs block">
              Active Zones & Assigned Neighborhoods
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/60 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      {zone.name}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400 border border-slate-700">
                      {zone.code}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{zone.description || "Operational logistics zone"}</p>

                  <div className="pt-2 border-t border-slate-750">
                    <span className="text-[10px] text-slate-400 font-semibold block mb-1.5">
                      Assigned Areas ({zone.areas?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {zone.areas?.map((a: any) => (
                        <span
                          key={a.id}
                          className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded text-[10px]"
                        >
                          {a.name} ({a.pincode})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Area / Add New Zone Forms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
            {/* Add New Area Form */}
            <form onSubmit={handleCreateArea} className="p-4 bg-slate-850 rounded-xl border border-slate-700/80 space-y-3">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                Assign New Area / Pincode to Zone
              </span>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Area / Neighborhood Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar 100ft Rd"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Pincode:</label>
                  <input
                    type="text"
                    placeholder="e.g. 560038"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Target Zone:</label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    required
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow transition"
              >
                Add Area Mapping
              </button>
            </form>

            {/* Add New Zone Form */}
            <form onSubmit={handleCreateZone} className="p-4 bg-slate-850 rounded-xl border border-slate-700/80 space-y-3">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                Register New Delivery Zone
              </span>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Zone Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore Central Zone"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Unique Code:</label>
                <input
                  type="text"
                  placeholder="e.g. ZONE_BLR_CENTRAL"
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono uppercase"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow transition"
              >
                Create New Zone
              </button>
            </form>
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
