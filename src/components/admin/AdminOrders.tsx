import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  AlertCircle,
  Eye,
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  ArrowUpDown,
  ExternalLink,
  MessageSquare,
  FileText,
  Check,
} from "lucide-react";
import {
  getAdminOrders,
  updateOrderStatus,
  updateOrderPaymentStatus,
  subscribeToOrdersRealtime,
} from "../../lib/orderService";
import type { DbOrder } from "../../types";
import { useAdminOrderNotification } from "../../context/AdminOrderNotificationContext";

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "New",
    bg: "bg-sky-950/60",
    text: "text-sky-300 font-bold",
    border: "border-sky-800/80",
  },
  processing: {
    label: "Processing",
    bg: "bg-blue-950/50",
    text: "text-blue-400",
    border: "border-blue-800/60",
  },
  dispatched: {
    label: "Dispatched",
    bg: "bg-purple-950/50",
    text: "text-purple-400",
    border: "border-purple-800/60",
  },
  completed: {
    label: "Completed",
    bg: "bg-emerald-950/50",
    text: "text-emerald-400",
    border: "border-emerald-800/60",
  },
  cancelled: {
    label: "Cancelled",
    bg: "bg-red-950/50",
    text: "text-red-400",
    border: "border-red-800/60",
  },
};

export function AdminOrders() {
  const { targetOrderId, setTargetOrderId, acknowledgeOrder, isOrderUnacknowledged } = useAdminOrderNotification();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Selected Order Drawer
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<DbOrder["status"]>("pending");
  const [newPaymentStatus, setNewPaymentStatus] = useState<DbOrder["payment_status"]>("pending");

  const loadOrders = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getAdminOrders();
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load orders.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const unsubscribe = subscribeToOrdersRealtime(() => {
      loadOrders();
    });
    return () => unsubscribe();
  }, []);

  // When navigated to from Realtime notification, auto-open target order
  useEffect(() => {
    if (targetOrderId && orders.length > 0) {
      const match = orders.find((o) => o.id === targetOrderId);
      if (match) {
        openOrderDrawer(match);
        setTargetOrderId(null);
      }
    }
  }, [targetOrderId, orders, setTargetOrderId]);

  const openOrderDrawer = (order: DbOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewPaymentStatus(order.payment_status);
    acknowledgeOrder(order.id);
  };

  // Direct "Mark as Paid" action to verify EFT payment
  const handleMarkAsPaid = async (orderId: string, orderNumber?: string) => {
    setUpdatingStatus(true);
    setErrorMsg(null);
    try {
      await updateOrderPaymentStatus(orderId, "paid");
      acknowledgeOrder(orderId);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, payment_status: "paid", updated_at: new Date().toISOString() }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev && prev.id === orderId ? { ...prev, payment_status: "paid" } : prev
      );

      setNewPaymentStatus("paid");
      setSuccessMsg(`Payment confirmed: Order ${orderNumber || "selected"} marked as Paid.`);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to mark order as paid.";
      setErrorMsg(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    setErrorMsg(null);

    try {
      if (newStatus !== selectedOrder.status) {
        await updateOrderStatus(selectedOrder.id, newStatus);
      }
      if (newPaymentStatus !== selectedOrder.payment_status) {
        await updateOrderPaymentStatus(selectedOrder.id, newPaymentStatus);
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? { ...o, status: newStatus, payment_status: newPaymentStatus, updated_at: new Date().toISOString() }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus, payment_status: newPaymentStatus } : null
      );

      setSuccessMsg(`Order ${selectedOrder.order_number} status updated successfully.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update order.";
      setErrorMsg(msg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = orders.length;
    const awaitingEft = orders.filter(
      (o) => o.payment_method !== "card_payfast" && o.payment_status === "pending"
    ).length;
    const pendingFulfilment = orders.filter(
      (o) => o.status === "pending" || o.status === "processing"
    ).length;
    const completed = orders.filter((o) => o.status === "completed").length;
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    return { total, awaitingEft, pendingFulfilment, completed, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      let matchStatus = true;
      if (statusFilter === "Awaiting EFT") {
        matchStatus = o.payment_method !== "card_payfast" && o.payment_status === "pending";
      } else if (statusFilter !== "All") {
        matchStatus = o.status === statusFilter;
      }
      if (!matchStatus) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const numMatch = o.order_number.toLowerCase().includes(q);
      const nameMatch = `${o.customer?.first_name || ""} ${o.customer?.last_name || ""} ${o.customer_name || ""}`.toLowerCase().includes(q);
      const emailMatch = `${o.customer?.email || ""} ${o.customer_email || ""}`.toLowerCase().includes(q);
      const phoneMatch = `${o.customer?.phone || ""} ${o.customer_phone || ""}`.toLowerCase().includes(q);

      return numMatch || nameMatch || emailMatch || phoneMatch;
    });
  }, [orders, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-display uppercase tracking-wider text-white">
              Customer Orders &amp; Fulfilment
            </h1>
            <span className="rounded-md bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Live DB
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Track customer tyre purchases, manage dispatch statuses, and inspect collection / courier orders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-800/80 bg-emerald-950/60 p-3.5 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-900/80 bg-red-950/60 p-3.5 text-xs text-red-200 flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Order Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-neutral-800/90 bg-neutral-900/70 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            Total Orders
          </div>
          <div className="text-2xl font-black font-display text-white">
            {metrics.total}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Recorded in Supabase</div>
        </div>

        <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-1 flex items-center justify-between">
            <span>Awaiting EFT Payment</span>
            {metrics.awaitingEft > 0 && (
              <span className="size-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <div className="text-2xl font-black font-display text-amber-300">
            {metrics.awaitingEft}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-0.5 font-medium">Pending bank deposit verification</div>
        </div>

        <div className="rounded-xl border border-sky-900/40 bg-sky-950/20 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">
            Pending Fulfilment
          </div>
          <div className="text-2xl font-black font-display text-sky-300">
            {metrics.pendingFulfilment}
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">New &amp; processing orders</div>
        </div>

        <div className="rounded-xl border border-neutral-800/90 bg-neutral-900/70 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
            Gross Order Value
          </div>
          <div className="text-2xl font-black font-display text-primary">
            R{metrics.revenue.toLocaleString("en-ZA")}.00
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">Active orders total</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, customer, phone..."
            className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-9 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 shrink-0">
            Filter:
          </span>
          {[
            { id: "All", label: "All Orders" },
            { id: "Awaiting EFT", label: `Awaiting EFT (${metrics.awaitingEft})` },
            { id: "pending", label: "New" },
            { id: "processing", label: "Processing" },
            { id: "dispatched", label: "Dispatched" },
            { id: "completed", label: "Completed" },
            { id: "cancelled", label: "Cancelled" },
          ].map((filterItem) => (
            <button
              key={filterItem.id}
              onClick={() => setStatusFilter(filterItem.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                statusFilter === filterItem.id
                  ? "bg-primary text-white shadow-xs"
                  : filterItem.id === "Awaiting EFT" && metrics.awaitingEft > 0
                  ? "bg-amber-950/70 text-amber-300 border border-amber-800/70 hover:bg-amber-900"
                  : "bg-neutral-800/70 text-neutral-400 hover:text-white hover:bg-neutral-800"
              }`}
            >
              {filterItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-800 bg-neutral-950 text-neutral-400 uppercase tracking-wider font-bold text-[10px]">
              <tr>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Order Date / Time</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-400">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin text-primary" />
                      <span>Loading orders from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-neutral-400">
                    <ShoppingCart size={32} className="mx-auto text-neutral-600 mb-2" />
                    <div className="font-bold text-white uppercase tracking-wider">No Orders Found</div>
                    <div className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                      {searchQuery || statusFilter !== "All"
                        ? "No orders matched your active search or status filter."
                        : "Orders placed by customers through the storefront will display here in real time."}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const cfg = statusConfig[order.status] || statusConfig.pending;
                  const customerName = order.customer
                    ? `${order.customer.first_name} ${order.customer.last_name || ""}`.trim()
                    : order.customer_name || "Store Customer";
                  const customerPhone = order.customer?.phone || order.customer_phone || "";
                  const deliveryLabel = order.delivery_method?.toLowerCase().includes("collection")
                    ? "Selby Collection"
                    : "Nationwide Delivery";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-neutral-800/30 transition-colors group cursor-pointer"
                      onClick={() => openOrderDrawer(order)}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{order.order_number}</span>
                          {isOrderUnacknowledged(order.id) && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider shadow-xs animate-pulse">
                              New
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {deliveryLabel}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{customerName}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {customerPhone || "No phone"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-display font-bold text-white text-sm whitespace-nowrap">
                        R{Number(order.total).toLocaleString("en-ZA")}.00
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded bg-neutral-800 border border-neutral-700/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-neutral-200">
                          {order.payment_method === "card_payfast" ? "PayFast" : "EFT"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          {order.payment_status === "paid" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                              <span>Paid</span>
                            </span>
                          ) : order.payment_method !== "card_payfast" ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/80">
                                <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                                <span>Pending EFT / Awaiting Payment</span>
                              </span>
                              <div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsPaid(order.id, order.order_number);
                                  }}
                                  disabled={updatingStatus}
                                  className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                  title="Confirm bank payment received"
                                >
                                  <Check size={11} />
                                  <span>Mark as Paid</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-800/80">
                              <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                              <span>Pending PayFast</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap text-[11px]">
                        {new Date(order.created_at).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openOrderDrawer(order);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-800 px-2.5 py-1 text-xs text-white hover:bg-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                          {order.payment_status !== "paid" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsPaid(order.id, order.order_number);
                              }}
                              disabled={updatingStatus}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                              title="Mark order as paid once bank deposit is confirmed"
                            >
                              <Check size={12} />
                              <span>Mark as Paid</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ORDER DETAILS DRAWER */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrder(null)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
            <div className="w-screen max-w-lg bg-card text-foreground shadow-2xl flex flex-col border-l border-border animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-5 bg-neutral-950 text-white">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-lg uppercase tracking-tight text-white">
                      Order {selectedOrder.order_number}
                    </h2>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        (statusConfig[selectedOrder.status] || statusConfig.pending).bg
                      } ${(statusConfig[selectedOrder.status] || statusConfig.pending).text} ${
                        (statusConfig[selectedOrder.status] || statusConfig.pending).border
                      }`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Placed on {new Date(selectedOrder.created_at).toLocaleString("en-ZA")}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="grid size-9 place-items-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Customer Information Card */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Customer Details
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">ID: {selectedOrder.customer_id?.substring(0, 8)}...</span>
                  </div>

                  {(() => {
                    const drawerCustomerName = selectedOrder.customer
                      ? `${selectedOrder.customer.first_name} ${selectedOrder.customer.last_name || ""}`.trim()
                      : selectedOrder.customer_name || "Store Customer";
                    const drawerPhone = selectedOrder.customer?.phone || selectedOrder.customer_phone;
                    const drawerEmail = selectedOrder.customer?.email || selectedOrder.customer_email;
                    const drawerAddress =
                      selectedOrder.delivery_address ||
                      selectedOrder.shipping_address ||
                      (selectedOrder.delivery_method?.includes("(") ? selectedOrder.delivery_method : null);

                    return (
                      <>
                        <div className="text-sm font-bold text-white">
                          {drawerCustomerName}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {drawerPhone && (
                            <div className="flex items-center gap-2 text-neutral-300">
                              <Phone size={13} className="text-primary" />
                              <a href={`tel:${drawerPhone}`} className="hover:underline font-mono">
                                {drawerPhone}
                              </a>
                            </div>
                          )}
                          {drawerEmail && (
                            <div className="flex items-center gap-2 text-neutral-300">
                              <Mail size={13} className="text-primary" />
                              <a href={`mailto:${drawerEmail}`} className="hover:underline truncate">
                                {drawerEmail}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Customer Quick WhatsApp Link */}
                        {drawerPhone && (
                          <div className="pt-2">
                            <a
                              href={`https://wa.me/${drawerPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                                `Hi ${drawerCustomerName}, this is Costa from R&C Commodities regarding your tyre order ${selectedOrder.order_number}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800/80 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-900 transition-colors"
                            >
                              <MessageSquare size={13} />
                              <span>WhatsApp Customer Directly</span>
                            </a>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Fulfilment Details */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-2 text-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Fulfilment / Delivery
                  </div>
                  <div className="flex items-start gap-2 text-neutral-300">
                    <MapPin size={15} className="text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div>
                        <strong className="text-white block">
                          {selectedOrder.delivery_method?.toLowerCase().includes("collection")
                            ? "Workshop Collection & Fitment"
                            : "Free Nationwide Delivery"}
                        </strong>
                        <span className="text-neutral-400 text-[11px]">
                          {selectedOrder.delivery_method?.toLowerCase().includes("collection")
                            ? "39 Webber St, Selby, Johannesburg (Direct Importer Depot)."
                            : "Dispatched from Selby warehouse depot directly to customer doorstep."}
                        </span>
                      </div>
                      {(selectedOrder.delivery_address || selectedOrder.shipping_address) && (
                        <div className="pt-1.5 border-t border-neutral-800/80 text-[11px]">
                          <span className="text-neutral-400 font-bold uppercase text-[10px] block">
                            Destination Address:
                          </span>
                          <span className="text-white font-medium">
                            {selectedOrder.delivery_address || selectedOrder.shipping_address}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                    Ordered Fitments &amp; Items
                  </span>

                  {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                    <div className="divide-y divide-neutral-800 text-xs">
                      {selectedOrder.order_items.map((it) => (
                        <div key={it.id} className="py-2.5 flex items-center justify-between gap-3">
                          <div>
                            <div className="font-semibold text-white">{it.product_name}</div>
                            <div className="text-neutral-500 text-[11px]">
                              {it.quantity} x R{Number(it.unit_price).toLocaleString("en-ZA")}.00
                            </div>
                          </div>
                          <div className="font-display font-bold text-white">
                            R{Number(it.subtotal).toLocaleString("en-ZA")}.00
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 italic py-2">
                      No item rows returned for this order.
                    </div>
                  )}

                  <div className="pt-3 border-t border-neutral-800 flex items-baseline justify-between text-sm">
                    <span className="font-bold uppercase tracking-wider text-neutral-400">Total Amount</span>
                    <span className="font-display text-xl font-black text-primary">
                      R{Number(selectedOrder.total).toLocaleString("en-ZA")}.00
                    </span>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/70 p-4 space-y-3 text-xs">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Payment Information
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Payment Method:</span>
                    <span className="font-semibold text-white">
                      {selectedOrder.payment_method === "card_payfast"
                        ? "Payfast Online (Card / Instant EFT)"
                        : "Direct Bank EFT (Standard Bank Selby)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-neutral-800/60">
                    <span className="text-neutral-400">Payment Status:</span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        selectedOrder.payment_status === "paid"
                          ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
                          : selectedOrder.payment_method !== "card_payfast"
                          ? "bg-amber-950/80 text-amber-300 border border-amber-800/80"
                          : "bg-amber-950/60 text-amber-400 border border-amber-800/60"
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${selectedOrder.payment_status === "paid" ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                      <span>
                        {selectedOrder.payment_status === "paid"
                          ? "Paid (Confirmed)"
                          : selectedOrder.payment_method !== "card_payfast"
                          ? "Pending EFT / Awaiting Payment"
                          : "Pending (PayFast)"}
                      </span>
                    </span>
                  </div>
                  {selectedOrder.payment_reference && (
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-neutral-400">Payment / Audit Reference:</span>
                      <span className="font-mono text-primary font-bold">
                        {selectedOrder.payment_reference}
                      </span>
                    </div>
                  )}

                  {/* PROMINENT DIRECT "MARK AS PAID" ACTION FOR EFT ORDERS AWAITING PAYMENT */}
                  {selectedOrder.payment_status !== "paid" && (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-amber-400 shrink-0" />
                          <span className="text-xs font-bold text-amber-200 uppercase tracking-wide">
                            {selectedOrder.payment_method !== "card_payfast"
                              ? "Awaiting EFT Bank Deposit"
                              : "Awaiting PayFast Online Payment"}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-900/60 text-amber-300">
                          Ref: {selectedOrder.payment_reference || selectedOrder.order_number}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed">
                        Please verify that the customer payment of{" "}
                        <strong className="text-white font-mono font-bold">
                          R{Number(selectedOrder.total).toLocaleString("en-ZA")}.00
                        </strong>{" "}
                        reflects in the R&amp;C Commodities Standard Bank account before fulfilling the order.
                      </p>
                      <button
                        onClick={() => handleMarkAsPaid(selectedOrder.id, selectedOrder.order_number)}
                        disabled={updatingStatus}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        {updatingStatus ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Updating Supabase...</span>
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            <span>Mark as Paid (Confirm Bank Deposit Received)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {selectedOrder.payment_status === "paid" && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/70 flex items-center justify-between text-xs text-emerald-300">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span className="font-bold">Payment Confirmed &amp; Received</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400/90">
                        {selectedOrder.paid_at
                          ? new Date(selectedOrder.paid_at).toLocaleDateString("en-ZA", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Verified Paid"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Update Controls */}
                <div className="rounded-xl border border-neutral-800 bg-neutral-900/90 p-4 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-white block">
                    Update Fulfilment &amp; Payment Status
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                        Order Status (Fulfilment)
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as DbOrder["status"])}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      >
                        <option value="pending">New</option>
                        <option value="processing">Processing</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold uppercase text-neutral-400 block mb-1">
                        Payment Status
                      </label>
                      <select
                        value={newPaymentStatus}
                        onChange={(e) => setNewPaymentStatus(e.target.value as DbOrder["payment_status"])}
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-primary focus:outline-none"
                      >
                        <option value="pending">Pending EFT / Awaiting Payment</option>
                        <option value="paid">Paid (Verified)</option>
                        <option value="refunded">Refunded</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleUpdateStatus}
                    disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-hover shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {updatingStatus ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Updating Supabase...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Save Status Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
