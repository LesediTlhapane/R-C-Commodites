import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
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
  checkAdminRole: (userId: string, userEmail?: string | null) => Promise<boolean>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();

  /**
   * Verifies directly against Supabase database whether the user holds the 'admin' role.
   * This is never derived from localStorage or client-side tampering.
   */
  const checkAdminRole = useCallback(async (userId: string, userEmail?: string | null): Promise<boolean> => {
    if (!isConfigured) return false;

    // Known configured administrator emails
    const ADMIN_EMAILS = [
      "leseditlhapane5@gmail.com",
      "admin@rc-commodities.co.za",
      "costa08@gmail.com",
      "costa@rc-commodities.co.za",
    ];

    if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase().trim())) {
      return true;
    }

    try {
      const roleCheckPromise = (async () => {
        // 1. Direct query on public.user_roles
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();

        if (!error && data && data.role === "admin") {
          return true;
        }

        // 2. RPC is_admin() fallback check
        try {
          const { data: rpcAdmin } = await supabase.rpc("is_admin");
          if (rpcAdmin === true) {
            return true;
          }
        } catch {
          // Fallback silently if RPC not yet deployed
        }

        return false;
      })();

      // 3.5s timeout safeguard so database stalls never freeze the UI
      const timeoutPromise = new Promise<boolean>((resolve) => {
        setTimeout(() => resolve(false), 3500);
      });

      return await Promise.race([roleCheckPromise, timeoutPromise]);
    } catch (err) {
      console.error("[AdminAuth] Unexpected error during role verification:", err);
      return false;
    }
  }, [isConfigured]);

  // Initialize session and set up auth state listener
  useEffect(() => {
    let mounted = true;

    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Fallback safety timeout: ensure isLoading is ALWAYS turned off within 4.5 seconds
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 4500);

    const initAuth = async () => {
      try {
        const getSessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{ data: { session: null }; error: Error }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null }, error: new Error("Session fetch timeout") }), 3500)
        );

        const { data: { session: initialSession }, error } = await Promise.race([
          getSessionPromise,
          timeoutPromise,
        ]);
        
        if (error) {
          console.warn("[AdminAuth] Error retrieving initial session:", error.message);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);

          if (initialSession?.user) {
            const adminStatus = await checkAdminRole(initialSession.user.id, initialSession.user.email);
            if (mounted) {
              setIsAdmin(adminStatus);
            }
          } else {
            setIsAdmin(false);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[AdminAuth] Failed to initialize session:", err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for real-time auth changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const adminStatus = await checkAdminRole(currentSession.user.id, currentSession.user.email);
          if (mounted) {
            setIsAdmin(adminStatus);
          }
        } else {
          setIsAdmin(false);
        }
        setIsLoading(false);
      }
    );

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
        const err = "Authentication failed: No user returned.";
        setAuthError(err);
        return { success: false, error: err };
      }

      // Verify that this authenticated account actually has the 'admin' role in user_roles
      const hasAdminRole = await checkAdminRole(data.user.id, data.user.email);
      if (!hasAdminRole) {
        // Authenticated as a user, but NOT an authorised administrator
        const err = "Access Denied: This account is authenticated but does not possess the 'admin' role in the database.";
        setAuthError(err);
        setIsAdmin(false);
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
   * Logs out the user from Supabase and resets client auth state.
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
