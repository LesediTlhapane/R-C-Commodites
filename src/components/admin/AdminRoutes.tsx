import React from "react";
import { useRouter } from "../../lib/router";
import { AdminLogin } from "./AdminLogin";
import { AdminGuard } from "./AdminGuard";
import { AdminLayout } from "./AdminLayout";
import { AdminDashboard } from "./AdminDashboard";
import { AdminPlaceholder } from "./AdminPlaceholder";
import { AdminProducts } from "./AdminProducts";
import { AdminOrders } from "./AdminOrders";

export function AdminRoutes() {
  const { pathname } = useRouter();

  // 1. Dedicated Admin Login Route (Public within Admin space, uses Supabase Auth)
  if (pathname === "/admin/login") {
    return <AdminLogin />;
  }

  // 2. Protected Admin Routes (Enforced by AdminGuard + Database RLS)
  let content = <AdminDashboard />;
  let activePath = "/admin";

  if (pathname === "/admin/products") {
    content = <AdminProducts />;
    activePath = "/admin/products";
  } else if (pathname === "/admin/combos") {
    content = <AdminPlaceholder module="combos" />;
    activePath = "/admin/combos";
  } else if (pathname === "/admin/inventory") {
    // Inventory routes directly to product & stock management
    content = <AdminProducts />;
    activePath = "/admin/inventory";
  } else if (pathname === "/admin/orders") {
    content = <AdminOrders />;
    activePath = "/admin/orders";
  } else {
    // Default to /admin dashboard
    content = <AdminDashboard />;
    activePath = "/admin";
  }

  return (
    <AdminGuard>
      <AdminLayout activePath={activePath}>
        {content}
      </AdminLayout>
    </AdminGuard>
  );
}
