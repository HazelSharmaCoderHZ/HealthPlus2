"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
  getTeam,
  getTeamMembers,
  approveMember,
  removeMember,
} from "@/lib/teams";

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // standardized userId (prefer uid only)
  const userId = user?.uid ?? null;

  const teamIdParam = params?.teamId;
  const teamId = typeof teamIdParam === "string" ? teamIdParam : teamIdParam?.[0];

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  // Derived info: current user's membership, admin flag, etc.
  const myMembership = useMemo(() => {
    if (!userId || !members.length) return null;
    return members.find((m) => m.userId === userId) || null;
  }, [members, userId]);

  const isAdmin =
    myMembership &&
    myMembership.role === "admin" &&
    myMembership.status === "approved";

  const isApprovedMember = myMembership && myMembership.status === "approved";

  const pendingMembers = useMemo(
    () => members.filter((m) => m.status === "pending"),
    [members]
  );

  const approvedMembers = useMemo(
    () => members.filter((m) => m.status === "approved"),
    [members]
  );

  // Debug logs to help inspect client state in devtools
  useEffect(() => {
    console.debug("DEBUG useAuth user:", user);
    console.debug("DEBUG computed userId:", userId);
  }, [userId, user]);

  useEffect(() => {
    console.debug("DEBUG team:", team);
  }, [team]);

  useEffect(() => {
    console.debug("DEBUG members:", members);
  }, [members]);

  // load team info once
  useEffect(() => {
    if (!teamId) return;

    let mounted = true;
    setLoadingTeam(true);
    setError("");
    getTeam(teamId)
      .then((t) => {
        if (!mounted) return;
        setTeam(t);
      })
      .catch((e) => {
        console.error("getTeam error", e);
        setError("Failed to load team information.");
      })
      .finally(() => {
        if (mounted) setLoadingTeam(false);
      });

    return () => {
      mounted = false;
    };
  }, [teamId]);

  // Realtime listener for members (auth required by rules)
  useEffect(() => {
    if (!teamId || !userId) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);
    setError("");

    import("firebase/firestore").then((fb) => {
      const { collection, query, onSnapshot, orderBy } = fb;

      // members collection reference
      const membersCol = collection(db, "teams", teamId, "members");
      // optional ordering if createdAt present
      const q = query(membersCol /*, orderBy("createdAt", "asc")*/);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const arr = [];
          snapshot.forEach((docSnap) => {
            arr.push({
              id: docSnap.id,
              ...docSnap.data(),
            });
          });
          setMembers(arr);
          setLoadingMembers(false);
        },
        (err) => {
          console.error("members onSnapshot error:", err);
          setError(
            "You do not have access to this team yet or there was a permissions error."
          );
          setLoadingMembers(false);
        }
      );

      return () => unsubscribe();
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, userId]);

  // Fetch members (fallback non-realtime)
  useEffect(() => {
    if (!teamId || !userId) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const list = await getTeamMembers(teamId);
        setMembers(list);
      } catch (err) {
        console.error(err);
        setError("You do not have access to this team yet.");
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [teamId, userId]);

  const refreshMembers = async () => {
    if (!teamId || !userId) return;
    try {
      const list = await getTeamMembers(teamId);
      setMembers(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (memberUserId) => {
    try {
      setActionLoadingId(memberUserId);
      await approveMember({ teamId, userId: memberUserId });
      await refreshMembers();
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to approve member.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleRemove = async (memberUserId) => {
    const isSelf = memberUserId === userId;
    const msg = isSelf
      ? "Are you sure you want to leave this team?"
      : "Remove this member from the team?";
    if (!window.confirm(msg)) return;

    try {
      setActionLoadingId(memberUserId);
      await removeMember({ teamId, userId: memberUserId });
      await refreshMembers();

      if (isSelf) {
        router.push("/groups");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to remove member.");
    } finally {
      setActionLoadingId("");
    }
  };

  // helper: are we the team creator?
  const amICreator = team?.createdBy && userId && team.createdBy === userId;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top header */}
      <section className="space-y-2">
        <button
          onClick={() => router.push("/groups")}
          className="text-xs text-blue-600 hover:underline mb-1"
        >
          ← Back to Team Dashboard
        </button>

        <h1 className="text-3xl font-semibold text-blue-700">
          {team?.name || "Team"}
        </h1>

        {/* Invite code visible to admins; also show to the creator while they wait */}
        {(isAdmin || amICreator) && team?.inviteCode && (
          <p className="text-xs text-slate-500 mt-1">
            Team code:{" "}
            <span className="font-mono font-semibold">{team.inviteCode}</span>
          </p>
        )}

        {loadingTeam && <p className="text-sm text-slate-500">Loading team...</p>}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {userId && myMembership && (
          <p className="text-xs text-slate-500">
            Your role: <span className="font-semibold">{myMembership.role}</span>{" "}
            • Status:{" "}
            <span
              className={
                myMembership.status === "approved"
                  ? "text-emerald-600 font-semibold"
                  : "text-amber-600 font-semibold"
              }
            >
              {myMembership.status}
            </span>
          </p>
        )}

        {userId && !myMembership && !loadingMembers && (
          <p className="text-xs text-slate-500">
            You are not a member of this team yet. Ask the admin to send you an
            invite link.
            {amICreator && (
              <>
                {" "}
                (Note: you created this team with account{" "}
                <span className="font-mono">{userId}</span>. If you expected to
                be admin here, check the membership document in Firestore — it
                may be pending or missing.)
              </>
            )}
          </p>
        )}
      </section>

      {/* Members sections */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Approved members */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Members</h2>
            {loadingMembers && <span className="text-xs text-slate-400">Loading...</span>}
          </div>

          {!loadingMembers && !approvedMembers.length && (
            <p className="text-sm text-slate-500">No approved members yet.</p>
          )}

          <div className="space-y-2">
            {approvedMembers.map((m) => {
              const isSelf = m.userId === userId;
              const showRemove = isSelf || (isAdmin && !isSelf);

              return (
                <div
                  key={m.userId}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">{m.userId}</p>
                    <p className="text-xs text-slate-500">
                      Role: <span className="font-semibold">{m.role}</span>
                      {isSelf && " • You"}
                    </p>
                  </div>

                  {showRemove && (
                    <button
                      onClick={() => handleRemove(m.userId)}
                      disabled={actionLoadingId === m.userId}
                      className="text-xs rounded-lg border border-slate-200 px-3 py-1 hover:bg-red-50 text-red-600 disabled:opacity-60"
                    >
                      {isSelf
                        ? actionLoadingId === m.userId
                          ? "Leaving..."
                          : "Leave"
                        : actionLoadingId === m.userId
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending requests – only for admins */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Pending requests</h2>
            {!isAdmin && <span className="text-[11px] text-slate-400">Only admins can approve members.</span>}
          </div>

          {!isAdmin && <p className="text-xs text-slate-500">If you requested to join, wait for an admin to approve you.</p>}

          {isAdmin && !pendingMembers.length && !loadingMembers && (
            <p className="text-sm text-slate-500">No pending requests.</p>
          )}

          {isAdmin && (
            <div className="space-y-2">
              {pendingMembers.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">{m.userId}</p>
                    <p className="text-xs text-slate-500">Requested to join</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(m.userId)}
                      disabled={actionLoadingId === m.userId}
                      className="text-xs rounded-lg px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {actionLoadingId === m.userId ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleRemove(m.userId)}
                      disabled={actionLoadingId === m.userId}
                      className="text-xs rounded-lg border border-slate-200 px-3 py-1 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {actionLoadingId === m.userId ? "Removing..." : "Remove"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Shared stats placeholder */}
      <section className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Team health overview</h2>
        <p className="text-sm text-slate-500">
          Here we will show shared statistics for this team: <span className="font-semibold">sleep, water, and nutrition</span> for all approved members. We&apos;ll wire this up next using your existing logs.
        </p>

        <div className="grid gap-3 sm:grid-cols-3 mt-3">
          <div className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
            <p className="text-xs text-slate-500">Sleep</p>
            <p className="text-base font-semibold text-slate-800">Coming soon</p>
          </div>
          <div className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
            <p className="text-xs text-slate-500">Water</p>
            <p className="text-base font-semibold text-slate-800">Coming soon</p>
          </div>
          <div className="rounded-xl border border-slate-200 px-3 py-3 text-sm">
            <p className="text-xs text-slate-500">Nutrition</p>
            <p className="text-base font-semibold text-slate-800">Coming soon</p>
          </div>
        </div>
      </section>
    </div>
  );
}
