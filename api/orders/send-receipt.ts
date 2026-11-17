import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const ADMIN_EMAILS = [
  "leseditlhapane5@gmail.com",
  "admin@rc-commodities.co.za",
  "costa08@gmail.com",
  "costa@rc-commodities.co.za",
];

function respond(res: any, status: number, body: Record<string, unknown>) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    res.status(status).json(body);
    return;
  }

  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function formatCurrency(value: unknown): string {
  return `R ${Number(value || 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getCustomer(value: unknown): {
  first_name?: string;
  last_name?: string;
  email?: string;
} | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || typeof candidate !== "object") return null;
  return candidate as { first_name?: string; last_name?: string; email?: string };
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "POST") {
    respond(res, 405, { success: false, error: "Method not allowed." });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RECEIPT_FROM_EMAIL?.trim();
  if (!apiKey || !from) {
    respond(res, 503, {
      success: false,
      error: "Receipt email is not configured. Set RESEND_API_KEY and RECEIPT_FROM_EMAIL on the server.",
    });
    return;
  }

  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const token =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : "";
  if (!token) {
    respond(res, 401, { success: false, error: "Administrator authentication is required." });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ""
  ).trim();
  if (!supabaseUrl || !supabaseKey) {
    respond(res, 503, { success: false, error: "Supabase server configuration is missing." });
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      respond(res, 401, { success: false, error: "Administrator session is invalid or expired." });
      return;
    }

    const email = user.email?.toLowerCase().trim();
    let isAdmin =
      Boolean(email && (ADMIN_EMAILS.includes(email) || email.endsWith("@rc-commodities.co.za"))) ||
      user.user_metadata?.role === "admin" ||
      user.user_metadata?.is_admin === true ||
      (Array.isArray(user.user_metadata?.roles) && user.user_metadata.roles.includes("admin"));

    if (!isAdmin) {
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      isAdmin = role?.role === "admin";
    }

    if (!isAdmin) {
      respond(res, 403, { success: false, error: "Administrator privileges are required." });
      return;
    }

    const orderId = req.body?.orderId;
    const resend = req.body?.resend === true;
    if (typeof orderId !== "string" || !orderId.trim()) {
      respond(res, 400, { success: false, error: "Order ID is required." });
      return;
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status, payment_reference, paid_at, receipt_email_sent_at, customer_email, customer_name, customer:customers(first_name,last_name,email), order_items(product_name,quantity,unit_price,subtotal)")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      throw new Error(`Could not load order details: ${orderError.message}`);
    }
    if (!order) {
      respond(res, 404, { success: false, error: "Order was not found." });
      return;
    }
    if (order.payment_status !== "paid") {
      respond(res, 409, { success: false, error: "Approve the payment before sending a receipt." });
      return;
    }

    const customer = getCustomer(order.customer);
    const recipient = (customer?.email || order.customer_email || "").trim();
    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      respond(res, 400, { success: false, error: "This order does not have a valid buyer email address." });
      return;
    }

    if (order.receipt_email_sent_at && !resend) {
      respond(res, 200, {
        success: true,
        alreadySent: true,
        sentAt: order.receipt_email_sent_at,
        recipient,
      });
      return;
    }

    const customerName =
      `${customer?.first_name || ""} ${customer?.last_name || ""}`.trim() ||
      order.customer_name ||
      "Customer";
    const items = order.order_items || [];
    const itemRows = items
      .map(
        (item: any) => `
          <tr>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb">${escapeHtml(item.product_name)}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:center">${Number(item.quantity)}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(item.unit_price)}</td>
            <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${formatCurrency(item.subtotal)}</td>
          </tr>`
      )
      .join("");
    const paidDate = order.paid_at
      ? new Date(order.paid_at).toLocaleDateString("en-ZA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : new Date().toLocaleDateString("en-ZA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
    const total = formatCurrency(order.total);
    const subject = `Payment receipt for order ${order.order_number}`;
    const html = `
      <div style="font-family:Arial,sans-serif;color:#1f2937;max-width:680px;margin:0 auto">
        <div style="background:#111827;color:#fff;padding:22px 24px">
          <h1 style="margin:0;font-size:22px">R&amp;C Commodities</h1>
          <p style="margin:6px 0 0;color:#d1d5db">Payment receipt</p>
        </div>
        <div style="padding:24px">
          <p>Hello ${escapeHtml(customerName)},</p>
          <p>We have approved and confirmed payment for your purchase. Thank you for shopping with us.</p>
          <p><strong>Order:</strong> ${escapeHtml(order.order_number)}<br>
             <strong>Payment reference:</strong> ${escapeHtml(order.payment_reference || order.order_number)}<br>
             <strong>Date received:</strong> ${escapeHtml(paidDate)}</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f3f4f6;text-align:left">
              <th style="padding:10px 8px">Item</th><th style="padding:10px 8px;text-align:center">Qty</th>
              <th style="padding:10px 8px;text-align:right">Unit price</th><th style="padding:10px 8px;text-align:right">Total</th>
            </tr></thead>
            <tbody>${itemRows || `<tr><td colspan="4" style="padding:10px 8px">Order items</td></tr>`}</tbody>
          </table>
          <p style="text-align:right;font-size:18px;font-weight:bold">Amount paid: ${escapeHtml(total)}</p>
          <p style="margin-top:28px">For assistance, contact <a href="mailto:orders@rc-commodities.co.za">orders@rc-commodities.co.za</a>.</p>
          <p>Regards,<br>R&amp;C Commodities</p>
        </div>
      </div>`;
    const text = [
      `Hello ${customerName},`,
      "",
      "We have approved and confirmed payment for your purchase. Thank you for shopping with us.",
      `Order: ${order.order_number}`,
      `Payment reference: ${order.payment_reference || order.order_number}`,
      `Date received: ${paidDate}`,
      "",
      ...items.map(
        (item: any) =>
          `${item.product_name} — ${item.quantity} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.subtotal)}`
      ),
      "",
      `Amount paid: ${total}`,
      "",
      "R&C Commodities",
    ].join("\n");

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `receipt-${order.id}-${resend ? randomUUID() : order.paid_at || "paid"}`,
      },
      body: JSON.stringify({ from, to: [recipient], subject, html, text }),
    });
    const emailResult = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      const providerMessage =
        typeof emailResult?.message === "string"
          ? emailResult.message
          : "Email provider rejected the receipt.";
      respond(res, 502, { success: false, error: providerMessage });
      return;
    }

    const sentAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("orders")
      .update({ receipt_email_sent_at: sentAt })
      .eq("id", order.id);
    if (updateError) {
      console.error("[receipt-email] Email sent, but receipt status could not be saved:", updateError.message);
    }

    respond(res, 200, {
      success: true,
      recipient,
      sentAt,
      trackingSaved: !updateError,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send receipt email.";
    console.error("[receipt-email] Failed to send receipt:", message);
    respond(res, 500, { success: false, error: message });
  }
}
