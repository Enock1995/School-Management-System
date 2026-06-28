import React, { useState, useEffect } from "react";
import {
  FileText, Award, Mail, FolderOpen, Search, Plus, PenTool, Clock,
  Download, FileCheck2, Send, Loader2
} from "lucide-react";
import { C, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Avatar, Tag, Table, Modal, statusTone } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const STUDENT_NAMES = ["Tadiwa Mhofu", "Anesu Chitate", "Liam Osei", "Rutendo Marecha", "Brian Mutasa", "Chiedza Goredema", "Natasha Sibanda", "Tinotenda Chigumba", "Maria Fernandez"];

const MOCK_DOCUMENTS = [
  { id: 1, title: "Certificate of Academic Excellence — Term 1 2026", type: "Certificate", student: "Natasha Sibanda", issuedDate: "2026-04-10", status: "Issued", issuedBy: "Mrs. Patience Mhike", signatureRequired: true },
  { id: 2, title: "Admission Confirmation Letter", type: "Letter", student: "Joseph Mangwana", issuedDate: "2026-06-05", status: "Signed", issuedBy: "Mrs. Patience Mhike", signatureRequired: true },
  { id: 3, title: "Fee Clearance Letter", type: "Letter", student: "Tadiwa Mhofu", issuedDate: "2026-06-15", status: "Pending Signature", issuedBy: "Ms. Lisa Marufu", signatureRequired: true },
  { id: 4, title: "Mid-Term Report Card — Form 4A", type: "Report", student: "Tadiwa Mhofu", issuedDate: "2026-06-20", status: "Issued", issuedBy: "Mr. T. Moyo", signatureRequired: false },
  { id: 5, title: "Recommendation Letter — University Application", type: "Letter", student: "Tinotenda Chigumba", issuedDate: "2026-06-18", status: "Draft", issuedBy: "Mrs. R. Chikore", signatureRequired: true },
  { id: 6, title: "Certificate of Sports Achievement — Football", type: "Certificate", student: "Tinotenda Chigumba", issuedDate: "2026-06-14", status: "Issued", issuedBy: "Mr. D. Banda", signatureRequired: true },
  { id: 7, title: "Transfer Letter", type: "Letter", student: "—", issuedDate: "2026-05-20", status: "Draft", issuedBy: "Mrs. Patience Mhike", signatureRequired: true },
  { id: 8, title: "School Leaving Certificate", type: "Certificate", student: "—", issuedDate: "2026-01-15", status: "Signed", issuedBy: "Mrs. Patience Mhike", signatureRequired: true },
];

const CERTIFICATE_TYPES = ["Certificate of Completion", "Certificate of Merit", "Academic Excellence Award", "Sports Achievement Certificate", "School Leaving Certificate"];

const LETTER_TEMPLATES = [
  { id: "LT1", name: "Admission Confirmation", description: "Confirms a student's offer of admission for a given term and class." },
  { id: "LT2", name: "Recommendation Letter", description: "General-purpose reference letter for university or scholarship applications." },
  { id: "LT3", name: "Transfer Letter", description: "Issued when a student transfers to another institution." },
  { id: "LT4", name: "Fee Clearance Letter", description: "Confirms a student's fee account is fully settled." },
  { id: "LT5", name: "Disciplinary Notice", description: "Formal notice sent to parents regarding a disciplinary matter." },
];

const SIGNED_AUDIT_LOG = [
  { document: "Admission Confirmation Letter — Joseph Mangwana", signedBy: "Mrs. Patience Mhike", date: "2026-06-06" },
  { document: "School Leaving Certificate — Grace Mupanduki", signedBy: "Mrs. Patience Mhike", date: "2026-01-16" },
  { document: "Certificate of Academic Excellence — Natasha Sibanda", signedBy: "Mrs. Patience Mhike", date: "2026-04-11" },
];

// Supabase columns are issued_date, issued_by, signature_required (snake_case); normalize for the UI.
function normalizeDoc(row) {
  return {
    ...row,
    issuedDate: row.issuedDate ?? row.issued_date,
    issuedBy: row.issuedBy ?? row.issued_by,
    signatureRequired: row.signatureRequired ?? row.signature_required,
  };
}

/* ============================== DOCUMENT PREVIEW MODAL ============================== */
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
            <div style={{ fontSize: 13.5, color: C.text, fontWeight: 600, marginTop: 3 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 18 }}><Pill tone={statusTone(doc.status)}>{doc.status}</Pill></div>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigoSoft, color: C.indigo, border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          <Download size={15} /> Download PDF
        </button>
        {doc.status === "Pending Signature" && canSign && (
          <button onClick={() => onSign(doc.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
            <PenTool size={15} /> Sign Document
          </button>
        )}
      </div>
    </Modal>
  );
}

function GenerateCertModal({ open, onClose, onSubmit }) {
  const [student, setStudent] = useState(STUDENT_NAMES[0]);
  const [certType, setCertType] = useState(CERTIFICATE_TYPES[0]);
  return (
    <Modal open={open} onClose={onClose} title="Generate Certificate">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Student</div>
          <select value={student} onChange={(e) => setStudent(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
            {STUDENT_NAMES.map((n) => <option key={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Certificate Type</div>
          <select value={certType} onChange={(e) => setCertType(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
            {CERTIFICATE_TYPES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => onSubmit({ student, certType })} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          <Award size={15} /> Generate Certificate
        </button>
      </div>
    </Modal>
  );
}

function ComposeLetterModal({ open, onClose, onSubmit }) {
  const [recipient, setRecipient] = useState("");
  const [template, setTemplate] = useState(LETTER_TEMPLATES[0].name);
  return (
    <Modal open={open} onClose={onClose} title="Compose Letter">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Recipient / Student</div>
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Tadiwa Mhofu" style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }} />
        </div>
        <div>
          <div style={{ fontSize: 11.5, color: C.textFaint, marginBottom: 6, textTransform: "uppercase" }}>Template</div>
          <select value={template} onChange={(e) => setTemplate(e.target.value)} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13.5 }}>
            {LETTER_TEMPLATES.map((t) => <option key={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button onClick={() => recipient.trim() && onSubmit({ recipient, template })} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}>
          <Send size={15} /> Generate Letter (Draft)
        </button>
      </div>
    </Modal>
  );
}

/* ============================== ADMIN VIEW ============================== */
function DocumentsAdminView({ docs, setDocs, loading, usingLiveData }) {
  const [tab, setTab] = useState("library");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [letterModalOpen, setLetterModalOpen] = useState(false);

  const filtered = docs.filter((d) => (typeFilter === "All" || d.type === typeFilter) && d.title.toLowerCase().includes(query.toLowerCase()));
  const pendingSignatures = docs.filter((d) => d.status === "Pending Signature");

  function signDoc(id) {
    setDocs((arr) => arr.map((d) => (d.id === id ? { ...d, status: "Signed" } : d)));
    setSelectedDoc(null);
    if (isSupabaseConfigured) {
      supabase.from("documents").update({ status: "Signed" }).eq("id", id).then(({ error }) => {
        if (error) console.warn("Could not persist signature:", error.message);
      });
    }
  }

  function createDocument(newRow) {
    if (isSupabaseConfigured) {
      supabase.from("documents").insert({
        title: newRow.title, type: newRow.type, student: newRow.student, issued_date: newRow.issuedDate,
        status: newRow.status, issued_by: newRow.issuedBy, signature_required: newRow.signatureRequired,
      }).select().single().then(({ data: inserted, error }) => {
        if (error) {
          console.warn("Could not save document, keeping local only:", error.message);
          setDocs((arr) => [{ id: Date.now(), ...newRow }, ...arr]);
        } else {
          setDocs((arr) => [normalizeDoc(inserted), ...arr]);
        }
      });
    } else {
      setDocs((arr) => [{ id: Date.now(), ...newRow }, ...arr]);
    }
  }

  function addCertificate({ student, certType }) {
    createDocument({ title: `${certType} — ${student}`, type: "Certificate", student, issuedDate: new Date().toISOString().slice(0, 10), status: "Pending Signature", issuedBy: "Mrs. Patience Mhike", signatureRequired: true });
    setCertModalOpen(false);
  }

  function addLetter({ recipient, template }) {
    createDocument({ title: `${template} — ${recipient}`, type: "Letter", student: recipient, issuedDate: new Date().toISOString().slice(0, 10), status: "Draft", issuedBy: "Mrs. Patience Mhike", signatureRequired: true });
    setLetterModalOpen(false);
  }

  return (
    <div>
      {(loading || usingLiveData) && (
        <div style={{ marginBottom: 16 }}>
          {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing live data…</span>}
          {usingLiveData && <Pill tone="green">Live data</Pill>}
        </div>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={FolderOpen} label="Total Documents" value={docs.length} tone="indigo" />
        <StatCard icon={Award} label="Certificates Issued" value={docs.filter((d) => d.type === "Certificate").length} tone="green" />
        <StatCard icon={Clock} label="Pending Signature" value={pendingSignatures.length} tone="amber" />
        <StatCard icon={Mail} label="Letters on File" value={docs.filter((d) => d.type === "Letter").length} tone="cyan" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "library"} onClick={() => setTab("library")}>Document Library</Tag>
        <Tag active={tab === "certs"} onClick={() => setTab("certs")}>Certificate Generator</Tag>
        <Tag active={tab === "letters"} onClick={() => setTab("letters")}>Letters & Templates</Tag>
        <Tag active={tab === "signatures"} onClick={() => setTab("signatures")}>Digital Signatures</Tag>
      </div>

      {tab === "library" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 200 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13 }}>
              <option>All</option>
              <option>Certificate</option><option>Letter</option><option>Report</option><option>Record</option>
            </select>
          </div>
          <Table
            onRowClick={setSelectedDoc}
            columns={[
              { key: "title", label: "Document" },
              { key: "type", label: "Type", render: (r) => <Pill tone="slate">{r.type}</Pill> },
              { key: "student", label: "Student" },
              { key: "issuedDate", label: "Date" },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={filtered}
          />
        </Card>
      )}

      {tab === "certs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Award size={18} color={C.cyan} />
              <span style={{ fontSize: 13.5, color: C.text }}>Generate a new certificate for any student — it's created as a draft awaiting signature.</span>
            </div>
            <button onClick={() => setCertModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              <Plus size={14} /> Generate Certificate
            </button>
          </Card>
          <Card>
            <SectionHeader title="Recent Certificates" />
            <Table columns={[{ key: "title", label: "Certificate" }, { key: "student", label: "Student" }, { key: "issuedDate", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={docs.filter((d) => d.type === "Certificate")} />
          </Card>
        </div>
      )}

      {tab === "letters" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Letter Templates" action={
              <button onClick={() => setLetterModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={14} /> Compose Letter
              </button>
            } />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {LETTER_TEMPLATES.map((t) => (
                <div key={t.id} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Mail size={14} color={C.indigo} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: C.text }}>{t.name}</span>
                  </div>
                  <p style={{ fontSize: 12, color: C.textMuted, margin: 0, lineHeight: 1.45 }}>{t.description}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionHeader title="Recent Letters" />
            <Table columns={[{ key: "title", label: "Letter" }, { key: "issuedDate", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={docs.filter((d) => d.type === "Letter")} />
          </Card>
        </div>
      )}

      {tab === "signatures" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Pending Signature Queue" subtitle="Click a document to review and sign" />
            {pendingSignatures.length > 0 ? (
              <Table
                onRowClick={setSelectedDoc}
                columns={[{ key: "title", label: "Document" }, { key: "student", label: "Student" }, { key: "issuedBy", label: "Prepared By" }, { key: "issuedDate", label: "Date" }]}
                rows={pendingSignatures}
              />
            ) : (
              <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 20 }}>No documents currently awaiting signature.</div>
            )}
          </Card>
          <Card>
            <SectionHeader title="Signature Audit Trail" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {SIGNED_AUDIT_LOG.map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <FileCheck2 size={14} color={C.green} style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12.5, color: C.text }}>{a.document}</div>
                    <div style={{ fontSize: 11, color: C.textFaint }}>Signed by {a.signedBy} · {a.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <DocumentModal doc={selectedDoc} onSign={signDoc} onClose={() => setSelectedDoc(null)} canSign />
      <GenerateCertModal open={certModalOpen} onClose={() => setCertModalOpen(false)} onSubmit={addCertificate} />
      <ComposeLetterModal open={letterModalOpen} onClose={() => setLetterModalOpen(false)} onSubmit={addLetter} />
    </div>
  );
}

/* ============================== TEACHER VIEW ============================== */
function DocumentsTeacherView({ docs, setDocs }) {
  const [letterModalOpen, setLetterModalOpen] = useState(false);
  const myDocs = docs.filter((d) => d.issuedBy === "Mrs. R. Chikore" || d.issuedBy === "Mr. T. Moyo");

  function addLetter({ recipient, template }) {
    const newRow = { title: `${template} — ${recipient}`, type: "Letter", student: recipient, issuedDate: new Date().toISOString().slice(0, 10), status: "Draft", issuedBy: "Mr. T. Moyo", signatureRequired: true };
    if (isSupabaseConfigured) {
      supabase.from("documents").insert({
        title: newRow.title, type: newRow.type, student: newRow.student, issued_date: newRow.issuedDate,
        status: newRow.status, issued_by: newRow.issuedBy, signature_required: newRow.signatureRequired,
      }).select().single().then(({ data: inserted, error }) => {
        if (error) {
          console.warn("Could not save document, keeping local only:", error.message);
          setDocs((arr) => [{ id: Date.now(), ...newRow }, ...arr]);
        } else {
          setDocs((arr) => [normalizeDoc(inserted), ...arr]);
        }
      });
    } else {
      setDocs((arr) => [{ id: Date.now(), ...newRow }, ...arr]);
    }
    setLetterModalOpen(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Mail size={18} color={C.cyan} />
          <span style={{ fontSize: 13.5, color: C.text }}>Need a recommendation letter or report drafted for a student? Start here — it goes to the office for signature.</span>
        </div>
        <button onClick={() => setLetterModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "9px 15px", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
          <Plus size={14} /> Draft a Letter
        </button>
      </Card>
      <Card>
        <SectionHeader title="My Drafted Documents" />
        {myDocs.length > 0 ? (
          <Table columns={[{ key: "title", label: "Document" }, { key: "student", label: "Student" }, { key: "issuedDate", label: "Date" }, { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> }]} rows={myDocs} />
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 20 }}>No documents drafted yet.</div>
        )}
      </Card>
      <ComposeLetterModal open={letterModalOpen} onClose={() => setLetterModalOpen(false)} onSubmit={addLetter} />
    </div>
  );
}

/* ============================== STUDENT / PARENT VIEW ============================== */
function DocumentsPersonalView({ role, docs }) {
  const studentName = "Tadiwa Mhofu";
  const myDocs = docs.filter((d) => d.student === studentName && (d.status === "Issued" || d.status === "Signed"));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <SectionHeader title={role === "parent" ? `${studentName}'s Documents` : "My Documents"} subtitle="Issued certificates, letters and reports" />
        {myDocs.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myDocs.map((d) => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: `1px solid ${C.borderSoft}` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: C.indigoSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <FileText size={16} color={C.indigo} />
                </div>
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
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted, textAlign: "center", padding: 20 }}>No documents issued yet.</div>
        )}
      </Card>
    </div>
  );
}

/* ============================== ROOT (preview wrapper) ============================== */

function DocumentsModule({ role }) {
  const [docs, setDocs] = useState(MOCK_DOCUMENTS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("documents")
      .select("*")
      .order("issued_date", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.warn("Falling back to demo document data:", error.message);
        } else if (data && data.length > 0) {
          setDocs(data.map(normalizeDoc));
          setUsingLiveData(true);
        }
        setLoading(false);
      });
  }, []);

  if (role === "admin") return <DocumentsAdminView docs={docs} setDocs={setDocs} loading={loading} usingLiveData={usingLiveData} />;
  if (role === "teacher") return <DocumentsTeacherView docs={docs} setDocs={setDocs} />;
  return <DocumentsPersonalView role={role} docs={docs} />;
}

export { DocumentsModule };