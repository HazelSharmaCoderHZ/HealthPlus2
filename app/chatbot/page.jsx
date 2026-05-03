"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import TopMenuButton from "../../components/TopMenuButton";

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm HealthBot. How can I assist you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const message = input.trim();
    if (!message || loading) return;

    setMessages((prev) => [...prev, { sender: "user", text: message }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error("HealthBot failed.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let botText = "";

      setMessages((prev) => [...prev, { sender: "bot", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split("\n")) {
          if (!line.trim()) continue;

          try {
            const json = JSON.parse(line);
            botText += json.response || "";
          } catch {
            botText += line;
          }
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1].text = botText || "Thinking...";
          return updated;
        });
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Something went wrong. Try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !loading) handleSend();
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 via-white to-blue-100 px-6 pt-20 pb-10 overflow-hidden">

      <TopMenuButton />

      {/* 🔵 Background glow */}
      <div className="absolute -left-20 -top-40 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-blue-300/30 blur-3xl" />

      {/* 🏷️ PAGE HEADER */}
      <div className="text-center mb-6 z-10">
        <h1 className="text-4xl font-extrabold text-blue-800">
          HealthBot
        </h1>
        <p className="text-gray-600 text-sm">
          Your AI health assistant
        </p>
      </div>

      {/* 💬 CHAT BOX */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex w-full max-w-2xl flex-col rounded-3xl border border-blue-100 bg-white/70 shadow-xl backdrop-blur-xl h-[65vh] min-h-[480px]"
      >

        {/* HEADER */}
        <div className="flex items-center gap-3 border-b border-blue-100 p-4 bg-white/60">
          <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-600 text-white">
            🤖
          </div>
          <span className="text-blue-800 font-semibold">
            HealthBot Assistant
          </span>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[75%] px-4 py-2 rounded-xl text-sm ${
                msg.sender === "user"
                  ? "self-end bg-blue-600 text-white"
                  : "self-start bg-blue-50 text-gray-700"
              }`}
            >
              {msg.text}
            </motion.div>
          ))}

          {loading && (
            <div className="text-blue-600 text-sm ">
              Thinking...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="flex border-t border-blue-100 p-3 bg-white/80">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask anything about your health..."
            className="flex-1 px-3 py-2 border border-blue-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
          />

          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition text-sm"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
      </motion.div>
    </main>
  );
}