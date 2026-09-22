import React, { useEffect } from "react";
import { ShieldAlert, LogOut, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useRouter } from "../../lib/router";
import logoAsset from "../../assets/rc-logo.png";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, isAdmin, isLoading, isConfigured, signOut, checkAdminRole } = useAdminAuth();
  const { navigate } = useRouter();

  // If not authenticated and not loading, redirect to /admin/login
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/admin/login", { replace: true });
    }
  }, [isLoading, user, navigate]);

  // Loading authorization state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white px-4">
        <div className="relative mb-6">
          <img
            src={logoAsset}
            alt="R&C Commodities"
            className="h-16 w-auto object-contain animate-pulse"
          />
          <div className="absolute -inset-2 rounded-full border border-primary/40 animate-ping" />
        </div>
        <div className="flex items-center gap-3 text-neutral-300 font-medium text-sm">
          <RefreshCw size={16} className="animate-spin text-primary" />
          <span>Verifying administrator authorization...</span>
        </div>
        <p className="text-neutral-500 text-xs mt-2 font-mono">
          Querying Supabase Role-Based Access Control (RLS)
        </p>
      </div>
    );
  }

  // Not authenticated (will redirect via useEffect, but render minimal backdrop while redirecting)
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        <span className="text-sm">Redirecting to administrator login...</span>
      </div>
    );
  }

  // Authenticated, but lacking the 'admin' role in public.user_roles
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-950/60 border border-red-800/80 text-red-400 mb-5 mx-auto">
            <ShieldAlert size={28} />
          </div>

          <h1 className="text-xl font-bold font-display uppercase tracking-wider text-center text-white">
            Access Restricted
          </h1>
          <p className="text-sm text-neutral-400 text-center mt-2">
            You are authenticated, but this account is not registered as an administrator in the database.
          </p>

          <div className="mt-5 p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono text-neutral-300">
            <div className="text-neutral-500 text-[11px] mb-1">Authenticated Account:</div>
            <div className="text-white font-semibold truncate">{user.email}</div>
            <div className="text-neutral-500 text-[11px] mt-2 mb-1">Status:</div>
            <div className="text-amber-400 font-medium flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Customer / Non-Admin (No `admin` role in `user_roles`)
            </div>
          </div>

          <div className="mt-5 text-xs text-neutral-400 leading-relaxed bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/60">
            <div className="flex items-center gap-1.5 text-primary font-semibold uppercase tracking-wider text-[10px] mb-1">
              <KeyRound size={12} /> How to Grant Access
            </div>
            To grant this account admin privileges, run this SQL query in your Supabase SQL Editor:
            <code className="block mt-2 p-2 rounded bg-neutral-900 border border-neutral-800 font-mono text-emerald-400 text-[11px] select-all overflow-x-auto">
              SELECT public.assign_admin('{user.email}');
            </code>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => checkAdminRole(user.id)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-primary-dark transition-all cursor-pointer"
            >
              <RefreshCw size={14} />
              Re-check Role
            </button>
            <button
              onClick={() => signOut()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/70 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full mt-3 inline-flex items-center justify-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer py-1"
          >
            <ArrowLeft size={13} />
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  // Authenticated & Authorised Admin
  return <>{children}</>;
}
