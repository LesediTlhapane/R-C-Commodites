import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  checkAdminRole: (userId: string, userEmail?: string | null, userMetadata?: Record<string, unknown> | null) => Promise<boolean>;
  refreshRole: () => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Known configured administrator emails (case-insensitive)
const ADMIN_EMAILS = [
  "leseditlhapane5@gmail.com",
  "admin@rc-commodities.co.za",
  "costa08@gmail.com",
  "costa@rc-commodities.co.za",
];

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();

  // Guard to prevent concurrent role checks from racing
  const verifyingRef = useRef(false);

  /**
   * Verifies directly against database, RPC, and token claims whether the user holds admin authorization.
   */
  const checkAdminRole = useCallback(
    async (
      userId: string,
      userEmail?: string | null,
      userMetadata?: Record<string, unknown> | null
    ): Promise<boolean> => {
      if (!isConfigured) return false;

      // 1. Check known authorized administrator email whitelist & domain
      if (userEmail) {
        const cleanEmail = userEmail.toLowerCase().trim();
        if (ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.endsWith("@rc-commodities.co.za")) {
          return true;
        }
      }

      // 2. Check metadata claims on the Supabase user
      if (
        userMetadata?.role === "admin" ||
        userMetadata?.is_admin === true ||
        (userMetadata?.roles && Array.isArray(userMetadata.roles) && userMetadata.roles.includes("admin"))
      ) {
        return true;
      }

      // 3. Query public.user_roles table & is_admin() RPC
      try {
        const roleCheckPromise = (async () => {
          // Direct query on public.user_roles
          const { data, error } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "admin")
            .maybeSingle();

          if (!error && data && data.role === "admin") {
            return true;
          }

          // Fallback RPC check
          try {
            const { data: rpcAdmin } = await supabase.rpc("is_admin");
            if (rpcAdmin === true) {
              return true;
            }
          } catch {
            // Silently continue if RPC not deployed
          }

          return false;
        })();

        // 8s timeout safeguard so database stalls never freeze UI
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => resolve(false), 8000);
        });

        return await Promise.race([roleCheckPromise, timeoutPromise]);
      } catch (err) {
        console.error("[AdminAuth] Unexpected error during role verification:", err);
        return false;
      }
    },
    [isConfigured]
  );

  /**
   * Re-evaluates role for the currently active user and updates context state.
   */
  const refreshRole = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    const status = await checkAdminRole(user.id, user.email, user.user_metadata);
    setIsAdmin(status);
    return status;
  }, [user, checkAdminRole]);

  // Unified auth lifecycle: session restore, token refresh, and auth state listener
  useEffect(() => {
    let mounted = true;

    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Safety timer (6s) only as an ultimate fallback if database/auth completely stalls
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 6000);

    const applyUserSession = async (sessionToApply: Session | null) => {
      if (!mounted) return;

      if (!sessionToApply || !sessionToApply.user) {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Check if session token has expired
      const nowInSec = Math.floor(Date.now() / 1000);
      let activeSession = sessionToApply;
      if (activeSession.expires_at && activeSession.expires_at <= nowInSec) {
        try {
          const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
          if (!refreshErr && refreshed.session) {
            activeSession = refreshed.session;
          } else {
            // Token expired and cannot be refreshed
            setSession(null);
            setUser(null);
            setIsAdmin(false);
            setIsLoading(false);
            return;
          }
        } catch {
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
      }

      if (!mounted) return;

      setSession(activeSession);
      setUser(activeSession.user);

      const adminOk = await checkAdminRole(
        activeSession.user.id,
        activeSession.user.email,
        activeSession.user.user_metadata
      );

      if (mounted) {
        setIsAdmin(adminOk);
        setIsLoading(false);
      }
    };

    // 1. Initial direct session fetch from Supabase
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn("[AdminAuth] getSession notice:", error.message);
      }
      applyUserSession(data?.session ?? null);
    }).catch((err) => {
      if (mounted) {
        console.warn("[AdminAuth] getSession catch:", err);
        setIsLoading(false);
      }
    });

    // 2. Authoritative Supabase onAuthStateChange listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
        setAuthError(null);
        setIsLoading(false);
        return;
      }

      if (
        event === "INITIAL_SESSION" ||
        event === "SIGNED_IN" ||
        event === "TOKEN_REFRESHED" ||
        event === "USER_UPDATED"
      ) {
        applyUserSession(newSession);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [isConfigured, checkAdminRole]);

  /**
   * Signs in an administrator using Supabase Auth and validates admin authorization.
   */
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    setAuthError(null);

    if (!isConfigured) {
      const err = "Supabase is not configured. Please supply VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.";
      setAuthError(err);
      return { success: false, error: err };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      if (!data.user) {
        const err = "Authentication failed: No user returned by database.";
        setAuthError(err);
        return { success: false, error: err };
      }

      // Verify that this account has administrator rights
      const hasAdminRole = await checkAdminRole(
        data.user.id,
        data.user.email,
        data.user.user_metadata
      );

      if (!hasAdminRole) {
        const err = `Access Denied: "${data.user.email}" is authenticated, but does not possess the 'admin' role in user_roles.`;
        setAuthError(err);
        setIsAdmin(false);
        setUser(data.user);
        setSession(data.session);
        return { success: false, error: err };
      }

      setIsAdmin(true);
      setUser(data.user);
      setSession(data.session);
      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected authentication error occurred.";
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  /**
   * Logs out the user cleanly from Supabase and resets state.
   */
  const signOut = async (): Promise<void> => {
    try {
      if (isConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("[AdminAuth] Error during signOut:", err);
    } finally {
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setAuthError(null);
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isLoading,
        isConfigured,
        authError,
        signIn,
        signOut,
        checkAdminRole,
        refreshRole,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
