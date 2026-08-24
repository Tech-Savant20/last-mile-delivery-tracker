"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  Truck,
  RotateCcw,
  Sliders,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  Eye,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { RoleDemoBar } from "@/components/RoleDemoBar";
import { Navbar } from "@/components/Navbar";
import { RateCalculatorModal } from "@/components/RateCalculatorModal";
import { CreateOrderModal } from "@/components/CreateOrderModal";
import { TrackingTimeline } from "@/components/TrackingTimeline";
import { RescheduleModal } from "@/components/RescheduleModal";
import { AgentStatusUpdater } from "@/components/AgentStatusUpdater";
import { AdminRateManagerModal } from "@/components/AdminRateManagerModal";
import { AdminZoneManagerModal } from "@/components/AdminZoneManagerModal";
import { AgentFleetManagerModal } from "@/components/AgentFleetManagerModal";
import { NotificationCenterModal } from "@/components/NotificationCenterModal";
import { format } from "date-fns";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showRateCalcModal, setShowRateCalcModal] = useState<boolean>(false);
  const [showRateManagerModal, setShowRateManagerModal] = useState<boolean>(false);
  const [showZoneManagerModal, setShowZoneManagerModal] = useState<boolean>(false);
  const [showFleetManagerModal, setShowFleetManagerModal] = useState<boolean>(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState<boolean>(false);

  // Selected Order for Tracking view / Actions
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<boolean>(false);
  const [orderToReschedule, setOrderToReschedule] = useState<any>(null);

  // Notification count
  const [notificationCount, setNotificationCount] = useState<number>(0);

  // Initial user session fetch
  const fetchSession = async () => {
    setUserLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        // Default login as Admin
        await handleSwitchUser("admin");
      }
    } catch {
      // Fallback
    } finally {
      setUserLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [zRes, aRes, gRes, statsRes, nRes] = await Promise.all([
        fetch("/api/zones"),
        fetch("/api/zones/areas"),
        fetch("/api/agents"),
        fetch("/api/analytics"),
        fetch("/api/notifications?limit=10"),
      ]);

      const [zData, aData, gData, sData, nData] = await Promise.all([
        zRes.json(),
        aRes.json(),
        gRes.json(),
        statsRes.json(),
        nRes.json(),
      ]);

      if (zData.success) setZones(zData.zones || []);
      if (aData.success) setAreas(aData.areas || []);
      if (gData.success) setAgents(gData.agents || []);
      if (sData.success) setAnalytics(sData.stats);
      if (nData.success) setNotificationCount(nData.notifications?.length || 0);
    } catch (err) {
      console.error("Metadata load error", err);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== "ALL") queryParams.append("status", statusFilter);
      if (orderTypeFilter !== "ALL") queryParams.append("orderType", orderTypeFilter);
      if (zoneFilter !== "ALL") queryParams.append("zoneId", zoneFilter);
      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());

      const res = await fetch(`/api/orders?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders || []);
        // Update selected order if open
        if (selectedOrder) {
          const updated = data.orders.find((o: any) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchMetadata();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser, statusFilter, orderTypeFilter, zoneFilter, searchQuery]);

  const handleSwitchUser = async (roleKey: string) => {
    setUserLoading(true);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setSelectedOrder(null);
        fetchOrders();
        fetchMetadata();
      }
    } catch (err) {
      console.error("Switch error", err);
    } finally {
      setUserLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    setCurrentUser(null);
    handleSwitchUser("admin");
  };

  const handleAutoAssign = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "auto" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders();
        fetchMetadata();
      } else {
        alert(data.error || "Auto-assignment failed");
      }
    } catch (err) {
      alert("Error triggering auto-assignment");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1-Click Role Switcher */}
      <RoleDemoBar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        isLoading={userLoading}
      />

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenCreateOrder={() => setShowCreateModal(true)}
        onOpenRateCalculator={() => setShowRateCalcModal(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenRateManager={() => setShowRateManagerModal(true)}
        onLogout={handleLogout}
        unreadCount={notificationCount}
      />

      {/* Hero / Header Section */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        {/* Banner with Active View Context */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider font-mono">
                {currentUser?.role === "ADMIN"
                  ? "Admin Operations Hub"
                  : currentUser?.role === "AGENT"
                  ? "Delivery Agent Field Portal"
                  : "Customer Shipment Portal"}
              </span>
              <span className="text-xs text-slate-400 font-mono">Logged in as {currentUser?.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {currentUser?.role === "ADMIN"
                ? "Fleet Logistics & Rate Management Console"
                : currentUser?.role === "AGENT"
                ? "Active Dispatch Tasks & Route Progress"
                : "My Shipments & Delivery Tracking"}
            </h1>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {currentUser?.role === "ADMIN" && (
              <>
                <button
                  onClick={() => setShowZoneManagerModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Zones & Areas</span>
                </button>
                <button
                  onClick={() => setShowFleetManagerModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Workforce Fleet</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowRateCalcModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Quote Calculator</span>
            </button>
          </div>
        </div>

        {/* Analytics KPI Cards (for Admin & Overview) */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
              <span className="text-[11px] text-slate-400 block font-medium">Total Orders</span>
              <p className="text-xl font-bold text-white mt-1">{analytics.totalOrders}</p>
              <span className="text-[10px] text-blue-400 font-mono">B2C: {analytics.b2cCount} | B2B: {analytics.b2bCount}</span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
              <span className="text-[11px] text-slate-400 block font-medium">Gross Revenue</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">${analytics.totalRevenue}</p>
              <span className="text-[10px] text-slate-400 font-mono">Prepaid: {analytics.prepaidCount} | COD: {analytics.codCount}</span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
              <span className="text-[11px] text-slate-400 block font-medium">Active In Transit</span>
              <p className="text-xl font-bold text-cyan-400 mt-1">{analytics.inTransitCount}</p>
              <span className="text-[10px] text-slate-400">On-road deliveries</span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
              <span className="text-[11px] text-slate-400 block font-medium">Delivered (SLA)</span>
              <p className="text-xl font-bold text-teal-400 mt-1">{analytics.deliveredCount}</p>
              <span className="text-[10px] text-teal-300 font-mono">{analytics.successRate} Success Rate</span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
              <span className="text-[11px] text-slate-400 block font-medium">Failed Attempts</span>
              <p className="text-xl font-bold text-red-400 mt-1">{analytics.failedCount}</p>
              <span className="text-[10px] text-purple-300 font-mono">{analytics.rescheduledCount} Rescheduled</span>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl shadow">
              <span className="text-[11px] text-slate-400 block font-medium">Fleet On Duty</span>
              <p className="text-xl font-bold text-indigo-400 mt-1">{analytics.activeAgents}</p>
              <span className="text-[10px] text-slate-400">Agents Online</span>
            </div>
          </div>
        )}

        {/* Orders Section / Split Screen if an order is selected */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Orders Explorer Table */}
          <div className={`${selectedOrder ? "lg:col-span-6" : "lg:col-span-12"} space-y-4`}>
            {/* Filter Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search */}
                <div className="relative min-w-[200px] flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by Tracking #, Address, Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CREATED">Created</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="PICKED_UP">Picked Up</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="FAILED">Failed</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>

                {/* Order Type Filter */}
                <select
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="ALL">All Types</option>
                  <option value="B2C">B2C Retail</option>
                  <option value="B2B">B2B Freight</option>
                </select>
              </div>

              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                title="Refresh Orders"
              >
                <RefreshCw className={`w-4 h-4 ${loadingOrders ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Orders List / Cards */}
            {loadingOrders ? (
              <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-blue-500 mb-2" />
                <span>Loading shipments...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs bg-slate-900/40 rounded-xl border border-slate-800 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-600" />
                <p>No orders found matching the filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {orders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const isFailed = order.status === "FAILED";
                  const isDelivered = order.status === "DELIVERED";
                  const isRescheduled = order.status === "RESCHEDULED";

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-4 rounded-xl border transition cursor-pointer shadow-sm ${
                        isSelected
                          ? "bg-slate-850 border-blue-500 ring-2 ring-blue-500/20"
                          : isFailed
                          ? "bg-slate-900 hover:bg-slate-850 border-red-500/40"
                          : "bg-slate-900 hover:bg-slate-850 border-slate-800"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-cyan-400">
                              #{order.trackingNumber}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-850 text-slate-300 border border-slate-700">
                              {order.orderType}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded ${
                                order.paymentType === "COD"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-emerald-500/20 text-emerald-300"
                              }`}
                            >
                              {order.paymentType}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-white">
                            {order.pickupArea?.name} ? {order.dropArea?.name}
                          </p>

                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {order.dropAddress}
                          </p>
                        </div>

                        <div className="text-right space-y-1 shrink-0">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isFailed
                                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                                : isDelivered
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                : isRescheduled
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/40"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="text-xs font-bold text-white block">
                            ${order.totalCharge?.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Footer info & quick action */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-slate-500" />
                            {order.agent?.name || "Unassigned"}
                          </span>
                          <span>�</span>
                          <span>{order.chargeableWeightKg}kg</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.status === "CREATED" && currentUser?.role === "ADMIN" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoAssign(order.id);
                              }}
                              className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 shadow"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              <span>Auto-Assign</span>
                            </button>
                          )}

                          {isFailed && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOrderToReschedule(order);
                                setShowRescheduleModal(true);
                              }}
                              className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-semibold flex items-center gap-1 shadow"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Reschedule</span>
                            </button>
                          )}

                          <Link
                            href={`/track/${order.trackingNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            className="text-slate-400 hover:text-cyan-400 p-1"
                            title="Open Public Tracking Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Pane: Selected Order Detail & Interactive LifeCycle Panel */}
          {selectedOrder && (
            <div className="lg:col-span-6 space-y-4">
              {/* Agent Quick Progression Bar */}
              {(currentUser?.role === "AGENT" || currentUser?.role === "ADMIN") && (
                <AgentStatusUpdater
                  order={selectedOrder}
                  currentUser={currentUser}
                  onStatusUpdated={() => {
                    fetchOrders();
                    fetchMetadata();
                  }}
                />
              )}

              {/* Full Tracking Stepper & Event Timeline */}
              <TrackingTimeline
                order={selectedOrder}
                currentUser={currentUser}
                onOpenReschedule={() => {
                  setOrderToReschedule(selectedOrder);
                  setShowRescheduleModal(true);
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOrderCreated={(newOrder) => {
          fetchOrders();
          fetchMetadata();
          setSelectedOrder(newOrder);
        }}
        areas={areas}
        currentUser={currentUser}
        agents={agents}
      />

      <RateCalculatorModal
        isOpen={showRateCalcModal}
        onClose={() => setShowRateCalcModal(false)}
        areas={areas}
      />

      <AdminRateManagerModal
        isOpen={showRateManagerModal}
        onClose={() => setShowRateManagerModal(false)}
      />

      <AdminZoneManagerModal
        isOpen={showZoneManagerModal}
        onClose={() => setShowZoneManagerModal(false)}
        onZonesUpdated={() => {
          fetchMetadata();
          fetchOrders();
        }}
      />

      <AgentFleetManagerModal
        isOpen={showFleetManagerModal}
        onClose={() => setShowFleetManagerModal(false)}
      />

      <NotificationCenterModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        currentUser={currentUser}
      />

      {orderToReschedule && (
        <RescheduleModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setOrderToReschedule(null);
          }}
          order={orderToReschedule}
          onRescheduled={() => {
            fetchOrders();
            fetchMetadata();
          }}
        />
      )}
    </div>
  );
}
