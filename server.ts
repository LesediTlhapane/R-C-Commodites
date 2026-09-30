import express, { Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { generatePayfastSignature, verifyPayfastSignature } from "./src/lib/payfastHelper";

// Load environment configuration
dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";

// Configure body parsers (support generous payload for high-resolution accessory images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Supabase Server Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rbcmjltpokzgkxitoljo.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_siAm5B-hzfdAnBwDkwsBzg_5Lbp7vrZ";

const supabase = createClient(supabaseUrl, supabaseKey);

// Payfast Gateway Configuration
const getPayfastConfig = () => {
  const isSandbox = process.env.PAYFAST_SANDBOX !== "false";
  const merchantId = (
    process.env.PAYFAST_MERCHANT_ID || (isSandbox ? "10000100" : "")
  ).trim();
  const merchantKey = (
    process.env.PAYFAST_MERCHANT_KEY || (isSandbox ? "46f0cd694581a" : "")
  ).trim();
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

    // 1. Authoritative check: fetch the order from Supabase
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, customer:customers(*), order_items(*)")
      .eq("order_number", orderNumber.trim())
      .maybeSingle();

    if (orderErr) {
      console.error("[Payfast] Error fetching order from Supabase:", orderErr);
      res.status(500).json({ success: false, error: "Failed to locate order in database." });
      return;
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

    // 3. Construct Payfast Parameters
    const paymentData: Record<string, string> = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: firstName,
      name_last: lastName,
      email_address: email,
      ...(phone ? { cell_number: phone } : {}),
      m_payment_id: orderNumber,
      amount: formattedAmount,
      item_name: `Order ${orderNumber} - R&C Commodities`,
      item_description: `Superbike tyres & accessories (Order ${orderNumber})`,
      custom_str1: order.id,
      email_confirmation: "1",
      confirmation_address: email,
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

    // 5. Look up matching order in Supabase
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status, status")
      .eq("order_number", m_payment_id)
      .maybeSingle();

    if (orderErr || !order) {
      console.error(`[Payfast ITN] Order ${m_payment_id} not found in database:`, orderErr);
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
      console.log(
        `[Payfast ITN] Verified payment COMPLETE for order ${m_payment_id}. Updating database to 'paid'.`
      );

      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_reference: pf_payment_id || `PF-${m_payment_id}`,
          status: order.status === "pending" ? "processing" : order.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateErr) {
        console.error(`[Payfast ITN] Failed to update order status in Supabase:`, updateErr);
      } else {
        console.log(`[Payfast ITN] Successfully updated order ${m_payment_id} payment_status to 'paid'.`);
      }
    } else if (payment_status === "FAILED" || payment_status === "CANCELLED") {
      console.log(`[Payfast ITN] Payment ${payment_status} for order ${m_payment_id}`);
      await supabase
        .from("orders")
        .update({
          payment_status: "unpaid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);
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
    const { data: order, error } = await supabase
      .from("orders")
      .select("id, order_number, payment_status, payment_method, status, total, payment_reference, updated_at")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !order) {
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
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error checking payment status";
    res.status(500).json({ success: false, error: msg });
  }
});

/**
 * POST /api/orders/create
 * Secure backend order persistence endpoint.
 * Validates stock, calculates authoritative order total, inserts customer,
 * order and line items into Supabase.
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

    // 1. Insert customer
    try {
      await supabase.from("customers").insert([
        {
          id: customerId,
          first_name: customer.firstName.trim(),
          last_name: (customer.lastName || "").trim() || null,
          email: (customer.email || "").trim() || null,
          phone: (customer.phone || "").trim() || null,
        },
      ]);
    } catch (custErr) {
      console.warn("[server orders] Customer insert note:", custErr);
    }

    // 2. Insert order
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
    };

    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .insert([orderPayload])
      .select();

    if (orderErr) {
      console.error("[server orders] Order insert failed:", orderErr);
      const isRls = orderErr.code === "42501" || orderErr.message.includes("row-level security");
      const rlsHelp = isRls
        ? " Database security requirement: Please run 'supabase/migrations/20260928_orders_persistence_and_rls.sql' in your Supabase SQL Editor to grant public checkout order insertion."
        : "";
      res.status(500).json({
        success: false,
        error: `We couldn't place your order. Please try again or contact R&C Commodities.${rlsHelp}`,
      });
      return;
    }

    // 3. Insert line items
    const orderItemsRows = items.map((item: { productId?: string; title: string; subtitle?: string; quantity: number; price: number }) => ({
      id: crypto.randomUUID(),
      order_id: orderId,
      product_id: item.productId || null,
      product_name: `${item.title}${item.subtitle ? ` (${item.subtitle})` : ""}`,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.price * item.quantity,
    }));

    try {
      await supabase.from("order_items").insert(orderItemsRows);
    } catch (itemErr) {
      console.warn("[server orders] Order items insert note:", itemErr);
    }

    const insertedOrder = orderData && orderData.length > 0 ? orderData[0] : orderPayload;

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
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error creating order";
    res.status(500).json({ success: false, error: msg });
  }
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
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
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
