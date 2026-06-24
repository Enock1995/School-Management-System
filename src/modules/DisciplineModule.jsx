import React, { useState } from "react";
import {
  AlertTriangle, ShieldCheck, Plus, CheckCircle2, UserX, TrendingDown, Award, MessageSquareWarning, Gavel, Sparkles, Info
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from "recharts";
import { C, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Avatar, Tag, Table, Modal, CustomTooltip } from "../components/ui";

function severityTone(s) { return s === "Severe" || s === "High" ? "red" : s === "Moderate" || s === "Watch" ? "amber" : "green"; }
function statusTone(s) {
  if (["Resolved", "Completed", "Active Student"].includes(s)) return "green";
  if (["Open", "Active", "Under Review"].includes(s)) return "amber";
  return "slate";
}

const STUDENT_NAMES = ["Tadiwa Mhofu", "Anesu Chitate", "Liam Osei", "Rutendo Marecha", "Brian Mutasa", "Chiedza Goredema", "Kudzai Nyamande", "Stephanie Mhike", "Tinotenda Chigumba", "Maria Fernandez", "Tapiwa Chirwa", "Natasha Sibanda"];
const CATEGORIES = ["Bullying", "Disruptive Behavior", "Dress Code Violation", "Academic Dishonesty", "Vandalism", "Fighting", "Truancy", "Disrespect to Staff"];

const INCIDENTS_INIT = [
  { id: 1, student: "Kudzai Nyamande", cls: "Form 2A", date: "2026-06-10", category: "Disruptive Behavior", severity: "Moderate", reportedBy: "Mr. S. Ndlovu", description: "Repeatedly talking during Physics lesson, ignored two verbal warnings.", actionTaken: "Verbal warning issued, parent contacted.", parentNotified: true, status: "Resolved" },
  { id: 2, student: "Liam Osei", cls: "Form 2A", date: "2026-06-15", category: "Truancy", severity: "Severe", reportedBy: "Mrs. Patience Mhike", description: "Missed three consecutive days without communication from guardian.", actionTaken: "Meeting scheduled with guardian.", parentNotified: true, status: "Open" },
  { id: 3, student: "Brian Mutasa", cls: "Form 3A", date: "2026-06-17", category: "Dress Code Violation", severity: "Minor", reportedBy: "Mrs. P. Gumbo", description: "Not wearing correct school shoes for the second time this term.", actionTaken: "Reminder issued, logged for repeat tracking.", parentNotified: false, status: "Resolved" },
  { id: 4, student: "Tapiwa Chirwa", cls: "Form 3A", date: "2026-06-18", category: "Disrespect to Staff", severity: "Moderate", reportedBy: "Mr. T. Moyo", description: "Used inappropriate language towards a teacher during class.", actionTaken: "Pending review by Head of School.", parentNotified: true, status: "Open" },
  { id: 5, student: "Kudzai Nyamande", cls: "Form 2A", date: "2026-05-22", category: "Fighting", severity: "Severe", reportedBy: "Mr. D. Banda", description: "Physical altercation with another student during break time.", actionTaken: "3-day suspension issued.", parentNotified: true, status: "Resolved" },
];

const SUSPENSIONS_INIT = [
  { id: 1, student: "Kudzai Nyamande", cls: "Form 2A", reason: "Physical altercation with another student", start: "2026-05-25", end: "2026-05-27", days: 3, status: "Completed", approvedBy: "Mrs. Patience Mhike" },
  { id: 2, student: "Joseph Manyeza", cls: "Form 4A", reason: "Repeated disruptive behavior despite prior warnings", start: "2026-06-15", end: "2026-06-17", days: 2, status: "Active", approvedBy: "Mrs. Patience Mhike" },
];

const BEHAVIOR_POINTS = [
  { name: "Natasha Sibanda", cls: "Form 1A", merits: 14, demerits: 0 },
  { name: "Rutendo Marecha", cls: "Form 1A", merits: 12, demerits: 0 },
  { name: "Tadiwa Mhofu", cls: "Form 4A", merits: 11, demerits: 1 },
  { name: "Stephanie Mhike", cls: "Form 1B", merits: 9, demerits: 0 },
  { name: "Anesu Chitate", cls: "Form 4A", merits: 7, demerits: 1 },
  { name: "Brian Mutasa", cls: "Form 3A", merits: 3, demerits: 4 },
  { name: "Tapiwa Chirwa", cls: "Form 3A", merits: 2, demerits: 5 },
  { name: "Liam Osei", cls: "Form 2A", merits: 1, demerits: 6 },
  { name: "Kudzai Nyamande", cls: "Form 2A", merits: 0, demerits: 9 },
].map((s) => ({ ...s, net: s.merits - s.demerits }));

const AI_BEHAVIOR_RISK = [
  { student: "Kudzai Nyamande", cls: "Form 2A", severity: "High", msg: "Pattern of escalating incidents combined with declining attendance places this student in the high behavioral risk band — recommend counselor referral.", date: "Jun 18" },
  { student: "Liam Osei", cls: "Form 2A", severity: "Watch", msg: "Truancy incident combined with falling grades suggests disengagement — early intervention recommended.", date: "Jun 16" },
  { student: "Tapiwa Chirwa", cls: "Form 3A", severity: "Watch", msg: "Recent disrespect incident is the second this term — recommend a check-in with the school counselor.", date: "Jun 18" },
];

/* ============================== SHARED FORMS / MODALS ============================== */
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
          <Pill tone={statusTone(incident.status)}>{incident.status}</Pill>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Category</div>
          <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{incident.category}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Description</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{incident.description}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Action Taken</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{incident.actionTaken}</div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Reported By</div>
            <div style={{ fontSize: 13, color: C.text }}>{incident.reportedBy}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Parent Notified</div>
            <Pill tone={incident.parentNotified ? "green" : "amber"}>{incident.parentNotified ? "Yes" : "Not yet"}</Pill>
          </div>
        </div>
        {incident.status === "Open" && (
          <button onClick={() => onResolve(incident.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
            <CheckCircle2 size={15} /> Mark as Resolved
          </button>
        )}
      </div>
    </Modal>
  );
}

function NewIncidentModal({ open, onClose, onSubmit }) {
  const [student, setStudent] = useState(STUDENT_NAMES[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [severity, setSeverity] = useState("Minor");
  const [description, setDescription] = useState("");

  function submit() {
    if (!description.trim()) return;
    onSubmit({ student, category, severity, description });
    setDescription("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Report a New Incident">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Student</div>
          <select value={student} onChange={(e) => setStudent(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
            {STUDENT_NAMES.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Category</div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Severity</div>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
              <option>Minor</option><option>Moderate</option><option>Severe</option>
            </select>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Description</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="What happened?" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5, resize: "vertical" }} />
        </div>
        <button onClick={submit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          <Gavel size={15} /> Submit Report
        </button>
      </div>
    </Modal>
  );
}

/* ============================== ADMIN VIEW ============================== */
function DisciplineAdminView() {
  const [tab, setTab] = useState("incidents");
  const [incidents, setIncidents] = useState(INCIDENTS_INIT);
  const [suspensions, setSuspensions] = useState(SUSPENSIONS_INIT);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);

  const openCount = incidents.filter((i) => i.status === "Open").length;
  const activeSuspensions = suspensions.filter((s) => s.status === "Active").length;
  const resolvedThisTerm = incidents.filter((i) => i.status === "Resolved").length;

  function resolveIncident(id) {
    setIncidents((arr) => arr.map((i) => (i.id === id ? { ...i, status: "Resolved" } : i)));
    setSelectedIncident(null);
  }

  function addIncident(data) {
    setIncidents((arr) => [{ id: Date.now(), date: new Date().toISOString().slice(0, 10), cls: "—", reportedBy: "Mrs. Patience Mhike", actionTaken: "Pending review.", parentNotified: false, status: "Open", ...data }, ...arr]);
    setNewIncidentOpen(false);
  }

  const topPerformers = [...BEHAVIOR_POINTS].sort((a, b) => b.net - a.net).slice(0, 4);
  const needsAttention = [...BEHAVIOR_POINTS].sort((a, b) => a.net - b.net).slice(0, 4);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={AlertTriangle} label="Open Incidents" value={openCount} tone="amber" />
        <StatCard icon={UserX} label="Active Suspensions" value={activeSuspensions} tone="red" />
        <StatCard icon={Sparkles} label="AI-Flagged Students" value={AI_BEHAVIOR_RISK.length} tone="cyan" />
        <StatCard icon={CheckCircle2} label="Resolved This Term" value={resolvedThisTerm} tone="green" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "incidents"} onClick={() => setTab("incidents")}>Incident Log</Tag>
        <Tag active={tab === "suspensions"} onClick={() => setTab("suspensions")}>Suspensions</Tag>
        <Tag active={tab === "points"} onClick={() => setTab("points")}>Behavior Points</Tag>
        <Tag active={tab === "ai"} onClick={() => setTab("ai")}>AI Risk Watch</Tag>
      </div>

      {tab === "incidents" && (
        <Card>
          <SectionHeader title="Incident Log" subtitle="Click a row for full details" action={
            <button onClick={() => setNewIncidentOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Report Incident
            </button>
          } />
          <Table
            onRowClick={setSelectedIncident}
            columns={[
              { key: "student", label: "Student", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.student} size={28} /><div><div style={{ fontWeight: 600 }}>{r.student}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.cls}</div></div></div> },
              { key: "category", label: "Category" },
              { key: "date", label: "Date" },
              { key: "severity", label: "Severity", render: (r) => <Pill tone={severityTone(r.severity)}>{r.severity}</Pill> },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={incidents}
          />
        </Card>
      )}

      {tab === "suspensions" && (
        <Card>
          <SectionHeader title="Suspension Records" action={
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Issue Suspension
            </button>
          } />
          <Table
            columns={[
              { key: "student", label: "Student", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.student} size={28} /><span style={{ fontWeight: 600 }}>{r.student}</span></div> },
              { key: "cls", label: "Class" },
              { key: "reason", label: "Reason" },
              { key: "days", label: "Days", align: "center" },
              { key: "start", label: "Start" },
              { key: "end", label: "End" },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={suspensions}
          />
        </Card>
      )}

      {tab === "points" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Behavior Points" subtitle="Net score (merits − demerits) by student, this term" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={BEHAVIOR_POINTS}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="name" stroke={C.textFaint} fontSize={10} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={60} />
                <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="net" name="Net Points" radius={[4, 4, 0, 0]}>
                  {BEHAVIOR_POINTS.map((d, i) => <Cell key={i} fill={d.net >= 0 ? C.green : C.red} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Card style={{ flex: 1, minWidth: 260 }}>
              <SectionHeader title="Top Performers" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topPerformers.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={s.name} size={26} /><span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{s.name}</span></div>
                    <Pill tone="green">+{s.net}</Pill>
                  </div>
                ))}
              </div>
            </Card>
            <Card style={{ flex: 1, minWidth: 260 }}>
              <SectionHeader title="Needs Attention" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {needsAttention.map((s) => (
                  <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={s.name} size={26} /><span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{s.name}</span></div>
                    <Pill tone="red">{s.net}</Pill>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "ai" && (
        <Card>
          <SectionHeader title="AI Behavior Risk Watch" subtitle="Auto-generated from incident, attendance and grade patterns" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {AI_BEHAVIOR_RISK.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 14, borderBottom: i < AI_BEHAVIOR_RISK.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                <div style={{ marginTop: 2 }}>{a.severity === "High" ? <AlertTriangle size={15} color={C.red} /> : <Info size={15} color={C.amber} />}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{a.student}</span>
                    <Pill tone="slate">{a.cls}</Pill>
                    <Pill tone={severityTone(a.severity)}>{a.severity}</Pill>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.textMuted, margin: "5px 0 0", lineHeight: 1.45 }}>{a.msg}</p>
                </div>
                <span style={{ fontSize: 11, color: C.textFaint, flexShrink: 0 }}>{a.date}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <IncidentDetailModal incident={selectedIncident} onResolve={resolveIncident} onClose={() => setSelectedIncident(null)} />
      <NewIncidentModal open={newIncidentOpen} onClose={() => setNewIncidentOpen(false)} onSubmit={addIncident} />
    </div>
  );
}

/* ============================== TEACHER VIEW ============================== */
function DisciplineTeacherView() {
  const teacherName = "Mr. T. Moyo";
  const [incidents, setIncidents] = useState(INCIDENTS_INIT);
  const [newIncidentOpen, setNewIncidentOpen] = useState(false);
  const myReports = incidents.filter((i) => i.reportedBy === teacherName);
  const myClassPoints = BEHAVIOR_POINTS.filter((s) => s.cls === "Form 4A" || s.cls === "Form 1A");

  function addIncident(data) {
    setIncidents((arr) => [{ id: Date.now(), date: new Date().toISOString().slice(0, 10), cls: "—", reportedBy: teacherName, actionTaken: "Pending review.", parentNotified: false, status: "Open", ...data }, ...arr]);
    setNewIncidentOpen(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <MessageSquareWarning size={18} color={C.cyan} />
          <span style={{ fontSize: 13.5, color: C.text }}>Noticed a behavior issue in your class? Log it here — the Head of School reviews every report.</span>
        </div>
        <button onClick={() => setNewIncidentOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
          <Plus size={14} /> Report Incident
        </button>
      </Card>
      <Card>
        <SectionHeader title="Incidents I've Reported" />
        {myReports.length > 0 ? (
          <Table
            columns={[
              { key: "student", label: "Student" },
              { key: "category", label: "Category" },
              { key: "date", label: "Date" },
              { key: "severity", label: "Severity", render: (r) => <Pill tone={severityTone(r.severity)}>{r.severity}</Pill> },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={myReports}
          />
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 20 }}>You haven't reported any incidents yet.</div>
        )}
      </Card>
      <Card>
        <SectionHeader title="My Classes — Behavior Points" subtitle="Form 4A & Form 1A" />
        <Table columns={[{ key: "name", label: "Student" }, { key: "cls", label: "Class" }, { key: "merits", label: "Merits" }, { key: "demerits", label: "Demerits" }, { key: "net", label: "Net", render: (r) => <Pill tone={r.net >= 0 ? "green" : "red"}>{r.net >= 0 ? "+" : ""}{r.net}</Pill> }]} rows={myClassPoints} />
      </Card>
      <NewIncidentModal open={newIncidentOpen} onClose={() => setNewIncidentOpen(false)} onSubmit={addIncident} />
    </div>
  );
}

/* ============================== STUDENT / PARENT VIEW ============================== */
function DisciplinePersonalView({ role }) {
  const studentName = "Tadiwa Mhofu";
  const myPoints = BEHAVIOR_POINTS.find((s) => s.name === studentName);
  const myIncidents = INCIDENTS_INIT.filter((i) => i.student === studentName);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={Award} label="Merit Points" value={myPoints.merits} tone="green" />
        <StatCard icon={TrendingDown} label="Demerit Points" value={myPoints.demerits} tone="amber" />
        <StatCard icon={ShieldCheck} label="Net Standing" value={`+${myPoints.net}`} tone="indigo" />
      </div>
      <Card>
        <SectionHeader title={role === "parent" ? `${studentName}'s Incident History` : "My Incident History"} />
        {myIncidents.length > 0 ? (
          <Table columns={[{ key: "category", label: "Category" }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myIncidents} />
        ) : (
          <div style={{ textAlign: "center", padding: 24 }}>
            <CheckCircle2 size={28} color={C.green} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>No incidents on record</div>
            <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4 }}>{role === "parent" ? `${studentName} has a clean behavior record this term.` : "Keep up the great behavior this term!"}</div>
          </div>
        )}
      </Card>
    </div>
  );
}

function DisciplineModule({ role }) {
  if (role === "admin") return <DisciplineAdminView />;
  if (role === "teacher") return <DisciplineTeacherView />;
  return <DisciplinePersonalView role={role} />;
}

export { DisciplineModule };
