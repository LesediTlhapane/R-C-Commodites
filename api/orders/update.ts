import type { IncomingMessage } from "http";
import { createClient } from "@supabase/supabase-js";

// Known configured administrator emails (case-insensitive) - matches AdminAuthContext
const ADMIN_EMAILS = [
  "leseditlhapane5@gmail.com",
  "admin@rc-commodities.co.za",
  "costa08@gmail.com",
  "costa@rc-commodities.co.za",
];

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

/**
 * Checks whether an authenticated Supabase user holds administrator privileges
 * using the project's existing authorization logic:
 * 1. Admin email whitelist & domain check
 * 2. User metadata role check (role: 'admin', is_admin: true, or roles array)
 * 3. public.user_roles table query
 * 4. public.is_admin() RPC
 */
async function verifyAdminRole(
  supabaseAdmin: any,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }
): Promise<boolean> {
  // 1. Check known authorized administrator email whitelist & domain
  if (user.email) {
    const cleanEmail = user.email.toLowerCase().trim();
    if (ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.endsWith("@rc-commodities.co.za")) {
      return true;
    }
  }

  // 2. Check metadata claims on the Supabase user
  const meta = user.user_metadata;
  if (
    meta?.role === "admin" ||
    meta?.is_admin === true ||
    (Array.isArray(meta?.roles) && meta.roles.includes("admin"))
  ) {
    return true;
  }

  // 3. Query public.user_roles table
  try {
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!error && data && data.role === "admin") {
      return true;
    }
  } catch {
    // Continue to RPC check
  }

  // 4. Fallback RPC check if available
  try {
    const { data: rpcAdmin } = await supabaseAdmin.rpc("is_admin");
    if (rpcAdmin === true) {
      return true;
    }
  } catch {
    // RPC not present or failed
  }

  return false;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST" && req.method !== "PATCH" && req.method !== "PUT") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  try {
    // 1. Extract Bearer token from Authorization header
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    const token =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.substring(7).trim()
        : null;

    if (!token) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Missing authentication token",
        })
      );
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rbcmjltpokzgkxitoljo.supabase.co";
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "").trim();
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Verify token with Supabase Auth
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (userErr || !user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error: "Unauthorized: Invalid or expired session",
        })
      );
      return;
    }

    // 3. Verify that user is authorized as an administrator
    const isAdmin = await verifyAdminRole(supabase, user);
    if (!isAdmin) {
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          success: false,
          error: "Forbidden: Administrator privileges required",
        })
      );
      return;
    }

    // 4. Validate body parameters
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
      const allowedStatuses = ["pending", "processing", "dispatched", "completed", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        res.statusCode = 400;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ success: false, error: `Invalid order status: ${status}` }));
        return;
      }
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

    // 5. Update order record in Supabase
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

    if (!data) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: `Order ${orderId} not found` }));
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