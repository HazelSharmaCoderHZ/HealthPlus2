"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  ChevronLeft, Trophy, Moon, Utensils, TrendingUp, TrendingDown,
  Users, Activity, AlertTriangle, CheckCircle, Info, Zap,
  BarChart2, Droplets, Beef, Wheat, Flame, Star, Award
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell
} from "recharts";

/* ─────────────────────────────── helpers ─────────────────────────── */

const DAILY_GOALS = {
  calories: 2000,
  protein_g: 50,
  carbohydrates_total_g: 300,
  fat_total_g: 65,
  fiber_g: 25,
  sugar_g: 50,
  sleep: 8,
};

const BLUE = ["#1e40af", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];
const CHART_COLORS = ["#1d4ed8", "#0ea5e9", "#06b6d4", "#0891b2", "#0e7490", "#155e75"];

function healthScore(user) {
  let score = 0;
  const n = user.avgNutrition;
  // Calories: ideal 1800-2200
  const calRatio = n.calories / DAILY_GOALS.calories;
  score += calRatio >= 0.8 && calRatio <= 1.2 ? 20 : calRatio > 0 ? 10 : 0;
  // Protein
  score += (n.protein_g / DAILY_GOALS.protein_g) >= 0.8 ? 20 : 10;
  // Sugar: lower is better
  const sugarPct = n.calories > 0 ? (n.sugar_g * 4) / n.calories : 0;
  score += sugarPct <= 0.1 ? 20 : sugarPct <= 0.2 ? 15 : sugarPct <= 0.3 ? 8 : 2;
  // Sleep
  const sleepRatio = user.avgSleep / DAILY_GOALS.sleep;
  score += sleepRatio >= 0.9 && sleepRatio <= 1.1 ? 25 : sleepRatio >= 0.75 ? 15 : 5;
  // Fiber
  score += (n.fiber_g / DAILY_GOALS.fiber_g) >= 0.8 ? 15 : 7;
  return Math.round(score);
}

function badge(score) {
  if (score >= 85) return { label: "Elite", color: "text-yellow-600 bg-yellow-50 border-yellow-200" };
  if (score >= 70) return { label: "Healthy", color: "text-green-700 bg-green-50 border-green-200" };
  if (score >= 50) return { label: "Fair", color: "text-blue-700 bg-blue-50 border-blue-200" };
  return { label: "Needs Work", color: "text-red-600 bg-red-50 border-red-200" };
}

function smartInsights(users) {
  if (!users.length) return [];
  const insights = [];

  // Sugar insight
  const highSugar = users.filter(u => {
    const pct = u.avgNutrition.calories > 0
      ? (u.avgNutrition.sugar_g * 4) / u.avgNutrition.calories
      : 0;
    return pct > 0.25;
  });
  if (highSugar.length) {
    insights.push({
      type: "warning",
      icon: <AlertTriangle className="w-4 h-4" />,
      text: `${highSugar.map(u => u.name).join(", ")} get >25% calories from sugar- despite adequate calorie intake, this raises metabolic risk.`,
    });
  }

  // Low protein
  const lowProtein = users.filter(u => u.avgNutrition.protein_g < DAILY_GOALS.protein_g * 0.7);
  if (lowProtein.length) {
    insights.push({
      type: "info",
      icon: <Info className="w-4 h-4" />,
      text: `${lowProtein.map(u => u.name).join(", ")} are under 70% of daily protein goals- muscle recovery may be impacted.`,
    });
  }

  // Best sleep
  const bestSleeper = [...users].sort((a, b) => b.avgSleep - a.avgSleep)[0];
  if (bestSleeper?.avgSleep >= 7) {
    insights.push({
      type: "success",
      icon: <CheckCircle className="w-4 h-4" />,
      text: `${bestSleeper.name} leads in sleep quality (${bestSleeper.avgSleep.toFixed(1)} hrs avg)- consistent rest correlates with better performance.`,
    });
  }

  // Calorie efficiency: high calories but poor nutrient balance
  users.forEach(u => {
    const cal = u.avgNutrition.calories;
    const fiber = u.avgNutrition.fiber_g;
    if (cal > 1800 && fiber < 10) {
      insights.push({
        type: "warning",
        icon: <Zap className="w-4 h-4" />,
        text: `${u.name} consumes ${Math.round(cal)} kcal/day but only ${fiber.toFixed(1)}g fiber- calorie-dense but nutrient-poor diet pattern.`,
      });
    }
  });

  return insights.slice(0, 5);
}

function radarData(user) {
  return [
    { metric: "Calories", value: Math.min(100, Math.round((user.avgNutrition.calories / DAILY_GOALS.calories) * 100)) },
    { metric: "Protein", value: Math.min(100, Math.round((user.avgNutrition.protein_g / DAILY_GOALS.protein_g) * 100)) },
    { metric: "Fiber", value: Math.min(100, Math.round((user.avgNutrition.fiber_g / DAILY_GOALS.fiber_g) * 100)) },
    { metric: "Sleep", value: Math.min(100, Math.round((user.avgSleep / DAILY_GOALS.sleep) * 100)) },
    { metric: "Low Sugar", value: Math.min(100, Math.round(Math.max(0, 100 - ((user.avgNutrition.sugar_g * 4) / (user.avgNutrition.calories || 1)) * 200))) },
    { metric: "Fat Balance", value: Math.min(100, Math.round((1 - Math.abs((user.avgNutrition.fat_total_g / DAILY_GOALS.fat_total_g) - 1)) * 100)) },
  ];
}

/* ─────────────────────────────── sub components ─────────────────── */

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center h-60 gap-4">
      <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      <p className="text-blue-400 text-sm font-medium tracking-wide">Analysing team health data…</p>
    </div>
  );
}

function ScoreRing({ score, size = 72 }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 85 ? "#ca8a04" : score >= 70 ? "#16a34a" : score >= 50 ? "#2563eb" : "#dc2626";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#dbeafe" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size / 4.5} fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: `${size / 2}px ${size / 2}px` }}>
        {score}
      </text>
    </svg>
  );
}

function MacroPieChart({ user }) {
  const cal = user.avgNutrition.calories || 1;
  const data = [
    { name: "Protein", value: Math.round((user.avgNutrition.protein_g * 4 / cal) * 100) },
    { name: "Carbs", value: Math.round((user.avgNutrition.carbohydrates_total_g * 4 / cal) * 100) },
    { name: "Fat", value: Math.round((user.avgNutrition.fat_total_g * 9 / cal) * 100) },
    { name: "Sugar", value: Math.round((user.avgNutrition.sugar_g * 4 / cal) * 100) },
  ].filter(d => d.value > 0);

  const colors = ["#1d4ed8", "#0ea5e9", "#f59e0b", "#ef4444"];

  return (
    <ResponsiveContainer width="100%" height={120}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={50}
          paddingAngle={2} dataKey="value">
          {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
        </Pie>
        <Tooltip formatter={(v) => `${v}%`} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function UserCard({ user, rank, isSelected, onClick }) {
  const b = badge(user.score);
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 ${
        isSelected
          ? "border-blue-600 bg-blue-50 shadow-lg shadow-blue-100"
          : "border-blue-100 bg-white hover:border-blue-300 hover:shadow-md"
      }`}
    >
      {rank <= 3 && (
        <div className="absolute -top-3 -right-2">
          {rank === 1 && <span className="text-xl">🥇</span>}
          {rank === 2 && <span className="text-xl">🥈</span>}
          {rank === 3 && <span className="text-xl">🥉</span>}
        </div>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm
          bg-gradient-to-br from-blue-500 to-blue-700`}>
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-blue-900 text-sm">{user.name}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${b.color}`}>{b.label}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <ScoreRing score={user.score} size={60} />
        <div className="text-right">
          <p className="text-xs text-gray-400">Calories</p>
          <p className="font-bold text-blue-800 text-sm">{Math.round(user.avgNutrition.calories)} kcal</p>
          <p className="text-xs text-gray-400 mt-1">Sleep</p>
          <p className="font-bold text-blue-800 text-sm">{user.avgSleep.toFixed(1)} hrs</p>
        </div>
      </div>
    </div>
  );
}

function InsightChip({ insight }) {
  const styles = {
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border text-xs leading-relaxed ${styles[insight.type]}`}>
      <span className="mt-0.5 shrink-0">{insight.icon}</span>
      <span>{insight.text}</span>
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
        active ? "bg-blue-600 text-white shadow" : "text-blue-600 hover:bg-blue-50"
      }`}
    >
      {label}
    </button>
  );
}

/* ─────────────────────────────── main page ─────────────────────────── */

export default function TeamStatsDashboard() {
  const { teamID } = useParams();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tab, setTab] = useState("overview");
  const [sortBy, setSortBy] = useState("score");

  useEffect(() => { if (teamID) loadStats(); }, [teamID]);

  async function loadStats() {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teams", teamID, "members"));
      const memberDocs = snap.docs.filter(d => d.data().status === "approved");

      const dates = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split("T")[0];
      });

      const result = [];

      for (const memberDoc of memberDocs) {
        const uid = memberDoc.id;
        // Try to get display name
        let name = uid.slice(0, 8);
        try {
          const userSnap = await getDoc(doc(db, "users", uid));
          if (userSnap.exists()) {
            const ud = userSnap.data();
            name = ud.displayName || ud.name || ud.username || ud.email?.split("@")[0] || name;
          }
        } catch (_) {}

        const nutritionFields = {
          calories: 0, protein_g: 0, carbohydrates_total_g: 0,
          fat_total_g: 0, fat_saturated_g: 0, fiber_g: 0,
          sugar_g: 0, sodium_mg: 0, cholesterol_mg: 0,
        };
        let calDays = 0, sleepTotal = 0, sleepDays = 0;
        const weeklyCalories = [];

        for (const date of dates) {
          const foodSnap = await getDocs(collection(db, "nutritionLogs", uid, date));
          let dayCal = 0;
          foodSnap.forEach(d => {
            const fd = d.data();
            Object.keys(nutritionFields).forEach(k => {
              nutritionFields[k] += Number(fd[k] || 0);
            });
            dayCal += Number(fd.calories || 0);
          });
          if (foodSnap.size > 0) { calDays++; weeklyCalories.push({ date, cal: Math.round(dayCal) }); }

          const sleepSnap = await getDocs(collection(db, "sleepLogs", uid, date));
          sleepSnap.forEach(d => { sleepTotal += Number(d.data()?.duration || 0); sleepDays++; });
        }

        if (calDays === 0 && sleepDays === 0) continue;

        const avgNutrition = Object.fromEntries(
          Object.entries(nutritionFields).map(([k, v]) => [k, calDays > 0 ? v / calDays : 0])
        );
        const avgSleep = sleepDays > 0 ? sleepTotal / sleepDays : 0;
        const userData = { uid, name, avgNutrition, avgSleep, weeklyCalories };
        userData.score = healthScore(userData);
        result.push(userData);
      }

      result.sort((a, b) => b.score - a.score);
      setUsers(result);
      if (result.length) setSelectedUser(result[0]);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const sorted = useMemo(() => {
    const copy = [...users];
    if (sortBy === "score") copy.sort((a, b) => b.score - a.score);
    else if (sortBy === "calories") copy.sort((a, b) => b.avgNutrition.calories - a.avgNutrition.calories);
    else if (sortBy === "sleep") copy.sort((a, b) => b.avgSleep - a.avgSleep);
    else if (sortBy === "protein") copy.sort((a, b) => b.avgNutrition.protein_g - a.avgNutrition.protein_g);
    return copy;
  }, [users, sortBy]);

  const insights = useMemo(() => smartInsights(users), [users]);

  const comparisonBarData = useMemo(() => users.map(u => ({
    name: u.name.split(" ")[0],
    Calories: Math.round(u.avgNutrition.calories),
    Protein: Math.round(u.avgNutrition.protein_g * 10),
    Sugar: Math.round(u.avgNutrition.sugar_g * 10),
    Sleep: Math.round(u.avgSleep * 100),
    Score: u.score,
  })), [users]);

  const radarCompare = useMemo(() => {
    if (!users.length) return [];
    const metrics = ["Calories", "Protein", "Fiber", "Sleep", "Low Sugar", "Fat Balance"];
    return metrics.map(metric => {
      const obj = { metric };
      users.forEach(u => { obj[u.name.split(" ")[0]] = radarData(u).find(r => r.metric === metric)?.value || 0; });
      return obj;
    });
  }, [users]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white font-sans">

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-blue-100 px-5 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-blue-50 transition-colors text-blue-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-blue-900 leading-tight">Team Health Dashboard</h1>
            <p className="text-xs text-blue-400">{users.length} members · Last 7 days</p>
          </div>
          <div className="flex items-center gap-1 bg-blue-50 rounded-xl px-3 py-1.5">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-700">{users.length}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {loading ? <Loader /> : (
          <>
            {/* ── Tab Nav ── */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: "overview", label: "Overview" },
                { id: "nutrition", label: "Nutrition" },
                { id: "sleep", label: "Sleep" },
                { id: "compare", label: "Compare" },
              ].map(t => <Tab key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />)}
            </div>

            {/* ── Smart Insights Banner ── */}
            {insights.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Smart Insights</h2>
                <div className="grid gap-2">
                  {insights.map((ins, i) => <InsightChip key={i} insight={ins} />)}
                </div>
              </section>
            )}

            {/* ══ OVERVIEW TAB ══ */}
            {tab === "overview" && (
              <div className="space-y-6">
                {/* Sort */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs text-gray-400 shrink-0">Sort by:</span>
                  {["score", "calories", "sleep", "protein"].map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all ${
                        sortBy === s ? "bg-blue-600 text-white border-blue-600" : "border-blue-200 text-blue-600"
                      }`}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>

                {/* User Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sorted.map((u, i) => (
                    <UserCard key={u.uid} user={u} rank={i + 1}
                      isSelected={selectedUser?.uid === u.uid}
                      onClick={() => setSelectedUser(u)} />
                  ))}
                </div>

                {/* Selected User Detail */}
                {selectedUser && (
                  <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                          {selectedUser.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-blue-900">{selectedUser.name}</h3>
                          <p className="text-xs text-gray-400">Health Score: {selectedUser.score}/100</p>
                        </div>
                      </div>
                      <ScoreRing score={selectedUser.score} size={64} />
                    </div>

                    {/* Macro breakdown */}
                    <div>
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Macro Breakdown</h4>
                      <div className="flex items-center gap-4">
                        <MacroPieChart user={selectedUser} />
                        <div className="flex-1 space-y-2">
                          {[
                            { label: "Protein", val: selectedUser.avgNutrition.protein_g.toFixed(1), unit: "g", goal: DAILY_GOALS.protein_g, color: "bg-blue-600" },
                            { label: "Carbs", val: selectedUser.avgNutrition.carbohydrates_total_g.toFixed(1), unit: "g", goal: DAILY_GOALS.carbohydrates_total_g, color: "bg-sky-500" },
                            { label: "Fat", val: selectedUser.avgNutrition.fat_total_g.toFixed(1), unit: "g", goal: DAILY_GOALS.fat_total_g, color: "bg-amber-500" },
                            { label: "Sugar", val: selectedUser.avgNutrition.sugar_g.toFixed(1), unit: "g", goal: DAILY_GOALS.sugar_g, color: "bg-red-400" },
                            { label: "Fiber", val: selectedUser.avgNutrition.fiber_g.toFixed(1), unit: "g", goal: DAILY_GOALS.fiber_g, color: "bg-green-500" },
                          ].map(m => (
                            <div key={m.label} className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 w-12 shrink-0">{m.label}</span>
                              <div className="flex-1 bg-blue-50 rounded-full h-2 overflow-hidden">
                                <div className={`h-2 rounded-full ${m.color} transition-all duration-700`}
                                  style={{ width: `${Math.min(100, (parseFloat(m.val) / m.goal) * 100)}%` }} />
                              </div>
                              <span className="text-xs font-semibold text-blue-800 w-16 text-right">
                                {m.val}{m.unit} / {m.goal}{m.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Sugar calorie % warning */}
                    {selectedUser.avgNutrition.calories > 0 && (() => {
                      const sugarPct = ((selectedUser.avgNutrition.sugar_g * 4) / selectedUser.avgNutrition.calories * 100).toFixed(1);
                      return (
                        <div className={`rounded-xl p-3 text-xs border ${parseFloat(sugarPct) > 25 ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"}`}>
                          <strong>{sugarPct}%</strong> of daily calories come from sugar
                          {parseFloat(sugarPct) > 25
                            ? "- this is high. WHO recommends keeping free sugars below 10%."
                            : "- within healthy range. ✓"}
                        </div>
                      );
                    })()}

                    {/* Sleep */}
                    <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Avg Sleep</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-blue-700">{selectedUser.avgSleep.toFixed(1)}</span>
                        <span className="text-xs text-blue-400 ml-1">hrs/night</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ══ NUTRITION TAB ══ */}
            {tab === "nutrition" && (
              <div className="space-y-6">
                {/* Calorie bar chart */}
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" /> Avg Daily Calories vs Goal
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">Goal: {DAILY_GOALS.calories} kcal/day</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={users.map(u => ({
                      name: u.name.split(" ")[0],
                      Calories: Math.round(u.avgNutrition.calories),
                      Goal: DAILY_GOALS.calories,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
                      <Tooltip />
                      <Bar dataKey="Calories" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Goal" fill="#bfdbfe" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Macro comparison */}
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                    <Beef className="w-4 h-4 text-blue-600" /> Protein vs Sugar Balance
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">High protein + low sugar = better body composition</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={users.map(u => ({
                      name: u.name.split(" ")[0],
                      "Protein (g)": Math.round(u.avgNutrition.protein_g),
                      "Sugar (g)": Math.round(u.avgNutrition.sugar_g),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Protein (g)" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Sugar (g)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Sugar % of calories- the smart metric */}
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Sugar % of Calories (Smart Metric)
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Raw calorie counts don't tell the full story- this shows diet quality. WHO recommends &lt;10%.
                  </p>
                  <div className="space-y-3">
                    {[...users].sort((a, b) => {
                      const pA = a.avgNutrition.calories > 0 ? (a.avgNutrition.sugar_g * 4) / a.avgNutrition.calories : 0;
                      const pB = b.avgNutrition.calories > 0 ? (b.avgNutrition.sugar_g * 4) / b.avgNutrition.calories : 0;
                      return pA - pB;
                    }).map(u => {
                      const pct = u.avgNutrition.calories > 0
                        ? ((u.avgNutrition.sugar_g * 4) / u.avgNutrition.calories) * 100 : 0;
                      const color = pct <= 10 ? "bg-green-500" : pct <= 20 ? "bg-amber-400" : "bg-red-500";
                      return (
                        <div key={u.uid} className="flex items-center gap-3">
                          <span className="text-sm font-medium text-blue-800 w-24 shrink-0 truncate">{u.name.split(" ")[0]}</span>
                          <div className="flex-1 bg-blue-50 rounded-full h-3 overflow-hidden">
                            <div className={`h-3 rounded-full ${color} transition-all duration-700`}
                              style={{ width: `${Math.min(100, pct * 3)}%` }} />
                          </div>
                          <span className={`text-xs font-bold w-12 text-right ${pct > 20 ? "text-red-600" : pct > 10 ? "text-amber-600" : "text-green-600"}`}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> &lt;10% Good</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 10–20% Moderate</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &gt;20% High</span>
                  </div>
                </div>

                {/* Fiber */}
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-green-500" /> Fiber Intake vs Goal
                  </h3>
                  <div className="space-y-3">
                    {[...users].sort((a, b) => b.avgNutrition.fiber_g - a.avgNutrition.fiber_g).map(u => (
                      <div key={u.uid} className="flex items-center gap-3">
                        <span className="text-sm text-blue-800 w-24 shrink-0 truncate">{u.name.split(" ")[0]}</span>
                        <div className="flex-1 bg-blue-50 rounded-full h-3 overflow-hidden">
                          <div className="h-3 rounded-full bg-green-500 transition-all duration-700"
                            style={{ width: `${Math.min(100, (u.avgNutrition.fiber_g / DAILY_GOALS.fiber_g) * 100)}%` }} />
                        </div>
                        <span className="text-xs font-bold text-blue-800 w-20 text-right">
                          {u.avgNutrition.fiber_g.toFixed(1)}g / {DAILY_GOALS.fiber_g}g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ══ SLEEP TAB ══ */}
            {tab === "sleep" && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-blue-600" /> Average Sleep Duration
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">Goal: {DAILY_GOALS.sleep} hrs/night. 7–9 hrs is optimal for adults.</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={users.map(u => ({
                      name: u.name.split(" ")[0],
                      Sleep: parseFloat(u.avgSleep.toFixed(1)),
                      Goal: DAILY_GOALS.sleep,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Sleep" fill="#2563eb" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Goal" fill="#bfdbfe" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Sleep quality ladder */}
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-4">Sleep Quality Ladder</h3>
                  <div className="space-y-3">
                    {[...users].sort((a, b) => b.avgSleep - a.avgSleep).map((u, i) => {
                      const hours = u.avgSleep;
                      const quality = hours >= 8 ? "Optimal" : hours >= 7 ? "Good" : hours >= 6 ? "Fair" : "Insufficient";
                      const qColor = hours >= 8 ? "text-green-600" : hours >= 7 ? "text-blue-600" : hours >= 6 ? "text-amber-600" : "text-red-600";
                      return (
                        <div key={u.uid} className="flex items-center gap-3 p-3 rounded-xl bg-blue-50">
                          <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                          <span className="flex-1 text-sm font-semibold text-blue-900">{u.name}</span>
                          <span className="text-sm font-bold text-blue-700">{hours.toFixed(1)} hrs</span>
                          <span className={`text-xs font-semibold ${qColor} bg-white px-2 py-0.5 rounded-full border`}>
                            {quality}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ══ COMPARE TAB ══ */}
            {tab === "compare" && (
              <div className="space-y-6">
                {/* Radar */}
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" /> Multi-Dimensional Health Comparison
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">% of daily goal achieved per metric. "Low Sugar" = lower sugar is better.</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarCompare}>
                      <PolarGrid stroke="#dbeafe" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                      {users.map((u, i) => (
                        <Radar key={u.uid} name={u.name.split(" ")[0]} dataKey={u.name.split(" ")[0]}
                          stroke={CHART_COLORS[i % CHART_COLORS.length]}
                          fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.15} />
                      ))}
                      <Legend />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Health score leaderboard */}
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-500" /> Overall Health Score Leaderboard
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Composite score weighing calorie balance, sugar quality, protein sufficiency, fiber, and sleep.
                  </p>
                  <div className="space-y-3">
                    {[...users].sort((a, b) => b.score - a.score).map((u, i) => {
                      const b = badge(u.score);
                      return (
                        <div key={u.uid} className={`flex items-center gap-3 p-3 rounded-xl border ${i === 0 ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-100"}`}>
                          <span className="text-lg w-8 shrink-0 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}</span>
                          <span className="flex-1 text-sm font-semibold text-blue-900">{u.name}</span>
                          <div className="w-28 bg-blue-100 rounded-full h-2 overflow-hidden">
                            <div className="h-2 rounded-full bg-blue-600 transition-all duration-700"
                              style={{ width: `${u.score}%` }} />
                          </div>
                          <span className="font-bold text-blue-700 w-8 text-right text-sm">{u.score}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ml-1 ${b.color}`}>{b.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calorie quality matrix */}
                <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-sm">
                  <h3 className="font-bold text-blue-900 mb-1 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" /> Calorie Quality Matrix
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    High calories alone isn't bad- what matters is the quality. High protein + low sugar = quality calories.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-blue-400 border-b border-blue-100">
                          <th className="text-left py-2 pr-3 font-semibold">Member</th>
                          <th className="text-right py-2 px-2 font-semibold">kcal</th>
                          <th className="text-right py-2 px-2 font-semibold">Protein%</th>
                          <th className="text-right py-2 px-2 font-semibold">Sugar%</th>
                          <th className="text-right py-2 px-2 font-semibold">Sleep</th>
                          <th className="text-right py-2 pl-2 font-semibold">Quality</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => {
                          const cal = u.avgNutrition.calories || 1;
                          const proteinPct = ((u.avgNutrition.protein_g * 4) / cal * 100).toFixed(0);
                          const sugarPct = ((u.avgNutrition.sugar_g * 4) / cal * 100).toFixed(0);
                          const qualityScore = (+proteinPct * 1.5) - (+sugarPct * 2) + (u.avgSleep >= 7 ? 10 : 0);
                          const qlabel = qualityScore > 30 ? "🟢 Great" : qualityScore > 10 ? "🟡 Moderate" : "🔴 Poor";
                          return (
                            <tr key={u.uid} className="border-b border-blue-50 hover:bg-blue-50 transition-colors">
                              <td className="py-2.5 pr-3 font-medium text-blue-900">{u.name}</td>
                              <td className="py-2.5 px-2 text-right text-gray-600">{Math.round(u.avgNutrition.calories)}</td>
                              <td className={`py-2.5 px-2 text-right font-semibold ${+proteinPct >= 20 ? "text-green-600" : "text-amber-600"}`}>{proteinPct}%</td>
                              <td className={`py-2.5 px-2 text-right font-semibold ${+sugarPct > 20 ? "text-red-600" : "text-green-600"}`}>{sugarPct}%</td>
                              <td className={`py-2.5 px-2 text-right ${u.avgSleep >= 7 ? "text-green-600" : "text-amber-600"} font-semibold`}>{u.avgSleep.toFixed(1)}h</td>
                              <td className="py-2.5 pl-2 text-right text-xs font-medium">{qlabel}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && users.length === 0 && (
              <div className="text-center py-20 text-gray-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-blue-200" />
                <p className="font-medium">No team data yet</p>
                <p className="text-sm">Health logs will appear here once members start tracking</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}