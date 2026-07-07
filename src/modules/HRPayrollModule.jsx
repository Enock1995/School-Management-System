import React, { useState, useEffect } from "react";
import {
  Users, Wallet, Search, Plus, Clock, Phone, Mail, DollarSign,
  Briefcase, UserPlus, Check, XCircle, CalendarDays, Loader2, Pencil, Trash2
} from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { C, fmtMoney, monoFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, statusTone } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

/* ─── static reference data ─────────────────────────────────────────────── */
const HR_DEPARTMENTS   = ["Mathematics", "Sciences", "Languages", "Humanities", "Administration", "Finance", "Support Staff"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract"];

const HR_LEAVE_REQUESTS_INIT = [
  { id: 1, name: "Mr. S. Ndlovu",   type: "Sick Leave",    from: "2026-06-16", to: "2026-06-24", days: 9, status: "Pending",  reason: "Medical treatment" },
  { id: 2, name: "Mrs. R. Chikore", type: "Annual Leave",  from: "2026-07-01", to: "2026-07-08", days: 6, status: "Pending",  reason: "Family travel" },
  { id: 3, name: "Mr. K. Sibanda",  type: "Compassionate", from: "2026-06-19", to: "2026-06-20", days: 2, status: "Pending",  reason: "Family bereavement" },
];

const HR_PAYROLL_TREND = [
  { month: "Jan", cost: 9120 }, { month: "Feb", cost: 9120 }, { month: "Mar", cost: 9340 },
  { month: "Apr", cost: 9340 }, { month: "May", cost: 9590 }, { month: "Jun", cost: 9590 },
];

const HR_POSITIONS = [
  { id: "POS-01", title: "French Teacher",     department: "Languages",     type: "Full-time", applicants: 6, status: "Open" },
  { id: "POS-02", title: "Lab Technician",     department: "Sciences",      type: "Full-time", applicants: 3, status: "Open" },
  { id: "POS-03", title: "Sports Coordinator", department: "Support Staff", type: "Part-time", applicants: 4, status: "Closed" },
];

const HR_APPLICANTS = [
  { name: "Grace Tafara",   position: "French Teacher",     stage: "Applied"   },
  { name: "Michael Osei",   position: "French Teacher",     stage: "Interview" },
  { name: "Ruth Chivasa",   position: "Lab Technician",     stage: "Interview" },
  { name: "Joseph Mhlanga", position: "French Teacher",     stage: "Offer"     },
  { name: "Anita Ndoro",    position: "Sports Coordinator", stage: "Hired"     },
];

const EMPTY_STAFF_FORM = { name: "", role: "", department: "Administration", type: "Full-time", joined: "", salary: "", status: "Active", phone: "", email: "" };

/* ─── helpers ────────────────────────────────────────────────────────────── */
function computePayroll(staffList) {
  return staffList.map((s) => {
    const basic = Number(s.salary) || 0;
    const allowances = Math.round(basic * 0.12);
    const gross = basic + allowances;
    const paye = Math.round(gross * 0.18);
    const pension = Math.round(basic * 0.05);
    return { ...s, basic, allowances, gross, paye, pension, net: gross - paye - pension };
  });
}

function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <Icon size={38} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

/* ─── Staff detail modal ─────────────────────────────────────────────────── */
function StaffDetailModal({ staff, payroll, onClose }) {
  const [tab, setTab] = useState("contract");
  if (!staff) return null;
  const pay = payroll.find((p) => p.id === staff.id);
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
        <Tag active={tab === "payroll"}  onClick={() => setTab("payroll")}>Payroll</Tag>
      </div>
      {tab === "contract" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[["Employee ID", staff.id], ["Type", staff.type], ["Department", staff.department], ["Date Joined", staff.joined || "—"], ["Monthly Basic", fmtMoney(staff.salary)]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase" }}>{k}</div>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginTop: 3 }}>{v}</div>
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 16, marginTop: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Phone size={13} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{staff.phone || "—"}</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={13} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{staff.email || "—"}</span></div>
          </div>
        </div>
      )}
      {tab === "payroll" && (
        pay ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[["Basic Salary", pay.basic], ["Allowances (12%)", pay.allowances], ["Gross Pay", pay.gross], ["PAYE Tax", -pay.paye], ["Pension/NSSA", -pay.pension]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                <span style={{ color: C.textMuted }}>{k}</span>
                <span style={{ color: v < 0 ? C.red : C.text, fontWeight: 600 }}>{v < 0 ? "−" : ""}{fmtMoney(Math.abs(v))}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, paddingTop: 10 }}>
              <span style={{ color: C.text, fontWeight: 700 }}>Net Pay</span>
              <span style={{ color: C.green, fontWeight: 700 }}>{fmtMoney(pay.net)}</span>
            </div>
          </div>
        ) : <div style={{ fontSize: 13, color: C.textMuted }}>No salary on record for this staff member.</div>
      )}
    </Modal>
  );
}

/* ─── Admin view ─────────────────────────────────────────────────────────── */
function HRAdminView({ staff, setStaff, loading }) {
  const [tab,            setTab]           = useState("staff");
  const [query,          setQuery]         = useState("");
  const [deptFilter,     setDeptFilter]    = useState("All");
  const [selectedStaff,  setSelectedStaff] = useState(null);
  const [leave,          setLeave]         = useState(HR_LEAVE_REQUESTS_INIT);

  /* staff modal */
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(EMPTY_STAFF_FORM);
  const [saving,  setSaving]  = useState(false);

  /* confirm delete */
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const payroll      = computePayroll(staff);
  const filteredStaff = staff.filter((s) =>
    (deptFilter === "All" || s.department === deptFilter) &&
    s.name.toLowerCase().includes(query.toLowerCase())
  );
  const totalGross     = payroll.reduce((s, p) => s + p.gross, 0);
  const totalNet       = payroll.reduce((s, p) => s + p.net,   0);
  const pendingLeave   = leave.filter((l) => l.status === "Pending").length;
  const recruitStages  = ["Applied", "Interview", "Offer", "Hired"];

  /* ---- CRUD ---- */
  function openAdd()      { setForm(EMPTY_STAFF_FORM); setModal({ mode: "add" }); }
  function openEdit(s)    { setForm({ name: s.name, role: s.role, department: s.department, type: s.type, joined: s.joined || "", salary: String(s.salary || ""), status: s.status, phone: s.phone || "", email: s.email || "" }); setModal({ mode: "edit", data: s }); }

  function saveStaff() {
    if (!form.name.trim() || !form.role.trim()) return;
    setSaving(true);
    const payload = { name: form.name, role: form.role, department: form.department, type: form.type, joined: form.joined, salary: Number(form.salary) || 0, status: form.status, phone: form.phone, email: form.email };

    if (modal.mode === "edit") {
      const id = modal.data.id;
      if (isSupabaseConfigured) {
        supabase.from("staff").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Staff update error:", error.message);
          setStaff((arr) => arr.map((s) => s.id === id ? { ...s, ...payload } : s));
          setSaving(false); setModal(null);
        });
      } else {
        setStaff((arr) => arr.map((s) => s.id === id ? { ...s, ...payload } : s));
        setSaving(false); setModal(null);
      }
    } else {
      const newId = `EMP-${String(staff.length + 1).padStart(3, "0")}`;
      const row = { id: newId, ...payload };
      if (isSupabaseConfigured) {
        supabase.from("staff").insert(row).select().single().then(({ data, error }) => {
          if (error) console.warn("Staff insert error:", error.message);
          setStaff((arr) => [...arr, data || row]);
          setSaving(false); setModal(null); setForm(EMPTY_STAFF_FORM);
        });
      } else {
        setStaff((arr) => [...arr, row]);
        setSaving(false); setModal(null); setForm(EMPTY_STAFF_FORM);
      }
    }
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("staff").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setStaff((arr) => arr.filter((s) => s.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setStaff((arr) => arr.filter((s) => s.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  function decideLeave(id, decision) {
    setLeave((arr) => arr.map((l) => l.id === id ? { ...l, status: decision } : l));
  }

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Users}       label="Total Staff"       value={staff.length}                                               tone="indigo" />
        <StatCard icon={DollarSign}  label="Monthly Payroll"   value={fmtMoney(totalGross)}                                       tone="green"  />
        <StatCard icon={CalendarDays}label="Pending Leave"     value={pendingLeave}                                               tone="amber"  />
        <StatCard icon={Briefcase}   label="Open Positions"    value={HR_POSITIONS.filter((p) => p.status === "Open").length}     tone="cyan"   />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "staff"}       onClick={() => setTab("staff")}>Staff Directory</Tag>
        <Tag active={tab === "payroll"}     onClick={() => setTab("payroll")}>Payroll</Tag>
        <Tag active={tab === "leave"}       onClick={() => setTab("leave")}>Leave Requests</Tag>
        <Tag active={tab === "recruitment"} onClick={() => setTab("recruitment")}>Recruitment</Tag>
      </div>

      {/* ── STAFF DIRECTORY ── */}
      {tab === "staff" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 180 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
            <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13 }}>
              <option>All</option>
              {HR_DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <UserPlus size={14} /> Add Staff
            </button>
          </div>

          {loading ? null : filteredStaff.length === 0 ? (
            <EmptyState icon={Users}
              message={staff.length === 0 ? "No staff members added yet." : "No staff match your search."}
              hint={staff.length === 0 ? 'Click "Add Staff" to register the first staff member.' : undefined}
            />
          ) : (
            <Table
              onRowClick={setSelectedStaff}
              columns={[
                { key: "name",       label: "Name",       render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.role}</div></div></div> },
                { key: "id",         label: "EMP ID",     render: (r) => <span style={monoFont}>{r.id}</span> },
                { key: "department", label: "Department" },
                { key: "type",       label: "Type",       render: (r) => <Pill tone="slate">{r.type}</Pill> },
                { key: "salary",     label: "Basic (USD)",render: (r) => fmtMoney(r.salary || 0) },
                { key: "status",     label: "Status",     render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
                { key: "actions",    label: "",           render: (r) => (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={iconBtn(C.textMuted)} onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil size={14} /></button>
                    <button style={iconBtn(C.red)}       onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: r.id, label: r.name }); }}><Trash2 size={14} /></button>
                  </div>
                ) },
              ]}
              rows={filteredStaff}
            />
          )}
        </Card>
      )}

      {/* ── PAYROLL ── */}
      {tab === "payroll" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Monthly Payroll Cost Trend" />
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={HR_PAYROLL_TREND}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="month" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="cost" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="This Month's Payroll Run" subtitle={`${payroll.length} staff · Total gross: ${fmtMoney(totalGross)} · Net: ${fmtMoney(totalNet)}`} />
            {payroll.length === 0 ? (
              <EmptyState icon={DollarSign} message="No staff on payroll yet." hint='Add staff in the "Staff Directory" tab first.' />
            ) : (
              <Table
                columns={[
                  { key: "name",       label: "Staff Member" },
                  { key: "basic",      label: "Basic",      render: (r) => fmtMoney(r.basic) },
                  { key: "allowances", label: "Allowances", render: (r) => fmtMoney(r.allowances) },
                  { key: "paye",       label: "PAYE",       render: (r) => <span style={{ color: C.red }}>−{fmtMoney(r.paye)}</span> },
                  { key: "pension",    label: "Pension",    render: (r) => <span style={{ color: C.red }}>−{fmtMoney(r.pension)}</span> },
                  { key: "net",        label: "Net Pay",    render: (r) => <span style={{ color: C.green, fontWeight: 700 }}>{fmtMoney(r.net)}</span> },
                ]}
                rows={payroll}
              />
            )}
          </Card>
        </div>
      )}

      {/* ── LEAVE ── */}
      {tab === "leave" && (
        <Card>
          <SectionHeader title="Leave Requests" subtitle={`${pendingLeave} pending approval`} />
          {leave.length === 0 ? (
            <EmptyState icon={CalendarDays} message="No leave requests." />
          ) : (
            <Table
              columns={[
                { key: "name",   label: "Staff Member" },
                { key: "type",   label: "Leave Type" },
                { key: "from",   label: "From" },
                { key: "to",     label: "To" },
                { key: "days",   label: "Days", render: (r) => `${r.days}d` },
                { key: "reason", label: "Reason" },
                { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "Approved" ? "green" : r.status === "Declined" ? "red" : "amber"}>{r.status}</Pill> },
                { key: "actions", label: "", render: (r) => r.status === "Pending" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => decideLeave(r.id, "Approved")} style={{ background: C.green,   color: "#fff", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", display: "flex", gap: 4, alignItems: "center" }}><Check   size={12} /> Approve</button>
                    <button onClick={() => decideLeave(r.id, "Declined")} style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 10px", fontSize: 12, cursor: "pointer", display: "flex", gap: 4, alignItems: "center" }}><XCircle size={12} /> Decline</button>
                  </div>
                ) : null },
              ]}
              rows={leave}
            />
          )}
        </Card>
      )}

      {/* ── RECRUITMENT ── */}
      {tab === "recruitment" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Open Positions" />
            <Table
              columns={[
                { key: "title",      label: "Position" },
                { key: "department", label: "Department" },
                { key: "type",       label: "Type",        render: (r) => <Pill tone="slate">{r.type}</Pill> },
                { key: "applicants", label: "Applicants",  render: (r) => `${r.applicants} applied` },
                { key: "status",     label: "Status",      render: (r) => <Pill tone={r.status === "Open" ? "green" : "slate"}>{r.status}</Pill> },
              ]}
              rows={HR_POSITIONS}
            />
          </Card>
          <Card>
            <SectionHeader title="Applicant Pipeline" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {recruitStages.map((stage) => (
                <div key={stage}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>{stage}</span>
                    <Pill tone="slate">{HR_APPLICANTS.filter((a) => a.stage === stage).length}</Pill>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {HR_APPLICANTS.filter((a) => a.stage === stage).map((a) => (
                      <Card key={a.name} style={{ padding: 12, background: C.surface2 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, color: C.text }}>{a.name}</div>
                        <div style={{ fontSize: 11, color: C.textFaint, marginTop: 3 }}>{a.position}</div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── STAFF DETAIL MODAL ── */}
      <StaffDetailModal staff={selectedStaff} payroll={payroll} onClose={() => setSelectedStaff(null)} />

      {/* ── ADD / EDIT STAFF MODAL ── */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Staff Member" : "Add New Staff Member"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={L}>Full Name</label>
            <input placeholder="e.g. Mr. J. Mutasa" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={F} />
          </div>
          <div>
            <label style={L}>Job Title / Role</label>
            <input placeholder="e.g. Mathematics Teacher" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} style={F} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Department</label>
              <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} style={F}>
                {HR_DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Employment Type</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} style={F}>
                {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Date Joined</label>
              <input type="date" value={form.joined} onChange={(e) => setForm((f) => ({ ...f, joined: e.target.value }))} style={F} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Monthly Salary (USD)</label>
              <input type="number" placeholder="e.g. 980" value={form.salary} onChange={(e) => setForm((f) => ({ ...f, salary: e.target.value }))} style={F} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Phone</label>
              <input placeholder="+263 77 …" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} style={F} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Email</label>
              <input placeholder="name@springfield.edu" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} style={F} />
            </div>
          </div>
          <button onClick={saveStaff} disabled={saving || !form.name.trim() || !form.role.trim()}
            style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : modal?.mode === "edit" ? "Save Changes" : "Add Staff Member"}
          </button>
        </div>
      </Modal>

      {/* ── CONFIRM DELETE ── */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>
          Permanently remove <strong style={{ color: C.text }}>{confirmDelete?.label}</strong> from staff records? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmAndDelete} disabled={deleting} style={{ flex: 1, background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Removing…" : "Remove Staff"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ─── Self-service (teacher) view ─────────────────────────────────────────── */
function HRSelfServiceView({ staff, currentUser }) {
  const me = staff.find((s) => s.name === currentUser?.full_name) || staff[0];
  if (!me) return (
    <Card>
      <EmptyState icon={Users} message="Your staff profile is not set up yet." hint="Contact the administrator to have your record added." />
    </Card>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={me.name} size={48} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{me.name}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>{me.role} · {me.department}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><Pill tone="green">{me.status}</Pill></div>
      </Card>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={DollarSign}  label="Basic Salary"  value={fmtMoney(me.salary || 0)} tone="green"  />
        <StatCard icon={CalendarDays}label="Annual Leave"  value="21 days"                  tone="indigo" />
        <StatCard icon={Clock}       label="Leave Used"    value="5 days"                   tone="amber"  />
      </div>
    </div>
  );
}

/* ─── Root ───────────────────────────────────────────────────────────────── */
function HRPayrollModule({ role, currentUser }) {
  const [staff,   setStaff]   = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("staff").select("*").order("name").then(({ data, error }) => {
      if (error) console.warn("Staff fetch error:", error.message);
      setStaff(data || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint, marginBottom: 16 }}><Loader2 size={12} className="spin" /> Syncing…</span>}
      {role === "admin"
        ? <HRAdminView staff={staff} setStaff={setStaff} loading={loading} />
        : <HRSelfServiceView staff={staff} currentUser={currentUser} />
      }
    </div>
  );
}

export { HRPayrollModule };