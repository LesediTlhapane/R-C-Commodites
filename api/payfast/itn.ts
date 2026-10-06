
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function generatePayfastSignature(
  data: Record<string, string | number | undefined | null>,
  passphrase?: string
): string {
  let pfOutput = "";

  for (const key of Object.keys(data)) {
    if (key === "signature") continue;

    const rawVal = data[key];

    if (
      rawVal !== undefined &&
      rawVal !== null &&
      String(rawVal).trim() !== ""
    ) {
      const valStr = String(rawVal).trim();

      pfOutput +=
        `${key}=${encodeURIComponent(valStr)
          .replace(/%20/g, "+")}&`;
    }
  }

  let getString = pfOutput.slice(0, -1);

  if (passphrase && passphrase.trim()) {
    getString +=
      `&passphrase=${encodeURIComponent(passphrase.trim())
        .replace(/%20/g, "+")}`;
  }

  return crypto
    .createHash("md5")
    .update(getString)
    .digest("hex");
}

async function getRequestBody(req: any): Promise<Record<string, string>> {
  // Vercel may already parse the body.
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, string>;
  }

  // Vercel may provide the body as a string.
  if (typeof req.body === "string") {
    const params = new URLSearchParams(req.body);
    return Object.fromEntries(params.entries());
  }

  // Fallback for an unparsed Node request stream.
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer | string) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const params = new URLSearchParams(body);
        resolve(Object.fromEntries(params.entries()));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

export default async function handler(req: any, res: any) {
  // PayFast ITN must use POST.
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method not allowed");
    return;
  }

  try {
    const itnData = await getRequestBody(req);

    console.log("PayFast ITN received:", {
      method: req.method,
      hasPaymentId: !!itnData.m_payment_id,
      paymentStatus: itnData.payment_status,
      merchantId: itnData.merchant_id,
    });

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

    const expectedMerchantId =
      (process.env.PAYFAST_MERCHANT_ID || "").trim();

    const passphrase =
      (process.env.PAYFAST_PASSPHRASE || "").trim();

    if (!expectedMerchantId || !passphrase) {
      console.error("PayFast credentials are not configured");
      res.statusCode = 500;
      res.end("PayFast configuration error");
      return;
    }

    if (merchant_id !== expectedMerchantId) {
      console.error("Invalid PayFast merchant ID");
      res.statusCode = 400;
      res.end("Invalid merchant ID");
      return;
    }

    const calculatedSignature = generatePayfastSignature(
      itnData,
      passphrase
    );

    if (
      calculatedSignature.toLowerCase() !==
      receivedSignature.toLowerCase()
    ) {
      console.error("Invalid PayFast ITN signature");
      res.statusCode = 400;
      res.end("Invalid signature");
      return;
    }

    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      "https://rbcmjltpokzgkxitoljo.supabase.co";

    const supabaseKey =
      (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

    if (!supabaseKey) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      res.statusCode = 500;
      res.end("Database configuration error");
      return;
    }

    if (supabaseKey.startsWith("sb_publishable_")) {
      console.error("Invalid Supabase key configured for ITN");
      res.statusCode = 500;
      res.end("Invalid database configuration");
      return;
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, order_number, total, payment_status, status"
      )
      .eq("order_number", m_payment_id)
      .maybeSingle();

    if (orderErr) {
      console.error("Supabase order lookup failed:", orderErr);
      res.statusCode = 500;
      res.end("Database error");
      return;
    }

    if (!order) {
      console.error(
        "PayFast order not found:",
        m_payment_id
      );
      res.statusCode = 404;
      res.end("Order not found");
      return;
    }

    const grossAmount = parseFloat(
      amount_gross || "0"
    );

    const expectedAmount = Number(order.total);

    if (
      !Number.isFinite(grossAmount) ||
      Math.abs(grossAmount - expectedAmount) > 0.1
    ) {
      console.error("PayFast amount mismatch:", {
        received: grossAmount,
        expected: expectedAmount,
        orderNumber: m_payment_id,
      });

      res.statusCode = 400;
      res.end("Amount mismatch");
      return;
    }

    if (payment_status === "COMPLETE") {
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          payment_status: "paid",
          payment_reference:
            pf_payment_id || `PF-${m_payment_id}`,
          payment_transaction_id:
            pf_payment_id || null,
          paid_at: new Date().toISOString(),
          status:
            order.status === "pending"
              ? "processing"
              : order.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(
          "Failed to update order:",
          updateError
        );

        res.statusCode = 500;
        res.end("Order update failed");
        return;
      }

      console.log(
        "PayFast payment confirmed:",
        m_payment_id
      );
    }

    // PayFast requires a successful HTTP response.
    res.statusCode = 200;
    res.end("OK");
  } catch (error) {
    console.error("PayFast ITN error:", error);

    res.statusCode = 500;
    res.end("Error processing notification");
  }
}
```
s