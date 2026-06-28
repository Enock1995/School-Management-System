import React, { useState, useEffect } from "react";
import {
  Sparkles, Plus, Loader2
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS as MOCK_EXAMS, RESULTS_F4A_MATH as MOCK_RESULTS, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const MARK_ENTRY_EXAM_ID = "EX-01"; // Mid-Term Test · Mathematics · Form 4A

function computeGrade(score) {
  if (!score || score <= 0) return "—";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function ExaminationsModule({ role }) {
  const [exams, setExams] = useState(MOCK_EXAMS);
  const [results, setResults] = useState(MOCK_RESULTS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from("exams").select("*").order("date"),
      supabase.from("results").select("*").eq("exam_id", MARK_ENTRY_EXAM_ID),
    ]).then(([examsRes, resultsRes]) => {
      if (examsRes.error) {
        console.warn("Falling back to demo exam data:", examsRes.error.message);
      } else if (examsRes.data && examsRes.data.length > 0) {
        setExams(examsRes.data);
        setUsingLiveData(true);
      }
      if (resultsRes.error) {
        console.warn("Falling back to demo results data:", resultsRes.error.message);
      } else if (resultsRes.data && resultsRes.data.length > 0) {
        setResults(resultsRes.data.map((r) => ({ name: r.student, score: r.score, grade: r.grade })));
        setUsingLiveData(true);
      }
      setLoading(false);
    });
  }, []);

  function saveScore(student, score) {
    const grade = computeGrade(score);
    setResults((arr) => arr.map((r) => (r.name === student ? { ...r, score, grade } : r)));
    if (!isSupabaseConfigured) return;
    supabase
      .from("results")
      .upsert({ exam_id: MARK_ENTRY_EXAM_ID, student, score, grade }, { onConflict: "exam_id,student" })
      .then(({ error }) => {
        if (error) console.warn("Could not save result:", error.message);
        else setUsingLiveData(true);
      });
  }

  if (role === "student") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card>
          <SectionHeader title="My Results — Term 2, 2026" />
          <Table
            columns={[
              { key: "subject", label: "Subject" },
              { key: "score", label: "Score", render: () => `${70 + Math.floor(Math.random() * 25)}%` },
              { key: "grade", label: "Grade", render: () => <Pill tone="green">A</Pill> },
            ]}
            rows={SUBJECTS.slice(0, 6).map((s) => ({ subject: s }))}
          />
        </Card>
        <Card style={{ background: `linear-gradient(135deg, ${C.indigoSoft}, ${C.cyanSoft})` }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
            <Sparkles size={16} color={C.cyan} />
            <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>AI Performance Outlook</span>
          </div>
          <p style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>Based on your trend across the last two terms, you're on track for an A in Mathematics and English. Computer Science could improve with focused revision on algorithms before the Mid-Term Test.</p>
        </Card>
      </div>
    );
  }

  if (role === "parent") {
    return (
      <Card>
        <SectionHeader title="Tadiwa Mhofu — Report Card Preview" subtitle="Term 2, 2026 · Form 4A" />
        <Table
          columns={[
            { key: "subject", label: "Subject" },
            { key: "score", label: "Score", render: () => `${75 + Math.floor(Math.random() * 20)}%` },
            { key: "grade", label: "Grade", render: () => <Pill tone="green">A</Pill> },
          ]}
          rows={SUBJECTS.slice(0, 5).map((s) => ({ subject: s }))}
        />
        <div style={{ marginTop: 16, padding: 14, background: C.surface2, borderRadius: 12, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, color: C.textFaint, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>AI-Generated Comment</div>
          <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5, margin: 0 }}>"Tadiwa has demonstrated excellent progress in Mathematics and Computer Science this term, consistently ranking among the top of Form 4A. Continued encouragement around class participation in group discussions would further round out a strong academic profile."</p>
        </div>
      </Card>
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
      <Card>
        <SectionHeader title="Examination Schedule" action={<button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Plus size={14} /> New Exam</button>} />
        <Table
          columns={[
            { key: "title", label: "Exam" },
            { key: "subject", label: "Subject" },
            { key: "cls", label: "Class" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
          ]}
          rows={exams}
        />
      </Card>
      {role === "teacher" && (
        <Card>
          <SectionHeader title="Mark Entry — Mid-Term Test, Form 4A Mathematics" />
          <Table
            columns={[
              { key: "name", label: "Student" },
              { key: "score", label: "Score (/100)", render: (r) => (
                <input
                  type="number" min="0" max="100"
                  value={r.score || ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                    setResults((arr) => arr.map((x) => (x.name === r.name ? { ...x, score: v, grade: computeGrade(v) } : x)));
                  }}
                  onBlur={(e) => saveScore(r.name, e.target.value === "" ? 0 : parseInt(e.target.value, 10))}
                  style={{ width: 70, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 13 }}
                />
              )},
              { key: "grade", label: "Grade", render: (r) => <Pill tone={r.grade === "A" ? "green" : r.grade === "B" ? "indigo" : "slate"}>{r.grade}</Pill> },
            ]}
            rows={results}
          />
        </Card>
      )}
      <Card>
        <SectionHeader title="Top Performers This Term" />
        <Table
          columns={[
            { key: "name", label: "Student" },
            { key: "cls", label: "Class" },
            { key: "average", label: "Average", render: (r) => `${r.average}%` },
          ]}
          rows={[...STUDENTS].sort((a, b) => b.average - a.average).slice(0, 5)}
        />
      </Card>
    </div>
  );
}


export { ExaminationsModule };