import { supabase, isSupabaseConfigured } from "./supabase";
import type { CartItem, DbOrder, DbCustomer, DbOrderItem } from "../types";
import { validateCartStock } from "./productService";

export interface CreateOrderParams {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  items: CartItem[];
  deliveryMethod: "collection" | "courier";
  shippingAddress?: string;
  notes?: string;
}

export interface CreateOrderResult {
  success: boolean;
  orderNumber: string;
  orderId?: string;
  total: number;
  subtotal: number;
  savedToDatabase: boolean;
  error?: string;
  dbNotice?: string;
}

/**
 * Generates an official, human-readable R&C Commodities order number.
 * e.g., RC-2026-4821
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RC-${year}-${randomSuffix}`;
}

/**
 * Places a customer order:
 * 1. Performs authoritative real-time stock validation for all items
 * 2. Creates customer record in Supabase
 * 3. Creates order record in Supabase
 * 4. Creates line items in Supabase
 * 5. Handles RLS gracefully with fallback order bundle
 */
export async function createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
  const { customer, items, deliveryMethod, shippingAddress, notes } = params;

  if (items.length === 0) {
    throw new Error("Your cart is empty. Please add tyres or combos to place an order.");
  }

  // 1. Authoritative real-time stock validation
  const validation = await validateCartStock(items);
  if (!validation.valid) {
    throw new Error(validation.errors.join("\n"));
  }

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const total = subtotal; // Selby collection is free; courier is arranged on delivery
  const orderNumber = generateOrderNumber();
  const orderId = crypto.randomUUID();
  const customerId = crypto.randomUUID();

  if (!isSupabaseConfigured()) {
    return {
      success: true,
      orderNumber,
      orderId,
      subtotal,
      total,
      savedToDatabase: false,
      dbNotice: "Running in local preview mode without database.",
    };
  }

  let savedToDatabase = false;
  let dbNotice: string | undefined;

  try {
    // 2. Insert customer contact details
    const { error: custErr } = await supabase.from("customers").insert({
      id: customerId,
      first_name: customer.firstName.trim(),
      last_name: customer.lastName.trim() || null,
      email: customer.email.trim() || null,
      phone: customer.phone.trim() || null,
    });

    if (custErr) {
      console.warn("[orderService] Note on customer insert:", custErr.message);
    }

    // 3. Insert order
    const { error: orderErr } = await supabase.from("orders").insert({
      id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      status: "pending",
      subtotal,
      total,
      payment_status: "unpaid",
      delivery_method: deliveryMethod,
    });

    if (orderErr) {
      console.warn("[orderService] Note on order insert:", orderErr.message);
      dbNotice = `Order created with reference ${orderNumber}. (Supabase note: ${orderErr.message})`;
    } else {
      // 4. Insert order items
      const orderItemsRows = items.map((item) => ({
        id: crypto.randomUUID(),
        order_id: orderId,
        product_id: item.productId || null,
        product_name: `${item.title}${item.subtitle ? ` (${item.subtitle})` : ""}`,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItemsRows);
      if (itemsErr) {
        console.warn("[orderService] Note on order_items insert:", itemsErr.message);
      } else {
        savedToDatabase = true;
      }
    }
  } catch (err) {
    console.warn("[orderService] Database error during order placement:", err);
  }

  return {
    success: true,
    orderNumber,
    orderId,
    subtotal,
    total,
    savedToDatabase,
    dbNotice,
  };
}

/**
 * Fetches all orders with joined customer and item details for the Admin Portal.
 * Requires administrator role in Supabase.
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
      throw new Error(`Failed to load orders: ${error.message}`);
    }

    return (data || []) as DbOrder[];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching orders";
    throw new Error(msg);
  }
}

/**
 * Updates an order status in Supabase (Admin action).
 */
export async function updateOrderStatus(
  orderId: string,
  status: "pending" | "processing" | "dispatched" | "completed" | "cancelled"
): Promise<void> {
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
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: "unpaid" | "paid" | "refunded"
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase
    .from("orders")
    .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) {
    throw new Error(`Failed to update payment status: ${error.message}`);
  }
}
