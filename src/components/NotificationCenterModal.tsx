"use client";

import React, { useState, useEffect } from "react";
import { X, Bell, Mail, MessageSquare, Clock, CheckCircle2, Shield } from "lucide-react";
import { format } from "date-fns";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications?limit=30");
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">System Notification Center</h3>
              <p className="text-xs text-slate-400">
                Live simulated Email & SMS notifications dispatched across the delivery journey.
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

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse text-xs">
              Loading notification logs...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No notifications generated yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs space-y-1.5 hover:border-slate-600 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        n.channel === "EMAIL"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {n.channel === "EMAIL" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      {n.channel}
                    </span>
                    <span className="font-semibold text-white">{n.subject}</span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {n.sentAt ? format(new Date(n.sentAt), "MMM dd, HH:mm") : ""}
                  </span>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">{n.content}</p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-750 text-[10px] text-slate-400 font-mono">
                  <span>
                    To: {n.recipientEmail || n.recipientPhone || "Recipient"}
                  </span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {n.status}
                  </span>
                </div>
              </div>
            ))
          )}
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
