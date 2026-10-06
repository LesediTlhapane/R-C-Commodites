import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { getAdminOrders, subscribeToOrdersRealtime } from "../lib/orderService";
import type { DbOrder } from "../types";
import { useRouter } from "../lib/router";

export interface NewOrderNotificationData {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

interface AdminOrderNotificationContextType {
  unacknowledgedCount: number;
  latestNotification: NewOrderNotificationData | null;
  targetOrderId: string | null;
  isOrderUnacknowledged: (orderId: string) => boolean;
  acknowledgeOrder: (orderId: string) => void;
  dismissNotification: () => void;
  viewOrder: (order: NewOrderNotificationData) => void;
  setTargetOrderId: (orderId: string | null) => void;
  refreshOrders: () => Promise<void>;
}

const AdminOrderNotificationContext = createContext<AdminOrderNotificationContextType | undefined>(undefined);

const ACKNOWLEDGED_STORAGE_KEY = "rc_admin_acknowledged_orders";

function getStoredAcknowledgedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ACKNOWLEDGED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // Ignore error
  }
  return new Set();
}

function saveAcknowledgedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(ACKNOWLEDGED_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore error
  }
}

export function AdminOrderNotificationProvider({ children }: { children: React.ReactNode }) {
  const { navigate } = useRouter();
  const [unacknowledgedIds, setUnacknowledgedIds] = useState<Set<string>>(new Set());
  const [latestNotification, setLatestNotification] = useState<NewOrderNotificationData | null>(null);
  const [targetOrderId, setTargetOrderId] = useState<string | null>(null);

  const calculateUnacknowledged = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const orders = await getAdminOrders();
      const acknowledged = getStoredAcknowledgedIds();
      // An order is unacknowledged if its order status is 'pending' (New) and admin hasn't opened it yet
      const unack = new Set<string>();
      for (const ord of orders) {
        if (ord.status === "pending" && !acknowledged.has(ord.id)) {
          unack.add(ord.id);
        }
      }
      setUnacknowledgedIds(unack);
    } catch (err) {
      console.warn("[AdminNotification] Error calculating unacknowledged orders:", err);
    }
  }, []);

  useEffect(() => {
    calculateUnacknowledged();

    // Listen to real-time changes on public.orders
    const unsubscribe = subscribeToOrdersRealtime(async (payload) => {
      // Recalculate counts on any order change
      calculateUnacknowledged();

      // Specifically on INSERT of a new order, display the prompt notification banner
      if (payload?.eventType === "INSERT" && payload.new) {
        const newRow = payload.new;
        let customerName = "New Customer";

        if (newRow.customer_id) {
          try {
            const { data: cust } = await supabase
              .from("customers")
              .select("first_name, last_name")
              .eq("id", newRow.customer_id)
              .maybeSingle();

            if (cust) {
              customerName = `${cust.first_name || ""} ${cust.last_name || ""}`.trim() || customerName;
            }
          } catch {
            // Keep fallback
          }
        }

        const paymentLabel =
          newRow.payment_method === "card_payfast"
            ? "Payfast Online"
            : newRow.payment_status === "paid"
            ? "Paid"
            : "Pending EFT";

        const notif: NewOrderNotificationData = {
          id: newRow.id,
          orderNumber: newRow.order_number,
          customerName,
          total: Number(newRow.total) || 0,
          paymentMethod: newRow.payment_method === "card_payfast" ? "Payfast" : "Direct EFT",
          paymentStatus: paymentLabel,
        };

        setLatestNotification(notif);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [calculateUnacknowledged]);

  const acknowledgeOrder = useCallback((orderId: string) => {
    if (!orderId) return;
    const stored = getStoredAcknowledgedIds();
    stored.add(orderId);
    saveAcknowledgedIds(stored);

    setUnacknowledgedIds((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });

    setLatestNotification((current) => (current?.id === orderId ? null : current));
  }, []);

  const dismissNotification = useCallback(() => {
    if (latestNotification) {
      // Dismissing the alert popup also marks that specific order as acknowledged
      acknowledgeOrder(latestNotification.id);
    }
    setLatestNotification(null);
  }, [latestNotification, acknowledgeOrder]);

  const viewOrder = useCallback(
    (order: NewOrderNotificationData) => {
      acknowledgeOrder(order.id);
      setLatestNotification(null);
      setTargetOrderId(order.id);
      navigate("/admin/orders");
    },
    [acknowledgeOrder, navigate]
  );

  const isOrderUnacknowledged = useCallback(
    (orderId: string): boolean => {
      return unacknowledgedIds.has(orderId);
    },
    [unacknowledgedIds]
  );

  return (
    <AdminOrderNotificationContext.Provider
      value={{
        unacknowledgedCount: unacknowledgedIds.size,
        latestNotification,
        targetOrderId,
        isOrderUnacknowledged,
        acknowledgeOrder,
        dismissNotification,
        viewOrder,
        setTargetOrderId,
        refreshOrders: calculateUnacknowledged,
      }}
    >
      {children}
    </AdminOrderNotificationContext.Provider>
  );
}

export function useAdminOrderNotification() {
  const context = useContext(AdminOrderNotificationContext);
  if (!context) {
    throw new Error("useAdminOrderNotification must be used within AdminOrderNotificationProvider");
  }
  return context;
}
