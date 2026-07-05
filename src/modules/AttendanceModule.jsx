import React, { useState, useEffect } from "react";
import { CalendarCheck, CheckCircle2, AlertCircle, Loader2, Users } from "lucide-react";
import { C } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table } from "../components/ui";
import { CLASSES } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const todayISO   = new Date().toISOString().slice(0, 10);
const todayLabel = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <Users size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

/* ── Teacher view ── */
function AttendanceTeacherView() {
  const [students,  setStudents]  = useState([]);
  const [markState, setMarkState] = useState({});
  const [savingIds, setSavingIds] = useState({});
  const [loading,   setLoading]   = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("students").select("id, name, cls").eq("cls", "Form 4A").order("name"),
      supabase.from("attendance").select("*").eq("date", todayISO).eq("cls", "Form 4A"),
    ]).then(([studentsRes, attRes]) => {
      const s = studentsRes.data || [];
      setStudents(s);
      const init = Object.fromEntries(s.map((st) => [st.id, "Present"]));
      (attRes.data || []).forEach((row) => { init[row.student_id] = row.status; });
      setMarkState(init);
      setLoading(false);
    });
  }, []);

  function markAttendance(student, status) {
    setMarkState((m) => ({ ...m, [student.id]: status }));
    if (!isSupabaseConfigured) return;
    setSavingIds((s) => ({ ...s, [student.id]: true }));
    supabase.from("attendance")
      .upsert({ student_id: student.id, student_name: student.name, cls: student.cls, date: todayISO, status }, { onConflict: "student_id,date" })
      .then(({ error }) => {
        if (error) console.warn("Attendance save error:", error.message);
        setSavingIds((s) => ({ ...s, [student.id]: false }));
      });
  }

  const presentCount = Object.values(markState).filter((v) => v === "Present").length;
  const absentCount  = Object.values(markState).filter((v) => v === "Absent").length;
  const lateCount    = Object.values(markState).filter((v) => v === "Late").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Loading students…</span>}

      {!loading && students.length === 0 ? (
        <Card>
          <EmptyState message="No students in Form 4A yet." hint="Students must be added in the Students module before attendance can be marked." />
        </Card>
      ) : (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <StatCard icon={CheckCircle2} label="Present" value={presentCount} tone="green" />
            <StatCard icon={AlertCircle}  label="Absent"  value={absentCount}  tone="red"   />
            <StatCard icon={CalendarCheck}label="Late"    value={lateCount}    tone="amber" />
          </div>

          <Card>
            <SectionHeader title="Mark Attendance — Form 4A" subtitle={`${todayLabel} · ${students.length} students`} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {students.map((s) => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={s.name} size={28} />
                    <span style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{s.name}</span>
                    {savingIds[s.id] && <Loader2 size={12} className="spin" color={C.textFaint} />}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["Present", "Late", "Absent"].map((opt) => {
                      const active = markState[s.id] === opt;
                      const col = opt === "Present" ? C.green : opt === "Late" ? C.amber : C.red;
                      const soft = opt === "Present" ? C.greenSoft : opt === "Late" ? C.amberSoft : C.redSoft;
                      return (
                        <button key={opt} onClick={() => markAttendance(s, opt)}
                          style={{ fontSize: 12, padding: "6px 11px", borderRadius: 8, cursor: "pointer", border: `1px solid ${active ? col : C.border}`, background: active ? soft : "transparent", color: active ? col : C.textMuted }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

/* ── Admin view ── */
function AttendanceAdminView() {
  const [students, setStudents] = useState([]);
  const [attRows,  setAttRows]  = useState([]);
  const [loading,  setLoading]  = useState(isSupabaseConfigured);
  const days = Array.from({ length: 14 }, (_, i) => i + 1);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("students").select("id, name, cls, attendance, risk").order("name"),
      supabase.from("attendance").select("*").order("date", { ascending: false }),
    ]).then(([sR, aR]) => {
      setStudents(sR.data || []);
      setAttRows(aR.data || []);
      setLoading(false);
    });
  }, []);

  /* compute today's rate */
  const todaysRows = attRows.filter((r) => r.date === todayISO);
  const todayRate  = todaysRows.length > 0
    ? Math.round((todaysRows.filter((r) => r.status !== "Absent").length / todaysRows.length) * 100)
    : null;

  const riskStudents = students.filter((s) => s.risk && s.risk !== "Low").sort((a, b) => (a.attendance || 0) - (b.attendance || 0));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={CalendarCheck} label="Today's Rate"     value={todayRate !== null ? `${todayRate}%` : "—"}   tone="green"  />
        <StatCard icon={Users}         label="Total Students"   value={students.length}                              tone="indigo" />
        <StatCard icon={AlertCircle}   label="At-Risk Students" value={riskStudents.length}                          tone="red"    />
      </div>

      <Card>
        <SectionHeader title="Attendance Heatmap" subtitle="Last 14 days by class" />
        {loading ? null : CLASSES.length === 0 ? (
          <EmptyState message="No classes set up yet." />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: `120px repeat(${days.length}, 24px)`, gap: 5, alignItems: "center" }}>
              <div />
              {days.map((d) => <div key={d} style={{ fontSize: 10, color: C.textFaint, textAlign: "center" }}>{d}</div>)}
              {CLASSES.map((c) => {
                const classRows = attRows.filter((r) => r.cls === c.name);
                return (
                  <React.Fragment key={c.id}>
                    <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{c.name}</div>
                    {days.map((d) => {
                      const dayStr = new Date(Date.now() - (14 - d) * 86400000).toISOString().slice(0, 10);
                      const dayRows = classRows.filter((r) => r.date === dayStr);
                      const v = dayRows.length > 0 ? dayRows.filter((r) => r.status !== "Absent").length / dayRows.length : 0;
                      const hasData = dayRows.length > 0;
                      const color = !hasData ? C.border : v > 0.85 ? C.green : v > 0.7 ? C.amber : C.red;
                      return <div key={d} style={{ width: 22, height: 22, borderRadius: 5, background: color, opacity: hasData ? 0.85 : 0.2 }} />;
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <SectionHeader title="AI Absenteeism Risk" subtitle="Students flagged by attendance pattern" />
        {loading ? null : riskStudents.length === 0 ? (
          <EmptyState message="No at-risk students flagged." hint="Risk flags are set per student in the Students module." />
        ) : (
          <Table
            columns={[
              { key: "name",       label: "Student" },
              { key: "cls",        label: "Class" },
              { key: "attendance", label: "Attendance", render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60 }}><ProgressBar value={r.attendance || 0} tone={r.attendance >= 80 ? "green" : "red"} h={6} /></div>
                  <span style={{ fontSize: 12 }}>{r.attendance || 0}%</span>
                </div>
              ) },
              { key: "risk",       label: "Risk", render: (r) => <Pill tone={r.risk === "High" ? "red" : "amber"}>{r.risk}</Pill> },
            ]}
            rows={riskStudents}
          />
        )}
      </Card>
    </div>
  );
}

/* ── Student / Parent view ── */
function AttendancePersonalView({ role }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const days = Array.from({ length: 14 }, (_, i) => i + 1);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("attendance").select("*")
      .eq("student_name", "Tadiwa Mhofu")
      .order("date", { ascending: false })
      .limit(60)
      .then(({ data, error }) => {
        if (error) console.warn("Attendance fetch error:", error.message);
        setRows(data || []);
        setLoading(false);
      });
  }, []);

  const presentCount = rows.filter((r) => r.status === "Present").length;
  const absentCount  = rows.filter((r) => r.status === "Absent").length;
  const rate = rows.length > 0 ? Math.round((presentCount / rows.length) * 100) : null;

  /* last 14 attendance records for heatmap */
  const last14 = rows.slice(0, 14).reverse();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Loading…</span>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={CalendarCheck} label="Attendance Rate" value={rate !== null ? `${rate}%` : "—"} tone="green" />
        <StatCard icon={CheckCircle2}  label="Days Present"    value={presentCount}                      tone="indigo" />
        <StatCard icon={AlertCircle}   label="Days Absent"     value={absentCount}                       tone="amber" />
      </div>

      <Card>
        <SectionHeader title={role === "parent" ? "Tadiwa's Attendance Log" : "My Attendance Log"} subtitle="Most recent records" />
        {loading ? null : rows.length === 0 ? (
          <EmptyState message="No attendance records yet." hint="Records appear here once your class attendance has been marked." />
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {last14.map((r, i) => {
                const col = r.status === "Present" ? C.green : r.status === "Late" ? C.amber : C.red;
                const soft = r.status === "Present" ? C.greenSoft : r.status === "Late" ? C.amberSoft : C.redSoft;
                return <div key={i} title={`${r.date}: ${r.status}`} style={{ width: 22, height: 22, borderRadius: 6, background: soft, border: `1px solid ${col}` }} />;
              })}
            </div>
            <Table
              columns={[
                { key: "date",   label: "Date" },
                { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "Present" ? "green" : r.status === "Late" ? "amber" : "red"}>{r.status}</Pill> },
              ]}
              rows={rows.slice(0, 10)}
            />
          </>
        )}
      </Card>
    </div>
  );
}

/* ── Root ── */
function AttendanceModule({ role }) {
  if (role === "teacher") return <AttendanceTeacherView />;
  if (role === "admin")   return <AttendanceAdminView />;
  return <AttendancePersonalView role={role} />;
}

export { AttendanceModule };