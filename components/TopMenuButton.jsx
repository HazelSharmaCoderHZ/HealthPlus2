"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function TopMenuButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        className="fixed top-4 left-4 z-50 p-3 bg-black/50 text-white rounded-full shadow-lg hover:bg-indigo-700 transition"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Menu overlay */}
      {open && (
        <div className="fixed top-16 left-4 z-40 w-50 sm:bg-white bg-white border border-blue-700 text-blue-900 text-black rounded-xl shadow-lg p-4 flex flex-col space-y-3C">
          <Link href="/dashboard" className="hover:text-indigo-300">Your Dashboard</Link>
          <Link href="/team-dashboard" className="hover:text-indigo-300">Team Dashboard</Link>
          <Link href="/dashboard" className="hover:text-indigo-300">Home</Link>
          <Link href="/profile" className="hover:text-indigo-300">Profile</Link>
          
        </div>
      )}
    </>
  );
}