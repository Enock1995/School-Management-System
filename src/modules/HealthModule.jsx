import React, { useState, useEffect } from "react";
import {
  HeartPulse, Syringe, ClipboardPlus, AlertTriangle, CheckCircle2,
  Phone, Info, Plus, Loader2, Trash2, Pencil
} from "lucide-react";
import { C } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Avatar, Tag, Table, Modal, statusTone } from "../components/ui";
import { CLASSES } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

function normalizeVisit(r)       { return { ...r, followUp: r.followUp ?? r.follow_up }; }
function normalizeProfile(r)     { return { ...r, bloodType: r.bloodType ?? r.blood_type, emergencyContact: r.emergencyContact ?? r.emergency_contact }; }
function normalizeMedication(r)  { return { ...r, lastGiven: r.lastGiven ?? r.last_given, administeredBy: r.administeredBy ?? r.administered_by }; }
function normalizeVaccination(r) { return { ...r, dateGiven: r.dateGiven ?? r.date_given, nextDue: r.nextDue ?? r.next_due }; }

const BLOOD_TYPES = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const VAX_STATUSES = ["Up to Date","Due Soon","Overdue"];

const AI_HEALTH_ALERTS = [
  { student: "Kudzai Nyamande", severity: "Watch", msg: "Third asthma-related clinic visit this term — recommend an updated action plan review with parent and GP." },
  { student: "Maria Fernandez",  severity: "Watch", msg: "Repeated mild allergic reactions logged this term — recommend confirming allergen triggers with parent." },
  { student: "Brian Mutasa",     severity: "High",  msg: "Tetanus vaccination is overdue — recommend parent notification for catch-up scheduling." },
];

function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <Icon size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

/* ── Visit detail modal ── */
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
      {[["Reason", visit.reason], ["Treatment", visit.treatment], ["Follow-up", visit.followUp]].map(([k, v]) => (
        <div key={k} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
          <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{v}</div>
        </div>
      ))}
      {visit.status === "Monitoring" && (
        <button onClick={() => onResolve(visit.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer", width: "100%", marginTop: 6 }}>
          <CheckCircle2 size={15} /> Mark as Resolved
        </button>
      )}
    </Modal>
  );
}

/* ── Admin view ── */
function HealthAdminView({ visits, setVisits, profiles, setProfiles, medications, setMedications, vaccinations, setVaccinations, loading }) {
  const [tab, setTab] = useState("visits");
  const [selectedVisit, setSelectedVisit] = useState(null);

  /* visit modal */
  const [visitModal, setVisitModal] = useState(false);
  const [visitForm,  setVisitForm]  = useState({ student: "", cls: "Form 4A", reason: "", treatment: "", follow_up: "" });
  const [savingVisit, setSavingVisit] = useState(false);

  /* profile modal */
  const [profileModal, setProfileModal] = useState(null);
  const [profileForm,  setProfileForm]  = useState({ name: "", cls: "Form 4A", blood_type: "O+", allergies: "None known", chronic: "None", emergency_contact: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  /* medication modal */
  const [medModal, setMedModal] = useState(false);
  const [medForm,  setMedForm]  = useState({ student: "", medication: "", dosage: "", schedule: "", last_given: "—", administered_by: "School Nurse" });
  const [savingMed, setSavingMed] = useState(false);

  /* vax modal */
  const [vaxModal, setVaxModal] = useState(false);
  const [vaxForm,  setVaxForm]  = useState({ student: "", vaccine: "", date_given: "", next_due: "", status: "Up to Date" });
  const [savingVax, setSavingVax] = useState(false);

  /* confirm delete */
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  function resolveVisit(id) {
    setVisits((arr) => arr.map((v) => v.id === id ? { ...v, status: "Resolved" } : v));
    setSelectedVisit(null);
    if (!isSupabaseConfigured) return;
    supabase.from("clinic_visits").update({ status: "Resolved" }).eq("id", id).then(({ error }) => { if (error) console.warn("Resolve error:", error.message); });
  }

  function submitVisit() {
    if (!visitForm.student.trim() || !visitForm.reason.trim()) return;
    setSavingVisit(true);
    const row = { ...visitForm, date: new Date().toISOString().slice(0, 10), status: "Monitoring" };
    if (isSupabaseConfigured) {
      supabase.from("clinic_visits").insert(row).select().single().then(({ data, error }) => {
        if (error) console.warn("Visit insert error:", error.message);
        setVisits((arr) => [normalizeVisit(data || { id: Date.now(), ...row }), ...arr]);
        setSavingVisit(false); setVisitModal(false); setVisitForm({ student: "", cls: "Form 4A", reason: "", treatment: "", follow_up: "" });
      });
    } else {
      setVisits((arr) => [normalizeVisit({ id: Date.now(), ...row }), ...arr]);
      setSavingVisit(false); setVisitModal(false);
    }
  }

  function submitProfile() {
    if (!profileForm.name.trim()) return;
    setSavingProfile(true);
    const isEdit = profileModal?.mode === "edit";
    if (isEdit) {
      const id = profileModal.data.id;
      if (isSupabaseConfigured) {
        supabase.from("medical_profiles").update(profileForm).eq("id", id).then(({ error }) => {
          if (error) console.warn("Profile update error:", error.message);
          setProfiles((arr) => arr.map((p) => p.id === id ? normalizeProfile({ ...p, ...profileForm }) : p));
          setSavingProfile(false); setProfileModal(null);
        });
      } else {
        setProfiles((arr) => arr.map((p) => p.id === id ? normalizeProfile({ ...p, ...profileForm }) : p));
        setSavingProfile(false); setProfileModal(null);
      }
    } else {
      if (isSupabaseConfigured) {
        supabase.from("medical_profiles").insert(profileForm).select().single().then(({ data, error }) => {
          if (error) console.warn("Profile insert error:", error.message);
          setProfiles((arr) => [...arr, normalizeProfile(data || { id: Date.now(), ...profileForm })]);
          setSavingProfile(false); setProfileModal(null);
        });
      } else {
        setProfiles((arr) => [...arr, normalizeProfile({ id: Date.now(), ...profileForm })]);
        setSavingProfile(false); setProfileModal(null);
      }
    }
  }

  function submitMed() {
    if (!medForm.student.trim() || !medForm.medication.trim()) return;
    setSavingMed(true);
    if (isSupabaseConfigured) {
      supabase.from("medications").insert(medForm).select().single().then(({ data, error }) => {
        if (error) console.warn("Medication insert error:", error.message);
        setMedications((arr) => [...arr, normalizeMedication(data || { id: Date.now(), ...medForm })]);
        setSavingMed(false); setMedModal(false); setMedForm({ student: "", medication: "", dosage: "", schedule: "", last_given: "—", administered_by: "School Nurse" });
      });
    } else {
      setMedications((arr) => [...arr, normalizeMedication({ id: Date.now(), ...medForm })]);
      setSavingMed(false); setMedModal(false);
    }
  }

  function submitVax() {
    if (!vaxForm.student.trim() || !vaxForm.vaccine.trim()) return;
    setSavingVax(true);
    if (isSupabaseConfigured) {
      supabase.from("vaccinations").insert(vaxForm).select().single().then(({ data, error }) => {
        if (error) console.warn("Vaccination insert error:", error.message);
        setVaccinations((arr) => [...arr, normalizeVaccination(data || { id: Date.now(), ...vaxForm })]);
        setSavingVax(false); setVaxModal(false); setVaxForm({ student: "", vaccine: "", date_given: "", next_due: "", status: "Up to Date" });
      });
    } else {
      setVaccinations((arr) => [...arr, normalizeVaccination({ id: Date.now(), ...vaxForm })]);
      setSavingVax(false); setVaxModal(false);
    }
  }

  function confirmAndDelete() {
    setDeleting(true);
    const { type, id } = confirmDelete;
    const tableMap = { visit: "clinic_visits", profile: "medical_profiles", medication: "medications", vaccination: "vaccinations" };
    if (isSupabaseConfigured) {
      supabase.from(tableMap[type]).delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        if (type === "visit")       setVisits((arr) => arr.filter((x) => x.id !== id));
        if (type === "profile")     setProfiles((arr) => arr.filter((x) => x.id !== id));
        if (type === "medication")  setMedications((arr) => arr.filter((x) => x.id !== id));
        if (type === "vaccination") setVaccinations((arr) => arr.filter((x) => x.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      if (type === "visit")       setVisits((arr) => arr.filter((x) => x.id !== id));
      if (type === "profile")     setProfiles((arr) => arr.filter((x) => x.id !== id));
      if (type === "medication")  setMedications((arr) => arr.filter((x) => x.id !== id));
      if (type === "vaccination") setVaccinations((arr) => arr.filter((x) => x.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={HeartPulse} label="Clinic Visits"   value={visits.length}                                          tone="indigo" />
        <StatCard icon={ClipboardPlus} label="Monitoring"   value={visits.filter((v) => v.status === "Monitoring").length} tone="amber"  />
        <StatCard icon={AlertTriangle} label="Overdue Vax"  value={vaccinations.filter((v) => v.status === "Overdue").length} tone="red" />
        <StatCard icon={Syringe}       label="On Medication" value={medications.length}                                    tone="cyan"   />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Tag active={tab === "visits"}      onClick={() => setTab("visits")}>Clinic Visits</Tag>
        <Tag active={tab === "profiles"}    onClick={() => setTab("profiles")}>Medical Profiles</Tag>
        <Tag active={tab === "medications"} onClick={() => setTab("medications")}>Medications</Tag>
        <Tag active={tab === "vaccinations"}onClick={() => setTab("vaccinations")}>Vaccinations</Tag>
        <Tag active={tab === "insights"}    onClick={() => setTab("insights")}>AI Insights</Tag>
      </div>

      {tab === "visits" && (
        <Card>
          <SectionHeader title="Clinic Visit Log" action={
            <button onClick={() => setVisitModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Log Visit
            </button>
          } />
          {loading ? null : visits.length === 0
            ? <EmptyState icon={ClipboardPlus} message="No clinic visits on record." hint='Click "Log Visit" to record the first visit.' />
            : <Table onRowClick={setSelectedVisit} columns={[
                { key: "student",  label: "Student" },
                { key: "cls",      label: "Class" },
                { key: "reason",   label: "Reason" },
                { key: "date",     label: "Date" },
                { key: "status",   label: "Status",  render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
                { key: "actions",  label: "", render: (r) => <button style={iconBtn(C.red)} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "visit", id: r.id, label: `${r.student} — ${r.reason}` }); }}><Trash2 size={14} /></button> },
              ]} rows={visits} />
          }
        </Card>
      )}

      {tab === "profiles" && (
        <Card>
          <SectionHeader title="Medical Profiles" action={
            <button onClick={() => { setProfileForm({ name: "", cls: "Form 4A", blood_type: "O+", allergies: "None known", chronic: "None", emergency_contact: "" }); setProfileModal({ mode: "add" }); }} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Profile
            </button>
          } />
          {loading ? null : profiles.length === 0
            ? <EmptyState icon={HeartPulse} message="No medical profiles on record." hint='Click "Add Profile" to add the first student health profile.' />
            : <Table columns={[
                { key: "name",             label: "Student" },
                { key: "cls",              label: "Class" },
                { key: "bloodType",        label: "Blood Type", render: (r) => <Pill tone="red">{r.bloodType}</Pill> },
                { key: "allergies",        label: "Allergies",  render: (r) => r.allergies === "None known" ? <span style={{ color: C.textFaint }}>—</span> : <Pill tone="amber">{r.allergies}</Pill> },
                { key: "chronic",          label: "Conditions", render: (r) => r.chronic === "None" ? <span style={{ color: C.textFaint }}>—</span> : <Pill tone="amber">{r.chronic}</Pill> },
                { key: "emergencyContact", label: "Emergency Contact" },
                { key: "actions",          label: "", render: (r) => (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={iconBtn(C.textMuted)} onClick={(e) => { e.stopPropagation(); setProfileForm({ name: r.name, cls: r.cls, blood_type: r.bloodType, allergies: r.allergies, chronic: r.chronic, emergency_contact: r.emergencyContact }); setProfileModal({ mode: "edit", data: r }); }}><Pencil size={14} /></button>
                    <button style={iconBtn(C.red)}       onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "profile", id: r.id, label: r.name }); }}><Trash2 size={14} /></button>
                  </div>
                ) },
              ]} rows={profiles} />
          }
        </Card>
      )}

      {tab === "medications" && (
        <Card>
          <SectionHeader title="Medications on File" action={
            <button onClick={() => setMedModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Medication
            </button>
          } />
          {loading ? null : medications.length === 0
            ? <EmptyState icon={Syringe} message="No medications on record." hint='Click "Add Medication" to record a student medication plan.' />
            : <Table columns={[
                { key: "student",        label: "Student" },
                { key: "medication",     label: "Medication" },
                { key: "dosage",         label: "Dosage" },
                { key: "schedule",       label: "Schedule" },
                { key: "lastGiven",      label: "Last Given" },
                { key: "administeredBy", label: "By" },
                { key: "actions",        label: "", render: (r) => <button style={iconBtn(C.red)} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "medication", id: r.id, label: `${r.student} — ${r.medication}` }); }}><Trash2 size={14} /></button> },
              ]} rows={medications} />
          }
        </Card>
      )}

      {tab === "vaccinations" && (
        <Card>
          <SectionHeader title="Vaccination Records" action={
            <button onClick={() => setVaxModal(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Record
            </button>
          } />
          {loading ? null : vaccinations.length === 0
            ? <EmptyState icon={Syringe} message="No vaccination records on file." hint='Click "Add Record" to log the first vaccination.' />
            : <Table columns={[
                { key: "student",  label: "Student" },
                { key: "vaccine",  label: "Vaccine" },
                { key: "dateGiven",label: "Date Given" },
                { key: "nextDue",  label: "Next Due" },
                { key: "status",   label: "Status",  render: (r) => <Pill tone={r.status === "Up to Date" ? "green" : r.status === "Due Soon" ? "amber" : "red"}>{r.status}</Pill> },
                { key: "actions",  label: "", render: (r) => <button style={iconBtn(C.red)} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "vaccination", id: r.id, label: `${r.student} — ${r.vaccine}` }); }}><Trash2 size={14} /></button> },
              ]} rows={vaccinations} />
          }
        </Card>
      )}

      {tab === "insights" && (
        <Card>
          <SectionHeader title="AI Health Risk Alerts" />
          {visits.length === 0
            ? <EmptyState icon={Info} message="No health data to analyse yet." hint="Log clinic visits to enable AI health insights." />
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {AI_HEALTH_ALERTS.map((a) => (
                  <div key={a.student} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: 14, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12 }}>
                    <div style={{ marginTop: 2 }}>{a.severity === "High" ? <AlertTriangle size={16} color={C.red} /> : <Info size={16} color={C.amber} />}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{a.student}</div>
                      <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>{a.msg}</div>
                    </div>
                    <Pill tone={a.severity === "High" ? "red" : "amber"} style={{ marginLeft: "auto", flexShrink: 0 }}>{a.severity}</Pill>
                  </div>
                ))}
              </div>
          }
        </Card>
      )}

      <VisitModal visit={selectedVisit} onResolve={resolveVisit} onClose={() => setSelectedVisit(null)} />

      {/* Log Visit Modal */}
      <Modal open={visitModal} onClose={() => setVisitModal(false)} title="Log Clinic Visit">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 2 }}><label style={L}>Student Name</label><input placeholder="e.g. Brian Mutasa" value={visitForm.student} onChange={(e) => setVisitForm((f) => ({ ...f, student: e.target.value }))} style={F} /></div>
            <div style={{ flex: 1 }}><label style={L}>Class</label><select value={visitForm.cls} onChange={(e) => setVisitForm((f) => ({ ...f, cls: e.target.value }))} style={F}>{CLASSES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          </div>
          <div><label style={L}>Reason for Visit</label><textarea rows={2} placeholder="What's the issue?" value={visitForm.reason} onChange={(e) => setVisitForm((f) => ({ ...f, reason: e.target.value }))} style={{ ...F, resize: "vertical" }} /></div>
          <div><label style={L}>Treatment Given</label><textarea rows={2} placeholder="Treatment administered…" value={visitForm.treatment} onChange={(e) => setVisitForm((f) => ({ ...f, treatment: e.target.value }))} style={{ ...F, resize: "vertical" }} /></div>
          <div><label style={L}>Follow-up Notes</label><input placeholder="e.g. None required." value={visitForm.follow_up} onChange={(e) => setVisitForm((f) => ({ ...f, follow_up: e.target.value }))} style={F} /></div>
          <button onClick={submitVisit} disabled={savingVisit || !visitForm.student.trim() || !visitForm.reason.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: savingVisit ? 0.7 : 1 }}>
            {savingVisit ? <><Loader2 size={14} className="spin" /> Saving…</> : "Log Visit"}
          </button>
        </div>
      </Modal>

      {/* Add/Edit Profile Modal */}
      <Modal open={!!profileModal} onClose={() => setProfileModal(null)} title={profileModal?.mode === "edit" ? "Edit Medical Profile" : "Add Medical Profile"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 2 }}><label style={L}>Student Name</label><input placeholder="e.g. Tadiwa Mhofu" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} style={F} /></div>
            <div style={{ flex: 1 }}><label style={L}>Class</label><select value={profileForm.cls} onChange={(e) => setProfileForm((f) => ({ ...f, cls: e.target.value }))} style={F}>{CLASSES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>Blood Type</label><select value={profileForm.blood_type} onChange={(e) => setProfileForm((f) => ({ ...f, blood_type: e.target.value }))} style={F}>{BLOOD_TYPES.map((b) => <option key={b}>{b}</option>)}</select></div>
            <div style={{ flex: 2 }}><label style={L}>Allergies</label><input placeholder="e.g. Peanuts, Penicillin" value={profileForm.allergies} onChange={(e) => setProfileForm((f) => ({ ...f, allergies: e.target.value }))} style={F} /></div>
          </div>
          <div><label style={L}>Chronic Conditions</label><input placeholder="e.g. Asthma, Diabetes" value={profileForm.chronic} onChange={(e) => setProfileForm((f) => ({ ...f, chronic: e.target.value }))} style={F} /></div>
          <div><label style={L}>Emergency Contact</label><input placeholder="e.g. Mr. J. Mutasa · +263 77 …" value={profileForm.emergency_contact} onChange={(e) => setProfileForm((f) => ({ ...f, emergency_contact: e.target.value }))} style={F} /></div>
          <button onClick={submitProfile} disabled={savingProfile || !profileForm.name.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: savingProfile ? 0.7 : 1 }}>
            {savingProfile ? <><Loader2 size={14} className="spin" /> Saving…</> : profileModal?.mode === "edit" ? "Save Changes" : "Add Profile"}
          </button>
        </div>
      </Modal>

      {/* Add Medication Modal */}
      <Modal open={medModal} onClose={() => setMedModal(false)} title="Add Medication">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={L}>Student Name</label><input placeholder="e.g. Kudzai Nyamande" value={medForm.student} onChange={(e) => setMedForm((f) => ({ ...f, student: e.target.value }))} style={F} /></div>
          <div><label style={L}>Medication Name</label><input placeholder="e.g. Salbutamol Inhaler" value={medForm.medication} onChange={(e) => setMedForm((f) => ({ ...f, medication: e.target.value }))} style={F} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>Dosage</label><input placeholder="e.g. 2 puffs" value={medForm.dosage} onChange={(e) => setMedForm((f) => ({ ...f, dosage: e.target.value }))} style={F} /></div>
            <div style={{ flex: 1 }}><label style={L}>Schedule</label><input placeholder="e.g. As needed" value={medForm.schedule} onChange={(e) => setMedForm((f) => ({ ...f, schedule: e.target.value }))} style={F} /></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>Last Given</label><input placeholder="e.g. 2026-06-10 or —" value={medForm.last_given} onChange={(e) => setMedForm((f) => ({ ...f, last_given: e.target.value }))} style={F} /></div>
            <div style={{ flex: 1 }}><label style={L}>Administered By</label><input placeholder="School Nurse" value={medForm.administered_by} onChange={(e) => setMedForm((f) => ({ ...f, administered_by: e.target.value }))} style={F} /></div>
          </div>
          <button onClick={submitMed} disabled={savingMed || !medForm.student.trim() || !medForm.medication.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: savingMed ? 0.7 : 1 }}>
            {savingMed ? <><Loader2 size={14} className="spin" /> Saving…</> : "Add Medication"}
          </button>
        </div>
      </Modal>

      {/* Add Vaccination Modal */}
      <Modal open={vaxModal} onClose={() => setVaxModal(false)} title="Add Vaccination Record">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={L}>Student Name</label><input placeholder="e.g. Tadiwa Mhofu" value={vaxForm.student} onChange={(e) => setVaxForm((f) => ({ ...f, student: e.target.value }))} style={F} /></div>
          <div><label style={L}>Vaccine Name</label><input placeholder="e.g. Tetanus Booster" value={vaxForm.vaccine} onChange={(e) => setVaxForm((f) => ({ ...f, vaccine: e.target.value }))} style={F} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>Date Given</label><input placeholder="YYYY-MM-DD" value={vaxForm.date_given} onChange={(e) => setVaxForm((f) => ({ ...f, date_given: e.target.value }))} style={F} /></div>
            <div style={{ flex: 1 }}><label style={L}>Next Due</label><input placeholder="YYYY-MM-DD or —" value={vaxForm.next_due} onChange={(e) => setVaxForm((f) => ({ ...f, next_due: e.target.value }))} style={F} /></div>
          </div>
          <div><label style={L}>Status</label><select value={vaxForm.status} onChange={(e) => setVaxForm((f) => ({ ...f, status: e.target.value }))} style={F}>{VAX_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          <button onClick={submitVax} disabled={savingVax || !vaxForm.student.trim() || !vaxForm.vaccine.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: savingVax ? 0.7 : 1 }}>
            {savingVax ? <><Loader2 size={14} className="spin" /> Saving…</> : "Add Record"}
          </button>
        </div>
      </Modal>

      {/* Confirm Delete */}
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

/* ── Teacher view ── */
function HealthTeacherView({ visits, setVisits }) {
  const teacherName = "Mr. T. Moyo";
  const [newVisitOpen, setNewVisitOpen] = useState(false);
  const [visitForm, setVisitForm] = useState({ student: "", cls: "Form 4A", reason: "" });
  const [saving, setSaving] = useState(false);
  const myReferrals = visits.filter((v) => v.cls === "Form 4A" || v.cls === "Form 1A");
  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };

  function submitReferral() {
    if (!visitForm.student.trim() || !visitForm.reason.trim()) return;
    setSaving(true);
    const row = { ...visitForm, date: new Date().toISOString().slice(0, 10), treatment: "Referred by teacher.", follow_up: "Pending nurse assessment.", status: "Monitoring" };
    if (isSupabaseConfigured) {
      supabase.from("clinic_visits").insert(row).select().single().then(({ data, error }) => {
        if (error) console.warn("Referral insert error:", error.message);
        setVisits((arr) => [{ ...(data || { id: Date.now(), ...row }), followUp: row.follow_up }, ...arr]);
        setSaving(false); setNewVisitOpen(false); setVisitForm({ student: "", cls: "Form 4A", reason: "" });
      });
    } else {
      setVisits((arr) => [{ id: Date.now(), ...row, followUp: row.follow_up }, ...arr]);
      setSaving(false); setNewVisitOpen(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 13.5, color: C.text }}>Have a student who needs clinic attention? Refer them here.</span>
        <button onClick={() => setNewVisitOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Refer to Clinic
        </button>
      </Card>
      <Card>
        <SectionHeader title="Clinic Referrals — My Classes" />
        {myReferrals.length === 0
          ? <EmptyState icon={HeartPulse} message="No clinic visits for your classes yet." />
          : <Table columns={[{ key: "student", label: "Student" }, { key: "reason", label: "Reason" }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myReferrals} />
        }
      </Card>
      <Modal open={newVisitOpen} onClose={() => setNewVisitOpen(false)} title="Refer Student to Clinic">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 2 }}><label style={L}>Student Name</label><input placeholder="e.g. Brian Mutasa" value={visitForm.student} onChange={(e) => setVisitForm((f) => ({ ...f, student: e.target.value }))} style={F} /></div>
            <div style={{ flex: 1 }}><label style={L}>Class</label><select value={visitForm.cls} onChange={(e) => setVisitForm((f) => ({ ...f, cls: e.target.value }))} style={F}>{CLASSES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
          </div>
          <div><label style={L}>Reason</label><textarea rows={3} value={visitForm.reason} onChange={(e) => setVisitForm((f) => ({ ...f, reason: e.target.value }))} placeholder="Describe the issue…" style={{ ...F, resize: "vertical" }} /></div>
          <button onClick={submitReferral} disabled={saving || !visitForm.student.trim() || !visitForm.reason.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : "Submit Referral"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ── Student/Parent view ── */
function HealthPersonalView({ role, visits, profiles, vaccinations }) {
  const me = profiles[0];
  if (!me) return <Card><EmptyState icon={HeartPulse} message="No health profile on record." hint="Contact the school clinic to set up your health profile." /></Card>;
  const myVisits = visits.filter((v) => v.student === me.name);
  const myVax    = vaccinations.filter((v) => v.student === me.name);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
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
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12.5, color: C.textMuted }}>Allergies</span>{me.allergies === "None known" ? <span style={{ color: C.textFaint }}>None known</span> : <Pill tone="red">{me.allergies}</Pill>}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12.5, color: C.textMuted }}>Conditions</span>{me.chronic === "None" ? <span style={{ color: C.textFaint }}>None</span> : <Pill tone="amber">{me.chronic}</Pill>}</div>
          </div>
        </Card>
        <Card style={{ flex: 1, minWidth: 220 }}>
          <SectionHeader title="Emergency Contact" />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Phone size={16} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{me.emergencyContact}</span></div>
        </Card>
      </div>
      <Card>
        <SectionHeader title="Vaccination Status" />
        {myVax.length === 0 ? <EmptyState icon={Syringe} message="No vaccination records on file." /> : <Table columns={[{ key: "vaccine", label: "Vaccine" }, { key: "dateGiven", label: "Date Given" }, { key: "nextDue", label: "Next Due" }, { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "Up to Date" ? "green" : r.status === "Due Soon" ? "amber" : "red"}>{r.status}</Pill> }]} rows={myVax} />}
      </Card>
      <Card>
        <SectionHeader title="Recent Clinic Visits" />
        {myVisits.length === 0 ? <div style={{ textAlign: "center", padding: 20 }}><CheckCircle2 size={24} color={C.green} style={{ marginBottom: 8 }} /><div style={{ fontSize: 13, color: C.textMuted }}>No clinic visits this term.</div></div> : <Table columns={[{ key: "reason", label: "Reason" }, { key: "date", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myVisits} />}
      </Card>
    </div>
  );
}

/* ── Root ── */
function HealthModule({ role }) {
  const [visits,        setVisits]        = useState([]);
  const [profiles,      setProfiles]      = useState([]);
  const [medications,   setMedications]   = useState([]);
  const [vaccinations,  setVaccinations]  = useState([]);
  const [loading,       setLoading]       = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("clinic_visits").select("*").order("date", { ascending: false }),
      supabase.from("medical_profiles").select("*").order("name"),
      supabase.from("medications").select("*").order("student"),
      supabase.from("vaccinations").select("*").order("student"),
    ]).then(([vR, pR, mR, xR]) => {
      setVisits((vR.data || []).map(normalizeVisit));
      setProfiles((pR.data || []).map(normalizeProfile));
      setMedications((mR.data || []).map(normalizeMedication));
      setVaccinations((xR.data || []).map(normalizeVaccination));
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint, marginBottom: 16 }}><Loader2 size={12} className="spin" /> Syncing…</span>}
      {role === "admin"   && <HealthAdminView visits={visits} setVisits={setVisits} profiles={profiles} setProfiles={setProfiles} medications={medications} setMedications={setMedications} vaccinations={vaccinations} setVaccinations={setVaccinations} loading={loading} />}
      {role === "teacher" && <HealthTeacherView visits={visits} setVisits={setVisits} />}
      {(role === "student" || role === "parent") && <HealthPersonalView role={role} visits={visits} profiles={profiles} vaccinations={vaccinations} />}
    </div>
  );
}

export { HealthModule };