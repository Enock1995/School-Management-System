import React, { useState, useEffect } from "react";
import {
  Wallet, CalendarCheck, Briefcase, Users, Printer, FileSpreadsheet,
  Loader2, BarChart2
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";
import { C, fmtMoney } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Tag, Table, CustomTooltip } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

/* ── CSV export (client-side, no backend needed) ── */
function exportCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.setAttribute("download", filename);
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function ExportBar({ onCSV }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={() => window.print()} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 12px", color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        <Printer size={13} /> Export PDF
      </button>
      <button onClick={onCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigoSoft, border: `1px solid ${C.indigo}`, borderRadius: 9, padding: "7px 12px", color: C.indigo, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        <FileSpreadsheet size={13} /> Export CSV
      </button>
    </div>
  );
}

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <BarChart2 size={34} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function PlaceholderChart({ message }) {
  return (
    <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: C.surface2, borderRadius: 12, border: `1px dashed ${C.border}` }}>
      <div style={{ textAlign: "center" }}>
        <BarChart2 size={24} color={C.border} style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 12.5, color: C.textFaint }}>{message}</div>
      </div>
    </div>
  );
}

/* ── Admin view ── */
function ReportsAdminView() {
  const [tab, setTab] = useState("academic");
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const [students,  setStudents]  = useState([]);
  const [invoices,  setInvoices]  = useState([]);
  const [attRows,   setAttRows]   = useState([]);
  const [staff,     setStaff]     = useState([]);
  const [reportLog, setReportLog] = useState([]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("students").select("id, name, cls, average, attendance, risk"),
      supabase.from("invoices").select("cls, amount, paid, status"),
      supabase.from("attendance").select("cls, date, status"),
      supabase.from("staff").select("id, name, department"),
    ]).then(([sR, iR, aR, stR]) => {
      setStudents(sR.data || []);
      setInvoices(iR.data || []);
      setAttRows(aR.data || []);
      setStaff(stR.data || []);
      setLoading(false);
    });
  }, []);

  /* ── Derived aggregates ── */

  // Stat cards
  const totalStudents  = students.length;
  const totalCollected = invoices.reduce((s, i) => s + Number(i.paid || 0), 0);
  const totalStaff     = staff.length;
  const avgAttRate = (() => {
    if (attRows.length === 0) return null;
    const present = attRows.filter((r) => r.status !== "Absent").length;
    return Math.round((present / attRows.length) * 100);
  })();

  // Academic: class summary from students table
  const classSummary = Object.values(
    students.reduce((acc, s) => {
      const k = s.cls || "Unknown";
      if (!acc[k]) acc[k] = { cls: k, total: 0, count: 0, passing: 0 };
      acc[k].total  += Number(s.average || 0);
      acc[k].count  += 1;
      acc[k].passing += Number(s.average || 0) >= 50 ? 1 : 0;
      return acc;
    }, {})
  ).map((c) => ({
    cls: c.cls,
    avgScore: Math.round(c.total / c.count),
    passRate: `${Math.round((c.passing / c.count) * 100)}%`,
    students: c.count,
  })).sort((a, b) => a.cls.localeCompare(b.cls));

  // Financial: fee collection by class
  const feeByClass = Object.values(
    invoices.reduce((acc, i) => {
      const k = i.cls || "Unknown";
      if (!acc[k]) acc[k] = { cls: k, collected: 0, outstanding: 0 };
      acc[k].collected   += Number(i.paid || 0);
      acc[k].outstanding += Math.max(0, Number(i.amount || 0) - Number(i.paid || 0));
      return acc;
    }, {})
  ).sort((a, b) => a.cls.localeCompare(b.cls));

  // Attendance: rate by class
  const attByClass = Object.values(
    attRows.reduce((acc, r) => {
      const k = r.cls || "Unknown";
      if (!acc[k]) acc[k] = { cls: k, present: 0, total: 0 };
      acc[k].total  += 1;
      acc[k].present += r.status !== "Absent" ? 1 : 0;
      return acc;
    }, {})
  ).map((c) => ({ cls: c.cls, rate: `${Math.round((c.present / c.total) * 100)}%`, marked: c.total })).sort((a, b) => a.cls.localeCompare(b.cls));

  // Attendance: monthly trend from real data
  const attTrend = Object.values(
    attRows.reduce((acc, r) => {
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return acc;
      const key = d.toLocaleDateString("en-GB", { month: "short" });
      if (!acc[key]) acc[key] = { month: key, present: 0, total: 0 };
      acc[key].total  += 1;
      acc[key].present += r.status !== "Absent" ? 1 : 0;
      return acc;
    }, {})
  ).map((m) => ({ month: m.month, rate: Math.round((m.present / m.total) * 100) }));

  // HR: staff by department
  const staffByDept = Object.values(
    staff.reduce((acc, s) => {
      const k = s.department || "Unknown";
      if (!acc[k]) acc[k] = { dept: k, count: 0 };
      acc[k].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  function logReport(title, category, format) {
    setReportLog((arr) => [{ id: Date.now(), title, category, format, date: new Date().toISOString().slice(0, 10) }, ...arr]);
  }

  return (
    <div>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint, marginBottom: 16 }}><Loader2 size={12} className="spin" /> Loading data…</span>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Users}        label="Total Students"  value={totalStudents || "—"}                           tone="indigo" />
        <StatCard icon={Wallet}       label="Term Revenue"    value={totalCollected > 0 ? fmtMoney(totalCollected) : "—"} tone="green" />
        <StatCard icon={CalendarCheck}label="Avg. Attendance" value={avgAttRate !== null ? `${avgAttRate}%` : "—"}   tone="cyan"  />
        <StatCard icon={Briefcase}    label="Total Staff"     value={totalStaff || "—"}                             tone="amber" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "academic"}   onClick={() => setTab("academic")}>Academic</Tag>
        <Tag active={tab === "financial"}  onClick={() => setTab("financial")}>Financial</Tag>
        <Tag active={tab === "attendance"} onClick={() => setTab("attendance")}>Attendance</Tag>
        <Tag active={tab === "hr"}         onClick={() => setTab("hr")}>HR</Tag>
      </div>

      {/* ── ACADEMIC ── */}
      {tab === "academic" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Academic Performance Trend" subtitle="Multi-term trend — available once historical snapshots are recorded" />
            <PlaceholderChart message="Historical term data not yet available. This chart will populate over time." />
          </Card>
          <Card>
            <SectionHeader title="Performance by Class" subtitle="Live from Students directory" action={
              <ExportBar onCSV={() => { exportCSV("class_performance.csv", classSummary); logReport("Class Performance Summary", "Academic", "CSV"); }} />
            } />
            {classSummary.length === 0
              ? <EmptyState message="No student data yet." hint="Add students in the Students module to see academic reports." />
              : <Table columns={[
                  { key: "cls",      label: "Class" },
                  { key: "students", label: "Students" },
                  { key: "avgScore", label: "Avg. Score", render: (r) => <span style={{ color: r.avgScore >= 70 ? C.green : r.avgScore >= 50 ? C.amber : C.red }}>{r.avgScore}%</span> },
                  { key: "passRate", label: "Pass Rate" },
                ]} rows={classSummary} />
            }
          </Card>
        </div>
      )}

      {/* ── FINANCIAL ── */}
      {tab === "financial" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Revenue vs Target by Term" subtitle="Multi-term trend — available once historical snapshots are recorded" />
            <PlaceholderChart message="Historical term data not yet available. This chart will populate over time." />
          </Card>
          <Card>
            <SectionHeader title="Fee Collection by Class" subtitle="Live from Invoices" action={
              <ExportBar onCSV={() => { exportCSV("fee_by_class.csv", feeByClass); logReport("Fee Collection by Class", "Financial", "CSV"); }} />
            } />
            {feeByClass.length === 0
              ? <EmptyState message="No invoice data yet." hint="Add invoices in the Finance module to see financial reports." />
              : <Table columns={[
                  { key: "cls",         label: "Class" },
                  { key: "collected",   label: "Collected",   render: (r) => fmtMoney(r.collected) },
                  { key: "outstanding", label: "Outstanding", render: (r) => r.outstanding > 0 ? <span style={{ color: C.amber }}>{fmtMoney(r.outstanding)}</span> : <span style={{ color: C.green }}>Settled</span> },
                ]} rows={feeByClass} />
            }
          </Card>
        </div>
      )}

      {/* ── ATTENDANCE ── */}
      {tab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Attendance Rate by Month" subtitle="Live from Attendance records" action={
              <ExportBar onCSV={() => { exportCSV("attendance_trend.csv", attTrend); logReport("Attendance Trend", "Attendance", "CSV"); }} />
            } />
            {attTrend.length === 0
              ? <EmptyState message="No attendance data yet." hint="Teachers must mark attendance in the Attendance module first." />
              : <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={attTrend}>
                    <CartesianGrid stroke={C.borderSoft} vertical={false} />
                    <XAxis dataKey="month" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                    <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} domain={[70, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="rate" name="Rate %" stroke={C.green} strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
            }
          </Card>
          <Card>
            <SectionHeader title="Attendance by Class" subtitle="Aggregated from marked attendance records" action={
              <ExportBar onCSV={() => { exportCSV("attendance_by_class.csv", attByClass); logReport("Attendance by Class", "Attendance", "CSV"); }} />
            } />
            {attByClass.length === 0
              ? <EmptyState message="No attendance data yet." />
              : <Table columns={[
                  { key: "cls",    label: "Class" },
                  { key: "rate",   label: "Attendance Rate", render: (r) => <span style={{ color: parseInt(r.rate) >= 85 ? C.green : parseInt(r.rate) >= 70 ? C.amber : C.red }}>{r.rate}</span> },
                  { key: "marked", label: "Records Marked" },
                ]} rows={attByClass} />
            }
          </Card>
        </div>
      )}

      {/* ── HR ── */}
      {tab === "hr" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Staff by Department" subtitle="Live from Staff directory" action={
              <ExportBar onCSV={() => { exportCSV("staff_by_department.csv", staffByDept); logReport("Staff by Department", "HR", "CSV"); }} />
            } />
            {staffByDept.length === 0
              ? <EmptyState message="No staff data yet." hint="Add staff in the HR module to see staff reports." />
              : <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={staffByDept}>
                    <CartesianGrid stroke={C.borderSoft} vertical={false} />
                    <XAxis dataKey="dept" stroke={C.textFaint} fontSize={10.5} tickLine={false} axisLine={false} />
                    <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Staff" fill={C.indigo} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
            }
          </Card>
          <Card>
            <SectionHeader title="Leave Utilization" subtitle="Requires a leave tracking table — coming in a future update" />
            <PlaceholderChart message="Leave data not yet available. This will populate once leave requests are tracked in the database." />
          </Card>
        </div>
      )}

      {/* ── REPORT LOG ── */}
      <Card style={{ marginTop: 20 }}>
        <SectionHeader title="Export History" subtitle="Reports exported this session" />
        {reportLog.length === 0
          ? <div style={{ fontSize: 13, color: C.textFaint, padding: "16px 0" }}>No exports yet this session. Use the Export CSV buttons above.</div>
          : <Table columns={[
              { key: "title",    label: "Report" },
              { key: "category", label: "Category", render: (r) => <Pill tone="indigo">{r.category}</Pill> },
              { key: "format",   label: "Format",   render: (r) => <Pill tone="cyan">{r.format}</Pill> },
              { key: "date",     label: "Date" },
            ]} rows={reportLog} />
        }
      </Card>
    </div>
  );
}

/* ── Teacher view ── */
function ReportsTeacherView() {
  const [students, setStudents] = useState([]);
  const [attRows,  setAttRows]  = useState([]);
  const [loading,  setLoading]  = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("students").select("name, cls, average, attendance").eq("cls", "Form 4A"),
      supabase.from("attendance").select("cls, status").eq("cls", "Form 4A"),
    ]).then(([sR, aR]) => {
      setStudents(sR.data || []);
      setAttRows(aR.data || []);
      setLoading(false);
    });
  }, []);

  const avgScore = students.length ? Math.round(students.reduce((s, st) => s + Number(st.average || 0), 0) / students.length) : null;
  const passRate = students.length ? Math.round((students.filter((s) => Number(s.average || 0) >= 50).length / students.length) * 100) : null;
  const attRate  = attRows.length  ? Math.round((attRows.filter((r) => r.status !== "Absent").length / attRows.length) * 100) : null;

  const myClassData = students.length ? [{ cls: "Form 4A", avgScore: avgScore ?? "—", passRate: passRate !== null ? `${passRate}%` : "—", attendance: attRate !== null ? `${attRate}%` : "—" }] : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Loading…</span>}
      <Card>
        <SectionHeader title="My Class Performance Report" subtitle="Form 4A · Live from Students & Attendance" action={
          <ExportBar onCSV={() => exportCSV("my_class_report.csv", myClassData)} />
        } />
        {myClassData.length === 0
          ? <EmptyState message="No student data for Form 4A yet." />
          : <Table columns={[{ key: "cls", label: "Class" }, { key: "avgScore", label: "Avg. Score" }, { key: "passRate", label: "Pass Rate" }, { key: "attendance", label: "Attendance" }]} rows={myClassData} />
        }
      </Card>
      <Card>
        <SectionHeader title="Student Breakdown" subtitle="Form 4A · Individual performance" action={
          <ExportBar onCSV={() => exportCSV("form4a_students.csv", students)} />
        } />
        {students.length === 0
          ? <EmptyState message="No students in Form 4A yet." />
          : <Table columns={[{ key: "name", label: "Student" }, { key: "average", label: "Average", render: (r) => `${r.average}%` }, { key: "attendance", label: "Attendance", render: (r) => `${r.attendance}%` }]} rows={students} />
        }
      </Card>
    </div>
  );
}

function ReportsModule({ role }) {
  return role === "admin" ? <ReportsAdminView /> : <ReportsTeacherView />;
}

export { ReportsModule };