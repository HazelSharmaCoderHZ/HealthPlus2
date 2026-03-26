"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import TopMenuButton from "../../components/TopMenuButton";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// ─── tiny helpers ────────────────────────────────────────────────────────────
const STORAGE_KEY = "bmi_user_measurements";

function saveMeasurements(w, h) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ weight: w, height: h })); } catch {}
}
function loadMeasurements() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { weight, height } = JSON.parse(raw);
    if (weight && height) return { weight, height };
  } catch {}
  return null;
}

const WHO_RANGES = [
  { label: "Severely Underweight", max: 16,   color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  { label: "Underweight",          max: 18.5,  color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  { label: "Normal",               max: 24.9,  color: "#10b981", bg: "rgba(16,185,129,0.14)"  },
  { label: "Overweight",           max: 29.9,  color: "#f59e0b", bg: "rgba(245,158,11,0.13)"  },
  { label: "Obese Class I",        max: 34.9,  color: "#f97316", bg: "rgba(249,115,22,0.13)"  },
  { label: "Obese Class II",       max: 39.9,  color: "#ef4444", bg: "rgba(239,68,68,0.13)"   },
  { label: "Obese Class III",      max: Infinity, color: "#dc2626", bg: "rgba(220,38,38,0.13)" },
];

function getCategoryInfo(bmi) {
  return WHO_RANGES.find(r => bmi < r.max) || WHO_RANGES[WHO_RANGES.length - 1];
}

function getIdealRange(heightCm) {
  const h = heightCm / 100;
  return { min: +(18.5 * h * h).toFixed(1), max: +(24.9 * h * h).toFixed(1) };
}

// arc helpers
const ARC_R = 82;
const ARC_CX = 110, ARC_CY = 110;
const ARC_START_DEG = 200, ARC_END_DEG = 340; // 340 degrees sweep
const deg2rad = d => (d * Math.PI) / 180;

function arcPoint(deg) {
  return {
    x: ARC_CX + ARC_R * Math.cos(deg2rad(deg - 90)),
    y: ARC_CY + ARC_R * Math.sin(deg2rad(deg - 90)),
  };
}
function arcPath(startDeg, endDeg) {
  const s = arcPoint(startDeg), e = arcPoint(endDeg);
  const large = (endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${ARC_R} ${ARC_R} 0 ${large} 1 ${e.x} ${e.y}`;
}

function bmiToDeg(bmi) {
  const MIN = 10, MAX = 40;
  const clamped = Math.max(MIN, Math.min(MAX, bmi));
  const t = (clamped - MIN) / (MAX - MIN);
  return ARC_START_DEG + t * ARC_END_DEG;
}

// ─── sub-components ───────────────────────────────────────────────────────────
function MeasurementPill({ label, value, unit, onEdit }) {
  return (
    <div className="bmi-pill">
      <span className="bmi-pill-label">{label}</span>
      <span className="bmi-pill-value">{value}<span className="bmi-pill-unit">{unit}</span></span>
      <button className="bmi-pill-edit" onClick={onEdit} aria-label={`Edit ${label}`}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, unit, autoFocus }) {
  return (
    <div className="bmi-input-wrap">
      <label className="bmi-input-label">{label}</label>
      <div className="bmi-input-inner">
        <input
          inputMode="decimal"
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="bmi-input"
        />
        <span className="bmi-input-unit">{unit}</span>
      </div>
    </div>
  );
}

function RadialGauge({ bmi, category }) {
  const activeDeg = bmi !== null ? bmiToDeg(bmi) : ARC_START_DEG;
  const sweepPath = bmi !== null
    ? arcPath(ARC_START_DEG, Math.min(activeDeg, ARC_START_DEG + ARC_END_DEG - 0.01))
    : null;
  const needle = bmi !== null ? arcPoint(activeDeg) : null;
  const trackPath = arcPath(ARC_START_DEG, ARC_START_DEG + ARC_END_DEG - 0.01);

  return (
    <svg viewBox="0 0 220 180" className="bmi-gauge-svg" aria-hidden="true">
      <defs>
        <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#0ea5e9" />
          <stop offset="35%"  stopColor="#164e63" />
          <stop offset="60%"  stopColor="#1e3a8a" />
          <stop offset="80%"  stopColor="#f97316" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* track */}
      <path d={trackPath} fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />

      {/* colored fill */}
      {sweepPath && (
        <motion.path
          d={sweepPath}
          fill="none"
          stroke="url(#arcGrad)"
          strokeWidth="12"
          strokeLinecap="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      )}

      {/* needle dot */}
      {needle && (
        <motion.circle
          cx={needle.x} cy={needle.y} r="7"
          fill={category?.color || "#164e63"}
          stroke="#fff"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 300 }}
          filter="url(#glow)"
        />
      )}

      {/* centre label */}
      <text x={ARC_CX} y={ARC_CY - 6} textAnchor="middle" fontSize="11" fill="#94a3b8" fontFamily="inherit">BMI</text>
      <text x={ARC_CX} y={ARC_CY + 18} textAnchor="middle" fontSize="30" fill="#0f172a" fontWeight="700" fontFamily="inherit">
        {bmi !== null ? bmi : "—"}
      </text>

      {/* range labels */}
      {[{v:10,l:"10"},{v:18.5,l:"18.5"},{v:25,l:"25"},{v:30,l:"30"},{v:40,l:"40"}].map(({v,l}) => {
        const p = arcPoint(bmiToDeg(v));
        return <text key={v} x={p.x} y={p.y} textAnchor="middle" fontSize="7.5" fill="#cbd5e1" fontFamily="inherit">{l}</text>;
      })}
    </svg>
  );
}

function WhoTable({ bmi }) {
  return (
    <div className="bmi-table-wrap">
      {WHO_RANGES.map(r => {
        const active = bmi !== null && (bmi < r.max && (WHO_RANGES.indexOf(r) === 0 || bmi >= (WHO_RANGES[WHO_RANGES.indexOf(r)-1]?.max ?? 0)));
        return (
          <div key={r.label} className={`bmi-table-row ${active ? "bmi-table-row--active" : ""}`} style={active ? { background: r.bg, borderColor: r.color } : {}}>
            <span className="bmi-table-dot" style={{ background: r.color }} />
            <span className="bmi-table-name">{r.label}</span>
            <span className="bmi-table-range" style={{ color: active ? r.color : undefined }}>
              {active ? "← You" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function BMICalculatorPage() {
  const { user } = useAuth?.() || {};
const router = useRouter();
  const [weight, setWeight]     = useState("");
  const [height, setHeight]     = useState("");
  const [bmi, setBmi]           = useState(null);
  const [category, setCategory] = useState(null);
  const [error, setError]       = useState("");
  const [gender, setGender]     = useState(null);
  const [username, setUsername] = useState(null);
  const [copyStatus, setCopyStatus] = useState("");

  // first-time vs edit mode
  const [hasSaved, setHasSaved]         = useState(false); // has stored measurements
  const [editingWeight, setEditingWeight] = useState(false);
  const [editingHeight, setEditingHeight] = useState(false);

  // load persisted measurements on mount
  useEffect(() => {
    const saved = loadMeasurements();
    if (saved) {
      setWeight(saved.weight);
      setHeight(saved.height);
      setHasSaved(true);
    }
  }, []);

  // auto-calculate when both values present
  useEffect(() => {
    if (weight && height) handleCalculate(weight, height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load profile
  useEffect(() => {
    let mounted = true;
    async function loadProfile() {
      if (!user?.uid) return;
      const possibleGender = user?.gender || user?.profile?.gender || null;
      const possibleName   = user?.displayName || user?.username || user?.name || null;
      if (possibleGender && mounted) setGender(String(possibleGender).toLowerCase());
      if (possibleName && mounted)   setUsername(String(possibleName));
      try {
        const ref  = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (d?.gender && mounted)   setGender(String(d.gender).toLowerCase());
          if (d?.username && mounted) setUsername(String(d.username));
          else if (d?.name && mounted) setUsername(String(d.name));
        }
      } catch {}
    }
    loadProfile();
    return () => { mounted = false; };
  }, [user]);

  function handleCalculate(w = weight, h = height) {
    const wf = parseFloat(w), hf = parseFloat(h);
    if (!w || !h)            { setError("Enter both weight and height."); setBmi(null); setCategory(null); return; }
    if (isNaN(wf) || isNaN(hf)) { setError("Enter valid numbers."); return; }
    if (wf <= 0 || hf <= 0)  { setError("Values must be positive."); return; }
    setError("");
    const hm  = hf / 100;
    const val = Math.round((wf / (hm * hm)) * 100) / 100;
    setBmi(val);
    setCategory(getCategoryInfo(val));
    saveMeasurements(w, h);
    setHasSaved(true);
    setEditingWeight(false);
    setEditingHeight(false);
  }

  function handleReset() {
    setWeight(""); setHeight(""); setBmi(null); setCategory(null);
    setError(""); setHasSaved(false); setEditingWeight(false); setEditingHeight(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }

  async function handleCopy() {
    if (!bmi) return;
    try {
      await navigator.clipboard.writeText(`My BMI is ${bmi} – ${category?.label}`);
      setCopyStatus("Copied ✓");
    } catch { setCopyStatus("Failed"); }
    setTimeout(() => setCopyStatus(""), 2000);
  }

  const ideal = height ? getIdealRange(parseFloat(height)) : null;
  const bmiDiff = bmi && ideal ? (bmi - 24.9).toFixed(1) : null;

  const genderTip = () => {
    if (!gender) return "Maintain a balanced diet and regular physical activity for optimal health.";
    if (gender.startsWith("f")) return "Focus on strength training, calcium intake, and balanced protein for hormonal health.";
    if (gender.startsWith("m")) return "Combine resistance training with cardio and prioritise lean protein recovery.";
    return "Balanced nutrition and consistent movement are the cornerstone of long-term health.";
  };

  const isFirstTime = !hasSaved || (editingWeight || editingHeight);
  const showBothInputs = !hasSaved;

  return (
    <>
      {/* ── global styles injected inline ────────────────────────────────── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* original palette: cyan-900 = #164e63, blue-900 = #1e3a8a, white bg, black text */
        :root {
          --cyan9: #164e63;
          --blue9: #1e3a8a;
          --accent: #164e63;
          --text: #0f172a;
          --text-muted: #475569;
          --text-faint: #94a3b8;
          --bg: #ffffff;
          --bg-page: #f8fafc;
          --border: #e2e8f0;
          --border-mid: #cbd5e1;
          --white: #ffffff;
        }

        .bmi-root {
          min-height: 100svh;
          background: var(--bg-page);
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 0;
          overflow-x: hidden;
          position: relative;
        }

        /* subtle top stripe */
        .bmi-root::before {
          content: '';
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--cyan9), var(--blue9));
          z-index: 10;
        }

        .bmi-content { position: relative; z-index: 1; max-width: 960px; margin: 0 auto; padding: 24px 20px 60px; }

        /* ── header ── */
        .bmi-header { text-align: center; padding: 36px 0 28px; }
        .bmi-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--cyan9); margin-bottom: 12px; }
        .bmi-title { font-size: clamp(1.8rem, 5vw, 3rem); color: var(--text); line-height: 1.15; font-weight: 800; }
        .bmi-title em { font-style: normal; color: var(--cyan9); }
        .bmi-subtitle { margin-top: 10px; font-size: 14px; color: var(--blue9); font-weight: 400; opacity: 0.75; }
        .bmi-user-badge {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 16px; padding: 5px 16px; border-radius: 99px;
          background: var(--white); border: 1px solid var(--border-mid);
          font-size: 12px; color: var(--text-muted);
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .bmi-user-badge span { color: var(--blue9); font-weight: 600; }

        /* ── divider ── */
        .bmi-divider { height: 1px; background: var(--border); margin: 4px 0 28px; }

        /* ── first-time entry card ── */
        .bmi-entry-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px 24px 24px;
          max-width: 520px;
          margin: 0 auto 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .bmi-entry-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .bmi-entry-title::before { content: ''; width: 3px; height: 16px; background: var(--cyan9); border-radius: 2px; flex-shrink: 0; }
        .bmi-entry-row { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
        .bmi-input-wrap { flex: 1; min-width: 140px; }
        .bmi-input-label { display: block; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px; }
        .bmi-input-inner { position: relative; }
        .bmi-input {
          width: 100%; padding: 11px 44px 11px 14px;
          background: #f8fafc; border: 1px solid var(--border-mid);
          border-radius: 10px; font-size: 15px; font-family: inherit; color: var(--text);
          outline: none; transition: border-color 0.2s, box-shadow 0.2s;
          -moz-appearance: textfield;
        }
        .bmi-input::-webkit-outer-spin-button,
        .bmi-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .bmi-input:focus { border-color: var(--cyan9); box-shadow: 0 0 0 3px rgba(22,78,99,0.1); background: #fff; }
        .bmi-input-unit { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--text-faint); font-weight: 500; pointer-events: none; }
        .bmi-entry-btn-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .bmi-btn {
          flex: 1; min-width: 100px; padding: 11px 18px; border-radius: 10px;
          font-size: 14px; font-weight: 600; font-family: inherit;
          cursor: pointer; border: none; transition: all 0.18s;
        }
        .bmi-btn--primary { background: var(--blue9); color: #fff; }
        .bmi-btn--primary:hover { background: #1e40af; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(30,58,138,0.3); }
        .bmi-btn--ghost { background: #fff; color: var(--text-muted); border: 1px solid var(--border-mid); }
        .bmi-btn--ghost:hover { background: #f1f5f9; border-color: var(--blue9); color: var(--blue9); }
        .bmi-btn--copy { background: #eff6ff; color: var(--blue9); border: 1px solid #bfdbfe; font-size: 13px; }
        .bmi-btn--copy:hover { background: #dbeafe; }

        /* ── saved pills row ── */
        .bmi-pills-row { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
        .bmi-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px; border-radius: 99px;
          background: var(--white); border: 1px solid var(--border-mid);
          font-size: 13px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .bmi-pill-label { color: var(--text-muted); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
        .bmi-pill-value { color: var(--text); font-weight: 700; font-size: 15px; }
        .bmi-pill-unit { font-size: 11px; font-weight: 400; color: var(--text-faint); margin-left: 2px; }
        .bmi-pill-edit {
          display: flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 50%;
          background: #f1f5f9; border: none; cursor: pointer;
          color: var(--text-muted); transition: all 0.15s;
        }
        .bmi-pill-edit:hover { background: #e0f2fe; color: var(--cyan9); }

        /* inline edit */
        .bmi-inline-edit { display: flex; align-items: center; gap: 8px; padding: 4px 10px; background: #fff; border: 1px solid var(--cyan9); border-radius: 99px; box-shadow: 0 0 0 3px rgba(22,78,99,0.08); }
        .bmi-inline-input {
          width: 72px; background: transparent; border: none; outline: none;
          font-family: inherit; font-size: 15px; font-weight: 700; color: var(--text);
          -moz-appearance: textfield;
        }
        .bmi-inline-input::-webkit-outer-spin-button, .bmi-inline-input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .bmi-inline-unit { font-size: 11px; color: var(--text-faint); }
        .bmi-inline-save {
          padding: 3px 10px; border-radius: 99px; border: none; background: var(--cyan9);
          color: #fff; font-size: 11px; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: background 0.15s;
        }
        .bmi-inline-save:hover { background: #0e7490; }

        /* ── main grid ── */
        .bmi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 640px) { .bmi-grid { grid-template-columns: 1fr; } }

        .bmi-card {
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.05);
        }
        .bmi-card--full { grid-column: 1 / -1; }
        .bmi-card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-faint); margin-bottom: 14px; }

        /* gauge card */
        .bmi-gauge-svg { width: 100%; max-width: 240px; display: block; margin: 0 auto; }
        .bmi-category-badge {
          display: flex; align-items: center; gap: 6px; justify-content: center;
          padding: 5px 14px; border-radius: 99px; font-size: 13px; font-weight: 600;
          margin: 12px auto 0;
        }
        .bmi-category-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

        /* stats card */
        .bmi-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .bmi-stat-box {
          padding: 14px; border-radius: 12px;
          background: #f8fafc; border: 1px solid var(--border);
          text-align: center;
        }
        .bmi-stat-val { font-size: 22px; font-weight: 700; color: var(--text); }
        .bmi-stat-lbl { font-size: 10px; color: var(--text-faint); margin-top: 4px; letter-spacing: 0.06em; text-transform: uppercase; }

        /* table card */
        .bmi-table-wrap { display: flex; flex-direction: column; gap: 6px; }
        .bmi-table-row {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 12px; border-radius: 8px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .bmi-table-row--active { font-weight: 600; }
        .bmi-table-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .bmi-table-name { font-size: 12px; flex: 1; color: var(--text-muted); }
        .bmi-table-row--active .bmi-table-name { color: var(--text); }
        .bmi-table-range { font-size: 11px; font-weight: 700; }

        /* tip card */
        .bmi-tip-icon { font-size: 28px; margin-bottom: 10px; }
        .bmi-tip-text { font-size: 13px; color: var(--text-muted); line-height: 1.7; }

        /* ideal weight card */
        .bmi-ideal-bar-wrap { margin-top: 12px; }
        .bmi-ideal-track { width: 100%; height: 6px; background: #e2e8f0; border-radius: 99px; position: relative; overflow: visible; margin-bottom: 6px; }
        .bmi-ideal-fill { height: 100%; background: linear-gradient(90deg, var(--cyan9), var(--blue9)); border-radius: 99px; transition: width 0.8s ease; }
        .bmi-ideal-marker { position: absolute; top: 50%; transform: translate(-50%,-50%); width: 12px; height: 12px; border-radius: 50%; background: #f59e0b; border: 2px solid #fff; box-shadow: 0 0 0 1px #f59e0b; }
        .bmi-ideal-labels { display: flex; justify-content: space-between; font-size: 10px; color: var(--text-faint); }

        /* error */
        .bmi-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #dc2626; margin-bottom: 16px; }

        /* footer */
        .bmi-footer { text-align: center; margin-top: 40px; font-size: 11px; color: var(--text-faint); }

        /* empty state */
        .bmi-empty { text-align: center; padding: 40px 0; color: var(--text-faint); font-size: 13px; }
        .bmi-empty-icon { font-size: 36px; margin-bottom: 10px; }
      `}</style>

      <main className="bmi-root">
        <TopMenuButton />
        <div className="bmi-content">

          {/* ── header ── */}
          <header className="bmi-header">
            <h1 className="bmi-title">Know Your <em>Body</em><br/>Mass Index</h1>
            <p className="bmi-subtitle">Visual, intelligent &amp; personalized - powered by WHO guidelines</p>
            {username && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div className="bmi-user-badge">👤 <span>{username}</span></div>
              </div>
            )}
          </header>

          <div className="bmi-divider" />

          {/* ── INPUT SECTION ── */}
          <AnimatePresence mode="wait">
            {showBothInputs ? (
              /* First-time full entry card */
              <motion.div key="entry" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3 }}>
                <div className="bmi-entry-card">
                  <div className="bmi-entry-title">Enter your measurements</div>
                  {error && <div className="bmi-error">{error}</div>}
                  <div className="bmi-entry-row">
                    <InputField label="Weight" value={weight} onChange={setWeight} placeholder="e.g. 65" unit="kg" autoFocus />
                    <InputField label="Height" value={height} onChange={setHeight} placeholder="e.g. 170" unit="cm" />
                  </div>
                  <div className="bmi-entry-btn-row">
                    <button className="bmi-btn bmi-btn--primary" onClick={() => handleCalculate()}>Calculate BMI →</button>
                    <button className="bmi-btn bmi-btn--ghost" onClick={handleReset}>Reset</button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Saved pills with inline edit */
              <motion.div key="pills" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                {error && <div className="bmi-error" style={{ maxWidth: 520, margin: "0 auto 14px" }}>{error}</div>}
                <div className="bmi-pills-row">
                  {/* weight pill / inline edit */}
                  {editingWeight ? (
                    <div className="bmi-inline-edit">
                      <span className="bmi-pill-label" style={{ fontSize: 11, color: "rgba(232,237,245,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Weight</span>
                      <input
                        autoFocus type="number" inputMode="decimal"
                        className="bmi-inline-input" value={weight}
                        onChange={e => setWeight(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCalculate()}
                      />
                      <span className="bmi-inline-unit">kg</span>
                      <button className="bmi-inline-save" onClick={() => handleCalculate()}>Save</button>
                    </div>
                  ) : (
                    <MeasurementPill label="Weight" value={weight} unit="kg" onEdit={() => setEditingWeight(true)} />
                  )}

                  {/* height pill / inline edit */}
                  {editingHeight ? (
                    <div className="bmi-inline-edit">
                      <span className="bmi-pill-label" style={{ fontSize: 11, color: "rgba(232,237,245,0.45)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Height</span>
                      <input
                        autoFocus type="number" inputMode="decimal"
                        className="bmi-inline-input" value={height}
                        onChange={e => setHeight(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCalculate()}
                      />
                      <span className="bmi-inline-unit">cm</span>
                      <button className="bmi-inline-save" onClick={() => handleCalculate()}>Save</button>
                    </div>
                  ) : (
                    <MeasurementPill label="Height" value={height} unit="cm" onEdit={() => setEditingHeight(true)} />
                  )}

                  {/* action buttons */}
                  <button className="bmi-btn bmi-btn--primary" style={{ borderRadius: 99, padding: "8px 20px", fontSize: 13, flex: "none" }} onClick={() => handleCalculate()}>
                    Recalculate
                  </button>
                  <button className="bmi-btn bmi-btn--ghost" style={{ borderRadius: 99, padding: "8px 16px", fontSize: 13, flex: "none" }} onClick={handleReset}>
                    Reset
                  </button>
                  {bmi && (
                    <button className="bmi-btn bmi-btn--copy" style={{ borderRadius: 99, padding: "8px 16px", fontSize: 13, flex: "none" }} onClick={handleCopy}>
                      {copyStatus || "📋 Copy"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RESULTS GRID ── */}
          <AnimatePresence>
            {bmi !== null && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <div className="bmi-grid">

                  {/* ── Gauge card ── */}
                  <div className="bmi-card" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div className="bmi-card-label">BMI Gauge</div>
                    <RadialGauge bmi={bmi} category={category} />
                    {category && (
                      <div className="bmi-category-badge" style={{ background: category.bg, border: `1px solid ${category.color}` }}>
                        <span className="bmi-category-dot" style={{ background: category.color }} />
                        <span style={{ color: category.color }}>{category.label}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Stats card ── */}
                  <div className="bmi-card">
                    <div className="bmi-card-label">Your Stats</div>
                    <div className="bmi-stats-grid">
                      <div className="bmi-stat-box">
                        <div className="bmi-stat-val" style={{ color: category?.color }}>{bmi}</div>
                        <div className="bmi-stat-lbl">Your BMI</div>
                      </div>
                      <div className="bmi-stat-box">
                        <div className="bmi-stat-val">{weight} kg</div>
                        <div className="bmi-stat-lbl">Weight</div>
                      </div>
                      <div className="bmi-stat-box">
                        <div className="bmi-stat-val">{height} cm</div>
                        <div className="bmi-stat-lbl">Height</div>
                      </div>
                      <div className="bmi-stat-box">
                        {ideal && (
                          <>
                            <div className="bmi-stat-val" style={{ fontSize: 15 }}>{ideal.min}–{ideal.max}</div>
                            <div className="bmi-stat-lbl">Ideal Weight (kg)</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ideal weight bar */}
                    {ideal && (
                      <div className="bmi-ideal-bar-wrap">
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span className="bmi-card-label" style={{ margin: 0 }}>Where you sit</span>
                          <span style={{ fontSize: 11, color: bmiDiff > 0 ? "#ea580c" : "#164e63" }}>
                            {bmiDiff > 0 ? `+${bmiDiff} above normal` : `${Math.abs(bmiDiff)} below normal`}
                          </span>
                        </div>
                        <div className="bmi-ideal-track">
                          <div className="bmi-ideal-fill" style={{ width: `${Math.min(100, Math.max(0, ((bmi - 10) / 30) * 100))}%` }} />
                          <div className="bmi-ideal-marker" style={{ left: `${Math.min(100, Math.max(0, ((24.9 - 10) / 30) * 100))}%` }} />
                        </div>
                        <div className="bmi-ideal-labels"><span>10</span><span>Normal ↑</span><span>40</span></div>
                      </div>
                    )}
                  </div>

                  {/* ── WHO Table ── */}
                  <div className="bmi-card">
                    <div className="bmi-card-label">WHO Classification</div>
                    <WhoTable bmi={bmi} />
                  </div>

                  {/* ── Tip card ── */}
                  <div className="bmi-card">
                    <div className="bmi-card-label">Personalized Tip</div>
                    <div className="bmi-tip-icon">
                      {category?.label?.includes("Normal") ? "🎯" :
                       category?.label?.includes("Under")  ? "🥗" : "🏃"}
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <span style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>
                        {category?.label === "Normal"
                          ? "You're in the healthy range!"
                          : category?.label?.includes("Under")
                            ? "You may benefit from more calories"
                            : "Consider lifestyle adjustments"}
                      </span>
                    </div>
                    <p className="bmi-tip-text">{genderTip()}</p>
                    {ideal && (
                      <div style={{ marginTop: 14, padding: "10px 12px", background: "#eff6ff", borderRadius: 10, border: "1px solid #bfdbfe" }}>
                        <span style={{ fontSize: 12, color: "#1e3a8a" }}>
                          💡 Ideal weight for your height: <strong>{ideal.min} – {ideal.max} kg</strong>
                        </span>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

            {bmi === null && hasSaved && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="bmi-empty">
                  <div className="bmi-empty-icon">⚖️</div>
                  <div>Hit <strong>Recalculate</strong> to see your results</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
<button onClick={() => router.push("/dashboard")}
              className="text-sm hover:text-slate-400 text-blue-600 transition flex items-center gap-1.5 mx-auto py-6 self-start mt-1">
              ← Back to Dashboard
            </button>
          <div className="bmi-footer">
            BMI categories follow WHO standards · Gender used only for wellness tips, not thresholds · Values saved locally on your device
          </div>
          
        </div>
      </main>
    </>
  );
}