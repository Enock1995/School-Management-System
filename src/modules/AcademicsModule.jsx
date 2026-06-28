import React, { useState, useEffect } from "react";
import {
  BookOpen, Loader2
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES as MOCK_CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A as MOCK_TIMETABLE } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

function AcademicsModule({ role }) {
  const [classes, setClasses] = useState(MOCK_CLASSES);
  const [timetable, setTimetable] = useState(MOCK_TIMETABLE);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from("classes").select("*").order("id"),
      supabase.from("timetable").select("*").eq("cls", "Form 4A").order("id"),
    ]).then(([classesRes, timetableRes]) => {
      if (classesRes.error) {
        console.warn("Falling back to demo class data:", classesRes.error.message);
      } else if (classesRes.data && classesRes.data.length > 0) {
        setClasses(classesRes.data);
        setUsingLiveData(true);
      }
      if (timetableRes.error) {
        console.warn("Falling back to demo timetable data:", timetableRes.error.message);
      } else if (timetableRes.data && timetableRes.data.length > 0) {
        setTimetable(timetableRes.data);
        setUsingLiveData(true);
      }
      setLoading(false);
    });
  }, []);

  if (role === "student") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card>
          <SectionHeader title="My Weekly Timetable" subtitle="Form 4A · Cambridge IGCSE" />
          {(loading || usingLiveData) && (
            <div style={{ marginBottom: 12 }}>
              {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing live data…</span>}
              {usingLiveData && <Pill tone="green">Live data</Pill>}
            </div>
          )}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr>
                  {["Time", "Mon", "Tue", "Wed", "Thu", "Fri"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0 10px 10px", color: C.textFaint, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timetable.map((row, i) => (
                  <tr key={i}>
                    <td style={{ padding: "10px", color: C.textMuted, borderBottom: `1px solid ${C.borderSoft}`, ...monoFont, fontSize: 11.5 }}>{row.time}</td>
                    {["mon", "tue", "wed", "thu", "fri"].map((d) => (
                      <td key={d} style={{ padding: "10px", color: C.text, borderBottom: `1px solid ${C.borderSoft}` }}>{row[d]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <SectionHeader title="My Subjects" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {SUBJECTS.slice(0, 8).map((s) => (
              <div key={s} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                <BookOpen size={15} color={C.cyan} />
                <div style={{ fontWeight: 600, fontSize: 13, color: C.text, marginTop: 8 }}>{s}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(loading || usingLiveData) && (
        <div>
          {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing live data…</span>}
          {usingLiveData && <Pill tone="green">Live data</Pill>}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
        {classes.map((c) => (
          <Card key={c.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text, ...displayFont }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{c.teacher}</div>
              </div>
              <Pill tone="indigo">{c.curriculum}</Pill>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 12.5 }}>
              <span style={{ color: C.textMuted }}>{c.count} students</span>
              <span style={{ color: C.textFaint }}>{c.level}</span>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <SectionHeader title="Curriculum Coverage" subtitle="Frameworks currently active across the school" />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["Cambridge", "ZIMSEC", "IGCSE", "A-Level"].map((t) => <Pill key={t} tone="cyan">{t}</Pill>)}
        </div>
      </Card>
    </div>
  );
}


export { AcademicsModule };