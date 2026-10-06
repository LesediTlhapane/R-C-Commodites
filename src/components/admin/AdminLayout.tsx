import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingCart,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Wrench,
  Bell,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminOrderNotification } from "../../context/AdminOrderNotificationContext";
import { useRouter } from "../../lib/router";
import logoAsset from "../../assets/rc-logo.png";
import vredesteinLogo from "../../assets/vredestein-logo.png";
import adminBgAsset from "../../assets/impossibleview.png";

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath: string;
}

const navItems = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Products", path: "/admin/products", icon: Package },
  { name: "Combos", path: "/admin/combos", icon: Layers },
  { name: "Accessories", path: "/admin/accessories", icon: Wrench },
  { name: "Inventory", path: "/admin/inventory", icon: Boxes },
  { name: "Orders", path: "/admin/orders", icon: ShoppingCart },
];

export function AdminLayout({ children, activePath }: AdminLayoutProps) {
  const { user, signOut } = useAdminAuth();
  const { unacknowledgedCount, latestNotification, dismissNotification, viewOrder } =
    useAdminOrderNotification();
  const { navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col md:flex-row antialiased selection:bg-primary selection:text-white">
      {/* MOBILE TOP BAR */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src={logoAsset} alt="R&C Commodities" className="h-9 w-auto object-contain" />
          <div className="leading-none">
            <span className="font-display font-black text-sm uppercase text-primary">R&amp;C</span>{" "}
            <span className="font-bold text-xs uppercase text-white">Admin</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unacknowledgedCount > 0 && (
            <button
              onClick={() => handleNav("/admin/orders")}
              className="relative p-2 rounded-lg bg-red-950/80 border border-red-800 text-red-300 hover:text-white"
              aria-label="New orders awaiting review"
            >
              <ShoppingCart size={18} />
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-600 text-white animate-pulse">
                {unacknowledgedCount}
              </span>
            </button>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-72 shrink-0 border-r border-neutral-800/90 bg-neutral-900/95 backdrop-blur-xl flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top brand header */}
        <div className="p-5 border-b border-neutral-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={logoAsset} alt="R&C Commodities" className="h-11 w-auto object-contain drop-shadow" />
              <div>
                <span className="block font-display text-sm font-black uppercase tracking-wider text-white leading-tight">
                  <span className="text-primary">R&amp;C</span> Commodities
                </span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-semibold mt-0.5">
                  Admin Workspace
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 text-[10px] font-mono text-emerald-400 font-medium">
            <ShieldCheck size={12} className="shrink-0" />
            <span>Supabase RLS Protected</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Core Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;

            return (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? "text-white" : "text-neutral-400"} />
                  <span>{item.name}</span>
                  {item.path === "/admin/orders" && unacknowledgedCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-mono font-bold text-white shadow-xs animate-pulse">
                      <span>🔴</span>
                      <span>{unacknowledgedCount}</span>
                    </span>
                  )}
                </div>
                {isActive && <ChevronRight size={14} className="opacity-80" />}
              </button>
            );
          })}

          <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            Quick Actions
          </div>

          <button
            onClick={() => handleNav("/")}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <ExternalLink size={16} className="text-neutral-400" />
              <span>Customer Storefront</span>
            </div>
            <span className="text-[10px] text-neutral-500 font-mono">Live</span>
          </button>
        </nav>

        {/* Bottom user profile & sign out */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-900 border border-neutral-800 mb-3">
            <div className="h-8 w-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-primary font-bold shrink-0">
              <UserCheck size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate" title={user?.email || "Admin"}>
                {user?.email || "Administrator"}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Authorized Admin</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/80 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-red-400 hover:border-red-900/60 hover:bg-red-950/20 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-600 px-1">
            <span>R&amp;C Admin v1.0</span>
            <img src={vredesteinLogo} alt="" className="h-3 w-auto opacity-40 grayscale" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 relative isolate">
        {/* Background Image with higher opacity and stylish motorsport black aesthetic */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-20 md:left-72 overflow-hidden bg-neutral-950">
          <img
            src={adminBgAsset}
            alt=""
            className="w-full h-full object-cover object-right-top md:object-center opacity-45 md:opacity-50 filter contrast-125 saturate-110 scale-105"
          />
        </div>
        {/* Sleek black vignette overlays to ensure top-notch text readability while preserving image presence */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 md:left-72 bg-gradient-to-b from-neutral-950/80 via-neutral-950/65 to-neutral-950/90" />
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 md:left-72 bg-radial-[at_top_right] from-transparent via-neutral-950/40 to-neutral-950/90" />

        {/* Top desktop header banner */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-neutral-500 uppercase tracking-wider">Admin</span>
            <ChevronRight size={14} className="text-neutral-700" />
            <span className="font-semibold text-white uppercase tracking-wider">
              {navItems.find((n) => n.path === activePath)?.name || "Dashboard"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {unacknowledgedCount > 0 && (
              <button
                onClick={() => handleNav("/admin/orders")}
                className="inline-flex items-center gap-2 rounded-full bg-red-950/90 border border-red-700/80 px-3 py-1 text-xs font-bold text-red-200 hover:bg-red-900 transition-colors cursor-pointer shadow-sm animate-pulse"
              >
                <span>🔔</span>
                <span>{unacknowledgedCount} New Order{unacknowledgedCount > 1 ? "s" : ""}</span>
              </button>
            )}

            <button
              onClick={() => handleNav("/")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>View Storefront</span>
              <ExternalLink size={13} />
            </button>
            <div className="h-4 w-px bg-neutral-800" />
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Session Secure</span>
            </div>
          </div>
        </div>

        {/* FLOATING REALTIME NEW ORDER NOTIFICATION BANNER */}
        {latestNotification && (
          <aside
            aria-label="New order notification"
            className="fixed top-4 right-4 z-50 max-w-sm w-full rounded-2xl border border-amber-500/80 bg-neutral-900/95 backdrop-blur-xl p-4 text-white shadow-2xl shadow-black animate-in slide-in-from-top-4 duration-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-amber-500/20 text-amber-400 grid place-items-center shrink-0">
                  <Bell size={18} className="animate-bounce" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    🔔 New Order
                  </div>
                  <div className="text-sm font-black font-display text-white">
                    Order {latestNotification.orderNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={dismissNotification}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Dismiss notification"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-3 pl-11 space-y-1 text-xs">
              <div className="font-bold text-white text-sm">{latestNotification.customerName}</div>
              <div className="text-primary font-display font-black text-base">
                R{latestNotification.total.toLocaleString("en-ZA")}.00
              </div>
              <div className="text-[11px] font-semibold text-amber-300">
                Payment: {latestNotification.paymentStatus}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 pl-11">
              <button
                onClick={dismissNotification}
                className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => viewOrder(latestNotification)}
                className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all cursor-pointer"
              >
                View Order →
              </button>
            </div>
          </aside>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-xs"
        />
      )}
    </div>
  );
}
