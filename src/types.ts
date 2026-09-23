export type Range = "All" | "NS" | "ST";

export interface DbProduct {
  id: string; // UUID in Supabase
  name: string;
  brand: string;
  range: string | null;
  product_type: string;
  position: string | null;
  width: number | null;
  profile: number | null;
  rim: number | null;
  tyre_type: string | null;
  price: number;
  stock_quantity: number | null;
  stock_verified: boolean;
  description: string | null;
  image_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryHistoryItem {
  id: string;
  product_id: string;
  change_type: "manual_adjustment" | "restock" | "order_placed" | "return";
  quantity_change: number;
  quantity_after: number;
  notes?: string | null;
  created_at?: string;
  created_by?: string | null;
}

export interface TyreProduct {
  id: string | number; // Support UUID from Supabase or number
  supabaseId?: string;
  range: "NS" | "ST";
  name: string;
  brand?: string;
  productType?: string;
  size: string;
  position: "Front" | "Rear";
  width: string;
  profile: string;
  rim: string;
  price: number;
  image: string;
  features: string[];
  stockQuantity?: number | null;
  stockVerified?: boolean;
  active?: boolean;
  description?: string;
}

export interface TyreCombo {
  id: string;
  title: string;
  range: "ST" | "NS";
  frontSize: string;
  rearSize: string;
  price: number;
  regularPrice: number;
  savings: number;
  popularBikes: string;
  tag?: string;
  subtitle?: string;
  description?: string;
  active?: boolean;
}

export interface AccessoryItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  tagColor: string;
}

export interface CartItem {
  id: string; // string or compound id
  title: string;
  subtitle: string;
  price: number;
  quantity: number;
  image?: string;
  productId?: string; // original Supabase product id if tyre
  comboId?: string; // combo id if combo
  maxStock?: number | null; // available stock limit
  stockVerified?: boolean;
}
