import { supabase, isSupabaseConfigured } from "./supabase";
import type { DbProduct, TyreProduct, TyreCombo, InventoryHistoryItem, DbCombo, DbAccessory, AccessoryItem } from "../types";
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
    stockVerified: Boolean(p.stock_verified || (p.stock_quantity !== null && p.stock_quantity !== undefined)),
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

  // Use a unique channel name per subscriber to prevent collisions during React StrictMode/re-mounts
  const channelName = `products-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
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
        console.log(`[productService] Realtime subscribed to public.products (${channelName})`);
      } else if (status === "CHANNEL_ERROR") {
        console.warn("[productService] Realtime channel paused or awaiting reconnect:", err);
      } else if (status === "TIMED_OUT") {
        console.warn("[productService] Realtime subscription timed out");
      } else if (status === "CLOSED") {
        // Normal teardown
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
    // Collect thorough diagnostic information as specified in security and RLS requirements
    let authUid = "unauthenticated";
    let authEmail = "none";
    let userRole = "no entry found in public.user_roles";
    let isAdminFnResult = "not evaluated";
    let productExistsInDb = false;

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        authUid = authData.user.id;
        authEmail = authData.user.email || "no-email";

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", authUid)
          .maybeSingle();

        if (roleData?.role) {
          userRole = roleData.role;
        }

        try {
          const { data: rpcRes, error: rpcErr } = await supabase.rpc("is_admin");
          if (rpcErr) {
            isAdminFnResult = `RPC is_admin error (${rpcErr.code}): ${rpcErr.message}`;
          } else {
            isAdminFnResult = rpcRes ? "true" : "false";
          }
        } catch (rpcEx) {
          isAdminFnResult = `RPC exception: ${rpcEx instanceof Error ? rpcEx.message : String(rpcEx)}`;
        }
      }

      const { data: prodData } = await supabase
        .from("products")
        .select("id, name")
        .eq("id", id)
        .maybeSingle();

      productExistsInDb = Boolean(prodData);
    } catch (diagErr) {
      console.warn("[productService] Diagnostic inspection error:", diagErr);
    }

    const diagnosticDetails = [
      `Failed to update product: 0 rows modified. The database rejected or filtered out this UPDATE under Row Level Security.`,
      `• Authenticated UID: ${authUid}`,
      `• Authenticated Email: ${authEmail}`,
      `• Role in public.user_roles: ${userRole}`,
      `• public.is_admin() status: ${isAdminFnResult}`,
      `• Product ID: ${id} (exists in DB: ${productExistsInDb ? "Yes" : "No"})`,
      `• Resolution: Please ensure the 'Admins can update products' RLS policy is applied in your Supabase SQL Editor via the migration: supabase/migrations/20260923_fix_products_update_rls.sql`,
    ].join("\n");

    throw new Error(diagnosticDetails);
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
 * Maps a database combo row and its underlying products to the TyreCombo model.
 * Performs dual-product stock validation:
 * Combo is purchasable only when BOTH front & rear tyres are active, stock_verified, and stock_quantity > 0.
 */
export function mapDbComboToCombo(
  c: DbCombo,
  productsMap: Map<string, TyreProduct>
): TyreCombo {
  const front = productsMap.get(c.front_product_id) || null;
  const rear = productsMap.get(c.rear_product_id) || null;

  // Extract sizes from combo name or underlying products
  const frontSize = front?.size || "120/70 ZR 17";
  const rearSize = rear?.size || (c.name.includes("180/55") ? "180/55 ZR 17" : c.name.includes("190/55") ? "190/55 ZR 17" : "190/50 ZR 17");

  // Determine tag & popular bikes based on sizing
  let tag = "Best Value ST Combo";
  let popularBikes = "Popular for MT-07, MT-09, Z900, Street Triple, CB650R, GSX-S750";
  if (rearSize.includes("190/55")) {
    tag = "Most Popular Super Touring";
    popularBikes = "Popular for S1000XR, Multistrada, Ninja 1000SX, Super Duke GT";
  } else if (rearSize.includes("190/50")) {
    tag = "Heavyweight Tourer Combo";
    popularBikes = "Popular for Hayabusa, ZX-14R, FZ1, Fireblade, GSX-R1000";
  }

  // Stock evaluation: Both underlying products must be active, stock_verified, and have stock_quantity > 0
  let purchasable = true;
  let unpurchasableReason: string | null = null;
  let availableStock = 0;

  if (!front || !rear) {
    purchasable = false;
    unpurchasableReason = "Component tyres not found in catalogue";
  } else if (!front.active || !rear.active) {
    purchasable = false;
    unpurchasableReason = "One or more component tyres are discontinued";
  } else if (!front.stockVerified) {
    purchasable = false;
    unpurchasableReason = "Front Tyre Stock Not Verified";
  } else if (!rear.stockVerified) {
    purchasable = false;
    unpurchasableReason = "Rear Tyre Stock Not Verified";
  } else {
    const frontQty = front.stockQuantity ?? 0;
    const rearQty = rear.stockQuantity ?? 0;

    if (frontQty <= 0 && rearQty <= 0) {
      purchasable = false;
      unpurchasableReason = "Both Front and Rear Tyres are OUT OF STOCK";
    } else if (frontQty <= 0) {
      purchasable = false;
      unpurchasableReason = "Front Tyre is OUT OF STOCK";
    } else if (rearQty <= 0) {
      purchasable = false;
      unpurchasableReason = "Rear Tyre is OUT OF STOCK";
    } else {
      availableStock = Math.min(frontQty, rearQty);
      purchasable = availableStock > 0;
    }
  }

  return {
    id: c.id,
    title: c.name,
    range: (c.name.includes("NS") ? "NS" : "ST") as "ST" | "NS",
    frontSize: `${frontSize} (Front)`,
    rearSize: `${rearSize} (Rear)`,
    price: Number(c.combo_price),
    regularPrice: Number(c.regular_price),
    savings: Number(c.savings),
    popularBikes,
    tag,
    subtitle: `${frontSize} Front + ${rearSize} Rear`,
    description: c.description || "Factory-matched front and rear tyre pair.",
    active: c.active !== false,
    frontProductId: c.front_product_id,
    rearProductId: c.rear_product_id,
    frontProduct: front,
    rearProduct: rear,
    stockVerified: Boolean(front?.stockVerified && rear?.stockVerified),
    availableStock,
    purchasable,
    unpurchasableReason,
  };
}

/**
 * Loads all active combos from Supabase and populates underlying product relationships.
 */
export async function getStorefrontCombos(): Promise<TyreCombo[]> {
  if (!isSupabaseConfigured()) {
    return fallbackCombos;
  }

  try {
    // 1. Fetch live products to resolve component tyre details and stock
    const products = await getStorefrontProducts();
    const productsMap = new Map<string, TyreProduct>();
    products.forEach((p) => {
      productsMap.set(String(p.id), p);
      if (p.supabaseId) productsMap.set(p.supabaseId, p);
    });

    // 2. Fetch active combos from Supabase
    const { data, error } = await supabase
      .from("combos")
      .select("*")
      .eq("active", true)
      .order("combo_price", { ascending: true });

    if (error) {
      console.warn("[productService] Error fetching combos from Supabase:", error.message);
      return fallbackCombos;
    }

    if (!data || data.length === 0) {
      return fallbackCombos;
    }

    return (data as DbCombo[]).map((c) => mapDbComboToCombo(c, productsMap));
  } catch (err) {
    console.warn("[productService] Unexpected error loading combos:", err);
    return fallbackCombos;
  }
}

/**
 * Subscribes to Supabase Realtime changes on public.combos.
 */
export function subscribeToCombosRealtime(
  onComboChanged: (payload: { eventType: string; new: DbCombo | null; old: Partial<DbCombo> | null }) => void
): () => void {
  if (!isSupabaseConfigured()) {
    return () => {};
  }

  const channelName = `combos-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "combos",
      },
      (payload) => {
        onComboChanged({
          eventType: payload.eventType,
          new: (payload.new as DbCombo) || null,
          old: (payload.old as Partial<DbCombo>) || null,
        });
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`[productService] Realtime subscribed to public.combos (${channelName})`);
      }
    });

  return () => {
    supabase.removeChannel(channel).catch(() => {});
  };
}

/**
 * Loads accessories from Supabase.
 * Returns empty array when table has no records (displaying empty state as required).
 */
export async function getStorefrontAccessories(): Promise<AccessoryItem[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("accessories")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.warn("[productService] Error fetching accessories:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as DbAccessory[]).map((a) => ({
      id: a.id,
      title: a.name,
      subtitle: a.description || "",
      category: a.category || "Accessories",
      price: Number(a.price),
      tagColor: "bg-primary",
      stockQuantity: a.stock_quantity,
      active: a.active,
    }));
  } catch (err) {
    console.warn("[productService] Unexpected error loading accessories:", err);
    return [];
  }
}

/**
 * Validates real-time product stock for an array of items before allowing checkout.
 * Checks both individual tyres and combo bundle component tyres.
 * Returns array of error messages if any item exceeds currently available stock.
 */
export async function validateCartStock(
  items: {
    productId?: string;
    comboId?: string;
    frontProductId?: string;
    rearProductId?: string;
    quantity: number;
    title: string;
  }[]
): Promise<{ valid: boolean; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return { valid: true, errors: [] };
  }

  // Aggregate required quantities per physical product UUID
  const productDemands = new Map<string, { quantity: number; titles: Set<string> }>();

  for (const item of items) {
    if (item.productId) {
      const cur = productDemands.get(item.productId) || { quantity: 0, titles: new Set<string>() };
      cur.quantity += item.quantity;
      cur.titles.add(item.title);
      productDemands.set(item.productId, cur);
    } else if (item.frontProductId && item.rearProductId) {
      // Combo requires 1 front tyre and 1 rear tyre per combo unit
      const curFront = productDemands.get(item.frontProductId) || { quantity: 0, titles: new Set<string>() };
      curFront.quantity += item.quantity;
      curFront.titles.add(`${item.title} (Front Component)`);
      productDemands.set(item.frontProductId, curFront);

      const curRear = productDemands.get(item.rearProductId) || { quantity: 0, titles: new Set<string>() };
      curRear.quantity += item.quantity;
      curRear.titles.add(`${item.title} (Rear Component)`);
      productDemands.set(item.rearProductId, curRear);
    }
  }

  const productIds = Array.from(productDemands.keys());
  if (productIds.length === 0) {
    return { valid: true, errors: [] };
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name, width, profile, rim, stock_quantity, stock_verified, active")
    .in("id", productIds);

  if (error || !data) {
    console.warn("[productService] Could not verify stock with server:", error?.message);
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  const productMap = new Map(data.map((p) => [p.id, p]));

  for (const [pId, demand] of productDemands.entries()) {
    const p = productMap.get(pId);
    const label = Array.from(demand.titles).join(" / ");

    if (!p) {
      errors.push(`Product for "${label}" was not found in database.`);
      continue;
    }

    if (!p.active) {
      errors.push(`"${p.name}" (${label}) is currently inactive or discontinued.`);
      continue;
    }

    const isVerified = Boolean(p.stock_verified || (p.stock_quantity !== null && p.stock_quantity !== undefined));
    if (!isVerified) {
      errors.push(`Stock for "${p.name}" (${p.width}/${p.profile} R${p.rim}) has not been verified yet. Please contact Costa via WhatsApp to confirm Selby availability.`);
      continue;
    }

    const available = p.stock_quantity ?? 0;
    if (available <= 0) {
      errors.push(`"${p.name}" (${p.width}/${p.profile} R${p.rim}) is currently OUT OF STOCK.`);
    } else if (demand.quantity > available) {
      errors.push(`Only ${available} unit${available === 1 ? "" : "s"} of "${p.name} (${p.width}/${p.profile} R${p.rim})" available (your order requires ${demand.quantity}).`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
