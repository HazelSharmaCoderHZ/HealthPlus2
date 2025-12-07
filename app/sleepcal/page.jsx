"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import TopMenuButton from "../../components/TopMenuButton"; 
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function SleepCalendarPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const RECOMMENDED = 8; // recommended hours per day

  useEffect(() => {
    if (user) fetchSleepLogs();
  }, [user]);

  const fetchSleepLogs = async () => {
    try {
      setLoading(true);
      const userDoc = doc(db, "sleepLogs", user.uid);
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      let logsMap = {};

      for (let d = 1; d <= 31; d++) {
        const dateObj = new Date(currentYear, currentMonth, d);
        if (dateObj.getMonth() !== currentMonth) break;

        const dateKey = dateObj.toISOString().split("T")[0];
        const dayCollection = collection(userDoc, dateKey);
        const snap = await getDocs(dayCollection);

        if (!snap.empty) {
          let totalDuration = 0;
          snap.forEach((doc) => {
            totalDuration += doc.data().duration || 0;
          });
          logsMap[dateKey] = totalDuration;
        } else {
          logsMap[dateKey] = null;
        }
      }

      setLogs(logsMap);
    } catch (err) {
      console.error("Error fetching sleep logs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sleep cell coloring (blue themed)
  const getColor = (hours) => {
    if (hours === null) return "bg-gray-200 border border-blue-800/20";
    if (hours < 6) return "bg-red-400/70 border border-blue-800/20";
    if (hours <= 8) return "bg-yellow-300/70 border border-blue-800/20";
    return "bg-green-400/70 border border-blue-800/20";
  };

  // Chart colors (lighter blue + dark gray)
  const COLORS = ["#0600b8ff", "#1F2937"];

  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "long" });
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Chart data
  const chartData = Object.keys(logs).map((date) => ({
    date: date.split("-")[2], // day of month
    hours: logs[date] ?? 0,
  }));

  // Corrected average sleep
  const totalSleep = Object.values(logs).reduce((sum, val) => sum + (val ?? 0), 0);
  const loggedDays = Object.values(logs).filter((v) => v !== null).length;
  const avgSleep = loggedDays > 0 ? totalSleep / loggedDays : 0;

  const pieData = [
    { name: "Sleep Achieved", value: avgSleep },
    { name: "Remaining", value: avgSleep < RECOMMENDED ? RECOMMENDED - avgSleep : 0 },
  ];

  return (
    <main className="min-h-screen  flex flex-col items-center justify-start p-4 sm:p-6 text-slate-800">
      <TopMenuButton />

      <h1 className="text-4xl mb-5 text-center">
        Your <span className="text-blue-800">Sleep Insights</span> This Month
        <span className="text-blue-800 font-extrabold">.</span>
      </h1>
      <h2 className="text-lg sm:text-xl mb-4 text-center text-gray-700">
        {currentMonth} {currentYear}
      </h2>

      {/* Calendar */}
      {loading ? (
        <p className="mt-6">⏳ Loading...</p>
      ) : (
        <div className="backdrop-blur-lg bg-white/50 border border-blue-800 mt-7 mb-7 p-3 sm:p-5 rounded-2xl shadow-2xl w-full max-w-4xl">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-xs sm:text-sm">
            {weekdays.map((day) => (
              <div key={day} className="text-center font-semibold text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateKey = new Date(today.getFullYear(), today.getMonth(), day)
                .toISOString()
                .split("T")[0];
              const hours = logs[dateKey] ?? null;

              return (
                <div
                  key={day}
                  className={`flex flex-col justify-center items-center rounded-lg text-center text-xs sm:text-sm p-2 ${getColor(
                    hours
                  )}`}
                >
                  <span className="font-bold">{day}</span>
                  <span className="text-[10px] sm:text-xs">
                    {hours ? `${hours}h` : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Insights */}
      <h1 className="text-4xl mb-5 text-center">
        <span className="text-blue-800">Visual</span> Insights
        <span className="text-blue-800 font-extrabold">.</span>
      </h1>

      <div className="mt-6 flex flex-col sm:flex-row gap-6 w-full max-w-3xl">
        {/* Bar Chart */}
        <div className="bg-white/50 rounded-2xl border border-blue-800 p-4 flex-1 shadow-lg">
          <h3 className="text-gray-800 font-semibold mb-2 text-center">
            Daily Sleep Hours
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="#0508d1ff" />
              <YAxis stroke="#041fccff" />
              <Tooltip
                contentStyle={{ backgroundColor: "#78a6e7ff", borderRadius: "8px" }}
              />
              <Bar dataKey="hours" fill="#0518c4ff" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="items-center text-center font-bold text-gray-700">
            📅 Dates ➡️
          </p>
        </div>

        {/* Pie Chart */}
        <div className="bg-white/50 rounded-2xl border border-blue-800 p-4 flex-1 shadow-lg flex flex-col items-center justify-center">
          <h3 className="text-gray-800 font-semibold mb-2 text-center">
            Average Sleep
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <p className="mt-2 text-blue-800 font-bold text-lg">
            {avgSleep.toFixed(1)} h/day
          </p>
        </div>
      </div>

      {/* Go Back */}
      <button
        onClick={() => router.push("/dashboard")}
        className="mt-6 px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
      >
        ⬅ Go Back
      </button>
    </main>
  );
}
