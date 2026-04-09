"use client";

import {
  collection, addDoc, serverTimestamp, getDocs, doc,
  deleteDoc, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "../../../components/TopMenuButton";
import {
  getTeam, getTeamMembers, requestToJoinTeam, approveMember, removeMember,
} from "@/lib/teams";
import {
  Users, Megaphone, BarChart3, Shield, Clock, Trash2,
  CheckCircle2, ChevronLeft, Copy, Check, UserPlus, LogOut,
} from "lucide-react";

// ── Pulse loader ──────────────────────────────────────────
function PulseLoader({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-blue-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

// ── Role badge ────────────────────────────────────────────
function RoleBadge({ role }) {
  return role === "admin"
    ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"><Shield className="w-3 h-3" /> admin</span>
    : <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">member</span>;
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

// ── Main page ─────────────────────────────────────────────
export default function TeamPage() {
  const { user } = useAuth();
  const params = useParams();
  const teamId = params?.teamID || params?.teamId;
  const router = useRouter();

  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [sendingAnn, setSendingAnn] = useState(false);
  const [copied, setCopied] = useState(false);

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
      const annSnap = await getDocs(collection(db, "teams", teamId, "announcements"));
      // Sort newest first
      const anns = annSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setAnnouncements(anns);
    } catch (e) {
      console.error("fetchAll:", e);
      setError(e?.message || "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  const myMembership = useMemo(
    () => members.find((m) => m.userId === user?.uid) || null,
    [members, user?.uid]
  );
  const amAdmin = myMembership?.role === "admin" && myMembership?.status === "approved";
  const amApprovedMember = myMembership?.status === "approved";

  async function handleRequestToJoin() {
    setActionLoading(true);
    try {
      await requestToJoinTeam({ teamId });
      alert("Request sent — pending admin approval.");
      await fetchAll();
    } catch (e) {
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
      alert(e?.message || "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemove(userId) {
    const self = user?.uid === userId;
    if (!confirm(self ? "Leave the team?" : "Remove this member?")) return;
    setActionLoading(true);
    try {
      await removeMember({ teamId, userId });
      if (self) router.push("/groups");
      else await fetchAll();
    } catch (e) {
      alert(e?.message || "Failed to remove member");
    } finally {
      setActionLoading(false);
    }
  }

  async function sendAnnouncement() {
    if (!user?.uid || !announcement.trim()) return;
    setSendingAnn(true);
    try {
      await addDoc(collection(db, "teams", teamId, "announcements"), {
        text: announcement.trim(),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        readBy: { [user.uid]: true },
      });
      setAnnouncement("");
      fetchAll();
    } catch (e) {
      console.error("Announcement error:", e);
      alert("Failed to send announcement");
    } finally {
      setSendingAnn(false);
    }
  }

  async function deleteAnnouncement(id) {
    if (!confirm("Delete this announcement?")) return;
    try {
      await deleteDoc(doc(db, "teams", teamId, "announcements", id));
      fetchAll();
    } catch {
      alert("Failed to delete");
    }
  }

  async function markAsRead(announcementId) {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, "teams", teamId, "announcements", announcementId), {
        [`readBy.${user.uid}`]: true,
      });
    } catch {
      // non-critical
    }
  }

  function copyInviteCode() {
    if (!team?.inviteCode) return;
    navigator.clipboard.writeText(team.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const approvedMembers = members.filter(m => m.status === "approved");
  const pendingMembers  = members.filter(m => m.status === "pending");

  if (!teamId) return <div className="p-6">Missing team ID</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <TopMenuButton />

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/groups")}
            className="p-2 rounded-xl hover:bg-blue-100 text-slate-500 hover:text-blue-700 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            {loading ? (
              <div className="h-7 w-40 bg-blue-100 rounded-lg animate-pulse" />
            ) : (
              <h1 className="text-2xl font-black text-slate-900">{team?.name ?? "Team"}</h1>
            )}
            <p className="text-sm text-slate-500 mt-0.5">
              {approvedMembers.length} member{approvedMembers.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Invite code pill */}
          {team?.inviteCode && (
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="tracking-widest uppercase">{team.inviteCode}</span>
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <PulseLoader label="Loading team data…" />
        ) : (
          <>
            {/* Membership status / join */}
            {!amApprovedMember && (
              <Card className="border-yellow-100 bg-yellow-50/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800 mb-1">
                      {myMembership?.status === "pending"
                        ? "⏳ Your request is pending approval"
                        : "You're not a member of this team yet"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {myMembership?.status === "pending"
                        ? "An admin will review your request soon."
                        : "Request to join to see team data and announcements."}
                    </p>
                  </div>
                  {!myMembership && (
                    <button
                      onClick={handleRequestToJoin}
                      disabled={actionLoading}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      <UserPlus className="w-4 h-4" /> Request to Join
                    </button>
                  )}
                </div>
              </Card>
            )}

            {/* View Stats button */}
            {amApprovedMember && (
              <button
                onClick={() => router.push(`/groups/${teamId}/stats`)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-blue-200 bg-white hover:bg-blue-50 transition shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">Team Health Stats</p>
                    <p className="text-xs text-slate-500">View shared sleep & nutrition data</p>
                  </div>
                </div>
                <ChevronLeft className="w-5 h-5 text-slate-300 group-hover:text-blue-500 rotate-180 transition" />
              </button>
            )}

            {/* Admin: compose announcement */}
            {amAdmin && (
              <Card>
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-blue-600" /> Post Announcement
                </h2>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  rows={3}
                  className="w-full border border-blue-100 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/40 placeholder:text-slate-400"
                  placeholder="Write a message for your team…"
                />
                <button
                  onClick={sendAnnouncement}
                  disabled={sendingAnn || !announcement.trim()}
                  className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingAnn ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                  ) : (
                    <><Megaphone className="w-4 h-4" /> Send to Team</>
                  )}
                </button>
              </Card>
            )}

            {/* Announcements feed */}
            {announcements.length > 0 && (
              <Card>
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  📢 Announcements
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{announcements.length}</span>
                </h2>
                <ul className="space-y-3">
                  {announcements.map((a) => {
                    const isRead = !!a.readBy?.[user?.uid];
                    const readCount = Object.keys(a.readBy ?? {}).length;
                    return (
                      <li
                        key={a.id}
                        onMouseEnter={() => !isRead && markAsRead(a.id)}
                        className={`rounded-xl border p-4 transition ${isRead ? "bg-white border-slate-100" : "bg-blue-50 border-blue-200"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            {!isRead && (
                              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 mt-1.5 float-left" />
                            )}
                            <p className="text-slate-800 text-sm leading-relaxed">{a.text}</p>
                          </div>
                          {amAdmin && (
                            <button
                              onClick={() => deleteAnnouncement(a.id)}
                              className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {a.createdAt?.toDate
                              ? a.createdAt.toDate().toLocaleString()
                              : "Just now"}
                          </span>
                          <span className="ml-auto flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            {readCount} read
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}

            {/* Pending approvals (admin only) */}
            {amAdmin && pendingMembers.length > 0 && (
              <Card className="border-yellow-100">
                <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-yellow-600" /> Pending Requests
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">{pendingMembers.length}</span>
                </h2>
                <ul className="space-y-3">
                  {pendingMembers.map((m) => (
                    <li key={m.userId} className="flex items-center justify-between p-4 rounded-xl border border-yellow-100 bg-yellow-50/40">
                      <div>
                        <p className="font-semibold text-slate-800">{m.profile?.username || "Anonymous"}</p>
                        <p className="text-xs text-slate-500">{m.profile?.gender || "—"} · {m.profile?.age || "—"} yrs</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(m.userId)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRemove(m.userId)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Members list */}
            <Card>
              <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Members
                <span className="ml-auto text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">{approvedMembers.length}</span>
              </h2>
              <ul className="space-y-3">
                {approvedMembers.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-black text-sm">
                        {(m.profile?.username || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{m.profile?.username || "Anonymous"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <RoleBadge role={m.role} />
                          <span className="text-xs text-slate-400">{m.profile?.gender || "—"} · {m.profile?.age || "—"} yrs</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(amAdmin || user?.uid === m.userId) && (
                        <button
                          onClick={() => handleRemove(m.userId)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-medium hover:border-red-200 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                        >
                          {user?.uid === m.userId
                            ? <><LogOut className="w-3 h-3" /> Leave</>
                            : <><Trash2 className="w-3 h-3" /> Remove</>}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}