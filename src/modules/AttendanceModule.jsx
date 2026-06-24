import React, { useState } from "react";
import {
  CalendarCheck, CheckCircle2, AlertCircle
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A } from "../data/mockData";

function AttendanceModule({ role }) {
  const [markState, setMarkState] = useState(() => Object.fromEntries(STUDENTS.filter(s => s.cls === "Form 4A").map(s => [s.id, "Present"])));
  const days = Array.from({ length: 14 }, (_, i) => i + 1);

  if (role === "teacher") {
    const classStudents = STUDENTS.filter((s) => s.cls === "Form 4A");
    return (
      <Card>
        <SectionHeader title="Mark Attendance — Form 4A" subtitle={`June 19, 2026 · ${classStudents.length} students`} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {classStudents.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={s.name} size={28} />
                <span style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{s.name}</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {["Present", "Late", "Absent"].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setMarkState((m) => ({ ...m, [s.id]: opt }))}
                    style={{
                      fontSize: 12, padding: "6px 11px", borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${markState[s.id] === opt ? (opt === "Present" ? C.green : opt === "Late" ? C.amber : C.red) : C.border}`,
                      background: markState[s.id] === opt ? (opt === "Present" ? C.greenSoft : opt === "Late" ? C.amberSoft : C.redSoft) : "transparent",
                      color: markState[s.id] === opt ? (opt === "Present" ? C.green : opt === "Late" ? C.amber : C.red) : C.textMuted,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (role === "student" || role === "parent") {
    const s = STUDENTS[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon={CalendarCheck} label="Term Attendance" value={`${s.attendance}%`} tone="green" />
          <StatCard icon={CheckCircle2} label="Days Present" value="58/61" tone="indigo" />
          <StatCard icon={AlertCircle} label="Days Absent" value="2" tone="amber" />
        </div>
        <Card>
          <SectionHeader title={role === "parent" ? "Tadiwa's Attendance Log" : "My Attendance Log"} subtitle="Last 14 school days" />
          <div style={{ display: "flex", gap: 6 }}>
            {days.map((d) => {
              const present = Math.random() > 0.1;
              return <div key={d} title={`Day ${d}`} style={{ width: 22, height: 22, borderRadius: 6, background: present ? C.greenSoft : C.redSoft, border: `1px solid ${present ? C.green : C.red}` }} />;
            })}
          </div>
        </Card>
      </div>
    );
  }

  // admin
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionHeader title="Attendance Heatmap" subtitle="Last 14 days by class" />
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${days.length}, 24px)`, gap: 5, alignItems: "center" }}>
            <div />
            {days.map((d) => <div key={d} style={{ fontSize: 10, color: C.textFaint, textAlign: "center" }}>{d}</div>)}
            {CLASSES.map((c) => (
              <React.Fragment key={c.id}>
                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{c.name}</div>
                {days.map((d) => {
                  const v = 0.5 + Math.random() * 0.5;
                  const color = v > 0.85 ? C.green : v > 0.7 ? C.amber : C.red;
                  return <div key={d} style={{ width: 22, height: 22, borderRadius: 5, background: color, opacity: v }} />;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>
      <Card>
        <SectionHeader title="AI Absenteeism Risk" subtitle="Students flagged by predictive pattern analysis" />
        <Table
          columns={[
            { key: "name", label: "Student" },
            { key: "cls", label: "Class" },
            { key: "attendance", label: "Attendance", render: (r) => `${r.attendance}%` },
            { key: "risk", label: "Risk Level", render: (r) => <Pill tone={riskTone(r.risk)}>{r.risk}</Pill> },
          ]}
          rows={STUDENTS.filter((s) => s.risk !== "Low").sort((a, b) => a.attendance - b.attendance)}
        />
      </Card>
    </div>
  );
}


export { AttendanceModule };
