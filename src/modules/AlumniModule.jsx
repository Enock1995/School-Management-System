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

const MOCK_ALUMNI = [
  { id: "AL-01", name: "Tendai Mutema", gradYear: 2015, profession: "Software Engineer", company: "Google", location: "London, UK", email: "t.mutema@alumni.springfield.edu", phone: "+44 20 7946 0011", donorStatus: "Donor" },
  { id: "AL-02", name: "Rumbidzai Chando", gradYear: 2012, profession: "Medical Doctor", company: "Parirenyatwa Hospital", location: "Harare, ZW", email: "r.chando@alumni.springfield.edu", phone: "+263 77 220 4471", donorStatus: "Donor" },
  { id: "AL-03", name: "James Coetzee", gradYear: 2018, profession: "Civil Engineer", company: "Group Five", location: "Johannesburg, SA", email: "j.coetzee@alumni.springfield.edu", phone: "+27 11 233 8800", donorStatus: "Non-donor" },
  { id: "AL-04", name: "Farai Mhlanga", gradYear: 2009, profession: "Entrepreneur", company: "Mhlanga Logistics", location: "Harare, ZW", email: "f.mhlanga@alumni.springfield.edu", phone: "+263 71 442 6654", donorStatus: "Donor" },
  { id: "AL-05", name: "Tariro Ndoro", gradYear: 2020, profession: "Graduate Student", company: "University of Cape Town", location: "Cape Town, SA", email: "t.ndoro@alumni.springfield.edu", phone: "+27 21 650 9111", donorStatus: "Non-donor" },
  { id: "AL-06", name: "Blessing Chivero", gradYear: 2014, profession: "Investment Banker", company: "Standard Chartered", location: "Harare, ZW", email: "b.chivero@alumni.springfield.edu", phone: "+263 78 901 2233", donorStatus: "Donor" },
  { id: "AL-07", name: "Anesu Mapfumo", gradYear: 2017, profession: "Architect", company: "Mapfumo Designs", location: "Harare, ZW", email: "a.mapfumo@alumni.springfield.edu", phone: "+263 73 209 8821", donorStatus: "Non-donor" },
  { id: "AL-08", name: "Tatenda Gwese", gradYear: 2011, profession: "Pilot", company: "Fastjet", location: "Harare, ZW", email: "t.gwese@alumni.springfield.edu", phone: "+263 77 998 4432", donorStatus: "Donor" },
];

const MOCK_DONATIONS = [
  { alumnus: "Tendai Mutema", amount: 500, date: "2026-05-10", campaign: "Library Renovation Fund", method: "Bank Transfer" },
  { alumnus: "Farai Mhlanga", amount: 1200, date: "2026-04-22", campaign: "Scholarship Fund", method: "Bank Transfer" },
  { alumnus: "Blessing Chivero", amount: 750, date: "2026-06-01", campaign: "Scholarship Fund", method: "Stripe" },
  { alumnus: "Tatenda Gwese", amount: 300, date: "2026-03-15", campaign: "Sports Complex Fund", method: "EcoCash" },
  { alumnus: "Rumbidzai Chando", amount: 400, date: "2026-05-28", campaign: "Library Renovation Fund", method: "Paynow" },
];

const MOCK_EVENTS = [
  { title: "Class of 2015 — 10 Year Reunion", date: "2026-08-15", venue: "Springfield Main Hall", type: "Reunion", rsvp: 42, status: "Upcoming" },
  { title: "Alumni Networking Mixer — Harare", date: "2026-07-10", venue: "Meikles Hotel", type: "Networking", rsvp: 28, status: "Upcoming" },
  { title: "Annual Alumni Golf Day", date: "2026-05-03", venue: "Royal Harare Golf Club", type: "Fundraiser", rsvp: 36, status: "Completed" },
];

const MOCK_MENTORSHIP = [
  { mentor: "Tendai Mutema", field: "Software Engineer", student: "Tadiwa Mhofu", status: "Matched" },
  { mentor: "Rumbidzai Chando", field: "Medical Doctor", student: "Chiedza Goredema", status: "Matched" },
  { mentor: "Anesu Mapfumo", field: "Architect", student: "Tinotenda Chigumba", status: "Pending" },
];

// Derives the monthly donations trend straight from live donation records, rather than
// keeping a separate hardcoded chart dataset that could drift out of sync with the real numbers.
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

// Supabase columns are grad_year and donor_status (snake_case); normalize to camelCase for the UI.
function normalizeAlumnus(row) {
  return { ...row, gradYear: row.gradYear ?? row.grad_year, donorStatus: row.donorStatus ?? row.donor_status };
}

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
function AlumniAdminView({ alumni, donations, events, mentorship, loading, usingLiveData }) {
  const [tab, setTab] = useState("directory");
  const [query, setQuery] = useState("");
  const [selectedAlum, setSelectedAlum] = useState(null);

  const filtered = alumni.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));
  const totalRaised = donations.reduce((s, d) => s + d.amount, 0);
  const donorCount = alumni.filter((a) => a.donorStatus === "Donor").length;
  const upcomingEvents = events.filter((e) => e.status === "Upcoming").length;
  const donationTrend = computeDonationTrend(donations);

  return (
    <div>
      {(loading || usingLiveData) && (
        <div style={{ marginBottom: 16 }}>
          {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing live data…</span>}
          {usingLiveData && <Pill tone="green">Live data</Pill>}
        </div>
      )}
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
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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
    </div>
  );
}

/* ============================== TEACHER (MENTORSHIP COORDINATOR) VIEW ============================== */
function AlumniTeacherView({ mentorship, events }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionHeader title="Mentorship Coordination" subtitle="Current alumni-to-student matches" action={
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
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

/* ============================== ROOT (preview wrapper) ============================== */

function AlumniModule({ role }) {
  const [alumni, setAlumni] = useState(MOCK_ALUMNI);
  const [donations, setDonations] = useState(MOCK_DONATIONS);
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [mentorship, setMentorship] = useState(MOCK_MENTORSHIP);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from("alumni").select("*").order("grad_year", { ascending: false }),
      supabase.from("donations").select("*").order("date", { ascending: false }),
      supabase.from("events").select("*").order("date"),
      supabase.from("mentorship").select("*").order("mentor"),
    ]).then(([alumniRes, donationsRes, eventsRes, mentorshipRes]) => {
      if (alumniRes.error) {
        console.warn("Falling back to demo alumni data:", alumniRes.error.message);
      } else if (alumniRes.data && alumniRes.data.length > 0) {
        setAlumni(alumniRes.data.map(normalizeAlumnus));
        setUsingLiveData(true);
      }
      if (donationsRes.error) {
        console.warn("Falling back to demo donation data:", donationsRes.error.message);
      } else if (donationsRes.data && donationsRes.data.length > 0) {
        setDonations(donationsRes.data);
        setUsingLiveData(true);
      }
      if (eventsRes.error) {
        console.warn("Falling back to demo event data:", eventsRes.error.message);
      } else if (eventsRes.data && eventsRes.data.length > 0) {
        setEvents(eventsRes.data);
        setUsingLiveData(true);
      }
      if (mentorshipRes.error) {
        console.warn("Falling back to demo mentorship data:", mentorshipRes.error.message);
      } else if (mentorshipRes.data && mentorshipRes.data.length > 0) {
        setMentorship(mentorshipRes.data);
        setUsingLiveData(true);
      }
      setLoading(false);
    });
  }, []);

  if (role === "admin") return <AlumniAdminView alumni={alumni} donations={donations} events={events} mentorship={mentorship} loading={loading} usingLiveData={usingLiveData} />;
  if (role === "teacher") return <AlumniTeacherView mentorship={mentorship} events={events} />;
  return <AlumniStudentView alumni={alumni} mentorship={mentorship} events={events} />;
}

export { AlumniModule };