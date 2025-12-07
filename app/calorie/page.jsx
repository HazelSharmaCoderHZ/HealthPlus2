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

  // Solid pastel palette
  const PASTEL_COLORS = ["#383d60ff", "#1a1d47ff", "#0b2bc8ff", "#a5b2ffff"];
  const BAR_COLORS = ["#364ff0ff", "#2f2576ff"]; // Food1 mint, Food2 coral

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
        setError("Food not found ");
      }
    } catch (err) {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const logToCalendar = async (result) => {
    if (!user || !result) return alert("⚠️ Please log in to save items.");

    try {
      const today = new Date().toISOString().split("T")[0];
      const userDoc = doc(db, "nutritionLogs", user.uid);
      const dayCollection = collection(userDoc, today);

      await addDoc(dayCollection, {
        ...result,
        loggedAt: new Date(),
      });

      alert(`✅ ${result.name} logged to today's consumption!`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to log item. Try again.");
    }
  };

  const getPieData = (result) => {
    if (!result) return [];
    const totalCals = result.calories || 1;
    return [
      {
        name: "Protein",
        value: result.protein_g * 4,
        percentage: ((result.protein_g * 4) / totalCals * 100).toFixed(1),
      },
      {
        name: "Carbs",
        value: result.carbohydrates_total_g * 4,
        percentage: ((result.carbohydrates_total_g * 4) / totalCals * 100).toFixed(
          1
        ),
      },
      {
        name: "Fat",
        value: result.fat_total_g * 9,
        percentage: ((result.fat_total_g * 9) / totalCals * 100).toFixed(1),
      },
      {
        name: "Other",
        value: Math.max(
          result.calories -
            (result.protein_g * 4 +
              result.carbohydrates_total_g * 4 +
              result.fat_total_g * 9),
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
    <div className=" border-blue-700 shadow-md bg-white/50 p-6 rounded-2xl text-left w-[500px] text-slate-800 border-xl transition-transform hover:scale-105">
      <h3 className="text-2xl  capitalize mb-2 text-blue-800">
        {result.name}
      </h3>
      <p>🔥 Calories: {result.calories}</p>
      <p>🥩 Protein: {result.protein_g} g</p>
      <p>🍞 Carbs: {result.carbohydrates_total_g} g</p>
      <p>🥑 Fat: {result.fat_total_g} g</p>
      <button
        onClick={logAction}
        className="mt-3 px-4 py-2 text-black font-bold rounded-lg hover:opacity-90 w-full"
        style={{ backgroundColor: "#9d95f9ff" }}
      >
        ✅ Log this item
      </button>

      {/* Pie chart */}
      <div className="mt-6 w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={getPieData(result)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              labelLine={false} // no slice labels
            >
              {getPieData(result).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PASTEL_COLORS[index % PASTEL_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${value} cal (${props.payload.percentage}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: "#f9fafb", // light background
                border: "1px solid #CDB4DB",
                borderRadius: "8px",
                color: "#f8f5f5ff",
              }}
            />
            <Legend wrapperStyle={{ color: "white" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col items-center p-6 ">
      <TopMenuButton />

      {/* Top section with two choices */}
      <div className="flex flex-col md:flex-row items-start justify-center w-full gap-12 relative">
        {/* First Choice */}
        <div className="flex flex-col items-center">
          <h2 className="text-4xl font-bold text-blue-800 mb-4">
             Food Choice
          </h2>
          <input
            type="text"
            value={food1}
            onChange={(e) => setFood1(e.target.value)}
            placeholder="Enter food item"
            className="mb-2 w-72 p-2 rounded-md bg-white/50 text-slate-800 border border-purple-300"
          />
          <button
            onClick={() =>
              fetchNutrition(food1, setResult1, setError1, setLoading1, true)
            }
            className="px-6 py-2 rounded-lg font-semibold mb-4"
            style={{ backgroundColor: "#4134fdff", color: "#ffffffff" }}
          >
            {loading1 ? "⏳ Checking..." : "Check Nutrition"}
          </button>
          {result1 && (
            <FoodCard
              result={result1}
              logAction={() => logToCalendar(result1)}
            />
          )}
          {showCompareOption && !showFood2Input && (
            <button
              onClick={() => setShowFood2Input(true)}
              className="mt-6 px-4 py-2 rounded-lg font-bold"
              style={{ backgroundColor: "#e2e4f8ff", color: "#051efdff" }}
            >
              ➕ Compare with another food
            </button>
          )}
          {error1 && <p className="text-red-400 mt-2">{error1}</p>}
        </div>

        {/* Second Choice */}
        {showFood2Input && (
          <div className="flex flex-col items-center">
            <h2 className="text-4xl font-bold text-blue-800 mb-4">
              Second Choice
            </h2>
            <input
              type="text"
              value={food2}
              onChange={(e) => setFood2(e.target.value)}
              placeholder="Enter food item"
              className="mb-2 w-72 p-2 rounded-md bg-white/50 text-slate-800 border border-purple-300"
            />
            <button
              onClick={() =>
                fetchNutrition(food2, setResult2, setError2, setLoading2, false)
              }
              className="px-6 py-2 rounded-lg font-semibold mb-4"
              style={{ backgroundColor: "#3941dfff", color: "#fffbfbff" }}
            >
              {loading2 ? "⏳ Checking..." : "Check Nutrition"}
            </button>
            {result2 && (
              <FoodCard
                result={result2}
                logAction={() => logToCalendar(result2)}
              />
            )}
            {error2 && <p className="text-red-400 mt-2">{error2}</p>}
          </div>
        )}
      </div>

      {/* Bar chart below both cards */}
      {result1 && result2 && (
        <div className="w-full max-w-2xl h-96 flex flex-col items-center justify-center mt-12">
          <h3 className="text-3xl font-bold text-blue-800 mb-6">
            📊 Comparison
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getComparisonData()}>
              <XAxis dataKey="nutrient" stroke="#0b0b0bff" />
              <YAxis stroke="#0c0c0cff" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#f9fafb", // lighter background
                  border: "1px solid #CDB4DB",
                  borderRadius: "8px",
                  color: "#f9f7f7ff",
                }}
              />
              <Legend wrapperStyle={{ color: "white" }} />
              <Bar dataKey="Food1" fill={BAR_COLORS[0]} barSize={40} />
              <Bar dataKey="Food2" fill={BAR_COLORS[1]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Go Back Button */}
        <button
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 rounded-lg font-bold"
          style={{ backgroundColor: "#0637e8ff", color: "#fcf7f7ff" }}
        >
           Go Back
        </button>
      </main>
  );
}
