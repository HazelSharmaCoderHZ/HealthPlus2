"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getTeam, getTeamUserStatsSafe } from "@/lib/teams";

export default function TeamStatsPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const teamId = params?.teamID || params?.teamId;

  const [team, setTeam] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
    return d.toISOString().slice(0, 10);
  });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    (async () => {
      setLoading(true);
      try {
        const t = await getTeam(teamId);
        setTeam(t);
      } catch (e) {
        console.error("getTeam:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamId]);

  async function loadStats() {
    setLoadingStats(true);
    try {
      const s = await getTeamUserStatsSafe(teamId, { from, to });
      setStats(s);
    } catch (e) {
      console.error("getTeamUserStatsSafe:", e);
      alert(e?.message || "Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  }

  function exportCSV() {
    if (!stats.length) return alert("No stats to export");
    const header = ["userId", "displayName", "gender", "age", "water_totalGlasses", "nutrition_supported", "nutrition_note"];
    const rows = stats.map((r) => [
      r.userId,
      r.profile?.displayName ?? "",
      r.gender ?? "",
      r.age ?? "",
      r.water?.totalGlasses ?? 0,
      r.nutrition?.supported ? "yes" : "no",
      r.nutrition?.note ?? "",
    ]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${team?.name ?? "team"}-stats-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{team?.name ?? "Team"} — Stats</h1>
          <div className="text-sm text-slate-600">Invite code: <span className="font-medium">{team?.inviteCode}</span></div>
        </div>
        <div>
          <button onClick={() => router.push(`/groups/${teamId}`)} className="px-3 py-1 rounded border">← Back</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <div className="flex items-center gap-2">
          <label className="text-sm">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border p-1 rounded" />
          <label className="text-sm">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border p-1 rounded" />
          <button onClick={loadStats} className="px-3 py-1 rounded bg-blue-600 text-white" disabled={loadingStats}>
            {loadingStats ? "Loading..." : "Load Stats"}
          </button>
          <button onClick={exportCSV} className="px-3 py-1 rounded border">Export CSV</button>
        </div>

        <div className="mt-4">
          <p className="text-sm text-slate-500">
            Nutrition aggregation is <strong>not</strong> available client-side for nested subcollections (nutritionLogs/&lt;userId&gt;/&lt;dateId&gt;/&lt;logId&gt;).
            To enable nutrition stats from the client, create a root collection <code>nutritionEntries</code> with fields <code>userId</code>, <code>date</code>, <code>calories</code>.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {stats.length === 0 ? (
          <p className="text-sm text-slate-500">No stats loaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">User</th>
                  <th className="px-3 py-2">Gender</th>
                  <th className="px-3 py-2">Age</th>
                  <th className="px-3 py-2">Water (glasses)</th>
                  <th className="px-3 py-2">Nutrition supported</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.userId} className="border-t">
                    <td className="px-3 py-2">{s.profile?.displayName ?? s.userId}</td>
                    <td className="px-3 py-2">{s.gender ?? "—"}</td>
                    <td className="px-3 py-2">{s.age ?? "—"}</td>
                    <td className="px-3 py-2">{s.water?.totalGlasses ?? 0}</td>
                    <td className="px-3 py-2">{s.nutrition?.supported ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
