"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "../../components/TopMenuButton";
import {
  createTeam,
  getUserTeams,
  requestToJoinTeam,
  getTeam,
  findTeamByInviteCode,
} from "@/lib/teams";

export default function GroupsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.uid || user?.id || null;

  const [teamName, setTeamName] = useState("");
  const [teams, setTeams] = useState([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [joinInput, setJoinInput] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinMessage, setJoinMessage] = useState("");

  useEffect(() => {
    if (!userId) {
      setTeams([]);
      setLoadingTeams(false);
      return;
    }

    const fetchTeams = async () => {
      try {
        setLoadingTeams(true);
        setError("");
        const data = await getUserTeams(userId);
        setTeams(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load your teams.");
      } finally {
        setLoadingTeams(false);
      }
    };

    fetchTeams();
  }, [userId]);

  const refreshTeams = async () => {
    if (!userId) return;
    try {
      const data = await getUserTeams(userId);
      setTeams(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!userId) {
      setError("You must be logged in to create a team.");
      return;
    }

    if (!teamName.trim()) {
      setError("Team name cannot be empty.");
      return;
    }

    try {
      setLoadingCreate(true);
      setError("");
      setSuccessMessage("");

      const { id, inviteCode } = await createTeam({
        name: teamName,
        createdBy: userId,
      });

      setTeamName("");
      await refreshTeams();

      setSuccessMessage(`Team created! Share this team code with others: ${inviteCode}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create team.");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleJoinFromInput = async (e) => {
    e.preventDefault();

    if (!userId) {
      setJoinError("Please log in to join a team.");
      return;
    }

    const code = joinInput.trim();
    if (!code) {
      setJoinError("Enter a team code.");
      return;
    }

    try {
      setJoinLoading(true);
      setJoinError("");
      setJoinMessage("");

      const team = await findTeamByInviteCode(code);
      if (!team) {
        setJoinError("No team found for this code.");
        return;
      }

      // requestToJoinTeam now prefers auth.currentUser if userId missing,
      // but pass userId explicitly to be safe.
      await requestToJoinTeam({
        userId,
        teamId: team.id,
      });

      setJoinMessage(
        "Join request sent! The admin must approve you before the team appears in your dashboard."
      );
      setJoinInput("");

      await refreshTeams();
    } catch (err) {
      console.error(err);
      setJoinError(err.message || "Failed to join team.");
    } finally {
      setJoinLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <TopMenuButton />
      <section>
        <h1 className="text-3xl font-semibold text-blue-700 mb-2">Team Dashboard</h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Create teams, invite others with a code, and see shared health stats (sleep, water, nutrition) with your group.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Create a new team</h2>
          <p className="text-xs text-slate-500">
            As the creator you become the admin of this team. You can approve or remove members later.
          </p>

          <form onSubmit={handleCreateTeam} className="flex flex-col gap-3">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Team name (e.g. Family Health, Hostel Room 304)"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loadingCreate}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loadingCreate ? "Creating..." : "Create team"}
            </button>
          </form>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {successMessage && (
            <div className="flex items-center gap-3">
              <div className="text-xs sm:text-sm text-emerald-700 break-all bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                {successMessage}
              </div>
              <button
                className="text-xs rounded-lg border px-3 py-1"
                onClick={async () => {
                  try {
                    const codeMatch = successMessage.match(/([a-z0-9]{6,})$/i);
                    const code = codeMatch ? codeMatch[0] : "";
                    await navigator.clipboard.writeText(code);
                    alert("Team code copied to clipboard");
                  } catch (e) {
                    alert("Copy failed — please copy manually");
                  }
                }}
              >
                Copy code
              </button>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Join a team</h2>
          <p className="text-xs text-slate-500">Paste the invite code shared by your team admin. We'll send a join request to that team.</p>

          <form onSubmit={handleJoinFromInput} className="flex flex-col gap-3">
            <input
              type="text"
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="Paste invite code here"
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={joinLoading}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {joinLoading ? "Sending request..." : "Join team"}
            </button>
          </form>

          {joinError && <p className="text-sm text-red-600">{joinError}</p>}

          {joinMessage && <div className="text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">{joinMessage}</div>}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-xl font-semibold text-slate-800">My teams</h2>

        {!userId && <p className="text-sm text-slate-500">Please log in to see your teams.</p>}

        {userId && loadingTeams && <p className="text-sm text-slate-500">Loading teams...</p>}

        {userId && !loadingTeams && !teams.length && (
          <p className="text-sm text-slate-500">You're not part of any team yet. Create one above or join a team using an invite code.</p>
        )}

        <div className="space-y-3">
          {teams.map(({ team, membership }) => (
            <div key={`${team.id}-${membership.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-slate-800">{team?.name || "Unnamed team"}</p>
                <p className="text-xs text-slate-500">
                  Role: <span className="font-semibold">{membership.role}</span> • Status:{" "}
                  <span className={membership.status === "approved" ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                    {membership.status}
                  </span>
                </p>
              </div>

              <button className="text-xs rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50" onClick={() => router.push(`/groups/${team.id}`)}>View</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
