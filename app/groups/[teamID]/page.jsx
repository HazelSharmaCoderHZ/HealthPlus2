"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "../../../components/TopMenuButton";
import {
  getTeam,
  getTeamMembers,
  requestToJoinTeam,
  approveMember,
  removeMember,
} from "@/lib/teams";

export default function TeamPage() {
  const { user } = useAuth();
  const params = useParams();
  const teamId = params?.teamID || params?.teamId;
  const router = useRouter();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!teamId) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, user?.uid]);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const t = await getTeam(teamId);
      setTeam(t);
      const mems = await getTeamMembers(teamId);
      setMembers(mems);
    } catch (e) {
      console.error("fetchAll:", e);
      setError(e?.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  const myMembership = useMemo(() => members.find((m) => m.userId === user?.uid) || null, [members, user?.uid]);
  const amAdmin = myMembership?.role === "admin" && myMembership?.status === "approved";
  const amApprovedMember = myMembership?.status === "approved";

  async function handleRequestToJoin() {
    setActionLoading(true);
    try {
      await requestToJoinTeam({ teamId });
      alert("Request sent.");
      await fetchAll();
    } catch (e) {
      console.error("requestToJoin:", e);
      alert(e?.message || "Failed to request to join");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleApprove(userId) {
    if (!confirm("Approve this member?")) return;
    setActionLoading(true);
    try {
      await approveMember({ teamId, userId });
      await fetchAll();
    } catch (e) {
      console.error("approve:", e);
      alert(e?.message || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemove(userId) {
    const self = user?.uid === userId;
    const ok = confirm(self ? "Leave the team?" : "Remove this member?");
    if (!ok) return;
    setActionLoading(true);
    try {
      await removeMember({ teamId, userId });
      if (self) {
        router.push("/groups");
      } else {
        await fetchAll();
      }
    } catch (e) {
      console.error("remove:", e);
      alert(e?.message || "Failed to remove member");
    } finally {
      setActionLoading(false);
    }
  }

  if (!teamId) {
    return <div className="p-6">Missing team id</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
        <TopMenuButton />

      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/groups")} className="text-sm px-3 py-1 rounded border">
          ← Back
        </button>
        <h1 className="text-2xl font-bold">{team?.name || "Team"}</h1>
        <div />
      </div>

      <div className="bg-white p-4 rounded shadow-sm mb-6">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-slate-600">Created by</p>
                <p className="font-medium">{team?.createdBy}</p>
              </div>
              <div className="text-sm text-slate-600">
                Invite code: <span className="font-medium">{team?.inviteCode}</span>
              </div>
            </div>

            <div className="mt-4">
              {!amApprovedMember ? (
                <>
                  <p className="text-sm text-slate-600 mb-2">You are not an approved member of this team.</p>
                  <button
                    onClick={handleRequestToJoin}
                    disabled={actionLoading || myMembership?.status === "pending"}
                    className="px-3 py-1 rounded bg-blue-600 text-white"
                  >
                    {myMembership?.status === "pending" ? "Request pending" : "Request to join"}
                  </button>
                </>
              ) : (
                <p className="text-sm text-green-600">You are a team member ({myMembership.role}).</p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-white p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Members ({members.length})</h2>
        </div>

        <ul className="space-y-3">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between border rounded p-3">
              <div>
                <div className="font-medium">{m.userId}</div>
                <div className="text-sm text-slate-600">{m.role} • {m.status}</div>
              </div>
              <div className="flex items-center gap-2">
                {amAdmin && m.status === "pending" && (
                  <button onClick={() => handleApprove(m.userId)} className="px-3 py-1 rounded bg-blue-600 text-white">
                    Approve
                  </button>
                )}

                {(amAdmin || user?.uid === m.userId) && (
                  <button onClick={() => handleRemove(m.userId)} className="px-3 py-1 rounded border">
                    {user?.uid === m.userId ? "Leave" : "Remove"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
