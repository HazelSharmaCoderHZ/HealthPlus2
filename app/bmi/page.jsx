"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import TopMenuButton from "../../components/TopMenuButton";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function BMICalculatorPage() {
  const { user } = useAuth?.() || {};
  const router = useRouter();

  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [bmi, setBmi] = useState(null);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState(null); // male | female | other | null
  const [username, setUsername] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  // read gender and username from auth user or firestore users/{uid}
  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      if (!user?.uid) return;
      // try common places on auth user first
      const possibleGender = user?.gender || user?.profile?.gender || user?.metadata?.gender || null;
      const possibleName = user?.displayName || user?.username || user?.name || user?.profile?.name || null;

      if (possibleGender && mounted) setGender(String(possibleGender).toLowerCase());
      if (possibleName && mounted) setUsername(String(possibleName));

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (d?.gender && mounted) setGender(String(d.gender).toLowerCase());
          // prefer explicit stored username field if present
          if (d?.username && mounted) setUsername(String(d.username));
          else if (d?.name && mounted && !username) setUsername(String(d.name));
        }
      } catch (e) {
        console.warn("could not fetch profile", e);
      }
    }
    loadProfile();
    return () => { mounted = false; };
  }, [user]);

  const parse = (v) => {
    if (v === null || v === undefined || v === "") return NaN;
    return parseFloat(v);
  };

  const getCategory = (value) => {
    if (value < 18.5) return { label: "Underweight", colorClass: "text-blue-900" };
    if (value >= 18.5 && value < 24.9) return { label: "Normal", colorClass: "text-cyan-900" };
    if (value >= 25 && value < 29.9) return { label: "Overweight", colorClass: "text-black" };
    return { label: "Obese", colorClass: "text-black" };
  };

  const calculateBMI = () => {
    const w = parse(weight);
    const h = parse(height);

    if (!weight || !height) {
      setError("Please enter both weight and height.");
      setBmi(null);
      setCategory("");
      return;
    }

    if (isNaN(w) || isNaN(h)) {
      setError("Please enter valid numbers.");
      return;
    }

    if (w <= 0 || h <= 0) {
      setError("Weight and height must be positive numbers.");
      return;
    }

    setError("");
    const heightInMeters = h / 100;
    const bmiValue = +(w / (heightInMeters * heightInMeters));
    const rounded = Math.round(bmiValue * 100) / 100;
    setBmi(rounded);
    const cat = getCategory(rounded);
    setCategory(cat.label);
  };

  // visuals helpers
  const gaugePercent = () => {
    if (bmi === null) return 0;
    const min = 10, max = 40;
    const clamped = Math.max(min, Math.min(max, bmi));
    return ((clamped - min) / (max - min)) * 100;
  };

  const genderTip = () => {
    if (!gender) return "General guidance - calculate to see tailored tips.";
    if (gender.includes("f")) return "For women - focus on strength, calcium and balanced protein.";
    if (gender.includes("m")) return "For men - combine resistance training with cardio.";
    return "Maintain balanced diet and activity.";
  };

  const copyToClipboard = async () => {
    if (bmi === null) return;
    try {
      await navigator.clipboard.writeText(`My BMI is ${bmi} - ${category}`);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus(""), 2000);
    } catch (e) {
      setCopyStatus("Copy failed");
      setTimeout(() => setCopyStatus(""), 2000);
    }
  };

  useEffect(() => {
    // reset result when inputs change
    if (!weight || !height) {
      setBmi(null);
      setCategory("");
    }
  }, [weight, height]);

  // unified box style for equal dimensions, padding inside
  const boxBase = "p-4 bg-white border border-slate-100 rounded-xl flex flex-col items-center justify-start shadow";
  const boxSize = "h-64 w-64"; // fixed equal height and width for visual boxes

  return (
    <main className="min-h-screen w-full text-black p-6">
      <TopMenuButton />

      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="w-full text-center">
            <h1 className="text-4xl font-extrabold text-black"> <span className="text-white bg-cyan-900 "> Stay Healthy - BMI</span></h1>
            <p className="mt-1 text-sm text-blue-900">Fast, visual, interactive - results reflect your stored gender when available</p>
          </div>
        </header>

        <div className="flex items-center justify-between mb-4">
          <div />
          <div className="text-sm text-blue-900"><badge>*User - {username || "not set"}</badge></div>
        </div>

        {/* core inputs - inline, single flow */}
        <section className="mt-2 w-full flex flex-col gap-4">
          <div className="flex gap-3 flex-col sm:flex-row">
            <div className="flex-1">
              <label className="block text-sm font-medium">Weight (kg)</label>
              <input inputMode="decimal" type="number" value={weight} onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 60" className="mt-2 w-1/2 rounded-lg border border-slate-200 px-3 py-2 outline-none" />
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium">Height (cm)</label>
              <input inputMode="decimal" type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 170" className="mt-2 w-1/2 rounded-lg border border-slate-200 px-3 py-2 outline-none" />
            </div>

            <button onClick={calculateBMI} className="w-1/7 h-1/3 py-2 px-3 mt-2 rounded-md hover:bg-blue-600 bg-blue-900 text-white font-semibold">Calculate</button>
            <button onClick={() => { setWeight(""); setHeight(""); setBmi(null); setCategory(""); setError(""); }}
              className="w-1/7 h-1/3 py-2 px-3 mt-2 rounded-md bg-blue-900 text-white font-semibold hover:bg-blue-600">Reset</button>
            <button onClick={copyToClipboard} className="w-1/7 h-1/3 py-2 px-3 mt-2 rounded-md hover:bg-blue-600 bg-blue-900 text-white font-semibold">Copy</button>
            {copyStatus && <div className="w-1/7 h-1/3 py-2 px-3 mt-2 rounded-md text-black font-semibold">{copyStatus}</div>}
          </div>

          {error && <div className="text-red-600">{error}</div>}

          {/* interactive visuals row - equal sized boxes */}
          <div className="mt-4 w-full flex flex-wrap justify-center gap-6">

            {/* central radial gauge expanded */}
            <div className={`${boxBase} ${boxSize}`}>
              <div className="w-full flex-1 flex items-center w-44 h-44 justify-center">
                <svg viewBox="0 0 200 200" className="w-44 h-44">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" x2="100%">
                      <stop offset="0%" stopColor="#0ea5a0" />
                      <stop offset="50%" stopColor="#0369a1" />
                      <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                  </defs>

                  <circle cx="100" cy="100" r="80" stroke="#e6eefb" strokeWidth="16" fill="none" />
                  <motion.circle cx="100" cy="100" r="80" stroke="url(#gaugeGrad)" strokeWidth="16" strokeLinecap="round" fill="none"
                    strokeDasharray={Math.PI * 2 * 80}
                    animate={{ strokeDashoffset: (1 - gaugePercent() / 100) * Math.PI * 2 * 80 }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "100px 100px" }} />

                  <circle cx="100" cy="100" r="52" fill="#ffffff" />
                  <text x="100" y="92" textAnchor="middle" fontSize="12" fill="#0f172a">BMI</text>
                  <text x="100" y="118" textAnchor="middle" fontSize="28" fill="#0f172a" fontWeight={700}>{bmi !== null ? bmi : "--"}</text>
                </svg>
              </div>

              <div className="w-full mt-3 text-center text-sm text-blue-900 font-semibold">{category || "--"}</div>
            </div>

            {/* compact stats - represented as small visual bars */}
            <div className={`${boxBase} ${boxSize}`}>
              <div className="w-full flex-1 flex items-center w-44 h-44 justify-center">
                
                <div className="mt-2 w-44 h-44 space-y-3">
                  <h4 className="font-semibold">Visual Stats</h4>
                  {['Weight', 'Height', 'BMI Target'].map((label, i) => (
                    <div key={i} className="px-2">
                      <div className="flex justify-between text-xs"><div>{label}</div><div>{i===2? (bmi!==null? bmi : '--') : (i===0? weight || '--' : height || '--')}</div></div>
                      <div className="w-full h-3 bg-slate-100 rounded mt-1 overflow-hidden">
                        <motion.div className="h-3 bg-blue-900" initial={{ width: 0 }} animate={{ width: `${(bmi? Math.min(100, gaugePercent()) : 0)}%` }} transition={{ duration: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      <div className="mt-10 text-xs text-slate-600">*BMI categories use WHO ranges. This tool uses your stored gender only for tips, not thresholds.</div>
    </main>
  );
}
