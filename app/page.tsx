'use client';
import Link from "next/link";
import { useEffect } from "react";

export default function Navbar() {
  // Custom cursor ball
  useEffect(() => {
    const cursor = document.getElementById("cursor-ball");

    const moveCursor = (e: any) => {
      if (!cursor) return;
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  return (
    <div className="cursor-none">
      {/* Blue cursor ball */}
      <div
        id="cursor-ball"
        className="pointer-events-none fixed z-[9999] h-4 w-4 rounded-full bg-blue-500"
        style={{ left: 0, top: 0, transform: "translate(-50%, -50%)" }}
      />

      {/* Header / Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-blue-700 font-extrabold text-lg tracking-tight"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm">
              +
            </span>
            <span>HealthPlus</span>
          </Link>

          <div className="hidden sm:flex items-center gap-4">
            <a
              href="#about"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition"
              role="button"
              aria-label="About us"
            >
              About us
            </a>

            <a
              href="#services"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition"
              role="button"
              aria-label="Services"
            >
              Services
            </a>

            <a
              href="#contact"
              className="inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition"
              role="button"
              aria-label="Contact us"
            >
              Contact Us
            </a>
          </div>
        </nav>
      </header>

      {/* Hero / Main Section */}
      <main className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 via-cyan-50 to-white">
        {/* Soft background accent */}
        <div className="pointer-events-none absolute -top-40 -right-32 h-80 w-80 rounded-full bg-blue-100 blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-cyan-100 blur-3xl opacity-60" />

        <div className="flex flex-col max-w-4xl mx-auto justify-center items-center text-center px-4 pt-20">
          <h1 className="text-4xl sm:text-5xl md:text-6xl mb-4 font-bold mt-8 text-slate-900 leading-tight">
            YOUR HEALTH IS OUR <br />
            <span className="text-blue-700 font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tight">
              {"PRIORITY".split("").map((letter, i) => (
                <span
                  key={i}
                  className="inline-block transition-transform duration-200 hover:-translate-y-1"
                >
                  {letter}
                </span>
              ))}
            </span>
            .
          </h1>

          <p className="mt-4 max-w-2xl text-sm sm:text-base text-slate-600">
            HealthPlus brings families, friends, and communities together to stay
            accountable, celebrate progress, and make wellness a shared journey.
          </p>

          <Link href="/auth/signup">
            <button className="mt-8 w-full sm:w-auto min-w-[140px] mx-auto block animated-button">
              <span className="text">Get started ➡️</span>
              <span className="circle"></span>
            </button>
          </Link>
        </div>
      </main>

      {/* About Us Section */}
      <section
        id="about"
        className="min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-20 bg-white"
      >
        <div className="max-w-4xl w-full text-center">
          <h2 className="text-3xl inline-block sm:text-4xl font-bold block px-4 py-2 text-white bg-blue-600 rounded-3xl mb-4 mx-auto text-center">
            About Us
          </h2>
          <div className="mx-auto h-px w-16 bg-blue-200 mb-6" />

          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-100 bg-slate-50/60 px-6 sm:px-10 py-8 shadow-sm">
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
              At <span className="text-blue-600 font-semibold">HealthPlus</span>, we are dedicated to create a collaborative
              health and wellness platform designed to make well-being a shared
              journey. It brings families, partners, and communities together by
              sharing meaningful insights, celebrating progress, and inspiring
              collective motivation for healthier living. Together, we aim to
              make health not just a personal goal, but a united experience that
              strengthens connections and inspires lasting well-being.
            </p>
          </div>
        </div>
      </section>

      {/* Gradient Transition Between About & Services */}
      <div className="h-24 w-full bg-gradient-to-b from-white via-blue-50 to-slate-50" />

      {/* Services Section */}
      <section
        id="services"
        className="min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-20 bg-slate-50"
      >
        <div className="max-w-6xl w-full text-center">
          <h2 className="text-3xl inline-block sm:text-4xl font-bold block px-4 py-2 text-white bg-blue-600 rounded-3xl mb-4 mx-auto text-center">
            Our Services
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🥗",
                title: "Know Your Food",
                desc: "Instantly analyze the nutritional value of any food item to make informed choices for a healthier lifestyle.",
              },
              {
                icon: "📅",
                title: "Nutrition Calendar",
                desc: "Track your monthly nutrition intake and visualize your eating patterns to support holistic wellness.",
              },
              {
                icon: "👩‍🍳",
                title: "Recipes",
                desc: "Discover healthy, easy-to-cook recipes with a complete nutritional breakdown, personalized to your preferences.",
              },
              {
                icon: "💧",
                title: "Water Checker",
                desc: "Stay hydrated by monitoring your daily water intake and receiving timely reminders.",
              },
              {
                icon: "⚖️",
                title: "BMI Calculator",
                desc: "Quickly calculate your Body Mass Index and get personalized insights for your fitness journey.",
              },
              {
                icon: "😴",
                title: "Sleep Tracker",
                desc: "Monitor your sleep patterns and log daily rest data to improve sleep quality and overall well-being.",
              },
              {
                icon: "🌙",
                title: "Sleep Calendar",
                desc: "Visualize your sleep trends over time and identify opportunities to build better sleep habits.",
              },
            ].map((svc, idx) => {
              const isSpanAll = svc.title === "Sleep Calendar";
              return (
                <div
                  key={idx}
                  className={`p-6 sm:p-7 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition duration-300 hover:-translate-y-1 ${
                    isSpanAll ? "sm:col-span-2 lg:col-span-3" : ""
                  }`}
                >
                  <h3 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
                    <span className="text-xl">{svc.icon}</span>
                    <span className="text-slate-900">{svc.title}</span>
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {svc.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section
        id="contact"
        className="min-h-screen flex flex-col justify-center items-center px-6 sm:px-12 py-20 bg-white"
      >
        <div className="max-w-4xl w-full text-center">
          <h2 className="text-3xl sm:text-4xl font-bold block inline-block px-4 py-2 text-white bg-blue-600 rounded-3xl mb-4 mx-auto text-center">
            Connect with us
            <br />
          </h2>
          <h3 className="text-base sm:text-lg font-normal text-slate-600">
            We would love to hear from you.
          </h3>

          <div className="grid gap-6 sm:grid-cols-3 mt-10">
            {[
              {
                icon: "↗️",
                title: "Meet our founders",
                link: "https://www.linkedin.com/in/hazelsharma-it/",
              },
              {
                icon: "🖥️",
                title: "GitHub",
                link: "https://github.com/HazelSharmaCoderHZ",
              },
              {
                icon: "📧",
                title: "Gmail",
                link: "mailto:sharmahazel310@gmail.com",
              },
            ].map((contact, idx) => (
              <a
                key={idx}
                href={contact.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md hover:border-cyan-200 transition duration-300 hover:-translate-y-1 text-center"
              >
                <h3 className="text-lg font-semibold mb-1 flex justify-center items-center gap-2 text-slate-900">
                  <span>{contact.icon}</span>
                  <span>{contact.title}</span>
                </h3>
              </a>
            ))}
          </div>
        </div>

        {/* Footer-like bottom bar */}
        <div className="mt-16 w-full border-t border-slate-200 pt-4 text-xs sm:text-sm text-slate-500 text-center">
          <p>Join HealthPlus today!</p>
          <p>HealthPlus © 2025</p>
        </div>
      </section>
    </div>
  );
}
