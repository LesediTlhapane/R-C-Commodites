import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";
import { generatePayfastSignature } from "../../src/lib/payfastHelper";

// Read request body helper
async function getJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = req.body || (await getJsonBody(req));
    const orderNumber = (body?.orderNumber || "").trim();

    if (!orderNumber) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Missing orderNumber parameter" }));
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rbcmjltpokzgkxitoljo.supabase.co";
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_siAm5B-hzfdAnBwDkwsBzg_5Lbp7vrZ").trim();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("*, customer:customers(*), order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (orderErr || !order) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: `Order ${orderNumber} not found` }));
      return;
    }

    const rawSandbox = (process.env.PAYFAST_SANDBOX || "").trim().toLowerCase();
    const isSandbox = rawSandbox !== "false" && rawSandbox !== "production" && rawSandbox !== "0";

    const merchantId = (process.env.PAYFAST_MERCHANT_ID || (isSandbox ? "10055113" : "")).trim();
    const merchantKey = (process.env.PAYFAST_MERCHANT_KEY || (isSandbox ? "f9nzymq15r4tf" : "")).trim();
    const passphrase = (process.env.PAYFAST_PASSPHRASE || "").trim();

    const processUrl = isSandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";

    const host = req.headers["x-forwarded-host"] || req.headers.host || "rc-commodities.co.za";
    const proto = req.headers["x-forwarded-proto"] || "https";
    const appUrl = (process.env.APP_URL || `${proto}://${host}`).replace(/\/$/, "");

    const customer = order.customer || {};
    const firstName = (customer.first_name || "Valued").trim();
    const lastName = (customer.last_name || "Customer").trim();
    const email = (customer.email || "shopper@rc-commodities.co.za").trim();
    const phone = (customer.phone || "").replace(/\s+/g, "");

    const payfastEmail =
      isSandbox && email.toLowerCase() === "leseditlhapane5@gmail.com"
        ? "shopper@rc-commodities.co.za"
        : email;

    const formattedAmount = Number(order.total).toFixed(2);

    const paymentData: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${appUrl}/?payment=return&order=${encodeURIComponent(orderNumber)}`,
      cancel_url: `${appUrl}/?payment=cancelled&order=${encodeURIComponent(orderNumber)}`,
      notify_url: `${appUrl}/api/payfast/itn`,
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

    paymentData.signature = generatePayfastSignature(paymentData, passphrase);

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: true,
        processUrl,
        fields: paymentData,
        orderNumber,
        amount: formattedAmount,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error generating payment";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: msg }));
  }
}
