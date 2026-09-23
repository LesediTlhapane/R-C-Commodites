import { supabase, isSupabaseConfigured } from "./supabase";
import type { DbProduct, TyreProduct, TyreCombo, InventoryHistoryItem } from "../types";
import { tyreProducts as fallbackProducts, tyreCombos as fallbackCombos } from "../data/products";
import { getTyreProfileImage } from "./assetHelper";

/**
 * Maps a database product row to the frontend TyreProduct model.
 * Preserves high-resolution imagery and parsed features.
 */
export function mapDbProductToTyre(p: DbProduct): TyreProduct {
  const range = (p.range === "NS" || p.range === "ST" ? p.range : (p.name.includes("NS") ? "NS" : "ST")) as "NS" | "ST";
  const pos = (p.position === "Rear" ? "Rear" : "Front") as "Front" | "Rear";

  // Build standard size label: e.g. "120/70 ZR 17"
  const size = p.width && p.profile && p.rim 
    ? `${p.width}/${p.profile} ZR ${p.rim}`
    : `${p.width || 120}/${p.profile || 70} ZR 17`;

  // Parse features from description or supply sensible fallback
  let features: string[] = [];
  if (p.description) {
    features = p.description
      .split(/[.\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);
  }
  if (features.length === 0) {
    features = range === "NS"
      ? ["Zero-degree steel belt", "Track-proven steering precision", "Supreme cornering grip"]
      : ["Linear progressive turn-in", "Exceptional wet evacuation", "Long-haul comfort & mileage"];
  }

  // Resolve best image: custom image_url or matched asset by dimension/range
  const matchingFallback = fallbackProducts.find(
    (fp) => fp.range === range && fp.position === pos && (fp.width === String(p.width) || fp.size.includes(String(p.width)))
  );
  const baseImg = p.image_url || (matchingFallback ? matchingFallback.image : fallbackProducts[0].image);
  const image = getTyreProfileImage(size, range, baseImg);

  return {
    id: p.id,
    supabaseId: p.id,
    range,
    name: p.name,
    brand: p.brand || "Vredestein",
    productType: p.product_type || "tyre",
    size,
    position: pos,
    width: String(p.width ?? ""),
    profile: String(p.profile ?? ""),
    rim: `${p.rim || 17} inch`,
    price: Number(p.price) || 0,
    image,
    features,
    stockQuantity: p.stock_quantity !== null && p.stock_quantity !== undefined ? Number(p.stock_quantity) : null,
    stockVerified: Boolean(p.stock_verified),
    active: p.active !== false,
    description: p.description || "",
  };
}

/**
 * Fetches all active products from Supabase (or fallback if unconfigured/offline).
 */
export async function getStorefrontProducts(): Promise<TyreProduct[]> {
  if (!isSupabaseConfigured()) {
    return fallbackProducts;
  }

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[productService] Error fetching storefront products:", error);
      return fallbackProducts;
    }

    if (!data || data.length === 0) {
      return fallbackProducts;
    }

    return (data as DbProduct[]).map(mapDbProductToTyre);
  } catch (err) {
    console.error("[productService] Unexpected error fetching storefront products:", err);
    return fallbackProducts;
  }
}

/**
 * Fetches ALL products from Supabase for the Admin Portal (including inactive).
 */
export async function getAdminProducts(): Promise<DbProduct[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  return (data || []) as DbProduct[];
}

/**
 * Subscribes to Supabase Realtime changes on public.products.
 * Returns unsubscribe cleanup function.
 */
export function subscribeToProductsRealtime(
  onProductChanged: (payload: { eventType: string; new: DbProduct | null; old: Partial<DbProduct> | null }) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channel = supabase
    .channel("public-products-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "products",
      },
      (payload) => {
        onProductChanged({
          eventType: payload.eventType,
          new: (payload.new as DbProduct) || null,
          old: (payload.old as Partial<DbProduct>) || null,
        });
      }
    )
    .subscribe((status, err) => {
      if (status === "SUBSCRIBED") {
        console.log("[productService] Realtime subscribed to public.products");
      } else if (status === "CHANNEL_ERROR") {
        console.error("[productService] Realtime channel error on products:", err);
      } else if (status === "TIMED_OUT") {
        console.warn("[productService] Realtime subscription timed out");
      } else if (status === "CLOSED") {
        console.log("[productService] Realtime channel closed");
      }
    });

  return () => {
    supabase.removeChannel(channel).catch((err) => {
      console.warn("[productService] Error removing realtime channel:", err);
    });
  };
}

/**
 * Creates a new product in Supabase and records initial inventory history if stock was set.
 */
export async function createProduct(
  productData: Omit<DbProduct, "id" | "created_at" | "updated_at">
): Promise<DbProduct> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
        name: productData.name.trim(),
        brand: productData.brand.trim() || "Vredestein",
        range: productData.range || null,
        product_type: productData.product_type || "tyre",
        position: productData.position || null,
        width: productData.width !== null ? Number(productData.width) : null,
        profile: productData.profile !== null ? Number(productData.profile) : null,
        rim: productData.rim !== null ? Number(productData.rim) : null,
        tyre_type: productData.tyre_type || null,
        price: Number(productData.price) || 0,
        stock_quantity: productData.stock_quantity !== null && productData.stock_quantity !== undefined ? Number(productData.stock_quantity) : null,
        stock_verified: Boolean(productData.stock_verified),
        description: productData.description || null,
        image_url: productData.image_url || null,
        active: productData.active !== false,
      },
    ])
    .select();

  if (error) {
    const details = error.details ? ` (${error.details})` : error.hint ? ` (${error.hint})` : "";
    throw new Error(`Failed to create product: ${error.message}${details}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create product: No record returned from database.");
  }

  const newProduct = data[0] as DbProduct;

  // Inventory history record for newly created product if initial stock is provided
  if (newProduct.stock_quantity !== null && newProduct.stock_quantity > 0) {
    try {
      const { error: invErr } = await supabase.from("inventory_history").insert([
        {
          product_id: newProduct.id,
          change_type: "restock",
          quantity_change: newProduct.stock_quantity,
          quantity_after: newProduct.stock_quantity,
          notes: "Initial stock on product creation",
        },
      ]);
      if (invErr) {
        console.warn("[productService] Failed to record initial inventory history:", invErr.message);
      }
    } catch (invErr) {
      console.warn("[productService] Failed to record initial inventory history:", invErr);
    }
  }

  return newProduct;
}

/**
 * Updates a product in Supabase using its exact UUID.
 * Records inventory history ONLY if stock_quantity changed.
 */
export async function updateProduct(
  id: string,
  updates: Partial<DbProduct>,
  previousStock: number | null = null
): Promise<DbProduct> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.brand !== undefined) payload.brand = updates.brand.trim();
  if (updates.range !== undefined) payload.range = updates.range;
  if (updates.product_type !== undefined) payload.product_type = updates.product_type;
  if (updates.position !== undefined) payload.position = updates.position;
  if (updates.width !== undefined) payload.width = updates.width !== null ? Number(updates.width) : null;
  if (updates.profile !== undefined) payload.profile = updates.profile !== null ? Number(updates.profile) : null;
  if (updates.rim !== undefined) payload.rim = updates.rim !== null ? Number(updates.rim) : null;
  if (updates.tyre_type !== undefined) payload.tyre_type = updates.tyre_type;
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.stock_quantity !== undefined) {
    payload.stock_quantity = updates.stock_quantity !== null ? Number(updates.stock_quantity) : null;
  }
  if (updates.stock_verified !== undefined) payload.stock_verified = Boolean(updates.stock_verified);
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.image_url !== undefined) payload.image_url = updates.image_url;
  if (updates.active !== undefined) payload.active = Boolean(updates.active);

  // Safely execute update and return modified row without .single() coercion error
  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) {
    const details = error.details ? ` (${error.details})` : error.hint ? ` (${error.hint})` : "";
    throw new Error(`Failed to update product: ${error.message}${details}`);
  }

  if (!data || data.length === 0) {
    throw new Error(
      `Failed to update product: No product was updated. Please check that the product exists and that your administrator account is authorized to modify inventory.`
    );
  }

  const updatedProduct = data[0] as DbProduct;

  // Check if stock changed to create inventory history
  if (
    updates.stock_quantity !== undefined &&
    updates.stock_quantity !== null &&
    (previousStock === null || previousStock === undefined || updates.stock_quantity !== previousStock)
  ) {
    const prev = previousStock !== null && previousStock !== undefined ? Number(previousStock) : 0;
    const next = Number(updates.stock_quantity);
    const diff = next - prev;

    let notes = `Stock adjusted from ${prev} to ${next}`;
    if (previousStock === null || previousStock === undefined) {
      notes = `Initial stock verified and set to ${next}`;
    } else if (next === 0) {
      notes = `Stock adjusted from ${prev} to 0 (out of stock)`;
    } else if (diff > 0) {
      notes = `Stock increased by +${diff} (${prev} → ${next})`;
    } else {
      notes = `Stock decreased by ${Math.abs(diff)} (${prev} → ${next})`;
    }

    try {
      const { error: invErr } = await supabase.from("inventory_history").insert([
        {
          product_id: id,
          change_type: "manual_adjustment",
          quantity_change: diff,
          quantity_after: next,
          notes,
        },
      ]);
      if (invErr) {
        console.warn("[productService] Failed to record inventory history for adjustment:", invErr.message);
      }
    } catch (invErr) {
      console.warn("[productService] Failed to record inventory history for adjustment:", invErr);
    }
  }

  return updatedProduct;
}

/**
 * Fetches inventory history audit trail from Supabase for a specific product or all products.
 */
export async function getInventoryHistory(productId?: string): Promise<InventoryHistoryItem[]> {
  if (!isSupabaseConfigured()) return [];

  let query = supabase
    .from("inventory_history")
    .select("*")
    .order("created_at", { ascending: false });

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error } = await query.limit(50);
  if (error) {
    console.warn("[productService] Error fetching inventory history:", error.message);
    return [];
  }

  return (data || []) as InventoryHistoryItem[];
}

/**
 * Validates real-time product stock for an array of items before allowing checkout.
 * Returns array of error messages if any item exceeds currently available stock.
 */
export async function validateCartStock(
  items: { productId?: string; quantity: number; title: string }[]
): Promise<{ valid: boolean; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return { valid: true, errors: [] };
  }

  const productIds = items
    .map((it) => it.productId)
    .filter((id): id is string => Boolean(id));

  if (productIds.length === 0) {
    return { valid: true, errors: [] };
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, stock_quantity, stock_verified, active")
    .in("id", productIds);

  if (error || !data) {
    console.warn("[productService] Could not verify stock with server:", error?.message);
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  const productMap = new Map(data.map((p) => [p.id, p]));

  for (const item of items) {
    if (!item.productId) continue;
    const p = productMap.get(item.productId);
    if (!p) continue;

    if (!p.active) {
      errors.push(`"${item.title}" is no longer available.`);
      continue;
    }

    if (!p.stock_verified) {
      errors.push(`Stock for "${item.title}" has not yet been verified. Please contact Costa via WhatsApp to order.`);
      continue;
    }

    const available = p.stock_quantity ?? 0;
    if (available <= 0) {
      errors.push(`"${item.title}" is currently OUT OF STOCK.`);
    } else if (item.quantity > available) {
      errors.push(`Only ${available} unit${available === 1 ? "" : "s"} of "${item.title}" currently available in stock (you have ${item.quantity} in cart).`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
