"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  Search,
  Bell,
  Sliders,
  LogOut,
  MapPin,
  Calculator,
  UserCheck,
} from "lucide-react";

interface NavbarProps {
  currentUser: any;
  onOpenCreateOrder: () => void;
  onOpenRateCalculator: () => void;
  onOpenNotifications: () => void;
  onOpenRateManager?: () => void;
  onLogout: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenCreateOrder,
  onOpenRateCalculator,
  onOpenNotifications,
  onOpenRateManager,
  onLogout,
  unreadCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition transform">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  LastMile<span className="text-cyan-400 font-extrabold">IQ</span>
                </span>
                <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400 -mt-1">
                  Delivery Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Action Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rate Calculator Button */}
            <button
              onClick={onOpenRateCalculator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              title="Estimate Delivery Charges"
            >
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Rate Calculator</span>
            </button>

            {/* Admin Rate Configurator */}
            {currentUser?.role === "ADMIN" && onOpenRateManager && (
              <button
                onClick={onOpenRateManager}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-300 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 transition"
                title="Configure Rate Cards & Surcharges"
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span className="hidden md:inline">Rate Cards & Zones</span>
              </button>
            )}

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition"
              title="View Notification Logs"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Create Order Button */}
            {(currentUser?.role === "CUSTOMER" || currentUser?.role === "ADMIN") && (
              <button
                onClick={onOpenCreateOrder}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 transition transform active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Order</span>
              </button>
            )}

            {/* User Profile Pill */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-medium text-slate-200 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        currentUser.role === "ADMIN"
                          ? "bg-purple-400"
                          : currentUser.role === "AGENT"
                          ? "bg-emerald-400"
                          : "bg-blue-400"
                      }`}
                    />
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
