"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import TopMenuButton from "components/TopMenuButton";

export default function TeamStatsPage() {
  const { teamID } = useParams();
  const [nutritionRows, setNutritionRows] = useState([]);
  const [sleepRows, setSleepRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamID) return;
    fetchStats();
  }, [teamID]);

  async function fetchStats() {
    setLoading(true);

    try {
      // 1️⃣ Get team members
      const membersSnap = await getDocs(
        collection(db, "teams", teamID, "members")
      );

      const members = membersSnap.docs.map(d => d.id);

      const nutritionResult = [];
      const sleepResult = [];

      // =========================
      // 🍽 NUTRITION (AVG CAL)
      // =========================
      for (const uid of members) {
        let totalCalories = 0;
        let entryCount = 0;

        // same logic as nut/page.jsx
        const userNutritionDoc = doc(db, "nutritionLogs", uid);
        const dateCollections = await getDocs(
          collection(userNutritionDoc)
        );

        for (const dateDoc of dateCollections.docs) {
          const dayLogs = await getDocs(
            collection(userNutritionDoc, dateDoc.id)
          );

          dayLogs.forEach(log => {
            const calories = Number(log.data()?.calories || 0);
            totalCalories += calories;
            entryCount++;
          });
        }

        if (entryCount > 0) {
          nutritionResult.push({
            user: uid.slice(0, 6),
            avgCalories: Math.round(totalCalories / entryCount),
          });
        }
      }

      // =========================
      // 😴 SLEEP (AVG HOURS)
      // =========================
      for (const uid of members) {
        let totalSleep = 0;
        let entryCount = 0;

        // same logic as sleepcal/page.jsx
        const sleepSnap = await getDocs(
          collection(db, "users", uid, "sleepLogs")
        );

        sleepSnap.forEach(docSnap => {
          const duration = Number(docSnap.data()?.duration || 0);
          totalSleep += duration;
          entryCount++;
        });

        if (entryCount > 0) {
          sleepResult.push({
            user: uid.slice(0, 6),
            avgSleep: Number((totalSleep / entryCount).toFixed(1)),
          });
        }
      }

      setNutritionRows(nutritionResult);
      setSleepRows(sleepResult);
    } catch (err) {
      console.error("Failed to load team stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-slate-600">
        Loading team stats…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">
      <TopMenuButton />

      <h1 className="text-3xl font-bold text-slate-900">
        Team Health Overview
      </h1>

      {/* ================= NUTRITION TABLE ================= */}
      <div className="bg-white rounded-xl shadow border">
        <h2 className="text-xl font-semibold px-6 pt-5 pb-3 text-blue-700">
          🍽 Nutrition — Average Calories
        </h2>

        <table className="w-full text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left">Member</th>
              <th className="px-6 py-3 text-right">Avg Calories</th>
            </tr>
          </thead>
          <tbody>
            {nutritionRows.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-slate-500">
                  No nutrition data yet
                </td>
              </tr>
            ) : (
              nutritionRows.map(row => (
                <tr key={row.user} className="border-t">
                  <td className="px-6 py-3 font-medium">{row.user}</td>
                  <td className="px-6 py-3 text-right">{row.avgCalories} kcal</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= SLEEP TABLE ================= */}
      <div className="bg-white rounded-xl shadow border">
        <h2 className="text-xl font-semibold px-6 pt-5 pb-3 text-green-700">
          😴 Sleep — Average Hours
        </h2>

        <table className="w-full text-sm">
          <thead className="bg-green-50">
            <tr>
              <th className="px-6 py-3 text-left">Member</th>
              <th className="px-6 py-3 text-right">Avg Sleep (hrs)</th>
            </tr>
          </thead>
          <tbody>
            {sleepRows.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-slate-500">
                  No sleep data yet
                </td>
              </tr>
            ) : (
              sleepRows.map(row => (
                <tr key={row.user} className="border-t">
                  <td className="px-6 py-3 font-medium">{row.user}</td>
                  <td className="px-6 py-3 text-right">{row.avgSleep} h</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
