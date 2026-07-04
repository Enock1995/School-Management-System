import React, { useState, useEffect } from "react";
import { Home, Users, Wallet, Search, Plus, Bed, Phone, UserCircle2, Moon, Sun, Coffee, Loader2, Pencil, Trash2 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { C, fmtMoney } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, statusTone } from "../components/ui";
import { CLASSES } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const HOUSES = ["Acacia House", "Baobab House", "Msasa House", "Mopane House"];
const EMPTY_ROOM    = { id: "", house: "Acacia House", capacity: 4, status: "Available" };
const EMPTY_BOARDER = { name: "", cls: "Form 4A", house: "Acacia House", room: "", guardian: "", emergency_phone: "", admitted: "", dietary: "None" };

function normalizeBoarder(r) { return { ...r, emergencyPhone: r.emergencyPhone ?? r.emergency_phone }; }
function normalizeHostelFee(r) { return { ...r, termFee: r.termFee ?? r.term_fee }; }

function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <Icon size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function RoomModal({ room, boarders, onClose }) {
  if (!room) return null;
  const occupants = boarders.filter((b) => b.room === room.id);
  return (
    <Modal open={!!room} onClose={onClose} title={`Room ${room.id} — ${room.house}`}>
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <Pill tone={statusTone(room.status)}>{room.status}</Pill>
        <Pill tone="slate">{room.occupants}/{room.capacity} beds</Pill>
      </div>
      <ProgressBar value={(room.occupants / room.capacity) * 100} tone={room.occupants >= room.capacity ? "red" : "green"} />
      <div style={{ marginTop: 16, fontSize: 12, color: C.textFaint, textTransform: "uppercase", marginBottom: 10 }}>Occupants</div>
      {occupants.length > 0 ? occupants.map((b) => (
        <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar name={b.name} size={30} />
          <div>
            <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{b.name}</div>
            <div style={{ fontSize: 11.5, color: C.textMuted }}>{b.cls}{b.dietary !== "None" ? ` · ${b.dietary}` : ""}</div>
          </div>
        </div>
      )) : <div style={{ fontSize: 13, color: C.textMuted }}>No students assigned.</div>}
    </Modal>
  );
}

function HostelModule({ role }) {
  const [rooms,      setRooms]      = useState([]);
  const [boarders,   setBoarders]   = useState([]);
  const [mealPlan,   setMealPlan]   = useState([]);
  const [hostelFees, setHostelFees] = useState([]);
  const [loading,    setLoading]    = useState(isSupabaseConfigured);

  const [tab,         setTab]        = useState("rooms");
  const [houseFilter, setHouseFilter]= useState("All");
  const [query,       setQuery]      = useState("");
  const [selectedRoom,setSelectedRoom]=useState(null);

  /* room modal */
  const [roomModal,  setRoomModal]  = useState(null);
  const [roomForm,   setRoomForm]   = useState(EMPTY_ROOM);
  const [savingRoom, setSavingRoom] = useState(false);

  /* boarder modal */
  const [boarderModal,  setBoarderModal]  = useState(null);
  const [boarderForm,   setBoarderForm]   = useState(EMPTY_BOARDER);
  const [savingBoarder, setSavingBoarder] = useState(false);

  /* confirm delete */
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("rooms").select("*").order("id"),
      supabase.from("boarders").select("*").order("name"),
      supabase.from("meal_plan").select("*").order("id"),
      supabase.from("hostel_fees").select("*").order("house"),
    ]).then(([rR, bR, mR, fR]) => {
      setRooms(rR.data || []);
      setBoarders((bR.data || []).map(normalizeBoarder));
      setMealPlan(mR.data || []);
      setHostelFees((fR.data || []).map(normalizeHostelFee));
      setLoading(false);
    });
  }, []);

  /* ---- shared styles ---- */
  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });
  const isAdmin = role === "admin";

  /* ---- Room CRUD ---- */
  function openAddRoom()   { setRoomForm(EMPTY_ROOM); setRoomModal({ mode: "add" }); }
  function openEditRoom(r) { setRoomForm({ id: r.id, house: r.house, capacity: r.capacity, status: r.status }); setRoomModal({ mode: "edit", data: r }); }

  function saveRoom() {
    if (!roomForm.id.trim() && roomModal.mode === "add") return;
    setSavingRoom(true);
    const payload = { house: roomForm.house, capacity: Number(roomForm.capacity), status: roomForm.status };
    if (roomModal.mode === "edit") {
      const id = roomModal.data.id;
      if (isSupabaseConfigured) {
        supabase.from("rooms").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Room update error:", error.message);
          setRooms((arr) => arr.map((r) => r.id === id ? { ...r, ...payload } : r));
          setSavingRoom(false); setRoomModal(null);
        });
      } else {
        setRooms((arr) => arr.map((r) => r.id === id ? { ...r, ...payload } : r));
        setSavingRoom(false); setRoomModal(null);
      }
    } else {
      const row = { id: roomForm.id, ...payload, occupants: 0 };
      if (isSupabaseConfigured) {
        supabase.from("rooms").insert(row).select().single().then(({ data, error }) => {
          if (error) console.warn("Room insert error:", error.message);
          setRooms((arr) => [...arr, data || row]);
          setSavingRoom(false); setRoomModal(null); setRoomForm(EMPTY_ROOM);
        });
      } else {
        setRooms((arr) => [...arr, row]);
        setSavingRoom(false); setRoomModal(null); setRoomForm(EMPTY_ROOM);
      }
    }
  }

  /* ---- Boarder CRUD ---- */
  function openAddBoarder()   { setBoarderForm(EMPTY_BOARDER); setBoarderModal({ mode: "add" }); }
  function openEditBoarder(b) { setBoarderForm({ name: b.name, cls: b.cls, house: b.house, room: b.room, guardian: b.guardian, emergency_phone: b.emergencyPhone || "", admitted: b.admitted || "", dietary: b.dietary || "None" }); setBoarderModal({ mode: "edit", data: b }); }

  function saveBoarder() {
    if (!boarderForm.name.trim()) return;
    setSavingBoarder(true);
    const payload = { name: boarderForm.name, cls: boarderForm.cls, house: boarderForm.house, room: boarderForm.room, guardian: boarderForm.guardian, emergency_phone: boarderForm.emergency_phone, admitted: boarderForm.admitted, dietary: boarderForm.dietary, status: "Active" };
    if (boarderModal.mode === "edit") {
      const id = boarderModal.data.id;
      if (isSupabaseConfigured) {
        supabase.from("boarders").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Boarder update error:", error.message);
          setBoarders((arr) => arr.map((b) => b.id === id ? normalizeBoarder({ ...b, ...payload }) : b));
          setSavingBoarder(false); setBoarderModal(null);
        });
      } else {
        setBoarders((arr) => arr.map((b) => b.id === id ? normalizeBoarder({ ...b, ...payload }) : b));
        setSavingBoarder(false); setBoarderModal(null);
      }
    } else {
      if (isSupabaseConfigured) {
        supabase.from("boarders").insert(payload).select().single().then(({ data, error }) => {
          if (error) console.warn("Boarder insert error:", error.message);
          setBoarders((arr) => [...arr, normalizeBoarder(data || payload)]);
          setSavingBoarder(false); setBoarderModal(null); setBoarderForm(EMPTY_BOARDER);
        });
      } else {
        setBoarders((arr) => [...arr, normalizeBoarder({ ...payload, id: Date.now() })]);
        setSavingBoarder(false); setBoarderModal(null); setBoarderForm(EMPTY_BOARDER);
      }
    }
  }

  /* ---- Delete ---- */
  function confirmAndDelete() {
    setDeleting(true);
    const { type, id } = confirmDelete;
    const table = type === "room" ? "rooms" : "boarders";
    if (isSupabaseConfigured) {
      supabase.from(table).delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        if (type === "room") setRooms((arr) => arr.filter((r) => r.id !== id));
        else setBoarders((arr) => arr.filter((b) => b.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      if (type === "room") setRooms((arr) => arr.filter((r) => r.id !== id));
      else setBoarders((arr) => arr.filter((b) => b.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  const filteredRooms    = rooms.filter((r) => houseFilter === "All" || r.house === houseFilter);
  const filteredBoarders = boarders.filter((b) => (houseFilter === "All" || b.house === houseFilter) && b.name.toLowerCase().includes(query.toLowerCase()));
  const roomsForHouse    = rooms.filter((r) => r.house === boarderForm.house && r.status !== "Maintenance");
  const totalCollected   = hostelFees.reduce((s, h) => s + h.collected, 0);
  const totalTarget      = hostelFees.reduce((s, h) => s + h.target, 0);

  /* ---- PERSONAL VIEW (student/parent) ---- */
  if (role !== "admin") {
    const me = boarders[0];
    const todayIndex = new Date().getDay();
    const dayMap = [6, 0, 1, 2, 3, 4, 5];
    const today = mealPlan[dayMap[todayIndex]];
    if (!me) return <Card><EmptyState icon={Bed} message="No boarding record found." hint="Contact the hostel administrator." /></Card>;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Card style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={me.name} size={48} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{me.name}</div>
            <div style={{ fontSize: 12.5, color: C.textMuted }}>{me.house} · Room {me.room}</div>
          </div>
        </Card>
        {today && (
          <Card>
            <SectionHeader title="Today's Meals" subtitle={today.day} />
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {[["Breakfast", today.breakfast, Coffee], ["Lunch", today.lunch, Sun], ["Dinner", today.dinner, Moon]].map(([label, menu, Icon]) => (
                <div key={label} style={{ flex: 1, minWidth: 160, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}><Icon size={14} color={C.cyan} /><span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{label}</span></div>
                  <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>{menu}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  /* ---- ADMIN VIEW ---- */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={Users}  label="Total Boarders"      value={boarders.length}  tone="indigo" />
        <StatCard icon={Bed}    label="Bed Occupancy"        value={`${rooms.reduce((s,r)=>s+r.occupants,0)}/${rooms.reduce((s,r)=>s+r.capacity,0)}`} tone="cyan" />
        <StatCard icon={Home}   label="Boarding Houses"      value={HOUSES.length}    tone="green" />
        <StatCard icon={Wallet} label="Fees Collected"       value={fmtMoney(totalCollected)} tone="amber" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
        <Tag active={tab === "rooms"}    onClick={() => setTab("rooms")}>Rooms</Tag>
        <Tag active={tab === "boarders"} onClick={() => setTab("boarders")}>Boarders</Tag>
        <Tag active={tab === "meals"}    onClick={() => setTab("meals")}>Meal Plan</Tag>
        <Tag active={tab === "fees"}     onClick={() => setTab("fees")}>Fees</Tag>
      </div>

      <select value={houseFilter} onChange={(e) => setHouseFilter(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13, width: "fit-content" }}>
        <option>All</option>{HOUSES.map((h) => <option key={h}>{h}</option>)}
      </select>

      {tab === "rooms" && (
        <Card>
          <SectionHeader title="Room Allocation" action={
            <button onClick={openAddRoom} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Room
            </button>
          } />
          {filteredRooms.length === 0
            ? <EmptyState icon={Bed} message="No rooms added yet." hint='Click "Add Room" to register the first room.' />
            : <Table onRowClick={setSelectedRoom} columns={[
                { key: "id",    label: "Room" },
                { key: "house", label: "House" },
                { key: "occupants", label: "Occupancy", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 70 }}><ProgressBar value={(r.occupants/r.capacity)*100} tone={r.occupants>=r.capacity?"red":"green"} h={6} /></div><span style={{ fontSize: 12 }}>{r.occupants}/{r.capacity}</span></div> },
                { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
                { key: "actions", label: "", render: (r) => <div style={{ display: "flex", gap: 4 }}><button style={iconBtn(C.textMuted)} onClick={(e) => { e.stopPropagation(); openEditRoom(r); }}><Pencil size={14} /></button><button style={iconBtn(C.red)} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "room", id: r.id, label: `Room ${r.id}` }); }}><Trash2 size={14} /></button></div> },
              ]} rows={filteredRooms} />
          }
        </Card>
      )}

      {tab === "boarders" && (
        <Card>
          <SectionHeader title="Boarding Records" action={
            <button onClick={openAddBoarder} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Boarder
            </button>
          } />
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", marginBottom: 16, maxWidth: 280 }}>
            <Search size={14} color={C.textFaint} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search boarders…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
          </div>
          {filteredBoarders.length === 0
            ? <EmptyState icon={Users} message={boarders.length === 0 ? "No boarders registered yet." : "No boarders match your search."} hint={boarders.length === 0 ? 'Click "Add Boarder" to register the first boarder.' : undefined} />
            : <Table columns={[
                { key: "name",          label: "Student",  render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.cls}</div></div></div> },
                { key: "house",         label: "House" },
                { key: "room",          label: "Room" },
                { key: "dietary",       label: "Dietary", render: (r) => r.dietary === "None" ? <span style={{ color: C.textFaint }}>—</span> : <Pill tone="amber">{r.dietary}</Pill> },
                { key: "emergencyPhone",label: "Emergency Phone" },
                { key: "status",        label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
                { key: "actions",       label: "", render: (r) => <div style={{ display: "flex", gap: 4 }}><button style={iconBtn(C.textMuted)} onClick={(e) => { e.stopPropagation(); openEditBoarder(r); }}><Pencil size={14} /></button><button style={iconBtn(C.red)} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "boarder", id: r.id, label: r.name }); }}><Trash2 size={14} /></button></div> },
              ]} rows={filteredBoarders} />
          }
        </Card>
      )}

      {tab === "meals" && (
        <Card>
          <SectionHeader title="Weekly Meal Plan" />
          {mealPlan.length === 0
            ? <EmptyState icon={Coffee} message="No meal plan added yet." />
            : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead><tr>{["Day","Breakfast","Lunch","Dinner"].map((h) => <th key={h} style={{ textAlign:"left", padding:"0 12px 10px", color:C.textFaint, fontSize:11, textTransform:"uppercase", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}</tr></thead>
                <tbody>{mealPlan.map((d) => <tr key={d.day}><td style={{ padding:"10px 12px", color:C.text, fontWeight:600, borderBottom:`1px solid ${C.borderSoft}` }}>{d.day}</td><td style={{ padding:"10px 12px", color:C.textMuted, borderBottom:`1px solid ${C.borderSoft}` }}>{d.breakfast}</td><td style={{ padding:"10px 12px", color:C.textMuted, borderBottom:`1px solid ${C.borderSoft}` }}>{d.lunch}</td><td style={{ padding:"10px 12px", color:C.textMuted, borderBottom:`1px solid ${C.borderSoft}` }}>{d.dinner}</td></tr>)}</tbody>
              </table></div>
          }
        </Card>
      )}

      {tab === "fees" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {hostelFees.length === 0
            ? <Card><EmptyState icon={Wallet} message="No hostel fee data yet." /></Card>
            : <>
                <Card>
                  <SectionHeader title="Collection by House" subtitle="This term (USD)" />
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hostelFees}>
                      <CartesianGrid stroke={C.borderSoft} vertical={false} />
                      <XAxis dataKey="house" stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} width={42} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="target"    name="Target"    fill={C.border} radius={[4,4,0,0]} />
                      <Bar dataKey="collected" name="Collected" fill={C.cyan}   radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <SectionHeader title="Fee Summary" subtitle={`${fmtMoney(totalCollected)} of ${fmtMoney(totalTarget)} collected`} />
                  <Table columns={[
                    { key: "house",     label: "House" },
                    { key: "boarders",  label: "Boarders" },
                    { key: "termFee",   label: "Term Fee",   render: (r) => fmtMoney(r.termFee) },
                    { key: "collected", label: "Collected",  render: (r) => fmtMoney(r.collected) },
                    { key: "progress",  label: "Progress",   render: (r) => <div style={{ display:"flex", alignItems:"center", gap:8 }}><div style={{ width:90 }}><ProgressBar value={(r.collected/r.target)*100} tone={r.collected>=r.target?"green":"amber"} h={6} /></div><span style={{ fontSize:12 }}>{Math.round((r.collected/r.target)*100)}%</span></div> },
                  ]} rows={hostelFees} />
                </Card>
              </>
          }
        </div>
      )}

      <RoomModal room={selectedRoom} boarders={boarders} onClose={() => setSelectedRoom(null)} />

      {/* ── ADD/EDIT ROOM ── */}
      <Modal open={!!roomModal} onClose={() => setRoomModal(null)} title={roomModal?.mode === "edit" ? "Edit Room" : "Add Room"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {roomModal?.mode === "add" && <div><label style={L}>Room ID</label><input placeholder="e.g. A-15" value={roomForm.id} onChange={(e) => setRoomForm((f) => ({ ...f, id: e.target.value }))} style={F} /></div>}
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>House</label><select value={roomForm.house} onChange={(e) => setRoomForm((f) => ({ ...f, house: e.target.value }))} style={F}>{HOUSES.map((h) => <option key={h}>{h}</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={L}>Capacity</label><input type="number" min="1" value={roomForm.capacity} onChange={(e) => setRoomForm((f) => ({ ...f, capacity: e.target.value }))} style={F} /></div>
          </div>
          <div><label style={L}>Status</label><select value={roomForm.status} onChange={(e) => setRoomForm((f) => ({ ...f, status: e.target.value }))} style={F}>{["Available","Full","Maintenance"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <button onClick={saveRoom} disabled={savingRoom || (roomModal?.mode === "add" && !roomForm.id.trim())} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {savingRoom ? <><Loader2 size={14} className="spin" /> Saving…</> : roomModal?.mode === "edit" ? "Save Changes" : "Add Room"}
          </button>
        </div>
      </Modal>

      {/* ── ADD/EDIT BOARDER ── */}
      <Modal open={!!boarderModal} onClose={() => setBoarderModal(null)} title={boarderModal?.mode === "edit" ? "Edit Boarder" : "Add Boarder"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={L}>Student Name</label><input placeholder="Full name" value={boarderForm.name} onChange={(e) => setBoarderForm((f) => ({ ...f, name: e.target.value }))} style={F} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>Class</label><select value={boarderForm.cls} onChange={(e) => setBoarderForm((f) => ({ ...f, cls: e.target.value }))} style={F}>{CLASSES.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={L}>House</label><select value={boarderForm.house} onChange={(e) => setBoarderForm((f) => ({ ...f, house: e.target.value, room: "" }))} style={F}>{HOUSES.map((h) => <option key={h}>{h}</option>)}</select></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>Room</label><select value={boarderForm.room} onChange={(e) => setBoarderForm((f) => ({ ...f, room: e.target.value }))} style={F}><option value="">Select…</option>{roomsForHouse.map((r) => <option key={r.id} value={r.id}>{r.id} ({r.occupants}/{r.capacity})</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={L}>Admission Date</label><input type="date" value={boarderForm.admitted} onChange={(e) => setBoarderForm((f) => ({ ...f, admitted: e.target.value }))} style={F} /></div>
          </div>
          <div><label style={L}>Guardian</label><input placeholder="e.g. Mr. J. Mutasa" value={boarderForm.guardian} onChange={(e) => setBoarderForm((f) => ({ ...f, guardian: e.target.value }))} style={F} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}><label style={L}>Emergency Phone</label><input placeholder="+263 77 …" value={boarderForm.emergency_phone} onChange={(e) => setBoarderForm((f) => ({ ...f, emergency_phone: e.target.value }))} style={F} /></div>
            <div style={{ flex: 1 }}><label style={L}>Dietary Notes</label><input placeholder="None" value={boarderForm.dietary} onChange={(e) => setBoarderForm((f) => ({ ...f, dietary: e.target.value }))} style={F} /></div>
          </div>
          <button onClick={saveBoarder} disabled={savingBoarder || !boarderForm.name.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {savingBoarder ? <><Loader2 size={14} className="spin" /> Saving…</> : boarderModal?.mode === "edit" ? "Save Changes" : "Add Boarder"}
          </button>
        </div>
      </Modal>

      {/* ── CONFIRM DELETE ── */}
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

export { HostelModule };