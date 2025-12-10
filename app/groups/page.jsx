"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "components/TopMenuButton";
import {
  createTeam,
  getUserTeams,
  findTeamByInviteCode,
  requestToJoinTeam,
} from "@/lib/teams";

export default function GroupsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newTeamName, setNewTeamName] = useState("");
  const [creating, setCreating] = useState(false);

  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  async function fetchTeams() {
    setLoading(true);
    try {
      const res = await getUserTeams(user.uid);
      setTeams(res);
    } catch (e) {
      console.error("getUserTeams:", e);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    try {
      const created = await createTeam({ name: newTeamName.trim(), createdBy: user.uid });
      setNewTeamName("");
      router.push(`/groups/${created.id}`);
    } catch (e) {
      console.error("createTeam:", e);
      alert(e.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  async function handleJoinByCode(e) {
    e?.preventDefault();
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const team = await findTeamByInviteCode(inviteCode.trim());
      if (!team) {
        alert("Invite code not found");
        return;
      }
      await requestToJoinTeam({ teamId: team.id });
      alert("Join request sent (pending approval)");
      setInviteCode("");
      fetchTeams();
    } catch (e) {
      console.error("join:", e);
      alert(e?.message || "Could not join team");
    } finally {
      setJoining(false);
    }
  }

  if (!user) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-red-500">Please sign in to manage teams.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
        <TopMenuButton />

      <h1 className="text-2xl font-bold mb-4">Teams</h1>

      <section className="mb-6 bg-white p-4 rounded shadow-sm">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="New team name"
            className="flex-1 border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />
          <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded">
            {creating ? "Creating..." : "Create"}
          </button>
        </form>
      </section>

      <section className="mb-6 bg-white p-4 rounded shadow-sm">
        <form onSubmit={handleJoinByCode} className="flex gap-2">
          <input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Invite code"
            className="flex-1 border px-3 py-2 rounded focus:ring-2 focus:ring-blue-400"
          />
          <button onClick={handleJoinByCode} disabled={joining} className="px-4 py-2 bg-blue-600 text-white rounded">
            {joining ? "Requesting..." : "Request to Join"}
          </button>
        </form>
      </section>

      <section className="bg-white p-4 rounded shadow-sm">
        <h2 className="font-medium mb-3">Your teams</h2>

        {loading ? (
          <p className="text-sm text-slate-500">Loading teams…</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-slate-500">You don't belong to any teams yet.</p>
        ) : (
          <ul className="space-y-3">
            {teams.map(({ team, membership }) => (
              <li key={team.id} className="flex justify-between items-center border rounded p-3">
                <div>
                  <div className="font-semibold">{team.name}</div>
                  <div className="text-sm text-slate-500">
                    Role: {membership.role} • {membership.status}
                  </div>
                </div>
                <div>
                  <button
                    onClick={() => router.push(`/groups/${team.id}`)}
                    className="px-3 py-1 rounded bg-blue-600 text-white"
                  >
                    Open
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
