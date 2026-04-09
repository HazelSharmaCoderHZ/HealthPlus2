"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "components/TopMenuButton";
import { createTeam, getUserTeams, findTeamByInviteCode, requestToJoinTeam } from "@/lib/teams";
import { Users, Plus, Hash, ChevronRight, Shield, Clock } from "lucide-react";

// ── Pulse loader ──────────────────────────────────────────
function PulseLoader() {
  return (
    <div className="flex items-center gap-2 py-8 justify-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ── Section card wrapper ──────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-blue-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    approved: "bg-green-100 text-green-700",
    pending:  "bg-yellow-100 text-yellow-700",
    rejected: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

// ── Role badge ────────────────────────────────────────────
function RoleBadge({ role }) {
  return role === "admin"
    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"><Shield className="w-3 h-3" /> admin</span>
    : <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">member</span>;
}

// ── Main page ─────────────────────────────────────────────
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
      if (!team) { alert("Invite code not found"); return; }
      await requestToJoinTeam({ teamId: team.id });
      alert("Join request sent — pending admin approval.");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <Card className="text-center max-w-sm mx-auto">
          <Users className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Please sign in to manage teams.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <TopMenuButton />

        {/* Page header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Teams</h1>
            <p className="text-sm text-slate-500">Create or join a wellness team</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Create team */}
          <Card>
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-600" /> Create a new team
            </h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name (e.g. Family Fitness)"
                className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/40 placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={creating || !newTeamName.trim()}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating…
                  </span>
                ) : "Create Team"}
              </button>
            </form>
          </Card>

          {/* Join by invite code */}
          <Card>
            <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600" /> Join with invite code
            </h2>
            <form onSubmit={handleJoinByCode} className="flex flex-col gap-3">
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/40 placeholder:text-slate-400 tracking-widest uppercase"
              />
              <button
                type="submit"
                disabled={joining || !inviteCode.trim()}
                className="w-full py-3 rounded-xl bg-white border-2 border-blue-600 text-blue-700 font-semibold text-sm hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    Requesting…
                  </span>
                ) : "Request to Join"}
              </button>
            </form>
          </Card>
        </div>

        {/* Your teams */}
        <Card>
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Your Teams
            {teams.length > 0 && (
              <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{teams.length}</span>
            )}
          </h2>

          {loading ? (
            <PulseLoader />
          ) : teams.length === 0 ? (
            <div className="text-center py-10">
              <Users className="w-12 h-12 text-blue-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">You don't belong to any teams yet.</p>
              <p className="text-slate-400 text-xs mt-1">Create one above or ask for an invite code.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {teams.map(({ team, membership }) => (
                <li
                  key={team.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-blue-50 hover:border-blue-200 hover:bg-blue-50/40 transition cursor-pointer group"
                  onClick={() => router.push(`/groups/${team.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-sm">
                      {team.name?.[0]?.toUpperCase() ?? "T"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{team.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <RoleBadge role={membership.role} />
                        <StatusBadge status={membership.status} />
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}