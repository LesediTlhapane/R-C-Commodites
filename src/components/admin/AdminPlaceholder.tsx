import React from "react";
import {
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  ArrowLeft,
  Construction,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "../../lib/router";

interface AdminPlaceholderProps {
  module: "products" | "combos" | "inventory" | "orders";
}

const moduleConfig = {
  products: {
    title: "Product Management Coming Next",
    subtitle: "Add, edit, manage tyre pricing, technical specifications, and imagery.",
    icon: Package,
    color: "text-blue-400",
    badge: "8 Real Products in Supabase",
    plannedFeatures: [
      "Add new tyre dimensions & models (width, profile, rim)",
      "Update real-time pricing and stock status",
      "Upload and manage tyre lifestyle & compound photography",
      "Toggle ST (Sport Touring) and NS (Super Sport) ranges",
      "Direct Supabase database sync protected by RLS",
    ],
  },
  combos: {
    title: "Combos Management Coming Next",
    subtitle: "Manage matched front & rear tyre package deals and bundle discounts.",
    icon: Layers,
    color: "text-amber-400",
    badge: "3 Real Combos in Supabase",
    plannedFeatures: [
      "Create paired front + rear tyre sets with custom savings",
      "Assign popular bike compatibility tags (e.g., MT-09, GSX-R, Multistrada)",
      "Set regular vs. discounted package pricing",
      "Toggle combo availability on the storefront",
      "Enforce combo stock levels from base inventory",
    ],
  },
  inventory: {
    title: "Inventory Management Coming Next",
    subtitle: "Audit warehouse stock, log incoming shipments, and set low-stock alerts.",
    icon: Boxes,
    color: "text-orange-400",
    badge: "Inventory History Logging",
    plannedFeatures: [
      "View live stock levels across all front & rear tyre sizes",
      "Record stock intake, manual adjustments, and workshop usage",
      "Automatic low-stock warning triggers (under 5 units)",
      "Full audit trail in the inventory_history Supabase table",
      "Admin-only mutation security enforced by RLS",
    ],
  },
  orders: {
    title: "Order Management Coming Next",
    subtitle: "View customer details, track order progress, and update fulfilment statuses.",
    icon: ShoppingCart,
    color: "text-emerald-400",
    badge: "Protected Customer Information",
    plannedFeatures: [
      "View order status workflow: Pending → Confirmed → Dispatched → Delivered",
      "Inspect ordered tyres, combos, accessories, and quantities",
      "Access customer delivery address and contact information securely",
      "Update tracking numbers and dispatch notes",
      "Restricted access: Customers only see their own orders; admins see all",
    ],
  },
};

export function AdminPlaceholder({ module }: AdminPlaceholderProps) {
  const { navigate } = useRouter();
  const config = moduleConfig[module];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Return */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 border border-neutral-800 px-3 py-1 text-[11px] font-mono text-neutral-400">
          <Clock size={12} className="text-primary" />
          <span>Foundation Active</span>
        </div>
      </div>

      {/* Main Notice Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="w-16 h-16 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mx-auto mb-4 text-primary shadow-lg">
          <Icon size={32} className={config.color} />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-md bg-neutral-800/80 border border-neutral-700/60 px-3 py-1 text-xs font-mono font-medium text-neutral-300 mb-3">
          <Construction size={13} className="text-amber-400" />
          <span>{config.badge}</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-black font-display uppercase tracking-wider text-white">
          {config.title}
        </h1>
        <p className="text-sm text-neutral-400 max-w-lg mx-auto mt-2 leading-relaxed">
          {config.subtitle}
        </p>

        {/* Feature Roadmap Checklist */}
        <div className="mt-8 max-w-lg mx-auto p-5 rounded-xl bg-neutral-950/70 border border-neutral-800/90 text-left">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">
            <ShieldCheck size={15} className="text-emerald-400" />
            <span>Scope of Next Phase Implementation</span>
          </div>

          <ul className="space-y-2.5 text-xs text-neutral-400">
            {config.plannedFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                <span className="leading-snug">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-dark transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
}
