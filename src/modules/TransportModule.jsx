import React, { useState, useEffect } from "react";
import { MapPin, Loader2, Plus, Pencil, Trash2, Bus } from "lucide-react";
import { C, monoFont } from "../lib/theme";
import { Pill, Card, SectionHeader, ProgressBar, Modal, statusTone } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const ROUTE_STATUSES = ["On Route", "At School", "Maintenance"];
const EMPTY_FORM = { id: "", name: "", bus: "", driver: "", capacity: 30, status: "On Route", eta: "—" };

function EmptyState({ message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px" }}>
      <Bus size={38} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function TransportModule({ role }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  /* modal: null | { mode:"add" } | { mode:"edit", data:{...} } */
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]           = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    supabase.from("routes").select("*").order("id").then(({ data, error }) => {
      if (error) console.warn("Routes fetch error:", error.message);
      setRoutes(data || []);
      setLoading(false);
    });
  }, []);

  /* ---- CRUD ---- */
  function openAdd()    { setForm(EMPTY_FORM); setModal({ mode: "add" }); }
  function openEdit(r)  {
    setForm({ id: r.id, name: r.name, bus: r.bus, driver: r.driver, capacity: r.capacity, status: r.status, eta: r.eta || "—" });
    setModal({ mode: "edit", data: r });
  }

  function saveRoute() {
    if (!form.name.trim() || !form.bus.trim()) return;
    setSaving(true);
    const payload = { name: form.name, bus: form.bus, driver: form.driver, capacity: Number(form.capacity), status: form.status, eta: form.eta };

    if (modal.mode === "edit") {
      const id = modal.data.id;
      if (isSupabaseConfigured) {
        supabase.from("routes").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Route update error:", error.message);
          setRoutes((arr) => arr.map((r) => r.id === id ? { ...r, ...payload } : r));
          setSaving(false); setModal(null);
        });
      } else {
        setRoutes((arr) => arr.map((r) => r.id === id ? { ...r, ...payload } : r));
        setSaving(false); setModal(null);
      }
    } else {
      const id = form.id.trim() || `RT-${String(routes.length + 1).padStart(2, "0")}`;
      const row = { id, ...payload, assigned: 0 };
      if (isSupabaseConfigured) {
        supabase.from("routes").insert(row).select().single().then(({ data, error }) => {
          if (error) console.warn("Route insert error:", error.message);
          setRoutes((arr) => [...arr, data || row]);
          setSaving(false); setModal(null); setForm(EMPTY_FORM);
        });
      } else {
        setRoutes((arr) => [...arr, row]);
        setSaving(false); setModal(null); setForm(EMPTY_FORM);
      }
    }
  }

  function confirmAndDelete() {
    setDeleting(true);
    const id = confirmDelete.id;
    if (isSupabaseConfigured) {
      supabase.from("routes").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        setRoutes((arr) => arr.filter((r) => r.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      setRoutes((arr) => arr.filter((r) => r.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  const isAdmin = role === "admin";
  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}

      <Card>
        <SectionHeader
          title="Bus Routes"
          subtitle="All active school transport routes"
          action={isAdmin && (
            <button onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Route
            </button>
          )}
        />

        {loading ? null : routes.length === 0 ? (
          <EmptyState
            message="No routes added yet."
            hint={isAdmin ? 'Click "Add Route" to register the first bus route.' : "No transport routes on record."}
          />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginTop: 4 }}>
            {routes.map((r) => (
              <Card key={r.id} style={{ background: C.surface2, position: "relative" }}>
                {isAdmin && (
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", gap: 4 }}>
                    <button style={iconBtn(C.textMuted)} onClick={() => openEdit(r)}><Pencil size={13} /></button>
                    <button style={iconBtn(C.red)}       onClick={() => setConfirmDelete({ id: r.id, label: r.name })}><Trash2 size={13} /></button>
                  </div>
                )}
                <div style={{ paddingRight: isAdmin ? 52 : 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{r.bus} · {r.driver}</div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <Pill tone={statusTone(r.status)}>{r.status}</Pill>
                </div>
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: C.textMuted, marginBottom: 4 }}>
                    <span>Capacity</span><span>{r.assigned}/{r.capacity}</span>
                  </div>
                  <ProgressBar value={(r.assigned / r.capacity) * 100} tone="cyan" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, fontSize: 12, color: C.textMuted }}>
                  <MapPin size={13} /> ETA: {r.eta}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {routes.length > 0 && (
        <Card>
          <SectionHeader title="Live Route Map" subtitle="Approximate positions" />
          <svg viewBox="0 0 600 160" width="100%" height="160">
            <line x1="20" y1="80" x2="580" y2="80" stroke={C.border} strokeWidth="3" strokeDasharray="2 6" />
            {routes.map((r, i) => {
              const x = r.status === "At School" ? 560 : r.status === "Maintenance" ? 40 : 180 + i * 110;
              const color = r.status === "On Route" ? C.cyan : r.status === "At School" ? C.green : C.red;
              return (
                <g key={r.id}>
                  <circle cx={x} cy="80" r="9" fill={color} />
                  <text x={x} y="62" textAnchor="middle" fontSize="11" fill={C.textMuted}>{r.bus}</text>
                </g>
              );
            })}
            <rect x="540" y="40" width="50" height="80" rx="8" fill="none" stroke={C.border} />
            <text x="565" y="135" textAnchor="middle" fontSize="10" fill={C.textFaint}>School</text>
          </svg>
        </Card>
      )}

      {/* ---- ADD / EDIT MODAL ---- */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.mode === "edit" ? "Edit Route" : "Add New Route"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {modal?.mode === "add" && (
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={L}>Route ID (optional)</label>
                <input placeholder="e.g. RT-04" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} style={F} />
              </div>
              <div style={{ flex: 2 }}>
                <label style={L}>Route Name</label>
                <input placeholder="e.g. Eastlea — Highlands Loop" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={F} />
              </div>
            </div>
          )}
          {modal?.mode === "edit" && (
            <div>
              <label style={L}>Route Name</label>
              <input placeholder="e.g. Eastlea — Highlands Loop" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={F} />
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Bus Registration</label>
              <input placeholder="e.g. AEZ 5521" value={form.bus} onChange={(e) => setForm((f) => ({ ...f, bus: e.target.value }))} style={F} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>Capacity</label>
              <input type="number" min="1" value={form.capacity} onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))} style={F} />
            </div>
          </div>
          <div>
            <label style={L}>Driver</label>
            <input placeholder="e.g. Mr. T. Chikwanda" value={form.driver} onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))} style={F} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={L}>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} style={F}>
                {ROUTE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={L}>ETA</label>
              <input placeholder="e.g. 7:45 AM" value={form.eta} onChange={(e) => setForm((f) => ({ ...f, eta: e.target.value }))} style={F} />
            </div>
          </div>
          <button onClick={saveRoute} disabled={saving || !form.name.trim() || !form.bus.trim()}
            style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? <><Loader2 size={14} className="spin" /> Saving…</> : modal?.mode === "edit" ? "Save Changes" : "Add Route"}
          </button>
        </div>
      </Modal>

      {/* ---- CONFIRM DELETE ---- */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirm Delete">
        <p style={{ fontSize: 13.5, color: C.textMuted, marginBottom: 20 }}>
          Permanently delete route <strong style={{ color: C.text }}>{confirmDelete?.label}</strong>? This cannot be undone.
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

export { TransportModule };