import React from "react";
import { useRouter } from "../../lib/router";
import { AdminLogin } from "./AdminLogin";
import { AdminGuard } from "./AdminGuard";
import { AdminLayout } from "./AdminLayout";
import { AdminDashboard } from "./AdminDashboard";
import { AdminPlaceholder } from "./AdminPlaceholder";

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
    content = <AdminPlaceholder module="products" />;
    activePath = "/admin/products";
  } else if (pathname === "/admin/combos") {
    content = <AdminPlaceholder module="combos" />;
    activePath = "/admin/combos";
  } else if (pathname === "/admin/inventory") {
    content = <AdminPlaceholder module="inventory" />;
    activePath = "/admin/inventory";
  } else if (pathname === "/admin/orders") {
    content = <AdminPlaceholder module="orders" />;
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
