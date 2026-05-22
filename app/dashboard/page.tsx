"use client";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";
import { Apple, Dumbbell, Brain, Bot } from "lucide-react";
import TopMenuButton from "../../components/TopMenuButton";

export default function DashboardPage() {
  const [openTab, setOpenTab] = useState(null);
  const { user } = useAuth();
  const userName =
  user?.displayName?.split(" ")[0] || "there";
  // greeting
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" :
    hour < 18 ? "Good Afternoon" :
    "Good Evening";

  const categories = [
    {
      name: "Nutrition & Diet",
      icon: <Apple className="w-8 h-8" />,
      items: [
        { label: "Food Insights", href: "/calorie" },
        { label: "Nutrition Calendar", href: "/nut" },
        { label: "Recipes", href: "/recipes" },
      ],
    },
    {
      name: "Physical Wellness",
      icon: <Dumbbell className="w-8 h-8" />,
      items: [
        { label: "Water Check", href: "/water-check" },
        { label: "BMI Calculator", href: "/bmi" },
        { label: "Sleep Tracker", href: "/sleep" },
        { label: "Sleep Calendar", href: "/sleepcal" },
        {
  label: "Diabetes Predictor",
  href: "/diabetes",
  ai: true
}
      ],
    },
    {
      name: "Mind & Mood",
      icon: <Brain className="w-8 h-8" />,
      items: [
        { label: "Journaling", href: "/diary" },
        { label: "Self-Assessment Tests", href: "/tests" },
      ],
    },
  ];

  return (
    <main className="min-h-screen w-full px-6 py-16 bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden">

      {/* background glow */}
      <div className="absolute w-[400px] h-[400px] bg-blue-200/40 blur-3xl rounded-full top-[-100px] left-[-100px]" />
      <div className="absolute w-[300px] h-[300px] bg-blue-300/30 blur-3xl rounded-full bottom-[-80px] right-[-80px]" />

      {/* header */}
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900">
  {greeting}, {userName} 👋
</h1>
        <p className="text-gray-600 mt-2">
          Explore and improve every part of your health 🚀
        </p>
      </div>

      <TopMenuButton />

      {/* 🔥 FEATURED HEALTHBOT CARD */}
      <div className="flex justify-center mb-12">
        <Link
          href="/chatbot"
          className="w-full md:w-[500px] p-8 rounded-3xl text-center
          bg-gradient-to-r from-blue-600 to-blue-800 text-white
          shadow-2xl hover:scale-[1.03] transition-all duration-300"
        >
          <div className="flex justify-center mb-4">
            <Bot className="w-10 h-10" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            HealthBot AI
          </h2>
          <p className="mt-2 text-blue-100">
            Your intelligent health companion - ask anything about fitness, sleep, diet & mental wellness.
          </p>
        </Link>
      </div>

      {/* category cards */}
      <div className="flex flex-col md:flex-row gap-10 justify-center">
        {categories.map((category, i) => (
          <div
            key={i}
            onClick={() => setOpenTab(openTab === i ? null : i)}
            className="w-full md:w-80 p-8 rounded-2xl cursor-pointer backdrop-blur-xl bg-white/60 border border-blue-100 shadow-lg hover:scale-[1.05] hover:shadow-xl transition-all duration-300"
          >

            <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg">
              {category.icon}
            </div>

            <h3 className="text-2xl font-bold text-blue-800">
              {category.name}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Tap to explore
            </p>

            <div
              className={`overflow-hidden transition-all duration-500 ${
                openTab === i ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col gap-2">
                {category.items.map((item, j) => (
                  <Link
                    key={j}
                    href={item.href}
                    className="px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition"
                  >
                    <div className="flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.ai && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-blue-600 text-white ">
                          AI
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

          </div>
        ))}
      </div>

      
    </main>
  );
}