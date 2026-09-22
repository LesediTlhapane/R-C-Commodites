import React, { useState, useEffect } from "react";
import { Lock, Mail, Key, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, ArrowRight, Database } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useRouter } from "../../lib/router";
import logoAsset from "../../assets/rc-logo.png";
import vredesteinLogo from "../../assets/vredestein-logo.png";
import backgroundAsset from "../../assets/background.png";

export function AdminLogin() {
  const { user, isAdmin, isLoading, isConfigured, signIn, authError } = useAdminAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // If already logged in and verified as admin, redirect directly to /admin
  useEffect(() => {
    if (!isLoading && user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isLoading, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signIn(email, password);
      if (res.success) {
        navigate("/admin", { replace: true });
      } else {
        setLocalError(res.error || "Authentication failed.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-neutral-950 text-white flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Background with tuned contrast */}
      <img
        src={backgroundAsset}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-20 h-full w-full object-cover opacity-35 filter contrast-125"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-neutral-950/90 via-neutral-950/80 to-neutral-950/95" />

      {/* Back to Storefront Link */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Storefront
        </button>

        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>RLS Protected</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle accent border line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <img
              src={logoAsset}
              alt="R&C Commodities"
              className="h-16 w-auto object-contain drop-shadow-md"
            />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-800/80 border border-neutral-700/60 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-300 mb-2">
            <Lock size={11} className="text-primary" />
            <span>Admin Portal</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black font-display uppercase tracking-wider text-white">
            <span className="text-primary">R&amp;C</span> Commodities
          </h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">
            Authorized Personnel Only
          </p>
        </div>

        {/* Supabase Configuration Warning if missing */}
        {!isConfigured && (
          <div className="mb-5 rounded-xl border border-amber-800/80 bg-amber-950/40 p-3.5 text-xs text-amber-200">
            <div className="flex items-start gap-2.5">
              <Database size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Supabase Environment Setup Required</strong>
                <p className="text-[11px] text-amber-300/90 leading-relaxed">
                  Provide <code className="bg-black/50 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_URL</code> and{" "}
                  <code className="bg-black/50 px-1 py-0.5 rounded font-mono">VITE_SUPABASE_ANON_KEY</code> in your environment or <code className="bg-black/50 px-1 py-0.5 rounded font-mono">.env</code> to connect authentication.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {(localError || authError) && (
          <div className="mb-5 rounded-xl border border-red-900/80 bg-red-950/50 p-3.5 text-xs text-red-200 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div className="leading-snug">{localError || authError}</div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Administrator Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rc-commodities.co.za"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 pl-10 pr-11 py-3 text-sm text-white placeholder-neutral-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                <span>Authenticating with Supabase...</span>
              </>
            ) : (
              <>
                <span>Sign In to Admin</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Security Footnote */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-500">
            <span>Powered by Supabase Auth</span>
            <span>•</span>
            <span>Role-Based Security</span>
          </div>
          <p className="text-[10px] text-neutral-600 mt-1">
            Access attempts are logged and validated against Row Level Security policies.
          </p>
        </div>
      </div>

      {/* Partner branding subtle footer */}
      <div className="mt-6 flex items-center gap-2 text-neutral-600 text-xs">
        <span className="text-[10px] uppercase tracking-widest font-mono">Official Vredestein Partner</span>
        <img src={vredesteinLogo} alt="" className="h-4 w-auto opacity-40 grayscale" />
      </div>
    </div>
  );
}
