"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { signInEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) setShowLoader(false);
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  // EMAIL / PASSWORD login logic
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signInEmail(email, password);
      router.replace("/dashboard-choice");
    } catch (error: any) {
      setErr(error?.message ?? "Login failed");
    } finally {
      setBusy(false);
    }
  };

  // GOOGLE login logic
  const handleGoogle = async () => {
    setBusy(true);
    setErr(null);
    try {
      await signInWithGoogle();
      router.replace("/dashboard-choice");
    } catch (error: any) {
      setErr(error?.message ?? "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  if (showLoader) {
    return (
      <div className="flex fixed inset-0 items-center justify-center w-screen h-screen bg-white">
        <div className="loader-container">
          <div className="loader">
            <span className="item"></span>
            <span className="item"></span>
            <span className="item"></span>
            <span className="item"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      <aside
        aria-hidden="true"
        className="hidden md:block md:w-1/2 relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/log.png')", 
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        
        <svg
          className="absolute right-0 top-0 h-full w-40 translate-x-1/3"
          viewBox="0 0 200 800"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C80,150 80,650 200,800 L200,0 Z"
            fill="rgba(255,255,255,0.06)"
          />
        </svg>
      </aside>

      {/* RIGHT: Login Form Section */}
      <section className="w-full md:w-1/2 flex items-center justify-center px-6 py-10 dark:bg-gray-950">
        <div className="max-w-md w-full p-8 rounded-2xl shadow-2xl border border-blue-500 dark:border-gray-800/50 bg-white/95 dark:bg-gray-900/70 backdrop-blur-xl flex flex-col gap-6">
          
          <header className="w-full text-center">
            <h1 className="text-3xl font-bold mb-2">
              Health<span className="text-indigo-600">Plus</span>
            </h1>
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Welcome Back!</h3>
          </header>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <input
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative w-full">
              <input
                className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-4 py-3 pr-16 text-gray-800 dark:text-gray-100 bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-indigo-600 hover:text-indigo-400"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {err && <p className="text-sm text-red-500 text-center">{err}</p>}

            <button
              disabled={busy}
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 transition shadow-lg disabled:opacity-50"
            >
              {busy ? "Please wait..." : "Login"}
            </button>
          </form>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          </div>

          <button
            onClick={handleGoogle}
            disabled={busy}
            className="w-full rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-750 transition flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            type="button"
          >
            <img src="https://img.icons8.com/?size=100&id=V5cGWnc9R4xj&format=png&color=000000" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <footer className="mt-2 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Don’t have an account?{" "}
              <a className="underline font-semibold text-indigo-600 hover:text-indigo-500" href="/auth/signup">
                Sign up
              </a>
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-5 text-sm flex items-center justify-center w-full gap-1 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition"
            >
              ⬅️Go Home
            </button>
          </footer>
        </div>
      </section>

     
      
    </main>
  );
}