import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || "";
    });
    return obj;
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const cuisine = (searchParams.get("cuisine") || "").toLowerCase().trim();
    const course = (searchParams.get("course") || "").toLowerCase().trim();
    const diet = (searchParams.get("diet") || "").toLowerCase().trim();

    const filePath = path.join(process.cwd(), "data", "recipes.csv");
    const fileText = await fs.readFile(filePath, "utf-8");
    const recipes = parseCSV(fileText);

    const filtered = recipes.filter((r) => {
      const matchesQuery = q
        ? r.name?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.ingredients_name?.toLowerCase().includes(q)
        : true;

      const matchesCuisine = cuisine
        ? r.cuisine?.toLowerCase().includes(cuisine)
        : true;

      const matchesCourse = course
        ? r.course?.toLowerCase().includes(course)
        : true;

      const matchesDiet = diet
        ? r.diet?.toLowerCase().includes(diet)
        : true;

      return matchesQuery && matchesCuisine && matchesCourse && matchesDiet;
    });

    if (filtered.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(filtered, { status: 200 });
  } catch (err) {
    console.error("API Error in /api/recipes:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}