import type { IncomingMessage } from "http";
import { createClient } from "@supabase/supabase-js";
import { generatePayfastSignature } from "../../src/lib/payfastHelper";

async function parseUrlEncodedBody(req: IncomingMessage): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const params = new URLSearchParams(body);
      const result: Record<string, string> = {};
      for (const [key, value] of params.entries()) {
        result[key] = value;
      }
      resolve(result);
    });
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  try {
    const itnData = typeof req.body === "object" && !Buffer.isBuffer(req.body)
      ? (req.body as Record<string, string>)
      : await parseUrlEncodedBody(req);

    const {
      m_payment_id,
      pf_payment_id,
      payment_status,
      amount_gross,
      merchant_id,
      signature: receivedSignature,
    } = itnData;

    if (!m_payment_id || !receivedSignature) {
      res.statusCode = 400;
      res.end("Missing required fields");
      return;
    }

    const rawSandbox = (process.env.PAYFAST_SANDBOX || "").trim().toLowerCase();
    const isSandbox = rawSandbox !== "false" && rawSandbox !== "production" && rawSandbox !== "0";
    const expectedMerchantId = (process.env.PAYFAST_MERCHANT_ID || "").trim();
    const passphrase = (process.env.PAYFAST_PASSPHRASE || "").trim();

    if (merchant_id !== expectedMerchantId) {
      res.statusCode = 400;
      res.end("Invalid merchant ID");
      return;
    }

    const calculatedSignature = generatePayfastSignature(itnData, passphrase);
    if (calculatedSignature.toLowerCase() !== receivedSignature.toLowerCase()) {
      res.statusCode = 400;
      res.end("Invalid signature");
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rbcmjltpokzgkxitoljo.supabase.co";
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_siAm5B-hzfdAnBwDkwsBzg_5Lbp7vrZ").trim();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, order_number, total, payment_status, status")
      .eq("order_number", m_payment_id)
      .maybeSingle();

    if (orderErr || !order) {
      res.statusCode = 404;
      res.end("Order not found");
      return;
    }

    const grossAmount = parseFloat(amount_gross || "0");
    const expectedAmount = Number(order.total);
    if (Math.abs(grossAmount - expectedAmount) > 0.1) {
      res.statusCode = 400;
      res.end("Amount mismatch");
      return;
    }

    if (payment_status === "COMPLETE") {
      await supabase
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
    }

    res.statusCode = 200;
    res.end("OK");
  } catch (err: unknown) {
    res.statusCode = 500;
    res.end("Error processing notification");
  }
}
