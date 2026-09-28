import { supabase, isSupabaseConfigured } from "./supabase";
import type { DbProduct, TyreProduct, TyreCombo, InventoryHistoryItem, DbCombo, DbAccessory, AccessoryItem } from "../types";
import { tyreProducts as fallbackProducts, tyreCombos as fallbackCombos } from "../data/products";
import { getTyreProfileImage } from "./assetHelper";
import { generateUuid } from "./uuid";

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

// ============================================================================
// ACCESSORIES PERSISTENT STORAGE & HYBRID SYNC
// ============================================================================
const ACCESSORIES_LOCAL_STORAGE_KEY = "rc_accessories_store_v1";
const ACCESSORIES_HISTORY_STORAGE_KEY = "rc_accessories_history_v1";

function getLocalAccessories(): DbAccessory[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(ACCESSORIES_LOCAL_STORAGE_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccessories(items: DbAccessory[]): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESSORIES_LOCAL_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent("rc-accessories-updated", { detail: items }));
    }
  } catch (e) {
    console.warn("Failed to persist accessories to localStorage:", e);
  }
}

function getLocalHistory(accessoryId: string): InventoryHistoryItem[] {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(ACCESSORIES_HISTORY_STORAGE_KEY) : null;
    const all: InventoryHistoryItem[] = raw ? JSON.parse(raw) : [];
    return all.filter((h) => h.accessory_id === accessoryId);
  } catch {
    return [];
  }
}

function appendLocalHistory(item: InventoryHistoryItem): void {
  try {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(ACCESSORIES_HISTORY_STORAGE_KEY);
      const all: InventoryHistoryItem[] = raw ? JSON.parse(raw) : [];
      all.unshift(item);
      localStorage.setItem(ACCESSORIES_HISTORY_STORAGE_KEY, JSON.stringify(all.slice(0, 200)));
    }
  } catch (e) {
    console.warn("Failed to persist accessory history to localStorage:", e);
  }
}

/**
 * Loads accessories from Supabase merged with local catalogue.
 * Returns empty array when table has no records and local storage is empty.
 */
export async function getStorefrontAccessories(): Promise<AccessoryItem[]> {
  const all = await getAdminAccessories();
  const active = all.filter((a) => a.active !== false);

  return active.map((a) => ({
    id: a.id,
    title: a.name,
    subtitle: a.description || "",
    category: a.category || "Accessories",
    price: Number(a.price),
    tagColor: "bg-primary",
    image: a.image_url || null,
    imageUrl: a.image_url || null,
    stockQuantity: a.stock_quantity !== null && a.stock_quantity !== undefined ? Number(a.stock_quantity) : null,
    active: a.active !== false,
  }));
}

/**
 * Validates real-time product & accessory stock for an array of items before allowing checkout.
 * Checks individual tyres, combo bundle component tyres, and accessories.
 * Returns array of error messages if any item exceeds currently available stock.
 */
export async function validateCartStock(
  items: {
    productId?: string;
    comboId?: string;
    accessoryId?: string;
    frontProductId?: string;
    rearProductId?: string;
    quantity: number;
    title: string;
  }[]
): Promise<{ valid: boolean; errors: string[] }> {
  if (!isSupabaseConfigured()) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];

  // 1. Aggregate required quantities per physical tyre product UUID
  const productDemands = new Map<string, { quantity: number; titles: Set<string> }>();
  // 2. Aggregate required quantities per accessory UUID
  const accessoryDemands = new Map<string, { quantity: number; title: string }>();

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
    } else if (item.accessoryId) {
      const cur = accessoryDemands.get(item.accessoryId) || { quantity: 0, title: item.title };
      cur.quantity += item.quantity;
      accessoryDemands.set(item.accessoryId, cur);
    }
  }

  // Validate Products
  const productIds = Array.from(productDemands.keys());
  if (productIds.length > 0) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, width, profile, rim, stock_quantity, stock_verified, active")
      .in("id", productIds);

    if (error || !data) {
      console.warn("[productService] Could not verify product stock with server:", error?.message);
    } else {
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
    }
  }

  // Validate Accessories
  const accessoryIds = Array.from(accessoryDemands.keys());
  if (accessoryIds.length > 0) {
    const { data: accData, error: accError } = await supabase
      .from("accessories")
      .select("id, name, stock_quantity, active")
      .in("id", accessoryIds);

    if (accError || !accData) {
      console.warn("[productService] Could not verify accessory stock with server:", accError?.message);
    } else {
      const accMap = new Map(accData.map((a) => [a.id, a]));

      for (const [aId, demand] of accessoryDemands.entries()) {
        const a = accMap.get(aId);
        if (!a) {
          errors.push(`Accessory "${demand.title}" was not found in database.`);
          continue;
        }

        if (!a.active) {
          errors.push(`Accessory "${a.name}" is currently inactive or discontinued.`);
          continue;
        }

        if (a.stock_quantity === null || a.stock_quantity === undefined) {
          errors.push(`Stock for "${a.name}" has not been verified yet.`);
          continue;
        }

        if (a.stock_quantity <= 0) {
          errors.push(`Accessory "${a.name}" is currently OUT OF STOCK.`);
        } else if (demand.quantity > a.stock_quantity) {
          errors.push(`Only ${a.stock_quantity} unit${a.stock_quantity === 1 ? "" : "s"} of "${a.name}" available (your order requires ${demand.quantity}).`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fetches ALL accessories for Admin Portal (Supabase merged with persistent local catalogue).
 */
export async function getAdminAccessories(): Promise<DbAccessory[]> {
  const localItems = getLocalAccessories();
  if (!isSupabaseConfigured()) {
    return localItems;
  }

  try {
    const { data, error } = await supabase
      .from("accessories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[productService] Note fetching accessories from Supabase:", error.message);
      return localItems;
    }

    const remoteItems = (data || []) as DbAccessory[];
    const remoteIds = new Set(remoteItems.map((r) => r.id));
    const merged = [...remoteItems];
    for (const loc of localItems) {
      if (!remoteIds.has(loc.id)) {
        merged.push(loc);
      }
    }
    return merged;
  } catch (err) {
    console.warn("[productService] Error fetching accessories:", err);
    return localItems;
  }
}

/**
 * Creates a new accessory.
 * Persists locally when Supabase is unavailable and surfaces failed cloud writes.
 */
export async function createAccessory(
  accessory: {
    name: string;
    category?: string;
    price: number;
    stock_quantity: number | null;
    description?: string | null;
    image_url?: string | null;
    active?: boolean;
  }
): Promise<DbAccessory> {
  const generatedId = generateUuid();
  const now = new Date().toISOString();

  const newRecord: DbAccessory = {
    id: generatedId,
    name: accessory.name.trim(),
    category: accessory.category?.trim() || "Accessories",
    price: Number(accessory.price) || 0,
    stock_quantity:
      accessory.stock_quantity !== null && accessory.stock_quantity !== undefined
        ? Number(accessory.stock_quantity)
        : null,
    description: accessory.description?.trim() || null,
    image_url: accessory.image_url?.trim() || null,
    active: accessory.active !== false,
    created_at: now,
    updated_at: now,
  };

  let savedRecord: DbAccessory = newRecord;

  // Do not report a local-only save as successful when the cloud write fails.
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("accessories")
        .insert([{
          id: generatedId,
          name: newRecord.name,
          category: newRecord.category,
          price: newRecord.price,
          stock_quantity: newRecord.stock_quantity,
          description: newRecord.description,
          image_url: newRecord.image_url,
          active: newRecord.active,
        }])
        .select();

      if (error) {
        const details = error.details ? ` Details: ${error.details}` : error.hint ? ` Hint: ${error.hint}` : "";
        throw new Error(`Failed to save accessory to Supabase (${error.code}): ${error.message}.${details}`);
      }

      if (!data || data.length === 0) {
        throw new Error("Supabase did not return the saved accessory. Check the accessories table SELECT policy.");
      }

      savedRecord = data[0] as DbAccessory;
      if (savedRecord.stock_quantity !== null && savedRecord.stock_quantity > 0) {
        const { error: historyError } = await supabase.from("inventory_history").insert([
          {
            accessory_id: savedRecord.id,
            change_type: "restock",
            quantity_change: savedRecord.stock_quantity,
            quantity_after: savedRecord.stock_quantity,
            notes: `Initial stock set to ${savedRecord.stock_quantity}`,
          },
        ]);
        if (historyError) {
          console.warn("[productService] Failed to record initial accessory inventory history:", historyError.message);
        }
      }
    } catch (dbErr) {
      if (dbErr instanceof Error) throw dbErr;
      throw new Error(`Failed to save accessory to Supabase: ${String(dbErr)}`);
    }
  }

  // Always update persistent local store
  const locals = getLocalAccessories().filter((a) => a.id !== savedRecord.id);
  saveLocalAccessories([savedRecord, ...locals]);

  // Record initial inventory history
  if (savedRecord.stock_quantity !== null && savedRecord.stock_quantity > 0) {
    appendLocalHistory({
      id: generateUuid(),
      accessory_id: savedRecord.id,
      change_type: "restock",
      quantity_change: savedRecord.stock_quantity,
      quantity_after: savedRecord.stock_quantity,
      notes: `Initial stock set to ${savedRecord.stock_quantity}`,
      created_at: now,
    });
  }

  return savedRecord;
}

/**
 * Updates an existing accessory in persistent storage and Supabase.
 * Records inventory history if stock_quantity changed.
 */
export async function updateAccessory(
  id: string,
  updates: Partial<DbAccessory>,
  previousStock?: number | null
): Promise<DbAccessory> {
  const now = new Date().toISOString();
  let updatedRecord: DbAccessory | null = null;

  // 1. Try Supabase update
  if (isSupabaseConfigured()) {
    try {
      const payload: Record<string, unknown> = {
        updated_at: now,
      };

      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.category !== undefined) payload.category = updates.category.trim();
      if (updates.price !== undefined) payload.price = Number(updates.price);
      if (updates.stock_quantity !== undefined) {
        payload.stock_quantity = updates.stock_quantity !== null ? Number(updates.stock_quantity) : null;
      }
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.image_url !== undefined) payload.image_url = updates.image_url;
      if (updates.active !== undefined) payload.active = Boolean(updates.active);

      const { data, error } = await supabase
        .from("accessories")
        .update(payload)
        .eq("id", id)
        .select();

      if (!error && data && data.length > 0) {
        updatedRecord = data[0] as DbAccessory;
      }
    } catch (err) {
      console.warn("[productService] Supabase update notice:", err);
    }
  }

  // 2. Update in local cache
  const locals = getLocalAccessories();
  const existingIdx = locals.findIndex((a) => a.id === id);

  if (updatedRecord) {
    if (existingIdx >= 0) {
      locals[existingIdx] = updatedRecord;
    } else {
      locals.unshift(updatedRecord);
    }
  } else {
    if (existingIdx >= 0) {
      const current = locals[existingIdx];
      updatedRecord = {
        ...current,
        ...updates,
        updated_at: now,
      };
      locals[existingIdx] = updatedRecord;
    } else {
      updatedRecord = {
        id,
        name: updates.name || "Accessory",
        category: updates.category || "Accessories",
        price: updates.price || 0,
        stock_quantity: updates.stock_quantity !== undefined ? updates.stock_quantity : null,
        description: updates.description || null,
        image_url: updates.image_url || null,
        active: updates.active !== false,
        created_at: now,
        updated_at: now,
      };
      locals.unshift(updatedRecord);
    }
  }

  saveLocalAccessories(locals);

  // Track inventory history
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
      notes = `Stock adjusted to 0 (out of stock)`;
    } else if (diff > 0) {
      notes = `Stock increased by +${diff} (${prev} → ${next})`;
    } else {
      notes = `Stock decreased by ${Math.abs(diff)} (${prev} → ${next})`;
    }

    appendLocalHistory({
      id: generateUuid(),
      accessory_id: id,
      change_type: "manual_adjustment",
      quantity_change: diff,
      quantity_after: next,
      notes,
      created_at: now,
    });
  }

  return updatedRecord;
}

/**
 * Permanently deletes an accessory from storage and Supabase.
 */
export async function deleteAccessory(id: string): Promise<void> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from("accessories").delete().eq("id", id);
    } catch (e) {
      console.warn("[productService] Remote delete note:", e);
    }
  }
  const locals = getLocalAccessories().filter((a) => a.id !== id);
  saveLocalAccessories(locals);
}

/**
 * Soft deletes / deactivates an accessory (active = false).
 */
export async function deactivateAccessory(id: string): Promise<DbAccessory> {
  return updateAccessory(id, { active: false });
}

/**
 * Fetches inventory history audit trail for an accessory.
 */
export async function getAccessoryInventoryHistory(accessoryId: string): Promise<InventoryHistoryItem[]> {
  const localHistory = getLocalHistory(accessoryId);

  if (!isSupabaseConfigured()) return localHistory;

  try {
    const { data, error } = await supabase
      .from("inventory_history")
      .select("*")
      .eq("accessory_id", accessoryId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return localHistory;
    }

    const remoteLogs = (data || []) as InventoryHistoryItem[];
    const remoteIds = new Set(remoteLogs.map((l) => l.id));
    const merged = [...remoteLogs];
    for (const loc of localHistory) {
      if (!remoteIds.has(loc.id)) {
        merged.push(loc);
      }
    }
    return merged.sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime());
  } catch {
    return localHistory;
  }
}

/**
 * Subscribes to Supabase Realtime changes and local updates on accessories.
 */
export function subscribeToAccessoriesRealtime(
  onAccessoryChanged: (payload: { eventType: string; new: DbAccessory | null; old: Partial<DbAccessory> | null }) => void
): () => void {
  // Listen for local updates across components
  const localHandler = (e: Event) => {
    const custom = e as CustomEvent<DbAccessory[]>;
    if (custom.detail) {
      onAccessoryChanged({
        eventType: "LOCAL_SYNC",
        new: custom.detail[0] || null,
        old: null,
      });
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("rc-accessories-updated", localHandler);
  }

  if (!isSupabaseConfigured()) {
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("rc-accessories-updated", localHandler);
      }
    };
  }

  const channelName = `accessories-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "accessories",
      },
      (payload) => {
        onAccessoryChanged({
          eventType: payload.eventType,
          new: (payload.new as DbAccessory) || null,
          old: (payload.old as Partial<DbAccessory>) || null,
        });
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log(`[productService] Realtime subscribed to public.accessories (${channelName})`);
      }
    });

  return () => {
    if (typeof window !== "undefined") {
      window.removeEventListener("rc-accessories-updated", localHandler);
    }
    supabase.removeChannel(channel).catch(() => {});
  };
}

/**
 * Fetches ALL combos from Supabase for the Admin Portal (including inactive).
 */
export async function getAdminCombos(): Promise<DbCombo[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("combos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load combos: ${error.message}`);
  }

  return (data || []) as DbCombo[];
}

/**
 * Creates a new tyre combo in Supabase.
 */
export async function createCombo(
  combo: {
    name: string;
    front_product_id: string;
    rear_product_id: string;
    regular_price: number;
    combo_price: number;
    savings?: number;
    description?: string | null;
    active?: boolean;
  }
): Promise<DbCombo> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const savings =
    combo.savings !== undefined
      ? Number(combo.savings)
      : Math.max(0, Number(combo.regular_price) - Number(combo.combo_price));

  const payload = {
    name: combo.name.trim(),
    front_product_id: combo.front_product_id,
    rear_product_id: combo.rear_product_id,
    regular_price: Number(combo.regular_price),
    combo_price: Number(combo.combo_price),
    savings,
    description: combo.description?.trim() || null,
    active: combo.active !== false,
  };

  const { data, error } = await supabase
    .from("combos")
    .insert([payload])
    .select();

  if (error) {
    throw new Error(`Failed to create combo: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to create combo: No record returned from database.");
  }

  return data[0] as DbCombo;
}

/**
 * Updates an existing tyre combo in Supabase.
 */
export async function updateCombo(
  id: string,
  updates: Partial<DbCombo>
): Promise<DbCombo> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) payload.name = updates.name.trim();
  if (updates.front_product_id !== undefined) payload.front_product_id = updates.front_product_id;
  if (updates.rear_product_id !== undefined) payload.rear_product_id = updates.rear_product_id;
  if (updates.regular_price !== undefined) payload.regular_price = Number(updates.regular_price);
  if (updates.combo_price !== undefined) payload.combo_price = Number(updates.combo_price);
  if (updates.savings !== undefined) {
    payload.savings = Number(updates.savings);
  } else if (updates.regular_price !== undefined || updates.combo_price !== undefined) {
    const reg = updates.regular_price !== undefined ? Number(updates.regular_price) : undefined;
    const cmb = updates.combo_price !== undefined ? Number(updates.combo_price) : undefined;
    if (reg !== undefined && cmb !== undefined) {
      payload.savings = Math.max(0, reg - cmb);
    }
  }
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.active !== undefined) payload.active = Boolean(updates.active);

  const { data, error } = await supabase
    .from("combos")
    .update(payload)
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(`Failed to update combo: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Failed to update combo: Record not found or rejected by RLS.");
  }

  return data[0] as DbCombo;
}

/**
 * Soft deletes / deactivates a combo (active = false).
 */
export async function deactivateCombo(id: string): Promise<DbCombo> {
  return updateCombo(id, { active: false });
}
