import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

function payfastEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (char) => {
      return (
        "%" +
        char.charCodeAt(0).toString(16).toUpperCase()
      );
    });
}

function generatePayfastSignature(
  data: Record<string, string>,
  passphrase: string
): string {
  const parts: string[] = [];

  for (const key of Object.keys(data)) {
    if (key === "signature") {
      continue;
    }

    const value = String(data[key] ?? "").trim();

    if (value !== "") {
      parts.push(
        `${key}=${payfastEncode(value)}`
      );
    }
  }

  let signatureString = parts.join("&");

  if (passphrase.trim() !== "") {
    signatureString +=
      `&passphrase=${payfastEncode(passphrase.trim())}`;
  }

  return crypto
    .createHash("md5")
    .update(signatureString)
    .digest("hex")
    .toLowerCase();
}

async function getRequestBody(
  req: any
): Promise<Record<string, string>> {
  if (
    req.body &&
    typeof req.body === "object" &&
    !Buffer.isBuffer(req.body)
  ) {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(req.body)) {
      result[key] = String(value ?? "");
    }

    return result;
  }

  if (typeof req.body === "string") {
    const params = new URLSearchParams(req.body);
    const result: Record<string, string> = {};

    for (const [key, value] of params.entries()) {
      result[key] = value;
    }

    return result;
  }

  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk: Buffer | string) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const params = new URLSearchParams(body);
        const result: Record<string, string> = {};

        for (const [key, value] of params.entries()) {
          result[key] = value;
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    res.end("Method not allowed");
    return;
  }

  try {
    const itnData = await getRequestBody(req);

    console.log("PayFast ITN received", {
      hasPaymentId: !!itnData.m_payment_id,
      paymentStatus: itnData.payment_status,
      merchantId: itnData.merchant_id,
    });

    const mPaymentId = itnData.m_payment_id;
    const pfPaymentId = itnData.pf_payment_id;
    const paymentStatus = itnData.payment_status;
    const amountGross = itnData.amount_gross;
    const merchantId = itnData.merchant_id;
    const receivedSignature = itnData.signature;

    if (!mPaymentId || !receivedSignature) {
      console.error(
        "PayFast ITN missing required fields"
      );

      res.statusCode = 400;
      res.end("Missing required fields");
      return;
    }

    const expectedMerchantId = (
      process.env.PAYFAST_MERCHANT_ID || ""
    ).trim();

    const passphrase = (
      process.env.PAYFAST_PASSPHRASE || ""
    ).trim();

    if (!expectedMerchantId || !passphrase) {
      console.error(
        "PayFast credentials are not configured"
      );

      res.statusCode = 500;
      res.end("PayFast configuration error");
      return;
    }

    if (merchantId !== expectedMerchantId) {
      console.error("Invalid PayFast merchant ID", {
        received: merchantId,
        expected: expectedMerchantId,
      });

      res.statusCode = 400;
      res.end("Invalid merchant ID");
      return;
    }

    const calculatedSignature =
      generatePayfastSignature(
        itnData,
        passphrase
      );

    if (
      calculatedSignature !==
      receivedSignature.toLowerCase()
    ) {
      console.error(
        "PayFast ITN signature mismatch",
        {
          receivedSignature:
            receivedSignature.toLowerCase(),
          calculatedSignature,
          merchantId,
          paymentId: mPaymentId,
        }
      );

      res.statusCode = 400;
      res.end("Invalid signature");
      return;
    }

    console.log(
      "PayFast ITN signature verified",
      {
        paymentId: mPaymentId,
      }
    );

    const supabaseUrl = (
      process.env.VITE_SUPABASE_URL ||
      "https://rbcmjltpokzgkxitoljo.supabase.co"
    ).trim();

    const supabaseKey = (
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    ).trim();

    if (!supabaseKey) {
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY is not configured"
      );

      res.statusCode = 500;
      res.end("Database configuration error");
      return;
    }

    if (supabaseKey.startsWith("sb_publishable_")) {
      console.error(
        "Invalid Supabase key configured for ITN"
      );

      res.statusCode = 500;
      res.end("Invalid database configuration");
      return;
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    );

    const {
      data: order,
      error: orderError,
    } = await supabase
      .from("orders")
      .select(
        "id, order_number, total, payment_status, status"
      )
      .eq("order_number", mPaymentId)
      .maybeSingle();

    if (orderError) {
      console.error(
        "Supabase order lookup failed",
        orderError
      );

      res.statusCode = 500;
      res.end("Database error");
      return;
    }

    if (!order) {
      console.error(
        "PayFast order not found",
        mPaymentId
      );

      res.statusCode = 404;
      res.end("Order not found");
      return;
    }

    const grossAmount = Number.parseFloat(
      amountGross || "0"
    );

    const expectedAmount = Number(order.total);

    if (
      !Number.isFinite(grossAmount) ||
      !Number.isFinite(expectedAmount) ||
      Math.abs(
        grossAmount - expectedAmount
      ) > 0.1
    ) {
      console.error(
        "PayFast amount mismatch",
        {
          received: grossAmount,
          expected: expectedAmount,
          orderNumber: mPaymentId,
        }
      );

      res.statusCode = 400;
      res.end("Amount mismatch");
      return;
    }

    if (paymentStatus === "COMPLETE") {
      const { error: updateError } =
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            payment_reference:
              pfPaymentId ||
              `PF-${mPaymentId}`,
            payment_transaction_id:
              pfPaymentId || null,
            paid_at:
              new Date().toISOString(),
            status:
              order.status === "pending"
                ? "processing"
                : order.status,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", order.id);

      if (updateError) {
        console.error(
          "Failed to update order",
          updateError
        );

        res.statusCode = 500;
        res.end("Order update failed");
        return;
      }

      console.log(
        "PayFast payment confirmed",
        {
          orderNumber: mPaymentId,
          pfPaymentId,
          amount: grossAmount,
        }
      );
    }

    res.statusCode = 200;
    res.end("OK");
  } catch (error) {
    console.error(
      "PayFast ITN error",
      error
    );

    res.statusCode = 500;
    res.end(
      "Error processing notification"
    );
  }
}