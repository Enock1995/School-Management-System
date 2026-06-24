import React, { useState } from "react";
import {
  Trophy, Users, CalendarDays, ClipboardList, Search, Plus, X, MapPin,
  CheckCircle2, ShieldCheck, GraduationCap, Heart, BookOpen, Star,
  Drama, FlaskConical, Camera, Award, Swords
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

/* ============================== THEME (same tokens as main app) ============================== */
const C = {
  bg: "#0a0d1a", bgGrad: "linear-gradient(180deg, #0a0d1a 0%, #0d1126 100%)",
  surface: "#121632", surface2: "#161b3a", surfaceHover: "#1c2247",
  border: "#232a52", borderSoft: "#1a2046",
  indigo: "#6366f1", indigoSoft: "rgba(99,102,241,0.16)",
  cyan: "#22d3ee", cyanSoft: "rgba(34,211,238,0.14)",
  green: "#34d399", greenSoft: "rgba(52,211,153,0.14)",
  amber: "#fbbf24", amberSoft: "rgba(251,191,36,0.14)",
  red: "#f87171", redSoft: "rgba(248,113,113,0.14)",
  text: "#e9ebf7", textMuted: "#8b93b8", textFaint: "#4e5584",
};
const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');";
const displayFont = { fontFamily: "'Space Grotesk', sans-serif" };
const bodyFont = { fontFamily: "'Inter', sans-serif" };

/* ============================== PRIMITIVES (shared pattern) ============================== */
function Pill({ children, tone = "slate" }) {
  const tones = {
    green: { bg: C.greenSoft, color: C.green }, amber: { bg: C.amberSoft, color: C.amber },
    red: { bg: C.redSoft, color: C.red }, indigo: { bg: C.indigoSoft, color: C.indigo },
    cyan: { bg: C.cyanSoft, color: C.cyan }, slate: { bg: "rgba(139,147,184,0.14)", color: C.textMuted },
  };
  const t = tones[tone] || tones.slate;
  return <span style={{ background: t.bg, color: t.color, fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>{children}</span>;
}
function statusTone(s) {
  if (["Completed", "Won"].includes(s)) return "green";
  if (["Upcoming"].includes(s)) return "indigo";
  if (["Lost"].includes(s)) return "red";
  if (["Drawn"].includes(s)) return "amber";
  return "slate";
}
function Card({ children, style, padded = true }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, padding: padded ? 20 : 0, ...style }}>{children}</div>;
}
function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
      <div>
        <h2 style={{ ...displayFont, fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ color: C.textMuted, fontSize: 12.5, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
function StatCard({ icon: Icon, label, value, tone = "indigo" }) {
  const toneColor = tone === "cyan" ? C.cyan : tone === "amber" ? C.amber : tone === "red" ? C.red : C.indigo;
  const toneBg = tone === "cyan" ? C.cyanSoft : tone === "amber" ? C.amberSoft : tone === "red" ? C.redSoft : C.indigoSoft;
  return (
    <Card style={{ flex: 1, minWidth: 168 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: C.textMuted, fontSize: 12.5, fontWeight: 600 }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: toneBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={toneColor} />
        </div>
      </div>
      <div style={{ ...displayFont, fontSize: 25, fontWeight: 700, color: C.text, marginTop: 12 }}>{value}</div>
    </Card>
  );
}
function Avatar({ name, size = 32 }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return <div style={{ width: size, height: size, borderRadius: "50%", background: C.indigoSoft, color: C.indigo, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, ...displayFont, flexShrink: 0 }}>{initials}</div>;
}
function Tag({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: "8px 15px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: `1px solid ${active ? C.indigo : C.border}`, background: active ? C.indigoSoft : "transparent", color: active ? C.text : C.textMuted }}>
      {children}
    </button>
  );
}
function Table({ columns, rows, onRowClick }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align || "left", padding: "0 14px 10px", color: C.textFaint, fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} onClick={() => onRowClick && onRowClick(row)} style={{ cursor: onRowClick ? "pointer" : "default" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.borderSoft}`, color: C.text, textAlign: c.align || "left" }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,7,16,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 20, width: "100%", maxWidth: wide ? 600 : 440, maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface2 }}>
          <h3 style={{ ...displayFont, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", display: "flex" }}><X size={18} /></button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 12.5 }}>
      <div style={{ color: C.textMuted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

/* ============================== MOCK DATA ============================== */
const TEAMS = [
  { id: "T1", name: "Football", category: "Boys", coach: "Mr. D. Banda", icon: Trophy },
  { id: "T2", name: "Netball", category: "Girls", coach: "Mrs. R. Chikore", icon: Trophy },
  { id: "T3", name: "Athletics", category: "Mixed", coach: "Mr. S. Ndlovu", icon: Award },
  { id: "T4", name: "Swimming", category: "Mixed", coach: "Mrs. P. Gumbo", icon: Award },
  { id: "T5", name: "Basketball", category: "Boys", coach: "Mr. T. Moyo", icon: Trophy },
];

const FIXTURES = [
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

const CLUBS = [
  { id: "C1", name: "Debate Club", category: "Academic", patron: "Mrs. R. Chikore", schedule: "Wednesdays 3:30 PM", members: 18, icon: BookOpen },
  { id: "C2", name: "Chess Club", category: "Academic", patron: "Mr. T. Moyo", schedule: "Tuesdays 3:30 PM", members: 14, icon: Swords },
  { id: "C3", name: "Drama Society", category: "Creative", patron: "Mrs. P. Gumbo", schedule: "Thursdays 3:30 PM", members: 22, icon: Drama },
  { id: "C4", name: "Science Club", category: "Academic", patron: "Mr. S. Ndlovu", schedule: "Mondays 3:30 PM", members: 16, icon: FlaskConical },
  { id: "C5", name: "Interact (Community Service)", category: "Service", patron: "Mrs. Patience Mhike", schedule: "Fridays 2:00 PM", members: 20, icon: Heart },
  { id: "C6", name: "Photography Club", category: "Creative", patron: "Mr. D. Banda", schedule: "Wednesdays 3:30 PM", members: 11, icon: Camera },
];

const CLUB_MEMBERS = {
  "Debate Club": ["Tinotenda Chigumba", "Chiedza Goredema", "Maria Fernandez", "Anesu Chitate"],
  "Chess Club": ["Tadiwa Mhofu", "Liam Osei", "Stephanie Mhike"],
  "Drama Society": ["Natasha Sibanda", "Rutendo Marecha", "Tapiwa Chirwa"],
  "Science Club": ["Brian Mutasa", "Kudzai Nyamande", "Anesu Chitate"],
  "Interact (Community Service)": ["Tadiwa Mhofu", "Chiedza Goredema", "Stephanie Mhike"],
  "Photography Club": ["Maria Fernandez", "Tinotenda Chigumba"],
};

const MEMBERSHIP_CHART = CLUBS.map((c) => ({ name: c.name.split(" ")[0], members: c.members }));

const ACTIVITY_LOG = [
  { title: "Debate Club wins Regional Inter-School Debate", group: "Debate Club", date: "2026-06-10", summary: "Springfield's team placed 1st against 8 competing schools in the regional finals held in Harare." },
  { title: "Football team wins 2–1 away at Prince Edward", group: "Football", date: "2026-06-13", summary: "A strong second-half performance secured the win, with Tinotenda Chigumba scoring both goals." },
  { title: "Science Club hosts Term 2 Science Fair", group: "Science Club", date: "2026-06-05", summary: "Over 30 projects were exhibited, with parents and staff invited to attend." },
  { title: "Swimming team defeats Westridge High", group: "Swimming", date: "2026-06-08", summary: "A dominant performance across all age categories at the home gala." },
];

/* ============================== CLUB DETAIL MODAL ============================== */
function ClubModal({ club, onClose }) {
  if (!club) return null;
  const members = CLUB_MEMBERS[club.name] || [];
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
        {members.map((m) => (
          <div key={m} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name={m} size={28} />
            <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{m}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ============================== ADMIN VIEW ============================== */
function SportsAdminView() {
  const [tab, setTab] = useState("fixtures");
  const [selectedClub, setSelectedClub] = useState(null);

  const upcoming = FIXTURES.filter((f) => f.status === "Upcoming").length;
  const wins = FIXTURES.filter((f) => f.result && f.result.startsWith("Won")).length;
  const totalMembers = CLUBS.reduce((s, c) => s + c.members, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Trophy} label="Active Teams" value={TEAMS.length} tone="indigo" />
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
            {TEAMS.map((t) => {
              const Icon = t.icon;
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
              <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
              rows={FIXTURES}
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
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> New Club
            </button>
          } />
          <Table
            onRowClick={setSelectedClub}
            columns={[
              { key: "name", label: "Club", render: (r) => { const Icon = r.icon; return <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: C.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon size={14} color={C.indigo} /></div><span style={{ fontWeight: 600 }}>{r.name}</span></div>; } },
              { key: "category", label: "Category", render: (r) => <Pill tone="slate">{r.category}</Pill> },
              { key: "patron", label: "Patron" },
              { key: "schedule", label: "Schedule" },
              { key: "members", label: "Members", align: "center" },
            ]}
            rows={CLUBS}
          />
        </Card>
      )}

      {tab === "reports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Club Membership" subtitle="Members per club, this term" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={MEMBERSHIP_CHART}>
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

      <ClubModal club={selectedClub} onClose={() => setSelectedClub(null)} />
    </div>
  );
}

/* ============================== TEACHER (COACH / PATRON) VIEW ============================== */
function SportsTeacherView() {
  const myTeam = TEAMS.find((t) => t.coach === "Mr. T. Moyo");
  const myClub = CLUBS.find((c) => c.patron === "Mr. T. Moyo");
  const teamRoster = ATHLETES.filter((a) => a.team === (myTeam ? myTeam.name : ""));
  const teamFixtures = FIXTURES.filter((f) => f.team === (myTeam ? myTeam.name : ""));
  const clubMembers = myClub ? CLUB_MEMBERS[myClub.name] || [] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {myTeam && (
        <Card>
          <SectionHeader title={`My Team — ${myTeam.name}`} subtitle={`${myTeam.category} · ${teamRoster.length} players`} action={
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
            {clubMembers.map((m) => (
              <div key={m} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={m} size={28} />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{m}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ============================== STUDENT / PARENT VIEW ============================== */
function SportsPersonalView({ role }) {
  const studentName = "Tadiwa Mhofu";
  const myTeams = ATHLETES.filter((a) => a.name === studentName);
  const myClubs = Object.entries(CLUB_MEMBERS).filter(([, members]) => members.includes(studentName)).map(([name]) => CLUBS.find((c) => c.name === name));
  const myFixtures = FIXTURES.filter((f) => myTeams.some((t) => t.team === f.team) && f.status === "Upcoming");

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

/* ============================== ROOT (preview wrapper) ============================== */
export default function App() {
  const [role, setRole] = useState("admin");
  const roles = [
    { key: "admin", label: "Admin", icon: ShieldCheck },
    { key: "teacher", label: "Coach / Patron", icon: BookOpen },
    { key: "student", label: "Student", icon: GraduationCap },
    { key: "parent", label: "Parent", icon: Heart },
  ];
  return (
    <div style={{ minHeight: "100vh", background: C.bgGrad, ...bodyFont, padding: 26 }}>
      <style>{`${FONT_IMPORT} * { box-sizing: border-box; } input::placeholder { color: ${C.textFaint}; } select { cursor: pointer; }`}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ ...displayFont, fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>Sports & Clubs</h1>
            <p style={{ fontSize: 12.5, color: C.textMuted, margin: "2px 0 0" }}>Teams, fixtures, athlete records, clubs & activity reports</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <button key={r.key} onClick={() => setRole(r.key)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 13px", borderRadius: 10, border: `1px solid ${role === r.key ? C.indigo : C.border}`, background: role === r.key ? C.indigoSoft : "transparent", color: role === r.key ? C.text : C.textMuted, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                  <Icon size={13} /> {r.label}
                </button>
              );
            })}
          </div>
        </div>
        {role === "admin" && <SportsAdminView />}
        {role === "teacher" && <SportsTeacherView />}
        {(role === "student" || role === "parent") && <SportsPersonalView role={role} />}
      </div>
    </div>
  );
}