import React, { useState } from "react";
import {
  Wallet, AlertTriangle, CreditCard, DollarSign
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A } from "../data/mockData";

function FinanceModule({ role }) {
  if (role === "parent") {
    const inv = INVOICES[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card>
          <SectionHeader title="Term 2 Fee Statement — Tadiwa Mhofu" />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Total Due</div>
              <div style={{ ...displayFont, fontSize: 24, fontWeight: 700, color: C.text }}>{fmtMoney(inv.amount)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: C.textMuted }}>Paid</div>
              <div style={{ ...displayFont, fontSize: 24, fontWeight: 700, color: C.green }}>{fmtMoney(inv.paid)}</div>
            </div>
            <Pill tone={statusTone(inv.status)}>{inv.status}</Pill>
          </div>
          <ProgressBar value={(inv.paid / inv.amount) * 100} tone="green" />
          <button style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
            <CreditCard size={15} /> Pay via EcoCash or Paynow
          </button>
        </Card>
        <Card>
          <SectionHeader title="Payment History" />
          <Table
            columns={[{ key: "date", label: "Date" }, { key: "method", label: "Method" }, { key: "amount", label: "Amount", render: (r) => fmtMoney(r.amount) }]}
            rows={[{ date: "Apr 02, 2026", method: "EcoCash", amount: 980 }, { date: "Jan 14, 2026", method: "Bank Transfer", amount: 980 }]}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={Wallet} label="Collected This Term" value={fmtMoney(248600)} delta="+13.9% vs target" tone="green" />
        <StatCard icon={AlertTriangle} label="Outstanding" value={fmtMoney(72400)} deltaTone="red" delta="44 overdue accounts" tone="red" />
        <StatCard icon={DollarSign} label="Avg. Fee / Student" value={fmtMoney(792)} tone="indigo" />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 280 }}>
          <SectionHeader title="Revenue Forecast" subtitle="AI-projected collection vs target" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE_TREND}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="term" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="target" stroke={C.textFaint} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="collected" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ flex: 1, minWidth: 240 }}>
          <SectionHeader title="Fee Status" subtitle="356 students" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={FEE_STATUS} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {FEE_STATUS.map((f, i) => <Cell key={i} fill={f.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {FEE_STATUS.map((f) => (
              <div key={f.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted }}><span style={{ width: 8, height: 8, borderRadius: 99, background: f.color }} />{f.name}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{f.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <SectionHeader title="Invoices" action={<div style={{ display: "flex", gap: 8 }}>{PAYMENT_METHODS.slice(0, 3).map((p) => <Pill key={p.name} tone="cyan">{p.name}</Pill>)}</div>} />
        <Table
          columns={[
            { key: "id", label: "Invoice", render: (r) => <span style={monoFont}>{r.id}</span> },
            { key: "student", label: "Student" },
            { key: "cls", label: "Class" },
            { key: "amount", label: "Amount", render: (r) => fmtMoney(r.amount) },
            { key: "paid", label: "Paid", render: (r) => fmtMoney(r.paid) },
            { key: "due", label: "Due Date" },
            { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
          ]}
          rows={INVOICES}
        />
      </Card>
      <Card>
        <SectionHeader title="AI Fee Default Risk" subtitle="Highest-risk accounts this term" />
        <Table
          columns={[
            { key: "name", label: "Student" },
            { key: "cls", label: "Class" },
            { key: "balance", label: "Balance", render: (r) => fmtMoney(r.balance) },
            { key: "risk", label: "Risk", render: (r) => <Pill tone={riskTone(r.risk)}>{r.risk}</Pill> },
          ]}
          rows={STUDENTS.filter((s) => s.balance > 0).sort((a, b) => b.balance - a.balance)}
        />
      </Card>
    </div>
  );
}


export { FinanceModule };
