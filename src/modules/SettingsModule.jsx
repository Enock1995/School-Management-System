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

// Supabase column is home_away (snake_case); normalize to homeAway for the UI.
function normalizeFixture(row) {
  return { ...row, homeAway: row.homeAway ?? row.home_away };
}

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

const MOCK_CLUB_MEMBERS = {
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

/* ============================== CLUB DETAIL MODAL ============================== */
function ClubModal({ club, clubMembers, onClose }) {
  if (!club) return null;
  const members = clubMembers[club.name] || [];
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
function SportsAdminView({ teams, clubs, fixtures, clubMembers, loading, usingLiveData }) {
  const [tab, setTab] = useState("fixtures");
  const [selectedClub, setSelectedClub] = useState(null);

  const upcoming = fixtures.filter((f) => f.status === "Upcoming").length;
  const wins = fixtures.filter((f) => f.result && f.result.startsWith("Won")).length;
  const totalMembers = clubs.reduce((s, c) => s + c.members, 0);
  const membershipChart = clubs.map((c) => ({ name: c.name.split(" ")[0], members: c.members }));

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
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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

      <ClubModal club={selectedClub} clubMembers={clubMembers} onClose={() => setSelectedClub(null)} />
    </div>
  );
}

/* ============================== TEACHER (COACH / PATRON) VIEW ============================== */
function SportsTeacherView({ teams, clubs, fixtures, clubMembers }) {
  const myTeam = teams.find((t) => t.coach === "Mr. T. Moyo");
  const myClub = clubs.find((c) => c.patron === "Mr. T. Moyo");
  const teamRoster = ATHLETES.filter((a) => a.team === (myTeam ? myTeam.name : ""));
  const teamFixtures = fixtures.filter((f) => f.team === (myTeam ? myTeam.name : ""));
  const myClubMembers = myClub ? clubMembers[myClub.name] || [] : [];

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
            {myClubMembers.map((m) => (
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
function SportsPersonalView({ role, clubs, fixtures, clubMembers }) {
  const studentName = "Tadiwa Mhofu";
  const myTeams = ATHLETES.filter((a) => a.name === studentName);
  const myClubs = Object.entries(clubMembers).filter(([, members]) => members.includes(studentName)).map(([name]) => clubs.find((c) => c.name === name));
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

/* ============================== ROOT (preview wrapper) ============================== */

function SportsModule({ role }) {
  const [teams, setTeams] = useState(MOCK_TEAMS);
  const [clubs, setClubs] = useState(MOCK_CLUBS);
  const [fixtures, setFixtures] = useState(MOCK_FIXTURES);
  const [clubMembers, setClubMembers] = useState(MOCK_CLUB_MEMBERS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from("teams").select("*").order("id"),
      supabase.from("clubs").select("*").order("id"),
      supabase.from("fixtures").select("*").order("date"),
      supabase.from("club_members").select("*").order("club_name"),
    ]).then(([teamsRes, clubsRes, fixturesRes, clubMembersRes]) => {
      if (teamsRes.error) {
        console.warn("Falling back to demo team data:", teamsRes.error.message);
      } else if (teamsRes.data && teamsRes.data.length > 0) {
        setTeams(teamsRes.data);
        setUsingLiveData(true);
      }
      if (clubsRes.error) {
        console.warn("Falling back to demo club data:", clubsRes.error.message);
      } else if (clubsRes.data && clubsRes.data.length > 0) {
        setClubs(clubsRes.data);
        setUsingLiveData(true);
      }
      if (fixturesRes.error) {
        console.warn("Falling back to demo fixture data:", fixturesRes.error.message);
      } else if (fixturesRes.data && fixturesRes.data.length > 0) {
        setFixtures(fixturesRes.data.map(normalizeFixture));
        setUsingLiveData(true);
      }
      if (clubMembersRes.error) {
        console.warn("Falling back to demo club member data:", clubMembersRes.error.message);
      } else if (clubMembersRes.data && clubMembersRes.data.length > 0) {
        const lookup = {};
        clubMembersRes.data.forEach((row) => {
          if (!lookup[row.club_name]) lookup[row.club_name] = [];
          lookup[row.club_name].push(row.student_name);
        });
        setClubMembers(lookup);
        setUsingLiveData(true);
      }
      setLoading(false);
    });
  }, []);

  if (role === "admin") return <SportsAdminView teams={teams} clubs={clubs} fixtures={fixtures} clubMembers={clubMembers} loading={loading} usingLiveData={usingLiveData} />;
  if (role === "teacher") return <SportsTeacherView teams={teams} clubs={clubs} fixtures={fixtures} clubMembers={clubMembers} />;
  return <SportsPersonalView role={role} clubs={clubs} fixtures={fixtures} clubMembers={clubMembers} />;
}

export { SportsModule };