import React, { useState, useEffect } from "react";
import { Send, Loader2, Wand2, MessageSquare, Trash2 } from "lucide-react";
import { C } from "../lib/theme";
import { Pill, Card, SectionHeader, Modal } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const AUDIENCES = ["All Parents", "All Students", "All Staff", "Form 4A Parents", "Form 5A Parents", "Form 6A Parents"];

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <MessageSquare size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function CommunicationModule({ role }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(isSupabaseConfigured);

  const [title,    setTitle]    = useState("");
  const [draft,    setDraft]    = useState("");
  const [audience, setAudience] = useState("All Parents");
  const [drafting, setDrafting] = useState(false);
  const [sending,  setSending]  = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const canCompose = role === "admin" || role === "teacher";

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("announcements").select("*").order("date", { ascending: false }).then(({ data, error }) => {
      if (error) console.warn("Announcements fetch error:", error.message);
      setAnnouncements(data || []);
      setLoading(false);
    });
  }, []);

  async function aiDraft() {
    setDrafting(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          messages: [{ role: "user", content: `Write a short, warm, professional school announcement for "${audience}" at Springfield International High School. Topic: ${draft || "a general term update"}. Keep it under 80 words.` }],
        }),
      });
      const data = await res.json();
      const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
      if (text) setDraft(text);
    } catch (e) { /* keep existing draft */ } finally { setDrafting(false); }
  }

  function sendAnnouncement() {
    if (!title.trim() || !draft.trim() || sending) return;
    setSending(true);
    const row = { title: title.trim(), audience, channel: "Email + Push", date: new Date().toISOString().slice(0, 10), body: draft.trim() };
    if (isSupabaseConfigured) {
      supabase.from("announcements").insert(row).select().single().then(({ data: inserted, error }) => {
        if (error) console.warn("Announcement insert error:", error.message);
        setAnnouncements((arr) => [inserted || { id: Date.now(), ...row }, ...arr]);
        setSending(false); setTitle(""); setDraft("");
      });
    } else {
      setAnnouncements((arr) => [{ id: Date.now(), ...row }, ...arr]);
      setSending(false); setTitle(""); setDraft("");
    }
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("announcements").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setAnnouncements((arr) => arr.filter((a) => a.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setAnnouncements((arr) => arr.filter((a) => a.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}

      {canCompose && (
        <Card>
          <SectionHeader title="Compose Announcement" />
          <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13 }}>
              {AUDIENCES.map((a) => <option key={a}>{a}</option>)}
            </select>
            <Pill tone="indigo">Email</Pill>
            <Pill tone="cyan">Push</Pill>
          </div>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement title…"
            style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 13.5, outline: "none", marginBottom: 10, boxSizing: "border-box" }}
          />
          <textarea
            value={draft} onChange={(e) => setDraft(e.target.value)} rows={4}
            placeholder="Type a topic, then let AI draft the full message — or write it yourself…"
            style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, color: C.text, fontSize: 13.5, resize: "vertical", outline: "none", boxSizing: "border-box" }}
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
        {loading ? null : announcements.length === 0 ? (
          <EmptyState
            message={canCompose ? "No announcements sent yet." : "No announcements yet."}
            hint={canCompose ? "Compose and send an announcement above to get started." : "Check back later for updates from the school."}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {announcements.map((a) => (
              <div key={a.id} style={{ paddingBottom: 14, borderBottom: `1px solid ${C.borderSoft}`, position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.text, paddingRight: canCompose ? 32 : 0 }}>{a.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11.5, color: C.textFaint }}>{a.date}</span>
                    {canCompose && (
                      <button onClick={() => setConfirmDelete({ id: a.id, label: a.title })} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color: C.red }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, margin: "6px 0" }}>
                  <Pill tone="slate">{a.audience}</Pill>
                  <Pill tone="indigo">{a.channel}</Pill>
                </div>
                <p style={{ fontSize: 13, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>
          Permanently delete <strong style={{ color: C.text }}>{confirmDelete?.label}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmAndDelete} disabled={deleting} style={{ flex: 1, background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export { CommunicationModule };