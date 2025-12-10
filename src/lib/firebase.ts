// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  enableIndexedDbPersistence,
  type Firestore,
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const isServer = typeof window === "undefined";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID ||
    undefined,
};

let app: any = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: any = null;

if (!isServer) {
  const hasCritical =
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.authDomain &&
    firebaseConfig.appId;

  if (!hasCritical) {
    console.error("[firebase] Missing critical config. Firebase NOT initialized.");
  } else {
    try {
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

      try {
        auth = getAuth(app);
      } catch (e) {
        console.warn("[firebase] getAuth failed:", e);
        auth = null;
      }

      // Prefer long polling only. If it fails, fallback to getFirestore.
      try {
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true,
          useFetchStreams: false,
        } as any);
      } catch (err) {
        console.warn("[firebase] initializeFirestore failed, falling back:", err);
        try {
          db = getFirestore(app);
        } catch (e) {
          console.error("[firebase] getFirestore fallback failed:", e);
          db = null;
        }
      }

      if (db) {
        enableIndexedDbPersistence(db).catch((err: any) => {
          if (err?.code === "failed-precondition") {
            console.warn("IndexedDB persistence failed: multiple tabs.");
          } else if (err?.code === "unimplemented") {
            console.warn("IndexedDB persistence not available.");
          } else {
            console.warn("IndexedDB persistence error:", err);
          }
        });
      }

      isSupported()
        .then((supported) => {
          if (supported && app) {
            try {
              analytics = getAnalytics(app);
            } catch (e) {
              console.warn("Analytics init failed:", e);
            }
          }
        })
        .catch(() => {
          analytics = null;
        });
    } catch (e: any) {
      console.error("[firebase] initialization failed:", e?.message ?? e);
      app = null;
      auth = null;
      db = null;
      analytics = null;
    }
  }

  // expose for easy debugging (dev only)
  if (typeof window !== "undefined") {
    (window as any)._debug_db = db;
  }
}

// helpers that throw if not ready (fail fast)
export function getDb() {
  if (!db) throw new Error("Firestore not initialized (db is null). Check env vars and client-side only usage.");
  return db;
}

export function getAuthSafe() {
  if (!auth) throw new Error("Auth not initialized (auth is null). Check client-side usage.");
  return auth;
}

export { app, auth, db, analytics };
export default app;
