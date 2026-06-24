import React, { useState } from "react";
import {
  MapPin
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A } from "../data/mockData";

function TransportModule({ role }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionHeader title="Live Route Map" subtitle="Approximate positions, refreshed every 2 minutes" />
        <svg viewBox="0 0 600 160" width="100%" height="160">
          <line x1="20" y1="80" x2="580" y2="80" stroke={C.border} strokeWidth="3" strokeDasharray="2 6" />
          {ROUTES.map((r, i) => {
            const x = r.status === "At School" ? 560 : r.status === "Maintenance" ? 40 : 180 + i * 130;
            const color = r.status === "On Route" ? C.cyan : r.status === "At School" ? C.green : C.red;
            return (
              <g key={r.id}>
                <circle cx={x} cy="80" r="9" fill={color} />
                <text x={x} y="62" textAnchor="middle" fontSize="11" fill={C.textMuted}>{r.bus}</text>
              </g>
            );
          })}
          <rect x="540" y="40" width="50" height="80" rx="8" fill="none" stroke={C.border} />
          <text x="565" y="135" textAnchor="middle" fontSize="10" fill={C.textFaint}>School</text>
        </svg>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
        {ROUTES.map((r) => (
          <Card key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{r.bus} · {r.driver}</div>
              </div>
              <Pill tone={statusTone(r.status)}>{r.status}</Pill>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.textMuted, marginBottom: 4 }}>
                <span>Capacity</span><span>{r.assigned}/{r.capacity}</span>
              </div>
              <ProgressBar value={(r.assigned / r.capacity) * 100} tone="cyan" />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: C.textMuted }}>
              <MapPin size={13} /> ETA: {r.eta}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


export { TransportModule };
