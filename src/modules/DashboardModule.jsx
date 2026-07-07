import React, { useState, useEffect } from "react";
import {
  Users, GraduationCap, CalendarCheck, FileText, Wallet, MessageSquare,
  Sparkles, AlertTriangle, CheckCircle2, Clock, Award, Info, Loader2
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { REVENUE_TREND, FEE_STATUS, APPLICANTS } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

function DashboardModule({ role, currentUser }) {
  const [students,      setStudents]      = useState([]);
  const [staff,         setStaff]         = useState([]);
  const [invoices,      setInvoices]      = useState([]);
  const [attendanceRows,setAttendanceRows] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [timetable,     setTimetable]     = useState([]);
  const [loading,       setLoading]       = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const myClass = currentUser?.class_name || "Form 4A";
    Promise.all([
      supabase.from("students").select("*"),
      supabase.from("staff").select("*"),
      supabase.from("invoices").select("*"),
      supabase.from("attendance").select("*"),
      supabase.from("announcements").select("*").order("date", { ascending: false }),
      supabase.from("timetable").select("*").eq("cls", myClass).order("id"),
    ]).then(([sR, stR, iR, aR, anR, tR]) => {
      setStudents(sR.data || []);
      setStaff(stR.data || []);
      setInvoices(iR.data || []);
      setAttendanceRows(aR.data || []);
      setAnnouncements(anR.data || []);
      setTimetable(tR.data || []);
      setLoading(false);
    });
  }, []);

  /* ---- shared aggregates ---- */
  const todayISO        = new Date().toISOString().slice(0, 10);
  const totalCollected  = invoices.reduce((s, i) => s + Number(i.paid || 0), 0);
  const totalInvoiced   = invoices.reduce((s, i) => s + Number(i.amount || 0), 0);
  const collectionRate  = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 0;
  const todaysAtt       = attendanceRows.filter((r) => r.date === todayISO);
  const todayRate       = todaysAtt.length > 0
    ? `${((todaysAtt.filter((r) => r.status !== "Absent").length / todaysAtt.length) * 100).toFixed(1)}%`
    : "—";

  const studentsByClass = Object.values(
    students.reduce((acc, s) => {
      const k = s.cls || "—";
      if (!acc[k]) acc[k] = { cls: k, students: 0 };
      acc[k].students++;
      return acc;
    }, {})
  ).sort((a, b) => a.cls.localeCompare(b.cls));

  const classPerformance = Object.values(
    students.reduce((acc, s) => {
      const k = s.cls || "—";
      if (!acc[k]) acc[k] = { cls: k, total: 0, count: 0 };
      acc[k].total += Number(s.average || 0);
      acc[k].count++;
      return acc;
    }, {})
  ).map((c) => ({ cls: c.cls, avg: Math.round(c.total / c.count) }));

  const feeByStatus = ["Paid", "Partial", "Overdue"].map((status) => ({
    status,
    amount: invoices.filter((i) => i.status === status).reduce((s, i) => s + Number(i.amount || 0), 0),
  }));

  const flagged = [...students].filter((s) => s.risk && s.risk !== "Low").sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));
  const topPerformer = [...students].sort((a, b) => Number(b.average || 0) - Number(a.average || 0))[0];
  const insights = [
    ...flagged.slice(0, 3).map((s) => ({
      severity: s.risk === "High" ? "High" : "Watch",
      student: s.name,
      msg: `Attendance at ${s.attendance}%${Number(s.balance || 0) > 0 ? ` · outstanding balance ${fmtMoney(s.balance)}.` : ", flagged on academic risk."}`,
    })),
    topPerformer ? { severity: "Positive", student: topPerformer.name, msg: `Leading ${topPerformer.cls} with ${topPerformer.average}% average and ${topPerformer.attendance}% attendance.` } : null,
  ].filter(Boolean).slice(0, 4);

  const iconBtn = (Icon, col) => <Icon size={14} color={col} />;

  if (loading) return <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>;

  /* ── ADMIN ── */
  if (role === "admin") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={Users}        label="Total Students"    value={String(students.length)}      tone="indigo" />
        <StatCard icon={GraduationCap}label="Teaching Staff"    value={String(staff.filter((s) => /teach/i.test(s.role || "")).length || staff.length)} tone="cyan" />
        <StatCard icon={Wallet}       label="Revenue Collected" value={fmtMoney(totalCollected)} delta={`${collectionRate.toFixed(1)}% of invoiced`} tone="green" />
        <StatCard icon={CalendarCheck}label="Attendance Today"  value={todayRate} delta={todaysAtt.length > 0 ? `${todaysAtt.length} marked` : "Nothing marked yet"} deltaTone={todaysAtt.length > 0 ? "green" : "red"} tone="amber" />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: 2, minWidth: 320 }}>
          <SectionHeader title="Students by Class" subtitle="Live enrollment distribution" />
          {studentsByClass.length === 0
            ? <div style={{ textAlign: "center", padding: 30, fontSize: 13, color: C.textMuted }}>No students enrolled yet.</div>
            : <ResponsiveContainer width="100%" height={220}><BarChart data={studentsByClass}><CartesianGrid stroke={C.borderSoft} vertical={false} /><XAxis dataKey="cls" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} /><YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="students" name="Students" fill={C.indigo} radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
          }
        </Card>
        <Card style={{ flex: 1, minWidth: 260 }}>
          <SectionHeader title="Risk & Performance Alerts" subtitle="Live from student records" />
          {insights.length === 0
            ? <div style={{ fontSize: 13, color: C.textMuted, padding: "8px 0" }}>No alerts — add students to generate insights.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {insights.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ marginTop: 2 }}>{a.severity === "High" ? <AlertTriangle size={14} color={C.red} /> : a.severity === "Positive" ? <CheckCircle2 size={14} color={C.green} /> : <Info size={14} color={C.amber} />}</div>
                    <div><div style={{ fontSize: 12.5, color: C.text, fontWeight: 600 }}>{a.student}</div><div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>{a.msg}</div></div>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 280 }}>
          <SectionHeader title="Fee Collection by Status" subtitle="Live invoice totals (USD)" />
          {invoices.length === 0
            ? <div style={{ textAlign: "center", padding: 30, fontSize: 13, color: C.textMuted }}>No invoices yet.</div>
            : <ResponsiveContainer width="100%" height={200}><BarChart data={feeByStatus}><CartesianGrid stroke={C.borderSoft} vertical={false} /><XAxis dataKey="status" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} /><YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="amount" name="Amount" radius={[4,4,0,0]}>{feeByStatus.map((e, i) => <Cell key={i} fill={e.status === "Paid" ? C.green : e.status === "Partial" ? C.amber : C.red} />)}</Bar></BarChart></ResponsiveContainer>
          }
        </Card>
        <Card style={{ flex: 1, minWidth: 280 }}>
          <SectionHeader title="Class Performance" subtitle="Average score by class" />
          {classPerformance.length === 0
            ? <div style={{ textAlign: "center", padding: 30, fontSize: 13, color: C.textMuted }}>No student data yet.</div>
            : <ResponsiveContainer width="100%" height={200}><RadarChart data={classPerformance}><PolarGrid stroke={C.borderSoft} /><PolarAngleAxis dataKey="cls" stroke={C.textFaint} fontSize={11.5} /><Radar dataKey="avg" stroke={C.indigo} fill={C.indigo} fillOpacity={0.35} /></RadarChart></ResponsiveContainer>
          }
        </Card>
      </div>
    </div>
  );

  /* ── TEACHER ── */
  if (role === "teacher") {
    const me = staff.find((s) => s.name === currentUser?.full_name) || staff[0];
    const myClass = currentUser?.class_name || me?.classes?.[0] || "—";
    const taughtStudents = students.filter((s) => s.cls === myClass);
    const avgAtt = taughtStudents.length ? (taughtStudents.reduce((s, x) => s + Number(x.attendance || 0), 0) / taughtStudents.length).toFixed(0) : "—";
    const studentPerf = [...taughtStudents].sort((a, b) => Number(b.average || 0) - Number(a.average || 0));

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon={GraduationCap} label="My Class"         value={myClass}                   tone="indigo" />
          <StatCard icon={Users}         label="Students"         value={String(taughtStudents.length)} tone="cyan" />
          <StatCard icon={CalendarCheck} label="Avg. Attendance"  value={avgAtt !== "—" ? `${avgAtt}%` : "—"} tone="green" />
          <StatCard icon={FileText}      label="Upcoming Exams"   value="—"                         tone="amber" />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card style={{ flex: 1, minWidth: 300 }}>
            <SectionHeader title={`Today's Timetable — ${myClass}`} />
            {timetable.length === 0
              ? <div style={{ fontSize: 13, color: C.textMuted, padding: "8px 0" }}>No timetable set up yet. Add entries in the Academics module.</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {timetable.slice(0, 4).map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 3 ? `1px solid ${C.borderSoft}` : "none" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Clock size={14} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text, fontWeight: 600, ...monoFont }}>{row.time}</span></div>
                      <span style={{ fontSize: 13, color: C.textMuted }}>{row.mon}</span>
                    </div>
                  ))}
                </div>
            }
          </Card>
          <Card style={{ flex: 1, minWidth: 280 }}>
            <SectionHeader title={`${myClass} — Top Students`} subtitle="By current average" />
            {studentPerf.length === 0
              ? <div style={{ fontSize: 13, color: C.textMuted, padding: "8px 0" }}>No students in this class yet.</div>
              : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {studentPerf.slice(0, 5).map((s, i) => (
                    <div key={s.id || i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 4 ? `1px solid ${C.borderSoft}` : "none" }}>
                      <Avatar name={s.name} size={26} />
                      <span style={{ flex: 1, fontSize: 13, color: C.text }}>{s.name}</span>
                      <Pill tone={Number(s.average) >= 80 ? "green" : Number(s.average) >= 60 ? "indigo" : "amber"}>{s.average}%</Pill>
                    </div>
                  ))}
                </div>
            }
          </Card>
        </div>
      </div>
    );
  }

  /* ── STUDENT ── */
  if (role === "student") {
    const myClass = currentUser?.class_name || "Form 4A";
    const s = students.find((x) => x.name === currentUser?.full_name) || students[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {s && (
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <StatCard icon={CalendarCheck} label="My Attendance" value={`${s.attendance}%`}           tone="green"  />
            <StatCard icon={Award}         label="Current Average" value={`${s.average}%`}            tone="indigo" />
            <StatCard icon={Wallet}        label="Fee Balance"   value={fmtMoney(s.balance || 0)}    tone="cyan"   />
            <StatCard icon={FileText}      label="Upcoming Exams" value="—"                           tone="amber"  />
          </div>
        )}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card style={{ flex: 2, minWidth: 320 }}>
            <SectionHeader title={`Today — ${myClass}`} />
            {timetable.length === 0
              ? <div style={{ fontSize: 13, color: C.textMuted, padding: "8px 0" }}>Timetable not set up yet.</div>
              : <div style={{ display: "flex", flexDirection: "column" }}>
                  {timetable.slice(0, 4).map((row, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${C.borderSoft}` : "none" }}>
                      <span style={{ fontSize: 13, color: C.textMuted, width: 110, ...monoFont }}>{row.time}</span>
                      <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{row.mon}</span>
                    </div>
                  ))}
                </div>
            }
          </Card>
          <Card style={{ flex: 1, minWidth: 240, background: `linear-gradient(135deg, ${C.indigoSoft}, ${C.cyanSoft})`, border: `1px solid ${C.border}` }}>
            <Sparkles size={20} color={C.cyan} />
            <h3 style={{ ...displayFont, fontSize: 16, color: C.text, margin: "10px 0 6px" }}>Need help studying?</h3>
            <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>Your AI Tutor can explain concepts and generate practice questions. Head to AI Hub to get started.</p>
          </Card>
        </div>
      </div>
    );
  }

  /* ── PARENT ── */
  const s = students.find((x) => x.name === currentUser?.full_name) || students[0];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {s && (
        <>
          <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={s.name} size={44} />
            <div>
              <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{s.name}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted }}>{s.cls} · <span style={monoFont}>{s.id}</span></div>
            </div>
          </Card>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <StatCard icon={CalendarCheck} label="Attendance"     value={`${s.attendance}%`}        tone="green"  />
            <StatCard icon={Award}         label="Current Average" value={`${s.average}%`}          tone="indigo" />
            <StatCard icon={Wallet}        label="Fee Balance"    value={fmtMoney(s.balance || 0)}  tone="cyan"   />
            <StatCard icon={MessageSquare} label="Announcements"  value={String(announcements.length)} tone="amber" />
          </div>
        </>
      )}
      {!s && <div style={{ fontSize: 13, color: C.textMuted }}>No student record found. Contact the administrator.</div>}
      <Card>
        <SectionHeader title="Recent School Communications" />
        {announcements.length === 0
          ? <div style={{ fontSize: 13, color: C.textMuted, padding: "8px 0" }}>No announcements yet.</div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        }
      </Card>
    </div>
  );
}

export { DashboardModule };