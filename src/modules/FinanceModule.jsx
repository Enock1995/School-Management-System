import React, { useState, useEffect } from "react";
import {
  Wallet, AlertTriangle, CreditCard, DollarSign, Loader2, Plus, Pencil, Trash2, Receipt
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Table, Modal, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { CLASSES, REVENUE_TREND, FEE_STATUS, PAYMENT_METHODS } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const INVOICE_STATUSES = ["Partial", "Overdue", "Paid"];
const EMPTY_INVOICE = { student: "", cls: "Form 4A", amount: "", paid: "0", due: "", status: "Partial" };

function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <Icon size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function FinanceModule({ role }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(isSupabaseConfigured);

  const [invoiceModal, setInvoiceModal]   = useState(null);
  const [invoiceForm, setInvoiceForm]     = useState(EMPTY_INVOICE);
  const [savingInvoice, setSavingInvoice] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("invoices").select("*").order("id").then(({ data, error }) => {
      if (error) console.warn("Invoice fetch error:", error.message);
      setInvoices(data || []);
      setLoading(false);
    });
  }, []);

  /* ---- aggregates ---- */
  const totalCollected   = invoices.reduce((s, i) => s + Number(i.paid   || 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + Math.max(0, Number(i.amount || 0) - Number(i.paid || 0)), 0);
  const overdueCount     = invoices.filter((i) => i.status === "Overdue").length;
  const avgFee           = invoices.length ? invoices.reduce((s, i) => s + Number(i.amount || 0), 0) / invoices.length : 0;

  /* ---- CRUD ---- */
  function openAdd()     { setInvoiceForm(EMPTY_INVOICE); setInvoiceModal({ mode: "add" }); }
  function openEdit(inv) {
    setInvoiceForm({ student: inv.student, cls: inv.cls, amount: String(inv.amount), paid: String(inv.paid), due: inv.due, status: inv.status });
    setInvoiceModal({ mode: "edit", data: inv });
  }

  function saveInvoice() {
    if (!invoiceForm.student.trim() || !invoiceForm.amount || !invoiceForm.due) return;
    setSavingInvoice(true);
    const payload = { student: invoiceForm.student, cls: invoiceForm.cls, amount: Number(invoiceForm.amount), paid: Number(invoiceForm.paid), due: invoiceForm.due, status: invoiceForm.status };
    if (invoiceModal.mode === "edit") {
      const id = invoiceModal.data.id;
      if (isSupabaseConfigured) {
        supabase.from("invoices").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Invoice update error:", error.message);
          setInvoices((arr) => arr.map((i) => i.id === id ? { ...i, ...payload } : i));
          setSavingInvoice(false); setInvoiceModal(null);
        });
      } else {
        setInvoices((arr) => arr.map((i) => i.id === id ? { ...i, ...payload } : i));
        setSavingInvoice(false); setInvoiceModal(null);
      }
    } else {
      const newId = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, "0")}`;
      const row = { id: newId, ...payload };
      if (isSupabaseConfigured) {
        supabase.from("invoices").insert(row).select().single().then(({ data, error }) => {
          if (error) console.warn("Invoice insert error:", error.message);
          setInvoices((arr) => [...arr, data || row]);
          setSavingInvoice(false); setInvoiceModal(null); setInvoiceForm(EMPTY_INVOICE);
        });
      } else {
        setInvoices((arr) => [...arr, row]);
        setSavingInvoice(false); setInvoiceModal(null); setInvoiceForm(EMPTY_INVOICE);
      }
    }
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("invoices").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setInvoices((arr) => arr.filter((i) => i.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setInvoices((arr) => arr.filter((i) => i.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  /* ---- PARENT VIEW ---- */
  if (role === "parent") {
    const inv = invoices.find((i) => i.student === "Tadiwa Mhofu") || invoices[0];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Loading…</span>}
        {!loading && !inv && <EmptyState icon={Receipt} message="No fee statement found." hint="Contact the school bursar for your fee statement." />}
        {inv && (
          <>
            <Card>
              <SectionHeader title={`Term 2 Fee Statement — ${inv.student}`} />
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Total Due</div>
                  <div style={{ ...displayFont, fontSize: 24, fontWeight: 700, color: C.text }}>{fmtMoney(inv.amount)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Paid</div>
                  <div style={{ ...displayFont, fontSize: 24, fontWeight: 700, color: C.green }}>{fmtMoney(inv.paid)}</div>
                </div>
                <Pill tone={statusTone(inv.status)}>{inv.status}</Pill>
              </div>
              <ProgressBar value={(inv.paid / inv.amount) * 100} tone="green" />
              <button style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
                <CreditCard size={15} /> Pay via EcoCash or Paynow
              </button>
            </Card>
          </>
        )}
      </div>
    );
  }

  /* ---- ADMIN / TEACHER VIEW ---- */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={Wallet}        label="Collected This Term" value={fmtMoney(totalCollected)}   tone="green"  />
        <StatCard icon={AlertTriangle} label="Outstanding"         value={fmtMoney(totalOutstanding)} tone="red"   delta={overdueCount > 0 ? `${overdueCount} overdue` : undefined} deltaTone="red" />
        <StatCard icon={DollarSign}    label="Avg. Fee / Invoice"  value={fmtMoney(avgFee)}           tone="indigo" />
      </div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 280 }}>
          <SectionHeader title="Revenue Forecast" subtitle="Projected vs target" />
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE_TREND}>
              <CartesianGrid stroke={C.borderSoft} vertical={false} />
              <XAxis dataKey="term" stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} />
              <YAxis stroke={C.textFaint} fontSize={11.5} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="target"    stroke={C.textFaint} strokeDasharray="4 4" dot={false} />
              <Line type="monotone" dataKey="collected" stroke={C.cyan} strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ flex: 1, minWidth: 240 }}>
          <SectionHeader title="Fee Status Breakdown" />
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={FEE_STATUS} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {FEE_STATUS.map((f, i) => <Cell key={i} fill={f.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
            {FEE_STATUS.map((f) => (
              <div key={f.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted }}><span style={{ width: 8, height: 8, borderRadius: 99, background: f.color }} />{f.name}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{f.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeader
          title="Invoices"
          action={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {PAYMENT_METHODS.slice(0, 3).map((p) => <Pill key={p.name} tone="cyan">{p.name}</Pill>)}
              {role === "admin" && (
                <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  <Plus size={14} /> New Invoice
                </button>
              )}
            </div>
          }
        />
        {loading ? null : invoices.length === 0 ? (
          <EmptyState icon={Receipt} message="No invoices yet." hint={role === "admin" ? 'Click "New Invoice" to create the first one.' : "No invoices on record."} />
        ) : (
          <Table
            columns={[
              { key: "id",      label: "Invoice",  render: (r) => <span style={monoFont}>{r.id}</span> },
              { key: "student", label: "Student" },
              { key: "cls",     label: "Class" },
              { key: "amount",  label: "Amount",   render: (r) => fmtMoney(r.amount) },
              { key: "paid",    label: "Paid",     render: (r) => fmtMoney(r.paid) },
              { key: "due",     label: "Due Date" },
              { key: "status",  label: "Status",   render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
              ...(role === "admin" ? [{ key: "actions", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={iconBtn(C.textMuted)} onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Pencil size={14} /></button>
                  <button style={iconBtn(C.red)}       onClick={(e) => { e.stopPropagation(); setConfirmDelete({ id: r.id, label: `${r.id} — ${r.student}` }); }}><Trash2 size={14} /></button>
                </div>
              ) }] : []),
            ]}
            rows={invoices}
          />
        )}
      </Card>

      {/* ---- ADD / EDIT MODAL ---- */}
      <Modal open={!!invoiceModal} onClose={() => setInvoiceModal(null)} title={invoiceModal?.mode === "edit" ? "Edit Invoice" : "New Invoice"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 2 }}>
              <label style={L}>Student Name</label>
              <input placeholder="e.g. Tadiwa Mhofu" value={invoiceForm.student} onChange={(e) => setInvoiceForm((f) => ({ ...f, student: e.target.value }))} style={F} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Class</label>
              <select value={invoiceForm.cls} onChange={(e) => setInvoiceForm((f) => ({ ...f, cls: e.target.value }))} style={F}>
                {CLASSES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Total Amount (USD)</label>
              <input type="number" min="0" placeholder="e.g. 1960" value={invoiceForm.amount} onChange={(e) => setInvoiceForm((f) => ({ ...f, amount: e.target.value }))} style={F} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Amount Paid (USD)</label>
              <input type="number" min="0" placeholder="0" value={invoiceForm.paid} onChange={(e) => setInvoiceForm((f) => ({ ...f, paid: e.target.value }))} style={F} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Due Date</label>
              <input type="date" value={invoiceForm.due} onChange={(e) => setInvoiceForm((f) => ({ ...f, due: e.target.value }))} style={F} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Status</label>
              <select value={invoiceForm.status} onChange={(e) => setInvoiceForm((f) => ({ ...f, status: e.target.value }))} style={F}>
                {INVOICE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveInvoice} disabled={savingInvoice || !invoiceForm.student.trim() || !invoiceForm.amount || !invoiceForm.due}
            style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: savingInvoice ? "not-allowed" : "pointer", opacity: savingInvoice ? 0.7 : 1 }}>
            {savingInvoice ? <><Loader2 size={14} className="spin" /> Saving…</> : invoiceModal?.mode === "edit" ? "Save Changes" : "Create Invoice"}
          </button>
        </div>
      </Modal>

      {/* ---- CONFIRM DELETE ---- */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>
          Permanently delete <strong style={{ color: C.text }}>{confirmDelete?.label}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: C.surface2, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={confirmAndDelete} disabled={deleting} style={{ flex: 1, background: C.red, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 13.5, fontWeight: 700, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export { FinanceModule };