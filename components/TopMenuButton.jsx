"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { getAuth, signOut } from "firebase/auth";

export default function TopMenuButton() {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { logout } = useAuth() || {}; // defensive: may be undefined
  const router = useRouter();

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);

    try {
      // Prefer context logout if available
      if (typeof logout === "function") {
        await logout();
      } else {
        // Fallback to Firebase signOut
        await signOut(getAuth());
      }

      setOpen(false);
      // redirect to login or home
      router.push("/");
    } catch (err) {
      // Show message and log full error for debugging
      console.error("Logout failed (TopMenuButton):", err);
      // Try to give more useful message to user
      const message = (err && err.message) ? err.message : String(err);
      alert("Failed to logout: " + message + ". See console for details.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        className="fixed top-4 left-4 z-50 p-3 bg-black/50 text-white rounded-full shadow-lg hover:bg-indigo-700 transition"
        onClick={() => setOpen(!open)}
        aria-label="Open menu"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu overlay */}
      {open && (
        <div className="fixed top-16 left-4 z-40 w-48 bg-white border border-blue-700 text-blue-900 rounded-xl shadow-lg p-4 flex flex-col space-y-3">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="hover:text-indigo-300">Your Dashboard</Link>
          <Link href="/groups" onClick={() => setOpen(false)} className="hover:text-indigo-300">Team Dashboard</Link>
          <Link href="/dashboard-choice" onClick={() => setOpen(false)} className="hover:text-indigo-300">Home</Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="text-left hover:text-indigo-300 disabled:opacity-50"
          >
            {signingOut ? "Logging out..." : "Log Out"}
          </button>
        </div>
      )}
    </>
  );
}
