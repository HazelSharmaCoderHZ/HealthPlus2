"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import TopMenuButton from "../../components/TopMenuButton";

export default function RecipesPage() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [filters, setFilters] = useState({ cuisine: "", course: "", diet: "" });
  const router = useRouter();

  const fetchRecipes = async () => {
    if (!query && !filters.cuisine && !filters.course && !filters.diet) return;

    setError("");
    setRecipes([]);
    setLoading(true);

    try {
      const params = new URLSearchParams({
        q: query,
        cuisine: filters.cuisine,
        course: filters.course,
        diet: filters.diet,
      });

      const res = await fetch(`/api/recipes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch recipes");

      const data = await res.json();
      if (!data || data.length === 0) {
        setError("❌ No recipes found. Try another search.");
      } else {
        setRecipes(data);
      }
    } catch (err) {
      setError("⚠️ Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchRecipes();
    }
  };

  return (
    // no bg class → uses default white background
    <main className="min-h-screen flex flex-col">
      <TopMenuButton />

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-10 pt-24 md:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-3xl font-bold tracking-tight text-blue-700 sm:text-4xl"
          >
            
            <span>Explore Recipes</span>
          </motion.h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Search by dish name and refine with cuisine, course, and diet.
          </p>
        </header>

        {/* Search & Filters Card */}
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          {/* Search bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a dish (e.g., pasta, biryani, salad)"
                className="w-full rounded-xl border border-slate-300 bg-white px-10 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={fetchRecipes}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </motion.button>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
            <div className="flex min-w-[160px] flex-1 items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Cuisine
              </span>
              <select
                value={filters.cuisine}
                onChange={(e) =>
                  setFilters({ ...filters, cuisine: e.target.value })
                }
                className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              >
                <option value="">All Cuisines</option>
                <option value="Indian">Indian</option>
                <option value="Italian Recipes">Italian Recipes</option>
                <option value="Chinese">Chinese</option>
                <option value="Fusion">Fusion</option>
                <option value="Continental">Continental</option>
              </select>
            </div>

            <div className="flex min-w-[160px] flex-1 items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Course
              </span>
              <select
                value={filters.course}
                onChange={(e) =>
                  setFilters({ ...filters, course: e.target.value })
                }
                className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              >
                <option value="">All Courses</option>
                <option value="Starter">Starter</option>
                <option value="Main">Main</option>
                <option value="Dessert">Dessert</option>
                <option value="Lunch">Lunch</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Dinner">Dinner</option>
                <option value="Side dish">Side dish</option>
              </select>
            </div>

            <div className="flex min-w-[160px] flex-1 items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Diet
              </span>
              <select
                value={filters.diet}
                onChange={(e) =>
                  setFilters({ ...filters, diet: e.target.value })
                }
                className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 outline-none ring-0 focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
              >
                <option value="">All Diets</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Non Vegeterian">Non Vegetarian</option>
              </select>
            </div>
          </div>
        </motion.section>

        {/* Error & helper text */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </motion.div>
        )}

        {!loading && !error && recipes.length === 0 && !query && (
          <p className="mb-4 text-center text-sm text-slate-500">
            Start by entering a dish name above or use filters to discover recipes.
          </p>
        )}

        {/* Results */}
        <section className="flex-1">
          <AnimatePresence>
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-10"
              >
                <div className="flex flex-col items-center gap-3">
                  <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  <p className="text-sm text-slate-600">
                    Fetching recipes for you...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!loading && recipes.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">
              {recipes.map((meal, idx) => (
                <motion.article
                  key={idx}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Title & meta */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {meal.name}
                      </h2>
                      <div className="mt-1 flex flex-wrap gap-2 text-[11px]">
                        {meal.cuisine && (
                          <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 font-medium text-blue-700">
                            {meal.cuisine}
                          </span>
                        )}
                        {meal.course && (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 font-medium text-slate-700">
                            {meal.course}
                          </span>
                        )}
                        {meal.diet && (
                          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                            {meal.diet}
                          </span>
                        )}
                      </div>
                    </div>
                    
                  </div>

                  {/* Brief meta */}
                  <div className="mb-3 space-y-1 text-xs text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-800">
                        Cuisine:
                      </span>{" "}
                      {meal.cuisine || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">
                        Course:
                      </span>{" "}
                      {meal.course || "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-800">
                        Diet:
                      </span>{" "}
                      {meal.diet || "N/A"}
                    </p>
                  </div>

                  {/* Toggle button */}
                  <button
                    onClick={() =>
                      setExpanded((prev) => ({
                        ...prev,
                        [idx]: !prev[idx],
                      }))
                    }
                    className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-800 transition hover:border-blue-400 hover:text-blue-700"
                  >
                    {expanded[idx] ? "Hide details ▲" : "Show more ▼"}
                  </button>

                  {/* Expanded content */}
                  <AnimatePresence initial={false}>
                    {expanded[idx] && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-800"
                      >
                        {/* Ingredients */}
                        <div className="mb-3">
                          <h3 className="mb-1 font-semibold">
                            🛒 Ingredients
                          </h3>
                          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
                            {meal.ingredients_name
                              ?.split(",")
                              .map((ing, i) => (
                                <li key={i}>
                                  {ing.trim()}{" "}
                                  {meal.ingredients_quantity?.split(",")[i]
                                    ? `- ${
                                        meal.ingredients_quantity.split(",")[i]
                                      }`
                                    : ""}
                                </li>
                              ))}
                          </ul>
                        </div>

                        {/* Instructions */}
                        {meal.instructions && (
                          <div className="mb-3">
                            <h3 className="mb-1 font-semibold">
                              👩‍🍳 Instructions
                            </h3>
                            <p className="whitespace-pre-line text-[11px] leading-relaxed text-slate-700">
                              {meal.instructions}
                            </p>
                          </div>
                        )}

                        
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        {/* Back Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center rounded-full border border-blue-500 bg-white px-5 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:bg-blue-50"
          >
            ⬅ Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
