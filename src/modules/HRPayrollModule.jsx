import React, { useState } from "react";
import {
  Users, Wallet, Bus, Search, Plus, Clock, ShieldCheck, Phone, Mail, DollarSign, Briefcase, UserPlus, Check, XCircle, CalendarDays, Download
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";

const HR_DEPARTMENTS = ["Mathematics", "Sciences", "Languages", "Humanities", "Administration", "Finance", "Support Staff"];

const HR_STAFF = [
  { id: "EMP-001", name: "Mrs. Patience Mhike", role: "Head of School", department: "Administration", type: "Full-time", joined: "2018-01-15", salary: 2400, status: "Active", phone: "+263 77 100 2001", email: "p.mhike@springfield.edu" },
  { id: "EMP-002", name: "Mr. T. Moyo", role: "Mathematics Teacher", department: "Mathematics", type: "Full-time", joined: "2019-08-20", salary: 980, status: "Active", phone: "+263 77 412 0091", email: "t.moyo@springfield.edu" },
  { id: "EMP-003", name: "Mrs. R. Chikore", role: "English Teacher", department: "Languages", type: "Full-time", joined: "2020-01-10", salary: 920, status: "Active", phone: "+263 78 220 4471", email: "r.chikore@springfield.edu" },
  { id: "EMP-004", name: "Mr. S. Ndlovu", role: "Physics Teacher", department: "Sciences", type: "Full-time", joined: "2017-09-01", salary: 1010, status: "On Leave", phone: "+263 71 556 7791", email: "s.ndlovu@springfield.edu" },
  { id: "EMP-005", name: "Mrs. P. Gumbo", role: "Biology Teacher", department: "Sciences", type: "Contract", joined: "2024-02-12", salary: 860, status: "Active", phone: "+263 73 209 8821", email: "p.gumbo@springfield.edu", contractEnd: "2026-12-15" },
  { id: "EMP-006", name: "Mr. D. Banda", role: "Computer Science Teacher", department: "Sciences", type: "Full-time", joined: "2021-03-05", salary: 950, status: "Active", phone: "+263 78 667 9012", email: "d.banda@springfield.edu" },
  { id: "EMP-007", name: "Mr. Farai Zhou", role: "Bus Driver", department: "Support Staff", type: "Full-time", joined: "2019-06-18", salary: 410, status: "Active", phone: "+263 77 334 1290", email: "f.zhou@springfield.edu" },
  { id: "EMP-008", name: "Ms. Lisa Marufu", role: "Bursar", department: "Finance", type: "Full-time", joined: "2016-11-02", salary: 1150, status: "Active", phone: "+263 71 442 6654", email: "l.marufu@springfield.edu" },
  { id: "EMP-009", name: "Mr. K. Sibanda", role: "Librarian", department: "Support Staff", type: "Part-time", joined: "2022-07-22", salary: 520, status: "Active", phone: "+263 73 776 3321", email: "k.sibanda@springfield.edu" },
];

const HR_LEAVE_REQUESTS_INIT = [
  { id: 1, name: "Mr. S. Ndlovu", type: "Sick Leave", from: "2026-06-16", to: "2026-06-24", days: 9, status: "Approved", reason: "Medical treatment" },
  { id: 2, name: "Mrs. R. Chikore", type: "Annual Leave", from: "2026-07-01", to: "2026-07-08", days: 6, status: "Pending", reason: "Family travel" },
  { id: 3, name: "Mr. K. Sibanda", type: "Compassionate", from: "2026-06-19", to: "2026-06-20", days: 2, status: "Pending", reason: "Family bereavement" },
  { id: 4, name: "Mr. D. Banda", type: "Annual Leave", from: "2026-08-10", to: "2026-08-14", days: 4, status: "Declined", reason: "Overlaps exam marking period" },
];

const HR_LEAVE_BALANCES = HR_STAFF.slice(0, 6).map((s, i) => ({ name: s.name, annualTotal: 21, annualUsed: [4, 9, 12, 21, 6, 15][i], sickTotal: 14, sickUsed: [0, 2, 9, 1, 3, 0][i] }));

const HR_PAYROLL = HR_STAFF.map((s) => {
  const basic = s.salary;
  const allowances = Math.round(basic * 0.12);
  const gross = basic + allowances;
  const paye = Math.round(gross * 0.18);
  const pension = Math.round(basic * 0.05);
  const net = gross - paye - pension;
  return { ...s, basic, allowances, gross, paye, pension, net };
});

const HR_PAYROLL_TREND = [
  { month: "Jan", cost: 9120 }, { month: "Feb", cost: 9120 }, { month: "Mar", cost: 9340 },
  { month: "Apr", cost: 9340 }, { month: "May", cost: 9590 }, { month: "Jun", cost: 9590 },
];

const HR_POSITIONS = [
  { id: "POS-01", title: "French Teacher", department: "Languages", type: "Full-time", openings: 1, applicants: 6, status: "Open" },
  { id: "POS-02", title: "Lab Technician", department: "Sciences", type: "Full-time", openings: 1, applicants: 3, status: "Open" },
  { id: "POS-03", title: "Sports Coordinator", department: "Support Staff", type: "Part-time", openings: 1, applicants: 4, status: "Closed" },
];

const HR_APPLICANTS = [
  { name: "Grace Tafara", position: "French Teacher", stage: "Applied", date: "2026-06-10" },
  { name: "Michael Osei", position: "French Teacher", stage: "Interview", date: "2026-06-05" },
  { name: "Ruth Chivasa", position: "Lab Technician", stage: "Interview", date: "2026-06-08" },
  { name: "Joseph Mhlanga", position: "French Teacher", stage: "Offer", date: "2026-06-01" },
  { name: "Anita Ndoro", position: "Sports Coordinator", stage: "Hired", date: "2026-05-20" },
];

function StaffModal({ staff, onClose }) {
  const [tab, setTab] = useState("contract");
  if (!staff) return null;
  const balance = HR_LEAVE_BALANCES.find((b) => b.name === staff.name);
  const pay = HR_PAYROLL.find((p) => p.id === staff.id);
  return (
    <Modal open={!!staff} onClose={onClose} title={staff.name} wide>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <Avatar name={staff.name} size={50} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{staff.name}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>{staff.role} · {staff.department}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><Pill tone={statusTone(staff.status)}>{staff.status}</Pill></div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <Tag active={tab === "contract"} onClick={() => setTab("contract")}>Contract</Tag>
        <Tag active={tab === "leave"} onClick={() => setTab("leave")}>Leave</Tag>
        <Tag active={tab === "payroll"} onClick={() => setTab("payroll")}>Payroll</Tag>
      </div>
      {tab === "contract" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Employee ID", staff.id], ["Employment Type", staff.type], ["Department", staff.department], ["Date Joined", staff.joined], ["Contract End", staff.contractEnd || "Permanent"], ["Monthly Basic", fmtMoney(staff.salary)]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase" }}>{k}</div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 3 }}>{v}</div>
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 14, marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={13} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{staff.phone}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={13} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{staff.email}</span></div>
          </div>
        </div>
      )}
      {tab === "leave" && balance && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>Annual Leave</span>
              <span style={{ color: C.textMuted }}>{balance.annualUsed}/{balance.annualTotal} days used</span>
            </div>
            <ProgressBar value={(balance.annualUsed / balance.annualTotal) * 100} tone="indigo" />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
              <span style={{ color: C.text, fontWeight: 600 }}>Sick Leave</span>
              <span style={{ color: C.textMuted }}>{balance.sickUsed}/{balance.sickTotal} days used</span>
            </div>
            <ProgressBar value={(balance.sickUsed / balance.sickTotal) * 100} tone="amber" />
          </div>
        </div>
      )}
      {tab === "payroll" && pay && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[["Basic Salary", pay.basic], ["Allowances", pay.allowances], ["Gross Pay", pay.gross], ["PAYE Tax", -pay.paye], ["Pension/NSSA", -pay.pension]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ color: C.textMuted }}>{k}</span>
              <span style={{ color: v < 0 ? C.red : C.text, fontWeight: 600 }}>{v < 0 ? "-" : ""}{fmtMoney(v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, paddingTop: 6 }}>
            <span style={{ color: C.text, fontWeight: 700 }}>Net Pay</span>
            <span style={{ color: C.green, fontWeight: 700 }}>{fmtMoney(pay.net)}</span>
          </div>
        </div>
      )}
    </Modal>
  );
}

function HRAdminView() {
  const [tab, setTab] = useState("staff");
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [leave, setLeave] = useState(HR_LEAVE_REQUESTS_INIT);
  const [payslipPreview, setPayslipPreview] = useState(null);
  const [payrollRun, setPayrollRun] = useState(false);

  const filteredStaff = HR_STAFF.filter((s) => (deptFilter === "All" || s.department === deptFilter) && s.name.toLowerCase().includes(query.toLowerCase()));
  const totalGross = HR_PAYROLL.reduce((sum, p) => sum + p.gross, 0);
  const totalNet = HR_PAYROLL.reduce((sum, p) => sum + p.net, 0);
  const pendingLeave = leave.filter((l) => l.status === "Pending").length;

  function decideLeave(id, decision) {
    setLeave((arr) => arr.map((l) => (l.id === id ? { ...l, status: decision } : l)));
  }

  const stages = ["Applied", "Interview", "Offer", "Hired"];

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Users} label="Total Staff" value={HR_STAFF.length} tone="indigo" />
        <StatCard icon={Wallet} label="Monthly Payroll Cost" value={fmtMoney(totalGross)} tone="green" />
        <StatCard icon={Clock} label="Pending Leave Requests" value={pendingLeave} tone="amber" />
        <StatCard icon={Briefcase} label="Open Positions" value={HR_POSITIONS.filter((p) => p.status === "Open").length} tone="cyan" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "staff"} onClick={() => setTab("staff")}>Staff Directory</Tag>
        <Tag active={tab === "leave"} onClick={() => setTab("leave")}>Leave Management</Tag>
        <Tag active={tab === "payroll"} onClick={() => setTab("payroll")}>Payroll</Tag>
        <Tag active={tab === "recruitment"} onClick={() => setTab("recruitment")}>Recruitment</Tag>
      </div>

      {tab === "staff" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 200 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13 }}>
              <option>All</option>
              {HR_DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <UserPlus size={14} /> Add Staff
            </button>
          </div>
          <Table
            onRowClick={setSelectedStaff}
            columns={[
              { key: "name", label: "Name", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.role}</div></div></div> },
              { key: "department", label: "Department" },
              { key: "type", label: "Type", render: (r) => <Pill tone={statusTone(r.type)}>{r.type}</Pill> },
              { key: "joined", label: "Joined" },
              { key: "salary", label: "Monthly Salary", render: (r) => fmtMoney(r.salary) },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={filteredStaff}
          />
        </Card>
      )}

      {tab === "leave" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Leave Requests" subtitle="Approve or decline pending requests" />
            <Table
              columns={[
                { key: "name", label: "Staff" },
                { key: "type", label: "Type" },
                { key: "from", label: "From" },
                { key: "to", label: "To" },
                { key: "days", label: "Days", align: "center" },
                { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
                { key: "actions", label: "", render: (r) => r.status === "Pending" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => decideLeave(r.id, "Approved")} style={{ background: C.greenSoft, border: "none", borderRadius: 7, padding: "5px 8px", color: C.green, cursor: "pointer", display: "flex" }}><Check size={13} /></button>
                    <button onClick={() => decideLeave(r.id, "Declined")} style={{ background: C.redSoft, border: "none", borderRadius: 7, padding: "5px 8px", color: C.red, cursor: "pointer", display: "flex" }}><XCircle size={13} /></button>
                  </div>
                ) : null },
              ]}
              rows={leave}
            />
          </Card>
          <Card>
            <SectionHeader title="Leave Balances" subtitle="Current term, annual & sick leave" />
            <Table
              columns={[
                { key: "name", label: "Staff" },
                { key: "annual", label: "Annual Leave", render: (r) => `${r.annualUsed}/${r.annualTotal} days` },
                { key: "sick", label: "Sick Leave", render: (r) => `${r.sickUsed}/${r.sickTotal} days` },
              ]}
              rows={HR_LEAVE_BALANCES}
            />
          </Card>
        </div>
      )}

      {tab === "payroll" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Card style={{ flex: 1, minWidth: 280 }}>
              <SectionHeader title="Payroll Cost Trend" subtitle="Last 6 months (USD)" />
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={HR_PAYROLL_TREND}>
                  <CartesianGrid stroke={C.borderSoft} vertical={false} />
                  <XAxis dataKey="month" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                  <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={42} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="cost" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card style={{ flex: 1, minWidth: 220 }}>
              <SectionHeader title="This Month" subtitle="June 2026" />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.textMuted }}>Gross Payroll</span><span style={{ color: C.text, fontWeight: 700 }}>{fmtMoney(totalGross)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ color: C.textMuted }}>Net Payable</span><span style={{ color: C.green, fontWeight: 700 }}>{fmtMoney(totalNet)}</span></div>
                <button onClick={() => setPayrollRun(true)} style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  <DollarSign size={14} /> Run Payroll
                </button>
                {payrollRun && <div style={{ textAlign: "center" }}><Pill tone="green">Payroll run completed for June 2026</Pill></div>}
              </div>
            </Card>
          </div>
          <Card>
            <SectionHeader title="Payslips" subtitle="Click a row to preview" />
            <Table
              onRowClick={setPayslipPreview}
              columns={[
                { key: "name", label: "Staff" },
                { key: "department", label: "Department" },
                { key: "gross", label: "Gross", render: (r) => fmtMoney(r.gross) },
                { key: "paye", label: "PAYE", render: (r) => fmtMoney(r.paye) },
                { key: "pension", label: "Pension", render: (r) => fmtMoney(r.pension) },
                { key: "net", label: "Net Pay", render: (r) => <span style={{ color: C.green, fontWeight: 700 }}>{fmtMoney(r.net)}</span> },
              ]}
              rows={HR_PAYROLL}
            />
          </Card>
        </div>
      )}

      {tab === "recruitment" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Open Positions" action={<button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}><Plus size={14} /> New Position</button>} />
            <Table
              columns={[
                { key: "title", label: "Position" },
                { key: "department", label: "Department" },
                { key: "type", label: "Type" },
                { key: "applicants", label: "Applicants", align: "center" },
                { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
              ]}
              rows={HR_POSITIONS}
            />
          </Card>
          <div>
            <SectionHeader title="Applicant Pipeline" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
              {stages.map((stage) => (
                <div key={stage} style={{ minWidth: 180 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>{stage}</span>
                    <Pill tone="slate">{HR_APPLICANTS.filter((a) => a.stage === stage).length}</Pill>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {HR_APPLICANTS.filter((a) => a.stage === stage).map((a, i) => (
                      <Card key={i} style={{ padding: 14 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: C.text }}>{a.name}</div>
                        <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4 }}>{a.position}</div>
                        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 6, ...monoFont }}>{a.date}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <StaffModal staff={selectedStaff} onClose={() => setSelectedStaff(null)} />

      <Modal open={!!payslipPreview} onClose={() => setPayslipPreview(null)} title="Payslip Preview">
        {payslipPreview && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <Avatar name={payslipPreview.name} size={44} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{payslipPreview.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{payslipPreview.role} · June 2026</div>
              </div>
            </div>
            {[["Basic Salary", payslipPreview.basic], ["Allowances", payslipPreview.allowances], ["Gross Pay", payslipPreview.gross], ["PAYE Tax", -payslipPreview.paye], ["Pension/NSSA", -payslipPreview.pension]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                <span style={{ color: C.textMuted }}>{k}</span>
                <span style={{ color: v < 0 ? C.red : C.text, fontWeight: 600 }}>{v < 0 ? "-" : ""}{fmtMoney(v)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, paddingTop: 10 }}>
              <span style={{ color: C.text, fontWeight: 700 }}>Net Pay</span>
              <span style={{ color: C.green, fontWeight: 700 }}>{fmtMoney(payslipPreview.net)}</span>
            </div>
            <button style={{ marginTop: 16, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <Download size={14} /> Download PDF
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function HRSelfServiceView() {
  const [tab, setTab] = useState("payslips");
  const me = HR_PAYROLL[1]; // Mr. T. Moyo, demo "logged in" staff
  const myBalance = HR_LEAVE_BALANCES.find((b) => b.name === me.name);
  const myLeave = HR_LEAVE_REQUESTS_INIT.filter((l) => l.name === me.name);
  const [requestOpen, setRequestOpen] = useState(false);

  return (
    <div>
      <Card style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Avatar name={me.name} size={44} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{me.name}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>{me.role} · {me.department}</div>
        </div>
      </Card>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Tag active={tab === "payslips"} onClick={() => setTab("payslips")}>My Payslips</Tag>
        <Tag active={tab === "leave"} onClick={() => setTab("leave")}>My Leave</Tag>
      </div>

      {tab === "payslips" && (
        <Card>
          <SectionHeader title="June 2026 Payslip" />
          {[["Basic Salary", me.basic], ["Allowances", me.allowances], ["Gross Pay", me.gross], ["PAYE Tax", -me.paye], ["Pension/NSSA", -me.pension]].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "9px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
              <span style={{ color: C.textMuted }}>{k}</span>
              <span style={{ color: v < 0 ? C.red : C.text, fontWeight: 600 }}>{v < 0 ? "-" : ""}{fmtMoney(v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, paddingTop: 12 }}>
            <span style={{ color: C.text, fontWeight: 700 }}>Net Pay</span>
            <span style={{ color: C.green, fontWeight: 700 }}>{fmtMoney(me.net)}</span>
          </div>
          <button style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Download size={14} /> Download PDF
          </button>
        </Card>
      )}

      {tab === "leave" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <StatCard icon={CalendarDays} label="Annual Leave Left" value={`${myBalance.annualTotal - myBalance.annualUsed} days`} tone="indigo" />
            <StatCard icon={ShieldCheck} label="Sick Leave Left" value={`${myBalance.sickTotal - myBalance.sickUsed} days`} tone="cyan" />
          </div>
          <Card>
            <SectionHeader title="My Leave History" action={<button onClick={() => setRequestOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}><Plus size={13} /> Request Leave</button>} />
            {myLeave.length > 0 ? (
              <Table columns={[{ key: "type", label: "Type" }, { key: "from", label: "From" }, { key: "to", label: "To" }, { key: "days", label: "Days" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myLeave} />
            ) : (
              <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 20 }}>No leave requests yet.</div>
            )}
          </Card>
        </div>
      )}

      <Modal open={requestOpen} onClose={() => setRequestOpen(false)} title="Request Leave">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Leave Type</div>
            <select style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
              <option>Annual Leave</option><option>Sick Leave</option><option>Compassionate Leave</option><option>Maternity / Paternity Leave</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>From</div>
              <input type="date" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>To</div>
              <input type="date" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Reason</div>
            <textarea rows={3} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5, resize: "vertical" }} />
          </div>
          <button onClick={() => setRequestOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            Submit Request
          </button>
        </div>
      </Modal>
    </div>
  );
}

function HRPayrollModule({ role }) {
  return role === "admin" ? <HRAdminView /> : <HRSelfServiceView />;
}


export { HRPayrollModule };
