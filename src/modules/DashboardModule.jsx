import React, { useState } from "react";
import {
  Users, GraduationCap, CalendarCheck, FileText, Wallet, MessageSquare, Sparkles, AlertTriangle, CheckCircle2, Clock, Award, Info
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A } from "../data/mockData";

function DashboardModule({ role }) {
  if (role === "admin") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon={Users} label="Total Students" value="356" delta="+15 this term" tone="indigo" />
          <StatCard icon={GraduationCap} label="Teaching Staff" value="42" delta="+2 this term" tone="cyan" />
          <StatCard icon={Wallet} label="Revenue Collected" value={fmtMoney(45800)} delta="+13.9% vs target" tone="green" />
          <StatCard icon={CalendarCheck} label="Attendance Today" value="91.4%" delta="-1.2% vs yesterday" deltaTone="red" tone="amber" />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card style={{ flex: 2, minWidth: 320 }}>
            <SectionHeader title="Enrollment Trend" subtitle="Across the last 6 terms, with AI projection for Term 3" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={ENROLLMENT_TREND}>
                <defs>
                  <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.indigo} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={C.indigo} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="term" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="students" name="Students" stroke={C.indigo} fill="url(#enrollGrad)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ flex: 1, minWidth: 260 }}>
            <SectionHeader title="AI Insights" subtitle="Top alerts" />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {AI_ALERTS.slice(0, 4).map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
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
            <SectionHeader title="Revenue vs Target" subtitle="Monthly collection (USD)" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={REVENUE_TREND}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="term" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="target" name="Target" fill={C.border} radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill={C.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ flex: 1, minWidth: 280 }}>
            <SectionHeader title="Class Performance" subtitle="Average score by class" />
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={CLASS_PERFORMANCE}>
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
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon={GraduationCap} label="My Classes" value="2" tone="indigo" />
          <StatCard icon={Users} label="Students Taught" value="52" tone="cyan" />
          <StatCard icon={CalendarCheck} label="Avg. Attendance" value="88%" delta="+2% this week" tone="green" />
          <StatCard icon={FileText} label="Pending Marking" value="14" tone="amber" />
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Card style={{ flex: 1, minWidth: 300 }}>
            <SectionHeader title="Today's Timetable — Mr. T. Moyo" />
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
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatCard icon={CalendarCheck} label="My Attendance" value="96%" tone="green" />
          <StatCard icon={Award} label="Current Average" value="84%" delta="+3 pts this term" tone="indigo" />
          <StatCard icon={Wallet} label="Fee Balance" value={fmtMoney(0)} tone="cyan" />
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar name="Tadiwa Mhofu" size={44} />
        <div>
          <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>Tadiwa Mhofu</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>Form 4A · Admission STU-1042</div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={CalendarCheck} label="Attendance" value="96%" tone="green" />
        <StatCard icon={Award} label="Current Average" value="84%" tone="indigo" />
        <StatCard icon={Wallet} label="Fee Balance" value={fmtMoney(0)} tone="cyan" />
        <StatCard icon={MessageSquare} label="Unread Updates" value="3" tone="amber" />
      </div>
      <Card>
        <SectionHeader title="Recent School Communications" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ANNOUNCEMENTS.slice(0, 3).map((a) => (
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
