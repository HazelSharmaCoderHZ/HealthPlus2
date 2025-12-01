"use client";

import { useState, useEffect } from "react";

const moods = [
  {
    label: "Happy",
    value: "happy",
    hoverBgClass: "hover:bg-green-400/60",
    activeBgClass: "bg-green-400/60",
  },
  {
    label: "Sad",
    value: "sad",
    hoverBgClass: "hover:bg-[#C49797]",
    activeBgClass: "bg-bg-[#C49797]",
  },
  {
    label: "Calm",
    value: "calm",
    hoverBgClass: "hover:bg-blue-500/60",
    activeBgClass: "bg-blue-500/60",
  },
  {
    label: "Angry",
    value: "angry",
    hoverBgClass: "hover:bg-red-500/60",
    activeBgClass: "bg-red-500/60",
  },
];

export default function EntryForm({ entry, onSave, onDelete }) {
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");

  useEffect(() => {
    setText(entry?.text || "");
    setMood(entry?.mood || "");
  }, [entry]);

  return (
    <div className="flex flex-col gap-4">
      <textarea
        className="w-full h-40 p-4 rounded-xl bg-white/10 border border-black text-black/70 resize-none transition"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your thoughts..."
      />

      {/* Mood Picker */}
      <div className="flex gap-2 flex-wrap">
        {moods.map((m) => {
          const isActive = mood === m.value;
          return (
            <button
              key={m.value}
              onClick={() => setMood(m.value)}
              type="button"
              className={`px-4 py-2 rounded-full font-medium text-black bg-transparent transition ${m.hoverBgClass} ${
                isActive ? m.activeBgClass : ""
              }`}
              aria-pressed={isActive}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={() => onSave(text, mood)}
          className="px-4 py-1 w-1/3 rounded-lg text-left text-green-500 hover:bg-green-100 font-bold transition"
        >
          ✔️ Save Entry
        </button>
        {entry && (
          <button
            onClick={onDelete}
            className="px-4 w-1/3 py-1 text-left rounded-lg text-red-500 hover:bg-red-100 font-bold transition"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
}
