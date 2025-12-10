// src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  User,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload,
} from "firebase/auth";

import type { FirebaseError } from "firebase/app";
import { auth as maybeAuth, db as maybeDb } from "@/lib/firebase";

type AppUser = User & { role?: string };

export type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  // Added alias-friendly logout method (keeps backwards compatibility)
  logout: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, role?: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshCurrentUser: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // app-level firebase exports might be null on server; guard with safe* variables
  const safeAuth = maybeAuth ?? null;
  const safeDb = maybeDb ?? null;

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait until auth is available on the client
    if (!safeAuth) {
      // If auth isn't ready (server), do nothing; when client hydrates, this effect will run again
      return;
    }

    let cancelled = false;

    const handleAuthUser = async (u: User | null) => {
      if (!u) {
        if (!cancelled) setUser(null);
        if (!cancelled) setLoading(false);
        return;
      }

      // If there's no Firestore, proceed with auth-only user
      if (!safeDb) {
        if (!cancelled) setUser({ ...u, role: "user" } as AppUser);
        if (!cancelled) setLoading(false);
        return;
      }

      // Try to load Firestore profile (one attempt + one retry)
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const userDoc = await getDoc(doc(safeDb, "users", u.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        if (!cancelled) setUser({ ...u, role: (userData as any)?.role || "user" } as AppUser);
      } catch (err) {
        console.warn("Failed to load Firestore profile (first attempt):", err);

        // single retry after short delay (helps transient emulator/network flakiness)
        try {
          await new Promise((res) => setTimeout(res, 1000));
          const { doc, getDoc } = await import("firebase/firestore");
          const userDoc = await getDoc(doc(safeDb, "users", u.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          if (!cancelled) setUser({ ...u, role: (userData as any)?.role || "user" } as AppUser);
        } catch (err2) {
          console.warn("Retry to load Firestore profile failed; continuing with auth-only user:", err2);
          if (!cancelled) setUser({ ...u, role: "user" } as AppUser);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const unsub = onAuthStateChanged(safeAuth, (u) => {
      // run async handler but don't await here
      void handleAuthUser(u);
    });

    return () => {
      cancelled = true;
      try {
        unsub();
      } catch (e) {
        // ignore
      }
    };
  }, [safeAuth, safeDb]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      loading,

      // Google sign-in (strict: require emailVerified)
      signInWithGoogle: async () => {
        if (!safeAuth) throw new Error("Auth not ready");
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(safeAuth, provider);

        // Try to reload user to get the latest emailVerified state
        try {
          await reload(result.user);
        } catch (e) {
          console.warn("reload after Google sign-in failed:", e);
        }

        if (!result.user.emailVerified) {
          // Most Google accounts are verified automatically, but if not: sign out and throw
          await signOut(safeAuth);
          const err = new Error("email-not-verified");
          throw err;
        }
      },

      // Original signOutUser (keeps existing code working)
      signOutUser: async () => {
        if (!safeAuth) return;
        await signOut(safeAuth);
      },

      // Added logout alias for convenience (calls signOut as well)
      logout: async () => {
        if (!safeAuth) return;
        await signOut(safeAuth);
      },

      // Email/password login: require verified email
      signInEmail: async (email: string, password: string) => {
        if (!safeAuth) throw new Error("Auth not ready");
        const cred = await signInWithEmailAndPassword(safeAuth, email, password);

        try {
          await reload(cred.user);
        } catch (e) {
          console.warn("reload after email signin failed:", e);
        }

        if (!cred.user.emailVerified) {
          // immediately sign out and notify caller
          await signOut(safeAuth);
          const err = new Error("email-not-verified");
          throw err;
        }

        // successful sign-in -> onAuthStateChanged will update user state
      },

      // Sign-up: create auth user, send verification, write users doc (best-effort)
      signUpEmail: async (email: string, password: string, role = "user") => {
        if (!safeAuth) throw new Error("Auth not ready");

        // 1) Create auth user
        const userCred = await createUserWithEmailAndPassword(safeAuth, email, password);
        const uid = userCred.user.uid;

        // 2) Send verification email (non-blocking; log errors)
        try {
          const actionCodeSettings = {
            url: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/auth/verify-success`,
            handleCodeInApp: false,
          };
          await sendEmailVerification(userCred.user, actionCodeSettings);
        } catch (e) {
          console.warn("sendEmailVerification failed:", e);
        }

        // 3) Best-effort: write users/{uid} doc (don't block signup indefinitely)
        if (safeDb) {
          try {
            const writeUserDoc = async () => {
              const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
              await setDoc(doc(safeDb, "users", uid), {
                email,
                role,
                createdAt: serverTimestamp(),
              });
            };

            await Promise.race([
              writeUserDoc(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error("firestore-write-timeout")), 8000)
              ),
            ]);
          } catch (err) {
            console.warn("Firestore write failed or timed out (signup):", err);
            // do not throw — signup completed in Auth; user can continue to verify
          }
        }

        return;
      },

      // Resend verification to currently signed-in user
      resendVerification: async () => {
        if (!safeAuth || !safeAuth.currentUser) throw new Error("Auth not ready or no user");
        try {
          await sendEmailVerification(safeAuth.currentUser);
        } catch (e) {
          console.warn("resendVerification failed:", e);
          throw e as FirebaseError;
        }
      },

      // Force reload current user and return whether they are now emailVerified
      refreshCurrentUser: async () => {
        if (!safeAuth || !safeAuth.currentUser) throw new Error("Auth not ready or no user");
        try {
          await reload(safeAuth.currentUser);
          return Boolean(safeAuth.currentUser?.emailVerified);
        } catch (e) {
          console.warn("refreshCurrentUser failed:", e);
          return false;
        }
      },
    };
    // dependencies: user/loading are included because callers may depend on latest user
  }, [user, loading, safeAuth, safeDb]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// consumer hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
