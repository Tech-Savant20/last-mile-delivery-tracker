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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dddddd] rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#f7f7f7]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] flex items-center justify-center">
              <MapPin className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">Delivery Zones & Neighborhoods Dispatch Manager</h3>
              <p className="text-xs text-[#6a6a6a]">
                Define geographic operational zones and map postal codes/neighborhoods for automatic intra/inter-zone routing.
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

        {/* Body */}
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

          {/* Current Zones Grid */}
          <div className="space-y-3">
            <span className="font-bold text-[#222222] uppercase tracking-wider text-xs block">
              Active Zones & Assigned Neighborhoods
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-4 sm:p-5 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#222222] text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#ff385c]" />
                      {zone.name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-[10px] font-mono text-[#222222] font-semibold border border-[#dddddd]">
                      {zone.code}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#6a6a6a]">{zone.description || "Operational logistics zone"}</p>

                  <div className="pt-2 border-t border-[#ebebeb]">
                    <span className="text-[10px] text-[#6a6a6a] font-semibold block mb-2">
                      Assigned Areas ({zone.areas?.length || 0}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {zone.areas?.map((a: any) => (
                        <span
                          key={a.id}
                          className="px-2.5 py-1 bg-white text-[#222222] border border-[#dddddd] rounded-full text-[10px] font-medium"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#ebebeb]">
            {/* Add New Area Form */}
            <form onSubmit={handleCreateArea} className="p-5 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-3">
              <span className="font-bold text-[#222222] text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#ff385c]" />
                Assign New Area / Pincode to Zone
              </span>

              <div>
                <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Area / Neighborhood Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Indiranagar 100ft Rd"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2 text-[#222222] text-xs focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Pincode:</label>
                  <input
                    type="text"
                    placeholder="e.g. 560038"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2 text-[#222222] text-xs font-mono focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Target Zone:</label>
                  <select
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2 text-[#222222] text-xs focus:outline-none"
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
                className="w-full py-2.5 bg-[#222222] hover:bg-black text-white rounded-full font-semibold text-xs transition active:scale-95 shadow-sm"
              >
                Add Area Mapping
              </button>
            </form>

            {/* Add New Zone Form */}
            <form onSubmit={handleCreateZone} className="p-5 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-3">
              <span className="font-bold text-[#222222] text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-[#ff385c]" />
                Register New Delivery Zone
              </span>

              <div>
                <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Zone Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore Central Zone"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2 text-[#222222] text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-medium text-[#6a6a6a] block mb-1">Unique Code:</label>
                <input
                  type="text"
                  placeholder="e.g. ZONE_BLR_CENTRAL"
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] focus:border-[#222222] rounded-xl px-3 py-2 text-[#222222] text-xs font-mono uppercase focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full font-semibold text-xs transition active:scale-95 shadow-sm"
              >
                Create New Zone
              </button>
            </form>
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
