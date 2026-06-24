import React, { useState, useRef, useEffect } from "react";
import {
  Users, AlertTriangle, CheckCircle2, TrendingUp, Info
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A } from "../data/mockData";
import { ChatPanel } from "../components/ChatPanel";

function AIHubModule({ role }) {
  const personas = {
    admin: { name: "AI School Insights", greeting: "Hi, I'm your AI School Insights assistant. Ask me about enrollment trends, fee defaulters, at-risk students, or staffing — anything across Springfield International.", placeholder: "Ask about school-wide trends…" },
    teacher: { name: "AI Teacher Assistant", greeting: "Hi! I can help draft lesson plans, generate exam questions, or write marking rubrics for any of your classes. What are you working on?", placeholder: "Ask for a lesson plan, quiz, or rubric…" },
    student: { name: "AI Tutor", greeting: "Hey! I'm your AI Tutor. Ask me to explain a concept, walk through a tricky problem, or generate practice questions for any subject.", placeholder: "Ask me anything about your subjects…" },
    parent: { name: "AI Parent Assistant", greeting: "Hello! I can explain your child's performance, attendance, or fee status in plain language — just ask.", placeholder: "Ask about your child's progress…" },
  };
  const suggestionsMap = {
    admin: ["Which students are at the highest dropout risk?", "Summarize this term's fee collection", "Which classes are underperforming?"],
    teacher: ["Draft a lesson plan for Form 4A Mathematics on quadratic equations", "Generate 5 exam questions on cell biology", "Write a marking rubric for an essay assignment"],
    student: ["Explain photosynthesis simply", "Give me 5 practice questions on algebra", "How should I prepare for my Mid-Term Test?"],
    parent: ["How is Tadiwa doing this term?", "Explain the current fee balance", "Is Tadiwa's attendance okay?"],
  };
  const systemPrompts = {
    admin: "You are an AI school insights assistant for Springfield International High School, a Cambridge/ZIMSEC secondary school in Zimbabwe. Help the school administrator understand enrollment, finance, attendance and academic trends. Be concise and data-driven.",
    teacher: "You are an AI teaching assistant for a teacher at Springfield International High School. Help draft lesson plans, exam questions, rubrics, and marking guides. Be practical and classroom-ready.",
    student: "You are a friendly, encouraging AI tutor for a secondary school student at Springfield International High School following the Cambridge IGCSE curriculum. Explain concepts clearly and simply, and offer practice questions when helpful.",
    parent: "You are an AI parent assistant for Springfield International High School. Explain a student's academic performance, attendance, and fee status in warm, simple, jargon-free language for a parent.",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {role === "admin" && (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <StatCard icon={AlertTriangle} label="Active Alerts" value={AI_ALERTS.length} tone="red" />
            <StatCard icon={Users} label="At-Risk Students" value={STUDENTS.filter(s => s.risk === "High").length} tone="amber" />
            <StatCard icon={TrendingUp} label="Projected Enrollment T3" value="368" delta="+3.4%" tone="green" />
          </div>
          <Card>
            <SectionHeader title="AI Alert Feed" subtitle="Auto-generated from attendance, fee, and academic data" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {AI_ALERTS.map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 12, borderBottom: `1px solid ${C.borderSoft}` }}>
                  <div style={{ marginTop: 2 }}>
                    {a.severity === "High" ? <AlertTriangle size={15} color={C.red} /> : a.severity === "Positive" ? <CheckCircle2 size={15} color={C.green} /> : <Info size={15} color={C.amber} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{a.student}</span>
                      <Pill tone={statusTone(a.severity)}>{a.type}</Pill>
                    </div>
                    <p style={{ fontSize: 12.5, color: C.textMuted, margin: "4px 0 0", lineHeight: 1.45 }}>{a.msg}</p>
                  </div>
                  <span style={{ fontSize: 11, color: C.textFaint, flexShrink: 0 }}>{a.date}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
      <ChatPanel persona={personas[role]} systemPrompt={systemPrompts[role]} suggestions={suggestionsMap[role]} />
    </div>
  );
}


export { AIHubModule };
