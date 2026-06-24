import React, { useState } from "react";
import {
  Wallet, CalendarCheck, Briefcase, Users, Printer, FileSpreadsheet
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip
} from "recharts";
import { C, fmtMoney, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Tag, Table, CustomTooltip } from "../components/ui";

/* ============================== CSV EXPORT UTILITY (real, works with no backend) ============================== */
function exportCSV(filename, rows) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ExportBar({ onCSV, onPDF }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button onClick={onPDF} style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 9, padding: "7px 12px", color: C.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        <Printer size={13} /> Export PDF
      </button>
      <button onClick={onCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigoSoft, border: `1px solid ${C.indigo}`, borderRadius: 9, padding: "7px 12px", color: C.indigo, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
        <FileSpreadsheet size={13} /> Export CSV / Excel
      </button>
    </div>
  );
}

const ACADEMIC_TREND = [
  { term: "T3 '25", avg: 71 }, { term: "T1 '26", avg: 73 }, { term: "T2 '26", avg: 76 },
];
const CLASS_SUMMARY = [
  { cls: "Form 1A", avgScore: 82, passRate: "97%", topSubject: "Mathematics" },
  { cls: "Form 1B", avgScore: 76, passRate: "93%", topSubject: "English Language" },
  { cls: "Form 2A", avgScore: 64, passRate: "78%", topSubject: "Biology" },
  { cls: "Form 3A", avgScore: 69, passRate: "85%", topSubject: "Geography" },
  { cls: "Form 4A", avgScore: 81, passRate: "96%", topSubject: "Computer Science" },
  { cls: "Form 5A", avgScore: 85, passRate: "100%", topSubject: "Physics" },
  { cls: "Form 6A", avgScore: 79, passRate: "94%", topSubject: "Chemistry" },
];

const REVENUE_BY_TERM = [
  { term: "T3 '25", collected: 210000, target: 225000 },
  { term: "T1 '26", collected: 232000, target: 235000 },
  { term: "T2 '26", collected: 248600, target: 250000 },
];
const FEE_BY_CLASS = [
  { cls: "Form 1A", collected: 19800, outstanding: 600 },
  { cls: "Form 2A", collected: 14200, outstanding: 4800 },
  { cls: "Form 3A", collected: 17900, outstanding: 1900 },
  { cls: "Form 4A", collected: 22600, outstanding: 0 },
];

const ATTENDANCE_TREND = [
  { month: "Feb", rate: 93 }, { month: "Mar", rate: 91 }, { month: "Apr", rate: 90 },
  { month: "May", rate: 89 }, { month: "Jun", rate: 91 },
];
const ATTENDANCE_BY_CLASS = [
  { cls: "Form 1A", rate: "97%" }, { cls: "Form 2A", rate: "81%" }, { cls: "Form 3A", rate: "86%" }, { cls: "Form 4A", rate: "94%" },
];

const STAFF_BY_DEPT = [
  { dept: "Mathematics", count: 6 }, { dept: "Sciences", count: 9 }, { dept: "Languages", count: 7 },
  { dept: "Humanities", count: 5 }, { dept: "Admin", count: 4 }, { dept: "Support", count: 11 },
];
const LEAVE_UTILIZATION = [
  { dept: "Mathematics", used: 14, available: 126 }, { dept: "Sciences", used: 31, available: 189 },
  { dept: "Languages", used: 22, available: 147 }, { dept: "Admin", used: 8, available: 84 },
];

const GENERATED_REPORTS_INIT = [
  { id: 1, title: "Term 2 Academic Performance Summary", category: "Academic", format: "PDF", generatedBy: "Mrs. Patience Mhike", date: "2026-06-15" },
  { id: 2, title: "May Revenue & Collections Report", category: "Financial", format: "CSV", generatedBy: "Ms. Lisa Marufu", date: "2026-06-02" },
  { id: 3, title: "Term 2 Attendance Trends", category: "Attendance", format: "PDF", generatedBy: "Mrs. Patience Mhike", date: "2026-06-10" },
  { id: 4, title: "Staff Headcount & Leave Utilization", category: "HR", format: "CSV", generatedBy: "Mrs. Patience Mhike", date: "2026-05-28" },
];

/* ============================== ADMIN VIEW ============================== */
function ReportsAdminView() {
  const [tab, setTab] = useState("academic");
  const [reports, setReports] = useState(GENERATED_REPORTS_INIT);

  function logReport(title, category, format) {
    setReports((arr) => [{ id: Date.now(), title, category, format, generatedBy: "Mrs. Patience Mhike", date: new Date().toISOString().slice(0, 10) }, ...arr]);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Users} label="Total Students" value="356" tone="indigo" />
        <StatCard icon={Wallet} label="Term Revenue" value={fmtMoney(248600)} tone="green" />
        <StatCard icon={CalendarCheck} label="Avg. Attendance" value="91%" tone="cyan" />
        <StatCard icon={Briefcase} label="Total Staff" value="42" tone="amber" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "academic"} onClick={() => setTab("academic")}>Academic Reports</Tag>
        <Tag active={tab === "financial"} onClick={() => setTab("financial")}>Financial Reports</Tag>
        <Tag active={tab === "attendance"} onClick={() => setTab("attendance")}>Attendance Reports</Tag>
        <Tag active={tab === "hr"} onClick={() => setTab("hr")}>HR Reports</Tag>
      </div>

      {tab === "academic" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Academic Performance Trend" subtitle="School-wide average score, last 3 terms" action={
              <ExportBar onPDF={() => window.print()} onCSV={() => { exportCSV("academic_trend.csv", ACADEMIC_TREND); logReport("Academic Performance Trend", "Academic", "CSV"); }} />
            } />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ACADEMIC_TREND}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="term" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avg" stroke={C.indigo} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Performance by Class" subtitle="Term 2, 2026" action={
              <ExportBar onPDF={() => window.print()} onCSV={() => { exportCSV("class_summary.csv", CLASS_SUMMARY); logReport("Class Performance Summary", "Academic", "CSV"); }} />
            } />
            <Table columns={[{ key: "cls", label: "Class" }, { key: "avgScore", label: "Average Score" }, { key: "passRate", label: "Pass Rate" }, { key: "topSubject", label: "Top Subject" }]} rows={CLASS_SUMMARY} />
          </Card>
        </div>
      )}

      {tab === "financial" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Revenue vs Target" subtitle="By term (USD)" action={
              <ExportBar onPDF={() => window.print()} onCSV={() => { exportCSV("revenue_by_term.csv", REVENUE_BY_TERM); logReport("Revenue vs Target by Term", "Financial", "CSV"); }} />
            } />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REVENUE_BY_TERM}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="term" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="target" name="Target" fill={C.border} radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill={C.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Fee Collection by Class" subtitle="Term 2, 2026" action={
              <ExportBar onPDF={() => window.print()} onCSV={() => { exportCSV("fee_by_class.csv", FEE_BY_CLASS); logReport("Fee Collection by Class", "Financial", "CSV"); }} />
            } />
            <Table columns={[{ key: "cls", label: "Class" }, { key: "collected", label: "Collected", render: (r) => fmtMoney(r.collected) }, { key: "outstanding", label: "Outstanding", render: (r) => r.outstanding ? <span style={{ color: C.amber }}>{fmtMoney(r.outstanding)}</span> : <span style={{ color: C.green }}>Settled</span> }]} rows={FEE_BY_CLASS} />
          </Card>
        </div>
      )}

      {tab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Attendance Rate Trend" subtitle="School-wide, last 5 months" action={
              <ExportBar onPDF={() => window.print()} onCSV={() => { exportCSV("attendance_trend.csv", ATTENDANCE_TREND); logReport("Attendance Rate Trend", "Attendance", "CSV"); }} />
            } />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ATTENDANCE_TREND}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="month" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} domain={[80, 100]} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="rate" stroke={C.green} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Attendance by Class" subtitle="Term 2, 2026" action={
              <ExportBar onPDF={() => window.print()} onCSV={() => { exportCSV("attendance_by_class.csv", ATTENDANCE_BY_CLASS); logReport("Attendance by Class", "Attendance", "CSV"); }} />
            } />
            <Table columns={[{ key: "cls", label: "Class" }, { key: "rate", label: "Attendance Rate" }]} rows={ATTENDANCE_BY_CLASS} />
          </Card>
        </div>
      )}

      {tab === "hr" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Staff by Department" action={
              <ExportBar onPDF={() => window.print()} onCSV={() => { exportCSV("staff_by_department.csv", STAFF_BY_DEPT); logReport("Staff Headcount by Department", "HR", "CSV"); }} />
            } />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={STAFF_BY_DEPT}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="dept" stroke={C.textFaint} fontSize={10.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill={C.indigo} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Leave Utilization by Department" subtitle="Days used vs available, this year" action={
              <ExportBar onPDF={() => window.print()} onCSV={() => { exportCSV("leave_utilization.csv", LEAVE_UTILIZATION); logReport("Leave Utilization by Department", "HR", "CSV"); }} />
            } />
            <Table columns={[{ key: "dept", label: "Department" }, { key: "used", label: "Days Used" }, { key: "available", label: "Days Available" }]} rows={LEAVE_UTILIZATION} />
          </Card>
        </div>
      )}

      <Card style={{ marginTop: 20 }}>
        <SectionHeader title="Generated Reports" subtitle="History of reports exported from this dashboard" />
        <Table
          columns={[
            { key: "title", label: "Report" },
            { key: "category", label: "Category", render: (r) => <Pill tone="indigo">{r.category}</Pill> },
            { key: "format", label: "Format", render: (r) => <Pill tone="cyan">{r.format}</Pill> },
            { key: "generatedBy", label: "Generated By" },
            { key: "date", label: "Date" },
          ]}
          rows={reports}
        />
      </Card>
    </div>
  );
}

/* ============================== TEACHER VIEW ============================== */
function ReportsTeacherView() {
  const myClassData = [{ cls: "Form 4A", avgScore: 81, passRate: "96%", attendance: "94%" }];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionHeader title="My Class Performance Report" subtitle="Form 4A · Term 2, 2026" action={
          <ExportBar onPDF={() => window.print()} onCSV={() => exportCSV("my_class_report.csv", myClassData)} />
        } />
        <Table columns={[{ key: "cls", label: "Class" }, { key: "avgScore", label: "Average Score" }, { key: "passRate", label: "Pass Rate" }, { key: "attendance", label: "Attendance" }]} rows={myClassData} />
      </Card>
      <Card>
        <SectionHeader title="Performance Trend" subtitle="Form 4A average, last 3 terms" />
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={ACADEMIC_TREND}>
            <CartesianGrid stroke={C.borderSoft} vertical={false} />
            <XAxis dataKey="term" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
            <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="avg" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

/* ============================== ROOT (preview wrapper) ============================== */

function ReportsModule({ role }) {
  return role === "admin" ? <ReportsAdminView /> : <ReportsTeacherView />;
}

export { ReportsModule };