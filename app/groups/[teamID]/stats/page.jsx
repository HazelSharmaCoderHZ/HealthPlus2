"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TopMenuButton from "components/TopMenuButton";
import { Moon, Utensils, ChevronLeft, Users, TrendingUp, AlertCircle } from "lucide-react";

// ── Pulse loader ──────────────────────────────────────────
function PulseLoader({ label = "Loading stats…" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-slate-500 mt-2">{label}</p>
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────
function Bar({ value, max, color = "bg-blue-500" }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all duration-700`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────
function StatCard({ icon: Icon, iconClass, title, rows, unit, emptyMsg, color = "blue" }) {
  const headerColors = {
    blue:  "from-blue-600 to-blue-700",
    green: "from-emerald-500 to-emerald-600",
  };
  const maxVal = rows.length > 0 ? Math.max(...rows.map(r => r.value)) : 1;
  const barColor = color === "green" ? "bg-emerald-500" : "bg-blue-500";

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${headerColors[color]} px-6 py-4 flex items-center gap-3`}>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white">{title}</h2>
          <p className="text-xs text-white/70">{rows.length} member{rows.length !== 1 ? "s" : ""} tracked</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {rows.length === 0 ? (
          <div className="flex items-center gap-3 py-6 text-slate-400 text-sm px-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {emptyMsg}
          </div>
        ) : (
          <ul className="space-y-4">
            {rows.map((row, i) => (
              <li key={row.user}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white text-xs font-black">
                      {row.user[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{row.user}</span>
                    {i === 0 && <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-1.5 py-0.5 rounded-md">Top</span>}
                  </div>
                  <span className="text-sm font-bold text-slate-800">
                    {typeof row.value === "number" && row.value % 1 !== 0
                      ? row.value.toFixed(1)
                      : row.value.toLocaleString()} {unit}
                  </span>
                </div>
                <Bar value={row.value} max={maxVal} color={barColor} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Summary tile ──────────────────────────────────────────
function SummaryTile({ label, value, sub, icon: Icon, iconBg }) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function TeamStatsPage() {
  const { teamID } = useParams();
  const router = useRouter();
  const [nutritionRows, setNutritionRows] = useState([]);
  const [sleepRows, setSleepRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (!teamID) return;
    fetchStats();
  }, [teamID]);

  async function fetchStats() {
    setLoading(true);
    try {
      // 1. Get team members
      const membersSnap = await getDocs(collection(db, "teams", teamID, "members"));
      const members = membersSnap.docs
        .filter(d => d.data().status === "approved")
        .map(d => d.id);
      setMemberCount(members.length);

      const nutritionResult = [];
      const sleepResult     = [];

      // ── NUTRITION ──────────────────────────────────────
      for (const uid of members) {
        let totalCalories = 0;
        let entryCount = 0;

        // nutritionLogs/{uid}/{date}/{logId}
        const dateSnap = await getDocs(collection(db, "nutritionLogs", uid, "dates"));

        // Fallback: some apps store logs directly under nutritionLogs/{uid}
        // Try the nested structure first
        for (const dateDoc of dateSnap.docs) {
          const dayLogs = await getDocs(
            collection(db, "nutritionLogs", uid, "dates", dateDoc.id, "logs")
          );
          dayLogs.forEach(log => {
            const cal = Number(log.data()?.calories || log.data()?.kcal || 0);
            totalCalories += cal;
            entryCount++;
          });
        }

        // If nested returned nothing, try flat: nutritionLogs/{uid}/entries
        if (entryCount === 0) {
          const flatSnap = await getDocs(collection(db, "nutritionLogs", uid, "entries"));
          flatSnap.forEach(log => {
            const cal = Number(log.data()?.calories || log.data()?.kcal || 0);
            totalCalories += cal;
            entryCount++;
          });
        }

        if (entryCount > 0) {
          nutritionResult.push({
            user: uid.slice(0, 8),
            value: Math.round(totalCalories / entryCount),
          });
        }
      }

      // Sort descending
      nutritionResult.sort((a, b) => b.value - a.value);

      // ── SLEEP ──────────────────────────────────────────
      for (const uid of members) {
        let totalSleep = 0;
        let entryCount = 0;

        // Try users/{uid}/sleepLogs (as in original)
        const sleepSnap = await getDocs(collection(db, "users", uid, "sleepLogs"));
        sleepSnap.forEach(docSnap => {
          const dur = Number(docSnap.data()?.duration || docSnap.data()?.hours || 0);
          totalSleep += dur;
          entryCount++;
        });

        // Fallback: sleepLogs/{uid}/entries
        if (entryCount === 0) {
          const altSnap = await getDocs(collection(db, "sleepLogs", uid, "entries"));
          altSnap.forEach(docSnap => {
            const dur = Number(docSnap.data()?.duration || docSnap.data()?.hours || 0);
            totalSleep += dur;
            entryCount++;
          });
        }

        if (entryCount > 0) {
          sleepResult.push({
            user: uid.slice(0, 8),
            value: Number((totalSleep / entryCount).toFixed(1)),
          });
        }
      }

      sleepResult.sort((a, b) => b.value - a.value);

      setNutritionRows(nutritionResult);
      setSleepRows(sleepResult);
    } catch (err) {
      console.error("Failed to load team stats:", err);
    } finally {
      setLoading(false);
    }
  }

  const avgCalories = nutritionRows.length
    ? Math.round(nutritionRows.reduce((s, r) => s + r.value, 0) / nutritionRows.length)
    : null;

  const avgSleep = sleepRows.length
    ? (sleepRows.reduce((s, r) => s + r.value, 0) / sleepRows.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <TopMenuButton />

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-blue-100 text-slate-500 hover:text-blue-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-slate-900">Team Health Overview</h1>
            <p className="text-sm text-slate-500 mt-0.5">Shared wellness stats across all members</p>
          </div>
        </div>

        {loading ? (
          <PulseLoader />
        ) : (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <SummaryTile
                label="Team Members"
                value={memberCount}
                icon={Users}
                iconBg="bg-blue-100 text-blue-600"
              />
              {avgCalories !== null && (
                <SummaryTile
                  label="Avg Calories"
                  value={`${avgCalories.toLocaleString()} kcal`}
                  sub="team average"
                  icon={Utensils}
                  iconBg="bg-orange-100 text-orange-600"
                />
              )}
              {avgSleep !== null && (
                <SummaryTile
                  label="Avg Sleep"
                  value={`${avgSleep} h`}
                  sub="team average"
                  icon={Moon}
                  iconBg="bg-indigo-100 text-indigo-600"
                />
              )}
            </div>

            {/* Nutrition chart */}
            <StatCard
              icon={Utensils}
              title="Nutrition — Average Daily Calories"
              rows={nutritionRows}
              unit="kcal"
              emptyMsg="No nutrition data logged by team members yet."
              color="blue"
            />

            {/* Sleep chart */}
            <StatCard
              icon={Moon}
              title="Sleep — Average Hours per Night"
              rows={sleepRows}
              unit="h"
              emptyMsg="No sleep data logged by team members yet."
              color="green"
            />

            {/* Empty state */}
            {nutritionRows.length === 0 && sleepRows.length === 0 && (
              <div className="text-center py-12">
                <TrendingUp className="w-14 h-14 text-blue-200 mx-auto mb-4" />
                <p className="font-semibold text-slate-700">No data yet</p>
                <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                  Team members need to log their nutrition and sleep for stats to appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 