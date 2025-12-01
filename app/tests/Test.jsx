"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopMenuButton from "../../components/TopMenuButton";
/**
 * Test component (updated)
 * - Blue & white theme
 * - Intro / guidelines screen
 * - Softer transitions between questions
 * - Decorative background waves
 * - Small loaders on start & submit
 *
 * Props:
 *  - test: { title: string, questions: string[], options: [{ text, score }] }
 */

export default function Test({ test }) {
  const [answers, setAnswers] = useState(Array(test.questions.length).fill(null));
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const [showIntro, setShowIntro] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (score) => {
    const updated = [...answers];
    updated[currentQuestion] = score;
    setAnswers(updated);

    // Auto-advance to next question if not last
    if (currentQuestion < test.questions.length - 1) {
      // small delay for better UX
      setTimeout(() => setCurrentQuestion((q) => q + 1), 120);
    }
  };

  const totalScore = answers.reduce((a, b) => a + (b ?? 0), 0);

  const getResult = () => {
    if (test.title.includes("PFQ-9")) {
      if (totalScore <= 4) return "Minimal depression. Keep monitoring your mood.";
      if (totalScore <= 9) return "Mild depression. Consider light lifestyle changes.";
      if (totalScore <= 14) return "Moderate depression. Seek professional advice if persistent.";
      if (totalScore <= 19) return "Moderately severe depression. Professional support recommended.";
      return "Severe depression. Consult a mental health professional immediately.";
    } else {
      if (totalScore <= 4) return "Minimal anxiety. Keep monitoring your stress.";
      if (totalScore <= 9) return "Mild anxiety. Consider relaxation techniques.";
      if (totalScore <= 14) return "Moderate anxiety. Talk to a counselor if needed.";
      return "Severe anxiety. Professional help strongly recommended.";
    }
  };

  const handleStart = async () => {
    setStarting(true);
    // small startup animation / loader
    await new Promise((res) => setTimeout(res, 600));
    setStarting(false);
    setShowIntro(false);
  };

  const handleSubmit = async () => {
    // prefer showing a brief processing indicator
    setSubmitting(true);
    await new Promise((res) => setTimeout(res, 700));
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleRetake = () => {
    setAnswers(Array(test.questions.length).fill(null));
    setCurrentQuestion(0);
    setSubmitted(false);
    setShowIntro(true);
  };

  // animation settings: subtle movement, short duration
  const questionVariants = {
    enter: { opacity: 0, x: 12 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -8 },
  };

  // styles (tailwind + small inline helpers)
  return (
    <div className="relative min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-blue-50">
      {/* Background decorative SVG waves */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <svg className="absolute left-0 top-0 opacity-8" width="800" height="300" viewBox="0 0 800 300" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 120 C150 180 350 40 800 140 L800 0 L0 0 Z" fill="#DFF6FF" opacity="0.6" />
          <path d="M0 180 C200 220 420 80 800 200 L800 0 L0 0 Z" fill="#E8F8FF" opacity="0.5" />
        </svg>
        <div className="absolute right-8 bottom-8 opacity-10 w-72 h-72 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 blur-3xl"></div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Card container */}
        <div className="rounded-2xl shadow-xl overflow-hidden bg-white/60 backdrop-blur-md border border-white/60">
          {/* Header */}
          <div className="px-6 py-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold">{test.title}</h1>
            <p className="mt-1 text-sm opacity-90">A short questionnaire, be honest and choose the option that best fits.</p>
          </div>

          <div className="p-6">
            {/* Intro / Guidelines */}
            <AnimatePresence>
              {showIntro && !starting && !submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-lg font-semibold text-blue-800 mb-3">Before you begin</h2>
                  <ul className="list-disc ml-5 space-y-2 text-gray-700 mb-4">
                    <li>There are {test.questions.length} questions. Each will auto-advance after you answer.</li>
                    <li>Answer honestly - there's no right or wrong.</li>
                    <li>The test takes less than a minute.</li>
                  </ul>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleStart}
                      className="inline-flex items-center gap-2 rounded-lg bg-white text-blue-700 px-4 py-2 font-semibold shadow hover:scale-[1.02] transition"
                      aria-label="Start test"
                    >
                      {starting ? (
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                      ) : null}
                      Start Test
                    </button>

                    <button
                      onClick={() => setShowIntro(false)}
                      className="text-sm text-gray-600 hover:underline"
                    >
                      Skip intro
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main test area */}
            <AnimatePresence mode="wait">
              {!showIntro && !submitted && (
                <motion.div
                  key={currentQuestion}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  variants={questionVariants}
                  transition={{ duration: 0.18 }}
                >
                  {/* Progress bar */}
                  <div className="w-full bg-blue-100 rounded-full h-2 mb-6">
                    <div
                      className="bg-blue-400 h-2 rounded-full transition-all"
                      style={{ width: `${((currentQuestion + 1) / test.questions.length) * 100}%` }}
                    ></div>
                  </div>

                  <p className="text-lg text-slate-800 mb-4">{currentQuestion + 1}. {test.questions[currentQuestion]}</p>

                  <div className="grid gap-3">
                    {test.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelect(opt.score)}
                        className={`text-left px-4 py-3 rounded-lg border border-blue-200 hover:bg-blue-50 transition flex items-center justify-between
                          ${answers[currentQuestion] === opt.score ? "bg-blue-200 text-slate-900 font-semibold" : "bg-white"}`}
                        aria-pressed={answers[currentQuestion] === opt.score}
                      >
                        <span>{opt.text}</span>
                        {/* small score badge */}
                        <span className="ml-3 text-sm text-blue-600 font-medium"> {opt.score} </span>
                      </button>
                    ))}
                  </div>

                  {/* Submit button shown only on last question */}
                  {currentQuestion === test.questions.length - 1 && (
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        onClick={handleSubmit}
                        disabled={answers.includes(null) || submitting}
                        className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition disabled:opacity-50"
                        aria-disabled={answers.includes(null) || submitting}
                      >
                        {submitting ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          "Submit"
                        )}
                      </button>

                      <button
                        onClick={() => {
                          // go back one question to allow change
                          setCurrentQuestion((q) => Math.max(0, q - 1));
                        }}
                        className="text-sm text-blue-700 underline"
                      >
                        Back
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result screen */}
            <AnimatePresence>
              {submitted && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="text-center py-6"
                >
                  <h2 className="text-2xl font-semibold text-blue-700">Scale: <span className="text-pink-500">{totalScore}</span></h2>
                  <p className="mt-3 text-lg text-slate-700">{getResult()}</p>

                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      onClick={handleRetake}
                      className="px-5 py-3 rounded-xl bg-white text-blue-700 font-semibold border border-blue-200 hover:scale-[1.02] transition"
                    >
                      Retake
                    </button>
                    <button
                      onClick={() => {
                        window.location.href = "/tests"; 
                      }}
                      className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );
}
