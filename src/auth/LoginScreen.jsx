import React, { useState } from "react";
import {
  Mail, Lock, Eye, EyeOff, Loader2
} from "lucide-react";
import { C, FONT_IMPORT, displayFont, bodyFont, ROLE_META } from "../lib/theme";
import { NexusMark, Card, Pill } from "../components/ui";

/*
  WIRING TO SUPABASE (once your project is live):
  import { supabase } from "./lib/supabaseClient";
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
    return profile; // { full_name, role, ... }
  }
  Swap the DEMO_MODE block inside LoginScreen's handleLogin() for the call above,
  then remove the quick-role demo buttons.
*/
const DEMO_MODE = true;

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setLoading(true);
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 600));
      setLoading(false);
      onLogin({ role: "admin", full_name: "Mrs. Patience Mhike", email });
    } else {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bgGrad, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, ...bodyFont }}>
      <style>{`${FONT_IMPORT} * { box-sizing: border-box; } input::placeholder { color: ${C.textFaint}; } .spin { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 24 }}>
          <NexusMark size={34} />
          <span style={{ ...displayFont, fontWeight: 700, fontSize: 20, color: C.text }}>EduNexus</span>
        </div>
        <Card>
          <h1 style={{ ...displayFont, fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: C.textMuted, margin: "0 0 20px" }}>Sign in to Springfield International High School</p>
          {DEMO_MODE && <div style={{ marginBottom: 16 }}><Pill tone="amber">Demo Mode — connect Supabase to enable real sign-in</Pill></div>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 11, padding: "11px 13px" }}>
              <Mail size={15} color={C.textFaint} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 13.5 }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 11, padding: "11px 13px" }}>
              <Lock size={15} color={C.textFaint} />
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ flex: 1, background: "none", border: "none", outline: "none", color: C.text, fontSize: 13.5 }} />
              <button onClick={() => setShowPw((s) => !s)} style={{ background: "none", border: "none", color: C.textFaint, cursor: "pointer", display: "flex" }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {error && <div style={{ fontSize: 12.5, color: C.red }}>{error}</div>}
            <button onClick={handleLogin} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 11, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
              {loading ? <Loader2 size={15} className="spin" /> : null} Sign In
            </button>
            <button style={{ background: "none", border: "none", color: C.textMuted, fontSize: 12.5, cursor: "pointer", textAlign: "center" }}>Forgot password?</button>
          </div>
        </Card>
        {DEMO_MODE && (
          <div style={{ marginTop: 18 }}>
            <div style={{ textAlign: "center", fontSize: 11.5, color: C.textFaint, marginBottom: 10 }}>Quick preview as any role</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {Object.entries(ROLE_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button key={key} onClick={() => onLogin({ role: key, full_name: meta.name, email: `${key}@demo.edu` })} style={{ display: "flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.textMuted, fontSize: 12.5, cursor: "pointer" }}>
                    <Icon size={13} /> {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { LoginScreen, DEMO_MODE };
