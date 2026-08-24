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
    <div className="min-h-screen bg-white text-[#222222] flex flex-col font-sans">
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

      {/* Hero / Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-8">
        {/* Airbnb Signature 3-Segment Pill Search Hero */}
        <div className="pt-2 pb-2">
          <div className="bg-white border border-[#dddddd] hover:border-[#c1c1c1] focus-within:border-[#222222] rounded-full p-2 pl-6 shadow-airbnb transition-all flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-[#ebebeb]">
            {/* Segment 1: Search / Tracking # */}
            <div className="flex-1 py-1 md:py-0 md:pr-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#222222] block">
                Search Shipments
              </span>
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[#929292] absolute left-0" />
                <input
                  type="text"
                  placeholder="Tracking #, drop address, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-6 bg-transparent text-xs font-semibold text-[#222222] placeholder-[#929292] focus:outline-none"
                />
              </div>
            </div>

            {/* Segment 2: Status */}
            <div className="flex-1 py-1 md:py-0 md:px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#222222] block">
                Delivery Status
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-[#222222] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Delivery Statuses</option>
                <option value="CREATED">Created</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="PICKED_UP">Picked Up</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="DELIVERED">Delivered</option>
                <option value="FAILED">Failed Attempt</option>
                <option value="RESCHEDULED">Rescheduled</option>
              </select>
            </div>

            {/* Segment 3: Service Type */}
            <div className="flex-1 py-1 md:py-0 md:px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#222222] block">
                Service Class
              </span>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-semibold text-[#222222] focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Service Classes</option>
                <option value="B2C">B2C Retail Delivery</option>
                <option value="B2B">B2B Freight Logistics</option>
              </select>
            </div>

            {/* Rausch Search Orb / Action */}
            <div className="pt-2 md:pt-0 md:pl-3 flex items-center justify-end">
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="w-12 h-12 rounded-full bg-[#ff385c] hover:bg-[#e00b41] active:scale-95 text-white flex items-center justify-center shadow-sm transition disabled:opacity-50 shrink-0"
                title="Search & Refresh"
              >
                <Search className={`w-5 h-5 stroke-[2.5] ${loadingOrders ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Action Header & Context */}
        <div className="bg-[#f7f7f7] border border-[#ebebeb] rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white text-[#222222] border border-[#dddddd] uppercase tracking-wider">
                {currentUser?.role === "ADMIN"
                  ? "Admin Operations Console"
                  : currentUser?.role === "AGENT"
                  ? "Delivery Agent Field Portal"
                  : "Customer Shipment Portal"}
              </span>
              <span className="text-xs text-[#6a6a6a]">Session: <strong>{currentUser?.name}</strong></span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#222222] tracking-tight">
              {currentUser?.role === "ADMIN"
                ? "Fleet Logistics & Dispatch Management"
                : currentUser?.role === "AGENT"
                ? "Assigned Route & Package Progression"
                : "Live Package Tracking & Management"}
            </h1>
          </div>

          {/* Quick Action Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {currentUser?.role === "ADMIN" && (
              <>
                <button
                  onClick={() => setShowZoneManagerModal(true)}
                  className="px-4 py-2 bg-white hover:bg-[#f2f2f2] text-[#222222] border border-[#dddddd] rounded-full text-xs font-semibold flex items-center gap-2 transition shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#ff385c]" />
                  <span>Zones & Areas</span>
                </button>
                <button
                  onClick={() => setShowFleetManagerModal(true)}
                  className="px-4 py-2 bg-white hover:bg-[#f2f2f2] text-[#222222] border border-[#dddddd] rounded-full text-xs font-semibold flex items-center gap-2 transition shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-[#222222]" />
                  <span>Workforce Fleet</span>
                </button>
              </>
            )}

            <button
              onClick={() => setShowRateCalcModal(true)}
              className="px-4 py-2 bg-white hover:bg-[#f2f2f2] text-[#222222] border border-[#dddddd] rounded-full text-xs font-semibold flex items-center gap-2 transition shadow-xs"
            >
              <DollarSign className="w-3.5 h-3.5 text-[#222222]" />
              <span>Rate Calculator</span>
            </button>
          </div>
        </div>

        {/* Analytics KPI Stat Cards */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="p-4 bg-white border border-[#ebebeb] hover:border-[#dddddd] rounded-2xl shadow-xs transition hover:shadow-airbnb">
              <span className="text-[11px] text-[#6a6a6a] uppercase font-bold tracking-wider block">Total Orders</span>
              <p className="text-2xl font-bold text-[#222222] mt-1">{analytics.totalOrders}</p>
              <span className="text-[11px] text-[#6a6a6a] mt-1 block">B2C: {analytics.b2cCount} | B2B: {analytics.b2bCount}</span>
            </div>

            <div className="p-4 bg-white border border-[#ebebeb] hover:border-[#dddddd] rounded-2xl shadow-xs transition hover:shadow-airbnb">
              <span className="text-[11px] text-[#6a6a6a] uppercase font-bold tracking-wider block">Gross Revenue</span>
              <p className="text-2xl font-bold text-[#222222] mt-1">${analytics.totalRevenue}</p>
              <span className="text-[11px] text-[#6a6a6a] mt-1 block">Prepaid: {analytics.prepaidCount} | COD: {analytics.codCount}</span>
            </div>

            <div className="p-4 bg-white border border-[#ebebeb] hover:border-[#dddddd] rounded-2xl shadow-xs transition hover:shadow-airbnb">
              <span className="text-[11px] text-[#6a6a6a] uppercase font-bold tracking-wider block">In Transit</span>
              <p className="text-2xl font-bold text-[#1a73e8] mt-1">{analytics.inTransitCount}</p>
              <span className="text-[11px] text-[#6a6a6a] mt-1 block">Active dispatches</span>
            </div>

            <div className="p-4 bg-white border border-[#ebebeb] hover:border-[#dddddd] rounded-2xl shadow-xs transition hover:shadow-airbnb">
              <span className="text-[11px] text-[#6a6a6a] uppercase font-bold tracking-wider block">Delivered SLA</span>
              <p className="text-2xl font-bold text-[#137333] mt-1">{analytics.deliveredCount}</p>
              <span className="text-[11px] text-[#137333] font-semibold mt-1 block">{analytics.successRate} Success</span>
            </div>

            <div className="p-4 bg-white border border-[#ebebeb] hover:border-[#dddddd] rounded-2xl shadow-xs transition hover:shadow-airbnb">
              <span className="text-[11px] text-[#6a6a6a] uppercase font-bold tracking-wider block">Exceptions</span>
              <p className="text-2xl font-bold text-[#c13515] mt-1">{analytics.failedCount}</p>
              <span className="text-[11px] text-[#460479] font-semibold mt-1 block">{analytics.rescheduledCount} Rescheduled</span>
            </div>

            <div className="p-4 bg-white border border-[#ebebeb] hover:border-[#dddddd] rounded-2xl shadow-xs transition hover:shadow-airbnb">
              <span className="text-[11px] text-[#6a6a6a] uppercase font-bold tracking-wider block">Fleet On Duty</span>
              <p className="text-2xl font-bold text-[#222222] mt-1">{analytics.activeAgents}</p>
              <span className="text-[11px] text-[#6a6a6a] mt-1 block">Riders online</span>
            </div>
          </div>
        )}

        {/* Orders Explorer & Split Screen Detail Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Shipment Cards List */}
          <div className={`${selectedOrder ? "lg:col-span-6" : "lg:col-span-12"} space-y-3`}>
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-[#222222]">
                Shipment Feed ({orders.length})
              </h2>
              <button
                onClick={fetchOrders}
                disabled={loadingOrders}
                className="w-8 h-8 rounded-full border border-[#dddddd] hover:border-[#222222] flex items-center justify-center text-[#6a6a6a] hover:text-[#222222] transition"
                title="Refresh Feed"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Orders Feed */}
            {loadingOrders ? (
              <div className="py-16 text-center text-[#6a6a6a] text-xs bg-[#f7f7f7] rounded-2xl border border-[#ebebeb]">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin text-[#ff385c] mb-2" />
                <span>Loading shipments...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center text-[#6a6a6a] text-xs bg-[#f7f7f7] rounded-2xl border border-[#ebebeb] space-y-2">
                <Package className="w-8 h-8 mx-auto text-[#929292]" />
                <p className="font-medium text-[#222222]">No shipments found</p>
                <p className="text-[11px] text-[#6a6a6a]">Try adjusting your search criteria or create a new order.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  const isFailed = order.status === "FAILED";
                  const isDelivered = order.status === "DELIVERED";
                  const isRescheduled = order.status === "RESCHEDULED";

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#f7f7f7] border-[#222222] shadow-airbnb ring-1 ring-[#222222]"
                          : isFailed
                          ? "bg-white hover:bg-[#f7f7f7]/60 border-[#ffccc7] hover:shadow-airbnb"
                          : "bg-white hover:bg-[#f7f7f7]/60 border-[#ebebeb] hover:border-[#dddddd] hover:shadow-airbnb"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#222222]">
                              #{order.trackingNumber}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f2f2f2] text-[#222222]">
                              {order.orderType}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                order.paymentType === "COD"
                                  ? "bg-[#fff1f0] text-[#ff385c] border border-[#ffd1da]"
                                  : "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]"
                              }`}
                            >
                              {order.paymentType}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-[#222222]">
                            {order.pickupArea?.name} → {order.dropArea?.name}
                          </p>

                          <p className="text-xs text-[#6a6a6a] line-clamp-1">
                            {order.dropAddress}
                          </p>
                        </div>

                        <div className="text-right space-y-1.5 shrink-0">
                          <span
                            className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                              isFailed
                                ? "bg-[#fff1f0] text-[#c13515] border border-[#ffccc7]"
                                : isDelivered
                                ? "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]"
                                : isRescheduled
                                ? "bg-[#f8f0fc] text-[#460479] border border-[#e8d5f5]"
                                : "bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]"
                            }`}
                          >
                            {order.status}
                          </span>
                          <span className="text-sm font-bold text-[#222222] block">
                            ${order.totalCharge?.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Footer Route Info & Quick Actions */}
                      <div className="mt-4 pt-3 border-t border-[#ebebeb] flex items-center justify-between text-xs text-[#6a6a6a]">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 font-medium text-[#222222]">
                            <Truck className="w-3.5 h-3.5 text-[#6a6a6a]" />
                            {order.agent?.name || "Unassigned"}
                          </span>
                          <span>•</span>
                          <span>{order.chargeableWeightKg} kg</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {order.status === "CREATED" && currentUser?.role === "ADMIN" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAutoAssign(order.id);
                              }}
                              className="px-3 py-1 bg-[#222222] hover:bg-black text-white rounded-full text-[11px] font-semibold flex items-center gap-1 transition active:scale-95 shadow-xs"
                            >
                              <Sparkles className="w-3 h-3 text-[#ff385c]" />
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
                              className="px-3 py-1 bg-[#ff385c] hover:bg-[#e00b41] text-white rounded-full text-[11px] font-semibold flex items-center gap-1 transition active:scale-95 shadow-xs"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reschedule</span>
                            </button>
                          )}

                          <Link
                            href={`/track/${order.trackingNumber}`}
                            onClick={(e) => e.stopPropagation()}
                            target="_blank"
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[#6a6a6a] hover:text-[#222222] hover:bg-[#ebebeb] transition"
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

          {/* Right Column: Selected Order Detail Pane */}
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
