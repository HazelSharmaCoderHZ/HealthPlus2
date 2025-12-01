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
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12 relative text-white"
      style={{
        background: `
          radial-gradient(circle at 20% 30%, rgba(183, 218, 226, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(148, 173, 250, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 50% 80%, rgba(0, 229, 255, 0.2) 0%, transparent 40%),
          linear-gradient(to bottom, #99c8daff 0%, #6997a1ff 100%)
        `
      }}
    >
      {/* Top Buttons */}
      <TopMenuButton />
      

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">

        {/* TEAM DASHBOARD */}
        <div
          onClick={() => {
            // If group exists → open group page
            if (userGroups.length > 0) router.push(`/groups/${userGroups[0].id}`);
            // Else → open blank team dashboard
            else router.push("/team-dashboard");
          }}
          className="cursor-pointer bg-white/50 border border-grey-500/50 backdrop-blur-xl rounded-2xl shadow-xl p-10 flex flex-col items-center justify-center hover:scale-[1.04] hover:border-blue-700 transition-transform duration-300"
        >
          <h2 className="text-2xl font-bold mb-4 text-blue-900 shadow-md">
            Team Dashboard
          </h2>
          <p className="text-black text-center">
            Manage teams, shared logs, and collaborative features.
          </p>
        </div>

        {/* PERSONAL DASHBOARD */}
        <div
          onClick={() => router.push("/dashboard")}
          className="cursor-pointer bg-white/50 border border-grey-500/50 backdrop-blur-xl rounded-2xl shadow-xl p-10 flex flex-col items-center justify-center hover:scale-[1.04] hover:border-blue-700 transition-transform duration-300"
        >
          <h2 className="text-2xl font-bold mb-4 text-blue-900 shadow-md">
            Your Dashboard
          </h2>
          <p className="text-black text-center">
            View your personal logs, progress, features, and insights.
          </p>
        </div>

      </div>
    </div>
  );
}
