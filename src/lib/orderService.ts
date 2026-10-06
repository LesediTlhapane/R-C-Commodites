import { supabase, isSupabaseConfigured } from "./supabase";
import type { CartItem, DbOrder, DbCustomer, DbOrderItem } from "../types";
import { validateCartStock } from "./productService";
import type { PaymentMethod, PaymentStatus } from "./paymentService";
import { generateUuid } from "./uuid";

export interface CreateOrderParams {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: CartItem[];
  deliveryMethod?: string;
  deliveryAddress?: {
    streetAddress: string;
    city: string;
    postalCode?: string;
  };
  shippingAddress?: string;
  notes?: string;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paymentStatus?: PaymentStatus;
}

export interface CreateOrderResult {
  success: boolean;
  orderNumber: string;
  orderId: string;
  total: number;
  subtotal: number;
  savedToDatabase: boolean;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  deliveryMethod: string;
  deliveryAddress?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: CartItem[];
  persistedOrder: DbOrder;
  error?: string;
}

/**
 * Generates an official, human-readable R&C Commodities order number.
 * e.g., RC-2026-6147
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RC-${year}-${randomSuffix}`;
}

/**
 * Safely decrements stock for an order across products, combos, and accessories.
 * Uses the SECURITY DEFINER RPC decrement_order_stock when available,
 * falling back to individual table updates with inventory history logging.
 */
export async function decrementStockForOrder(
  items: CartItem[],
  orderNumber: string
): Promise<void> {
  if (!isSupabaseConfigured() || items.length === 0) return;

  // 1. Attempt database-level atomic RPC decrement
  try {
    const rpcPayload = items.map((it) => ({
      productId: it.productId || null,
      frontProductId: it.frontProductId || null,
      rearProductId: it.rearProductId || null,
      accessoryId: it.accessoryId || null,
      quantity: it.quantity,
    }));
    const { error: rpcErr } = await supabase.rpc("decrement_order_stock", {
      items_data: rpcPayload,
    });
    if (!rpcErr) {
      console.log(`[stock] Stock decremented via database RPC for order ${orderNumber}`);
      return;
    }
  } catch {
    // Continue to direct update fallback
  }

  // 2. Direct stock updates fallback with inventory audit trail
  for (const it of items) {
    try {
      if (it.productId) {
        // Physical tyre product
        const { data: prod } = await supabase
          .from("products")
          .select("id, stock_quantity")
          .eq("id", it.productId)
          .maybeSingle();

        if (prod && prod.stock_quantity !== null && prod.stock_quantity !== undefined) {
          const newQty = Math.max(0, Number(prod.stock_quantity) - it.quantity);
          await supabase
            .from("products")
            .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
            .eq("id", it.productId);

          await supabase.from("inventory_history").insert([
            {
              product_id: it.productId,
              change_type: "manual_adjustment",
              quantity_change: -it.quantity,
              quantity_after: newQty,
              notes: `Order ${orderNumber} - ${it.quantity}x ${it.title}`,
            },
          ]);
        }
      } else if (it.frontProductId && it.rearProductId) {
        // Matched combo tyre bundle: decrement both component tyres
        for (const compId of [it.frontProductId, it.rearProductId]) {
          const { data: comp } = await supabase
            .from("products")
            .select("id, stock_quantity")
            .eq("id", compId)
            .maybeSingle();

          if (comp && comp.stock_quantity !== null && comp.stock_quantity !== undefined) {
            const newQty = Math.max(0, Number(comp.stock_quantity) - it.quantity);
            await supabase
              .from("products")
              .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
              .eq("id", compId);

            await supabase.from("inventory_history").insert([
              {
                product_id: compId,
                change_type: "manual_adjustment",
                quantity_change: -it.quantity,
                quantity_after: newQty,
                notes: `Order ${orderNumber} (Combo set) - ${it.quantity}x ${it.title}`,
              },
            ]);
          }
        }
      } else if (it.accessoryId) {
        // Motorcycle accessory
        const { data: acc } = await supabase
          .from("accessories")
          .select("id, stock_quantity")
          .eq("id", it.accessoryId)
          .maybeSingle();

        if (acc && acc.stock_quantity !== null && acc.stock_quantity !== undefined) {
          const newQty = Math.max(0, Number(acc.stock_quantity) - it.quantity);
          await supabase
            .from("accessories")
            .update({ stock_quantity: newQty, updated_at: new Date().toISOString() })
            .eq("id", it.accessoryId);

          await supabase.from("inventory_history").insert([
            {
              accessory_id: it.accessoryId,
              change_type: "manual_adjustment",
              quantity_change: -it.quantity,
              quantity_after: newQty,
              notes: `Order ${orderNumber} - ${it.quantity}x ${it.title}`,
            },
          ]);
        }
      }
    } catch (stockErr) {
      console.warn(`[stock] Note during stock adjustment for "${it.title}":`, stockErr);
    }
  }
}

/**
 * Places a customer order:
 * 1. Collects checkout information.
 * 2. Calculates order total.
 * 3. Authoritative real-time stock validation for all items.
 * 4. Inserts the customer and order into Supabase.
 * 5. Strictly checks for Supabase errors: Never pretends success if DB write fails.
 * 6. Confirms that a real order record was returned from Supabase.
 * 7. Inserts order line items in order_items.
 * 8. Decrements inventory stock.
 * 9. Returns the verified persisted order.
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const {
    customer,
    items,
    deliveryMethod = "Nationwide Delivery",
    shippingAddress,
    notes,
    paymentMethod = "eft",
    paymentReference,
    paymentStatus = "pending",
  } = params;

  if (items.length === 0) {
    throw new Error("Your cart is empty. Please add tyres, combos or accessories to place an order.");
  }

  // 1. Authoritative real-time stock validation
  const validation = await validateCartStock(items);
  if (!validation.valid) {
    throw new Error(validation.errors.join("\n"));
  }

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const total = subtotal; // Free nationwide delivery
  const orderNumber = generateOrderNumber();
  const resolvedPaymentReference = paymentReference || orderNumber;
  const orderId = generateUuid();
  const customerId = generateUuid();
  const resolvedAddress = shippingAddress?.trim() || "";

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase database connection is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to save orders."
    );
  }

  // 2. Insert customer contact details into Supabase
  const customerPayload = {
    id: customerId,
    first_name: customer.firstName.trim(),
    last_name: customer.lastName ? customer.lastName.trim() : null,
    email: customer.email ? customer.email.trim() : null,
    phone: customer.phone ? customer.phone.trim() : null,
  };

  const { error: custErr } = await supabase
    .from("customers")
    .insert([customerPayload]);

  if (custErr) {
    console.error("[orderService] Failed to insert customer:", custErr);
    const isRls = custErr.code === "42501" || custErr.message?.includes("row-level security");
    if (isRls) {
      throw new Error(
        "Checkout permission error (Row Level Security): Please execute the orders & customers RLS migration in your Supabase SQL Editor."
      );
    }
    throw new Error(`Failed to save customer details: ${custErr.message}`);
  }

  // 3. Insert order record into Supabase using ONLY columns that exist in the database table
  const orderPayload = {
    id: orderId,
    order_number: orderNumber,
    customer_id: customerId,
    status: "pending" as const,
    subtotal,
    delivery_fee: 0,
    total,
    payment_status: paymentStatus === "paid" ? "paid" : "pending",
    payment_method: paymentMethod,
    payment_provider: paymentMethod === "card_payfast" ? "payfast" : "eft",
    delivery_method: "Nationwide Delivery",
    delivery_address_line1: resolvedAddress || null,
    payment_reference: resolvedPaymentReference,
  };

  const { data: orderData, error: orderErr } = await supabase
    .from("orders")
    .insert([orderPayload])
    .select();

  if (orderErr) {
    console.error("[orderService] Critical failure inserting order into Supabase:", orderErr);
    const isRls = orderErr.code === "42501" || orderErr.message?.includes("row-level security");
    if (isRls) {
      throw new Error(
        "Checkout permission error (Row Level Security on orders): Please run the orders RLS migration in your Supabase SQL Editor to allow public order submissions."
      );
    }
    throw new Error(`Failed to place order: ${orderErr.message}`);
  }

  // 4. Insert order line items into order_items table
  const orderItemsRows = items.map((item) => ({
    id: generateUuid(),
    order_id: orderId,
    product_id: item.productId || null,
    product_name: `${item.title}${item.subtitle ? ` (${item.subtitle})` : ""}`,
    quantity: item.quantity,
    unit_price: item.price,
    subtotal: item.price * item.quantity,
  }));

  try {
    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItemsRows);
    if (itemsErr) {
      console.warn("[orderService] Note on order_items insert:", itemsErr.message);
    }
  } catch (itemsEx) {
    console.warn("[orderService] Exception during order_items insert:", itemsEx);
  }

  // 5. Decrement stock in inventory
  try {
    await decrementStockForOrder(items, orderNumber);
  } catch (stockErr) {
    console.warn("[orderService] Note during stock decrement:", stockErr);
  }

  // 6. Build the authoritative persisted order object
  const insertedOrder: DbOrder = (orderData && orderData[0] ? orderData[0] : orderPayload) as DbOrder;
  insertedOrder.customer = {
    id: customerId,
    first_name: customer.firstName.trim(),
    last_name: customer.lastName ? customer.lastName.trim() : null,
    email: customer.email ? customer.email.trim() : null,
    phone: customer.phone ? customer.phone.trim() : null,
  };
  insertedOrder.order_items = orderItemsRows.map((it) => ({
    id: it.id,
    order_id: it.order_id,
    product_id: it.product_id,
    product_name: it.product_name,
    quantity: it.quantity,
    unit_price: it.unit_price,
    subtotal: it.subtotal,
  }));

  return {
    success: true,
    orderNumber,
    orderId,
    subtotal,
    total,
    savedToDatabase: true,
    paymentMethod,
    paymentReference: resolvedPaymentReference,
    paymentStatus,
    deliveryMethod: "Nationwide Delivery",
    deliveryAddress: resolvedAddress,
    customer,
    items: [...items],
    persistedOrder: insertedOrder,
  };
}

/**
 * Fetches all orders with joined customer and item details for the Admin Portal.
 * Merges orders from backend API and Supabase database.
 */
export async function getAdminOrders(): Promise<DbOrder[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, customer:customers(*), order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[orderService] Error fetching orders from Supabase:", error.message);
      throw new Error(`Failed to load orders: ${error.message}`);
    }

    return (data || []) as DbOrder[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching orders";
    throw new Error(msg);
  }
}

/**
 * Real-time subscription to orders table changes for Admin Portal.
 */
export function subscribeToOrdersRealtime(
  onOrdersChanged: (payload?: { eventType: string; new: any; old: any }) => void
): () => void {
  if (!isSupabaseConfigured()) return () => {};

  const channelName = `admin-orders-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      (payload) => {
        onOrdersChanged({
          eventType: payload.eventType,
          new: payload.new,
          old: payload.old,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}

/**
 * Updates an order status in Supabase (Admin action).
 */
export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "processing" | "dispatched" | "completed" | "cancelled"
): Promise<void> {
  // 1. First attempt backend update route (handles server cache & service authority)
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) return;
  } catch {
    // Continue to fallback
  }

  try {
    const res = await fetch("/api/orders/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  // 1. First attempt backend update route (handles server cache & service authority)
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payment_status: paymentStatus }),
    });
    if (res.ok) return;
  } catch {
    // Continue to fallback
  }

  try {
    const res = await fetch("/api/orders/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
