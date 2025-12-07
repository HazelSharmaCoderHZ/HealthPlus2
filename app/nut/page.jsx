"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNutrition } from "context/NutritionContext";
import TopMenuButton from "../../components/TopMenuButton";

export default function NutritionCalendar() {
  const [date, setDate] = useState(new Date());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const { refreshFlag } = useNutrition();

  const handleDateChange = (selectedDate) => {
    const dateObj = Array.isArray(selectedDate) ? selectedDate[0] : selectedDate;
    setDate(dateObj);
  };

  const fetchSummary = async (dateObj) => {
    if (!user) return;
    setLoading(true);
    try {
      const formattedDate = dateObj.toISOString().split("T")[0];
      const res = await fetch(`/api/nut?uid=${user.uid}&date=${formattedDate}`);
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Failed to fetch summary:", err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchSummary(date);
  }, [date, user, refreshFlag]);

  return (
    <main className="min-h-screen w-full  text-slate-900 flex flex-col items-center relative overflow-hidden">
      

      <div className="z-10 w-full max-w-5xl px-4 py-6 md:py-10">
        

        {/* Header */}
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-900">
            Nutrition Calendar
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-900 max-w-xl">
            Pick a date to view your logged nutrition summary. Use this to spot
            patterns and keep your goals on track.
          </p>
        </header>

        {/* Main content: calendar + summary */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)] items-center ">
          {/* Calendar card */}
          <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-xl border border-blue-500/40 p-4 md:p-5">
            <div className="flex items-center  ">
              <h2 className="text-lg font-semibold justify-between text-blue-700 mr-2">
                Select a Day: 
              </h2>
              
            </div>
            <p className="text-xs px-2 py-1 text-slate-700 mb-2">
                {date.toDateString()}
              </p>
            <div className="rounded-xl overflow-hidden">
              
              <Calendar
                onChange={handleDateChange}
                value={date}
                selectRange={false}
                className="react-calendar-custom p-2 text-black"
              />
            </div>
            <p className="mt-3 text-xs text-slate-800">
              Tip: Log items from the{" "}
              <span className="font-semibold text-slate-800">
                Know Your Food
              </span>{" "}
              section to see them appear here.
            </p>
          </div>

          {/* Summary card */}
          <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-xl border border-blue-500/40 p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-blue-600">
                  Daily Nutrition Summary
                </h2>
                <p className="text-xs text-slate-600">
                  {date.toDateString()}
                </p>
              </div>
              <div className="text-right text-xs text-slate-700">
                {loading ? (
                  <span className="inline-flex items-center gap-1 animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-blue-400" />
                    Fetching…
                  </span>
                ) : summary ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    ● Logged
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-900">
                    ● No entries
                  </span>
                )}
              </div>
            </div>

            {loading && (
              <div className="space-y-3 mt-2">
                <div className="h-3 rounded-full bg-slate-700/70 animate-pulse" />
                <div className="h-3 rounded-full bg-slate-700/60 animate-pulse" />
                <div className="h-3 rounded-full bg-slate-700/50 animate-pulse" />
              </div>
            )}

            {!loading && summary && (
              <div className="space-y-4">
                {/* Highlight card for calories */}
                <div className="rounded-xl border border-amber-800/50 bg-gradient-to-r from-amber-600/20 via-amber-400/20 to-transparent px-4 py-3 text-slate-900 flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Total Calories
                    </span>
                    <span className="text-2xl font-extrabold text-slate-600">
                      {summary.calories || 0}{" "}
                      <span className="text-sm font-semibold text-slate-600">
                        kcal
                      </span>
                    </span>
                  </div>
                  <span className="text-3xl">🔥</span>
                </div>
                <p className="text-lg">Additional Details:</p>

                {/* Grid of macro + micro stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-cyan-200/20 border border-slate-600 px-3 py-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      🍗 <span>Protein</span>
                    </span>
                    <span className="font-semibold text-slate-500">
                      {summary.protein_g || 0} g
                    </span>
                  </div>
                  <div className="rounded-lg bg-cyan-200/20 border border-slate-600 px-3 py-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      🍞 <span>Carbs</span>
                    </span>
                    <span className="font-semibold text-slate-500">
                      {summary.carbohydrates_total_g || 0} g
                    </span>
                  </div>
                  <div className="rounded-lg bg-cyan-200/20 border border-slate-600 px-3 py-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      🥑 <span>Fat</span>
                    </span>
                    <span className="font-semibold text-slate-500">
                      {summary.fat_total_g || 0} g
                    </span>
                  </div>
                  <div className="rounded-lg bg-cyan-200/20 border border-slate-600 px-3 py-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      🍬 <span>Sugar</span>
                    </span>
                    <span className="font-semibold text-slate-500">
                      {summary.sugar_g || 0} g
                    </span>
                  </div>
                  <div className="rounded-lg bg-cyan-200/20 border border-slate-600 px-3 py-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      🧂 <span>Cholesterol</span>
                    </span>
                    <span className="font-semibold text-slate-500">
                      {summary.cholesterol_mg || 0} mg
                    </span>
                  </div>
                  <div className="rounded-lg bg-cyan-200/20 border border-slate-600 px-3 py-2 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-600">
                      🧂 <span>Sodium</span>
                    </span>
                    <span className="font-semibold text-slate-500">
                      {summary.sodium_mg || 0} mg
                    </span>
                  </div>
                  <div className="rounded-lg bg-cyan-200/20 border border-slate-600 px-3 py-2 flex items-center justify-between sm:col-span-2">
                    <span className="flex items-center gap-2 text-slate-600">
                      🥔 <span>Potassium</span>
                    </span>
                    <span className="font-semibold text-slate-500">
                      {summary.potassium_mg || 0} mg
                    </span>
                  </div>
                </div>
              </div>
            )}

            {!loading && !summary && (
              <div className="mt-4 flex flex-col items-center justify-center text-center text-sm text-slate-800">
                <div className="text-3xl mb-2">📭</div>
                <p className="font-medium">No data for this day yet.</p>
                <p className="mt-1 text-xs text-slate-700">
                  Log a food item using <span className="font-semibold">Know Your Food</span> and
                  it will automatically appear in your calendar summary.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Extra bottom spacing for mobile */}
        <div className="h-6" />
      </div>

      <div className="flex items-center justify-between mb-6">
          <TopMenuButton />
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-600 hover:bg-blue-500/90 text-sm text-white font-semibold shadow-md transition"
          >
            ← Back to Dashboard
          </button>
        </div>
    </main>
  );
}
