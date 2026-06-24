import React, { useState } from "react";
import {
  HeartPulse, Syringe, Pill as PillIcon, ClipboardPlus, AlertTriangle,
  CheckCircle2, Phone, Droplet, Info, Plus, Search
} from "lucide-react";
import { C, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Avatar, Tag, Table, Modal, statusTone } from "../components/ui";

const CLINIC_VISITS_INIT = [
  { id: 1, student: "Brian Mutasa", cls: "Form 3A", date: "2026-06-17", reason: "Headache and mild fever", treatment: "Paracetamol administered, rested in clinic for 1 hour.", followUp: "Monitor temperature tomorrow morning.", status: "Monitoring" },
  { id: 2, student: "Natasha Sibanda", cls: "Form 1A", date: "2026-06-15", reason: "Minor cut during PE", treatment: "Wound cleaned and dressed.", followUp: "None required.", status: "Resolved" },
  { id: 3, student: "Kudzai Nyamande", cls: "Form 2A", date: "2026-06-10", reason: "Asthma flare-up during sports", treatment: "Inhaler administered, recovered within 15 minutes.", followUp: "Review asthma action plan with parent.", status: "Resolved" },
  { id: 4, student: "Tapiwa Chirwa", cls: "Form 3A", date: "2026-06-18", reason: "Stomach ache after lunch", treatment: "Rested in clinic, given water.", followUp: "None required.", status: "Resolved" },
  { id: 5, student: "Maria Fernandez", cls: "Form 4A", date: "2026-06-12", reason: "Mild hives on arm", treatment: "Antihistamine given per care plan.", followUp: "Confirm allergen trigger with parent.", status: "Monitoring" },
];

const MEDICAL_PROFILES = [
  { name: "Tadiwa Mhofu", cls: "Form 4A", bloodType: "O+", allergies: "None known", chronic: "None", emergencyContact: "Mr. C. Mhofu · +263 77 412 9981" },
  { name: "Kudzai Nyamande", cls: "Form 2A", bloodType: "A+", allergies: "None known", chronic: "Asthma", emergencyContact: "Mr. P. Nyamande · +263 78 667 1290" },
  { name: "Maria Fernandez", cls: "Form 4A", bloodType: "B+", allergies: "Peanuts, shellfish", chronic: "None", emergencyContact: "Mr. A. Fernandez · +263 78 112 6654" },
  { name: "Natasha Sibanda", cls: "Form 1A", bloodType: "AB+", allergies: "None known", chronic: "None", emergencyContact: "Mr. G. Sibanda · +263 73 776 5510" },
  { name: "Brian Mutasa", cls: "Form 3A", bloodType: "O-", allergies: "Penicillin", chronic: "None", emergencyContact: "Mr. W. Mutasa · +263 77 334 8821" },
];

const MEDICATIONS = [
  { student: "Kudzai Nyamande", medication: "Salbutamol Inhaler", dosage: "2 puffs", schedule: "As needed", lastGiven: "2026-06-10", administeredBy: "School Nurse" },
  { student: "Maria Fernandez", medication: "EpiPen (self-carried)", dosage: "1 dose if needed", schedule: "Emergency only", lastGiven: "—", administeredBy: "Self / Nurse" },
];

const VACCINATIONS = [
  { student: "Tadiwa Mhofu", vaccine: "Tetanus Booster", dateGiven: "2024-02-10", nextDue: "2029-02-10", status: "Up to Date" },
  { student: "Kudzai Nyamande", vaccine: "MMR (Measles, Mumps, Rubella)", dateGiven: "2023-05-01", nextDue: "—", status: "Up to Date" },
  { student: "Brian Mutasa", vaccine: "Tetanus Booster", dateGiven: "2019-03-15", nextDue: "2024-03-15", status: "Overdue" },
  { student: "Natasha Sibanda", vaccine: "Hepatitis B", dateGiven: "2025-01-20", nextDue: "2030-01-20", status: "Up to Date" },
  { student: "Maria Fernandez", vaccine: "Tetanus Booster", dateGiven: "2021-09-01", nextDue: "2026-09-01", status: "Due Soon" },
];

const AI_HEALTH_ALERTS = [
  { student: "Kudzai Nyamande", severity: "Watch", msg: "Third asthma-related clinic visit this term — recommend an updated action plan review with parent and GP.", date: "Jun 18" },
  { student: "Maria Fernandez", severity: "Watch", msg: "Repeated mild allergic reactions logged this term — recommend confirming current allergen triggers with parent.", date: "Jun 16" },
  { student: "Brian Mutasa", severity: "High", msg: "Tetanus vaccination is overdue — recommend parent notification for catch-up scheduling.", date: "Jun 14" },
];

/* ============================== VISIT DETAIL MODAL ============================== */
function VisitModal({ visit, onResolve, onClose }) {
  if (!visit) return null;
  return (
    <Modal open={!!visit} onClose={onClose} title="Clinic Visit Record" wide>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Avatar name={visit.student} size={44} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{visit.student}</div>
          <div style={{ fontSize: 12, color: C.textMuted }}>{visit.cls} · {visit.date}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><Pill tone={statusTone(visit.status)}>{visit.status}</Pill></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Reason for Visit</div>
          <div style={{ fontSize: 13.5, color: C.text, lineHeight: 1.5 }}>{visit.reason}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Treatment Given</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{visit.treatment}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>Follow-up</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{visit.followUp}</div>
        </div>
        {visit.status === "Monitoring" && (
          <button onClick={() => onResolve(visit.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            <CheckCircle2 size={15} /> Mark as Resolved
          </button>
        )}
      </div>
    </Modal>
  );
}

function NewVisitModal({ open, onClose, onSubmit, studentNames }) {
  const [student, setStudent] = useState(studentNames[0]);
  const [reason, setReason] = useState("");

  function submit() {
    if (!reason.trim()) return;
    onSubmit({ student, reason });
    setReason("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Log Clinic Visit">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Student</div>
          <select value={student} onChange={(e) => setStudent(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
            {studentNames.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Reason for Visit</div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="What's the issue?" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5, resize: "vertical" }} />
        </div>
        <button onClick={submit} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          <ClipboardPlus size={15} /> Log Visit
        </button>
      </div>
    </Modal>
  );
}

/* ============================== ADMIN / NURSE VIEW ============================== */
function HealthAdminView() {
  const [tab, setTab] = useState("visits");
  const [visits, setVisits] = useState(CLINIC_VISITS_INIT);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [newVisitOpen, setNewVisitOpen] = useState(false);
  const [query, setQuery] = useState("");

  const studentNames = MEDICAL_PROFILES.map((p) => p.name);
  const monitoring = visits.filter((v) => v.status === "Monitoring").length;
  const overdueVax = VACCINATIONS.filter((v) => v.status === "Overdue").length;
  const filteredProfiles = MEDICAL_PROFILES.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  function resolveVisit(id) {
    setVisits((arr) => arr.map((v) => (v.id === id ? { ...v, status: "Resolved" } : v)));
    setSelectedVisit(null);
  }

  function addVisit(data) {
    const profile = MEDICAL_PROFILES.find((p) => p.name === data.student);
    setVisits((arr) => [{ id: Date.now(), date: new Date().toISOString().slice(0, 10), cls: profile ? profile.cls : "—", treatment: "Pending assessment.", followUp: "To be determined.", status: "Monitoring", ...data }, ...arr]);
    setNewVisitOpen(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={ClipboardPlus} label="Clinic Visits (Term)" value={visits.length} tone="indigo" />
        <StatCard icon={HeartPulse} label="Currently Monitoring" value={monitoring} tone="amber" />
        <StatCard icon={PillIcon} label="On Regular Medication" value={MEDICATIONS.length} tone="cyan" />
        <StatCard icon={Syringe} label="Overdue Vaccinations" value={overdueVax} tone="red" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "visits"} onClick={() => setTab("visits")}>Clinic Visits</Tag>
        <Tag active={tab === "records"} onClick={() => setTab("records")}>Medical Records</Tag>
        <Tag active={tab === "meds"} onClick={() => setTab("meds")}>Medication Tracking</Tag>
        <Tag active={tab === "vax"} onClick={() => setTab("vax")}>Vaccinations</Tag>
        <Tag active={tab === "ai"} onClick={() => setTab("ai")}>AI Health Trends</Tag>
      </div>

      {tab === "visits" && (
        <Card>
          <SectionHeader title="Clinic Visit Log" subtitle="Click a visit for full details" action={
            <button onClick={() => setNewVisitOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Log Visit
            </button>
          } />
          <Table
            onRowClick={setSelectedVisit}
            columns={[
              { key: "student", label: "Student", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.student} size={28} /><div><div style={{ fontWeight: 600 }}>{r.student}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.cls}</div></div></div> },
              { key: "reason", label: "Reason" },
              { key: "date", label: "Date" },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={visits}
          />
        </Card>
      )}

      {tab === "records" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, maxWidth: 280 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
          </div>
          <Table
            columns={[
              { key: "name", label: "Student", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.cls}</div></div></div> },
              { key: "bloodType", label: "Blood Type", render: (r) => <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Droplet size={12} color={C.red} />{r.bloodType}</span> },
              { key: "allergies", label: "Allergies", render: (r) => r.allergies === "None known" ? <span style={{ color: C.textFaint }}>None known</span> : <Pill tone="red">{r.allergies}</Pill> },
              { key: "chronic", label: "Chronic Conditions", render: (r) => r.chronic === "None" ? <span style={{ color: C.textFaint }}>None</span> : <Pill tone="amber">{r.chronic}</Pill> },
              { key: "emergencyContact", label: "Emergency Contact" },
            ]}
            rows={filteredProfiles}
          />
        </Card>
      )}

      {tab === "meds" && (
        <Card>
          <SectionHeader title="Medication Tracking" subtitle="Students with regular or as-needed medication on file" />
          <Table
            columns={[
              { key: "student", label: "Student" },
              { key: "medication", label: "Medication" },
              { key: "dosage", label: "Dosage" },
              { key: "schedule", label: "Schedule" },
              { key: "lastGiven", label: "Last Given" },
              { key: "administeredBy", label: "Administered By" },
            ]}
            rows={MEDICATIONS}
          />
        </Card>
      )}

      {tab === "vax" && (
        <Card>
          <SectionHeader title="Vaccination Records" />
          <Table
            columns={[
              { key: "student", label: "Student" },
              { key: "vaccine", label: "Vaccine" },
              { key: "dateGiven", label: "Date Given" },
              { key: "nextDue", label: "Next Due" },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={VACCINATIONS}
          />
        </Card>
      )}

      {tab === "ai" && (
        <Card>
          <SectionHeader title="AI Health Trend Detection" subtitle="Auto-flagged from clinic visit and vaccination patterns" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {AI_HEALTH_ALERTS.map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 14, borderBottom: i < AI_HEALTH_ALERTS.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                <div style={{ marginTop: 2 }}>{a.severity === "High" ? <AlertTriangle size={15} color={C.red} /> : <Info size={15} color={C.amber} />}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{a.student}</span>
                    <Pill tone={statusTone(a.severity)}>{a.severity}</Pill>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.textMuted, margin: "5px 0 0", lineHeight: 1.45 }}>{a.msg}</p>
                </div>
                <span style={{ fontSize: 11, color: C.textFaint, flexShrink: 0 }}>{a.date}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <VisitModal visit={selectedVisit} onResolve={resolveVisit} onClose={() => setSelectedVisit(null)} />
      <NewVisitModal open={newVisitOpen} onClose={() => setNewVisitOpen(false)} onSubmit={addVisit} studentNames={studentNames} />
    </div>
  );
}

/* ============================== TEACHER VIEW ============================== */
function HealthTeacherView() {
  const [newVisitOpen, setNewVisitOpen] = useState(false);
  const [visits, setVisits] = useState(CLINIC_VISITS_INIT);
  const studentNames = MEDICAL_PROFILES.map((p) => p.name);
  const myReferrals = visits.filter((v) => v.cls === "Form 4A" || v.cls === "Form 1A");

  function addVisit(data) {
    const profile = MEDICAL_PROFILES.find((p) => p.name === data.student);
    setVisits((arr) => [{ id: Date.now(), date: new Date().toISOString().slice(0, 10), cls: profile ? profile.cls : "—", treatment: "Pending assessment.", followUp: "To be determined.", status: "Monitoring", ...data }, ...arr]);
    setNewVisitOpen(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <HeartPulse size={18} color={C.cyan} />
          <span style={{ fontSize: 13.5, color: C.text }}>Need to send a student to the clinic? Log it here so the nurse has context before they arrive.</span>
        </div>
        <button onClick={() => setNewVisitOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
          <Plus size={14} /> Refer to Clinic
        </button>
      </Card>
      <Card>
        <SectionHeader title="Clinic Referrals — My Classes" subtitle="Form 4A & Form 1A" />
        {myReferrals.length > 0 ? (
          <Table columns={[{ key: "student", label: "Student" }, { key: "reason", label: "Reason" }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myReferrals} />
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 20 }}>No clinic visits logged for your classes this term.</div>
        )}
      </Card>
      <NewVisitModal open={newVisitOpen} onClose={() => setNewVisitOpen(false)} onSubmit={addVisit} studentNames={studentNames} />
    </div>
  );
}

/* ============================== STUDENT / PARENT VIEW ============================== */
function HealthPersonalView({ role }) {
  const me = MEDICAL_PROFILES[0]; // Tadiwa Mhofu, demo profile
  const myVisits = CLINIC_VISITS_INIT.filter((v) => v.student === me.name);
  const myVax = VACCINATIONS.filter((v) => v.student === me.name);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Avatar name={me.name} size={48} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{role === "parent" ? `${me.name}'s Health Record` : "My Health Record"}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>{me.cls} · Blood Type {me.bloodType}</div>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 220 }}>
          <SectionHeader title="Allergies & Conditions" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: C.textMuted }}>Allergies</span>
              {me.allergies === "None known" ? <span style={{ fontSize: 12.5, color: C.textFaint }}>None known</span> : <Pill tone="red">{me.allergies}</Pill>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: C.textMuted }}>Chronic Conditions</span>
              {me.chronic === "None" ? <span style={{ fontSize: 12.5, color: C.textFaint }}>None</span> : <Pill tone="amber">{me.chronic}</Pill>}
            </div>
          </div>
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }}>
          <SectionHeader title="Emergency Contact" />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Phone size={16} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{me.emergencyContact}</span>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader title="Vaccination Status" />
        {myVax.length > 0 ? (
          <Table columns={[{ key: "vaccine", label: "Vaccine" }, { key: "dateGiven", label: "Date Given" }, { key: "nextDue", label: "Next Due" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myVax} />
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 16 }}>No vaccination records on file.</div>
        )}
      </Card>

      <Card>
        <SectionHeader title="Recent Clinic Visits" />
        {myVisits.length > 0 ? (
          <Table columns={[{ key: "reason", label: "Reason" }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myVisits} />
        ) : (
          <div style={{ textAlign: "center", padding: 20 }}>
            <CheckCircle2 size={24} color={C.green} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, color: C.textMuted }}>No clinic visits on record this term.</div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================== ROOT (preview wrapper) ============================== */

function HealthModule({ role }) {
  if (role === "admin") return <HealthAdminView />;
  if (role === "teacher") return <HealthTeacherView />;
  return <HealthPersonalView role={role} />;
}

export { HealthModule };