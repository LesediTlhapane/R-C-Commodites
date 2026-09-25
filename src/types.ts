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
  product_id?: string | null;
  accessory_id?: string | null;
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

export interface DbCombo {
  id: string;
  name: string;
  front_product_id: string;
  rear_product_id: string;
  combo_price: number;
  regular_price: number;
  savings: number;
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbAccessory {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string | null;
  image_url: string | null;
  stock_quantity: number | null;
  stock_verified?: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCustomer {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbOrder {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: "pending" | "processing" | "dispatched" | "completed" | "cancelled";
  subtotal: number;
  total: number;
  payment_status: "unpaid" | "paid" | "refunded";
  delivery_method: string;
  payment_reference?: string | null;
  created_at: string;
  updated_at: string;
  customer?: DbCustomer | null;
  order_items?: DbOrderItem[];
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
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
  frontProductId?: string;
  rearProductId?: string;
  frontProduct?: TyreProduct | null;
  rearProduct?: TyreProduct | null;
  stockVerified?: boolean;
  availableStock?: number;
  purchasable?: boolean;
  unpurchasableReason?: string | null;
}

export interface AccessoryItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  price: number;
  tagColor: string;
  stockQuantity?: number | null;
  active?: boolean;
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
  frontProductId?: string; // for combos
  rearProductId?: string; // for combos
  maxStock?: number | null; // available stock limit
  stockVerified?: boolean;
}
