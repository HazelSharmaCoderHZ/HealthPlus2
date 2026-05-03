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

  // EMAIL SIGNUP logic
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    try {
      await signUpEmail(email, password);
      router.replace("/auth/verify");
    } catch (error: any) {
      setErr(error?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  // GOOGLE SIGNIN logic
  const handleGoogle = async () => {
    setBusy(true);
    setErr(null);

    try {
      await signInWithGoogle();
      router.replace("/setup"); 
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 relative overflow-hidden">

  {/* 🔵 BACKGROUND BLOBS */}
  <div className="absolute w-[420px] h-[420px] bg-blue-200/30 rounded-full blur-3xl top-[-120px] left-[-120px]" />
  <div className="absolute w-[320px] h-[320px] bg-indigo-300/20 rounded-full blur-3xl bottom-[-100px] right-[-100px]" />

  

  {/* 🧊 CARD */}
  <div className="relative z-10 w-full max-w-md px-8 py-10 rounded-3xl backdrop-blur-2xl bg-white/70 border border-blue-100 shadow-[0_20px_60px_rgba(37,99,235,0.15)] flex flex-col gap-6">

    {/* 🏷️ BRAND */}
    <header className="text-center">
      <h1 className="text-4xl font-extrabold tracking-tight">
        ❤️ Health<span className="text-blue-600">Plus</span>
      </h1>
      <p className="text-gray-600 mt-2 text-sm">
        Start your journey today 🚀
      </p>
    </header>

    {/* 🌟 SUBTEXT */}
    <div className="text-center text-sm text-gray-500">
      Create your account and take control of your health
    </div>

    {/* 📩 FORM */}
    <form onSubmit={handleSignup} className="flex flex-col gap-4">

      <input
        className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
        placeholder="Email address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div className="relative">
        <input
          className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-16 bg-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
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
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-blue-600 hover:text-blue-400"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>

      {err && (
        <p className="text-sm text-red-500 text-center">{err}</p>
      )}

      <button
        disabled={busy}
        type="submit"
        className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
      >
        {busy ? "Creating your account..." : "Create Account"}
      </button>
    </form>

    {/* 🔘 DIVIDER */}
    <div className="flex items-center">
      <div className="flex-grow border-t border-gray-300"></div>
      <span className="mx-4 text-gray-400 text-xs uppercase tracking-wider">
        or
      </span>
      <div className="flex-grow border-t border-gray-300"></div>
    </div>

    {/* 🔗 GOOGLE */}
    <button
      onClick={handleGoogle}
      disabled={busy}
      className="w-full rounded-xl px-4 py-3 border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow-md disabled:opacity-50"
      type="button"
    >
      <img
        src="https://img.icons8.com/?size=100&id=V5cGWnc9R4xj&format=png&color=000000"
        alt="Google"
        className="w-5 h-5"
      />
      Continue with Google
    </button>

    {/* 🔻 FOOTER */}
    <footer className="text-center">
      <p className="text-gray-600 text-sm">
        Already have an account?{" "}
        <a
          className="underline font-semibold text-blue-600 hover:text-blue-500"
          href="/auth/login"
        >
          Log in
        </a>
      </p>

      <button
        onClick={() => router.push("/")}
        className="mt-4 text-sm text-gray-500 hover:text-gray-800 transition"
      >
        ⬅️ Back to Home
      </button>
    </footer>

  </div>
</main>
  );
}