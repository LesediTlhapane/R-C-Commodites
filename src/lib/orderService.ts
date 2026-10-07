import { supabase, isSupabaseConfigured } from "./supabase";
import type { DbOrder, DbCustomer, DbOrderItem } from "../types";

export interface CreateOrderPayload {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  delivery: {
    address: string;
    city: string;
    postalCode: string;
  };
  items: Array<{
    title: string;
    subtitle: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  paymentMethod: "card_payfast" | "eft_bank";
  paymentReference?: string;
  notes?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderNumber: string;
  orderId?: string;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentReference: string;
  paymentStatus: string;
  deliveryMethod: string;
  deliveryAddress: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: Array<{
    title: string;
    subtitle: string;
    quantity: number;
    price: number;
  }>;
  savedToDatabase: boolean;
  error?: string;
}

/**
 * Generates an order number in format: RC-YYYY-XXXX
 */
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RC-${year}-${rand}`;
}

/**
 * Creates an order in Supabase.
 * Strictly uses 'pending' as the initial payment_status to comply with
 * the database check constraint: orders_payment_status_check
 */
export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
  const orderNumber = generateOrderNumber();
  const paymentRef = payload.paymentReference || orderNumber;
  const deliveryAddress = `${payload.delivery.address}, ${payload.delivery.city} ${payload.delivery.postalCode}`.trim();
  const subtotal = payload.total;

  const fallbackResult: CreateOrderResult = {
    success: true,
    orderNumber,
    subtotal,
    total: payload.total,
    paymentMethod: payload.paymentMethod,
    paymentReference: paymentRef,
    paymentStatus: "pending",
    deliveryMethod: "Nationwide Delivery",
    deliveryAddress,
    customer: payload.customer,
    items: payload.items,
    savedToDatabase: false,
  };

  if (!isSupabaseConfigured()) {
    console.warn("[orderService] Supabase not configured. Using local fallback.");
    return fallbackResult;
  }

  try {
    // 1. Create or match customer in public.customers
    let customerId: string | null = null;

    if (payload.customer.email) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("email", payload.customer.email.toLowerCase().trim())
        .maybeSingle();

      if (existingCustomer?.id) {
        customerId = existingCustomer.id;
      }
    }

    if (!customerId) {
      const { data: newCustomer, error: custErr } = await supabase
        .from("customers")
        .insert([
          {
            first_name: payload.customer.firstName.trim(),
            last_name: payload.customer.lastName.trim(),
            email: payload.customer.email.toLowerCase().trim(),
            phone: payload.customer.phone.trim(),
          },
        ])
        .select("id")
        .single();

      if (!custErr && newCustomer?.id) {
        customerId = newCustomer.id;
      } else {
        console.warn("[orderService] Customer insert notice:", custErr?.message);
      }
    }

    // 2. Insert order record into public.orders
    const orderRecord = {
      order_number: orderNumber,
      customer_id: customerId,
      status: "pending",
      payment_status: "pending",
      subtotal,
      delivery_fee: 0,
      total: payload.total,
      delivery_method: "Nationwide Delivery",
      delivery_address_line1: deliveryAddress,
      payment_reference: paymentRef,
      payment_method: payload.paymentMethod,
      payment_provider: payload.paymentMethod === "card_payfast" ? "payfast" : "bank_eft",
      payment_metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedOrder, error: orderErr } = await supabase
      .from("orders")
      .insert([orderRecord])
      .select("id, order_number, total, payment_status")
      .single();

    if (orderErr || !insertedOrder) {
      console.error("[orderService] Error inserting order:", orderErr?.message);
      return { ...fallbackResult, savedToDatabase: false, error: orderErr?.message };
    }

    const orderId = insertedOrder.id;

    // 3. Insert order items into public.order_items
    if (payload.items.length > 0) {
      const itemRows = payload.items.map((item) => ({
        order_id: orderId,
        product_name: `${item.title} ${item.subtitle}`.trim(),
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
      if (itemsErr) {
        console.warn("[orderService] Notice on inserting order_items:", itemsErr.message);
      }
    }

    return {
      success: true,
      orderNumber,
      orderId,
      subtotal,
      total: payload.total,
      paymentMethod: payload.paymentMethod,
      paymentReference: paymentRef,
      paymentStatus: "pending",
      deliveryMethod: "Nationwide Delivery",
      deliveryAddress,
      customer: payload.customer,
      items: payload.items,
      savedToDatabase: true,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected database error";
    console.error("[orderService] Database exception on order creation:", errorMsg);
    return { ...fallbackResult, savedToDatabase: false, error: errorMsg };
  }
}

/**
 * Fetches order details by order_number
 */
export async function getOrderByNumber(orderNumber: string): Promise<DbOrder | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, customer:customers(*), order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !data) return null;
    return data as DbOrder;
  } catch {
    return null;
  }
}

/**
 * Fetches an order status by order number from server API first, then falls back to Supabase directly.
 */
export async function fetchServerPaymentStatus(orderNumber: string): Promise<{
  success: boolean;
  paymentStatus: string;
  orderStatus: string;
  order?: any;
}> {
  try {
    const res = await fetch(`/api/payfast/status/${orderNumber}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success) {
        return {
          success: true,
          paymentStatus: json.paymentStatus,
          orderStatus: json.orderStatus,
          order: json.order,
        };
      }
    }
  } catch {
    // Continue to database check
  }

  const dbOrder = await getOrderByNumber(orderNumber);
  if (dbOrder) {
    return {
      success: true,
      paymentStatus: dbOrder.payment_status,
      orderStatus: dbOrder.status,
      order: dbOrder,
    };
  }

  return { success: false, paymentStatus: "pending", orderStatus: "pending" };
}

/**
 * Fetches all orders with joined customer and item details for the Admin Portal.
 */
export async function getAdminOrders(): Promise<DbOrder[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, customer:customers(*), order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[orderService] Error fetching admin orders:", error.message);
      return [];
    }

    return (data || []) as DbOrder[];
  } catch (err) {
    console.error("[orderService] Exception fetching admin orders:", err);
    return [];
  }
}

/**
 * Real-time subscription to orders table changes for Admin Portal.
 */
export function subscribeToOrdersRealtime(onUpdate: () => void): () => void {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel("orders_realtime_admin")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => {
        onUpdate();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}

/**
 * Helper to retrieve currently authenticated Supabase access token for API authorization.
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  } catch {
    // If auth unavailable, return empty
  }
  return {};
}

/**
 * Updates an order status in Supabase (Admin action).
 */
export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "processing" | "dispatched" | "completed" | "cancelled"
): Promise<void> {
  const authHeader = await getAuthHeader();

  // 1. First attempt backend update route (handles server cache & service authority)
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ status }),
    });
    if (res.ok) return;
  } catch {
    // Continue to fallback
  }

  try {
    const res = await fetch("/api/orders/update", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ orderId, status }),
    });
    if (res.ok) return;
  } catch {
    // Continue to fallback
  }

  // 2. Direct Supabase client update fallback
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}

/**
 * Updates an order's payment status in Supabase (Admin action).
 * Strictly complies with orders_payment_status_check database constraint.
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: "pending" | "paid" | "refunded" | "cancelled" | "failed"
): Promise<void> {
  const authHeader = await getAuthHeader();

  // 1. First attempt backend update route (handles server cache & service authority)
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
    if (res.ok) return;
  } catch {
    // Continue to fallback
  }

  try {
    const res = await fetch("/api/orders/update", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ orderId, payment_status: paymentStatus }),
    });
    if (res.ok) return;
  } catch {
    // Continue to fallback
  }

  // 2. Direct Supabase client update fallback
  if (!isSupabaseConfigured()) return;

  const payload: Record<string, unknown> = {
    payment_status: paymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (paymentStatus === "paid") {
    payload.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update payment status: ${error.message}`);
  }
}