import React, { useState } from "react";
import {
  BookMarked, AlertTriangle, CheckCircle2
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A } from "../data/mockData";

function LibraryModule({ role }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={BookMarked} label="Total Titles" value={BOOKS.length} tone="indigo" />
        <StatCard icon={CheckCircle2} label="Active Loans" value={LOANS.filter(l => l.status === "Active").length} tone="cyan" />
        <StatCard icon={AlertTriangle} label="Overdue" value={LOANS.filter(l => l.status === "Overdue").length} tone="red" />
      </div>
      <Card>
        <SectionHeader title="Catalog" />
        <Table
          columns={[
            { key: "title", label: "Title" },
            { key: "author", label: "Author" },
            { key: "category", label: "Category", render: (r) => <Pill tone="slate">{r.category}</Pill> },
            { key: "available", label: "Availability", render: (r) => r.available > 0 ? <span style={{ color: C.green }}>{r.available}/{r.copies} available</span> : <span style={{ color: C.red }}>All copies on loan</span> },
          ]}
          rows={BOOKS}
        />
      </Card>
      <Card>
        <SectionHeader title={role === "student" ? "My Loans" : "Issue & Return Tracker"} />
        <Table
          columns={[
            { key: "student", label: "Student" },
            { key: "book", label: "Book" },
            { key: "due", label: "Due Date" },
            { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            { key: "fine", label: "Fine", render: (r) => r.fine ? fmtMoney(r.fine) : "—" },
          ]}
          rows={LOANS}
        />
      </Card>
    </div>
  );
}


export { LibraryModule };
