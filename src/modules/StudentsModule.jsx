import React, { useState, useEffect } from "react";
import {
  Search, Phone, Mail, UserCircle2, FileCheck2, Loader2, Plus, Pencil, Trash2, Users
} from "lucide-react";
import { C, fmtMoney, monoFont } from "../lib/theme";
import { Pill, Card, SectionHeader, Avatar, Table, Modal, Tag, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, APPLICANTS } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const RISK_LEVELS   = ["Low", "Medium", "High"];
const GENDERS       = [{ value: "M", label: "Male" }, { value: "F", label: "Female" }];
const EMPTY_STUDENT = { name: "", cls: "Form 4A", gender: "M", guardian: "", phone: "", email: "" };

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <Users size={38} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function StudentsModule({ role, onSelectStudent }) {
  const [tab, setTab]         = useState("directory");
  const [query, setQuery]     = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(isSupabaseConfigured);

  /* modal: null | { mode:"add" } | { mode:"edit", data:{...} } */
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY_STUDENT);
  const [saving, setSaving] = useState(false);

  /* confirm delete */
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("students").select("*").order("name").then(({ data, error }) => {
      if (error) console.warn("Students fetch error:", error.message);
      setStudents(data || []);
      setLoading(false);
    });
  }, []);

  /* ---- CRUD ---- */
  function openAdd()       { setForm(EMPTY_STUDENT); setModal({ mode: "add" }); }
  function openEdit(s)     { setForm({ name: s.name, cls: s.cls, gender: s.gender, guardian: s.guardian || "", phone: s.phone || "", email: s.email || "" }); setModal({ mode: "edit", data: s }); }

  function saveStudent() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (modal.mode === "edit") {
      const id = modal.data.id;
      const payload = { name: form.name, cls: form.cls, gender: form.gender, guardian: form.guardian, phone: form.phone, email: form.email };
      if (isSupabaseConfigured) {
        supabase.from("students").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Student update error:", error.message);
          setStudents((arr) => arr.map((s) => s.id === id ? { ...s, ...payload } : s));
          setSaving(false); setModal(null);
        });
      } else {
        setStudents((arr) => arr.map((s) => s.id === id ? { ...s, ...payload } : s));
        setSaving(false); setModal(null);
      }
    } else {
      const newId = `STU-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, "0")}`;
      const row = { id: newId, ...form, attendance: 100, average: 0, balance: 0, risk: "Low", status: "Enrolled" };
      if (isSupabaseConfigured) {
        supabase.from("students").insert(row).select().single().then(({ data, error }) => {
          if (error) console.warn("Student insert error:", error.message);
          setStudents((arr) => [...arr, data || row]);
          setSaving(false); setModal(null); setForm(EMPTY_STUDENT);
        });
      } else {
        setStudents((arr) => [...arr, row]);
        setSaving(false); setModal(null); setForm(EMPTY_STUDENT);
      }
    }
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("students").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setStudents((arr) => arr.filter((s) => s.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setStudents((arr) => arr.filter((s) => s.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  const filtered = students.filter((s) =>
    (classFilter === "All" || s.cls === classFilter) &&
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const isAdmin = role === "admin";
  const stages  = ["Applied", "Reviewed", "Accepted", "Enrolled"];

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <Tag active={tab === "directory"}  onClick={() => setTab("directory")}>Student Directory</Tag>
        <Tag active={tab === "admissions"} onClick={() => setTab("admissions")}>Admissions Pipeline</Tag>
        {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}
      </div>

      {tab === "directory" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 200 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13 }}>
              <option>All</option>
              {CLASSES.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
            {isAdmin && (
              <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={14} /> Add Student
              </button>
            )}
          </div>

          {loading ? null : filtered.length === 0 ? (
            <EmptyState
              message={students.length === 0 ? "No students enrolled yet." : "No students match your search."}
              hint={students.length === 0 && isAdmin ? 'Click "Add Student" to enrol the first student.' : undefined}
            />
          ) : (
            <Table
              onRowClick={onSelectStudent}
              columns={[
                { key: "name",       label: "Name",        render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><span style={{ fontWeight: 600 }}>{r.name}</span></div> },
                { key: "id",         label: "Admission No", render: (r) => <span style={monoFont}>{r.id}</span> },
                { key: "cls",        label: "Class" },
                { key: "attendance", label: "Attendance",  render: (r) => `${r.attendance}%` },
                { key: "average",    label: "Average",     render: (r) => `${r.average}%` },
                { key: "balance",    label: "Fee Balance",  render: (r) => r.balance ? <span style={{ color: C.amber }}>{fmtMoney(r.balance)}</span> : <span style={{ color: C.green }}>Settled</span> },
                { key: "risk",       label: "Risk",        render: (r) => <Pill tone={riskTone(r.risk)}>{r.risk || "Low"}</Pill> },
                ...(isAdmin ? [{ key: "actions", label: "", render: (r) => (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={iconBtn(C.textMuted)} onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil size={14} /></button>
                    <button style={iconBtn(C.red)}       onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: r.id, label: r.name }); }}><Trash2 size={14} /></button>
                  </div>
                ) }] : []),
              ]}
              rows={filtered}
            />
          )}
        </Card>
      )}

      {tab === "admissions" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {stages.map((stage) => (
            <div key={stage}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>{stage}</span>
                <Pill tone="slate">{APPLICANTS.filter((a) => a.stage === stage).length}</Pill>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {APPLICANTS.filter((a) => a.stage === stage).map((a) => (
                  <Card key={a.id} style={{ padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4 }}>{a.forClass}</div>
                    <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6, ...monoFont }}>{a.id} · {a.date}</div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- ADD / EDIT MODAL ---- */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Student" : "Add New Student"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={L}>Full Name</label>
            <input placeholder="e.g. Tatenda Mupfumi" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={F} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Class</label>
              <select value={form.cls} onChange={(e) => setForm((f) => ({ ...f, cls: e.target.value }))} style={F}>
                {CLASSES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Gender</label>
              <select value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} style={F}>
                {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={L}>Guardian / Parent Name</label>
            <input placeholder="e.g. Mr. J. Mupfumi" value={form.guardian} onChange={(e) => setForm((f) => ({ ...f, guardian: e.target.value }))} style={F} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Guardian Phone</label>
              <input placeholder="+263 77 …" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={F} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Guardian Email</label>
              <input placeholder="guardian@email.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={F} />
            </div>
          </div>
          <button onClick={saveStudent} disabled={saving || !form.name.trim()}
            style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : modal?.mode === "edit" ? "Save Changes" : "Enrol Student"}
          </button>
        </div>
      </Modal>

      {/* ---- CONFIRM DELETE ---- */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>
          Permanently remove <strong style={{ color: C.text }}>{confirmDelete?.label}</strong> from the system? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmAndDelete} disabled={deleting} style={{ flex: 1, background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Removing…" : "Remove Student"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function StudentDetailModal({ student, onClose }) {
  const [tab, setTab] = useState("profile");
  if (!student) return null;
  return (
    <Modal open={!!student} onClose={onClose} title={student.name} wide>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <Avatar name={student.name} size={56} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{student.name}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 2 }}>{student.cls} · <span style={monoFont}>{student.id}</span></div>
        </div>
        <div style={{ marginLeft: "auto" }}><Pill tone={riskTone(student.risk)}>{student.risk || "Low"} Risk</Pill></div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["profile", "guardian", "academic", "documents"].map((t) => (
          <Tag key={t} active={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</Tag>
        ))}
      </div>
      {tab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Gender", student.gender], ["Class", student.cls], ["Attendance", `${student.attendance}%`], ["Average", `${student.average}%`], ["Fee Balance", fmtMoney(student.balance || 0)], ["Status", student.status]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11.5, color: C.textFaint, textTransform: "uppercase" }}>{k}</div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      {tab === "guardian" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><UserCircle2 size={16} color={C.textMuted} /><span style={{ color: C.text, fontSize: 13.5 }}>{student.guardian || "—"}</span></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Phone size={16} color={C.textMuted} /><span style={{ color: C.text, fontSize: 13.5 }}>{student.phone || "—"}</span></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Mail size={16} color={C.textMuted} /><span style={{ color: C.text, fontSize: 13.5 }}>{student.email || "—"}</span></div>
        </div>
      )}
      {tab === "academic" && (
        <Table
          columns={[{ key: "subject", label: "Subject" }, { key: "score", label: "Latest Score", render: () => "—" }]}
          rows={SUBJECTS.slice(0, 6).map((s) => ({ subject: s }))}
        />
      )}
      {tab === "documents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["Birth Certificate", "Previous School Report", "Medical Form", "Admission Letter"].map((d) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <FileCheck2 size={15} color={C.green} />
              <span style={{ fontSize: 13, color: C.text }}>{d}</span>
              <Pill tone="green">Uploaded</Pill>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export { StudentsModule, StudentDetailModal };