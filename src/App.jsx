import React, { useState } from "react";
import {
  Sparkles, Menu, Bell, ChevronDown, LogOut,
  LayoutDashboard, Users, GraduationCap, CalendarCheck, FileText, Wallet,
  MessageSquare, BookMarked, Bus, Briefcase, AlertTriangle, Home,
  HeartPulse, Trophy, Handshake, FolderOpen, FileBarChart, Crown,
  Settings as SettingsIcon
} from "lucide-react";

import { C, FONT_IMPORT, displayFont, bodyFont, ROLE_META } from "./lib/theme";
import { NexusMark } from "./components/ui";

import { LoginScreen } from "./auth/LoginScreen";
import { DashboardModule } from "./modules/DashboardModule";
import { StudentsModule, StudentDetailModal } from "./modules/StudentsModule";
import { AcademicsModule } from "./modules/AcademicsModule";
import { AttendanceModule } from "./modules/AttendanceModule";
import { ExaminationsModule } from "./modules/ExaminationsModule";
import { FinanceModule } from "./modules/FinanceModule";
import { CommunicationModule } from "./modules/CommunicationModule";
import { LibraryModule } from "./modules/LibraryModule";
import { TransportModule } from "./modules/TransportModule";
import { AIHubModule } from "./modules/AIHubModule";
import { HRPayrollModule } from "./modules/HRPayrollModule";
import { DisciplineModule } from "./modules/DisciplineModule";
import { HostelModule } from "./modules/HostelModule";
import { HealthModule } from "./modules/HealthModule";
import { SportsModule } from "./modules/SportsModule";
import { AlumniModule } from "./modules/AlumniModule";
import { DocumentsModule } from "./modules/DocumentsModule";
import { ReportsModule } from "./modules/ReportsModule";
import { SuperAdminModule } from "./modules/SuperAdminModule";
import { SettingsModule } from "./modules/SettingsModule";

/* ============================== NAV CONFIG ============================== */
const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "teacher", "student", "parent"] },
  { key: "students", label: "Students", icon: Users, roles: ["admin", "teacher"] },
  { key: "academics", label: "Academics", icon: GraduationCap, roles: ["admin", "teacher", "student"] },
  { key: "attendance", label: "Attendance", icon: CalendarCheck, roles: ["admin", "teacher", "student", "parent"] },
  { key: "examinations", label: "Examinations", icon: FileText, roles: ["admin", "teacher", "student", "parent"] },
  { key: "finance", label: "Finance", icon: Wallet, roles: ["admin", "parent"] },
  { key: "communication", label: "Communication", icon: MessageSquare, roles: ["admin", "teacher", "student", "parent"] },
  { key: "library", label: "Library", icon: BookMarked, roles: ["admin", "teacher", "student"] },
  { key: "transport", label: "Transport", icon: Bus, roles: ["admin", "parent"] },
  { key: "aihub", label: "AI Hub", icon: Sparkles, roles: ["admin", "teacher", "student", "parent"] },
  { key: "hr", label: "HR & Payroll", icon: Briefcase, roles: ["admin", "teacher"] },
  { key: "discipline", label: "Discipline", icon: AlertTriangle, roles: ["admin", "teacher", "student", "parent"] },
  { key: "hostel", label: "Hostel", icon: Home, roles: ["admin", "student", "parent"] },
  { key: "health", label: "Health", icon: HeartPulse, roles: ["admin", "teacher", "student", "parent"] },
  { key: "sports", label: "Sports & Clubs", icon: Trophy, roles: ["admin", "teacher", "student", "parent"] },
  { key: "alumni", label: "Alumni", icon: Handshake, roles: ["admin", "teacher", "student"] },
  { key: "documents", label: "Documents", icon: FolderOpen, roles: ["admin", "teacher", "student", "parent"] },
  { key: "reports", label: "Reports & Analytics", icon: FileBarChart, roles: ["admin", "teacher"] },
  { key: "superadmin", label: "Super Admin", icon: Crown, roles: ["admin"] },
  { key: "settings", label: "Settings", icon: SettingsIcon, roles: ["admin", "teacher", "student", "parent"] },
];

const MODULE_TITLES = {
  dashboard: ["Dashboard", "Your overview at a glance"],
  students: ["Students", "Directory and admissions pipeline"],
  academics: ["Academics", "Classes, subjects and curriculum"],
  attendance: ["Attendance", "Track and analyze presence"],
  examinations: ["Examinations", "Exams, marks and report cards"],
  finance: ["Finance", "Fees, invoices and forecasting"],
  communication: ["Communication", "Announcements and messaging"],
  library: ["Library", "Catalog and lending"],
  transport: ["Transport", "Routes, buses and live tracking"],
  aihub: ["AI Intelligence Hub", "Predictive insights and assistants"],
  hr: ["HR & Payroll", "Staff, leave, payroll and recruitment"],
  discipline: ["Discipline Management", "Incidents, suspensions and behavior"],
  hostel: ["Hostel Management", "Rooms, boarding records, meals & fees"],
  health: ["Health Management", "Clinic visits, medical records & vaccinations"],
  sports: ["Sports & Clubs", "Teams, fixtures, athlete records & activities"],
  alumni: ["Alumni Management", "Directory, donations, events & mentorship"],
  documents: ["Document Management", "Certificates, letters, reports & signatures"],
  reports: ["Reporting & Analytics", "Academic, financial, attendance & HR reports"],
  superadmin: ["Super Admin Control Panel", "Multi-school management & platform settings"],
  settings: ["Settings", "Profile, users and security"],
};

/* ============================== ROOT APP ============================== */
export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("admin");
  const [activeModule, setActiveModule] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  function handleLogin(profile) {
    setUser(profile);
    setRole(profile.role);
    setActiveModule("dashboard");
  }

  function handleLogout() {
    setUser(null);
    setRoleMenuOpen(false);
  }

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const availableItems = NAV_ITEMS.filter((n) => n.roles.includes(role));
  const isAdmin = user.role === "admin";

  function changeRole(r) {
    setRole(r);
    setRoleMenuOpen(false);
    const stillValid = NAV_ITEMS.find((n) => n.key === activeModule)?.roles.includes(r);
    if (!stillValid) setActiveModule("dashboard");
  }

  const [title, subtitle] = MODULE_TITLES[activeModule];
  const RoleIcon = ROLE_META[role].icon;

  return (
    <div style={{ ...bodyFont, minHeight: "100vh", background: C.bgGrad, color: C.text, display: "flex" }}>
      <style>{`
        ${FONT_IMPORT}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        input::placeholder, textarea::placeholder { color: ${C.textFaint}; }
        select { cursor: pointer; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
        .enx-burger { display: none; cursor: pointer; }
        @media (max-width: 860px) {
          .enx-burger { display: flex !important; }
        }
        @media (max-width: 860px) {
          .enx-sidebar { position: fixed !important; left: 0; top: 0; height: 100vh; z-index: 90; transform: translateX(-100%); transition: transform .25s; }
          .enx-sidebar.open { transform: translateX(0); }
          .enx-main { width: 100% !important; }
        }
      `}</style>

      {/* Sidebar */}
      <div className={`enx-sidebar${mobileNavOpen ? " open" : ""}`} style={{ width: 232, borderRight: `1px solid ${C.border}`, padding: "20px 14px", display: "flex", flexDirection: "column", background: C.bg, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px", marginBottom: 28 }}>
          <NexusMark size={30} />
          <span style={{ ...displayFont, fontWeight: 700, fontSize: 17, color: C.text }}>EduNexus</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}>
          {availableItems.map((item) => {
            const Icon = item.icon;
            const active = activeModule === item.key;
            return (
              <button
                key={item.key}
                onClick={() => { setActiveModule(item.key); setMobileNavOpen(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderRadius: 11,
                  border: "none", cursor: "pointer", textAlign: "left", width: "100%",
                  background: active ? C.indigoSoft : "transparent",
                  color: active ? C.text : C.textMuted,
                }}
              >
                <Icon size={16} color={active ? C.cyan : C.textMuted} />
                <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }}>{item.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ padding: 12, borderRadius: 13, background: C.surface, border: `1px solid ${C.border}`, fontSize: 11.5, color: C.textMuted }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Sparkles size={12} color={C.cyan} />
            <span style={{ fontWeight: 700, color: C.text }}>Springfield Intl.</span>
          </div>
          Cambridge & ZIMSEC · Harare
        </div>
      </div>

      {mobileNavOpen && <div onClick={() => setMobileNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 80 }} />}

      {/* Main */}
      <div className="enx-main" style={{ flex: 1, minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 26px", borderBottom: `1px solid ${C.border}`, gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setMobileNavOpen(true)} style={{ background: "none", border: "none", color: C.text, padding: 0 }} className="enx-burger">
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ ...displayFont, fontSize: 20, fontWeight: 700, margin: 0, color: C.text }}>{title}</h1>
              <p style={{ fontSize: 12.5, color: C.textMuted, margin: "2px 0 0" }}>{subtitle}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button style={{ background: "none", border: "none", color: C.textMuted, position: "relative", cursor: "pointer" }}>
              <Bell size={18} />
              <span style={{ position: "absolute", top: -2, right: -2, width: 7, height: 7, borderRadius: 99, background: C.red }} />
            </button>
            <div style={{ position: "relative" }}>
              <button onClick={() => isAdmin && setRoleMenuOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 9, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "7px 12px", cursor: isAdmin ? "pointer" : "default" }}>
                <div style={{ width: 28, height: 28, borderRadius: 9, background: C.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RoleIcon size={14} color={C.indigo} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{isAdmin ? ROLE_META[role].name : user.full_name}</div>
                  <div style={{ fontSize: 10.5, color: C.textMuted }}>{ROLE_META[role].label}{isAdmin && role !== "admin" ? " (preview)" : ""}</div>
                </div>
                {isAdmin && <ChevronDown size={14} color={C.textMuted} />}
              </button>
              {isAdmin && roleMenuOpen && (
                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 13, padding: 6, width: 210, zIndex: 50, boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
                  <div style={{ fontSize: 10.5, color: C.textFaint, padding: "6px 10px 2px", textTransform: "uppercase" }}>Preview as</div>
                  {Object.entries(ROLE_META).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button key={key} onClick={() => changeRole(key)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 9, border: "none", background: role === key ? C.surfaceHover : "transparent", color: C.text, cursor: "pointer", textAlign: "left" }}>
                        <Icon size={15} color={role === key ? C.cyan : C.textMuted} />
                        <span style={{ fontSize: 13 }}>{meta.label}</span>
                      </button>
                    );
                  })}
                  <div style={{ borderTop: `1px solid ${C.border}`, margin: "6px 2px" }} />
                  <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 9, border: "none", background: "transparent", color: C.red, cursor: "pointer", textAlign: "left" }}>
                    <LogOut size={15} /> <span style={{ fontSize: 13 }}>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
            {!isAdmin && (
              <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.textMuted, fontSize: 12.5, cursor: "pointer" }}>
                <LogOut size={14} /> Sign Out
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: 26, maxWidth: 1280 }}>
          {activeModule === "dashboard" && <DashboardModule role={role} />}
          {activeModule === "students" && <StudentsModule role={role} onSelectStudent={setSelectedStudent} />}
          {activeModule === "academics" && <AcademicsModule role={role} />}
          {activeModule === "attendance" && <AttendanceModule role={role} />}
          {activeModule === "examinations" && <ExaminationsModule role={role} />}
          {activeModule === "finance" && <FinanceModule role={role} />}
          {activeModule === "communication" && <CommunicationModule role={role} />}
          {activeModule === "library" && <LibraryModule role={role} />}
          {activeModule === "transport" && <TransportModule role={role} />}
          {activeModule === "aihub" && <AIHubModule role={role} />}
          {activeModule === "hr" && <HRPayrollModule role={role} />}
          {activeModule === "discipline" && <DisciplineModule role={role} />}
          {activeModule === "hostel" && <HostelModule role={role} />}
          {activeModule === "health" && <HealthModule role={role} />}
          {activeModule === "sports" && <SportsModule role={role} />}
          {activeModule === "alumni" && <AlumniModule role={role} />}
          {activeModule === "documents" && <DocumentsModule role={role} />}
          {activeModule === "reports" && <ReportsModule role={role} />}
          {activeModule === "superadmin" && <SuperAdminModule />}
          {activeModule === "settings" && <SettingsModule role={role} currentUser={user} />}
        </div>
      </div>

      <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </div>
  );
}