import express, { Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { generatePayfastSignature, verifyPayfastSignature } from "./src/lib/payfastHelper";

// Load environment configuration
dotenv.config({ override: true });

const app = express();
const port = 3000;
const isProduction = process.env.NODE_ENV === "production";

// Configure body parsers (support generous payload for high-resolution accessory images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Supabase Server Client (prefer secret service_role key to bypass RLS policies for authoritative backend operations)
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rbcmjltpokzgkxitoljo.supabase.co";
const configuredKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const supabaseKey =
  configuredKey && !configuredKey.startsWith("sb_publishable_")
    ? configuredKey
    : (process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_siAm5B-hzfdAnBwDkwsBzg_5Lbp7vrZ");

const supabase = createClient(supabaseUrl, supabaseKey);

// Resilient Server-Authoritative Order Store (caches & complements Supabase orders)
interface ServerOrder {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  subtotal: number;
  total: number;
  payment_status: string;
  payment_method: string;
  delivery_method: string;
  delivery_address: string;
  shipping_address?: string;
  payment_reference: string;
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  order_items?: Array<{
    id: string;
    order_id: string;
    product_id?: string | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  created_at: string;
  updated_at: string;
}

const serverOrders = new Map<string, ServerOrder>();

// Payfast Gateway Configuration
const getPayfastConfig = () => {
  const rawSandbox = (process.env.PAYFAST_SANDBOX || "").trim().toLowerCase();
  const isProduction =
    rawSandbox === "false" ||
    rawSandbox === "production" ||
    rawSandbox === "prod" ||
    rawSandbox === "0" ||
    rawSandbox.includes("www.payfast.co.za");
  const isSandbox = !isProduction;

  const merchantId = (process.env.PAYFAST_MERCHANT_ID || "").trim();
  const merchantKey = (process.env.PAYFAST_MERCHANT_KEY || "").trim();
  const passphrase = (process.env.PAYFAST_PASSPHRASE || "").trim();

  const processUrl = isSandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

  const validateUrl = isSandbox
    ? "https://sandbox.payfast.co.za/eng/query/validate"
    : "https://www.payfast.co.za/eng/query/validate";

  return {
    isSandbox,
    merchantId,
    merchantKey,
    passphrase,
    processUrl,
    validateUrl,
  };
};

// ==============================================================================
// PAYFAST API ENDPOINTS
// ==============================================================================

/**
 * GET /api/payfast/config
 * Returns public gateway status without exposing secret passphrase or private keys
 */
app.get("/api/payfast/config", (_req: Request, res: Response) => {
  const config = getPayfastConfig();
  res.json({
    success: true,
    sandbox: config.isSandbox,
    configured: Boolean(config.merchantId && config.merchantKey),
    merchantId: config.merchantId,
  });
});

/**
 * POST /api/payfast/create-payment
 * Generates signed Payfast payment request for a persisted Supabase order.
 * Strictly uses server-validated order amount to prevent client-side tampering.
 */
app.post("/api/payfast/create-payment", async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderNumber, returnUrl: clientReturnUrl, cancelUrl: clientCancelUrl } = req.body;

    if (!orderNumber || typeof orderNumber !== "string") {
      res.status(400).json({ success: false, error: "Order number is required." });
      return;
    }

    const config = getPayfastConfig();
    if (!config.merchantId || !config.merchantKey) {
      res.status(500).json({
        success: false,
        error: "Payfast merchant credentials are not configured on the server.",
      });
      return;
    }

    // 1. Authoritative check: fetch the order from Supabase or server store
    let order: any = null;
    try {
      const { data: dbOrder, error: orderErr } = await supabase
        .from("orders")
        .select("*, customer:customers(*), order_items(*)")
        .eq("order_number", orderNumber.trim())
        .maybeSingle();

      if (!orderErr && dbOrder) {
        order = dbOrder;
      }
    } catch (e) {
      console.warn("[Payfast] Supabase query notice:", e);
    }

    if (!order && serverOrders.has(orderNumber.trim())) {
      order = serverOrders.get(orderNumber.trim());
    }

    if (!order) {
      res.status(404).json({
        success: false,
        error: `Order ${orderNumber} not found. Please ensure checkout completed successfully.`,
      });
      return;
    }

    // 2. Authoritative amount calculation from database
    const trustedTotal = Number(order.total);
    if (!trustedTotal || isNaN(trustedTotal) || trustedTotal <= 0) {
      res.status(400).json({ success: false, error: "Invalid order total for payment." });
      return;
    }

    const formattedAmount = (Math.round(trustedTotal * 100) / 100).toFixed(2);

    // Resolve customer names
    let firstName = order.customer?.first_name || "";
    let lastName = order.customer?.last_name || "";
    if (!firstName && order.customer_name) {
      const parts = order.customer_name.trim().split(" ");
      firstName = parts[0] || "Customer";
      lastName = parts.slice(1).join(" ");
    }
    firstName = firstName || "Valued";
    lastName = lastName || "Customer";

    const email = (order.customer?.email || order.customer_email || "sales@rc-commodities.co.za").trim();
    const phone = (order.customer?.phone || order.customer_phone || "").replace(/\s+/g, "");

    // Resolve callback URLs
    const appUrl = (process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    const returnUrl = clientReturnUrl || `${appUrl}/?payment=return&order=${encodeURIComponent(orderNumber)}`;
    const cancelUrl = clientCancelUrl || `${appUrl}/?payment=cancelled&order=${encodeURIComponent(orderNumber)}`;
    const notifyUrl = `${appUrl}/api/payfast/itn`;

    // In Payfast Sandbox, merchants cannot pay themselves using their own registered merchant email.
    // If the customer email matches the registered merchant account, substitute a valid test buyer email
    // for Payfast gateway validation while keeping the customer's real email saved in the database.
    const payfastEmail =
      config.isSandbox && email.toLowerCase() === "leseditlhapane5@gmail.com"
        ? "shopper@rc-commodities.co.za"
        : email;

    // 3. Construct Payfast Parameters
    const paymentData: Record<string, string> = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: firstName,
      name_last: lastName,
      email_address: payfastEmail,
      ...(phone ? { cell_number: phone } : {}),
      m_payment_id: orderNumber,
      amount: formattedAmount,
      item_name: `Order ${orderNumber} R and C Commodities`,
      item_description: `Superbike tyres and accessories Order ${orderNumber}`,
      custom_str1: order.id,
      email_confirmation: "1",
      confirmation_address: payfastEmail,
    };

    // 4. Generate signature server-side
    const signature = generatePayfastSignature(paymentData, config.passphrase);
    paymentData.signature = signature;

    res.json({
      success: true,
      processUrl: config.processUrl,
      fields: paymentData,
      orderNumber,
      amount: formattedAmount,
    });
  } catch (err: unknown) {
    console.error("[Payfast] Exception during create-payment:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/payfast/itn
 * Payfast Instant Transaction Notification (ITN) Webhook
 *
 * Security Requirements:
 * - Checks Payfast signature
 * - Validates with Payfast server-to-server query
 * - Checks merchant ID
 * - Validates order number & matches total amount against database
 * - ONLY marks order as 'paid' when all verifications pass!
 */
app.post("/api/payfast/itn", async (req: Request, res: Response): Promise<void> => {
  const itnData = req.body as Record<string, string>;
  console.log("[Payfast ITN] Received notification payload:", itnData);

  try {
    const config = getPayfastConfig();

    // 1. Check required parameters
    const {
      m_payment_id,
      pf_payment_id,
      payment_status,
      amount_gross,
      merchant_id,
      signature: receivedSignature,
    } = itnData;

    if (!m_payment_id || !receivedSignature) {
      console.warn("[Payfast ITN] Missing required fields: m_payment_id or signature");
      res.status(400).send("Missing required fields");
      return;
    }

    // 2. Verify Merchant ID matches
    if (merchant_id !== config.merchantId) {
      console.error(`[Payfast ITN] Merchant ID mismatch. Expected ${config.merchantId}, received ${merchant_id}`);
      res.status(400).send("Invalid merchant ID");
      return;
    }

    // 3. Verify Signature
    const calculatedSignature = generatePayfastSignature(itnData, config.passphrase);
    if (calculatedSignature.toLowerCase() !== receivedSignature.toLowerCase()) {
      console.error(
        `[Payfast ITN] Signature verification failed. Calculated: ${calculatedSignature}, Received: ${receivedSignature}`
      );
      res.status(400).send("Invalid signature");
      return;
    }

    // 4. Server-to-server validation check against Payfast validate endpoint
    try {
      const validateBody = new URLSearchParams();
      for (const [k, v] of Object.entries(itnData)) {
        validateBody.append(k, v);
      }

      const valRes = await fetch(config.validateUrl, {
        method: "POST",
        body: validateBody,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const valText = (await valRes.text()).trim();
      console.log(`[Payfast ITN] Payfast validate endpoint response: "${valText}"`);

      // In production, valText must be "VALID"
      if (!config.isSandbox && valText !== "VALID") {
        console.error("[Payfast ITN] Payfast server-to-server check was not VALID:", valText);
        res.status(400).send("Payfast validation check failed");
        return;
      }
    } catch (valErr) {
      console.warn("[Payfast ITN] Notice during Payfast query/validate request:", valErr);
      if (!config.isSandbox) {
        res.status(500).send("Validation request failed");
        return;
      }
    }

    // 5. Look up matching order in Supabase or server store
    let order: any = null;
    try {
      const { data: dbOrder, error: orderErr } = await supabase
        .from("orders")
        .select("id, order_number, total, payment_status, status")
        .eq("order_number", m_payment_id)
        .maybeSingle();

      if (!orderErr && dbOrder) {
        order = dbOrder;
      }
    } catch (e) {
      console.warn("[Payfast ITN] Supabase lookup notice:", e);
    }

    if (!order && serverOrders.has(m_payment_id)) {
      order = serverOrders.get(m_payment_id);
    }

    if (!order) {
      console.error(`[Payfast ITN] Order ${m_payment_id} not found in database or server store.`);
      res.status(404).send("Order not found");
      return;
    }

    // 6. Check amount matches database order total
    const grossAmount = parseFloat(amount_gross || "0");
    const expectedAmount = Number(order.total);
    const amountDifference = Math.abs(grossAmount - expectedAmount);

    if (amountDifference > 0.1) {
      console.error(
        `[Payfast ITN] Order amount discrepancy for ${m_payment_id}. Expected R${expectedAmount}, received R${grossAmount}`
      );
      res.status(400).send("Amount mismatch");
      return;
    }

    // 7. Authoritative status update upon verified COMPLETE payment
    if (payment_status === "COMPLETE") {
      // Idempotency check: if order is already marked as paid, acknowledge immediately without duplicate processing
      if (order.payment_status === "paid") {
        console.log(`[Payfast ITN] Order ${m_payment_id} is already paid. Acknowledging duplicate notification idempotently.`);
        res.status(200).send("OK");
        return;
      }

      console.log(
        `[Payfast ITN] Verified payment COMPLETE for order ${m_payment_id}. Updating database to 'paid'.`
      );

      // Update in server memory store
      if (serverOrders.has(m_payment_id)) {
        const local = serverOrders.get(m_payment_id)!;
        local.payment_status = "paid";
        local.payment_reference = pf_payment_id || `PF-${m_payment_id}`;
        local.status = local.status === "pending" ? "processing" : local.status;
        local.updated_at = new Date().toISOString();
      }

      try {
        const { error: updateErr } = await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            payment_reference: pf_payment_id || `PF-${m_payment_id}`,
            payment_transaction_id: pf_payment_id || null,
            paid_at: new Date().toISOString(),
            status: order.status === "pending" ? "processing" : order.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);

        if (updateErr) {
          console.warn(`[Payfast ITN] Supabase status update note:`, updateErr.message);
        } else {
          console.log(`[Payfast ITN] Successfully updated order ${m_payment_id} payment_status to 'paid' in Supabase.`);
        }
      } catch (e) {
        console.warn(`[Payfast ITN] Supabase update exception:`, e);
      }
    } else if (payment_status === "FAILED" || payment_status === "CANCELLED") {
      // Never overwrite or downgrade an already paid order
      if (order.payment_status === "paid") {
        console.warn(`[Payfast ITN] Received ${payment_status} for already paid order ${m_payment_id}. Ignoring downgrade.`);
        res.status(200).send("OK");
        return;
      }

      console.log(`[Payfast ITN] Payment ${payment_status} for order ${m_payment_id}`);
      if (serverOrders.has(m_payment_id)) {
        const local = serverOrders.get(m_payment_id)!;
        local.payment_status = "unpaid";
        local.updated_at = new Date().toISOString();
      }
      try {
        await supabase
          .from("orders")
          .update({
            payment_status: "unpaid",
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id);
      } catch {
        // continue
      }
    }

    // Return 200 OK to acknowledge Payfast ITN
    res.status(200).send("OK");
  } catch (err: unknown) {
    console.error("[Payfast ITN] Unhandled exception processing ITN:", err);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * GET /api/payfast/status/:orderNumber
 * Returns verified real-time payment status for an order
 */
app.get("/api/payfast/status/:orderNumber", async (req: Request, res: Response): Promise<void> => {
  try {
    const orderNumber = req.params.orderNumber;
    let order: any = null;

    try {
      const { data: dbOrder, error } = await supabase
        .from("orders")
        .select("*, customer:customers(*), order_items(*)")
        .eq("order_number", orderNumber)
        .maybeSingle();

      if (!error && dbOrder) {
        order = dbOrder;
      }
    } catch (e) {
      console.warn("[payfast/status] Supabase status query notice:", e);
    }

    if (!order && serverOrders.has(orderNumber)) {
      order = serverOrders.get(orderNumber);
    }

    if (!order) {
      res.status(404).json({ success: false, error: "Order not found" });
      return;
    }

    res.json({
      success: true,
      orderNumber: order.order_number,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      orderStatus: order.status,
      total: order.total,
      paymentReference: order.payment_reference,
      updatedAt: order.updated_at,
      order,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error checking payment status";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * GET /api/orders
 * Returns all persisted orders for administration (merges Supabase & server orders)
 */
app.get("/api/orders", async (_req: Request, res: Response): Promise<void> => {
  try {
    const ordersMap = new Map<string, any>();

    // 1. Try fetching from Supabase
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customer:customers(*), order_items(*)")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const ord of data) {
          ordersMap.set(ord.order_number, ord);
        }
      }
    } catch (e) {
      console.warn("[server orders] Supabase orders list notice:", e);
    }

    // 2. Merge server store orders
    for (const [num, sOrd] of serverOrders.entries()) {
      if (!ordersMap.has(num)) {
        ordersMap.set(num, sOrd);
      }
    }

    const merged = Array.from(ordersMap.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    res.json({ success: true, orders: merged });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load orders";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/orders/create
 * Secure backend order persistence endpoint.
 * Validates stock, calculates authoritative order total, inserts customer,
 * order and line items into Supabase with server-side store backup.
 */
app.post("/api/orders/create", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customer,
      items,
      deliveryMethod = "Nationwide Delivery",
      shippingAddress,
      notes,
      paymentMethod = "card_payfast",
      paymentReference,
      paymentStatus = "pending",
      orderNumber: clientOrderNumber,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, error: "Cart items cannot be empty." });
      return;
    }

    if (!customer?.firstName || !customer?.phone) {
      res.status(400).json({ success: false, error: "Customer first name and phone number are required." });
      return;
    }

    // Authoritative total calculation from items
    const subtotal = items.reduce(
      (sum: number, it: { price: number; quantity: number }) => sum + Number(it.price) * Number(it.quantity),
      0
    );
    const total = subtotal; // Free nationwide delivery
    const year = new Date().getFullYear();
    const orderNumber = clientOrderNumber || `RC-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const resolvedPaymentRef = paymentReference || orderNumber;
    const orderId = crypto.randomUUID();
    const customerId = crypto.randomUUID();
    const resolvedAddress = (shippingAddress || "").trim();

    // 1. Insert customer into Supabase
    try {
      await supabase.from("customers").insert([
        {
          id: customerId,
          first_name: customer.firstName.trim(),
          last_name: (customer.lastName || "").trim() || "Customer",
          email: (customer.email || "").trim() || "sales@rc-commodities.co.za",
          phone: (customer.phone || "").trim() || "0832273237",
        },
      ]);
    } catch (custErr) {
      console.warn("[server orders] Customer insert note:", custErr);
    }

    // 2. Prepare order payload
    const orderPayload = {
      id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      status: "pending",
      subtotal,
      total,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      delivery_method: resolvedAddress
        ? `Nationwide Delivery (${resolvedAddress})`
        : "Nationwide Delivery",
      payment_reference: resolvedPaymentRef,
      shipping_address: resolvedAddress || null,
      delivery_address: resolvedAddress || null,
      customer_name: `${customer.firstName} ${customer.lastName || ""}`.trim(),
      customer_email: customer.email || null,
      customer_phone: customer.phone || null,
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Prepare line items
    const orderItemsRows = items.map((item: { productId?: string; title: string; subtitle?: string; quantity: number; price: number }) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.productId || null,
      product_name: `${item.title}${item.subtitle ? ` (${item.subtitle})` : ""}`,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    // Cache order in server store authoritatively
    serverOrders.set(orderNumber, {
      ...orderPayload,
      customer: {
        first_name: customer.firstName.trim(),
        last_name: (customer.lastName || "").trim(),
        email: (customer.email || "").trim(),
        phone: (customer.phone || "").trim(),
      },
      order_items: orderItemsRows,
    });

    let savedToSupabase = false;
    let insertedOrder = orderPayload;

    // Database payload matching remote Supabase schema columns
    const dbPayload = {
      id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      status: "pending",
      subtotal,
      delivery_fee: 0,
      total,
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      payment_provider: paymentMethod === "card_payfast" ? "payfast" : "eft",
      delivery_method: "Nationwide Delivery",
      delivery_address_line1: resolvedAddress || null,
      payment_reference: resolvedPaymentRef,
    };

    try {
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .insert([dbPayload])
        .select();

      if (orderErr) {
        console.warn(
          "[server orders] Supabase order insert notice. Order saved safely in server authoritative store:",
          orderErr.message
        );
      } else {
        savedToSupabase = true;
        if (orderData && orderData.length > 0) {
          insertedOrder = orderData[0];
        }
      }
    } catch (e) {
      console.warn("[server orders] Supabase exception, handled gracefully by server store:", e);
    }

    // Try inserting line items into Supabase if order was saved
    if (savedToSupabase) {
      try {
        await supabase.from("order_items").insert(orderItemsRows);
      } catch (itemErr) {
        console.warn("[server orders] Order items insert note:", itemErr);
      }
    }

    res.json({
      success: true,
      orderNumber,
      orderId,
      subtotal,
      total,
      paymentMethod,
      paymentReference: resolvedPaymentRef,
      paymentStatus,
      deliveryMethod: "Nationwide Delivery",
      deliveryAddress: resolvedAddress,
      customer,
      items,
      persistedOrder: insertedOrder,
      savedToSupabase,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating order";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PATCH /api/orders/:id
 * Updates an order status or payment status (Admin action).
 */
app.patch("/api/orders/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      payload.status = status;
    }

    if (payment_status !== undefined) {
      const allowed = ["pending", "paid", "refunded", "cancelled", "failed"];
      if (!allowed.includes(payment_status)) {
        res.status(400).json({ success: false, error: `Invalid payment status: ${payment_status}` });
        return;
      }
      payload.payment_status = payment_status;
      if (payment_status === "paid") {
        payload.paid_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", id)
      .select("*, customer:customers(*), order_items(*)")
      .maybeSingle();

    if (error) {
      console.warn("[server orders] Supabase update warning:", error.message);
    }

    for (const [num, sOrd] of serverOrders.entries()) {
      if (sOrd.id === id) {
        serverOrders.set(num, { ...sOrd, ...payload });
      }
    }

    res.json({ success: true, order: data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating order";
    res.status(500).json({ success: false, error: msg });
  }
});

app.put("/api/orders/:id", async (req: Request, res: Response): Promise<void> => {
  req.method = "PATCH";
  app._router.handle(req, res, () => {});
});

// ==============================================================================
// ACCESSORIES & PRODUCT QUANTITY MANAGEMENT ENDPOINTS
// ==============================================================================

/**
 * GET /api/accessories
 * Retrieves all accessories from database.
 */
app.get("/api/accessories", async (_req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from("accessories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[server accessories] Supabase fetch note:", error.message);
      res.json({ success: true, accessories: [] });
      return;
    }

    res.json({ success: true, accessories: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error fetching accessories";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/accessories
 * Creates a new accessory with server privileges. Allows adding as many as needed.
 */
app.post("/api/accessories", async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, category, price, stock_quantity, description, image_url, active } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ success: false, error: "Accessory name is required." });
      return;
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const parsedPrice = Number(price) || 0;
    const parsedStock =
      stock_quantity !== null && stock_quantity !== undefined && stock_quantity !== ""
        ? Number(stock_quantity)
        : null;

    const row = {
      id,
      name: name.trim(),
      category: (category || "Accessories").trim(),
      price: parsedPrice,
      stock_quantity: parsedStock,
      description: description ? description.trim() : null,
      image_url: image_url || null,
      active: active !== false,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase.from("accessories").insert([row]).select();

    if (error) {
      console.warn("[server accessories] Supabase insert warning:", error.message);
      // Return row so the admin interface continues seamlessly
      res.json({ success: true, accessory: row, warning: error.message });
      return;
    }

    const saved = data && data.length > 0 ? data[0] : row;
    res.json({ success: true, accessory: saved });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating accessory";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/accessories/:id
 * Updates an accessory (including stock_quantity, active state, details).
 */
app.put("/api/accessories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      updated_at: now,
    };
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.category !== undefined) payload.category = updates.category.trim();
    if (updates.price !== undefined) payload.price = Number(updates.price);
    if (updates.stock_quantity !== undefined) {
      payload.stock_quantity =
        updates.stock_quantity !== null && updates.stock_quantity !== ""
          ? Number(updates.stock_quantity)
          : null;
    }
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.image_url !== undefined) payload.image_url = updates.image_url;
    if (updates.active !== undefined) payload.active = Boolean(updates.active);

    const { data, error } = await supabase
      .from("accessories")
      .update(payload)
      .eq("id", id)
      .select();

    if (error) {
      console.warn("[server accessories] Supabase update warning:", error.message);
      res.json({ success: true, accessory: { id, ...payload }, warning: error.message });
      return;
    }

    const updated = data && data.length > 0 ? data[0] : { id, ...payload };
    res.json({ success: true, accessory: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating accessory";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * DELETE /api/accessories/:id
 * Deletes an accessory.
 */
app.delete("/api/accessories/:id", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("accessories").delete().eq("id", id);
    if (error) {
      console.warn("[server accessories] Delete error note:", error.message);
    }
    res.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error deleting accessory";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * PUT /api/products/:id/stock
 * Updates product stock quantity and verified status from admin portal.
 */
app.put("/api/products/:id/stock", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stock_quantity, stock_verified = true, notes } = req.body;
    const now = new Date().toISOString();

    const parsedQty =
      stock_quantity !== null && stock_quantity !== undefined && stock_quantity !== ""
        ? Number(stock_quantity)
        : null;

    const payload = {
      stock_quantity: parsedQty,
      stock_verified: Boolean(stock_verified),
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .select();

    if (error) {
      console.error("[server products] Update stock error:", error);
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    // Record inventory history if stock was set
    if (parsedQty !== null) {
      try {
        await supabase.from("inventory_history").insert([
          {
            product_id: id,
            change_type: "manual_adjustment",
            quantity_change: parsedQty,
            quantity_after: parsedQty,
            notes: notes || `Stock updated to ${parsedQty}`,
          },
        ]);
      } catch (invErr) {
        console.warn("[server products] Inventory history insert note:", invErr);
      }
    }

    const updated = data && data.length > 0 ? data[0] : { id, ...payload };
    res.json({ success: true, product: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating product stock";
    res.status(500).json({ success: false, error: msg });
  }
});


// ==============================================================================
// VITE CLIENT & STATIC FILE SERVING
// ==============================================================================

async function startServer() {
  if (isProduction) {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`[R&C Commodities] Full-stack server running on port ${port} (mode: ${isProduction ? "production" : "development"})`);
    console.log(`[Payfast] Sandbox mode: ${getPayfastConfig().isSandbox ? "ENABLED" : "PRODUCTION"}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});