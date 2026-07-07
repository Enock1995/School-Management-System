import React, { useState, useEffect } from "react";
import {
  Building2, Users, ShieldAlert, Plus, Pencil, Save, Trash2,
  CheckCircle2, Clock, Monitor, Smartphone, Mail, Loader2
} from "lucide-react";
import { C, displayFont, ROLE_META } from "../lib/theme";
import { Pill, Card, SectionHeader, Avatar, Tag, Table, Modal, Toggle } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const SESSIONS = [
  { device: "Chrome · Windows", icon: Monitor, location: "Harare, ZW", lastActive: "Active now", current: true },
  { device: "Safari · iPhone",  icon: Smartphone, location: "Harare, ZW", lastActive: "2 hours ago", current: false },
];
const ACTIVITY_LOG = [
  { action: "Signed in",                           who: "Mrs. Patience Mhike", time: "Today, 7:42 AM" },
  { action: "Updated fee structure for Form 2A",   who: "Mrs. Patience Mhike", time: "Yesterday, 4:10 PM" },
  { action: "Invited new staff account",            who: "Mrs. Patience Mhike", time: "Jun 17, 11:02 AM" },
];

function roleTone(r) {
  return r === "admin" ? "indigo" : r === "teacher" ? "cyan" : r === "parent" ? "amber" : "green";
}

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <Users size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function SettingsModule({ role, currentUser }) {
  const [tab,            setTab]           = useState("profile");
  const [editingProfile, setEditingProfile]= useState(false);
  const [school, setSchool] = useState({
    name: "Springfield International High School",
    address: "12 Borrowdale Road, Harare, Zimbabwe",
    curriculum: "Cambridge / ZIMSEC",
    email: "info@springfield.edu",
    phone: "+263 24 277 1190",
  });

  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const [inviteOpen,  setInviteOpen]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole,  setInviteRole]  = useState("teacher");

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  const [twoFA, setTwoFA] = useState(true);
  const isAdmin = role === "admin";

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("profiles").select("*").order("created_at").then(({ data, error }) => {
      if (error) console.warn("Profiles fetch error:", error.message);
      setUsers(data || []);
      setLoading(false);
    });
  }, []);

  function changeRole(userId, newRole) {
    setUsers((arr) => arr.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    if (!isSupabaseConfigured) return;
    supabase.from("profiles").update({ role: newRole }).eq("id", userId).then(({ error }) => {
      if (error) console.warn("Role update error:", error.message);
    });
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("profiles").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setUsers((arr) => arr.filter((u) => u.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setUsers((arr) => arr.filter((u) => u.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  /* Invite — sends via Supabase Auth admin invite (requires service role key server-side).
     For now we show a clear message directing admin to Supabase dashboard. */
  function sendInvite() {
    if (!inviteEmail) return;
    setInviteOpen(false);
    setInviteEmail("");
  }

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "profile"}  onClick={() => setTab("profile")}>{isAdmin ? "School Profile" : "My Account"}</Tag>
        {isAdmin && <Tag active={tab === "users"} onClick={() => setTab("users")}>Users & Roles</Tag>}
        <Tag active={tab === "security"} onClick={() => setTab("security")}>Security & Sessions</Tag>
      </div>

      {/* ── SCHOOL PROFILE (admin) / MY ACCOUNT (others) ── */}
      {tab === "profile" && isAdmin && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Building2 size={18} color={C.cyan} />
              <span style={{ ...displayFont, fontWeight: 700, fontSize: 15, color: C.text }}>School Profile</span>
            </div>
            <button
              onClick={() => setEditingProfile((e) => !e)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: editingProfile ? C.green : C.indigoSoft, color: editingProfile ? "#fff" : C.indigo, border: "none", borderRadius: 9, padding: "7px 13px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
            >
              {editingProfile ? <><Save size={13} /> Save</> : <><Pencil size={13} /> Edit</>}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {Object.entries({ name: "School Name", address: "Address", curriculum: "Curriculum", email: "Contact Email", phone: "Phone" }).map(([key, label]) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                {editingProfile
                  ? <input value={school[key]} onChange={(e) => setSchool((s) => ({ ...s, [key]: e.target.value }))} style={F} />
                  : <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{school[key]}</div>
                }
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "profile" && !isAdmin && currentUser && (
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <Avatar name={currentUser.full_name} size={48} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{currentUser.full_name}</div>
              <div style={{ fontSize: 12.5, color: C.textMuted }}>{currentUser.email || "—"}</div>
            </div>
            <div style={{ marginLeft: "auto" }}><Pill tone={roleTone(currentUser.role)}>{ROLE_META[currentUser.role]?.label || currentUser.role}</Pill></div>
          </div>
          <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.6 }}>
            Account details are managed by the school administrator. Contact the school office to update your name, contact details, or class assignment.
          </div>
        </Card>
      )}

      {/* ── USERS & ROLES ── */}
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
          {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Loading users…</span>}
          {!loading && users.length === 0 ? (
            <EmptyState message="No user profiles yet." hint="Users appear here once they sign up via the login screen. Use Supabase Dashboard → Authentication to invite users." />
          ) : (
            <Table
              columns={[
                { key: "full_name", label: "User", render: (r) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <Avatar name={r.full_name} size={28} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.full_name}</div>
                      <div style={{ fontSize: 11, color: C.textFaint }}>{r.class_name || r.role}</div>
                    </div>
                  </div>
                ) },
                { key: "role", label: "Role", render: (r) => (
                  /* Don't allow changing your own role */
                  currentUser && r.id === currentUser.id ? (
                    <Pill tone={roleTone(r.role)}>{ROLE_META[r.role]?.label || r.role}</Pill>
                  ) : (
                    <select
                      value={r.role}
                      onChange={(e) => changeRole(r.id, e.target.value)}
                      style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 9px", color: C.text, fontSize: 12.5, cursor: "pointer" }}
                    >
                      {Object.entries(ROLE_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                    </select>
                  )
                ) },
                { key: "created_at", label: "Joined", render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—" },
                { key: "actions", label: "", render: (r) => (
                  /* Prevent deleting your own account */
                  currentUser && r.id === currentUser.id ? null : (
                    <button style={iconBtn(C.red)} onClick={() => setConfirmDelete({ id: r.id, label: r.full_name })}>
                      <Trash2 size={14} />
                    </button>
                  )
                ) },
              ]}
              rows={users}
            />
          )}
        </Card>
      )}

      {/* ── SECURITY & SESSIONS ── */}
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

      {/* ── INVITE MODAL ── */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a New User">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: 14, background: C.indigoSoft, border: `1px solid ${C.indigo}`, borderRadius: 10, fontSize: 12.5, color: C.indigo, lineHeight: 1.5 }}>
            To invite a new user, go to your <strong>Supabase Dashboard → Authentication → Users → Invite User</strong>. Once they accept the invite and sign up, their profile will appear in this list automatically.
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Role to assign on signup</div>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} style={F}>
              {Object.entries(ROLE_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 12, color: C.textFaint, lineHeight: 1.5 }}>
            After the user signs up, find them in this Users list and set their role to <strong>{ROLE_META[inviteRole]?.label}</strong> using the role dropdown.
          </div>
          <button onClick={() => setInviteOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            <CheckCircle2 size={15} /> Got it
          </button>
        </div>
      </Modal>

      {/* ── CONFIRM DELETE ── */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove User">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>
          Remove <strong style={{ color: C.text }}>{confirmDelete?.label}</strong> from the system? Their Supabase Auth account will remain but they will lose access to EduNexus.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmAndDelete} disabled={deleting} style={{ flex: 1, background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Removing…" : "Remove User"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export { SettingsModule };