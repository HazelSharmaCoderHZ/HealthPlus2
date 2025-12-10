// src/lib/teams.ts
import { getDb } from "@/lib/firebase";
import {
  collection,
  collectionGroup,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  where,
  query,
  orderBy,
  runTransaction,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export type Team = {
  id: string;
  name: string;
  createdBy: string;
  inviteCode: string;
  createdAt?: any;
};

export type TeamMembership = {
  id?: string;
  userId: string;
  teamId: string;
  role: "admin" | "member";
  status: "pending" | "approved";
  createdAt?: any;
  approvedAt?: any;
};

const TEAMS_COLLECTION = "teams";
const MEMBERS_SUBCOLLECTION = "members";

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Create team + create approved admin member (batched).
 */
export async function createTeam(params: { name: string; createdBy: string }) {
  const db = getDb();
  const { name, createdBy } = params;
  if (!name || !name.trim()) throw new Error("Team name is required");
  if (!createdBy) throw new Error("createdBy is required");

  const teamRef = doc(collection(db, TEAMS_COLLECTION));
  const memberRef = doc(db, TEAMS_COLLECTION, teamRef.id, MEMBERS_SUBCOLLECTION, createdBy);

  const batch = writeBatch(db);
  batch.set(teamRef, {
    name: name.trim(),
    createdBy,
    inviteCode: generateInviteCode(),
    createdAt: serverTimestamp(),
  });

  batch.set(memberRef, {
    userId: createdBy,
    teamId: teamRef.id,
    role: "admin",
    status: "approved",
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp(),
  });

  await batch.commit();

  return { id: teamRef.id, inviteCode: (await getDoc(teamRef)).data()?.inviteCode };
}

/**
 * Get teams where user has membership.
 */
export async function getUserTeams(userId: string) {
  const db = getDb();
  const q = query(collectionGroup(db, MEMBERS_SUBCOLLECTION), where("userId", "==", userId));
  const snap = await getDocs(q);

  const results: { team: Team; membership: TeamMembership }[] = [];
  const promises: Promise<void>[] = [];

  snap.forEach((s) => {
    const membership = { id: s.id, ...(s.data() as TeamMembership) };
    // team doc is parent of members collection
    const membersCol = s.ref.parent; // collection ref to members
    const teamRef = membersCol.parent;
    if (!teamRef) return;
    const p = (async () => {
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) return;
      results.push({
        team: { id: teamSnap.id, ...(teamSnap.data() as Omit<Team, "id">) } as Team,
        membership,
      });
    })();
    promises.push(p);
  });

  await Promise.all(promises);
  return results;
}

/**
 * Get a single team by id
 */
export async function getTeam(teamId: string) {
  if (!teamId) throw new Error("teamId is required");
  const db = getDb();
  const snap = await getDoc(doc(db, TEAMS_COLLECTION, teamId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Team, "id">) } as Team;
}

/**
 * Request to join team.
 * Uses runTransaction to avoid race conditions.
 */
export async function requestToJoinTeam(params: { teamId: string; userId?: string }) {
  const db = getDb();
  const auth = getAuth();
  const currentUid = auth?.currentUser?.uid;
  const userId = params.userId ?? currentUid;
  if (!userId) throw new Error("No user id provided and no authenticated user found.");

  const memberRef = doc(db, TEAMS_COLLECTION, params.teamId, MEMBERS_SUBCOLLECTION, userId);
  const teamRef = doc(db, TEAMS_COLLECTION, params.teamId);

  await runTransaction(db, async (tx) => {
    const teamSnap = await tx.get(teamRef);
    if (!teamSnap.exists()) throw new Error("Team does not exist.");

    const existing = await tx.get(memberRef);
    if (existing.exists()) {
      const data = existing.data() as TeamMembership;
      if (data.status === "approved") throw new Error("You are already a member of this team.");
      if (data.status === "pending") throw new Error("Join request already pending.");
      throw new Error("Existing membership found for this user.");
    }

    tx.set(memberRef, {
      userId,
      teamId: params.teamId,
      role: "member",
      status: "pending",
      createdAt: serverTimestamp(),
    });
  });

  return { id: memberRef.id };
}

/**
 * Approve a member (admin action)
 */
export async function approveMember(params: { teamId: string; userId: string }) {
  const db = getDb();
  const memberRef = doc(db, TEAMS_COLLECTION, params.teamId, MEMBERS_SUBCOLLECTION, params.userId);
  const snap = await getDoc(memberRef);
  if (!snap.exists()) throw new Error("Membership not found");
  await updateDoc(memberRef, { status: "approved", approvedAt: serverTimestamp() });
}

/**
 * Remove member (admin or self)
 */
export async function removeMember(params: { teamId: string; userId: string }) {
  const db = getDb();
  await deleteDoc(doc(db, TEAMS_COLLECTION, params.teamId, MEMBERS_SUBCOLLECTION, params.userId));
}

/**
 * Get all members of a team (ordered by createdAt)
 */
export async function getTeamMembers(teamId: string) {
  if (!teamId) throw new Error("teamId is required");
  const db = getDb();
  const col = collection(db, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION);
  const q = query(col, orderBy("createdAt", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as TeamMembership) })) as TeamMembership[];
}

/**
 * Find team by invite code
 */
export async function findTeamByInviteCode(code: string) {
  if (!code) throw new Error("invite code is required");
  const db = getDb();
  const q = query(collection(db, TEAMS_COLLECTION), where("inviteCode", "==", code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...(docSnap.data() as Omit<Team, "id">) } as Team;
}
