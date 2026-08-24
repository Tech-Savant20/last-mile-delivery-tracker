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
        setError(data.error || "Order not found with that tracking number.");
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-slate-900 border-b border-slate-800 py-3.5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white">
              <Package className="w-4 h-4" />
            </div>
            <span className="font-bold text-white text-base">
              LastMile<span className="text-cyan-400">IQ</span>
            </span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Main Track Container */}
      <main className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        {/* Search Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Live Public Shipment Tracking
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Enter your tracking identifier to check delivery milestones, assigned agent status, and reschedule attempts.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="max-w-lg mx-auto flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder="e.g. TRK-984210"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono uppercase"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Track</span>
            </button>
          </form>
        </div>

        {/* Dynamic State: Loading / Error / Tracking View */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
            <p className="text-sm">Fetching real-time tracking audit trail...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-500/10 border border-red-500/30 rounded-2xl text-red-300 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-red-400" />
            <h3 className="font-bold text-white text-base">Tracking Record Not Found</h3>
            <p className="text-xs text-red-300">{error}</p>
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
