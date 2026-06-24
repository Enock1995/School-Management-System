import React, { useState, useRef, useEffect } from "react";
import {
  Send, Bot, Loader2
} from "lucide-react";
import { C, displayFont } from "../lib/theme";
import { Card } from "../components/ui";

function ChatPanel({ persona, systemPrompt, suggestions, height = 420 }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: persona.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function send(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    const next = [...messages, { role: "user", content: userText }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const textBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      setMessages((m) => [...m, { role: "assistant", content: textBlocks || "I wasn't able to generate a response just now — please try again." }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "Something went wrong reaching the AI service. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card padded={false} style={{ display: "flex", flexDirection: "column", height }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: C.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Bot size={17} color={C.indigo} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{persona.name}</div>
          <div style={{ fontSize: 11.5, color: C.textMuted }}>Powered by Claude · claude-sonnet-4-6</div>
        </div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%", padding: "10px 14px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.5, whiteSpace: "pre-wrap",
              background: m.role === "user" ? C.indigo : C.surface2,
              color: m.role === "user" ? "#fff" : C.text,
              border: m.role === "user" ? "none" : `1px solid ${C.border}`,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: 12.5 }}>
            <Loader2 size={13} className="spin" /> thinking…
          </div>
        )}
      </div>
      {messages.length < 2 && suggestions && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "0 18px 12px" }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)} style={{ fontSize: 12, padding: "7px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder={persona.placeholder}
          style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 13.5, outline: "none" }}
        />
        <button onClick={() => send()} style={{ width: 38, height: 38, borderRadius: 10, background: C.indigo, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Send size={15} color="#fff" />
        </button>
      </div>
    </Card>
  );
}


export { ChatPanel };
