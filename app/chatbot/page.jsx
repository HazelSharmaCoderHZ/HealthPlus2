"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

// ── helpers ───────────────────────────────────────────────────
const fmt = (secs) => {
  if (!secs) return "";
  const d = new Date(secs * 1000);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const todayId = () => new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

// ── Health Card ───────────────────────────────────────────────
const HealthCard = ({ icon, label, value, unit, color, notLogged }) => (
  <div
    className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-sm border"
    style={{ background: `${color}10`, borderColor: `${color}30` }}
  >
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
      {notLogged ? (
        <p className="text-xs italic text-gray-300 mt-0.5">Not logged today</p>
      ) : (
        <p className="text-lg font-bold" style={{ color }}>
          {value} <span className="text-xs font-normal text-gray-400">{unit}</span>
        </p>
      )}
    </div>
  </div>
);

// ── Typing dots ───────────────────────────────────────────────
const TypingDots = () => (
  <span className="inline-flex gap-1 items-center h-4">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

const QUICK_PROMPTS = [
  { label: "💤 Sleep tips",    text: "Give me 3 tips for better sleep tonight." },
  { label: "🥗 Healthy snack", text: "Suggest a healthy snack under 200 cal." },
  { label: "🧘 Stress relief", text: "I feel stressed. Quick breathing exercise?" },
  { label: "🚶 Daily steps",   text: "How many steps should I aim for daily?" },
];

// ─────────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const { user } = useAuth();

  const [chatId,       setChatId]       = useState(null);
  const [chatList,     setChatList]     = useState([]);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showHealth,   setShowHealth]   = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(true);

  // ── real health state ──────────────────────────────────────
  const [healthData, setHealthData] = useState({
    calories: null,   // number | null
    sleep:    null,   // number | null
    water:    null,   // number | null
    loading:  true,
  });

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── FETCH TODAY'S REAL HEALTH DATA ────────────────────────
  const fetchHealthData = useCallback(async () => {
    if (!user) return;
    const dateId = todayId();

    try {
      // 1. Calories — sum all nutrition log entries for today
      const nutritionSnap = await getDocs(
        collection(db, "nutritionLogs", user.uid, dateId)
      );
      let totalCalories = null;
      if (!nutritionSnap.empty) {
        totalCalories = 0;
        nutritionSnap.docs.forEach((d) => {
          const cal = d.data().calories ?? d.data().kcal ?? 0;
          totalCalories += Number(cal);
        });
      }

      // 2. Sleep — single doc sleepLogs/{userId}/{dateId}
      let sleepHours = null;
      const sleepDoc = await getDoc(
        doc(db, "sleepLogs", user.uid, dateId)
      );
      if (sleepDoc.exists()) {
        const s = sleepDoc.data();
        sleepHours = s.hours ?? s.duration ?? s.sleep ?? null;
      }

      // 3. Water — users/{userId}/waterIntake/{dateId}
      let waterGlasses = null;
      const waterDoc = await getDoc(
        doc(db, "users", user.uid, "waterIntake", dateId)
      );
      if (waterDoc.exists()) {
        waterGlasses = waterDoc.data().glasses ?? null;
      }

      setHealthData({
        calories: totalCalories,
        sleep:    sleepHours !== null ? Number(sleepHours) : null,
        water:    waterGlasses !== null ? Number(waterGlasses) : null,
        loading:  false,
      });
    } catch (err) {
      console.error("Health data fetch error:", err);
      setHealthData({ calories: null, sleep: null, water: null, loading: false });
    }
  }, [user]);

  useEffect(() => {
    if (showHealth) fetchHealthData();
  }, [showHealth, fetchHealthData]);

  // ── LOAD CHATS ────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    if (!user) return;
    const snap = await getDocs(collection(db, "users", user.uid, "chats"));
    const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setChatList(chats.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
  }, [user]);

  useEffect(() => { loadChats(); }, [loadChats]);

  // ── LOAD MESSAGES ─────────────────────────────────────────
  const loadMessages = async (id) => {
    const q = query(
      collection(db, "users", user.uid, "chats", id, "messages"),
      orderBy("timestamp", "asc")
    );
    const snap = await getDocs(q);
    setMessages(snap.docs.map((d) => d.data()));
  };

  // ── CREATE CHAT ───────────────────────────────────────────
  const createChat = async () => {
    const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
      createdAt: serverTimestamp(),
      title: "New Chat",
    });
    setChatId(ref.id);
    setMessages([]);
    loadChats();
  };

  // ── DELETE CHAT ───────────────────────────────────────────
  const deleteChat = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "chats", id));
    if (id === chatId) { setChatId(null); setMessages([]); }
    loadChats();
  };

  // ── SAVE MESSAGE ──────────────────────────────────────────
  const saveMessage = async (id, sender, text) => {
    await addDoc(collection(db, "users", user.uid, "chats", id, "messages"), {
      sender,
      text,
      timestamp: serverTimestamp(),
    });
  };

  // ── FETCH HISTORY ─────────────────────────────────────────
  const fetchHistory = async (id) => {
    const q = query(
      collection(db, "users", user.uid, "chats", id, "messages"),
      orderBy("timestamp", "desc"),
      limit(8)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data()).reverse();
  };

  // ── SMART TITLE ───────────────────────────────────────────
  const generateTitle = async (userMessage) => {
    try {
      const res = await fetch("/api/chat/title", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      return data.title || "Health Chat";
    } catch {
      return "Health Chat";
    }
  };

  // ── SEND MESSAGE ──────────────────────────────────────────
  const handleSend = async (overrideText) => {
    if (!user) return;
    const message = (overrideText || input).trim();
    if (!message || loading) return;

    let currentChatId = chatId;
    let isNewChat = false;

    setMessages((prev) => [
      ...prev,
      { sender: "user", text: message },
      { sender: "bot",  text: "__typing__" },
    ]);
    setInput("");
    setLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      if (!currentChatId) {
        const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
          createdAt: serverTimestamp(),
          title: "New Chat",
        });
        currentChatId = ref.id;
        setChatId(currentChatId);
        isNewChat = true;
        loadChats();
      }

      await saveMessage(currentChatId, "user", message);
      const history = await fetchHistory(currentChatId);

      if (isNewChat) {
        generateTitle(message)
          .then(async (title) => {
            await updateDoc(doc(db, "users", user.uid, "chats", currentChatId), { title });
            loadChats();
          })
          .catch((err) => console.warn("Chat title update failed:", err));
      }

      // Build health context string to enrich the prompt
      const healthContext = buildHealthContext();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, healthContext }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `HealthBot request failed (${res.status})`);
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let botText   = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line);
            botText += json.response || "";
          } catch {}
        }
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { sender: "bot", text: botText || "__typing__" };
          return updated;
        });
      }

      await saveMessage(currentChatId, "bot", botText || "I could not generate a reply. Please try again.");
    } catch (err) {
      console.error("HealthBot send failed:", err);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { sender: "bot", text: "⚠️ Something went wrong. Please try again." };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Build a short health summary to inject into the prompt ─
  const buildHealthContext = () => {
    if (healthData.loading) return "";
    const parts = [];
    if (healthData.calories !== null) parts.push(`Calories today: ${Math.round(healthData.calories)} kcal`);
    if (healthData.sleep    !== null) parts.push(`Sleep last night: ${healthData.sleep} hrs`);
    if (healthData.water    !== null) parts.push(`Water today: ${healthData.water} glasses`);
    return parts.length ? `User's logged health data for today — ${parts.join(", ")}.` : "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div className="flex h-screen font-sans bg-gradient-to-br from-blue-50 via-white to-sky-50 overflow-hidden">

      {/* ── SIDEBAR ───────────────────────────────────────── */}
      <aside
        className={`flex flex-col bg-white border-r border-blue-100 shadow-sm transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        }`}
      >
        <div className="p-4 flex flex-col h-full">

          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => window.history.back()}
              className="text-blue-500 text-sm font-semibold flex items-center gap-1 hover:text-blue-700 transition"
            >
              ← Back
            </button>
            <span className="text-xs font-bold tracking-widest text-blue-300 uppercase">Health AI</span>
          </div>

          <button
            onClick={createChat}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-sky-500 text-white py-2.5 rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm font-semibold mb-4"
          >
            <span className="text-base">＋</span> New Chat
          </button>

          {/* ── Health Panel Toggle ── */}
          <button
            onClick={() => setShowHealth((v) => !v)}
            className="flex items-center gap-2 text-sm text-blue-600 font-medium px-3 py-2 rounded-xl hover:bg-blue-50 transition mb-2"
          >
            <span>❤️</span> Today's Health
            <span className="ml-auto text-xs text-blue-300">{showHealth ? "▲" : "▼"}</span>
          </button>

          {showHealth && (
            <div className="grid gap-2 mb-4">
              {healthData.loading ? (
                <p className="text-xs text-gray-300 text-center py-2">Loading health data…</p>
              ) : (
                <>
                  <HealthCard
                    icon="🔥" label="Calories" color="#f97316"
                    value={healthData.calories !== null ? Math.round(healthData.calories) : null}
                    unit="kcal"
                    notLogged={healthData.calories === null}
                  />
                  <HealthCard
                    icon="😴" label="Sleep" color="#8b5cf6"
                    value={healthData.sleep !== null ? healthData.sleep : null}
                    unit="hrs"
                    notLogged={healthData.sleep === null}
                  />
                  <HealthCard
                    icon="💧" label="Water" color="#06b6d4"
                    value={healthData.water !== null ? healthData.water : null}
                    unit="glasses"
                    notLogged={healthData.water === null}
                  />
                  <button
                    onClick={fetchHealthData}
                    className="text-[10px] text-blue-300 hover:text-blue-500 transition text-center mt-1"
                  >
                    ↻ Refresh
                  </button>
                </>
              )}
            </div>
          )}

          <p className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold mb-2 px-1">Recent Chats</p>

          <div className="flex-1 flex flex-col gap-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-100">
            {chatList.length === 0 && (
              <p className="text-xs text-gray-300 text-center mt-6">No chats yet</p>
            )}
            {chatList.map((chat) => (
              <div
                key={chat.id}
                onClick={() => { setChatId(chat.id); loadMessages(chat.id); }}
                className={`group flex justify-between items-center px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                  chat.id === chatId
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "hover:bg-blue-50 text-gray-600"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">{chat.title || "Health Chat"}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">{fmt(chat.createdAt?.seconds)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(chat.id); }}
                  className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 transition ml-2 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN CHAT ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur border-b border-blue-100 shadow-sm">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-blue-400 hover:text-blue-600 transition text-lg leading-none"
            title="Toggle sidebar"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🩺</span>
            <div>
              <h1 className="text-sm font-bold text-gray-700 leading-none">Health Assistant</h1>
              <p className="text-[10px] text-green-400 font-medium">● Online</p>
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-xs text-gray-300 hidden sm:block">
              {chatList.find((c) => c.id === chatId)?.title || ""}
            </span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 flex flex-col gap-3">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center flex-1 gap-6 mt-10 select-none">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center text-3xl shadow-lg">
                🩺
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-700">How can I help you today?</h2>
                <p className="text-sm text-gray-400 mt-1">Ask about diet, sleep, stress, or general wellness.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => handleSend(q.text)}
                    className="px-4 py-2 rounded-full text-sm bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition shadow-sm"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
            >
              {msg.sender === "bot" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-sky-300 flex items-center justify-center text-sm flex-shrink-0 shadow">
                  🩺
                </div>
              )}
              <div
                className={`max-w-[72%] sm:max-w-[60%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-500 to-sky-500 text-white rounded-br-md"
                    : "bg-white border border-blue-100 text-gray-700 rounded-bl-md"
                }`}
              >
                {msg.text === "__typing__" ? <TypingDots /> : msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompts strip */}
        {messages.length > 0 && !loading && (
          <div className="px-5 pb-1 flex gap-2 overflow-x-auto scrollbar-none">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                onClick={() => handleSend(q.text)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs bg-white border border-blue-200 text-blue-500 hover:bg-blue-50 transition flex-shrink-0 shadow-sm"
              >
                {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="px-4 sm:px-8 py-4 bg-white/80 backdrop-blur border-t border-blue-100">
          <div className="flex items-end gap-3 bg-white border border-blue-200 rounded-2xl shadow-sm px-4 py-2 focus-within:ring-2 focus-within:ring-blue-300 transition">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask anything about your health…"
              className="flex-1 resize-none bg-transparent text-sm text-gray-700 placeholder-gray-300 focus:outline-none py-1 max-h-28"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="mb-1 bg-gradient-to-br from-blue-500 to-sky-500 text-white w-9 h-9 rounded-xl flex items-center justify-center shadow hover:shadow-md hover:scale-105 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-500 mt-2">
            Not a substitute for professional medical advice. HealthBot may take some time to give response.
          </p>
        </div>
      </div>

      {/* ── DELETE MODAL ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-72 text-center">
            <div className="text-3xl mb-3">🗑️</div>
            <h3 className="font-bold text-gray-700 mb-1">Delete Chat?</h3>
            <p className="text-sm text-gray-400 mb-5">This chat will be permanently deleted.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border text-sm text-gray-500 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => { await deleteChat(deleteTarget); setDeleteTarget(null); }}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm hover:bg-red-600 transition shadow"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
