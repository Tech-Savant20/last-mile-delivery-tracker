"use client";

import React from "react";
import { ShieldCheck, User, Truck, Briefcase, Sparkles } from "lucide-react";

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
      label: "Alex Vance",
      badge: "Admin",
      role: "ADMIN",
      subtext: "Full Operations & Rates Control",
      icon: ShieldCheck,
    },
    {
      key: "customer_b2c",
      label: "Alice Green",
      badge: "B2C Consumer",
      role: "CUSTOMER",
      subtext: "Retail Customer",
      icon: User,
    },
    {
      key: "customer_b2b",
      label: "TechCorp Global",
      badge: "B2B Freight",
      role: "CUSTOMER",
      subtext: "Commercial Enterprise",
      icon: Briefcase,
    },
    {
      key: "agent_north",
      label: "John Miller",
      badge: "North Agent",
      role: "AGENT",
      subtext: "North Zone Rider",
      icon: Truck,
    },
    {
      key: "agent_south",
      label: "Sarah Chen",
      badge: "South Agent",
      role: "AGENT",
      subtext: "South Zone Rider",
      icon: Truck,
    },
  ];

  return (
    <div className="bg-[#f7f7f7] border-b border-[#ebebeb] px-4 py-2 text-xs text-[#3f3f3f]">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium text-[#222222]">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff385c] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff385c]"></span>
          </span>
          <span className="text-[11px] font-semibold tracking-wider text-[#6a6a6a] uppercase">
            Demo Persona Switcher:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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
                title={`${item.label} (${item.badge}) - ${item.subtext}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition duration-150 ${
                  isCurrent
                    ? "bg-[#222222] text-white shadow-sm border border-[#222222]"
                    : "bg-white hover:bg-[#f7f7f7] text-[#222222] border border-[#dddddd] hover:border-[#222222]"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? "text-white" : "text-[#6a6a6a]"}`} />
                <span>{item.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                    isCurrent
                      ? "bg-[#ff385c] text-white"
                      : "bg-[#f2f2f2] text-[#6a6a6a]"
                  }`}
                >
                  {item.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
