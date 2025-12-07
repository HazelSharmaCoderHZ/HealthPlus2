"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "../../components/TopMenuButton";
import ThemeToggle from "../../components/ThemeToggle";

// ---------- Helpers ----------

// Local date key like "2025-12-06" in local timezone (no UTC bug)
function toLocalDateKey(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Calculate duration in hours between bedtime and wakeup, allowing cross-midnight
function calculateDuration(bed, wake) {
  const [bh, bm] = bed.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);

  if (
    isNaN(bh) ||
    isNaN(bm) ||
    isNaN(wh) ||
    isNaN(wm)
  ) {
    return null;
  }

  const start = new Date();
  start.setHours(bh, bm, 0, 0);

  const end = new Date();
  end.setHours(wh, wm, 0, 0);

  // If wake-up is before or equal to bedtime, assume next day
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const diffHours = (end - start) / (1000 * 60 * 60);

  // Hard safety: duration must be > 0 and <= 24 hours
  if (diffHours <= 0 || diffHours > 24) {
    return null;
  }

  return Number(diffHours.toFixed(2));
}


// Clamp helper
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export default function SleepLogPage() {
  const router = useRouter();
  const { user } = useAuth();

  // ---- Form state ----
  const [dateKey, setDateKey] = useState(toLocalDateKey());
  const [bedtime, setBedtime] = useState("");
  const [wakeup, setWakeup] = useState("");
  const [quality, setQuality] = useState(7);
  const [isNap, setIsNap] = useState(false);

  // Editing
  const [editingEntry, setEditingEntry] = useState(null); // { id, dateKey }

  // ---- Settings (persisted) ----
  const [goal, setGoal] = useState(8); // hours per night
  const [reminderTime, setReminderTime] = useState("22:00"); // "HH:MM"
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // ---- Logs & stats ----
  const [entries, setEntries] = useState([]); // [{ id, dateKey, bedtime, wakeup, duration, quality, isNap, loggedAt }]
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Reminder banner
  const [showReminder, setShowReminder] = useState(false);
  const [reminderShownForDate, setReminderShownForDate] = useState(null);

  // Redirect if not logged in (optional, but nicer UX)
  useEffect(() => {
    if (user === null) {
      router.push("/");
    }
  }, [user, router]);

  // ---- Load settings (goal + reminderTime) ----
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;

      try {
        const settingsRef = doc(db, "sleepSettings", user.uid);
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.goal === "number") setGoal(data.goal);
          if (typeof data.reminderTime === "string") setReminderTime(data.reminderTime);
        }
      } catch (err) {
        console.error("Error loading sleep settings:", err);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    if (!user) return;
    setSettingsSaving(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const trimmedTime = reminderTime.trim();
      const [hStr, mStr] = trimmedTime.split(":");
      const h = Number(hStr);
      const m = Number(mStr);
      if (
        isNaN(h) ||
        isNaN(m) ||
        h < 0 ||
        h > 23 ||
        m < 0 ||
        m > 59
      ) {
        setErrorMessage("Please enter a valid reminder time (HH:MM).");
        setSettingsSaving(false);
        return;
      }

      const settingsRef = doc(db, "sleepSettings", user.uid);
      await setDoc(
        settingsRef,
        { goal: Number(goal) || 8, reminderTime: trimmedTime },
        { merge: true }
      );

      setInfoMessage("Settings saved ✅");
    } catch (err) {
      console.error("Error saving settings:", err);
      setErrorMessage("Failed to save settings. Please try again.");
    } finally {
      setSettingsSaving(false);
    }
  };

  // ---- Fetch last 7 days logs ----
  const fetchLogs = async () => {
    if (!user) return;
    setLoadingLogs(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const allEntries = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = toLocalDateKey(d);

        const dayCollection = collection(db, "sleepLogs", user.uid, key);
        const snap = await getDocs(dayCollection);

        snap.forEach((docSnap) => {
          const data = docSnap.data();
          allEntries.push({
            id: docSnap.id,
            dateKey: key,
            bedtime: data.bedtime,
            wakeup: data.wakeup,
            duration: data.duration,
            quality: data.quality,
            isNap: data.isNap || false,
            loggedAt: data.loggedAt || null,
          });
        });
      }

      // Sort by date desc, then by loggedAt desc (if present)
      allEntries.sort((a, b) => {
        if (a.dateKey < b.dateKey) return 1;
        if (a.dateKey > b.dateKey) return -1;
        // same date
        if (a.loggedAt && b.loggedAt) {
          return b.loggedAt.toMillis?.() - a.loggedAt.toMillis?.();
        }
        return 0;
      });

      setEntries(allEntries);
    } catch (err) {
      console.error("Error fetching sleep logs:", err);
      setErrorMessage("Failed to load sleep history.");
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  // ---- Derived stats from entries ----
  const {
    dailyStats,
    weeklyAvgNight,
    totalSleepDebt,
    streak,
    todayStats,
    weeklyProgress,
    badges,
    trendLabel,
    trendColorClass,
  } = useMemo(() => {
    if (!entries.length) {
      return {
        dailyStats: [],
        weeklyAvgNight: null,
        totalSleepDebt: null,
        streak: 0,
        todayStats: null,
        weeklyProgress: 0,
        badges: [],
        trendLabel: "Not enough data yet",
        trendColorClass: "text-slate-500",
      };
    }

    const goalHours = Number(goal) || 8;
    const todayKey = toLocalDateKey();

    // Group entries by date
    const groups = {};
    for (const e of entries) {
      if (!groups[e.dateKey]) {
        groups[e.dateKey] = [];
      }
      groups[e.dateKey].push(e);
    }

    const last7Keys = Object.keys(groups)
      .sort()
      .slice(-7); // ascending

    const statsPerDay = last7Keys.map((key) => {
      const dayEntries = groups[key];
      let totalDuration = 0;
      let nightDuration = 0;
      let napDuration = 0;
      let qualitySum = 0;
      let count = 0;

      dayEntries.forEach((e) => {
        const dur = Number(e.duration) || 0;
        totalDuration += dur;
        if (e.isNap) {
          napDuration += dur;
        } else {
          nightDuration += dur;
        }
        qualitySum += Number(e.quality) || 0;
        count++;
      });

      const avgQuality = count ? qualitySum / count : 0;

      // Sleep score: mix of duration vs goal and quality
      const durationScore = clamp(nightDuration / goalHours, 0, 1);
      const qualityScore = clamp(avgQuality / 10, 0, 1);
      const sleepScore = Math.round((durationScore * 0.6 + qualityScore * 0.4) * 100);

      return {
        dateKey: key,
        totalDuration: Number(totalDuration.toFixed(2)),
        nightDuration: Number(nightDuration.toFixed(2)),
        napDuration: Number(napDuration.toFixed(2)),
        avgQuality: Number(avgQuality.toFixed(1)),
        sleepScore,
        entries: dayEntries,
      };
    });

    // Weekly averages (night sleep only)
    const totalNight = statsPerDay.reduce(
      (acc, d) => acc + d.nightDuration,
      0
    );
    const weeklyAvgNightLocal = statsPerDay.length
      ? Number((totalNight / statsPerDay.length).toFixed(2))
      : null;

    // Sleep debt: only count deficits (no negative debt)
    const totalDebt = statsPerDay.reduce((acc, d) => {
      const deficit = Math.max(goalHours - d.nightDuration, 0);
      return acc + deficit;
    }, 0);
    const totalSleepDebtLocal = Number(totalDebt.toFixed(2));

    // Streak: consecutive days (starting from today backwards) where nightDuration >= goal
    let streakCount = 0;
    // Ensure we go from most recent date backwards
    const sortedDesc = [...statsPerDay].sort((a, b) =>
      a.dateKey < b.dateKey ? 1 : -1
    );
    for (const day of sortedDesc) {
      if (day.nightDuration >= goalHours) {
        streakCount++;
      } else {
        break;
      }
    }

    // Today's stats
    const todayStatsLocal =
      statsPerDay.find((d) => d.dateKey === todayKey) || null;

    const todayProgressLocal = todayStatsLocal
      ? clamp((todayStatsLocal.nightDuration / goalHours) * 100, 0, 120)
      : 0;

    const weeklyProgressLocal = statsPerDay.length
      ? clamp((weeklyAvgNightLocal / goalHours) * 100, 0, 120)
      : 0;

    // Badges
    const badgesLocal = [];
    if (streakCount >= 3) badgesLocal.push("🔥 3-Day Streak");
    if (streakCount >= 7) badgesLocal.push("🏆 7-Day Streak");
    if (streakCount >= 30) badgesLocal.push("🥇 30-Day Streak");
    if (weeklyAvgNightLocal >= goalHours) badgesLocal.push("💤 Weekly Goal Master");
    if (todayStatsLocal?.sleepScore >= 90) badgesLocal.push("🌟 Perfect Night");

    // Simple trend: compare avg of last 3 vs previous ones
    let trendLabelLocal = "Stable";
    let trendColorLocal = "text-slate-500";
    if (statsPerDay.length >= 4) {
      const recent = statsPerDay.slice(-3);
      const earlier = statsPerDay.slice(0, -3);
      const avgRecent =
        recent.reduce((acc, d) => acc + d.nightDuration, 0) /
        recent.length;
      const avgEarlier =
        earlier.reduce((acc, d) => acc + d.nightDuration, 0) /
        earlier.length;

      if (avgRecent > avgEarlier + 0.3) {
        trendLabelLocal = "Improving";
        trendColorLocal = "text-green-600";
      } else if (avgRecent < avgEarlier - 0.3) {
        trendLabelLocal = "Declining";
        trendColorLocal = "text-red-600";
      } else {
        trendLabelLocal = "Stable";
        trendColorLocal = "text-amber-600";
      }
    } else {
      trendLabelLocal = "Not enough data yet";
      trendColorLocal = "text-slate-500";
    }

    return {
      dailyStats: statsPerDay,
      weeklyAvgNight: weeklyAvgNightLocal,
      totalSleepDebt: totalSleepDebtLocal,
      streak: streakCount,
      todayStats: todayStatsLocal
        ? { ...todayStatsLocal, progress: todayProgressLocal }
        : null,
      weeklyProgress: weeklyProgressLocal,
      badges: badgesLocal,
      trendLabel: trendLabelLocal,
      trendColorClass: trendColorLocal,
    };
  }, [entries, goal]);

  // ---- Reminder effect (non-blocking banner) ----
  useEffect(() => {
    if (!user || !reminderTime || !settingsLoaded) return;

    const interval = setInterval(() => {
      const now = new Date();
      const todayKey = toLocalDateKey(now);

      // Already showed reminder for today?
      if (reminderShownForDate === todayKey) return;

      // Has user already logged night sleep today?
      const hasNightSleepToday = entries.some(
        (e) => e.dateKey === todayKey && !e.isNap
      );
      if (hasNightSleepToday) return;

      const [hStr, mStr] = reminderTime.split(":");
      const h = Number(hStr);
      const m = Number(mStr);
      if (isNaN(h) || isNaN(m)) return;

      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const reminderMinutes = h * 60 + m;

      // Show reminder any time from reminderMinutes to reminderMinutes + 60
      if (nowMinutes >= reminderMinutes && nowMinutes <= reminderMinutes + 60) {
        setShowReminder(true);
        setReminderShownForDate(todayKey);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [user, reminderTime, entries, reminderShownForDate, settingsLoaded]);

  const dismissReminder = () => {
    setShowReminder(false);
  };

  // ---- Create or update entry ----
  const handleSaveEntry = async () => {
    if (!user) {
      setErrorMessage("Please log in to track your sleep.");
      return;
    }

    setErrorMessage("");
    setInfoMessage("");

    if (!dateKey || !bedtime || !wakeup) {
      setErrorMessage("Please fill in date, bedtime, and wake-up time.");
      return;
    }

    const duration = calculateDuration(bedtime, wakeup);
    if (duration == null) {
      setErrorMessage("Please enter valid times.");
      return;
    }

    // Basic validation
    if (duration < 0.5) {
      setErrorMessage("Sleep duration looks too short. Check your times.");
      return;
    }
    if (duration > 16) {
      setErrorMessage("Sleep duration looks too long. Check your times.");
      return;
    }

    setSavingEntry(true);
    try {
      const dayCollection = collection(db, "sleepLogs", user.uid, dateKey);

      if (editingEntry) {
        // Update existing
        const entryRef = doc(dayCollection, editingEntry.id);
        await updateDoc(entryRef, {
          bedtime,
          wakeup,
          duration,
          quality: Number(quality),
          isNap,
        });
        setInfoMessage("Sleep entry updated ✅");
      } else {
        // New entry
        await addDoc(dayCollection, {
          bedtime,
          wakeup,
          duration,
          quality: Number(quality),
          isNap,
          loggedAt: new Date(),
        });
        setInfoMessage(`Sleep logged ✅ (${duration.toFixed(2)} hours)`);
      }

      // Reset form
      if (!editingEntry) {
        setBedtime("");
        setWakeup("");
        setQuality(7);
        setIsNap(false);
        setDateKey(toLocalDateKey());
      }
      setEditingEntry(null);

      // Refresh logs
      fetchLogs();
    } catch (err) {
      console.error("Error saving sleep entry:", err);
      setErrorMessage("Failed to save sleep entry. Please try again.");
    } finally {
      setSavingEntry(false);
    }
  };

  const handleEditClick = (entry) => {
    setEditingEntry({ id: entry.id, dateKey: entry.dateKey });
    setDateKey(entry.dateKey);
    setBedtime(entry.bedtime);
    setWakeup(entry.wakeup);
    setQuality(entry.quality ?? 7);
    setIsNap(entry.isNap ?? false);
    setErrorMessage("");
    setInfoMessage("Editing existing entry ✏️");
  };

  const handleDeleteEntry = async (entry) => {
    if (!user) return;

    const confirmed = window.confirm("Delete this sleep entry?");
    if (!confirmed) return;

    try {
      const dayCollection = collection(db, "sleepLogs", user.uid, entry.dateKey);
      const entryRef = doc(dayCollection, entry.id);
      await deleteDoc(entryRef);
      setInfoMessage("Sleep entry deleted.");
      if (editingEntry && editingEntry.id === entry.id) {
        setEditingEntry(null);
      }
      fetchLogs();
    } catch (err) {
      console.error("Error deleting entry:", err);
      setErrorMessage("Failed to delete entry. Please try again.");
    }
  };

  // Progress for today
  const todayProgress = todayStats?.progress ?? 0;

  return (
    <main className="min-h-screen w-full flex flex-col items-center  p-4 sm:p-6">
      <div className="w-full max-w-5xl flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TopMenuButton />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900 text-center">
            Sleep Tracker
          </h1>
        </div>
        
      </div>

      {/* Reminder Banner */}
      {showReminder && (
        <div className="w-full max-w-5xl mb-4 rounded-xl border border-blue-500/60  px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">🌙 Time to wind down for bed</p>
            <p className="text-sm text-slate-700">
              You haven&apos;t logged tonight&apos;s sleep yet. Try to keep a consistent routine!
            </p>
          </div>
          <button
            onClick={dismissReminder}
            className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-slate-900 hover:bg-blue-500/90 transition"
          >
            Got it
          </button>
        </div>
      )}

      {/* Messages */}
      {(errorMessage || infoMessage) && (
        <div className="w-full max-w-5xl mb-4">
          {errorMessage && (
            <div className="mb-2 rounded-lg border border-red-500/60 bg-red-900/40 px-4 py-2 text-sm">
              {errorMessage}
            </div>
          )}
          {infoMessage && (
            <div className="rounded-lg border border-emerald-500/60 bg-emerald-900/40 px-4 py-2 text-sm">
              {infoMessage}
            </div>
          )}
        </div>
      )}

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log Form */}
        <section className="border border-slate-700/80 bg-white/50 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
          <h2 className="text-2xl font-semibold mb-2">
            {editingEntry ? "Edit Sleep Entry" : "Log Your Sleep"}
          </h2>
          <p className="text-sm text-slate-700 mb-2">
            Track your night sleep and naps. Consistency matters more than perfection.
          </p>

          <label className="block">
            <span className="text-slate-700 text-sm font-medium">📅 Date</span>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              disabled={!!editingEntry} // keep date fixed when editing
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {editingEntry && (
              <p className="mt-1 text-xs text-slate-400">
                Date is fixed for existing entries. Create a new one if you need another day.
              </p>
            )}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-slate-700 text-sm font-medium">🛏 Bedtime</span>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </label>

            <label className="block">
              <span className="text-slate-700 text-sm font-medium">⏰ Wake-up Time</span>
              <input
                type="time"
                value={wakeup}
                onChange={(e) => setWakeup(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-slate-700 text-sm font-medium">⭐ Sleep Quality</span>
            <input
              type="range"
              min="1"
              max="10"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="mt-2 w-full accent-blue-500"
            />
            <p className="text-xs text-slate-700 mt-1">
              You rated this night: <span className="font-semibold">{quality} / 10</span>
            </p>
          </label>

          <label className="flex items-center gap-2 text-slate-700 text-sm">
            <input
              type="checkbox"
              checked={isNap}
              onChange={(e) => setIsNap(e.target.checked)}
              className="h-4 w-4"
            />
            ☀ Log as Nap (doesn&apos;t count toward your night sleep goal)
          </label>

          <button
            onClick={handleSaveEntry}
            disabled={savingEntry}
            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition"
          >
            {savingEntry
              ? editingEntry
                ? "Saving changes..."
                : "Logging..."
              : editingEntry
              ? "Save Changes"
              : "Log Sleep"}
          </button>

          {todayStats && (
            <p className="mt-3 text-xs text-slate-700">
              Today&apos;s logged night sleep:{" "}
              <span className="font-semibold">
                {todayStats.nightDuration} hrs
              </span>{" "}
              (Score:{" "}
              <span className="font-semibold">{todayStats.sleepScore}</span> / 100)
            </p>
          )}
        </section>

        {/* Insights & Settings */}
        <section className="border border-slate-700/80 bg-white/50 rounded-2xl p-6 sm:p-8 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold">Weekly Insights</h2>
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${trendColorClass} border-current`}>
              {trendLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-slate-700">Avg Night Sleep</p>
              <p className="text-lg font-semibold">
                {weeklyAvgNight != null ? `${weeklyAvgNight} hrs` : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-700">Sleep Debt (7 days)</p>
              <p className="text-lg font-semibold">
                {totalSleepDebt != null ? `${totalSleepDebt} hrs` : "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-700">Streak</p>
              <p className="text-lg font-semibold">🔥 {streak} days</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-700">Today&apos;s Progress</p>
              <p className="text-lg font-semibold">
                {todayProgress ? `${todayProgress.toFixed(0)}%` : "0%"}
              </p>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="mt-3 space-y-4 text-xs">
            <div>
              <p className="mb-1 text-slate-700">Today&apos;s Progress towards goal</p>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all"
                  style={{ width: `${clamp(todayProgress, 0, 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <p className="mb-1 text-slate-700">Weekly Average vs goal</p>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all"
                  style={{ width: `${clamp(weeklyProgress, 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {badges.map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-500/10 px-3 py-1"
                >
                  {b}
                </span>
              ))}
          </div>
          )}

          {/* Settings */}
          <div className="mt-4 border-t border-slate-700 pt-4 space-y-3 text-sm">
            <h3 className="font-semibold text-slate-700">Sleep Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr,1fr] gap-4">
              <label className="block">
                <span className="text-slate-700 text-xs font-medium">
                  🎯 Night Sleep Goal (hrs)
                </span>
                <input
                  type="number"
                  min={4}
                  max={12}
                  step={0.5}
                  value={goal}
                  onChange={(e) => setGoal(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </label>

              <label className="block">
                <span className="text-slate-700 text-xs font-medium">
                  ⏱ Bedtime Reminder (HH:MM)
                </span>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                />
              </label>
            </div>

            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="mt-1 inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white disabled:opacity-60 transition"
            >
              {settingsSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </section>
      </div>

            {/* Weekly history & monthly calendar access */}
      <section className="w-full max-w-5xl mt-8 border border-slate-700/80 bg-white/50 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Last 7 Days & History</h2>
            <p className="text-xs text-slate-700">
              Recent nights, naps, and sleep scores. For a full monthly view, open the sleep calendar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={fetchLogs}
              disabled={loadingLogs}
              className="rounded-lg border border-slate-600 bg-slate-100 px-3 py-1.5 text-xs font-semibold hover:bg-slate-200 disabled:opacity-60 transition"
            >
              {loadingLogs ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => router.push("/sleepcal")}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
            >
              📅 View Monthly Sleep Calendar
            </button>
          </div>
        </div>

        {dailyStats.length > 0 ? (
          <div className="space-y-3 text-xs sm:text-sm">
            {dailyStats
              .slice()
              .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1))
              .map((d) => (
                <div
                  key={d.dateKey}
                  className="rounded-xl border border-slate-700 bg-white/50 p-3 sm:p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-700">
                        {d.dateKey}
                      </p>
                      <p className="text-slate-700">
                        Night:{" "}
                        <span className="font-semibold">
                          {d.nightDuration}h
                        </span>{" "}
                        · Naps:{" "}
                        <span className="font-semibold">
                          {d.napDuration}h
                        </span>
                      </p>
                      <p className="text-slate-700">
                        Avg Quality:{" "}
                        <span className="font-semibold">
                          {d.avgQuality || "-"}
                        </span>{" "}
                        · Sleep Score:{" "}
                        <span className="font-semibold">
                          {d.sleepScore}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Per-entry list */}
                  <div className="mt-2 border-t border-slate-700 pt-2 space-y-1.5">
                    {d.entries.map((e) => (
                      <div
                        key={e.id}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <div className="text-slate-700">
                          <span className="font-mono text-xs">
                            {e.bedtime} → {e.wakeup}
                          </span>{" "}
                          · {e.duration.toFixed(2)}h · Q {e.quality}/10{" "}
                          {e.isNap && (
                            <span className="ml-1 text-amber-300 text-[11px]">
                              (Nap)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(e)}
                            className="text-[11px] rounded-md border border-slate-600 px-2 py-0.5 hover:bg-slate-200 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(e)}
                            className="text-[11px] rounded-md border border-red-600/80 px-2 py-0.5 text-red-300 hover:bg-red-900/40 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-sm text-slate-700">
            No sleep data for the last 7 days yet. Start by logging tonight&apos;s sleep!
          </p>
        )}
      </section>


      <button
        onClick={() => router.push("/dashboard")}
        className="mt-8 mb-4 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-white transition"
      >
        ⬅ Back to Dashboard
      </button>
    </main>
  );
}
