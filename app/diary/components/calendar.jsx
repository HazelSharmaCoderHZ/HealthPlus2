"use client";

export default function Calendar({ selectedDate, setSelectedDate, entries }) {
  const today = new Date();
  const month = selectedDate.getMonth();
  const year = selectedDate.getFullYear();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const handleClick = (day) => {
    if (!day) return;
    setSelectedDate(new Date(year, month, day));
  };

  // SAME mapping as EntryForm
  const moodColors = {
    happy: "bg-green-400",
    sad: "bg-[#B57B7B]" ,
    calm: "bg-blue-500",
    angry: "bg-red-500",
  };

  // Helper — generates YYYY-MM-DD format
  const toDateId = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="p-4 rounded-2xl">
      <h2 className="text-xl font-semibold text-blue-800 text-center mb-4">
        {selectedDate.toLocaleString("default", { month: "long" })} {year}
      </h2>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-2 text-center font-medium text-gray-500 mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          if (!day) return <div key={idx}></div>;

          // MATCH DIARY KEYS (YYYY-MM-DD)
          const dateId = toDateId(new Date(year, month, day));
          const entry = entries[dateId];

          const moodClass = entry?.mood ? moodColors[entry.mood] : "bg-gray-800";

          const isSelected =
            day === selectedDate.getDate() &&
            month === selectedDate.getMonth() &&
            year === selectedDate.getFullYear();

          return (
            <button
              key={idx}
              onClick={() => handleClick(day)}
              className={`h-12 w-12 flex items-center justify-center rounded-lg transition 
                ${isSelected ? "ring-2 ring-blue-400" : ""} 
                ${moodClass} hover:ring-2 hover:ring-blue-400`}
            >
              <span className="text-white font-semibold">{day}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
