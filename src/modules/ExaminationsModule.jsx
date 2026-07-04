import React, { useState, useEffect } from "react";
import { ClipboardList, Sparkles, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { C, monoFont } from "../lib/theme";
import { Pill, Card, SectionHeader, Table, Modal, Tag, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const MARK_ENTRY_EXAM_ID = "EX-01";

function computeGrade(score) {
  if (!score || score <= 0) return "—";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

const EMPTY_EXAM = { title: "", subject: SUBJECTS[0], cls: "Form 4A", date: "", status: "Scheduled" };

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <ClipboardList size={38} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function ExaminationsModule({ role }) {
  const [exams,   setExams]   = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  /* exam modal: null | { mode:"add" } | { mode:"edit", data:{...} } */
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState(EMPTY_EXAM);
  const [saving, setSaving] = useState(false);

  /* confirm delete */
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("exams").select("*").order("date"),
      supabase.from("results").select("*").eq("exam_id", MARK_ENTRY_EXAM_ID),
    ]).then(([examsRes, resultsRes]) => {
      if (examsRes.error) console.warn("Exams fetch error:", examsRes.error.message);
      setExams(examsRes.data || []);
      if (!resultsRes.error && resultsRes.data?.length > 0) {
        setResults(resultsRes.data.map((r) => ({ name: r.student, score: r.score, grade: r.grade })));
      }
      setLoading(false);
    });
  }, []);

  /* ---- CRUD ---- */
  function openAdd()    { setForm(EMPTY_EXAM); setModal({ mode: "add" }); }
  function openEdit(e)  { setForm({ title: e.title, subject: e.subject, cls: e.cls, date: e.date, status: e.status }); setModal({ mode: "edit", data: e }); }

  function saveExam() {
    if (!form.title.trim() || !form.date) return;
    setSaving(true);

    if (modal.mode === "edit") {
      const id = modal.data.id;
      const payload = { title: form.title, subject: form.subject, cls: form.cls, date: form.date, status: form.status };
      if (isSupabaseConfigured) {
        supabase.from("exams").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Exam update error:", error.message);
          setExams((arr) => arr.map((e) => e.id === id ? { ...e, ...payload } : e));
          setSaving(false); setModal(null);
        });
      } else {
        setExams((arr) => arr.map((e) => e.id === id ? { ...e, ...payload } : e));
        setSaving(false); setModal(null);
      }
    } else {
      const newId = `EX-${String(exams.length + 1).padStart(2, "0")}`;
      const row = { id: newId, ...form };
      if (isSupabaseConfigured) {
        supabase.from("exams").insert(row).select().single().then(({ data, error }) => {
          if (error) console.warn("Exam insert error:", error.message);
          setExams((arr) => [...arr, data || row]);
          setSaving(false); setModal(null); setForm(EMPTY_EXAM);
        });
      } else {
        setExams((arr) => [...arr, row]);
        setSaving(false); setModal(null); setForm(EMPTY_EXAM);
      }
    }
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("exams").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setExams((arr) => arr.filter((e) => e.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setExams((arr) => arr.filter((e) => e.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  function saveScore(student, score) {
    const grade = computeGrade(score);
    setResults((arr) => arr.map((r) => r.name === student ? { ...r, score, grade } : r));
    if (!isSupabaseConfigured) return;
    supabase.from("results").upsert(
      { exam_id: MARK_ENTRY_EXAM_ID, student, score, grade },
      { onConflict: "exam_id,student" }
    ).then(({ error }) => { if (error) console.warn("Result save error:", error.message); });
  }

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  /* ---- STUDENT VIEW ---- */
  if (role === "student") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Loading…</span>}
        <Card>
          <SectionHeader title="Upcoming Exams" />
          {exams.filter((e) => e.status === "Scheduled").length === 0
            ? <EmptyState message="No exams scheduled yet." />
            : <Table columns={[{ key: "title", label: "Exam" }, { key: "subject", label: "Subject" }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={exams.filter((e) => e.status === "Scheduled")} />
          }
        </Card>
        <Card style={{ background: `linear-gradient(135deg, ${C.indigoSoft}, ${C.cyanSoft})` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
            <Sparkles size={16} color={C.cyan} />
            <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>AI Performance Outlook</span>
          </div>
          <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>Your AI Tutor can generate practice questions and help you prepare for upcoming exams. Head to the AI Hub to get started.</p>
        </Card>
      </div>
    );
  }

  /* ---- PARENT VIEW ---- */
  if (role === "parent") {
    return (
      <Card>
        <SectionHeader title="Tadiwa Mhofu — Exam Schedule" subtitle="Form 4A" />
        {exams.length === 0
          ? <EmptyState message="No exams on record yet." />
          : <Table columns={[{ key: "title", label: "Exam" }, { key: "subject", label: "Subject" }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={exams} />
        }
      </Card>
    );
  }

  /* ---- ADMIN / TEACHER VIEW ---- */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}

      <Card>
        <SectionHeader
          title="Examination Schedule"
          action={role === "admin" && (
            <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> New Exam
            </button>
          )}
        />
        {loading ? null : exams.length === 0 ? (
          <EmptyState message="No exams scheduled yet." hint={role === "admin" ? 'Click "New Exam" to schedule the first exam.' : undefined} />
        ) : (
          <Table
            columns={[
              { key: "title",   label: "Exam" },
              { key: "subject", label: "Subject" },
              { key: "cls",     label: "Class" },
              { key: "date",    label: "Date" },
              { key: "status",  label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
              ...(role === "admin" ? [{ key: "actions", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={iconBtn(C.textMuted)} onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil size={14} /></button>
                  <button style={iconBtn(C.red)}       onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: r.id, label: `${r.title} — ${r.subject}` }); }}><Trash2 size={14} /></button>
                </div>
              ) }] : []),
            ]}
            rows={exams}
          />
        )}
      </Card>

      {role === "teacher" && (
        <Card>
          <SectionHeader title="Mark Entry — Mid-Term Test, Form 4A Mathematics" />
          {results.length === 0 ? (
            <EmptyState message="No students in mark sheet yet." hint="Results are populated from the results table for exam EX-01." />
          ) : (
            <Table
              columns={[
                { key: "name",  label: "Student" },
                { key: "score", label: "Score (/100)", render: (r) => (
                  <input type="number" min="0" max="100" value={r.score || ""}
                    onChange={(e) => { const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10); setResults((arr) => arr.map((x) => x.name === r.name ? { ...x, score: v, grade: computeGrade(v) } : x)); }}
                    onBlur={(e) => saveScore(r.name, e.target.value === "" ? 0 : parseInt(e.target.value, 10))}
                    style={{ width: 70, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 13 }}
                  />
                )},
                { key: "grade", label: "Grade", render: (r) => <Pill tone={r.grade === "A" ? "green" : r.grade === "B" ? "indigo" : "slate"}>{r.grade}</Pill> },
              ]}
              rows={results}
            />
          )}
        </Card>
      )}

      {/* ---- ADD / EDIT MODAL ---- */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Exam" : "Schedule New Exam"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={L}>Exam Title</label>
            <input placeholder="e.g. Mid-Term Test" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={F} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Subject</label>
              <select value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} style={F}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Class</label>
              <select value={form.cls} onChange={(e) => setForm((f) => ({ ...f, cls: e.target.value }))} style={F}>
                {CLASSES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} style={F} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={F}>
                {["Scheduled", "Marking", "Graded"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveExam} disabled={saving || !form.title.trim() || !form.date}
            style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : modal?.mode === "edit" ? "Save Changes" : "Schedule Exam"}
          </button>
        </div>
      </Modal>

      {/* ---- CONFIRM DELETE ---- */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>
          Permanently delete <strong style={{ color: C.text }}>{confirmDelete?.label}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmAndDelete} disabled={deleting} style={{ flex: 1, background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export { ExaminationsModule };