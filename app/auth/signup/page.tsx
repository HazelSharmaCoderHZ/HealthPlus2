"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const { signUpEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    try {
      await signUpEmail(email, password);
      // redirect to email verification screen
      router.replace("/auth/verify");
    } catch (error: any) {
      setErr(error?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    setErr(null);

    try {
      await signInWithGoogle();
      router.replace("/setup"); // Google users usually auto-verified
    } catch (error: any) {
      if (error?.message === "email-not-verified") {
        router.replace("/auth/verify");
      } else {
        setErr(error?.message ?? "Google sign-in failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="w-screen h-screen flex justify-center items-center px-4">
      <div className="w-full max-w-md border border-blue-900 rounded-2xl shadow-2xl backdrop-blur-md p-8">

        <h1 className="text-4xl text-center mb-2 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-blue-900">
          HealthPlus 🍃
        </h1>
        <h3 className="text-lg text-center text-blue-800 mb-8 tracking-wide">
          New User? Create Account
        </h3>

        <form onSubmit={handleSignup} className="flex flex-col gap-5">
          <input
            className="w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-100 px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative w-full">
            <input
              className="w-full rounded-xl border border-gray-700 bg-gray-800 text-gray-100 px-4 py-3 pr-14 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Password (min 6 chars)"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-indigo-400 hover:text-indigo-300 transition"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {err && <p className="text-sm text-red-400">{err}</p>}

          <div className="mt-4 flex justify-center">
            <button
              onClick={handleGoogle}
              disabled={busy}
              className="rounded-xl px-4 py-2 border border-gray-300 bg-white text-gray-800 hover:opacity-90 disabled:opacity-50"
              type="button"
            >
              Continue with Google
            </button>
          </div>

          <button
            disabled={busy}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold px-4 py-3 shadow-lg hover:opacity-90 transition disabled:opacity-50"
            type="submit"
          >
            {busy ? "Please wait..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm text-gray-400 gap-3 sm:gap-0">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="underline underline-offset-2 text-indigo-400 hover:text-indigo-300 transition"
          >
            👈 Go Back
          </button>

          <p className="text-center text-black sm:text-right">
            Already have an account?{" "}
            <a
              className="underline underline-offset-2 text-indigo-400 hover:text-indigo-300 transition"
              href="/auth/login"
            >
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
