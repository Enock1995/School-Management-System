import React, { useState, useEffect } from "react";
import { BookOpen, Loader2, Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { C, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, Table, Modal, Tag, statusTone } from "../components/ui";
import { SUBJECTS } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const CURRICULA = ["Cambridge", "ZIMSEC"];
const LEVELS    = ["IGCSE", "A-Level", "O-Level"];
const EMPTY_CLASS = { id: "", name: "", level: "IGCSE", curriculum: "Cambridge", teacher: "", count: 0 };

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <GraduationCap size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function AcademicsModule({ role }) {
  const [classes,   setClasses]   = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading,   setLoading]   = useState(isSupabaseConfigured);

  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState(EMPTY_CLASS);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("classes").select("*").order("id"),
      supabase.from("timetable").select("*").eq("cls", "Form 4A").order("id"),
    ]).then(([cR, tR]) => {
      setClasses(cR.data || []);
      setTimetable(tR.data || []);
      setLoading(false);
    });
  }, []);

  /* ---- CRUD ---- */
  function openAdd()    { setForm(EMPTY_CLASS); setModal({ mode: "add" }); }
  function openEdit(c)  { setForm({ id: c.id, name: c.name, level: c.level, curriculum: c.curriculum, teacher: c.teacher, count: c.count }); setModal({ mode: "edit", data: c }); }

  function saveClass() {
    if (!form.name.trim() || !form.teacher.trim()) return;
    setSaving(true);
    const payload = { name: form.name, level: form.level, curriculum: form.curriculum, teacher: form.teacher, count: Number(form.count) };

    if (modal.mode === "edit") {
      const id = modal.data.id;
      if (isSupabaseConfigured) {
        supabase.from("classes").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Class update error:", error.message);
          setClasses((arr) => arr.map((c) => c.id === id ? { ...c, ...payload } : c));
          setSaving(false); setModal(null);
        });
      } else {
        setClasses((arr) => arr.map((c) => c.id === id ? { ...c, ...payload } : c));
        setSaving(false); setModal(null);
      }
    } else {
      const newId = form.id.trim() || form.name.toLowerCase().replace(/\s+/g, "");
      const row = { id: newId, ...payload };
      if (isSupabaseConfigured) {
        supabase.from("classes").insert(row).select().single().then(({ data, error }) => {
          if (error) console.warn("Class insert error:", error.message);
          setClasses((arr) => [...arr, data || row]);
          setSaving(false); setModal(null); setForm(EMPTY_CLASS);
        });
      } else {
        setClasses((arr) => [...arr, row]);
        setSaving(false); setModal(null); setForm(EMPTY_CLASS);
      }
    }
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("classes").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setClasses((arr) => arr.filter((c) => c.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setClasses((arr) => arr.filter((c) => c.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });
  const isAdmin = role === "admin";

  /* ── STUDENT VIEW ── */
  if (role === "student") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Loading…</span>}
        <Card>
          <SectionHeader title="My Weekly Timetable" subtitle="Form 4A · Cambridge IGCSE" />
          {timetable.length === 0 && !loading
            ? <EmptyState message="Timetable not set up yet." hint="Check back once your class timetable has been entered." />
            : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                  <thead><tr>{["Time","Mon","Tue","Wed","Thu","Fri"].map((h) => <th key={h} style={{ textAlign:"left", padding:"0 10px 10px", color:C.textFaint, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                  <tbody>{timetable.map((row, i) => (
                    <tr key={i}>
                      <td style={{ padding:"10px", color:C.textMuted, borderBottom:`1px solid ${C.borderSoft}`, ...monoFont, fontSize:11.5 }}>{row.time}</td>
                      {["mon","tue","wed","thu","fri"].map((d) => <td key={d} style={{ padding:"10px", color:C.text, borderBottom:`1px solid ${C.borderSoft}` }}>{row[d]}</td>)}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )
          }
        </Card>
        <Card>
          <SectionHeader title="My Subjects" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {SUBJECTS.slice(0, 8).map((s) => (
              <div key={s} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                <BookOpen size={15} color={C.cyan} />
                <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginTop: 8 }}>{s}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  /* ── ADMIN / TEACHER VIEW ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}

      <Card>
        <SectionHeader
          title="Class Register"
          subtitle={`${classes.length} class${classes.length !== 1 ? "es" : ""} on record`}
          action={isAdmin && (
            <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Class
            </button>
          )}
        />
        {loading ? null : classes.length === 0 ? (
          <EmptyState message="No classes added yet." hint={isAdmin ? 'Click "Add Class" to register the first class.' : undefined} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {classes.map((c) => (
              <Card key={c.id} style={{ background: C.surface2, position: "relative" }}>
                {isAdmin && (
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 4 }}>
                    <button style={iconBtn(C.textMuted)} onClick={() => openEdit(c)}><Pencil size={13} /></button>
                    <button style={iconBtn(C.red)}       onClick={() => setConfirmDelete({ id: c.id, label: c.name })}><Trash2 size={13} /></button>
                  </div>
                )}
                <div style={{ paddingRight: isAdmin ? 52 : 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text, ...displayFont }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{c.teacher}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 12.5 }}>
                  <span style={{ color: C.textMuted }}>{c.count} students</span>
                  <Pill tone="indigo">{c.curriculum}</Pill>
                </div>
                <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 6 }}>{c.level}</div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title="Weekly Timetable" subtitle="Form 4A" />
        {timetable.length === 0 && !loading ? (
          <EmptyState message="No timetable entries yet." hint="Add timetable rows directly in Supabase under the timetable table." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead><tr>{["Time","Mon","Tue","Wed","Thu","Fri"].map((h) => <th key={h} style={{ textAlign:"left", padding:"0 10px 10px", color:C.textFaint, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
              <tbody>{timetable.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding:"10px", color:C.textMuted, borderBottom:`1px solid ${C.borderSoft}`, ...monoFont, fontSize:11.5 }}>{row.time}</td>
                  {["mon","tue","wed","thu","fri"].map((d) => <td key={d} style={{ padding:"10px", color:C.text, borderBottom:`1px solid ${C.borderSoft}` }}>{row[d]}</td>)}
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title="Curriculum Frameworks" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["Cambridge", "ZIMSEC", "IGCSE", "A-Level"].map((t) => <Pill key={t} tone="cyan">{t}</Pill>)}
        </div>
      </Card>

      {/* ── ADD / EDIT CLASS ── */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Class" : "Add New Class"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {modal?.mode === "add" && <div><label style={L}>Class ID (optional)</label><input placeholder="e.g. f4b" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} style={F} /></div>}
          <div><label style={L}>Class Name</label><input placeholder="e.g. Form 4B" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={F} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>Level</label><select value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))} style={F}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={L}>Curriculum</label><select value={form.curriculum} onChange={(e) => setForm((f) => ({ ...f, curriculum: e.target.value }))} style={F}>{CURRICULA.map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div><label style={L}>Class Teacher</label><input placeholder="e.g. Mr. T. Moyo" value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))} style={F} /></div>
          <div><label style={L}>Number of Students</label><input type="number" min="0" value={form.count} onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))} style={F} /></div>
          <button onClick={saveClass} disabled={saving || !form.name.trim() || !form.teacher.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : modal?.mode === "edit" ? "Save Changes" : "Add Class"}
          </button>
        </div>
      </Modal>

      {/* ── CONFIRM DELETE ── */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>Permanently delete <strong style={{ color: C.text }}>{confirmDelete?.label}</strong>? This cannot be undone.</p>
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

export { AcademicsModule };