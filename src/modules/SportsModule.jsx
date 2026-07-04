import React, { useState, useEffect } from "react";
import {
  Plus, Trophy, Users, CalendarDays, ClipboardList, MapPin, Award,
  BookOpen, Drama, FlaskConical, Camera, Swords, Star, Heart, Loader2
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { C, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Avatar, Tag, Table, Modal, CustomTooltip, statusTone } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

// Icons can't be stored in Postgres — teams/clubs store the icon's name as text,
// and this map resolves that string back to the actual component for rendering.
const ICON_MAP = { Trophy, Award, BookOpen, Swords, Drama, FlaskConical, Camera, Heart };
const ICON_KEYS = Object.keys(ICON_MAP);

const MOCK_TEAMS = [
  { id: "T1", name: "Football", category: "Boys", coach: "Mr. D. Banda", icon: "Trophy" },
  { id: "T2", name: "Netball", category: "Girls", coach: "Mrs. R. Chikore", icon: "Trophy" },
  { id: "T3", name: "Athletics", category: "Mixed", coach: "Mr. S. Ndlovu", icon: "Award" },
  { id: "T4", name: "Swimming", category: "Mixed", coach: "Mrs. P. Gumbo", icon: "Award" },
  { id: "T5", name: "Basketball", category: "Boys", coach: "Mr. T. Moyo", icon: "Trophy" },
];

const MOCK_FIXTURES = [
  { id: 1, team: "Football", opponent: "St. George's College", date: "2026-06-27", venue: "Springfield Grounds", homeAway: "Home", status: "Upcoming", result: null },
  { id: 2, team: "Netball", opponent: "Dominican Convent", date: "2026-06-25", venue: "Dominican Convent", homeAway: "Away", status: "Upcoming", result: null },
  { id: 3, team: "Athletics", opponent: "Inter-School Athletics Meet", date: "2026-06-28", venue: "Harare Sports Club", homeAway: "Neutral", status: "Upcoming", result: null },
  { id: 4, team: "Football", opponent: "Prince Edward School", date: "2026-06-13", venue: "Prince Edward School", homeAway: "Away", status: "Completed", result: "Won 2–1" },
  { id: 5, team: "Swimming", opponent: "Westridge High", date: "2026-06-08", venue: "Springfield Pool", homeAway: "Home", status: "Completed", result: "Won 145–98" },
  { id: 6, team: "Basketball", opponent: "Lomagundi College", date: "2026-06-05", venue: "Lomagundi College", homeAway: "Away", status: "Completed", result: "Lost 56–62" },
];

const ATHLETES = [
  { name: "Tinotenda Chigumba", cls: "Form 6A", team: "Football", position: "Captain / Striker" },
  { name: "Tadiwa Mhofu", cls: "Form 4A", team: "Football", position: "Midfielder" },
  { name: "Brian Mutasa", cls: "Form 3A", team: "Basketball", position: "Guard" },
  { name: "Natasha Sibanda", cls: "Form 1A", team: "Swimming", position: "Freestyle" },
  { name: "Chiedza Goredema", cls: "Form 5A", team: "Netball", position: "Captain / Goal Shooter" },
  { name: "Kudzai Nyamande", cls: "Form 2A", team: "Athletics", position: "200m Sprint" },
];

const MOCK_CLUBS = [
  { id: "C1", name: "Debate Club", category: "Academic", patron: "Mrs. R. Chikore", schedule: "Wednesdays 3:30 PM", members: 18, icon: "BookOpen" },
  { id: "C2", name: "Chess Club", category: "Academic", patron: "Mr. T. Moyo", schedule: "Tuesdays 3:30 PM", members: 14, icon: "Swords" },
  { id: "C3", name: "Drama Society", category: "Creative", patron: "Mrs. P. Gumbo", schedule: "Thursdays 3:30 PM", members: 22, icon: "Drama" },
  { id: "C4", name: "Science Club", category: "Academic", patron: "Mr. S. Ndlovu", schedule: "Mondays 3:30 PM", members: 16, icon: "FlaskConical" },
  { id: "C5", name: "Interact (Community Service)", category: "Service", patron: "Mrs. Patience Mhike", schedule: "Fridays 2:00 PM", members: 20, icon: "Heart" },
  { id: "C6", name: "Photography Club", category: "Creative", patron: "Mr. D. Banda", schedule: "Wednesdays 3:30 PM", members: 11, icon: "Camera" },
];

const MOCK_CLUB_MEMBERS_MAP = {
  "Debate Club": ["Tinotenda Chigumba", "Chiedza Goredema", "Maria Fernandez", "Anesu Chitate"],
  "Chess Club": ["Tadiwa Mhofu", "Liam Osei", "Stephanie Mhike"],
  "Drama Society": ["Natasha Sibanda", "Rutendo Marecha", "Tapiwa Chirwa"],
  "Science Club": ["Brian Mutasa", "Kudzai Nyamande", "Anesu Chitate"],
  "Interact (Community Service)": ["Tadiwa Mhofu", "Chiedza Goredema", "Stephanie Mhike"],
  "Photography Club": ["Maria Fernandez", "Tinotenda Chigumba"],
};

const ACTIVITY_LOG = [
  { title: "Debate Club wins Regional Inter-School Debate", group: "Debate Club", date: "2026-06-10", summary: "Springfield's team placed 1st against 8 competing schools in the regional finals held in Harare." },
  { title: "Football team wins 2–1 away at Prince Edward", group: "Football", date: "2026-06-13", summary: "A strong second-half performance secured the win, with Tinotenda Chigumba scoring both goals." },
  { title: "Science Club hosts Term 2 Science Fair", group: "Science Club", date: "2026-06-05", summary: "Over 30 projects were exhibited, with parents and staff invited to attend." },
  { title: "Swimming team defeats Westridge High", group: "Swimming", date: "2026-06-08", summary: "A dominant performance across all age categories at the home gala." },
];

function normalizeFixture(row) {
  return { ...row, homeAway: row.homeAway ?? row.home_away };
}

const EMPTY_FIXTURE_FORM = { team: "", opponent: "", date: "", venue: "", homeAway: "Home" };
const EMPTY_CLUB_FORM = { name: "", category: "Academic", patron: "", schedule: "", icon: "BookOpen" };

/* ============================== CLUB DETAIL MODAL ============================== */
function ClubModal({ club, clubMembersMap, onClose }) {
  if (!club) return null;
  const members = (clubMembersMap && clubMembersMap[club.name]) || [];
  return (
    <Modal open={!!club} onClose={onClose} title={club.name} wide>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Pill tone="indigo">{club.category}</Pill>
        <Pill tone="slate">{club.schedule}</Pill>
        <Pill tone="cyan">{club.members} members</Pill>
      </div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>Patron: <span style={{ color: C.text, fontWeight: 600 }}>{club.patron}</span></div>
      <div style={{ fontSize: 12, color: C.textFaint, textTransform: "uppercase", marginBottom: 10 }}>Members on Record</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {members.length > 0 ? members.map((m) => (
          <div key={m} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={m} size={28} />
            <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{m}</span>
          </div>
        )) : <span style={{ fontSize: 13, color: C.textMuted }}>No members on record yet.</span>}
      </div>
    </Modal>
  );
}

/* ============================== ADMIN VIEW ============================== */
function SportsAdminView({ teams, clubs, fixtures, clubMembersMap, loading, usingLiveData, onFixtureAdded, onClubAdded }) {
  const [tab, setTab] = useState("fixtures");
  const [selectedClub, setSelectedClub] = useState(null);

  const [newFixtureOpen, setNewFixtureOpen] = useState(false);
  const [newFixtureForm, setNewFixtureForm] = useState({ ...EMPTY_FIXTURE_FORM, team: teams[0]?.name || "" });
  const [savingFixture, setSavingFixture] = useState(false);

  const [newClubOpen, setNewClubOpen] = useState(false);
  const [newClubForm, setNewClubForm] = useState(EMPTY_CLUB_FORM);
  const [savingClub, setSavingClub] = useState(false);

  const upcoming = fixtures.filter((f) => f.status === "Upcoming").length;
  const wins = fixtures.filter((f) => f.result && f.result.startsWith("Won")).length;
  const totalMembers = clubs.reduce((s, c) => s + c.members, 0);
  const membershipChart = clubs.map((c) => ({ name: c.name.split(" ")[0], members: c.members }));

  const fieldStyle = {
    width: "100%", background: C.surface2, border: `1px solid ${C.border}`,
    borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13,
    boxSizing: "border-box",
  };
  const labelStyle = {
    fontSize: 12, color: C.textFaint, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5,
  };

  function submitFixture() {
    if (!newFixtureForm.team || !newFixtureForm.opponent.trim() || !newFixtureForm.date) return;
    setSavingFixture(true);
    onFixtureAdded({ ...newFixtureForm, status: "Upcoming", result: null }, () => {
      setSavingFixture(false);
      setNewFixtureOpen(false);
      setNewFixtureForm({ ...EMPTY_FIXTURE_FORM, team: teams[0]?.name || "" });
    });
  }

  function submitClub() {
    if (!newClubForm.name.trim() || !newClubForm.patron.trim()) return;
    setSavingClub(true);
    const newId = `C${clubs.length + 1}`;
    onClubAdded({ id: newId, ...newClubForm, members: 0 }, () => {
      setSavingClub(false);
      setNewClubOpen(false);
      setNewClubForm(EMPTY_CLUB_FORM);
    });
  }

  return (
    <div>
      {(loading || usingLiveData) && (
        <div style={{ marginBottom: 16 }}>
          {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing live data…</span>}
          {usingLiveData && <Pill tone="green">Live data</Pill>}
        </div>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Trophy} label="Active Teams" value={teams.length} tone="indigo" />
        <StatCard icon={CalendarDays} label="Upcoming Fixtures" value={upcoming} tone="cyan" />
        <StatCard icon={Award} label="Wins This Term" value={wins} tone="green" />
        <StatCard icon={Users} label="Club Members" value={totalMembers} tone="amber" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "fixtures"} onClick={() => setTab("fixtures")}>Teams & Fixtures</Tag>
        <Tag active={tab === "athletes"} onClick={() => setTab("athletes")}>Athlete Records</Tag>
        <Tag active={tab === "clubs"} onClick={() => setTab("clubs")}>Clubs & Societies</Tag>
        <Tag active={tab === "reports"} onClick={() => setTab("reports")}>Activity Reports</Tag>
      </div>

      {tab === "fixtures" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
            {teams.map((t) => {
              const Icon = ICON_MAP[t.icon] || Trophy;
              return (
                <Card key={t.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: C.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={16} color={C.indigo} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: C.text }}>{t.name}</div>
                      <div style={{ fontSize: 11.5, color: C.textMuted }}>{t.coach}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: 10 }}><Pill tone="slate">{t.category}</Pill></div>
                </Card>
              );
            })}
          </div>
          <Card>
            <SectionHeader title="Fixtures & Results" action={
              <button onClick={() => setNewFixtureOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={14} /> Add Fixture
              </button>
            } />
            <Table
              columns={[
                { key: "team", label: "Team" },
                { key: "opponent", label: "Opponent" },
                { key: "date", label: "Date" },
                { key: "venue", label: "Venue", render: (r) => <span style={{ display: "flex", alignItems: "center", gap: 5 }}><MapPin size={12} color={C.textFaint} />{r.homeAway}</span> },
                { key: "result", label: "Result", render: (r) => r.result || <span style={{ color: C.textFaint }}>—</span> },
                { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
              ]}
              rows={fixtures}
            />
          </Card>
        </div>
      )}

      {tab === "athletes" && (
        <Card>
          <SectionHeader title="Athlete Records" subtitle="Students registered across all teams" />
          <Table
            columns={[
              { key: "name", label: "Student", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.cls}</div></div></div> },
              { key: "team", label: "Team" },
              { key: "position", label: "Position / Role" },
            ]}
            rows={ATHLETES}
          />
        </Card>
      )}

      {tab === "clubs" && (
        <Card>
          <SectionHeader title="Clubs & Societies" subtitle="Click a club to see its members" action={
            <button onClick={() => setNewClubOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> New Club
            </button>
          } />
          <Table
            onRowClick={setSelectedClub}
            columns={[
              { key: "name", label: "Club", render: (r) => { const Icon = ICON_MAP[r.icon] || BookOpen; return <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: C.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={C.indigo} /></div><span style={{ fontWeight: 600 }}>{r.name}</span></div>; } },
              { key: "category", label: "Category", render: (r) => <Pill tone="slate">{r.category}</Pill> },
              { key: "patron", label: "Patron" },
              { key: "schedule", label: "Schedule" },
              { key: "members", label: "Members", align: "center" },
            ]}
            rows={clubs}
          />
        </Card>
      )}

      {tab === "reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Club Membership" subtitle="Members per club, this term" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={membershipChart}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="name" stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="members" fill={C.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Recent Activity Reports" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {ACTIVITY_LOG.map((a, i) => (
                <div key={i} style={{ paddingBottom: 14, borderBottom: i < ACTIVITY_LOG.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{a.title}</span>
                    <span style={{ fontSize: 11, color: C.textFaint, flexShrink: 0 }}>{a.date}</span>
                  </div>
                  <div style={{ margin: "5px 0" }}><Pill tone="indigo">{a.group}</Pill></div>
                  <p style={{ fontSize: 12.5, color: C.textMuted, margin: 0, lineHeight: 1.5 }}>{a.summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <ClubModal club={selectedClub} clubMembersMap={clubMembersMap} onClose={() => setSelectedClub(null)} />

      {/* ---- Add Fixture Modal ---- */}
      <Modal open={newFixtureOpen} onClose={() => { setNewFixtureOpen(false); setNewFixtureForm({ ...EMPTY_FIXTURE_FORM, team: teams[0]?.name || "" }); }} title="Add New Fixture">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Team</label>
              <select value={newFixtureForm.team} onChange={(e) => setNewFixtureForm((f) => ({ ...f, team: e.target.value }))} style={fieldStyle}>
                {teams.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Home / Away</label>
              <select value={newFixtureForm.homeAway} onChange={(e) => setNewFixtureForm((f) => ({ ...f, homeAway: e.target.value }))} style={fieldStyle}>
                {["Home", "Away", "Neutral"].map((v) => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Opponent</label>
            <input placeholder="e.g. St. George's College" value={newFixtureForm.opponent} onChange={(e) => setNewFixtureForm((f) => ({ ...f, opponent: e.target.value }))} style={fieldStyle} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Date</label>
              <input type="date" value={newFixtureForm.date} onChange={(e) => setNewFixtureForm((f) => ({ ...f, date: e.target.value }))} style={fieldStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Venue</label>
              <input placeholder="e.g. Springfield Grounds" value={newFixtureForm.venue} onChange={(e) => setNewFixtureForm((f) => ({ ...f, venue: e.target.value }))} style={fieldStyle} />
            </div>
          </div>
          <button onClick={submitFixture} disabled={savingFixture || !newFixtureForm.team || !newFixtureForm.opponent.trim() || !newFixtureForm.date} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: savingFixture ? "not-allowed" : "pointer", opacity: savingFixture ? 0.7 : 1 }}>
            {savingFixture ? <><Loader2 size={14} className="spin" /> Saving…</> : "Add Fixture"}
          </button>
        </div>
      </Modal>

      {/* ---- New Club Modal ---- */}
      <Modal open={newClubOpen} onClose={() => { setNewClubOpen(false); setNewClubForm(EMPTY_CLUB_FORM); }} title="New Club or Society">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={labelStyle}>Club Name</label>
            <input placeholder="e.g. Robotics Club" value={newClubForm.name} onChange={(e) => setNewClubForm((f) => ({ ...f, name: e.target.value }))} style={fieldStyle} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Category</label>
              <select value={newClubForm.category} onChange={(e) => setNewClubForm((f) => ({ ...f, category: e.target.value }))} style={fieldStyle}>
                {["Academic", "Creative", "Service", "Sports"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Icon</label>
              <select value={newClubForm.icon} onChange={(e) => setNewClubForm((f) => ({ ...f, icon: e.target.value }))} style={fieldStyle}>
                {ICON_KEYS.map((k) => <option key={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Patron</label>
            <input placeholder="e.g. Mr. T. Moyo" value={newClubForm.patron} onChange={(e) => setNewClubForm((f) => ({ ...f, patron: e.target.value }))} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Meeting Schedule</label>
            <input placeholder="e.g. Thursdays 3:30 PM" value={newClubForm.schedule} onChange={(e) => setNewClubForm((f) => ({ ...f, schedule: e.target.value }))} style={fieldStyle} />
          </div>
          <button onClick={submitClub} disabled={savingClub || !newClubForm.name.trim() || !newClubForm.patron.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: savingClub ? "not-allowed" : "pointer", opacity: savingClub ? 0.7 : 1 }}>
            {savingClub ? <><Loader2 size={14} className="spin" /> Saving…</> : "Create Club"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ============================== TEACHER (COACH / PATRON) VIEW ============================== */
function SportsTeacherView({ teams, clubs, fixtures, onResultRecorded }) {
  const myTeam = teams.find((t) => t.coach === "Mr. T. Moyo");
  const myClub = clubs.find((c) => c.patron === "Mr. T. Moyo");
  const teamRoster = ATHLETES.filter((a) => a.team === (myTeam ? myTeam.name : ""));
  const teamFixtures = fixtures.filter((f) => f.team === (myTeam ? myTeam.name : ""));
  const upcomingFixtures = teamFixtures.filter((f) => f.status === "Upcoming");

  const [recordOpen, setRecordOpen] = useState(false);
  const [selectedFixtureId, setSelectedFixtureId] = useState(upcomingFixtures[0]?.id ?? null);
  const [resultText, setResultText] = useState("");
  const [saving, setSaving] = useState(false);

  const fieldStyle = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const labelStyle = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };

  function submitResult() {
    if (!selectedFixtureId || !resultText.trim()) return;
    setSaving(true);
    onResultRecorded(selectedFixtureId, resultText.trim(), () => {
      setSaving(false);
      setRecordOpen(false);
      setResultText("");
    });
  }

  const clubMembersPlaceholder = myClub ? (MOCK_CLUB_MEMBERS_MAP[myClub.name] || []) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {myTeam && (
        <Card>
          <SectionHeader title={`My Team — ${myTeam.name}`} subtitle={`${myTeam.category} · ${teamRoster.length} players`} action={
            <button onClick={() => { setSelectedFixtureId(upcomingFixtures[0]?.id ?? null); setRecordOpen(true); }} disabled={upcomingFixtures.length === 0} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: upcomingFixtures.length === 0 ? "not-allowed" : "pointer", opacity: upcomingFixtures.length === 0 ? 0.5 : 1 }}>
              <Plus size={14} /> Record Result
            </button>
          } />
          <Table columns={[{ key: "name", label: "Player" }, { key: "cls", label: "Class" }, { key: "position", label: "Position" }]} rows={teamRoster} />
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 12, color: C.textFaint, textTransform: "uppercase", marginBottom: 10 }}>Fixtures</div>
            <Table columns={[{ key: "opponent", label: "Opponent" }, { key: "date", label: "Date" }, { key: "result", label: "Result", render: (r) => r.result || "—" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={teamFixtures} />
          </div>
        </Card>
      )}
      {myClub && (
        <Card>
          <SectionHeader title={`My Club — ${myClub.name}`} subtitle={myClub.schedule} action={
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <ClipboardList size={14} /> Log Activity
            </button>
          } />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {clubMembersPlaceholder.map((m) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={m} size={28} />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{m}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---- Record Result Modal ---- */}
      <Modal open={recordOpen} onClose={() => { setRecordOpen(false); setResultText(""); }} title="Record Match Result">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {upcomingFixtures.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textMuted }}>No upcoming fixtures to record results for.</p>
          ) : (
            <>
              <div>
                <label style={labelStyle}>Fixture</label>
                <select value={selectedFixtureId ?? ""} onChange={(e) => setSelectedFixtureId(Number(e.target.value))} style={fieldStyle}>
                  {upcomingFixtures.map((f) => <option key={f.id} value={f.id}>{f.opponent} — {f.date}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Result</label>
                <input placeholder='e.g. "Won 2–1" or "Lost 0–3"' value={resultText} onChange={(e) => setResultText(e.target.value)} style={fieldStyle} />
              </div>
              <button onClick={submitResult} disabled={saving || !resultText.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : "Save Result"}
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ============================== STUDENT / PARENT VIEW ============================== */
function SportsPersonalView({ role, clubs, fixtures, clubMembersMap }) {
  const studentName = "Tadiwa Mhofu";
  const myTeams = ATHLETES.filter((a) => a.name === studentName);
  const myClubs = Object.entries(clubMembersMap).filter(([, members]) => members.includes(studentName)).map(([name]) => clubs.find((c) => c.name === name));
  const myFixtures = fixtures.filter((f) => myTeams.some((t) => t.team === f.team) && f.status === "Upcoming");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionHeader title={role === "parent" ? `${studentName}'s Teams & Clubs` : "My Teams & Clubs"} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {myTeams.map((t) => <Pill key={t.team} tone="indigo">{t.team} — {t.position}</Pill>)}
          {myClubs.map((c) => c && <Pill key={c.name} tone="cyan">{c.name}</Pill>)}
          {myTeams.length === 0 && myClubs.length === 0 && <span style={{ fontSize: 13, color: C.textMuted }}>Not currently registered for any team or club.</span>}
        </div>
      </Card>
      <Card>
        <SectionHeader title="Upcoming Fixtures" />
        {myFixtures.length > 0 ? (
          <Table columns={[{ key: "team", label: "Team" }, { key: "opponent", label: "Opponent" }, { key: "date", label: "Date" }, { key: "venue", label: "Venue", render: (r) => `${r.homeAway} · ${r.venue}` }]} rows={myFixtures} />
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 16 }}>No upcoming fixtures.</div>
        )}
      </Card>
      <Card>
        <SectionHeader title="Recent Activity" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ACTIVITY_LOG.slice(0, 3).map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <Star size={13} color={C.amber} style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{a.title}</div>
                <div style={{ fontSize: 11, color: C.textFaint }}>{a.date}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============================== ROOT ============================== */
function SportsModule({ role }) {
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [clubs, setClubs] = useState(MOCK_CLUBS);
  const [fixtures, setFixtures] = useState(MOCK_FIXTURES);
  const [clubMembersMap, setClubMembersMap] = useState(MOCK_CLUB_MEMBERS_MAP);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from("teams").select("*").order("id"),
      supabase.from("clubs").select("*").order("id"),
      supabase.from("fixtures").select("*").order("date"),
      supabase.from("club_members").select("*"),
    ]).then(([teamsRes, clubsRes, fixturesRes, membersRes]) => {
      if (teamsRes.error) console.warn("Falling back to demo team data:", teamsRes.error.message);
      else if (teamsRes.data && teamsRes.data.length > 0) { setTeams(teamsRes.data); setUsingLiveData(true); }

      if (clubsRes.error) console.warn("Falling back to demo club data:", clubsRes.error.message);
      else if (clubsRes.data && clubsRes.data.length > 0) { setClubs(clubsRes.data); setUsingLiveData(true); }

      if (fixturesRes.error) console.warn("Falling back to demo fixture data:", fixturesRes.error.message);
      else if (fixturesRes.data && fixturesRes.data.length > 0) {
        setFixtures(fixturesRes.data.map(normalizeFixture));
        setUsingLiveData(true);
      }

      if (membersRes.error) console.warn("Falling back to demo club members:", membersRes.error.message);
      else if (membersRes.data && membersRes.data.length > 0) {
        const map = {};
        membersRes.data.forEach(({ club_name, student_name }) => {
          if (!map[club_name]) map[club_name] = [];
          map[club_name].push(student_name);
        });
        setClubMembersMap(map);
        setUsingLiveData(true);
      }

      setLoading(false);
    });
  }, []);

  function handleFixtureAdded(row, done) {
    const dbRow = { team: row.team, opponent: row.opponent, date: row.date, venue: row.venue, home_away: row.homeAway, status: row.status, result: null };
    if (isSupabaseConfigured) {
      supabase.from("fixtures").insert(dbRow).select().single().then(({ data, error }) => {
        if (error) console.warn("Could not save fixture:", error.message);
        else setUsingLiveData(true);
        setFixtures((arr) => [normalizeFixture(data || { ...dbRow, homeAway: row.homeAway }), ...arr]);
        done();
      });
    } else {
      setFixtures((arr) => [{ ...row, id: Date.now() }, ...arr]);
      done();
    }
  }

  function handleClubAdded(row, done) {
    if (isSupabaseConfigured) {
      supabase.from("clubs").insert(row).select().single().then(({ data, error }) => {
        if (error) console.warn("Could not save club:", error.message);
        else setUsingLiveData(true);
        setClubs((arr) => [...arr, data || row]);
        done();
      });
    } else {
      setClubs((arr) => [...arr, row]);
      done();
    }
  }

  function handleResultRecorded(fixtureId, result, done) {
    setFixtures((arr) => arr.map((f) => f.id === fixtureId ? { ...f, result, status: "Completed" } : f));
    if (isSupabaseConfigured) {
      supabase.from("fixtures").update({ result, status: "Completed" }).eq("id", fixtureId).then(({ error }) => {
        if (error) console.warn("Could not save result:", error.message);
        else setUsingLiveData(true);
        done();
      });
    } else {
      done();
    }
  }

  if (role === "admin") return <SportsAdminView teams={teams} clubs={clubs} fixtures={fixtures} clubMembersMap={clubMembersMap} loading={loading} usingLiveData={usingLiveData} onFixtureAdded={handleFixtureAdded} onClubAdded={handleClubAdded} />;
  if (role === "teacher") return <SportsTeacherView teams={teams} clubs={clubs} fixtures={fixtures} onResultRecorded={handleResultRecorded} />;
  return <SportsPersonalView role={role} clubs={clubs} fixtures={fixtures} clubMembersMap={clubMembersMap} />;
}

export { SportsModule };