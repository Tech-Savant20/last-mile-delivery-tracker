"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Search, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import { RescheduleModal } from "@/components/RescheduleModal";

export default function TrackOrderPage() {
  const params = useParams();
  const router = useRouter();
  const trackingNumber = params?.trackingNumber as string;

  const [searchInput, setSearchInput] = useState(trackingNumber || "");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);

  const fetchOrder = async (trkNum: string) => {
    if (!trkNum) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${trkNum}`);
      const data = await res.json();
      if (res.ok && data.success && data.order) {
        setOrder(data.order);
      } else {
        setError(data.error || "Shipment record not found for that tracking number.");
      }
    } catch (err: any) {
      setError("Failed to communicate with tracking service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trackingNumber) {
      fetchOrder(trackingNumber);
    }
  }, [trackingNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/track/${searchInput.trim()}`);
      fetchOrder(searchInput.trim());
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#222222] flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="h-20 bg-white border-b border-[#ebebeb] px-4 sm:px-8 sticky top-0 z-30 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#ff385c] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Package className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-[#222222] text-lg tracking-tight">
            LastMile<span className="text-[#ff385c]">Tracker</span>
          </span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-semibold text-[#222222] hover:bg-[#f7f7f7] border border-[#dddddd] px-4 py-2 rounded-full transition shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          <span>Back to Dashboard</span>
        </Link>
      </header>

      {/* Main Track Container */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-8">
        {/* Search Hero Section */}
        <div className="text-center space-y-5 pt-4 pb-2">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-[#222222] tracking-tight">
              Live Shipment Tracking
            </h1>
            <p className="text-sm text-[#6a6a6a] max-w-md mx-auto">
              Real-time delivery progress, milestone audit trail, and customer rescheduling.
            </p>
          </div>

          {/* Airbnb Signature Pill Search Bar */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
            <div className="flex items-center bg-white border border-[#dddddd] hover:border-[#c1c1c1] focus-within:border-[#222222] rounded-full p-2 pl-6 shadow-airbnb transition-all">
              <div className="flex-1 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#222222] block">
                  Tracking Number
                </span>
                <input
                  type="text"
                  placeholder="e.g. TRK-984210"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-[#222222] placeholder-[#929292] focus:outline-none uppercase font-mono"
                  required
                />
              </div>

              {/* Rausch Search Orb */}
              <button
                type="submit"
                disabled={loading}
                className="w-12 h-12 rounded-full bg-[#ff385c] hover:bg-[#e00b41] active:scale-95 text-white flex items-center justify-center shadow-sm transition disabled:opacity-50 shrink-0 ml-2"
                title="Search Shipment"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 stroke-[2.5]" />
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic State: Loading / Error / Tracking View */}
        {loading ? (
          <div className="p-16 text-center text-[#6a6a6a] space-y-3 bg-[#f7f7f7] rounded-2xl border border-[#ebebeb]">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#ff385c]" />
            <p className="text-sm font-medium">Fetching real-time tracking audit trail...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-[#fff1f0] border border-[#ffccc7] rounded-2xl text-[#c13515] space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-[#c13515]" />
            <h3 className="font-bold text-[#222222] text-base">Shipment Record Not Found</h3>
            <p className="text-xs text-[#6a6a6a]">{error}</p>
          </div>
        ) : order ? (
          <div>
            <TrackingTimeline
              order={order}
              onOpenReschedule={() => setShowRescheduleModal(true)}
            />
          </div>
        ) : null}
      </main>

      {/* Reschedule Modal */}
      {order && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          order={order}
          onRescheduled={() => fetchOrder(trackingNumber)}
        />
      )}
    </div>
  );
}
