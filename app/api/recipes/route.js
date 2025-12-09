import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc } from "firebase/firestore";

// optional: same helper as client, kept in case you need normalization
function getLocalDateKey(dateStr) {
  // we assume frontend already sends YYYY-MM-DD
  return dateStr;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get("uid");
    const dateParam = searchParams.get("date");

    if (!uid || !dateParam) {
      return NextResponse.json(
        { error: "Missing uid or date" },
        { status: 400 }
      );
    }

    if (!db) {
      console.error("Firestore db is undefined in /api/nut");
      return NextResponse.json(
        { error: "Firestore not initialized" },
        { status: 500 }
      );
    }

    const dateKey = getLocalDateKey(dateParam);

    // ✅ EXACT PATH: nutritionLogs/{uid}/{dateKey}/{logId}
    const userDocRef = doc(db, "nutritionLogs", uid); // DocumentReference
    const dayRef = collection(userDocRef, dateKey);   // ✅ collection(DocumentRef, subcollectionName)

    const snapshot = await getDocs(dayRef);

    if (snapshot.empty) {
      // calendar expects null when no entries
      return NextResponse.json(null, { status: 200 });
    }

    const summary = {
      calories: 0,
      protein_g: 0,
      carbohydrates_total_g: 0,
      fat_total_g: 0,
      sugar_g: 0,
      cholesterol_mg: 0,
      sodium_mg: 0,
      potassium_mg: 0,
    };

    snapshot.forEach((docSnap) => {
      const d = docSnap.data();

      summary.calories += d.calories || 0;
      summary.protein_g += d.protein_g || 0;
      summary.carbohydrates_total_g += d.carbohydrates_total_g || 0;
      summary.fat_total_g += d.fat_total_g || 0;
      summary.sugar_g += d.sugar_g || 0;
      summary.cholesterol_mg += d.cholesterol_mg || 0;
      summary.sodium_mg += d.sodium_mg || 0;
      summary.potassium_mg += d.potassium_mg || 0;
    });

    // round a bit for cleaner display
    Object.keys(summary).forEach((k) => {
      summary[k] = Number(summary[k].toFixed(2));
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (err) {
    console.error("API Error in /api/nut:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
