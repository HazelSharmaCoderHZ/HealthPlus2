"use client";

const moods = [
  {
    label: "Happy",
    // classes kept explicit so Tailwind sees them
    hoverBgClass: "hover:bg-green-300/30",
    activeBgClass: "bg-green-300/30",
  },
  {
    label: "Sad",
    hoverBgClass: "hover:bg-brown-200/30",
    activeBgClass: "bg-brown-200/30",
  },
  {
    label: "Angry",
    hoverBgClass: "hover:bg-red-200/30",
    activeBgClass: "bg-red-200/30",
  },
  {
    label: "Calm",
    hoverBgClass: "hover:bg-blue-200/30",
    activeBgClass: "bg-blue-200/30",
  },
];

export default function MoodPicker({ selectedMood, setSelectedMood }) {
  return (
    <div className="flex gap-3 mt-3">
      {moods.map((m) => {
        const isActive = selectedMood === m.label;
        return (
          <button
            key={m.label}
            onClick={() => setSelectedMood(m.label)}
            // neutral text color, transparent default, hover only changes background
            className={`px-3 py-1 rounded-full text-sm font-medium bg-transparent transition ${m.hoverBgClass} ${
              isActive ? m.activeBgClass : ""
            }`}
            aria-pressed={isActive}
            type="button"
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
