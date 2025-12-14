"use client";
import { collection, addDoc, serverTimestamp, getDocs, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "../../../components/TopMenuButton";
import { updateDoc } from "firebase/firestore";
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
  const [username, setUsername] = useState("");

  
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [announcement, setAnnouncement] = useState("");
const [announcements, setAnnouncements] = useState([]);


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
      const annSnap = await getDocs(
  collection(db, "teams", teamId, "announcements")
);
setAnnouncements(
  annSnap.docs.map(d => ({ id: d.id, ...d.data() }))
);

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

  async function deleteAnnouncement(id) {
  if (!confirm("Delete this announcement?")) return;

  try {
    await deleteDoc(
      doc(db, "teams", teamId, "announcements", id)
    );
    fetchAll();
  } catch (e) {
    alert("Failed to delete");
  }
}

  async function markAsRead(announcementId) {
  if (!user?.uid) return;

  const ref = doc(db, "teams", teamId, "announcements", announcementId);

  try {
    await updateDoc(ref, {
      [`readBy.${user.uid}`]: true,
    });
  } catch (e) {
    console.warn("Read receipt failed");
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
  async function sendAnnouncement() {
  if (!user?.uid) return;
  if (!announcement.trim()) return;

  try {
    await addDoc(collection(db, "teams", teamId, "announcements"), {
      text: announcement.trim(),
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      readBy: {
        [user.uid]: true, // admin has read it
      },
    });

    setAnnouncement("");
    fetchAll();
  } catch (e) {
    console.error("Announcement error:", e);
    alert("Failed to send announcement");
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
              <div className="text-sm text-slate-600">
                Invite code: <span className="font-medium">{team?.inviteCode}</span>
              </div>
            </div>

            
              
            
          </>
        )}
        <button
  onClick={() => router.push(`/groups/${teamId}/stats`)}
  className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-700"
>
  View Stats
</button>

      </div>
{amAdmin && (
  <div className="bg-white p-4 rounded shadow-sm mb-6">
    <h2 className="font-semibold mb-2">Admin Announcement</h2>
    <textarea
      value={announcement}
      onChange={(e) => setAnnouncement(e.target.value)}
      className="w-full border rounded p-2 mb-2"
      placeholder="Write a message for the team..."
    />
  <button
  onClick={sendAnnouncement}
  disabled={!user || !announcement.trim()}
  className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
>
  Send
</button>

  </div>
)}

{announcements.length > 0 && (
  <div className="bg-white p-4 rounded shadow-sm mb-6">
    <h2 className="font-semibold mb-3">📢 Team Announcements</h2>

    <ul className="space-y-3">
      {announcements.map((a) => {
        const isRead = a.readBy?.[user?.uid];

        return (
          <li
            key={a.id}
            onMouseEnter={() => markAsRead(a.id)}
            className={`border rounded p-3 text-sm cursor-pointer
              ${isRead ? "bg-white" : "bg-blue-50"}`}
          >
            <div className="flex justify-between items-start">
              <p className="text-slate-800">{a.text}</p>

              {amAdmin && (
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-500 flex justify-between">
              <span>
                {a.createdAt?.toDate
                  ? a.createdAt.toDate().toLocaleString()
                  : ""}
              </span>

              <span>
                {Object.keys(a.readBy || {}).length} read
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  </div>
)}


      <div className="bg-white p-4 rounded shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Members ({members.length})</h2>
        </div>

        <ul className="space-y-3">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center justify-between border rounded p-3">
            
  <div>
  <div className="font-medium text-slate-800">
    {m.profile?.username || "Anonymous"}
  </div>
  <div className="text-sm text-slate-600">
    {m.profile?.gender || "—"} • {m.profile?.age || "—"} yrs
  </div>
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
