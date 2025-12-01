"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

// STATIC imports = reliable
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function SetupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (!user) router.replace("/auth/login");
      else if (!user.emailVerified) router.replace("/auth/verify");
    }
  }, [user, loading, router]);

  const validateUsername = (u) => {
    if (!u) return "Username is required.";
    if (u.length < 3) return "Username must be at least 3 characters.";
    if (u.length > 30) return "Username must be at most 30 characters.";
    if (!/^[a-zA-Z0-9_-]+$/.test(u))
      return "Username may only contain letters, numbers, _ and -.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    const usernameError = validateUsername(username);
    const numericAge = Number(age);

    if (usernameError) return setMessage(usernameError);
    if (!gender) return setMessage("Please select your gender.");
    if (!age || Number.isNaN(numericAge))
      return setMessage("Please enter a valid age.");
    if (numericAge < 10 || numericAge > 120)
      return setMessage("Age must be between 10 and 120.");
    if (!user) return setMessage("User not available. Please login again.");

    setBusy(true);

    try {
      if (!db) throw new Error("db-not-ready");

      const writePromise = setDoc(
        doc(db, "users", user.uid),
        {
          username: username.trim(),
          gender,
          age: numericAge,
          email: user.email,
        },
        { merge: true }
      );

      // 10-sec timeout to avoid infinite "Saving…"
      await Promise.race([
        writePromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 10000)
        ),
      ]);

      await getDoc(doc(db, "users", user.uid));

      router.push("/dashboard-choice");
    } catch (err) {
      console.error("[SETUP SAVE ERROR]", err);

      if (err.message === "timeout")
        setMessage(
          "Saving took too long. Firestore may be blocked by antivirus or network."
        );
      else if (err.message === "db-not-ready")
        setMessage("Firestore not ready. Try refreshing the page.");
      else setMessage("Something went wrong while saving your profile.");
    } finally {
      setBusy(false);
    }
  };

  if (loading || !user) {
    return (
      <main className="w-screen h-screen flex items-center justify-center">
        <div>Loading…</div>
      </main>
    );
  }

  return (
    <main className="relative w-screen min-h-screen flex justify-center items-center px-6 sm:px-12 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 w-full max-w-6xl">
        <div className="hidden lg:flex justify-center w-full h-full">
          <div className="loading">
            <div className="loading-wide">
              <div className="l1 color"></div>
              <div className="l2 color"></div>
              <div className="e1 color animation-effect-light"></div>
              <div className="e2 color animation-effect-light-d"></div>
              <div className="e3 animation-effect-rot">X</div>
              <div className="e4 color animation-effect-light"></div>
              <div className="e5 color animation-effect-light-d"></div>
              <div className="e6 animation-effect-scale">*</div>
              <div className="e7 color"></div>
              <div className="e8 color"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-2xl bg-white border border-white/10 shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2 text-blue-900">
              Complete Your Setup
            </h1>
            <p className="text-gray-700 mb-6 text-sm">
              Tell us about yourself so we can personalize your experience.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-gray-600 font-medium mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className="w-full rounded-lg border border-gray-700 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8A58CE]"
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-gray-600 font-medium mb-2">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8A58CE]"
                  required
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Age */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Age
                </label>
                <input
                  type="number"
                  min="10"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Enter your age"
                  className="w-full rounded-lg border border-gray-700 text-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8A58CE]"
                  required
                />
              </div>

              {message && <p className="text-sm text-yellow-700">{message}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-blue-900 text-white font-semibold px-4 py-2 shadow-lg"
              >
                {busy ? "Saving…" : "Continue"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
