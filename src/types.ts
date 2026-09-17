export type Range = "All" | "NS" | "ST";

export interface TyreProduct {
  id: number;
  range: "NS" | "ST";
  name: string;
  size: string;
  position: "Front" | "Rear";
  width: string;
  profile: string;
  rim: string;
  price: number;
  image: string;
  features: string[];
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
}
