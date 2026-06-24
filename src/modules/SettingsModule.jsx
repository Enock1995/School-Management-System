import React, { useState } from "react";
import {
  Building2, Users, ShieldAlert, Plus, Pencil, Save, Trash2, CheckCircle2, Clock, Monitor, Smartphone, Mail
} from "lucide-react";
import { C, displayFont, ROLE_META } from "../lib/theme";
import { Pill, Card, SectionHeader, Avatar, Tag, Table, Modal, ProgressBar, Toggle } from "../components/ui";

const MOCK_USERS = [
  { id: 1, name: "Mrs. Patience Mhike", email: "p.mhike@springfield.edu", role: "admin", status: "Active", lastActive: "Just now" },
  { id: 2, name: "Mr. T. Moyo", email: "t.moyo@springfield.edu", role: "teacher", status: "Active", lastActive: "2 hours ago" },
  { id: 3, name: "Mrs. R. Chikore", email: "r.chikore@springfield.edu", role: "teacher", status: "Active", lastActive: "1 day ago" },
  { id: 4, name: "Mr. C. Mhofu", email: "c.mhofu@gmail.com", role: "parent", status: "Active", lastActive: "3 days ago" },
  { id: 5, name: "Tadiwa Mhofu", email: "tadiwa.m@springfield.edu", role: "student", status: "Active", lastActive: "5 hours ago" },
  { id: 6, name: "Mr. D. Banda", email: "d.banda@springfield.edu", role: "teacher", status: "Invited", lastActive: "—" },
];
const SESSIONS = [
  { device: "Chrome · Windows", icon: Monitor, location: "Harare, ZW", lastActive: "Active now", current: true },
  { device: "Safari · iPhone", icon: Smartphone, location: "Harare, ZW", lastActive: "2 hours ago", current: false },
];
const ACTIVITY_LOG = [
  { action: "Signed in", who: "Mrs. Patience Mhike", time: "Today, 7:42 AM" },
  { action: "Updated fee structure for Form 2A", who: "Mrs. Patience Mhike", time: "Yesterday, 4:10 PM" },
  { action: "Invited new staff account", who: "Mrs. Patience Mhike", time: "Jun 17, 11:02 AM" },
];
function roleTone(r) { return r === "admin" ? "indigo" : r === "teacher" ? "cyan" : r === "parent" ? "amber" : "green"; }

function SettingsModule({ role, currentUser }) {
  const [tab, setTab] = useState("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const [school, setSchool] = useState({ name: "Springfield International High School", address: "12 Borrowdale Road, Harare, Zimbabwe", curriculum: "Cambridge / ZIMSEC", email: "info@springfield.edu", phone: "+263 24 277 1190" });
  const [users, setUsers] = useState(MOCK_USERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("teacher");
  const [twoFA, setTwoFA] = useState(true);
  const isAdmin = role === "admin";

  function sendInvite() {
    if (!inviteEmail) return;
    setUsers((u) => [...u, { id: Date.now(), name: inviteEmail.split("@")[0], email: inviteEmail, role: inviteRole, status: "Invited", lastActive: "—" }]);
    setInviteEmail("");
    setInviteOpen(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "profile"} onClick={() => setTab("profile")}>{isAdmin ? "School Profile" : "My Account"}</Tag>
        {isAdmin && <Tag active={tab === "users"} onClick={() => setTab("users")}>Users & Roles</Tag>}
        <Tag active={tab === "security"} onClick={() => setTab("security")}>Security & Sessions</Tag>
      </div>

      {tab === "profile" && isAdmin && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Building2 size={18} color={C.cyan} />
              <span style={{ ...displayFont, fontWeight: 700, fontSize: 15, color: C.text }}>School Profile</span>
            </div>
            <button onClick={() => setEditingProfile((e) => !e)} style={{ display: "flex", alignItems: "center", gap: 6, background: editingProfile ? C.green : C.indigoSoft, color: editingProfile ? "#fff" : C.indigo, border: "none", borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              {editingProfile ? <><Save size={13} /> Save</> : <><Pencil size={13} /> Edit</>}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {Object.entries({ name: "School Name", address: "Address", curriculum: "Curriculum", email: "Contact Email", phone: "Phone" }).map(([key, label]) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                {editingProfile ? (
                  <input value={school[key]} onChange={(e) => setSchool((s) => ({ ...s, [key]: e.target.value }))} style={{ width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 10px", color: C.text, fontSize: 13.5 }} />
                ) : (
                  <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{school[key]}</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "profile" && !isAdmin && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <Avatar name={currentUser.full_name} size={48} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{currentUser.full_name}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted }}>{currentUser.email}</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>Account details are managed by the school administrator. Contact the school office to update your name, contact details, or class assignment.</div>
        </Card>
      )}

      {tab === "users" && isAdmin && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={18} color={C.cyan} />
              <span style={{ ...displayFont, fontWeight: 700, fontSize: 15, color: C.text }}>Users & Roles</span>
            </div>
            <button onClick={() => setInviteOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={13} /> Invite User
            </button>
          </div>
          <Table
            columns={[
              { key: "name", label: "User", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Avatar name={r.name} size={28} /><div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.email}</div></div></div> },
              { key: "role", label: "Role", render: (r) => <Pill tone={roleTone(r.role)}>{ROLE_META[r.role].label}</Pill> },
              { key: "status", label: "Status", render: (r) => <Pill tone={r.status === "Active" ? "green" : "amber"}>{r.status}</Pill> },
              { key: "lastActive", label: "Last Active" },
              { key: "actions", label: "", render: (r) => <button onClick={() => setUsers((arr) => arr.filter((x) => x.id !== r.id))} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", display: "flex" }}><Trash2 size={14} /></button> },
            ]}
            rows={users}
          />
        </Card>
      )}

      {tab === "security" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <ShieldAlert size={18} color={C.cyan} />
              <span style={{ ...displayFont, fontWeight: 700, fontSize: 15, color: C.text }}>Security</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Require a verification code at sign-in</div>
              </div>
              <Toggle on={twoFA} onChange={setTwoFA} />
            </div>
          </Card>
          <Card>
            <div style={{ ...displayFont, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>Active Sessions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SESSIONS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < SESSIONS.length - 1 ? `1px solid ${C.borderSoft}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Icon size={16} color={C.textMuted} />
                      <div>
                        <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{s.device} {s.current && <Pill tone="green">This device</Pill>}</div>
                        <div style={{ fontSize: 11.5, color: C.textMuted }}>{s.location} · {s.lastActive}</div>
                      </div>
                    </div>
                    {!s.current && <button style={{ background: "none", border: "none", color: C.red, fontSize: 12, cursor: "pointer" }}>Revoke</button>}
                  </div>
                );
              })}
            </div>
          </Card>
          {isAdmin && (
            <Card>
              <div style={{ ...displayFont, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>Recent Activity</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ACTIVITY_LOG.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <Clock size={13} color={C.textFaint} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 12.5, color: C.text }}>{a.action} <span style={{ color: C.textMuted }}>· {a.who}</span></div>
                      <div style={{ fontSize: 11, color: C.textFaint }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a new user">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Email Address</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px" }}>
              <Mail size={14} color={C.textFaint} />
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@school.edu" style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 13.5 }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Role</div>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
              {Object.entries(ROLE_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
            </select>
          </div>
          <button onClick={sendInvite} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
            <CheckCircle2 size={15} /> Send Invite
          </button>
        </div>
      </Modal>
    </div>
  );
}


export { SettingsModule };
