"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const { resendVerification, refreshCurrentUser } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    setStatus("");

    try {
      await resendVerification();
      setStatus("Verification email sent again! Check your inbox.");
    } catch (err) {
      setStatus("Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerified = async () => {
    setLoading(true);
    setStatus("");

    const verified = await refreshCurrentUser();

    if (verified) {
      router.replace("/setup");
    } else {
      setStatus("Not verified yet. Please check email again.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT: Image / Illustration (hidden on small screens) */}
      <aside
        aria-hidden="true"
        className="hidden md:block md:w-1/2 relative overflow-hidden"
        style={{
          backgroundImage: "url('/images/verify-side.png')",
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

      {/* RIGHT: Verification Card */}
      <section className="w-full md:w-1/2 flex items-center justify-center px-6 py-10">
        {/* Card container: fixed min-height so children can be evenly spaced */}
        <div className="max-w-md w-11/13 min-h-[400px] p-6 rounded-xl shadow-2xl border border-gray/90 dark:border-gray-800/50 bg-white/95 dark:bg-gray-900/70 text-black dark:text-gray-100 backdrop-blur-xl
                        flex flex-col justify-between items-center">
          {/* Top: Title */}
          <header className="w-full flex flex-col items-center">
            <h1 className="text-2xl font-bold text-center mb-2">Verify Your Email 📧</h1>
            <p className="text-center text-gray-700 dark:text-gray-300">
              We’ve sent a verification link to your email.
              <br />
              Please verify your account before continuing.
            </p>
          </header>

          {/* Middle: status message */}
          

          {/* Bottom: actions (buttons) */}
          <div className="w-full flex flex-col items-center gap-3">
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              Resend Verification Email
            </button>

            <button
              onClick={handleCheckVerified}
              disabled={loading}
              className="w-full bg-green-600 text-white mb-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              I Have Verified My Email ✔
            </button>
<div className="w-full flex items-center justify-center">
            {status ? (
              <p className="text-center text-sm text-blue-600 dark:text-blue-400">{status}</p>
            ) : (
              <p className="text-center mr-6 ml-6 text-grey-700">If you don't see the email, check your spam folder.<br></br> If still not recieved, click on resend link.<br></br></p> 
            )}
          </div>
            <button
              onClick={() => router.push("/")}
              className="w-full text-right mt-3 underline text-gray-600 dark:text-gray-300"
            >
              🏠Go Home
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
