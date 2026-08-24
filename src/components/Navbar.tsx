"use client";

import React from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Bell,
  Sliders,
  LogOut,
  Calculator,
  User,
  MapPin,
  Sparkles,
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
    <header className="sticky top-0 z-40 bg-white border-b border-[#ebebeb] text-[#222222]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#ff385c] flex items-center justify-center text-white shadow-sm group-hover:bg-[#e00b41] transition">
                <Package className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#ff385c]">
                  LastMile<span className="text-[#222222]">IQ</span>
                </span>
                <span className="text-[10px] font-medium tracking-wide text-[#6a6a6a] -mt-1 hidden sm:block">
                  Delivery Intelligence
                </span>
              </div>
            </Link>
          </div>

          {/* Center Product Navigation Archetype (Airbnb Homes / Experiences / Services adapted) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#222222]">
            <Link
              href="/"
              className="relative py-2 text-[#222222] font-semibold flex items-center gap-2 group"
            >
              <span>Shipments</span>
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#222222] rounded-full" />
            </Link>

            <button
              onClick={onOpenRateCalculator}
              className="py-2 text-[#6a6a6a] hover:text-[#222222] font-medium flex items-center gap-1.5 transition"
            >
              <span>Rate Calculator</span>
            </button>

            {currentUser?.role === "ADMIN" && onOpenRateManager && (
              <button
                onClick={onOpenRateManager}
                className="py-2 text-[#6a6a6a] hover:text-[#222222] font-medium flex items-center gap-1.5 transition relative"
              >
                <span>Rate Cards</span>
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#f7f7f7] text-[#222222] border border-[#dddddd]">
                  Admin
                </span>
              </button>
            )}
          </nav>

          {/* Action Navigation Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Rate Calculator Pill */}
            <button
              onClick={onOpenRateCalculator}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#222222] bg-white hover:bg-[#f7f7f7] border border-[#dddddd] hover:border-[#222222] transition"
              title="Estimate Delivery Charges"
            >
              <Calculator className="w-3.5 h-3.5 text-[#6a6a6a]" />
              <span>Quote Engine</span>
            </button>

            {/* Notification Bell Circle */}
            <button
              onClick={onOpenNotifications}
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#222222] bg-white hover:bg-[#f7f7f7] border border-[#dddddd] hover:border-[#222222] transition"
              title="View Notification Logs"
            >
              <Bell className="w-4 h-4 text-[#222222]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff385c] text-[9px] font-bold text-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Create Order Primary Button (Airbnb Rausch CTA) */}
            {(currentUser?.role === "CUSTOMER" || currentUser?.role === "ADMIN") && (
              <button
                onClick={onOpenCreateOrder}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-[#ff385c] hover:bg-[#e00b41] active:scale-[0.98] shadow-sm transition duration-150"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>New Shipment</span>
              </button>
            )}

            {/* User Profile Pill */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-[#ebebeb]">
                <div className="hidden sm:flex items-center gap-2 bg-[#f7f7f7] border border-[#dddddd] rounded-full px-3 py-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#222222] text-white flex items-center justify-center text-[10px] font-bold">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-xs font-semibold text-[#222222] max-w-[100px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-[#6a6a6a] font-medium">
                      {currentUser.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#6a6a6a] hover:text-[#c13515] hover:bg-[#fdf2f2] transition"
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
