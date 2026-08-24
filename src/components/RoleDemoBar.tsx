"use client";

import React from "react";
import { ShieldCheck, User, Truck, Briefcase, Zap } from "lucide-react";

interface RoleDemoBarProps {
  currentUser: any;
  onSwitchUser: (roleKey: string) => Promise<void>;
  isLoading?: boolean;
}

export const RoleDemoBar: React.FC<RoleDemoBarProps> = ({
  currentUser,
  onSwitchUser,
  isLoading = false,
}) => {
  const demoUsers = [
    {
      key: "admin",
      label: "Alex Vance (Admin)",
      role: "ADMIN",
      subtext: "Full Operations & Rates Control",
      icon: ShieldCheck,
      color: "bg-purple-600 text-white hover:bg-purple-700",
      activeRing: "ring-purple-400 bg-purple-900/60 text-purple-200 border-purple-500",
    },
    {
      key: "customer_b2c",
      label: "Alice Green (B2C)",
      role: "CUSTOMER",
      subtext: "Retail Consumer",
      icon: User,
      color: "bg-blue-600 text-white hover:bg-blue-700",
      activeRing: "ring-blue-400 bg-blue-900/60 text-blue-200 border-blue-500",
    },
    {
      key: "customer_b2b",
      label: "TechCorp Global (B2B)",
      role: "CUSTOMER",
      subtext: "Bulk Freight Logistics",
      icon: Briefcase,
      color: "bg-indigo-600 text-white hover:bg-indigo-700",
      activeRing: "ring-indigo-400 bg-indigo-900/60 text-indigo-200 border-indigo-500",
    },
    {
      key: "agent_north",
      label: "John Miller (Agent)",
      role: "AGENT",
      subtext: "North Zone Rider",
      icon: Truck,
      color: "bg-emerald-600 text-white hover:bg-emerald-700",
      activeRing: "ring-emerald-400 bg-emerald-900/60 text-emerald-200 border-emerald-500",
    },
    {
      key: "agent_south",
      label: "Sarah Chen (Agent)",
      role: "AGENT",
      subtext: "South Zone Rider",
      icon: Truck,
      color: "bg-teal-600 text-white hover:bg-teal-700",
      activeRing: "ring-teal-400 bg-teal-900/60 text-teal-200 border-teal-500",
    },
  ];

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold tracking-wide uppercase text-[10px] text-slate-400">1-Click Role Switcher:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {demoUsers.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              currentUser &&
              (currentUser.email?.includes(item.key.split("_")[0]) ||
                currentUser.name?.toLowerCase().includes(item.label.split(" ")[0].toLowerCase()));

            return (
              <button
                key={item.key}
                onClick={() => onSwitchUser(item.key)}
                disabled={isLoading}
                title={`${item.label} - ${item.subtext}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition border ${
                  isCurrent
                    ? `${item.activeRing} ring-2 ring-offset-1 ring-offset-slate-900 font-semibold shadow-sm`
                    : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {isCurrent && (
                  <span className="ml-1 text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-mono uppercase">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
