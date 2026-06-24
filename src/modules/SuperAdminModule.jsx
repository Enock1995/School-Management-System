import React, { useState } from "react";
import {
  Search, Plus, CheckCircle2, Users, Building2, Globe2, CreditCard,
  ShieldAlert, Sparkles, MapPin, Lock, AlertTriangle, RefreshCw, Crown
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Tag, Toggle, Table, Modal, CustomTooltip, statusTone } from "../components/ui";

const SCHOOLS = [
  { id: "SCH-01", name: "Springfield International High School", location: "Harare, Zimbabwe", curriculum: "Cambridge / ZIMSEC", students: 356, staff: 42, plan: "Enterprise", status: "Active", joined: "2023-01-10", monthlyFee: 450 },
  { id: "SCH-02", name: "Riverside Academy", location: "Bulawayo, Zimbabwe", curriculum: "ZIMSEC", students: 280, staff: 35, plan: "Growth", status: "Active", joined: "2024-03-15", monthlyFee: 280 },
  { id: "SCH-03", name: "Greenwood College", location: "Lusaka, Zambia", curriculum: "Cambridge", students: 410, staff: 48, plan: "Enterprise", status: "Active", joined: "2023-08-01", monthlyFee: 450 },
  { id: "SCH-04", name: "Sunrise Primary School", location: "Harare, Zimbabwe", curriculum: "Local Curriculum", students: 190, staff: 22, plan: "Starter", status: "Trial", joined: "2026-06-01", monthlyFee: 120 },
  { id: "SCH-05", name: "St. Augustine's College", location: "Gaborone, Botswana", curriculum: "Cambridge / IGCSE", students: 320, staff: 38, plan: "Growth", status: "Active", joined: "2024-11-20", monthlyFee: 280 },
  { id: "SCH-06", name: "Lakeside Academy", location: "Nairobi, Kenya", curriculum: "IB", students: 275, staff: 30, plan: "Growth", status: "Suspended", joined: "2024-06-10", monthlyFee: 280 },
];

const PLANS = [
  { name: "Starter", price: 120, limit: "Up to 200 students", features: "Core modules: SIS, Attendance, Academics, Communication" },
  { name: "Growth", price: 280, limit: "Up to 400 students", features: "+ AI Hub, HR & Payroll, Finance forecasting" },
  { name: "Enterprise", price: 450, limit: "Unlimited students", features: "+ Multi-campus, custom branding, priority support" },
];

const REVENUE_TREND = [
  { month: "Jan", mrr: 1520 }, { month: "Feb", mrr: 1520 }, { month: "Mar", mrr: 1660 },
  { month: "Apr", mrr: 1800 }, { month: "May", mrr: 1800 }, { month: "Jun", mrr: 2030 },
];

const AUDIT_LOG = [
  { action: "Updated fee structure for Form 2A", school: "Springfield International", user: "Mrs. Patience Mhike", date: "2026-06-18", severity: "Normal" },
  { action: "New school onboarded", school: "Sunrise Primary School", user: "Platform Team", date: "2026-06-01", severity: "Normal" },
  { action: "3 failed login attempts on admin account", school: "Lakeside Academy", user: "Unknown", date: "2026-06-17", severity: "Flagged" },
  { action: "Subscription payment failed", school: "Lakeside Academy", user: "System", date: "2026-06-15", severity: "Flagged" },
  { action: "Nightly backup completed successfully", school: "All Schools", user: "System", date: "2026-06-20", severity: "Normal" },
  { action: "Global AI Hub feature flag enabled", school: "Platform", user: "Super Admin", date: "2026-06-12", severity: "Normal" },
];

const BACKUP_JOBS = [
  { date: "2026-06-20 02:00", scope: "All Schools", size: "4.2 GB", status: "Completed" },
  { date: "2026-06-19 02:00", scope: "All Schools", size: "4.1 GB", status: "Completed" },
  { date: "2026-06-18 02:00", scope: "All Schools", size: "4.1 GB", status: "Completed" },
];

/* ============================== SCHOOL DETAIL MODAL ============================== */
function SchoolModal({ school, onClose }) {
  if (!school) return null;
  return (
    <Modal open={!!school} onClose={onClose} title={school.name} wide>
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <Pill tone={statusTone(school.status)}>{school.status}</Pill>
        <Pill tone="indigo">{school.plan} Plan</Pill>
        <Pill tone="slate">{school.curriculum}</Pill>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        {[["Location", school.location], ["Students", school.students], ["Staff", school.staff], ["Joined Platform", school.joined], ["Monthly Fee", fmtMoney(school.monthlyFee)], ["School ID", school.id]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 3, ...(k === "School ID" ? monoFont : {}) }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Log In As School Admin
        </button>
        {school.status !== "Suspended" ? (
          <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "transparent", color: C.red, border: `1px solid ${C.red}`, borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Suspend Account
          </button>
        ) : (
          <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.green, color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            Reactivate Account
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ============================== MAIN SUPER ADMIN VIEW ============================== */
function SuperAdminView() {
  const [tab, setTab] = useState("schools");
  const [query, setQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [globalAI, setGlobalAI] = useState(true);
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [selfSignup, setSelfSignup] = useState(false);

  const filtered = SCHOOLS.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));
  const totalStudents = SCHOOLS.reduce((s, sc) => s + sc.students, 0);
  const totalMRR = SCHOOLS.filter((s) => s.status !== "Suspended").reduce((s, sc) => s + sc.monthlyFee, 0);
  const activeSchools = SCHOOLS.filter((s) => s.status === "Active").length;
  const flaggedEvents = AUDIT_LOG.filter((a) => a.severity === "Flagged").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <Crown size={18} color={C.amber} />
        <span style={{ fontSize: 12.5, color: C.amber, fontWeight: 700, letterSpacing: 0.3 }}>SUPER ADMIN · PLATFORM-WIDE ACCESS</span>
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Building2} label="Schools on Platform" value={SCHOOLS.length} tone="indigo" />
        <StatCard icon={Users} label="Total Students" value={totalStudents.toLocaleString()} tone="cyan" />
        <StatCard icon={CreditCard} label="Monthly Recurring Revenue" value={fmtMoney(totalMRR)} tone="green" />
        <StatCard icon={ShieldAlert} label="Flagged Security Events" value={flaggedEvents} tone="red" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "schools"} onClick={() => setTab("schools")}>Schools</Tag>
        <Tag active={tab === "billing"} onClick={() => setTab("billing")}>Subscriptions & Billing</Tag>
        <Tag active={tab === "settings"} onClick={() => setTab("settings")}>Global Settings</Tag>
        <Tag active={tab === "security"} onClick={() => setTab("security")}>Security & Audit Logs</Tag>
      </div>

      {tab === "schools" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 200 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search schools…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Onboard School
            </button>
          </div>
          <Table
            onRowClick={setSelectedSchool}
            columns={[
              { key: "name", label: "School", render: (r) => <div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: C.textFaint, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}><MapPin size={10} />{r.location}</div></div> },
              { key: "students", label: "Students", align: "center" },
              { key: "plan", label: "Plan", render: (r) => <Pill tone="indigo">{r.plan}</Pill> },
              { key: "monthlyFee", label: "Monthly Fee", render: (r) => fmtMoney(r.monthlyFee) },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={filtered}
          />
        </Card>
      )}

      {tab === "billing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Monthly Recurring Revenue" subtitle="Across all schools, last 6 months" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={REVENUE_TREND}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="month" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={48} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="mrr" stroke={C.green} strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Plan Tiers" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
              {PLANS.map((p) => (
                <div key={p.name} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</span>
                    <span style={{ ...displayFont, fontSize: 16, fontWeight: 700, color: C.cyan }}>{fmtMoney(p.price)}<span style={{ fontSize: 11, color: C.textMuted }}>/mo</span></span>
                  </div>
                  <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 8 }}>{p.limit}</div>
                  <div style={{ fontSize: 11.5, color: C.textFaint, marginTop: 10, lineHeight: 1.5 }}>{p.features}</div>
                  <div style={{ marginTop: 10 }}><Pill tone="slate">{SCHOOLS.filter((s) => s.plan === p.name).length} schools</Pill></div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionHeader title="Billing Status by School" />
            <Table columns={[{ key: "name", label: "School" }, { key: "plan", label: "Plan", render: (r) => <Pill tone="indigo">{r.plan}</Pill> }, { key: "monthlyFee", label: "Fee", render: (r) => fmtMoney(r.monthlyFee) }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status === "Suspended" ? "Payment Failed" : "Current"}</Pill> }]} rows={SCHOOLS} />
          </Card>
        </div>
      )}

      {tab === "settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Platform Feature Flags" subtitle="Applied across all schools on the platform" />
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 8 }}><Sparkles size={14} color={C.cyan} /> AI Hub Enabled Platform-Wide</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Controls whether Growth/Enterprise schools can access AI features</div>
                </div>
                <Toggle on={globalAI} onChange={setGlobalAI} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 8 }}><Lock size={14} color={C.cyan} /> Enforce 2FA for All School Admins</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Overrides individual school security settings</div>
                </div>
                <Toggle on={enforce2FA} onChange={setEnforce2FA} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, display: "flex", alignItems: "center", gap: 8 }}><Globe2 size={14} color={C.cyan} /> Allow New School Self-Signup</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>If off, all new schools must be manually onboarded</div>
                </div>
                <Toggle on={selfSignup} onChange={setSelfSignup} />
              </div>
            </div>
          </Card>
          <Card>
            <SectionHeader title="Default Platform Configuration" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
              {[["Default Currency", "USD"], ["Data Residency Region", "Africa (af-south-1)"], ["Supported Curricula", "5 frameworks"], ["Platform Version", "v1.4.2"]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase" }}>{k}</div>
                  <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600, marginTop: 3 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Platform Audit Log" subtitle="Actions across all schools" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {AUDIT_LOG.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", paddingBottom: 12, borderBottom: i < AUDIT_LOG.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                  <div style={{ marginTop: 2 }}>{a.severity === "Flagged" ? <AlertTriangle size={14} color={C.red} /> : <CheckCircle2 size={14} color={C.green} />}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: C.text }}>{a.action}</div>
                    <div style={{ fontSize: 11, color: C.textFaint, marginTop: 2 }}>{a.school} · {a.user}</div>
                  </div>
                  <span style={{ fontSize: 11, color: C.textFaint, flexShrink: 0 }}>{a.date}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionHeader title="Backup Management" subtitle="Nightly automated backups across all school databases" action={
              <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                <RefreshCw size={13} /> Run Backup Now
              </button>
            } />
            <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 11.5, color: C.textMuted, marginBottom: 6 }}>Storage Used</div>
                <ProgressBar value={62} tone="cyan" />
                <div style={{ fontSize: 11, color: C.textFaint, marginTop: 4 }}>62% of 50 GB allocated</div>
              </div>
            </div>
            <Table columns={[{ key: "date", label: "Date" }, { key: "scope", label: "Scope" }, { key: "size", label: "Size" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={BACKUP_JOBS} />
          </Card>
        </div>
      )}

      <SchoolModal school={selectedSchool} onClose={() => setSelectedSchool(null)} />
    </div>
  );
}

/* ============================== ROOT (preview wrapper) ============================== */

function SuperAdminModule() {
  return <SuperAdminView />;
}

export { SuperAdminModule };