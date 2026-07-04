import React, { useState, useEffect } from "react";
import {
  Users, GraduationCap, CalendarCheck, FileText, Wallet, MessageSquare, Sparkles, AlertTriangle, CheckCircle2, Clock, Award, Info, Loader2
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import {
  CLASSES, SUBJECTS, STUDENTS as MOCK_STUDENTS, APPLICANTS, STAFF as MOCK_TEACHING_STAFF,
  ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH,
  INVOICES as MOCK_INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS as MOCK_ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A
} from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

function DashboardModule({ role }) {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [staff, setStaff] = useState([]);
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [announcements, setAnnouncements] = useState(MOCK_ANNOUNCEMENTS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from("students").select("*"),
      supabase.from("staff").select("*"),
      supabase.from("invoices").select("*"),
      supabase.from("attendance").select("*"),
      supabase.from("announcements").select("*").order("date", { ascending: false }),
    ]).then(([studentsRes, staffRes, invoicesRes, attendanceRes, announcementsRes]) => {
      let any = false;

      if (studentsRes.error) console.warn("Dashboard: students fallback —", studentsRes.error.message);
      else if (studentsRes.data && studentsRes.data.length > 0) { setStudents(studentsRes.data); any = true; }

      if (staffRes.error) console.warn("Dashboard: staff fallback —", staffRes.error.message);
      else if (staffRes.data && staffRes.data.length > 0) { setStaff(staffRes.data); any = true; }

      if (invoicesRes.error) console.warn("Dashboard: invoices fallback —", invoicesRes.error.message);
      else if (invoicesRes.data && invoicesRes.data.length > 0) { setInvoices(invoicesRes.data); any = true; }

      if (attendanceRes.error) console.warn("Dashboard: attendance fallback —", attendanceRes.error.message);
      else if (attendanceRes.data && attendanceRes.data.length > 0) { setAttendanceRows(attendanceRes.data); any = true; }

      if (announcementsRes.error) console.warn("Dashboard: announcements fallback —", announcementsRes.error.message);
      else if (announcementsRes.data && announcementsRes.data.length > 0) { setAnnouncements(announcementsRes.data); any = true; }

      if (any) setUsingLiveData(true);
      setLoading(false);
    });
  }, []);

  const liveIndicator = (loading || usingLiveData) && (
    <div>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing live data…</span>}
      {usingLiveData && <Pill tone="green">Live data</Pill>}
    </div>
  );

  // ---- Aggregates derived from whatever is in state (live if fetched, mock otherwise) ----
  const totalStudents = students.length;

  const teachingStaffCount = staff.length > 0
    ? staff.filter((s) => /teach/i.test(s.role || "")).length
    : MOCK_TEACHING_STAFF.length;

  const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalCollected = invoices.reduce((sum, i) => sum + Number(i.paid || 0), 0);
  const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;

  const todayISO = new Date().toISOString().slice(0, 10);
  const todaysAttendance = attendanceRows.filter((r) => r.date === todayISO);
  let attendanceValue, attendanceDelta, attendanceDeltaTone;
  if (todaysAttendance.length > 0) {
    const rate = (todaysAttendance.filter((r) => r.status !== "Absent").length / todaysAttendance.length) * 100;
    attendanceValue = `${rate.toFixed(1)}%`;
    attendanceDelta = `${todaysAttendance.length} marked today`;
    attendanceDeltaTone = "green";
  } else if (attendanceRows.length > 0) {
    const latestDate = attendanceRows.reduce((max, r) => (r.date > max ? r.date : max), attendanceRows[0].date);
    const latestRows = attendanceRows.filter((r) => r.date === latestDate);
    const rate = (latestRows.filter((r) => r.status !== "Absent").length / latestRows.length) * 100;
    attendanceValue = `${rate.toFixed(1)}%`;
    attendanceDelta = `Latest marked: ${new Date(latestDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    attendanceDeltaTone = "red";
  } else {
    const avg = students.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / (students.length || 1);
    attendanceValue = `${avg.toFixed(1)}%`;
    attendanceDelta = "Term average — nothing marked today yet";
    attendanceDeltaTone = "red";
  }

  const studentsByClass = Object.values(
    students.reduce((acc, s) => {
      const key = s.cls || "Unassigned";
      if (!acc[key]) acc[key] = { cls: key, students: 0 };
      acc[key].students += 1;
      return acc;
    }, {})
  ).sort((a, b) => a.cls.localeCompare(b.cls));

  const classPerformance = Object.values(
    students.reduce((acc, s) => {
      const key = s.cls || "Unassigned";
      if (!acc[key]) acc[key] = { cls: key, total: 0, count: 0 };
      acc[key].total += Number(s.average || 0);
      acc[key].count += 1;
      return acc;
    }, {})
  ).map((c) => ({ cls: c.cls, avg: Math.round(c.total / c.count) })).sort((a, b) => a.cls.localeCompare(b.cls));

  const feeByStatus = ["Paid", "Partial", "Overdue"].map((status) => ({
    status,
    amount: invoices.filter((i) => i.status === status).reduce((s, i) => s + Number(i.amount || 0), 0),
  }));

  const flagged = [...students]
    .filter((s) => s.risk && s.risk !== "Low")
    .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));
  const topPerformer = [...students].sort((a, b) => Number(b.average || 0) - Number(a.average || 0))[0];

  const insights = [
    ...flagged.slice(0, 3).map((s) => ({
      severity: s.risk === "High" ? "High" : "Watch",
      student: s.name,
      msg: `Attendance at ${s.attendance}%${Number(s.balance || 0) > 0 ? ` with an outstanding balance of ${fmtMoney(s.balance)}.` : ", flagged on academic risk."}`,
    })),
    topPerformer ? {
      severity: "Positive",
      student: topPerformer.name,
      msg: `Leading ${topPerformer.cls} with a ${topPerformer.average}% average and ${topPerformer.attendance}% attendance.`,
    } : null,
  ].filter(Boolean).slice(0, 4);

  if (role === "admin") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {liveIndicator}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon={Users} label="Total Students" value={String(totalStudents)} tone="indigo" />
          <StatCard icon={GraduationCap} label="Teaching Staff" value={String(teachingStaffCount)} tone="cyan" />
          <StatCard icon={Wallet} label="Revenue Collected" value={fmtMoney(totalCollected)} delta={`${collectionRate.toFixed(1)}% of invoiced`} tone="green" />
          <StatCard icon={CalendarCheck} label="Attendance Today" value={attendanceValue} delta={attendanceDelta} deltaTone={attendanceDeltaTone} tone="amber" />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card style={{ flex: 2, minWidth: 320 }}>
            <SectionHeader title="Students by Class" subtitle="Current enrollment distribution, live from the Students directory" />
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={studentsByClass}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="cls" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="students" name="Students" fill={C.indigo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ flex: 1, minWidth: 260 }}>
            <SectionHeader title="Risk & Performance Alerts" subtitle="Generated from live attendance, average & fee balance" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {insights.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ marginTop: 2 }}>
                    {a.severity === "High" ? <AlertTriangle size={14} color={C.red} /> : a.severity === "Positive" ? <CheckCircle2 size={14} color={C.green} /> : <Info size={14} color={C.amber} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{a.student}</div>
                    <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>{a.msg}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card style={{ flex: 1, minWidth: 280 }}>
            <SectionHeader title="Fee Collection by Status" subtitle="Live invoice totals (USD)" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={feeByStatus}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="status" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                  {feeByStatus.map((entry, i) => (
                    <Cell key={i} fill={entry.status === "Paid" ? C.green : entry.status === "Partial" ? C.amber : C.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ flex: 1, minWidth: 280 }}>
            <SectionHeader title="Class Performance" subtitle="Average score by class, live from Students" />
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={classPerformance}>
                <PolarGrid stroke={C.borderSoft} />
                <PolarAngleAxis dataKey="cls" stroke={C.textFaint} fontSize={11.5} />
                <Radar dataKey="avg" stroke={C.indigo} fill={C.indigo} fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  }

  if (role === "teacher") {
    const teacherRecord = MOCK_TEACHING_STAFF.find((t) => t.name === "Mr. T. Moyo") || MOCK_TEACHING_STAFF[0];
    const teacherClasses = teacherRecord?.classes || [];
    const taughtStudents = students.filter((s) => teacherClasses.includes(s.cls));
    const avgAttendance = taughtStudents.length
      ? (taughtStudents.reduce((sum, s) => sum + Number(s.attendance || 0), 0) / taughtStudents.length).toFixed(0)
      : "—";

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {liveIndicator}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon={GraduationCap} label="My Classes" value={String(teacherClasses.length)} tone="indigo" />
          <StatCard icon={Users} label="Students Taught" value={String(taughtStudents.length)} tone="cyan" />
          <StatCard icon={CalendarCheck} label="Avg. Attendance" value={`${avgAttendance}%`} tone="green" />
          <StatCard icon={FileText} label="Pending Marking" value="14" tone="amber" />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card style={{ flex: 1, minWidth: 300 }}>
            <SectionHeader title={`Today's Timetable — ${teacherRecord?.name || "Mr. T. Moyo"}`} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { t: "7:30 – 8:15", c: "Form 1A · Mathematics", r: "Room 12" },
                { t: "9:15 – 10:00", c: "Form 4A · Mathematics", r: "Room 4" },
                { t: "10:15 – 11:00", c: "Form 4A · Mathematics", r: "Room 4" },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < 2 ? `1px solid ${C.borderSoft}` : "none" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <Clock size={14} color={C.textMuted} />
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{row.t}</span>
                  </div>
                  <span style={{ fontSize: 13, color: C.textMuted }}>{row.c}</span>
                  <Pill tone="indigo">{row.r}</Pill>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ flex: 1, minWidth: 280 }}>
            <SectionHeader title="Form 4A — Mathematics" subtitle="Recent unit test performance" />
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={RESULTS_F4A_MATH.filter((r) => r.score > 0)}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="name" stroke={C.textFaint} fontSize={10.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="score" fill={C.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    );
  }

  if (role === "student") {
    const s = students.find((st) => st.name === "Tadiwa Mhofu") || students[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {liveIndicator}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon={CalendarCheck} label="My Attendance" value={`${s.attendance}%`} tone="green" />
          <StatCard icon={Award} label="Current Average" value={`${s.average}%`} tone="indigo" />
          <StatCard icon={Wallet} label="Fee Balance" value={fmtMoney(s.balance || 0)} tone="cyan" />
          <StatCard icon={FileText} label="Upcoming Exams" value="2" tone="amber" />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card style={{ flex: 2, minWidth: 320 }}>
            <SectionHeader title="Today — Form 4A" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TIMETABLE_F4A.slice(0, 4).map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${C.borderSoft}` : "none" }}>
                  <span style={{ fontSize: 13, color: C.textMuted, width: 110 }}>{row.time}</span>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{row.mon}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card style={{ flex: 1, minWidth: 260, background: `linear-gradient(135deg, ${C.indigoSoft}, ${C.cyanSoft})`, border: `1px solid ${C.border}` }}>
            <Sparkles size={20} color={C.cyan} />
            <h3 style={{ ...displayFont, fontSize: 16, color: C.text, margin: "10px 0 6px" }}>Need help studying?</h3>
            <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5, marginBottom: 12 }}>Your AI Tutor can explain concepts, generate practice questions, and help you prep for the Mid-Term Test.</p>
          </Card>
        </div>
      </div>
    );
  }

  // parent
  const s = students.find((st) => st.name === "Tadiwa Mhofu") || students[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {liveIndicator}
      <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name={s.name} size={44} />
        <div>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{s.name}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>{s.cls} · Admission <span style={monoFont}>{s.id}</span></div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={CalendarCheck} label="Attendance" value={`${s.attendance}%`} tone="green" />
        <StatCard icon={Award} label="Current Average" value={`${s.average}%`} tone="indigo" />
        <StatCard icon={Wallet} label="Fee Balance" value={fmtMoney(s.balance || 0)} tone="cyan" />
        <StatCard icon={MessageSquare} label="Unread Updates" value="3" tone="amber" />
      </div>
      <Card>
        <SectionHeader title="Recent School Communications" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {announcements.slice(0, 3).map((a) => (
            <div key={a.id} style={{ paddingBottom: 12, borderBottom: `1px solid ${C.borderSoft}` }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{a.title}</span>
                <span style={{ fontSize: 11.5, color: C.textFaint }}>{a.date}</span>
              </div>
              <p style={{ fontSize: 12.5, color: C.textMuted, margin: "4px 0 0", lineHeight: 1.45 }}>{a.body}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}


export { DashboardModule };