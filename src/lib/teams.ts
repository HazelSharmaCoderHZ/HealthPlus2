// src/lib/teams.ts
import { db } from "@/lib/firebase";
import {
  collection,
  collectionGroup,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  orderBy,
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
 * Create a new team and make the creator an approved admin member (batched).
 */
export async function createTeam(params: { name: string; createdBy: string }) {
  const { name, createdBy } = params;
  if (!createdBy) throw new Error("createdBy (user id) is required");
  if (!name || !name.trim()) throw new Error("Team name is required");

  const inviteCode = generateInviteCode();

  // create team doc ref (client generates id)
  const teamColRef = collection(db, TEAMS_COLLECTION);
  const teamRef = doc(teamColRef); // new doc ref with generated id
  const memberRef = doc(db, TEAMS_COLLECTION, teamRef.id, MEMBERS_SUBCOLLECTION, createdBy);

  const batch = writeBatch(db);

  batch.set(teamRef, {
    name: name.trim(),
    createdBy,
    inviteCode,
    createdAt: serverTimestamp(),
  });

  batch.set(memberRef, {
    userId: createdBy,
    teamId: teamRef.id,
    role: "admin",
    status: "approved",
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (err) {
    console.error("createTeam batch commit failed:", err);
    throw new Error(err?.message ?? "Failed to create team (batch commit).");
  }

  return {
    id: teamRef.id,
    inviteCode,
  };
}

/**
 * Get all teams for a user (admin or member).
 * Returns: [{ team, membership }]
 */
export async function getUserTeams(userId: string) {
  if (!userId) throw new Error("userId is required");

  const membershipsQ = query(
    collectionGroup(db, MEMBERS_SUBCOLLECTION),
    where("userId", "==", userId)
  );

  const membershipsSnap = await getDocs(membershipsQ);

  const results: { team: Team; membership: TeamMembership }[] = [];
  const promises: Promise<void>[] = [];

  membershipsSnap.forEach((docSnap) => {
    const membership = {
      id: docSnap.id,
      ...(docSnap.data() as TeamMembership),
    };

    const membersColRef = docSnap.ref.parent;
    const teamDocRef = membersColRef.parent;

    if (!teamDocRef) return;

    const p = (async () => {
      const teamSnap = await getDoc(teamDocRef);
      if (!teamSnap.exists()) return;

      const team = {
        id: teamSnap.id,
        ...(teamSnap.data() as Omit<Team, "id">),
      };

      results.push({ team, membership });
    })();

    promises.push(p);
  });

  await Promise.all(promises);
  return results;
}

/**
 * Get a single team by id.
 */
export async function getTeam(teamId: string) {
  if (!teamId) throw new Error("teamId is required");

  const teamRef = doc(db, TEAMS_COLLECTION, teamId);
  const snap = await getDoc(teamRef);
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<Team, "id">),
  };
}

/**
 * Request to join a team (creates member+pending).
 */
export async function requestToJoinTeam(params: {
  userId?: string;
  teamId: string;
}) {
  const { userId: providedUserId, teamId } = params;
  if (!teamId) throw new Error("teamId is required");

  // if caller did not provide userId, try to use current auth user (safer)
  const auth = getAuth();
  const currentUid = auth?.currentUser?.uid;

  const userId = providedUserId ?? currentUid;
  if (!userId) {
    throw new Error(
      "No user id provided and no authenticated user found. Make sure the call is done client-side after login."
    );
  }

  const memberRef = doc(
    db,
    TEAMS_COLLECTION,
    teamId,
    MEMBERS_SUBCOLLECTION,
    userId
  );

  const existing = await getDoc(memberRef);
  if (existing.exists()) {
    const data = existing.data() as TeamMembership;
    if (data.status === "approved") {
      throw new Error("You are already a member of this team.");
    } else if (data.status === "pending") {
      throw new Error("Join request already pending for this team.");
    } else {
      throw new Error("Existing membership found for this user.");
    }
  }

  await setDoc(memberRef, {
    userId,
    teamId,
    role: "member",
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return { id: memberRef.id };
}

export async function approveMember(params: { teamId: string; userId: string }) {
  const { teamId, userId } = params;
  if (!teamId || !userId) {
    throw new Error("teamId and userId are required");
  }

  const memberRef = doc(
    db,
    TEAMS_COLLECTION,
    teamId,
    MEMBERS_SUBCOLLECTION,
    userId
  );

  await updateDoc(memberRef, {
    status: "approved",
    approvedAt: serverTimestamp(),
  });
}

export async function removeMember(params: { teamId: string; userId: string }) {
  const { teamId, userId } = params;
  if (!teamId || !userId) {
    throw new Error("teamId and userId are required");
  }

  const memberRef = doc(
    db,
    TEAMS_COLLECTION,
    teamId,
    MEMBERS_SUBCOLLECTION,
    userId
  );

  await deleteDoc(memberRef);
}

/**
 * Get all members of a given team.
 */
export async function getTeamMembers(teamId: string) {
  if (!teamId) throw new Error("teamId is required");

  const membersCol = collection(db, TEAMS_COLLECTION, teamId, MEMBERS_SUBCOLLECTION);

  // try to order by createdAt if present so lists are stable
  const snap = await getDocs(membersCol /* optional: query(membersCol, orderBy("createdAt", "asc")) */);
  const members: TeamMembership[] = [];

  snap.forEach((docSnap) => {
    members.push({
      id: docSnap.id,
      ...(docSnap.data() as TeamMembership),
    });
  });

  return members;
}

export async function findTeamByInviteCode(code: string) {
  if (!code) throw new Error("Invite code is required");

  const q = query(collection(db, TEAMS_COLLECTION), where("inviteCode", "==", code));

  const snap = await getDocs(q);
  if (snap.empty) return null;

  const docSnap = snap.docs[0];
  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<Team, "id">),
  };
}
