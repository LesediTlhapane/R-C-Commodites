import type { IncomingMessage, ServerResponse } from "http";
import { createClient } from "@supabase/supabase-js";

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
  if (req.method !== "POST" && req.method !== "PATCH" && req.method !== "PUT") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    const body = req.body || (await getJsonBody(req));
    const orderId = body?.orderId || body?.id;
    const { status, payment_status } = body;

    if (!orderId) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Missing orderId parameter" }));
      return;
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (status !== undefined) {
      payload.status = status;
    }

    if (payment_status !== undefined) {
      const allowed = ["pending", "paid", "refunded", "cancelled", "failed"];
      if (!allowed.includes(payment_status)) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: false, error: `Invalid payment status: ${payment_status}` }));
        return;
      }
      payload.payment_status = payment_status;
      if (payment_status === "paid") {
        payload.paid_at = new Date().toISOString();
      }
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rbcmjltpokzgkxitoljo.supabase.co";
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId)
      .select("*, customer:customers(*), order_items(*)")
      .maybeSingle();

    if (error) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: error.message }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, order: data }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error updating order";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: msg }));
  }
}
