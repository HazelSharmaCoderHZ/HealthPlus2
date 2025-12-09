// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId:
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ??
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENTID ??
    undefined,
};

// Debug print
if (!isServer && process.env.NODE_ENV === "development") {
  console.info("[firebase] config (dev):", {
    apiKey: firebaseConfig.apiKey ? "***present***" : "***MISSING***",
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    appId: firebaseConfig.appId ? "***present***" : "***MISSING***",
    measurementId: firebaseConfig.measurementId ?? "***not-set***",
  });
}

let app: FirebaseApp | null = null;
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
      // Avoid re-initializing the app
      app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

      auth = getAuth(app);

      // 🎯 Firestore: prefer long-polling to avoid firewall/Kaspersky issues
      try {
       // Prefer forceLongPolling only — don't pass both flags (they conflict).
db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  // experimentalAutoDetectLongPolling: true, // disabled: conflicts with forceLongPolling
  useFetchStreams: false,
} as any);

      } catch (err) {
        console.warn("[firebase] initializeFirestore failed, falling back:", err);
        db = getFirestore(app);
      }

      // 🎯 Enable persistence for queued offline writes (setup page won't hang)
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

      // Expose db for browser debugging (dev only)
      if (typeof window !== "undefined") {
        (window as any)._debug_db = db;
      }

      // Analytics (optional)
      isSupported()
        .then((supported) => {
          if (supported) {
            try {
              analytics = getAnalytics(app!);
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
}

if (typeof window !== "undefined") {
  console.log(
    "[firebase] init:",
    "auth:", !!auth,
    "db:", !!db
  );
}

export { app, auth, db, analytics };
export default app;
