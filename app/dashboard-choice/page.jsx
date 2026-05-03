"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

import ThemeToggle from "../../components/ThemeToggle";
import TopMenuButton from "../../components/TopMenuButton";

export default function DashboardChoicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    if (authLoading) return;        // Wait until auth initializes
    if (!user) {                    // No user → redirect to login
      router.replace("/auth/login");
      return;
    }

    let cancelled = false;

    const loadGroups = async () => {
      try {
        if (!db) {
          console.error("Firestore DB is not initialized.");
          if (!cancelled) setLoading(false);
          return;
        }

        // Try fetching groups where the user is admin — OPTIONAL, NOT required
        // Since you haven't implemented roles yet, this will simply return empty
        const groupsRef = collection(db, "groups");
        const q = query(groupsRef, where("adminId", "==", user.uid));

        // Add a timeout so it NEVER hangs
        const fetchPromise = getDocs(q);
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("firestore-timeout")), 8000)
        );

        const snap = await Promise.race([fetchPromise, timeout]);

        if (!cancelled) {
          if (!snap.empty) {
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setUserGroups(list);
          } else {
            setUserGroups([]);  // No groups, which is perfectly fine
          }
        }
      } catch (err) {
        console.error("Error loading groups:", err);
        setUserGroups([]);  
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadGroups();

    return () => { cancelled = true; };
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-white min-h-screen flex items-center justify-center">
        Please login to continue
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100">

  {/* 🔵 BACKGROUND GLOWS */}
  <div className="absolute w-[400px] h-[400px] bg-blue-200/30 blur-3xl rounded-full top-[-100px] left-[-100px]" />
  <div className="absolute w-[300px] h-[300px] bg-indigo-300/20 blur-3xl rounded-full bottom-[-80px] right-[-80px]" />

  <TopMenuButton />

  {/* 🏷️ HEADER */}
  <div className="text-center mb-12 z-10">
    <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900">
      How do you want to track today?
    </h1>
    
  </div>

  {/* 🧩 OPTIONS */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl z-10">

    {/* 👥 TEAM DASHBOARD */}
    <div
      onClick={() => {
        if (userGroups.length > 0) router.push(`/groups/${userGroups[0].id}`);
        else router.push("/groups");
      }}
      className="group cursor-pointer rounded-3xl p-10 bg-white/70 backdrop-blur-xl border border-blue-100 shadow-lg transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl relative overflow-hidden"
    >
      {/* glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-blue-200/20 to-indigo-200/20" />

      <div className="relative z-10 flex flex-col items-center text-center">

        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white text-2xl shadow-lg">
          🤝
        </div>

        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          Team Dashboard
        </h2>

        <p className="text-gray-600 text-sm mb-4">
          Track progress together, stay accountable, and grow with your circle.
        </p>

        <span className="text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition">
          {userGroups.length > 0 ? "Continue your group →" : "Start a team →"}
        </span>
      </div>
    </div>

    {/* 👤 PERSONAL DASHBOARD */}
    <div
      onClick={() => router.push("/dashboard")}
      className="group cursor-pointer rounded-3xl p-10 bg-white/70 backdrop-blur-xl border border-blue-100 shadow-lg transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-r from-blue-200/20 to-indigo-200/20" />

      <div className="relative z-10 flex flex-col items-center text-center">

        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white text-2xl shadow-lg">
          📊
        </div>

        <h2 className="text-2xl font-bold text-blue-900 mb-2">
          Your Dashboard
        </h2>

        <p className="text-gray-600 text-sm mb-4">
          Focus on your personal goals, habits, and daily health insights.
        </p>

        <span className="text-blue-600 font-semibold text-sm group-hover:translate-x-1 transition">
          Go to dashboard →
        </span>
      </div>
    </div>

  </div>

  {/* ✨ SUBTLE FLOATING ELEMENTS */}
  <div className="absolute top-20 left-10 text-blue-400 opacity-20 animate-bounce">💧</div>
  <div className="absolute bottom-20 right-10 text-blue-400 opacity-20 animate-bounce delay-200">❤️</div>

</div>
  );
}
