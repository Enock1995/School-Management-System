import React, { useState, useEffect } from "react";
import {
  FileText, Award, Mail, Search, Plus, PenTool,
  Download, Send, Loader2, Trash2, FolderOpen
} from "lucide-react";
import { C, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Table, Modal, Tag, statusTone } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const DOC_TYPES         = ["Certificate", "Letter", "Report", "Notice"];
const CERTIFICATE_TYPES = ["Certificate of Completion","Certificate of Merit","Academic Excellence Award","Sports Achievement Certificate","School Leaving Certificate"];
const LETTER_TEMPLATES  = ["Admission Confirmation","Recommendation Letter","Transfer Letter","Fee Clearance Letter","Disciplinary Notice"];
const SIGNED_AUDIT_LOG  = [
  { document: "Admission Confirmation Letter", signedBy: "Mrs. Patience Mhike", date: "2026-06-06" },
  { document: "School Leaving Certificate",    signedBy: "Mrs. Patience Mhike", date: "2026-01-16" },
  { document: "Certificate of Academic Excellence", signedBy: "Mrs. Patience Mhike", date: "2026-04-11" },
];

function normalizeDoc(r) {
  return { ...r, issuedDate: r.issuedDate ?? r.issued_date, issuedBy: r.issuedBy ?? r.issued_by, signatureRequired: r.signatureRequired ?? r.signature_required };
}

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <FolderOpen size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

/* ── Document preview modal ── */
function DocumentModal({ doc, onSign, onClose, canSign }) {
  if (!doc) return null;
  return (
    <Modal open={!!doc} onClose={onClose} title="Document Preview" wide>
      <div style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: 24, marginBottom: 18, textAlign: "center" }}>
        <FileText size={26} color={C.cyan} style={{ marginBottom: 10 }} />
        <div style={{ ...displayFont, fontWeight: 700, fontSize: 15, color: C.text }}>{doc.title}</div>
        <div style={{ fontSize: 12.5, color: C.textMuted, marginTop: 4 }}>{doc.student !== "—" ? `Issued to ${doc.student}` : "General document"}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
        {[["Type", doc.type], ["Issued Date", doc.issuedDate], ["Issued By", doc.issuedBy], ["Signature Required", doc.signatureRequired ? "Yes" : "No"]].map(([k, v]) => (
          <div key={k}>
            <div style={{ fontSize: 11, color: C.textFaint, textTransform: "uppercase" }}>{k}</div>
            <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600, marginTop: 3 }}>{String(v)}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 18 }}><Pill tone={statusTone(doc.status)}>{doc.status}</Pill></div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          <Download size={15} /> Download PDF
        </button>
        {doc.status === "Pending Signature" && canSign && (
          <button onClick={() => onSign(doc.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            <PenTool size={15} /> Sign Document
          </button>
        )}
      </div>
    </Modal>
  );
}

/* ── Admin view ── */
function DocumentsAdminView({ docs, setDocs, loading }) {
  const [tab, setTab]             = useState("all");
  const [query, setQuery]         = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [certOpen, setCertOpen]   = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [certForm, setCertForm]   = useState({ student: "", certType: CERTIFICATE_TYPES[0] });
  const [letterForm, setLetterForm] = useState({ recipient: "", template: LETTER_TEMPLATES[0] });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]   = useState(false);

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  const filtered = docs.filter((d) => {
    const matchTab = tab === "all" || d.type === tab.charAt(0).toUpperCase() + tab.slice(1);
    const matchQ   = d.title.toLowerCase().includes(query.toLowerCase()) || d.student.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  function signDoc(id) {
    setDocs((arr) => arr.map((d) => d.id === id ? { ...d, status: "Signed" } : d));
    setSelectedDoc(null);
    if (!isSupabaseConfigured) return;
    supabase.from("documents").update({ status: "Signed" }).eq("id", id).then(({ error }) => { if (error) console.warn("Sign error:", error.message); });
  }

  function insertDoc(payload) {
    if (isSupabaseConfigured) {
      supabase.from("documents").insert(payload).select().single().then(({ data, error }) => {
        if (error) console.warn("Document insert error:", error.message);
        setDocs((arr) => [normalizeDoc(data || { id: Date.now(), ...payload, issuedDate: payload.issued_date, issuedBy: payload.issued_by, signatureRequired: payload.signature_required }), ...arr]);
      });
    } else {
      setDocs((arr) => [{ id: Date.now(), ...payload, issuedDate: payload.issued_date, issuedBy: payload.issued_by, signatureRequired: payload.signature_required }, ...arr]);
    }
  }

  function addCertificate() {
    if (!certForm.student.trim()) return;
    insertDoc({ title: `${certForm.certType} — ${certForm.student}`, type: "Certificate", student: certForm.student, issued_date: new Date().toISOString().slice(0, 10), status: "Draft", issued_by: "Mrs. Patience Mhike", signature_required: true });
    setCertOpen(false); setCertForm({ student: "", certType: CERTIFICATE_TYPES[0] });
  }

  function addLetter() {
    if (!letterForm.recipient.trim()) return;
    insertDoc({ title: `${letterForm.template} — ${letterForm.recipient}`, type: "Letter", student: letterForm.recipient, issued_date: new Date().toISOString().slice(0, 10), status: "Draft", issued_by: "Mrs. Patience Mhike", signature_required: true });
    setLetterOpen(false); setLetterForm({ recipient: "", template: LETTER_TEMPLATES[0] });
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("documents").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setDocs((arr) => arr.filter((d) => d.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setDocs((arr) => arr.filter((d) => d.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={FileText} label="Total Documents"    value={docs.length}                                              tone="indigo" />
        <StatCard icon={PenTool}  label="Pending Signature"  value={docs.filter((d) => d.status === "Pending Signature").length} tone="amber" />
        <StatCard icon={Award}    label="Certificates"       value={docs.filter((d) => d.type === "Certificate").length}       tone="green"  />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all","certificate","letter","report","audit"].map((t) => <Tag key={t} active={tab === t} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}{t === "all" ? "s" : t === "audit" ? " Log" : "s"}</Tag>)}
      </div>

      {tab !== "audit" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 180 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
            <button onClick={() => setCertOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "8px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Award size={14} /> Certificate
            </button>
            <button onClick={() => setLetterOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 13px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Letter
            </button>
          </div>

          {loading ? null : filtered.length === 0 ? (
            <EmptyState message="No documents yet." hint='Use "Certificate" or "Letter" buttons to generate the first document.' />
          ) : (
            <Table
              onRowClick={setSelectedDoc}
              columns={[
                { key: "title",    label: "Document" },
                { key: "type",     label: "Type",    render: (r) => <Pill tone="slate">{r.type}</Pill> },
                { key: "student",  label: "Student" },
                { key: "issuedDate", label: "Date" },
                { key: "issuedBy", label: "Issued By" },
                { key: "status",   label: "Status",  render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
                { key: "actions",  label: "", render: (r) => (
                  <button style={iconBtn(C.red)} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: r.id, label: r.title }); }}><Trash2 size={14} /></button>
                ) },
              ]}
              rows={filtered}
            />
          )}
        </Card>
      )}

      {tab === "audit" && (
        <Card>
          <SectionHeader title="Signature Audit Log" subtitle="All digitally signed documents" />
          {SIGNED_AUDIT_LOG.length === 0
            ? <EmptyState message="No signatures recorded yet." />
            : <Table columns={[{ key: "document", label: "Document" }, { key: "signedBy", label: "Signed By" }, { key: "date", label: "Date" }]} rows={SIGNED_AUDIT_LOG} />
          }
        </Card>
      )}

      <DocumentModal doc={selectedDoc} onSign={signDoc} onClose={() => setSelectedDoc(null)} canSign />

      {/* Generate Certificate */}
      <Modal open={certOpen} onClose={() => setCertOpen(false)} title="Generate Certificate">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={L}>Student Name</label><input placeholder="e.g. Natasha Sibanda" value={certForm.student} onChange={(e) => setCertForm((f) => ({ ...f, student: e.target.value }))} style={F} /></div>
          <div><label style={L}>Certificate Type</label><select value={certForm.certType} onChange={(e) => setCertForm((f) => ({ ...f, certType: e.target.value }))} style={F}>{CERTIFICATE_TYPES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <button onClick={addCertificate} disabled={!certForm.student.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !certForm.student.trim() ? 0.6 : 1 }}>
            <Award size={15} /> Generate Certificate
          </button>
        </div>
      </Modal>

      {/* Compose Letter */}
      <Modal open={letterOpen} onClose={() => setLetterOpen(false)} title="Compose Letter">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={L}>Recipient / Student</label><input placeholder="e.g. Tadiwa Mhofu" value={letterForm.recipient} onChange={(e) => setLetterForm((f) => ({ ...f, recipient: e.target.value }))} style={F} /></div>
          <div><label style={L}>Template</label><select value={letterForm.template} onChange={(e) => setLetterForm((f) => ({ ...f, template: e.target.value }))} style={F}>{LETTER_TEMPLATES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <button onClick={addLetter} disabled={!letterForm.recipient.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !letterForm.recipient.trim() ? 0.6 : 1 }}>
            <Send size={15} /> Generate Letter
          </button>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>Permanently delete <strong style={{ color: C.text }}>{confirmDelete?.label}</strong>? This cannot be undone.</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmAndDelete} disabled={deleting} style={{ flex: 1, background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ── Teacher view ── */
function DocumentsTeacherView({ docs, setDocs }) {
  const [letterOpen, setLetterOpen] = useState(false);
  const [form, setForm] = useState({ recipient: "", template: LETTER_TEMPLATES[0] });
  const myDocs = docs.filter((d) => d.issuedBy === "Mrs. R. Chikore" || d.issuedBy === "Mr. T. Moyo");
  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };

  function addLetter() {
    if (!form.recipient.trim()) return;
    const payload = { title: `${form.template} — ${form.recipient}`, type: "Letter", student: form.recipient, issued_date: new Date().toISOString().slice(0, 10), status: "Draft", issued_by: "Mr. T. Moyo", signature_required: true };
    if (isSupabaseConfigured) {
      supabase.from("documents").insert(payload).select().single().then(({ data, error }) => {
        if (error) console.warn("Document insert error:", error.message);
        setDocs((arr) => [normalizeDoc(data || { id: Date.now(), ...payload, issuedDate: payload.issued_date, issuedBy: payload.issued_by, signatureRequired: payload.signature_required }), ...arr]);
      });
    } else {
      setDocs((arr) => [{ id: Date.now(), ...payload, issuedDate: payload.issued_date, issuedBy: payload.issued_by, signatureRequired: payload.signature_required }, ...arr]);
    }
    setLetterOpen(false); setForm({ recipient: "", template: LETTER_TEMPLATES[0] });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Mail size={18} color={C.cyan} /><span style={{ fontSize: 13.5, color: C.text }}>Need a recommendation letter or report drafted? Start here — it goes to the office for signature.</span></div>
        <button onClick={() => setLetterOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          <Plus size={14} /> Draft a Letter
        </button>
      </Card>
      <Card>
        <SectionHeader title="My Drafted Documents" />
        {myDocs.length === 0
          ? <EmptyState message="No documents drafted yet." />
          : <Table columns={[{ key: "title", label: "Document" }, { key: "student", label: "Student" }, { key: "issuedDate", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myDocs} />
        }
      </Card>
      <Modal open={letterOpen} onClose={() => setLetterOpen(false)} title="Draft a Letter">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={L}>Recipient / Student</label><input placeholder="e.g. Tadiwa Mhofu" value={form.recipient} onChange={(e) => setForm((f) => ({ ...f, recipient: e.target.value }))} style={F} /></div>
          <div><label style={L}>Template</label><select value={form.template} onChange={(e) => setForm((f) => ({ ...f, template: e.target.value }))} style={F}>{LETTER_TEMPLATES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <button onClick={addLetter} disabled={!form.recipient.trim()} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: !form.recipient.trim() ? 0.6 : 1 }}>
            <Send size={15} /> Generate Draft
          </button>
        </div>
      </Modal>
    </div>
  );
}

/* ── Student/Parent view ── */
function DocumentsPersonalView({ role, docs }) {
  const studentName = "Tadiwa Mhofu";
  const myDocs = docs.filter((d) => d.student === studentName && ["Issued","Signed"].includes(d.status));
  return (
    <Card>
      <SectionHeader title={role === "parent" ? `${studentName}'s Documents` : "My Documents"} subtitle="Issued certificates, letters and reports" />
      {myDocs.length === 0
        ? <EmptyState message="No documents issued yet." hint="Documents issued to you by the school will appear here." />
        : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myDocs.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><FileText size={16} color={C.indigo} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600 }}>{d.title}</div>
                  <div style={{ fontSize: 11.5, color: C.textMuted }}>{d.type} · {d.issuedDate}</div>
                </div>
                <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 9, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <Download size={13} /> Download
                </button>
              </div>
            ))}
          </div>
      }
    </Card>
  );
}

/* ── Root ── */
function DocumentsModule({ role }) {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("documents").select("*").order("issued_date", { ascending: false }).then(({ data, error }) => {
      if (error) console.warn("Documents fetch error:", error.message);
      setDocs((data || []).map(normalizeDoc));
      setLoading(false);
    });
  }, []);

  if (role === "admin")   return <DocumentsAdminView docs={docs} setDocs={setDocs} loading={loading} />;
  if (role === "teacher") return <DocumentsTeacherView docs={docs} setDocs={setDocs} />;
  return <DocumentsPersonalView role={role} docs={docs} />;
}

export { DocumentsModule };