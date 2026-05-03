"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "../../components/TopMenuButton";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

// 🔹 helper: local date key "YYYY-MM-DD"
function getLocalDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function KnowYourFoodComparison() {
  const [food1, setFood1] = useState("");
  const [food2, setFood2] = useState("");
  const [result1, setResult1] = useState(null);
  const [result2, setResult2] = useState(null);
  const [error1, setError1] = useState("");
  const [error2, setError2] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [showCompareOption, setShowCompareOption] = useState(false);
  const [showFood2Input, setShowFood2Input] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const PIE_COLORS = ["#2563eb", "#1e3a8a", "#60a5fa", "#93c5fd"];
  const BAR_COLORS = ["#2563eb", "#1e3a8a"];

  const fetchNutrition = async (
    food,
    setResult,
    setError,
    setLoading,
    isFood1 = true
  ) => {
    if (!food) return;
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(
        `https://api.calorieninjas.com/v1/nutrition?query=${food}`,
        {
          headers: { "X-Api-Key": process.env.NEXT_PUBLIC_CALORIE_API_KEY },
        }
      );

      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();

      if (data.items && data.items.length > 0) {
        const formatted = { ...data.items[0] };

        ["calories", "protein_g", "carbohydrates_total_g", "fat_total_g"].forEach(
          (key) => {
            formatted[key] = formatted[key]
              ? Number(formatted[key].toFixed(2))
              : 0;
          }
        );

        setResult(formatted);

        if (isFood1) setShowCompareOption(true);
      } else {
        setError("Food not found.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const logToCalendar = async (result) => {
  if (!user || !result) {
    alert("⚠️ Please log in to save items.");
    return;
  }

  try {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayKey = `${y}-${m}-${d}`; // same as calendar/API

    // ✅ nutritionLogs/{uid}/{todayKey}/{autoId}
    const userDocRef = doc(db, "nutritionLogs", user.uid);
    const dayCollection = collection(userDocRef, todayKey);

    await addDoc(dayCollection, {
      ...result,
      loggedAt: new Date().toISOString(),
    });

    alert(`✅ ${result.name} logged to today's consumption!`);
  } catch (err) {
    console.error("Failed to log item:", err);
    alert("❌ Failed to log item. Try again.");
  }
};


  const getPieData = (r) => {
    if (!r) return [];
    const totalCals = r.calories || 1;
    return [
      {
        name: "Protein",
        value: r.protein_g * 4,
        percentage: (((r.protein_g * 4) / totalCals) * 100).toFixed(1),
      },
      {
        name: "Carbs",
        value: r.carbohydrates_total_g * 4,
        percentage: (((r.carbohydrates_total_g * 4) / totalCals) * 100).toFixed(1),
      },
      {
        name: "Fat",
        value: r.fat_total_g * 9,
        percentage: (((r.fat_total_g * 9) / totalCals) * 100).toFixed(1),
      },
      {
        name: "Other",
        value: Math.max(
          r.calories -
            (r.protein_g * 4 +
              r.carbohydrates_total_g * 4 +
              r.fat_total_g * 9),
          0
        ),
        percentage: "",
      },
    ];
  };

  const getComparisonData = () => {
    if (!result1 || !result2) return [];
    return [
      { nutrient: "Protein", Food1: result1.protein_g, Food2: result2.protein_g },
      {
        nutrient: "Carbs",
        Food1: result1.carbohydrates_total_g,
        Food2: result2.carbohydrates_total_g,
      },
      { nutrient: "Fat", Food1: result1.fat_total_g, Food2: result2.fat_total_g },
      { nutrient: "Calories", Food1: result1.calories, Food2: result2.calories },
    ];
  };

  const FoodCard = ({ result, logAction }) => (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-md p-6 transition hover:shadow-lg">
      <h3 className="text-2xl font-bold capitalize text-blue-700">
        {result.name}
      </h3>

      <div className="grid grid-cols-2 gap-3 mt-4 text-sm text-slate-700">
        <p>🔥 Calories: {result.calories}</p>
        <p>🥩 Protein: {result.protein_g} g</p>
        <p>🍞 Carbs: {result.carbohydrates_total_g} g</p>
        <p>🥑 Fat: {result.fat_total_g} g</p>
      </div>

      <button
        onClick={logAction}
        className="mt-4 w-full rounded-lg bg-blue-600 text-white py-2 font-semibold hover:bg-blue-700 transition"
      >
        Log this item
      </button>

      <div className="mt-6 w-full h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={getPieData(result)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {getPieData(result).map((entry, index) => (
                <Cell
                  key={index}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip />

            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800 relative overflow-hidden">

  {/* 🔵 BACKGROUND GLOW */}
  <div className="absolute w-[400px] h-[400px] bg-blue-200/40 blur-3xl rounded-full top-[-100px] left-[-100px]" />
  <div className="absolute w-[300px] h-[300px] bg-blue-300/30 blur-3xl rounded-full bottom-[-80px] right-[-80px]" />

  <TopMenuButton />

  <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">

    {/* 🏷️ HEADER */}
    <header className="text-center mb-14">
      <h1 className="text-5xl font-extrabold text-blue-700 tracking-tight">
        Know Your Food
      </h1>
      <p className="text-gray-600 mt-3 text-lg">
        Instantly analyze nutrition & compare foods side by side
      </p>
    </header>

    {/* 🔷 MAIN CARD */}
    <section className="bg-white/70 backdrop-blur-xl border border-blue-100 rounded-3xl p-10 shadow-xl">

      <div className="grid md:grid-cols-2 gap-12">

        {/* 🍽 FOOD 1 */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-blue-700">
            First food
          </h2>

          <input
            type="text"
            value={food1}
            onChange={(e) => setFood1(e.target.value)}
            placeholder="e.g., 2 eggs, 1 cup dal"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
          />

          <button
            onClick={() =>
              fetchNutrition(food1, setResult1, setError1, setLoading1, true)
            }
            disabled={loading1}
            className="bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition"
          >
            {loading1 ? "Checking..." : "Analyze Food"}
          </button>

          {error1 && <p className="text-red-500 text-sm">{error1}</p>}

          {result1 && (
            <div className="mt-4">
              <FoodCard
                result={result1}
                logAction={() => logToCalendar(result1)}
              />
            </div>
          )}

          {showCompareOption && !showFood2Input && (
            <button
              onClick={() => setShowFood2Input(true)}
              className="mt-4 text-blue-700 border border-blue-500 px-4 py-2 rounded-full hover:bg-blue-50 transition font-medium"
            >
              + Compare another food
            </button>
          )}
        </div>

        {/* 🍽 FOOD 2 */}
        {showFood2Input && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-blue-700">
              Second food
            </h2>

            <input
              type="text"
              value={food2}
              onChange={(e) => setFood2(e.target.value)}
              placeholder="e.g., 1 cup rice"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
            />

            <button
              onClick={() =>
                fetchNutrition(
                  food2,
                  setResult2,
                  setError2,
                  setLoading2,
                  false
                )
              }
              disabled={loading2}
              className="bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition"
            >
              {loading2 ? "Checking..." : "Analyze Food"}
            </button>

            {error2 && <p className="text-red-500 text-sm">{error2}</p>}

            {result2 && (
              <div className="mt-4">
                <FoodCard
                  result={result2}
                  logAction={() => logToCalendar(result2)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 📊 COMPARISON */}
      {result1 && result2 && (
        <div className="mt-16">
          <h3 className="text-3xl font-bold text-blue-700 text-center mb-6">
            Nutrition Comparison
          </h3>

          <div className="w-full h-80 bg-white rounded-2xl border border-blue-100 shadow-md p-6">
            <ResponsiveContainer>
              <BarChart data={getComparisonData()}>
                <XAxis dataKey="nutrient" stroke="#1e3a8a" />
                <YAxis stroke="#1e3a8a" />
                <Tooltip />
                <Legend />
                <Bar dataKey="Food1" fill="#2563eb" barSize={35} />
                <Bar dataKey="Food2" fill="#1e3a8a" barSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </section>

    {/* 🔙 BACK */}
    <div className="flex justify-center mt-12">
      <button
        onClick={() => router.back()}
        className="px-6 py-2 rounded-full border border-blue-600 text-blue-700 font-semibold hover:bg-blue-50 transition"
      >
        ⬅ Back
      </button>
    </div>

  </div>
</main>
  );
}
