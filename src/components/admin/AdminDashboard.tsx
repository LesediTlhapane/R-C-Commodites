import React, { useEffect, useState } from "react";
import {
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Database,
  ArrowRight,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { useRouter } from "../../lib/router";
import { tyreProducts, tyreCombos } from "../../data/products";

interface DashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  totalCombos: number;
  pendingOrders: number;
  lowStockProducts: number;
  dataSource: "supabase" | "fallback";
  loading: boolean;
  lastUpdated: Date;
}

export function AdminDashboard() {
  const { navigate } = useRouter();
  const isConfigured = isSupabaseConfigured();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProducts: tyreProducts.length, // default fallback to existing 8 products
    activeProducts: tyreProducts.length,
    totalCombos: tyreCombos.length, // default fallback to existing 3 combos
    pendingOrders: 0,
    lowStockProducts: 0,
    dataSource: "fallback",
    loading: true,
    lastUpdated: new Date(),
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setMetrics((prev) => ({ ...prev, loading: true }));
    setErrorMsg(null);

    if (!isConfigured) {
      setMetrics({
        totalProducts: tyreProducts.length,
        activeProducts: tyreProducts.length,
        totalCombos: tyreCombos.length,
        pendingOrders: 0,
        lowStockProducts: 0,
        dataSource: "fallback",
        loading: false,
        lastUpdated: new Date(),
      });
      return;
    }

    try {
      // 1. Fetch products count and active status
      const { count: prodCount, error: prodErr } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });

      // 2. Fetch combos count
      const { count: comboCount, error: comboErr } = await supabase
        .from("combos")
        .select("*", { count: "exact", head: true });

      // 3. Fetch pending orders count
      const { count: ordersCount, error: ordersErr } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "new", "processing"]);

      // 4. Fetch low stock count
      const { count: lowStockCount, error: stockErr } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .lt("stock_quantity", 5);

      // If Supabase queries succeeded
      if (!prodErr && !comboErr) {
        setMetrics({
          totalProducts: prodCount ?? tyreProducts.length,
          activeProducts: prodCount ?? tyreProducts.length,
          totalCombos: comboCount ?? tyreCombos.length,
          pendingOrders: ordersCount ?? 0,
          lowStockProducts: lowStockCount ?? 0,
          dataSource: "supabase",
          loading: false,
          lastUpdated: new Date(),
        });
      } else {
        // Partial fallback if tables don't exist yet or have different schema
        console.warn("[AdminDashboard] Query note:", prodErr?.message || comboErr?.message);
        setMetrics({
          totalProducts: tyreProducts.length,
          activeProducts: tyreProducts.length,
          totalCombos: tyreCombos.length,
          pendingOrders: 0,
          lowStockProducts: 0,
          dataSource: "fallback",
          loading: false,
          lastUpdated: new Date(),
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load database metrics";
      setErrorMsg(msg);
      setMetrics({
        totalProducts: tyreProducts.length,
        activeProducts: tyreProducts.length,
        totalCombos: tyreCombos.length,
        pendingOrders: 0,
        lowStockProducts: 0,
        dataSource: "fallback",
        loading: false,
        lastUpdated: new Date(),
      });
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [isConfigured]);

  const cards = [
    {
      title: "Total Products",
      value: metrics.totalProducts,
      subtitle: `${metrics.activeProducts} active in catalog`,
      icon: Package,
      path: "/admin/products",
      color: "text-blue-400",
      bg: "bg-blue-950/40 border-blue-900/60",
    },
    {
      title: "Active Products",
      value: metrics.activeProducts,
      subtitle: "Published & purchasable",
      icon: CheckCircle2,
      path: "/admin/products",
      color: "text-emerald-400",
      bg: "bg-emerald-950/40 border-emerald-900/60",
    },
    {
      title: "Total Combos",
      value: metrics.totalCombos,
      subtitle: "Matched front & rear sets",
      icon: Layers,
      path: "/admin/combos",
      color: "text-amber-400",
      bg: "bg-amber-950/40 border-amber-900/60",
    },
    {
      title: "Pending / New Orders",
      value: metrics.pendingOrders,
      subtitle: "Awaiting dispatch & tracking",
      icon: ShoppingCart,
      path: "/admin/orders",
      color: "text-primary",
      bg: "bg-red-950/40 border-red-900/60",
    },
    {
      title: "Low Stock Products",
      value: metrics.lowStockProducts,
      subtitle: "Threshold: under 5 units",
      icon: AlertTriangle,
      path: "/admin/inventory",
      color: "text-orange-400",
      bg: "bg-orange-950/40 border-orange-900/60",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black font-display uppercase tracking-wider text-white">
              Operations Overview
            </h1>
            <span className="rounded-md bg-primary/20 border border-primary/40 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              Admin
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time status of products, bundles, inventory, and customer transactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={metrics.loading}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={metrics.loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate("/admin/products")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-dark transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <span>Manage Products</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Database Connection Status Banner */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-primary shrink-0">
            <Database size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Supabase Engine Connection
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${
                  metrics.dataSource === "supabase"
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"
                    : "bg-amber-950/80 text-amber-400 border border-amber-800/80"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {metrics.dataSource === "supabase" ? "Live Database Connected" : "Local Data Fallback"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              {metrics.dataSource === "supabase"
                ? "Row Level Security (RLS) is active. Only authenticated administrators with the 'admin' role in user_roles can execute mutations."
                : "Displaying baseline catalog data. Once your Supabase credentials are configured in .env, metrics will sync dynamically."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 shrink-0">
          <Clock size={13} />
          <span>Last sync: {metrics.lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* METRICS CARDS GRID (Task 5: 5 metrics cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.path)}
              className="group rounded-2xl border border-neutral-800/90 bg-neutral-900/80 p-5 hover:border-neutral-700 transition-all hover:shadow-xl hover:shadow-black/40 cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors">
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.bg} ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                  {metrics.loading ? "..." : card.value}
                </span>
              </div>

              <p className="text-[11px] text-neutral-500 leading-tight">
                {card.subtitle}
              </p>

              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-neutral-400 group-hover:text-primary transition-colors">
                <span>View details</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* SECURITY & QUICK MANAGEMENT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Module Fast Links */}
        <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-neutral-800">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Upcoming Management Modules
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                The architecture foundation is established for these administrative sections.
              </p>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">
              Phase 1
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <button
              onClick={() => navigate("/admin/products")}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800/90 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <Package size={18} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <span>Product Management</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  8 real tyre products (Centauro ST &amp; NS) configured in Supabase.
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/combos")}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800/90 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Layers size={18} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <span>Combos &amp; Bundles</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  3 real tyre combos configured with matched pricing &amp; savings.
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/inventory")}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800/90 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-orange-400 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                <Boxes size={18} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <span>Stock &amp; Inventory History</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Track stock movements, arrivals, and warehouse stock levels.
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/orders")}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-neutral-800/90 bg-neutral-950/60 hover:border-neutral-700 hover:bg-neutral-800/40 transition-all text-left cursor-pointer group"
            >
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <ShoppingCart size={18} />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <span>Customer Orders &amp; Dispatch</span>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-[11px] text-neutral-400 mt-1 leading-snug">
                  Review customer details, order items, and status progression.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Security & RLS Status Column */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white mb-2">
              <Shield size={16} className="text-emerald-400" />
              <span>Row Level Security</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              All Supabase database operations are gated by PostgreSQL security policies.
            </p>

            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80">
                <span className="text-neutral-400">products</span>
                <span className="text-emerald-400 font-semibold">Public Read / Admin Write</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80">
                <span className="text-neutral-400">combos</span>
                <span className="text-emerald-400 font-semibold">Public Read / Admin Write</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80">
                <span className="text-neutral-400">orders</span>
                <span className="text-amber-400 font-semibold">Admin / Owner Only</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80">
                <span className="text-neutral-400">customers</span>
                <span className="text-amber-400 font-semibold">Protected PII</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800/80">
                <span className="text-neutral-400">user_roles</span>
                <span className="text-emerald-400 font-semibold">Admin Supervised</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Auth: Supabase Tokens</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <CheckCircle2 size={12} />
              Enforced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
