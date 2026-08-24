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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dddddd] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#ebebeb] flex items-center justify-between bg-[#f7f7f7]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[#222222] flex items-center justify-center">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#222222]">System Notification Center</h3>
              <p className="text-xs text-[#6a6a6a]">
                Live simulated Email & SMS notifications dispatched across the delivery journey.
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

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 text-[#222222]">
          {loading ? (
            <div className="py-12 text-center text-[#6a6a6a] animate-pulse text-xs">
              Loading notification logs...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-[#929292] text-xs">
              No notifications generated yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 bg-[#f7f7f7] border border-[#ebebeb] hover:border-[#dddddd] rounded-2xl text-xs space-y-2 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        n.channel === "EMAIL"
                          ? "bg-[#e8f0fe] text-[#1a73e8] border border-[#d2e3fc]"
                          : "bg-[#e6f4ea] text-[#137333] border border-[#ceead6]"
                      }`}
                    >
                      {n.channel === "EMAIL" ? <Mail className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                      {n.channel}
                    </span>
                    <span className="font-bold text-[#222222]">{n.subject}</span>
                  </div>

                  <span className="text-[10px] text-[#6a6a6a] font-mono">
                    {n.sentAt ? format(new Date(n.sentAt), "MMM dd, HH:mm") : ""}
                  </span>
                </div>

                <p className="text-[#3f3f3f] text-xs leading-relaxed">{n.content}</p>

                <div className="flex items-center justify-between pt-2 border-t border-[#ebebeb] text-[10px] text-[#6a6a6a] font-mono">
                  <span>
                    To: {n.recipientEmail || n.recipientPhone || "Recipient"}
                  </span>
                  <span className="text-[#137333] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {n.status}
                  </span>
                </div>
              </div>
            ))
          )}
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
