"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import TopMenuButton from "../../components/TopMenuButton";
import CircularProgress from "../../components/CircularProgress";

function toDateId(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function WaterCheckPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [weight, setWeight] = useState("");
  const [glasses, setGlasses] = useState(0);
  const [extraMl, setExtraMl] = useState(0); // custom ml added
  const [customAdd, setCustomAdd] = useState(""); // input field

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState("");

  const saveTimer = useRef(null);

  const today = toDateId(new Date());
  const GLASS_SIZE = 250; // ml
  const waterPerKg = 35;

  const recommended = weight ? Number(weight) * waterPerKg : 0;
  const consumed = glasses * GLASS_SIZE + extraMl;

  const percentage = recommended
    ? Math.min((consumed / recommended) * 100, 100)
    : 0;

  // define percent after percentage exists
  const percent = Math.round(percentage);

  const showGoal =
    weight && Number(weight) > 0 && recommended > 0 && consumed >= recommended;

  // LOAD
  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const fetchData = async () => {
      setLoading(true);

      try {
        // profile username
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists() && mounted) {
          setUsername(profileSnap.data()?.username || "");
        }

        // today's data
        const ref = doc(db, "users", user.uid, "waterIntake", today);
        const snap = await getDoc(ref);

        if (mounted && snap.exists()) {
          const data = snap.data();
          setWeight(data.weight ?? "");
          setGlasses(Number(data.glasses ?? 0));
          setExtraMl(Number(data.extraMl ?? 0));
        }
      } catch (err) {
        console.error("fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => (mounted = false);
  }, [user, today]);

  // AUTOSAVE
  useEffect(() => {
    if (!user) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setMsg("");

      try {
        await setDoc(
          doc(db, "users", user.uid, "waterIntake", today),
          {
            date: today,
            weight,
            glasses,
            extraMl,
            consumed,
            recommended,
          },
          { merge: true }
        );

        setMsg("Saved");
        setTimeout(() => setMsg(""), 1500);
      } catch (err) {
        console.error("save error:", err);
        setMsg("Failed to save");
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => clearTimeout(saveTimer.current);
  }, [user, weight, glasses, extraMl]);

  // custom ml add
  const handleAddCustom = () => {
    const ml = Number(customAdd);
    if (!ml || ml <= 0) return;

    setExtraMl((prev) => prev + ml);
    setCustomAdd("");
  };

  // ---------- UI ----------
  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-white">Please log in to continue.</p>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
            <path className="opacity-75" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
          <p className="text-slate-700">Loading your water data...</p>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen overflow-x-hidden text-slate-900 flex flex-col items-center py-12 px-6">
      {/* centered top blob */}
      <div className="absolute pointer-events-none left-1/2 -translate-x-1/2 -top-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-60"></div>

      {/* right-bottom blob kept inside viewport */}
      <div className="absolute pointer-events-none right-8 -bottom-24 w-72 h-72 bg-blue-200 rounded-full blur-3xl opacity-50"></div>

      <div className="w-full max-w-3xl relative">
        <TopMenuButton />

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              
              <p className="text-sm text-slate-600 mt-1">
                Hello, <span className="text-blue-700 font-semibold">{username}</span> 👋
                
              </p>
              <h1 className="text-3xl font-bold text-cyan-900 flex items-center gap-2">
                STAY  <span className="text-white bg-cyan-900 px-2">HYDRATED!</span>
              </h1>
            </div>

            <div>
              {saving ? (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="3"></circle>
                    <path className="opacity-75" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Saving…
                </div>
              ) : (
                <p className="text-sm text-slate-500">{msg || "Saved"}</p>
              )}
            </div>
          </div>

          {/* CONTENT GRID */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            {/* Weight */}
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
              <label className="block text-sm text-slate-700 mb-2">Enter your weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-blue-200"
                placeholder="e.g., 60"
              />
              <p className="mt-2 text-sm text-slate-600">
                Recommended:{" "}
                <span className="font-semibold text-blue-700">{(recommended / 1000).toFixed(2)} L/day</span>
              </p>

              <p className="mt-2 text-xs text-slate-500">1 glass = {GLASS_SIZE} ml</p>
            </div>

            {/* Progress */}
            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">

              <div className="flex items-center gap-6">
                <p className="text-sm text-slate-800 mb-2">Your Progress</p>
                <CircularProgress value={percent} size={140} stroke={12} />

                <div>
                  <div className="text-sm text-slate-700">Consumed</div>
                  <div className="text-lg font-semibold">{(consumed / 1000).toFixed(2)} L</div>
                  <div className="text-sm text-slate-600">Goal: {(recommended / 1000).toFixed(2)} L</div>
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4">
                {glasses} glasses + {extraMl} ml = {(consumed / 1000).toFixed(2)} L /{" "}
                {(recommended / 1000).toFixed(2)} L
              </p>

              {showGoal && (
                <p className="text-blue-700 font-semibold mb-3 animate-bounce">🎉 Goal Reached!</p>
              )}

              {/* Glass buttons */}
              <div className="flex gap-3 flex-wrap mb-4">
                <button onClick={() => setGlasses((g) => g + 1)} className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                  + Add Glass
                </button>
                <button onClick={() => setGlasses((g) => Math.max(0, g - 1))} className="px-3 py-1 bg-red-500 text-white rounded-lg">
                  - Remove
                </button>
                <button
                  onClick={() => {
                    setGlasses(0);
                    setExtraMl(0);
                  }}
                  className="px-3 py-1 bg-gray-500 text-white rounded-lg"
                >
                  Reset
                </button>
              </div>

              {/* Custom ml add */}
              <div className="flex gap-3">
                <input
                  type="number"
                  value={customAdd}
                  onChange={(e) => setCustomAdd(e.target.value)}
                  className="px-3 py-2 w-full border rounded-lg"
                  placeholder="Add custom ml (e.g., 120)"
                />
                <button onClick={handleAddCustom} className="px-4 py-2 bg-blue-700 text-white rounded-lg">
                  Add
                </button>
              </div>
            </div>
          </div>

          <button onClick={() => router.push("/dashboard")} className="mt-6 px-4 py-2 bg-blue-700 text-white rounded-lg">
            ⬅ Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
