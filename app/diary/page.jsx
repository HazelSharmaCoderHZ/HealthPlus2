"use client";

import { useState, useEffect } from "react";
import Calendar from "./components/calendar";
import EntryForm from "./components/entryform";
import { getJournalEntry, saveJournalEntry, deleteJournalEntry } from "./firebaseFunctions";
import { useAuth } from "@/context/AuthContext";
import TopMenuButton from "../../components/TopMenuButton"; 

function toDateId(d) {
  // returns YYYY-MM-DD in local timezone
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function DiaryPage() {
  const { user, loading: authLoading } = useAuth();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entry, setEntry] = useState(null);
  const [entries, setEntries] = useState({});
  const [message, setMessage] = useState("");

  const today = new Date();
  const selectedId = toDateId(selectedDate);
  const todayId = toDateId(today);
  const isToday = selectedId === todayId;

  // Load entry for selected date
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchEntry = async () => {
      try {
        const data = await getJournalEntry(user.uid, selectedId);
        if (!mounted) return;
        setEntry(data);
      } catch (err) {
        console.error("fetchEntry error:", err);
        setEntry(null);
      }
    };
    fetchEntry();
    return () => { mounted = false; };
  }, [selectedDate, user, selectedId]);

  // Load recent entries for calendar mood colors (last 30 days)
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const fetchAllEntries = async () => {
      try {
        const dates = [];
        for (let i = 0; i < 30; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          dates.push(toDateId(d));
        }

        const allEntries = {};
        for (const dateStr of dates) {
          try {
            const data = await getJournalEntry(user.uid, dateStr);
            if (data) allEntries[dateStr] = data;
          } catch (err) {
            // ignore single-date errors
          }
        }
        if (!mounted) return;
        setEntries(allEntries);
      } catch (err) {
        console.error("fetchAllEntries error:", err);
      }
    };
    fetchAllEntries();
    return () => { mounted = false; };
  }, [user]);

  const handleSave = async (text, mood) => {
    if (!user) {
      setMessage("Please login to save your journal.");
      return;
    }
    if (!isToday) {
      setMessage("You can only write entries for today.");
      return;
    }
    if (!mood) {
      setMessage("Please select a mood before saving.");
      return;
    }

    try {
      await saveJournalEntry(user.uid, selectedId, { date: selectedId, text, mood });
      setEntry({ date: selectedId, text, mood });
      setEntries((prev) => ({ ...prev, [selectedId]: { date: selectedId, text, mood } }));
      setMessage("Your journal has been saved!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("handleSave error:", err);
      setMessage("Failed to save entry. " + (err.message || ""));
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleDelete = async () => {
    if (!user) {
      setMessage("Please login to delete.");
      return;
    }
    try {
      await deleteJournalEntry(user.uid, selectedId);
      setEntry(null);
      setEntries((prev) => {
        const updated = { ...prev };
        delete updated[selectedId];
        return updated;
      });
      setMessage("Your journal has been deleted.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("handleDelete error:", err);
      setMessage("Failed to delete entry.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (authLoading) {
    return <div className="text-white min-h-screen flex items-center justify-center">Loading…</div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 relative text-white">
      <h1 className="text-4xl font-bold text-center text-white bg-cyan-900 mb-2">Dear Diary,</h1>
      <p className="text-center text-white bg-cyan-900 mb-6 text-lg">Your thoughts are safe with us!</p>
<TopMenuButton />
      {message && (
        <div className="text-center text-black/70 bg-blue-200 font-medium mb-4">{message}</div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
        <div className="p-6 rounded-2xl flex flex-col bg-grey-300 border bg-blue-100/20 border-blue-700 shadow-xl h-full">
          <div className="flex-1">
            <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} entries={entries} />
          </div>
        </div>

        <div className="p-6 rounded-2xl flex flex-col bg-grey-300 border bg-blue-100/20 border-blue-700 shadow-xl h-full">
          <div className="flex-1 flex flex-col">
            {isToday ? (
              <EntryForm entry={entry} onSave={handleSave} onDelete={handleDelete} />
            ) : (
              entry ? (
                <div className="p-4">
                  <h3 className="font-semibold mb-2">Entry for {selectedId}</h3>
                  <p className="mb-2">{entry.text}</p>
                  <p className="text-sm text-gray-300">Mood: {entry.mood}</p>
                  <div className="mt-4">
                    <button
                      onClick={handleDelete}
                      className="rounded bg-red-600 px-4 py-2 text-white"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-blue-700 text-center mt-5 flex-1 flex items-center justify-center">
                  No entry for this date.
                </p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
