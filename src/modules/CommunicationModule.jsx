import React, { useState, useEffect } from "react";
import {
  Send, Loader2, Wand2
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { ANNOUNCEMENTS as MOCK_ANNOUNCEMENTS } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

function CommunicationModule({ role }) {
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [audience, setAudience] = useState("All Parents");
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);
  const canCompose = role === "admin" || role === "teacher";

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("announcements")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn("Falling back to demo announcement data:", error.message);
        } else if (data && data.length > 0) {
          setAnnouncements(data);
          setUsingLiveData(true);
        }
        setLoading(false);
      });
  }, []);

  async function aiDraft() {
    setDrafting(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{ role: "user", content: `Write a short, warm, professional school announcement for "${audience}" at Springfield International High School. Topic: ${draft || "a general update to parents about the upcoming term"}. Keep it under 80 words.` }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      setDraft(text || draft);
    } catch (e) {
      // silently keep existing draft on failure
    } finally {
      setDrafting(false);
    }
  }

  function sendAnnouncement() {
    if (!title.trim() || !draft.trim() || sending) return;
    const newRow = { title: title.trim(), audience, channel: "Email + Push", date: new Date().toISOString().slice(0, 10), body: draft.trim() };
    setSending(true);
    if (isSupabaseConfigured) {
      supabase.from("announcements").insert(newRow).select().single().then(({ data: inserted, error }) => {
        if (error) {
          console.warn("Could not save announcement, keeping local only:", error.message);
          setAnnouncements((arr) => [{ id: Date.now(), ...newRow }, ...arr]);
        } else {
          setAnnouncements((arr) => [inserted, ...arr]);
        }
        setSending(false);
        setTitle("");
        setDraft("");
      });
    } else {
      setAnnouncements((arr) => [{ id: Date.now(), ...newRow }, ...arr]);
      setSending(false);
      setTitle("");
      setDraft("");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(loading || usingLiveData) && (
        <div>
          {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing live data…</span>}
          {usingLiveData && <Pill tone="green">Live data</Pill>}
        </div>
      )}
      {canCompose && (
        <Card>
          <SectionHeader title="Compose Announcement" />
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13 }}>
              {["All Parents", "All Students", "All Staff", "Form 4A Parents", "Form 6A Parents"].map((a) => <option key={a}>{a}</option>)}
            </select>
            <Pill tone="indigo">Email</Pill>
            <Pill tone="cyan">Push</Pill>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement title…"
            style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13.5, outline: "none", marginBottom: 10 }}
          />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a topic, then let AI draft the full message — or write it yourself…"
            rows={4}
            style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, color: C.text, fontSize: 13.5, resize: "vertical", outline: "none" }}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={aiDraft} disabled={drafting} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {drafting ? <Loader2 size={14} className="spin" /> : <Wand2 size={14} />} AI Draft Assist
            </button>
            <button onClick={sendAnnouncement} disabled={sending || !title.trim() || !draft.trim()} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: sending || !title.trim() || !draft.trim() ? 0.6 : 1 }}>
              {sending ? <Loader2 size={14} className="spin" /> : <Send size={14} />} Send to {audience}
            </button>
          </div>
        </Card>
      )}
      <Card>
        <SectionHeader title={canCompose ? "Sent History" : "Inbox"} />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {announcements.map((a) => (
            <div key={a.id} style={{ paddingBottom: 14, borderBottom: `1px solid ${C.borderSoft}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{a.title}</span>
                <span style={{ fontSize: 11.5, color: C.textFaint, flexShrink: 0 }}>{a.date}</span>
              </div>
              <div style={{ display: "flex", gap: 8, margin: "6px 0" }}>
                <Pill tone="slate">{a.audience}</Pill>
                <Pill tone="indigo">{a.channel}</Pill>
              </div>
              <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{a.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export { CommunicationModule };