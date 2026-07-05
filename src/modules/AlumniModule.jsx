import React, { useState, useEffect } from "react";
import {
  Phone, Plus, Search, Users, CalendarDays, MapPin, Award, Wallet,
  Handshake, Mail, Loader2
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { C, fmtMoney, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Avatar, Tag, Table, Modal, CustomTooltip, statusTone } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const EVENT_TYPES = ["Reunion", "Networking", "Fundraiser", "Workshop", "Other"];

function computeDonationTrend(donations) {
  const byMonth = {};
  donations.forEach((d) => {
    const dateObj = new Date(d.date);
    if (Number.isNaN(dateObj.getTime())) return;
    const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    const label = dateObj.toLocaleDateString("en-US", { month: "short" });
    if (!byMonth[key]) byMonth[key] = { label, total: 0 };
    byMonth[key].total += Number(d.amount);
  });
  return Object.keys(byMonth).sort().map((key) => ({ month: byMonth[key].label, raised: byMonth[key].total }));
}

function normalizeAlumnus(row) {
  return { ...row, gradYear: row.gradYear ?? row.grad_year, donorStatus: row.donorStatus ?? row.donor_status };
}

const EMPTY_ALUMNUS_FORM = { name: "", gradYear: new Date().getFullYear(), profession: "", company: "", location: "Harare, ZW", email: "", phone: "", donorStatus: "Non-donor" };
const EMPTY_EVENT_FORM = { title: "", date: "", venue: "", type: "Reunion" };
const EMPTY_MATCH_FORM = { mentor: "", field: "", student: "" };

const fieldStyle = { width: "100%", background: "var(--surface2, #1e2235)", border: "1px solid var(--border, #2a3050)", borderRadius: 10, padding: "9px 12px", color: "var(--text, #e2e8f0)", fontSize: 13, boxSizing: "border-box" };
const labelStyle = { fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };

/* ============================== ALUMNI DETAIL MODAL ============================== */
function AlumniModal({ alum, donations, onClose }) {
  if (!alum) return null;
  const alumDonations = donations.filter((d) => d.alumnus === alum.name);
  return (
    <Modal open={!!alum} onClose={onClose} title={alum.name} wide>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <Avatar name={alum.name} size={48} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{alum.name}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>{alum.profession} · {alum.company}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><Pill tone={statusTone(alum.donorStatus)}>{alum.donorStatus}</Pill></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        {[["Graduation Year", alum.gradYear], ["Location", alum.location]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 3 }}>{v}</div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={13} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{alum.email}</span></div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={13} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{alum.phone}</span></div>
      </div>
      <div style={{ fontSize: 12, color: C.textFaint, textTransform: "uppercase", marginBottom: 10 }}>Donation History</div>
      {alumDonations.length > 0 ? (
        <Table columns={[{ key: "campaign", label: "Campaign" }, { key: "amount", label: "Amount", render: (r) => fmtMoney(r.amount) }, { key: "date", label: "Date" }]} rows={alumDonations} />
      ) : (
        <div style={{ fontSize: 13, color: C.textMuted }}>No donations on record yet.</div>
      )}
    </Modal>
  );
}

/* ============================== ADMIN VIEW ============================== */
function AlumniAdminView({ alumni, donations, events, mentorship, loading, onAlumnusAdded, onEventAdded, onMatchAdded }) {
  const [tab, setTab] = useState("directory");
  const [query, setQuery] = useState("");
  const [selectedAlum, setSelectedAlum] = useState(null);

  const [addAlumOpen, setAddAlumOpen] = useState(false);
  const [alumForm, setAlumForm] = useState(EMPTY_ALUMNUS_FORM);
  const [savingAlum, setSavingAlum] = useState(false);

  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventForm, setEventForm] = useState(EMPTY_EVENT_FORM);
  const [savingEvent, setSavingEvent] = useState(false);

  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [matchForm, setMatchForm] = useState({ ...EMPTY_MATCH_FORM, mentor: alumni[0]?.name || "" });
  const [savingMatch, setSavingMatch] = useState(false);

  const filtered = alumni.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  const totalRaised = donations.reduce((s, d) => s + Number(d.amount || 0), 0);
  const donorCount = alumni.filter((a) => a.donorStatus === "Donor").length;
  const upcomingEvents = events.filter((e) => e.status === "Upcoming").length;
  const donationTrend = computeDonationTrend(donations);

  function submitAlum() {
    if (!alumForm.name.trim() || !alumForm.profession.trim()) return;
    setSavingAlum(true);
    const newId = `AL-${String(alumni.length + 1).padStart(2, "0")}`;
    onAlumnusAdded({ id: newId, ...alumForm, gradYear: Number(alumForm.gradYear) }, () => {
      setSavingAlum(false); setAddAlumOpen(false); setAlumForm(EMPTY_ALUMNUS_FORM);
    });
  }

  function submitEvent() {
    if (!eventForm.title.trim() || !eventForm.date || !eventForm.venue.trim()) return;
    setSavingEvent(true);
    onEventAdded({ ...eventForm, rsvp: 0, status: "Upcoming" }, () => {
      setSavingEvent(false); setAddEventOpen(false); setEventForm(EMPTY_EVENT_FORM);
    });
  }

  function submitMatch() {
    if (!matchForm.mentor || !matchForm.student.trim()) return;
    setSavingMatch(true);
    const mentor = alumni.find((a) => a.name === matchForm.mentor);
    onMatchAdded({ ...matchForm, field: matchForm.field || mentor?.profession || "", status: "Pending" }, () => {
      setSavingMatch(false); setAddMatchOpen(false); setMatchForm({ ...EMPTY_MATCH_FORM, mentor: alumni[0]?.name || "" });
    });
  }

  // Auto-fill field from mentor's profession when mentor changes
  function handleMentorChange(name) {
    const mentor = alumni.find((a) => a.name === name);
    setMatchForm((f) => ({ ...f, mentor: name, field: mentor?.profession || "" }));
  }

  return (
    <div>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint, marginBottom: 16 }}><Loader2 size={12} className="spin" /> Syncing…</span>}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Users} label="Total Alumni" value={alumni.length} tone="indigo" />
        <StatCard icon={Award} label="Active Donors" value={donorCount} tone="green" />
        <StatCard icon={Wallet} label="Raised This Year" value={fmtMoney(totalRaised)} tone="amber" />
        <StatCard icon={CalendarDays} label="Upcoming Events" value={upcomingEvents} tone="cyan" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "directory"} onClick={() => setTab("directory")}>Alumni Directory</Tag>
        <Tag active={tab === "donations"} onClick={() => setTab("donations")}>Donations</Tag>
        <Tag active={tab === "events"} onClick={() => setTab("events")}>Events</Tag>
        <Tag active={tab === "mentorship"} onClick={() => setTab("mentorship")}>Mentorship</Tag>
      </div>

      {tab === "directory" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 200 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search alumni…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
            <button onClick={() => setAddAlumOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Alumnus
            </button>
          </div>
          <Table
            onRowClick={setSelectedAlum}
            columns={[
              { key: "name", label: "Name", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><span style={{ fontWeight: 600 }}>{r.name}</span></div> },
              { key: "gradYear", label: "Class of" },
              { key: "profession", label: "Profession" },
              { key: "location", label: "Location", render: (r) => <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12} color={C.textFaint} />{r.location}</span> },
              { key: "donorStatus", label: "Donor Status", render: (r) => <Pill tone={statusTone(r.donorStatus)}>{r.donorStatus}</Pill> },
            ]}
            rows={filtered}
          />
        </Card>
      )}

      {tab === "donations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Donations Trend" subtitle="Monthly total raised (USD)" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={donationTrend}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="month" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="raised" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Recent Donations" />
            <Table
              columns={[
                { key: "alumnus", label: "Alumnus" },
                { key: "campaign", label: "Campaign" },
                { key: "amount", label: "Amount", render: (r) => fmtMoney(r.amount) },
                { key: "date", label: "Date" },
                { key: "method", label: "Method", render: (r) => <Pill tone="cyan">{r.method}</Pill> },
              ]}
              rows={donations}
            />
          </Card>
        </div>
      )}

      {tab === "events" && (
        <Card>
          <SectionHeader title="Alumni Events" action={
            <button onClick={() => setAddEventOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> New Event
            </button>
          } />
          <Table
            columns={[
              { key: "title", label: "Event" },
              { key: "type", label: "Type", render: (r) => <Pill tone="slate">{r.type}</Pill> },
              { key: "date", label: "Date" },
              { key: "venue", label: "Venue" },
              { key: "rsvp", label: "RSVPs", align: "center" },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={events}
          />
        </Card>
      )}

      {tab === "mentorship" && (
        <Card>
          <SectionHeader title="Mentorship Program" subtitle="Connecting alumni with current students" action={
            <button onClick={() => { setMatchForm({ ...EMPTY_MATCH_FORM, mentor: alumni[0]?.name || "" }); setAddMatchOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Handshake size={14} /> New Match
            </button>
          } />
          <Table
            columns={[
              { key: "mentor", label: "Mentor" },
              { key: "field", label: "Field" },
              { key: "student", label: "Student" },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={mentorship}
          />
        </Card>
      )}

      <AlumniModal alum={selectedAlum} donations={donations} onClose={() => setSelectedAlum(null)} />

      {/* ---- Add Alumnus Modal ---- */}
      <Modal open={addAlumOpen} onClose={() => { setAddAlumOpen(false); setAlumForm(EMPTY_ALUMNUS_FORM); }} title="Add Alumni Record">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Full Name</label>
              <input placeholder="e.g. Chipo Nzou" value={alumForm.name} onChange={(e) => setAlumForm((f) => ({ ...f, name: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Class of (Year)</label>
              <input type="number" min="1980" max="2026" value={alumForm.gradYear} onChange={(e) => setAlumForm((f) => ({ ...f, gradYear: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Profession</label>
              <input placeholder="e.g. Civil Engineer" value={alumForm.profession} onChange={(e) => setAlumForm((f) => ({ ...f, profession: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Company / Organisation</label>
              <input placeholder="e.g. Econet Wireless" value={alumForm.company} onChange={(e) => setAlumForm((f) => ({ ...f, company: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Location</label>
              <input placeholder="e.g. Harare, ZW" value={alumForm.location} onChange={(e) => setAlumForm((f) => ({ ...f, location: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Donor Status</label>
              <select value={alumForm.donorStatus} onChange={(e) => setAlumForm((f) => ({ ...f, donorStatus: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}>
                <option>Non-donor</option>
                <option>Donor</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Email</label>
              <input type="email" placeholder="alumni@springfield.edu" value={alumForm.email} onChange={(e) => setAlumForm((f) => ({ ...f, email: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Phone</label>
              <input placeholder="+263 77 …" value={alumForm.phone} onChange={(e) => setAlumForm((f) => ({ ...f, phone: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          </div>
          <button onClick={submitAlum} disabled={savingAlum || !alumForm.name.trim() || !alumForm.profession.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: savingAlum ? "not-allowed" : "pointer", opacity: savingAlum ? 0.7 : 1 }}>
            {savingAlum ? <><Loader2 size={14} className="spin" /> Saving…</> : "Add Alumni Record"}
          </button>
        </div>
      </Modal>

      {/* ---- New Event Modal ---- */}
      <Modal open={addEventOpen} onClose={() => { setAddEventOpen(false); setEventForm(EMPTY_EVENT_FORM); }} title="New Alumni Event">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ ...labelStyle, color: C.textFaint }}>Event Title</label>
            <input placeholder="e.g. Class of 2020 Reunion" value={eventForm.title} onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Type</label>
              <select value={eventForm.type} onChange={(e) => setEventForm((f) => ({ ...f, type: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}>
                {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ ...labelStyle, color: C.textFaint }}>Date</label>
              <input type="date" value={eventForm.date} onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
            </div>
          </div>
          <div>
            <label style={{ ...labelStyle, color: C.textFaint }}>Venue</label>
            <input placeholder="e.g. Meikles Hotel, Harare" value={eventForm.venue} onChange={(e) => setEventForm((f) => ({ ...f, venue: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
          <button onClick={submitEvent} disabled={savingEvent || !eventForm.title.trim() || !eventForm.date || !eventForm.venue.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: savingEvent ? "not-allowed" : "pointer", opacity: savingEvent ? 0.7 : 1 }}>
            {savingEvent ? <><Loader2 size={14} className="spin" /> Saving…</> : "Create Event"}
          </button>
        </div>
      </Modal>

      {/* ---- New Match Modal ---- */}
      <Modal open={addMatchOpen} onClose={() => { setAddMatchOpen(false); }} title="Propose Mentorship Match">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ ...labelStyle, color: C.textFaint }}>Alumni Mentor</label>
            <select value={matchForm.mentor} onChange={(e) => handleMentorChange(e.target.value)} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}>
              {alumni.map((a) => <option key={a.id} value={a.name}>{a.name} — {a.profession}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...labelStyle, color: C.textFaint }}>Field / Expertise</label>
            <input placeholder="Auto-filled from mentor, or override" value={matchForm.field} onChange={(e) => setMatchForm((f) => ({ ...f, field: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: C.textFaint }}>Student Name</label>
            <input placeholder="e.g. Tadiwa Mhofu" value={matchForm.student} onChange={(e) => setMatchForm((f) => ({ ...f, student: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
          <button onClick={submitMatch} disabled={savingMatch || !matchForm.mentor || !matchForm.student.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: savingMatch ? "not-allowed" : "pointer", opacity: savingMatch ? 0.7 : 1 }}>
            {savingMatch ? <><Loader2 size={14} className="spin" /> Saving…</> : "Propose Match"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================== TEACHER (MENTORSHIP COORDINATOR) VIEW ============================== */
function AlumniTeacherView({ alumni, mentorship, events, onMatchAdded }) {
  const [proposeOpen, setProposeOpen] = useState(false);
  const [matchForm, setMatchForm] = useState({ ...EMPTY_MATCH_FORM, mentor: alumni[0]?.name || "" });
  const [saving, setSaving] = useState(false);

  function handleMentorChange(name) {
    const mentor = alumni.find((a) => a.name === name);
    setMatchForm((f) => ({ ...f, mentor: name, field: mentor?.profession || "" }));
  }

  function submitMatch() {
    if (!matchForm.mentor || !matchForm.student.trim()) return;
    setSaving(true);
    const mentor = alumni.find((a) => a.name === matchForm.mentor);
    onMatchAdded({ ...matchForm, field: matchForm.field || mentor?.profession || "", status: "Pending" }, () => {
      setSaving(false); setProposeOpen(false); setMatchForm({ ...EMPTY_MATCH_FORM, mentor: alumni[0]?.name || "" });
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionHeader title="Mentorship Coordination" subtitle="Current alumni-to-student matches" action={
          <button onClick={() => setProposeOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Handshake size={14} /> Propose Match
          </button>
        } />
        <Table
          columns={[
            { key: "mentor", label: "Alumni Mentor" },
            { key: "field", label: "Field" },
            { key: "student", label: "Student" },
            { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
          ]}
          rows={mentorship}
        />
      </Card>
      <Card>
        <SectionHeader title="Upcoming Alumni Events" subtitle="Worth sharing with interested students" />
        <Table columns={[{ key: "title", label: "Event" }, { key: "date", label: "Date" }, { key: "venue", label: "Venue" }]} rows={events.filter((e) => e.status === "Upcoming")} />
      </Card>

      <Modal open={proposeOpen} onClose={() => { setProposeOpen(false); }} title="Propose Mentorship Match">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ ...labelStyle, color: C.textFaint }}>Alumni Mentor</label>
            <select value={matchForm.mentor} onChange={(e) => handleMentorChange(e.target.value)} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}>
              {alumni.map((a) => <option key={a.id} value={a.name}>{a.name} — {a.profession}</option>)}
            </select>
          </div>
          <div>
            <label style={{ ...labelStyle, color: C.textFaint }}>Field / Expertise</label>
            <input placeholder="Auto-filled from mentor" value={matchForm.field} onChange={(e) => setMatchForm((f) => ({ ...f, field: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
          <div>
            <label style={{ ...labelStyle, color: C.textFaint }}>Student Name</label>
            <input placeholder="e.g. Tadiwa Mhofu" value={matchForm.student} onChange={(e) => setMatchForm((f) => ({ ...f, student: e.target.value }))} style={{ ...fieldStyle, background: C.surface2, border: `1px solid ${C.border}`, color: C.text }} />
          </div>
          <button onClick={submitMatch} disabled={saving || !matchForm.mentor || !matchForm.student.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : "Propose Match"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================== STUDENT VIEW ============================== */
function AlumniStudentView({ alumni, mentorship, events }) {
  const studentName = "Tadiwa Mhofu";
  const myMentor = mentorship.find((m) => m.student === studentName);
  const mentorProfile = myMentor ? alumni.find((a) => a.name === myMentor.mentor) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionHeader title="My Mentor" subtitle="Matched through the Alumni Mentorship Program" />
        {mentorProfile ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar name={mentorProfile.name} size={48} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{mentorProfile.name}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted }}>{mentorProfile.profession} at {mentorProfile.company} · Class of {mentorProfile.gradYear}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><Pill tone={statusTone(myMentor.status)}>{myMentor.status}</Pill></div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 16 }}>You haven't been matched with a mentor yet. Ask your form teacher about joining the program.</div>
        )}
      </Card>
      <Card>
        <SectionHeader title="Alumni Spotlight" subtitle="Career paths from Springfield graduates" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {alumni.slice(0, 4).map((a) => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name={a.name} size={36} />
              <div>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: C.textMuted }}>{a.profession} at {a.company} · Class of {a.gradYear}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <SectionHeader title="Upcoming Alumni Events" />
        <Table columns={[{ key: "title", label: "Event" }, { key: "date", label: "Date" }, { key: "venue", label: "Venue" }]} rows={events.filter((e) => e.status === "Upcoming")} />
      </Card>
    </div>
  );
}

/* ============================== ROOT ============================== */
function AlumniModule({ role }) {
  const [alumni, setAlumni] = useState([]);
  const [donations, setDonations] = useState([]);
  const [events, setEvents] = useState([]);
  const [mentorship, setMentorship] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("alumni").select("*").order("grad_year", { ascending: false }),
      supabase.from("donations").select("*").order("date", { ascending: false }),
      supabase.from("events").select("*").order("date"),
      supabase.from("mentorship").select("*").order("mentor"),
    ]).then(([alumniRes, donationsRes, eventsRes, mentorshipRes]) => {
      setAlumni((alumniRes.data || []).map(normalizeAlumnus));
      setDonations(donationsRes.data || []);
      setEvents(eventsRes.data || []);
      setMentorship(mentorshipRes.data || []);
      setLoading(false);
    });
  }, []);

  function handleAlumnusAdded(row, done) {
    const dbRow = { id: row.id, name: row.name, grad_year: row.gradYear, profession: row.profession, company: row.company, location: row.location, email: row.email, phone: row.phone, donor_status: row.donorStatus };
    if (isSupabaseConfigured) {
      supabase.from("alumni").insert(dbRow).select().single().then(({ data, error }) => {
        if (error) console.warn("Could not save alumnus:", error.message);
        setAlumni((arr) => [normalizeAlumnus(data || row), ...arr]);
        done();
      });
    } else {
      setAlumni((arr) => [row, ...arr]);
      done();
    }
  }

  function handleEventAdded(row, done) {
    if (isSupabaseConfigured) {
      supabase.from("events").insert(row).select().single().then(({ data, error }) => {
        if (error) console.warn("Could not save event:", error.message);
        setEvents((arr) => [...arr, data || row]);
        done();
      });
    } else {
      setEvents((arr) => [...arr, { ...row, id: Date.now() }]);
      done();
    }
  }

  function handleMatchAdded(row, done) {
    if (isSupabaseConfigured) {
      supabase.from("mentorship").insert(row).select().single().then(({ data, error }) => {
        if (error) console.warn("Could not save mentorship match:", error.message);
        setMentorship((arr) => [...arr, data || row]);
        done();
      });
    } else {
      setMentorship((arr) => [...arr, { ...row, id: Date.now() }]);
      done();
    }
  }

  if (role === "admin") return <AlumniAdminView alumni={alumni} donations={donations} events={events} mentorship={mentorship} loading={loading} onAlumnusAdded={handleAlumnusAdded} onEventAdded={handleEventAdded} onMatchAdded={handleMatchAdded} />;
  if (role === "teacher") return <AlumniTeacherView alumni={alumni} mentorship={mentorship} events={events} onMatchAdded={handleMatchAdded} />;
  return <AlumniStudentView alumni={alumni} mentorship={mentorship} events={events} />;
}

export { AlumniModule };