import React, { useState } from "react";
import {
  Search, Phone, Mail, UserCircle2, FileCheck2
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, SUBJECTS, STUDENTS, APPLICANTS } from "../data/mockData";

function StudentsModule({ role, onSelectStudent }) {
  const [tab, setTab] = useState("directory");
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");

  const filtered = STUDENTS.filter((s) =>
    (classFilter === "All" || s.cls === classFilter) &&
    s.name.toLowerCase().includes(query.toLowerCase())
  );

  const stages = ["Applied", "Reviewed", "Accepted", "Enrolled"];

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Tag active={tab === "directory"} onClick={() => setTab("directory")}>Student Directory</Tag>
        <Tag active={tab === "admissions"} onClick={() => setTab("admissions")}>Admissions Pipeline</Tag>
      </div>

      {tab === "directory" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 200 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13 }}>
              <option>All</option>
              {CLASSES.map((c) => <option key={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Table
            onRowClick={onSelectStudent}
            columns={[
              { key: "name", label: "Name", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><span style={{ fontWeight: 600 }}>{r.name}</span></div> },
              { key: "id", label: "Admission No", render: (r) => <span style={monoFont}>{r.id}</span> },
              { key: "cls", label: "Class" },
              { key: "attendance", label: "Attendance", render: (r) => `${r.attendance}%` },
              { key: "average", label: "Average", render: (r) => `${r.average}%` },
              { key: "balance", label: "Fee Balance", render: (r) => r.balance ? <span style={{ color: C.amber }}>{fmtMoney(r.balance)}</span> : <span style={{ color: C.green }}>Settled</span> },
              { key: "risk", label: "Risk", render: (r) => <Pill tone={riskTone(r.risk)}>{r.risk}</Pill> },
            ]}
            rows={filtered}
          />
        </Card>
      )}

      {tab === "admissions" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {stages.map((stage) => (
            <div key={stage} style={{ minWidth: 200 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{stage}</span>
                <Pill tone="slate">{APPLICANTS.filter((a) => a.stage === stage).length}</Pill>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {APPLICANTS.filter((a) => a.stage === stage).map((a) => (
                  <Card key={a.id} style={{ padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4 }}>{a.forClass}</div>
                    <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6, ...monoFont }}>{a.id} · {a.date}</div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StudentDetailModal({ student, onClose }) {
  const [tab, setTab] = useState("profile");
  if (!student) return null;
  return (
    <Modal open={!!student} onClose={onClose} title={student.name} wide>
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <Avatar name={student.name} size={56} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{student.name}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 2 }}>{student.cls} · <span style={monoFont}>{student.id}</span></div>
        </div>
        <div style={{ marginLeft: "auto" }}><Pill tone={riskTone(student.risk)}>{student.risk} Risk</Pill></div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["profile", "guardian", "academic", "documents"].map((t) => (
          <Tag key={t} active={tab === t} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</Tag>
        ))}
      </div>
      {tab === "profile" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Gender", student.gender], ["Class", student.cls], ["Attendance", `${student.attendance}%`], ["Average", `${student.average}%`], ["Fee Balance", fmtMoney(student.balance)], ["Status", student.status]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11.5, color: C.textFaint, textTransform: "uppercase" }}>{k}</div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
      )}
      {tab === "guardian" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><UserCircle2 size={16} color={C.textMuted} /><span style={{ color: C.text, fontSize: 13.5 }}>{student.guardian}</span></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Phone size={16} color={C.textMuted} /><span style={{ color: C.text, fontSize: 13.5 }}>{student.phone}</span></div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}><Mail size={16} color={C.textMuted} /><span style={{ color: C.text, fontSize: 13.5 }}>{student.email}</span></div>
        </div>
      )}
      {tab === "academic" && (
        <Table
          columns={[{ key: "subject", label: "Subject" }, { key: "score", label: "Latest Score", render: () => `${60 + Math.floor(Math.random() * 35)}%` }]}
          rows={SUBJECTS.slice(0, 6).map((s) => ({ subject: s }))}
        />
      )}
      {tab === "documents" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["Birth Certificate", "Previous School Report", "Medical Form", "Admission Letter"].map((d) => (
            <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <FileCheck2 size={15} color={C.green} />
              <span style={{ fontSize: 13, color: C.text }}>{d}</span>
              <Pill tone="green">Uploaded</Pill>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export { StudentsModule, StudentDetailModal };
