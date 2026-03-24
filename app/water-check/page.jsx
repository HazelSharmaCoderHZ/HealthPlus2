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

// Animated water glass component
function WaterGlass({ percent }) {
  const safePercent = Math.min(100, Math.max(0, percent));
  const fillHeight = (safePercent / 100) * 120;
  const waterColor = safePercent >= 100 ? "#22d3ee" : "#3b82f6";
  const waterLight = safePercent >= 100 ? "#67e8f9" : "#93c5fd";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="80" height="140" viewBox="0 0 80 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Glass body */}
        <path d="M10 10 L6 130 Q6 134 10 134 L70 134 Q74 134 74 130 L70 10 Z"
          fill="rgba(219,234,254,0.3)" stroke="#bfdbfe" strokeWidth="2" />

        {/* Water fill - clipped */}
        <clipPath id="glassClip">
          <path d="M10 10 L6 130 Q6 134 10 134 L70 134 Q74 134 74 130 L70 10 Z" />
        </clipPath>
        <g clipPath="url(#glassClip)">
          {/* Water body */}
          <rect
            x="6" y={134 - fillHeight} width="68" height={fillHeight}
            fill={waterColor}
            style={{ transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}
          />
          {/* Wave on top of water */}
          {safePercent > 2 && (
            <g style={{ transition: "transform 0.6s cubic-bezier(0.4,0,0.2,1)", transform: `translateY(${134 - fillHeight}px)` }}>
              <path
                d={`M6 8 Q20 2 34 8 Q48 14 62 8 Q68 5 74 8 L74 16 L6 16 Z`}
                fill={waterLight}
                opacity="0.7"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; -14,0; 0,0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          )}
          {/* Shine */}
          <rect x="16" y={Math.max(10, 134 - fillHeight + 6)} width="6" height={Math.min(fillHeight - 12, 60)}
            rx="3" fill="white" opacity="0.25"
            style={{ transition: "all 0.6s cubic-bezier(0.4,0,0.2,1)" }}
          />
        </g>
        {/* Glass rim */}
        <line x1="10" y1="10" x2="70" y2="10" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-2xl font-bold text-blue-700">{safePercent}%</span>
      <span className="text-xs text-slate-500">of daily goal</span>
    </div>
  );
}

export default function WaterCheckPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [weight, setWeight] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);

  const [glasses, setGlasses] = useState(0);
  const [extraMl, setExtraMl] = useState(0);
  const [customAdd, setCustomAdd] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [username, setUsername] = useState("");

  const saveTimer = useRef(null);
  const weightInputRef = useRef(null);

  const today = toDateId(new Date());
  const GLASS_SIZE = 250;
  const waterPerKg = 35;

  const recommended = weight ? Number(weight) * waterPerKg : 0;
  const consumed = glasses * GLASS_SIZE + extraMl;
  const percentage = recommended ? Math.min((consumed / recommended) * 100, 100) : 0;
  const percent = Math.round(percentage);
  const showGoal = weight && Number(weight) > 0 && consumed >= recommended && recommended > 0;

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists() && mounted) {
          const data = profileSnap.data();
          setUsername(data?.username || "");
          if (data?.weight) {
            setWeight(data.weight);
            setWeightInput(data.weight);
            setWeightSaved(true);
          } else {
            setEditingWeight(true);
          }
        }

        const intakeRef = doc(db, "users", user.uid, "waterIntake", today);
        const intakeSnap = await getDoc(intakeRef);
        if (mounted && intakeSnap.exists()) {
          const d = intakeSnap.data();
          setGlasses(Number(d.glasses ?? 0));
          setExtraMl(Number(d.extraMl ?? 0));
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

  useEffect(() => {
    if (editingWeight && weightInputRef.current) weightInputRef.current.focus();
  }, [editingWeight]);

  const handleSaveWeight = async () => {
    const val = Number(weightInput);
    if (!val || val <= 0) return;
    try {
      await setDoc(doc(db, "users", user.uid), { weight: weightInput }, { merge: true });
      setWeight(weightInput);
      setWeightSaved(true);
      setEditingWeight(false);
    } catch (err) {
      console.error("weight save error:", err);
    }
  };

  useEffect(() => {
    if (!user || !weight) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      setMsg("");
      try {
        await setDoc(
          doc(db, "users", user.uid, "waterIntake", today),
          { date: today, glasses, extraMl, consumed, recommended },
          { merge: true }
        );
        setMsg("Saved ✓");
        setTimeout(() => setMsg(""), 1500);
      } catch (err) {
        setMsg("Failed to save");
      } finally {
        setSaving(false);
      }
    }, 700);
    return () => clearTimeout(saveTimer.current);
  }, [user, glasses, extraMl]);

  const handleAddCustom = () => {
    const ml = Number(customAdd);
    if (!ml || ml <= 0) return;
    setExtraMl((prev) => prev + ml);
    setCustomAdd("");
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-600 text-sm">Please log in to continue.</p>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top nav — full width, no overlap */}
        
        <TopMenuButton />
      

      <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Stay Hydrated 💧</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Hello, <span className="text-blue-600 font-medium">{username}</span> — here's your water intake for today.
          </p>
        </div>

        {/* Main 2-col grid on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT — glass visualizer */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-8 px-4 gap-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Today's Intake</p>
            <WaterGlass percent={percent} />
            <div className="text-center mt-2">
              <p className="text-3xl font-bold text-slate-900">{(consumed / 1000).toFixed(2)} <span className="text-base font-medium text-slate-400">L</span></p>
              <p className="text-sm text-slate-500">of {(recommended / 1000).toFixed(2)} L goal</p>
            </div>
            {showGoal && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-sm font-semibold text-emerald-700 text-center">
                🎉 Daily goal reached!
              </div>
            )}
            {/* Save status */}
            <div className="h-4">
              {saving ? (
                <div className="flex items-center gap-1.5 text-blue-400 text-xs">
                  <div className="h-3 w-3 rounded-full border border-blue-200 border-t-blue-500 animate-spin" />
                  Saving…
                </div>
              ) : (
                <p className="text-xs text-slate-400">{msg}</p>
              )}
            </div>
          </div>

          {/* RIGHT — controls */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Weight card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Your Weight</p>
              {editingWeight ? (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={weightInputRef}
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveWeight()}
                    placeholder="Enter weight in kg"
                    className="w-40 px-3 py-2 text-sm border border-blue-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                  />
                  <button onClick={handleSaveWeight}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
                    Save
                  </button>
                  {weightSaved && (
                    <button onClick={() => { setWeightInput(weight); setEditingWeight(false); }}
                      className="text-sm text-slate-400 hover:text-slate-600 transition">
                      Cancel
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <span className="text-3xl font-bold text-slate-900">{weight}</span>
                    <span className="text-slate-400 text-sm ml-1">kg</span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <p className="text-xs text-slate-400">Daily goal</p>
                    <p className="text-lg font-semibold text-blue-600">{(recommended / 1000).toFixed(2)} L</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div>
                    <p className="text-xs text-slate-400">Formula</p>
                    <p className="text-sm text-slate-600">weight × 35 ml</p>
                  </div>
                  <button onClick={() => setEditingWeight(true)}
                    title="Edit weight"
                    className="ml-auto p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Progress bar card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Progress</p>
                <span className="text-sm font-semibold text-blue-600">{percent}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">
                {glasses} glass{glasses !== 1 ? "es" : ""} ({glasses * GLASS_SIZE} ml) + {extraMl} ml custom = <span className="text-slate-600 font-medium">{consumed} ml</span>
              </p>
            </div>

            {/* Glass controls card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">Log Water</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setGlasses((g) => g + 1)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition">
                  + Add Glass <span className="text-blue-200 text-xs font-normal">(250 ml)</span>
                </button>
                <button onClick={() => setGlasses((g) => Math.max(0, g - 1))}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:border-red-300 hover:text-red-500 text-slate-600 text-sm font-medium rounded-xl transition">
                  − Remove Glass
                </button>
                <button onClick={() => { setGlasses(0); setExtraMl(0); }}
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-400 text-slate-400 text-sm font-medium rounded-xl transition ml-auto">
                  Reset
                </button>
              </div>

              {/* Custom ml */}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={customAdd}
                  onChange={(e) => setCustomAdd(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                  placeholder="Add custom ml  (e.g. 120)"
                  className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 min-w-0"
                />
                <button onClick={handleAddCustom}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition whitespace-nowrap">
                  Add ml
                </button>
              </div>
            </div>

            {/* Back */}
            <button onClick={() => router.push("/dashboard")}
              className="text-sm text-slate-400 hover:text-blue-600 transition flex items-center gap-1.5 self-start mt-1">
              ← Back to Dashboard
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}