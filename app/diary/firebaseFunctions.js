// diary/firebaseFunctions.js
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "src/lib/firebase";

/**
 * dateId should be in YYYY-MM-DD format.
 * userId is the auth.currentUser.uid from the client.
 * entryData must include { date: dateId, mood: string, text: string }
 */

export const saveJournalEntry = async (userId, dateId, entryData) => {
  if (!userId) throw new Error("No userId provided");
  if (!dateId) throw new Error("No dateId provided");
  if (!entryData?.mood || typeof entryData.mood !== "string") {
    throw new Error("Missing or invalid mood");
  }
  if (!entryData?.date || entryData.date !== dateId) {
    throw new Error("Entry date must match document id");
  }

  try {
    const ref = doc(db, "users", userId, "journals", dateId);
    await setDoc(ref, entryData, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving entry:", error);
    throw error;
  }
};

export const getJournalEntry = async (userId, dateId) => {
  if (!userId) return null;
  try {
    const ref = doc(db, "users", userId, "journals", dateId);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (error) {
    console.error("Error fetching entry:", error);
    throw error;
  }
};

export const deleteJournalEntry = async (userId, dateId) => {
  if (!userId) throw new Error("No userId provided");
  try {
    const ref = doc(db, "users", userId, "journals", dateId);
    await deleteDoc(ref);
    return { success: true };
  } catch (error) {
    console.error("Error deleting entry:", error);
    throw error;
  }
};
