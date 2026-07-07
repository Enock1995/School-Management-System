import React, { useState, useEffect } from "react";
import {
  AlertTriangle, ShieldCheck, Plus, CheckCircle2, UserX, TrendingDown, Award,
  MessageSquareWarning, Sparkles, Info, Loader2, Trash2
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { C, monoFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Avatar, Tag, Table, Modal, CustomTooltip } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

function severityTone(s) { return s === "Severe" || s === "High" ? "red" : s === "Moderate" || s === "Watch" ? "amber" : "green"; }
function statusToneFn(s) { return ["Resolved","Completed"].includes(s) ? "green" : ["Open","Active"].includes(s) ? "amber" : "slate"; }

const STUDENT_NAMES = ["Tadiwa Mhofu","Anesu Chitate","Liam Osei","Rutendo Marecha","Brian Mutasa","Chiedza Goredema","Kudzai Nyamande","Stephanie Mhike","Tinotenda Chigumba","Maria Fernandez","Tapiwa Chirwa","Natasha Sibanda"];
const CATEGORIES    = ["Bullying","Disruptive Behavior","Dress Code Violation","Academic Dishonesty","Vandalism","Fighting","Truancy","Disrespect to Staff"];
const SEVERITIES    = ["Minor","Moderate","Severe"];

const MOCK_SUSPENSIONS = [
  { id: 1, student: "Kudzai Nyamande", cls: "Form 2A", reason: "Physical altercation", start: "2026-05-25", end: "2026-05-27", days: 3, status: "Completed", approvedBy: "Mrs. Patience Mhike" },
  { id: 2, student: "Joseph Manyeza",  cls: "Form 4A", reason: "Repeated disruptive behavior", start: "2026-06-15", end: "2026-06-17", days: 2, status: "Active", approvedBy: "Mrs. Patience Mhike" },
];

const BEHAVIOR_POINTS = [
  { name: "Natasha Sibanda",    cls: "Form 1A", merits: 14, demerits: 0  },
  { name: "Rutendo Marecha",    cls: "Form 1A", merits: 12, demerits: 0  },
  { name: "Tadiwa Mhofu",       cls: "Form 4A", merits: 11, demerits: 1  },
  { name: "Anesu Chitate",      cls: "Form 4A", merits:  7, demerits: 1  },
  { name: "Brian Mutasa",       cls: "Form 3A", merits:  3, demerits: 4  },
  { name: "Tapiwa Chirwa",      cls: "Form 3A", merits:  2, demerits: 5  },
  { name: "Liam Osei",          cls: "Form 2A", merits:  1, demerits: 6  },
  { name: "Kudzai Nyamande",    cls: "Form 2A", merits:  0, demerits: 9  },
].map((s) => ({ ...s, net: s.merits - s.demerits }));

const AI_RISK = [
  { student: "Kudzai Nyamande", cls: "Form 2A", severity: "High",  msg: "Pattern of escalating incidents combined with declining attendance — recommend counselor referral." },
  { student: "Liam Osei",       cls: "Form 2A", severity: "Watch", msg: "Truancy combined with falling grades suggests disengagement — early intervention recommended." },
  { student: "Tapiwa Chirwa",   cls: "Form 3A", severity: "Watch", msg: "Second disrespect incident this term — recommend a check-in with the school counselor." },
];

function normalizeIncident(r) {
  return { ...r, reportedBy: r.reportedBy ?? r.reported_by, actionTaken: r.actionTaken ?? r.action_taken, parentNotified: r.parentNotified ?? r.parent_notified };
}

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <ShieldCheck size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

/* ── Incident detail modal ── */
function IncidentDetailModal({ incident, onResolve, onClose }) {
  if (!incident) return null;
  return (
    <Modal open={!!incident} onClose={onClose} title="Incident Report" wide>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Avatar name={incident.student} size={44} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{incident.student}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{incident.cls} · {incident.date}</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Pill tone={severityTone(incident.severity)}>{incident.severity}</Pill>
          <Pill tone={statusToneFn(incident.status)}>{incident.status}</Pill>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[["Category", incident.category], ["Description", incident.description], ["Action Taken", incident.actionTaken], ["Reported By", incident.reportedBy]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
            <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{v}</div>
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Parent Notified</div>
          <Pill tone={incident.parentNotified ? "green" : "amber"}>{incident.parentNotified ? "Yes" : "Not yet"}</Pill>
        </div>
        {incident.status === "Open" && (
          <button onClick={() => onResolve(incident.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
            <CheckCircle2 size={15} /> Mark as Resolved
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ── New incident modal ── */
function NewIncidentModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({ student: STUDENT_NAMES[0], category: CATEGORIES[0], severity: "Minor", description: "" });
  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  return (
    <Modal open={open} onClose={onClose} title="Report New Incident">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={L}>Student</label><select value={form.student} onChange={(e) => setForm((f) => ({ ...f, student: e.target.value }))} style={F}>{STUDENT_NAMES.map((n) => <option key={n}>{n}</option>)}</select></div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 2 }}><label style={L}>Category</label><select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={F}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div style={{ flex: 1 }}><label style={L}>Severity</label><select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} style={F}>{SEVERITIES.map((s) => <option key={s}>{s}</option>)}</select></div>
        </div>
        <div><label style={L}>Description</label><textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Describe what happened…" style={{ ...F, resize: "vertical" }} /></div>
        <button onClick={() => { if (!form.description.trim()) return; onSubmit(form); setForm({ student: STUDENT_NAMES[0], category: CATEGORIES[0], severity: "Minor", description: "" }); }}
          disabled={!form.description.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          Submit Incident Report
        </button>
      </div>
    </Modal>
  );
}

/* ── Admin view ── */
function DisciplineAdminView({ incidents, setIncidents }) {
  const [tab, setTab] = useState("incidents");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newIncidentOpen, setNewIncidentOpen]   = useState(false);
  const [confirmDelete, setConfirmDelete]       = useState(null);
  const [deleting, setDeleting]                 = useState(false);

  const openCount   = incidents.filter((i) => i.status === "Open").length;
  const severeCount = incidents.filter((i) => i.severity === "Severe").length;
  const catData     = CATEGORIES.slice(0, 5).map((cat) => ({ name: cat.split(" ")[0], count: incidents.filter((i) => i.category === cat).length }));

  function resolveIncident(id) {
    setIncidents((arr) => arr.map((i) => i.id === id ? { ...i, status: "Resolved" } : i));
    setSelectedIncident(null);
    if (!isSupabaseConfigured) return;
    supabase.from("incidents").update({ status: "Resolved" }).eq("id", id).then(({ error }) => { if (error) console.warn("Resolve error:", error.message); });
  }

  function addIncident(data) {
    const row = { date: new Date().toISOString().slice(0, 10), cls: "—", reportedBy: "Admin", actionTaken: "Pending review.", parentNotified: false, status: "Open", ...data };
    if (isSupabaseConfigured) {
      supabase.from("incidents").insert({ student: row.student, cls: row.cls, date: row.date, category: row.category, severity: row.severity, reported_by: row.reportedBy, description: row.description, action_taken: row.actionTaken, parent_notified: row.parentNotified, status: row.status })
        .select().single().then(({ data: inserted, error }) => {
          setIncidents((arr) => [normalizeIncident(error ? { id: Date.now(), ...row } : inserted), ...arr]);
        });
    } else {
      setIncidents((arr) => [{ id: Date.now(), ...row }, ...arr]);
    }
    setNewIncidentOpen(false);
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("incidents").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setIncidents((arr) => arr.filter((i) => i.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setIncidents((arr) => arr.filter((i) => i.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={AlertTriangle} label="Open Incidents"      value={openCount}              tone="red"    />
        <StatCard icon={UserX}         label="Severe Incidents"    value={severeCount}            tone="amber"  />
        <StatCard icon={ShieldCheck}   label="Resolved This Term"  value={incidents.filter((i) => i.status === "Resolved").length} tone="green" />
        <StatCard icon={Award}         label="Top Merit Student"   value="Natasha Sibanda"        tone="indigo" />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag active={tab === "incidents"}  onClick={() => setTab("incidents")}>Incidents</Tag>
        <Tag active={tab === "suspensions"}onClick={() => setTab("suspensions")}>Suspensions</Tag>
        <Tag active={tab === "points"}     onClick={() => setTab("points")}>Behavior Points</Tag>
        <Tag active={tab === "insights"}   onClick={() => setTab("insights")}>AI Insights</Tag>
      </div>

      {tab === "incidents" && (
        <Card>
          <SectionHeader title="Incident Register" action={
            <button onClick={() => setNewIncidentOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Report Incident
            </button>
          } />
          {incidents.length === 0
            ? <EmptyState message="No incidents on record." hint='Click "Report Incident" to log the first one.' />
            : <Table onRowClick={setSelectedIncident} columns={[
                { key: "student",  label: "Student" },
                { key: "category", label: "Category" },
                { key: "date",     label: "Date" },
                { key: "severity", label: "Severity", render: (r) => <Pill tone={severityTone(r.severity)}>{r.severity}</Pill> },
                { key: "status",   label: "Status",   render: (r) => <Pill tone={statusToneFn(r.status)}>{r.status}</Pill> },
                { key: "actions",  label: "", render: (r) => (
                  <button style={iconBtn(C.red)} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: r.id, label: `${r.student} — ${r.category}` }); }}><Trash2 size={14} /></button>
                ) },
              ]} rows={incidents} />
          }
        </Card>
      )}

      {tab === "suspensions" && (
        <Card>
          <SectionHeader title="Suspension Log" />
          {MOCK_SUSPENSIONS.length === 0
            ? <EmptyState message="No suspensions on record." />
            : <Table columns={[
                { key: "student",    label: "Student" },
                { key: "reason",     label: "Reason" },
                { key: "start",      label: "From" },
                { key: "end",        label: "To" },
                { key: "days",       label: "Days", render: (r) => `${r.days}d` },
                { key: "status",     label: "Status", render: (r) => <Pill tone={statusToneFn(r.status)}>{r.status}</Pill> },
                { key: "approvedBy", label: "Approved By" },
              ]} rows={MOCK_SUSPENSIONS} />
          }
        </Card>
      )}

      {tab === "points" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Incident Frequency by Category" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={catData}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="name" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={28} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {catData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? C.indigo : C.cyan} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Behavior Points Leaderboard" subtitle="Merit − Demerit tally" />
            <Table columns={[
              { key: "name",     label: "Student" },
              { key: "cls",      label: "Class" },
              { key: "merits",   label: "Merits",   render: (r) => <span style={{ color: C.green }}>{r.merits}</span> },
              { key: "demerits", label: "Demerits", render: (r) => <span style={{ color: C.red }}>{r.demerits}</span> },
              { key: "net",      label: "Net",      render: (r) => <Pill tone={r.net >= 0 ? "green" : "red"}>{r.net >= 0 ? "+" : ""}{r.net}</Pill> },
            ]} rows={BEHAVIOR_POINTS} />
          </Card>
        </div>
      )}

      {tab === "insights" && (
        <Card>
          <SectionHeader title="AI Behavior Risk Alerts" subtitle="Generated from incident patterns and attendance data" />
          {incidents.length === 0
            ? <EmptyState message="No incidents to analyse yet." hint="Log incidents to enable AI risk analysis." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {AI_RISK.map((a) => (
                  <div key={a.student} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 14, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                    <div style={{ marginTop: 2 }}>{a.severity === "High" ? <AlertTriangle size={16} color={C.red} /> : <Info size={16} color={C.amber} />}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.student} <span style={{ fontSize: 11.5, color: C.textFaint, fontWeight: 400 }}>· {a.cls}</span></div>
                      <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>{a.msg}</div>
                    </div>
                    <Pill tone={severityTone(a.severity)} style={{ marginLeft: "auto", flexShrink: 0 }}>{a.severity}</Pill>
                  </div>
                ))}
              </div>
          }
        </Card>
      )}

      <IncidentDetailModal incident={selectedIncident} onResolve={resolveIncident} onClose={() => setSelectedIncident(null)} />
      <NewIncidentModal open={newIncidentOpen} onClose={() => setNewIncidentOpen(false)} onSubmit={addIncident} />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>Permanently delete incident record for <strong style={{ color: C.text }}>{confirmDelete?.label}</strong>? This cannot be undone.</p>
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

/* ── Teacher view ── */
function DisciplineTeacherView({ incidents, setIncidents }) {
  const teacherName = "Mr. T. Moyo";
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);
  const myReports = incidents.filter((i) => i.reportedBy === teacherName);

  function addIncident(data) {
    const row = { date: new Date().toISOString().slice(0, 10), cls: "—", reportedBy: teacherName, actionTaken: "Pending review.", parentNotified: false, status: "Open", ...data };
    if (isSupabaseConfigured) {
      supabase.from("incidents").insert({ student: row.student, cls: row.cls, date: row.date, category: row.category, severity: row.severity, reported_by: row.reportedBy, description: row.description, action_taken: row.actionTaken, parent_notified: row.parentNotified, status: row.status })
        .select().single().then(({ data: inserted, error }) => {
          setIncidents((arr) => [normalizeIncident(error ? { id: Date.now(), ...row } : inserted), ...arr]);
        });
    } else {
      setIncidents((arr) => [{ id: Date.now(), ...row }, ...arr]);
    }
    setNewIncidentOpen(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MessageSquareWarning size={18} color={C.cyan} />
          <span style={{ fontSize: 13.5, color: C.text }}>Noticed a behavior issue? Log it — the Head of School reviews every report.</span>
        </div>
        <button onClick={() => setNewIncidentOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Report Incident
        </button>
      </Card>
      <Card>
        <SectionHeader title="Incidents I've Reported" />
        {myReports.length === 0
          ? <EmptyState message="You haven't reported any incidents yet." />
          : <Table columns={[
              { key: "student",  label: "Student" },
              { key: "category", label: "Category" },
              { key: "date",     label: "Date" },
              { key: "severity", label: "Severity", render: (r) => <Pill tone={severityTone(r.severity)}>{r.severity}</Pill> },
              { key: "status",   label: "Status",   render: (r) => <Pill tone={statusToneFn(r.status)}>{r.status}</Pill> },
            ]} rows={myReports} />
        }
      </Card>
      <NewIncidentModal open={newIncidentOpen} onClose={() => setNewIncidentOpen(false)} onSubmit={addIncident} />
    </div>
  );
}

/* ── Student/Parent view ── */
function DisciplinePersonalView({ role, incidents, currentUser }) {
  const studentName = role === "student"
    ? (currentUser?.full_name || "")
    : (currentUser?.linked_student_name || "");
  const myPoints    = BEHAVIOR_POINTS.find((s) => s.name === studentName) || { merits: 0, demerits: 0, net: 0 };
  const myIncidents = incidents.filter((i) => i.student === studentName);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={Award}       label="Merit Points"  value={myPoints.merits}   tone="green"  />
        <StatCard icon={TrendingDown} label="Demerit Points" value={myPoints.demerits} tone="amber"  />
        <StatCard icon={ShieldCheck} label="Net Standing"  value={`+${myPoints.net}`} tone="indigo" />
      </div>
      <Card>
        <SectionHeader title={role === "parent" ? `${studentName}'s Incident History` : "My Incident History"} />
        {myIncidents.length === 0
          ? <div style={{ textAlign: "center", padding: 24 }}><CheckCircle2 size={28} color={C.green} style={{ marginBottom: 8 }} /><div style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>No incidents on record</div><div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4 }}>Clean behavior record this term.</div></div>
          : <Table columns={[{ key: "category", label: "Category" }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusToneFn(r.status)}>{r.status}</Pill> }]} rows={myIncidents} />
        }
      </Card>
    </div>
  );
}

/* ── Root ── */
function DisciplineModule({ role, currentUser }) {
  const [incidents, setIncidents] = useState([]);
  const [loading,   setLoading]   = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("incidents").select("*").order("date", { ascending: false }).then(({ data, error }) => {
      if (error) console.warn("Incidents fetch error:", error.message);
      setIncidents((data || []).map(normalizeIncident));
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint, marginBottom: 16 }}><Loader2 size={12} className="spin" /> Syncing…</span>}
      {role === "admin"   && <DisciplineAdminView   incidents={incidents} setIncidents={setIncidents} />}
      {role === "teacher" && <DisciplineTeacherView  incidents={incidents} setIncidents={setIncidents} />}
      {(role === "student" || role === "parent") && <DisciplinePersonalView role={role} incidents={incidents} currentUser={currentUser} />}
    </div>
  );
}

export { DisciplineModule };