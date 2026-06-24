import React from "react";
import { X, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { C, fmtMoney, displayFont } from "../lib/theme";

function NexusMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="nexusGrad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor={C.cyan} />
          <stop offset="1" stopColor={C.indigo} />
        </linearGradient>
      </defs>
      <line x1="20" y1="8" x2="9" y2="26" stroke="url(#nexusGrad)" strokeWidth="1.6" opacity="0.7" />
      <line x1="20" y1="8" x2="31" y2="26" stroke="url(#nexusGrad)" strokeWidth="1.6" opacity="0.7" />
      <line x1="9" y1="26" x2="31" y2="26" stroke="url(#nexusGrad)" strokeWidth="1.6" opacity="0.7" />
      <line x1="20" y1="8" x2="20" y2="20" stroke="url(#nexusGrad)" strokeWidth="1.6" opacity="0.5" />
      <circle cx="20" cy="8" r="4" fill={C.cyan} />
      <circle cx="9" cy="26" r="4" fill={C.indigo} />
      <circle cx="31" cy="26" r="4" fill={C.indigo} />
      <circle cx="20" cy="20" r="2.6" fill={C.text} />
    </svg>
  );
}

function Pill({ children, tone = "slate" }) {
  const tones = {
    green: { bg: C.greenSoft, color: C.green },
    amber: { bg: C.amberSoft, color: C.amber },
    red: { bg: C.redSoft, color: C.red },
    indigo: { bg: C.indigoSoft, color: C.indigo },
    cyan: { bg: C.cyanSoft, color: C.cyan },
    slate: { bg: "rgba(139,147,184,0.14)", color: C.textMuted },
  };
  const t = tones[tone] || tones.slate;
  return (
    <span style={{ background: t.bg, color: t.color, fontSize: 11.5, fontWeight: 600, padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap", letterSpacing: 0.2 }}>
      {children}
    </span>
  );
}

function riskTone(r) { return r === "High" ? "red" : r === "Watch" ? "amber" : "green"; }
function statusTone(s) {
  if (["Paid", "Enrolled", "Active", "Graded", "On Route", "Approved", "Hired", "Open", "Available", "Resolved", "Up to Date", "Completed", "Won", "Matched", "Donor", "Issued", "Signed", "Healthy"].includes(s)) return "green";
  if (["Partial", "Scheduled", "Watch", "Marking", "At School", "On Leave", "Pending", "Interview", "Part-time", "Full", "Monitoring", "Due Soon", "Drawn", "Pending Signature", "Draft", "Trial"].includes(s)) return "amber";
  if (["Overdue", "High", "Maintenance", "Suspended", "Declined", "Closed", "Withdrawn", "Lost", "Failed", "Flagged"].includes(s)) return "red";
  if (["Upcoming"].includes(s)) return "indigo";
  return "slate";
}

function Card({ children, style, className = "", padded = true }) {
  return (
    <div
      className={className}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18,
        padding: padded ? 20 : 0, ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
      <div>
        <h2 style={{ ...displayFont, fontSize: 19, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ color: C.textMuted, fontSize: 13, margin: "4px 0 0" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, delta, deltaTone = "green", tone = "indigo" }) {
  const toneColor = tone === "cyan" ? C.cyan : tone === "amber" ? C.amber : tone === "red" ? C.red : C.indigo;
  const toneBg = tone === "cyan" ? C.cyanSoft : tone === "amber" ? C.amberSoft : tone === "red" ? C.redSoft : C.indigoSoft;
  return (
    <Card style={{ flex: 1, minWidth: 168 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: C.textMuted, fontSize: 12.5, fontWeight: 600 }}>{label}</span>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: toneBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={15} color={toneColor} />
        </div>
      </div>
      <div style={{ ...displayFont, fontSize: 27, fontWeight: 700, color: C.text, marginTop: 12 }}>{value}</div>
      {delta && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          {deltaTone === "green" ? <ArrowUpRight size={13} color={C.green} /> : <ArrowDownRight size={13} color={C.red} />}
          <span style={{ fontSize: 12, color: deltaTone === "green" ? C.green : C.red, fontWeight: 600 }}>{delta}</span>
        </div>
      )}
    </Card>
  );
}

function ProgressBar({ value, tone = "indigo", h = 6 }) {
  const color = tone === "green" ? C.green : tone === "amber" ? C.amber : tone === "red" ? C.red : C.indigo;
  return (
    <div style={{ width: "100%", height: h, background: "rgba(255,255,255,0.06)", borderRadius: 99 }}>
      <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: h, background: color, borderRadius: 99, transition: "width .4s" }} />
    </div>
  );
}

function Avatar({ name, size = 32, tone = "indigo" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  const bg = tone === "cyan" ? C.cyanSoft : C.indigoSoft;
  const fg = tone === "cyan" ? C.cyan : C.indigo;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, ...displayFont, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Table({ columns, rows, onRowClick }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align || "left", padding: "0 14px 10px", color: C.textFaint, fontWeight: 600, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.5, borderBottom: `1px solid ${C.border}` }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              onClick={() => onRowClick && onRowClick(row)}
              style={{ cursor: onRowClick ? "pointer" : "default", transition: "background .15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.surfaceHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {columns.map((c) => (
                <td key={c.key} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.borderSoft}`, color: C.text, textAlign: c.align || "left" }}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(5,7,16,0.7)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 20, width: "100%", maxWidth: wide ? 720 : 480, maxHeight: "85vh", overflowY: "auto", boxShadow: "0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.surface2 }}>
          <h3 style={{ ...displayFont, fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

function Tag({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
        border: `1px solid ${active ? C.indigo : C.border}`,
        background: active ? C.indigoSoft : "transparent",
        color: active ? C.text : C.textMuted,
      }}
    >
      {children}
    </button>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", fontSize: 12.5 }}>
      <div style={{ color: C.textMuted, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {typeof p.value === "number" && p.value > 1000 ? fmtMoney(p.value) : p.value}</div>
      ))}
    </div>
  );
};


function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{ width: 42, height: 24, borderRadius: 99, background: on ? C.indigo : C.border, border: "none", position: "relative", cursor: "pointer", flexShrink: 0 }}>
      <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
    </button>
  );
}


export { NexusMark, Pill, riskTone, statusTone, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, Toggle };