import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  try {
    const { orderNumber } = req.query;

    if (!orderNumber) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Missing orderNumber" }));
      return;
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://rbcmjltpokzgkxitoljo.supabase.co";
    const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_siAm5B-hzfdAnBwDkwsBzg_5Lbp7vrZ").trim();
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: order, error } = await supabase
      .from("orders")
      .select("*, customer:customers(*), order_items(*)")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (error || !order) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Order not found" }));
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        success: true,
        orderNumber: order.order_number,
        paymentStatus: order.payment_status,
        paymentMethod: order.payment_method,
        orderStatus: order.status,
        total: order.total,
        paymentReference: order.payment_reference,
        updatedAt: order.updated_at,
        order,
      })
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error checking payment status";
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: msg }));
  }
}
