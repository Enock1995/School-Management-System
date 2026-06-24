import React, { useState } from "react";
import {
  Home, Users, Wallet, Search, Plus, Bed, Phone, UserCircle2, Moon, Sun, Coffee
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";
import { C, fmtMoney, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Tag, Table, Modal, CustomTooltip, statusTone } from "../components/ui";

const HOUSES = ["Acacia House", "Baobab House", "Msasa House", "Mopane House"];

const ROOMS = [
  { id: "A-12", house: "Acacia House", capacity: 4, occupants: 4, status: "Full" },
  { id: "A-13", house: "Acacia House", capacity: 4, occupants: 3, status: "Available" },
  { id: "A-14", house: "Acacia House", capacity: 4, occupants: 2, status: "Available" },
  { id: "B-04", house: "Baobab House", capacity: 4, occupants: 4, status: "Full" },
  { id: "B-05", house: "Baobab House", capacity: 4, occupants: 0, status: "Maintenance" },
  { id: "M-08", house: "Msasa House", capacity: 3, occupants: 3, status: "Full" },
  { id: "MP-02", house: "Mopane House", capacity: 4, occupants: 3, status: "Available" },
];

const BOARDERS = [
  { name: "Tadiwa Mhofu", cls: "Form 4A", house: "Acacia House", room: "A-12", guardian: "Mr. C. Mhofu", emergencyPhone: "+263 77 412 9981", admitted: "2024-01-15", status: "Active", dietary: "None" },
  { name: "Tinotenda Chigumba", cls: "Form 6A", house: "Acacia House", room: "A-12", guardian: "Mr. E. Chigumba", emergencyPhone: "+263 71 442 9087", admitted: "2022-01-10", status: "Active", dietary: "Lactose intolerant" },
  { name: "Brian Mutasa", cls: "Form 3A", house: "Acacia House", room: "A-12", guardian: "Mr. W. Mutasa", emergencyPhone: "+263 77 334 8821", admitted: "2025-01-20", status: "Active", dietary: "None" },
  { name: "Kudzai Nyamande", cls: "Form 2A", house: "Acacia House", room: "A-12", guardian: "Mr. P. Nyamande", emergencyPhone: "+263 78 667 1290", admitted: "2024-08-01", status: "Active", dietary: "Nut allergy" },
  { name: "Natasha Sibanda", cls: "Form 1A", house: "Baobab House", room: "B-04", guardian: "Mr. G. Sibanda", emergencyPhone: "+263 73 776 5510", admitted: "2026-01-14", status: "Active", dietary: "Vegetarian" },
  { name: "Chiedza Goredema", cls: "Form 5A", house: "Msasa House", room: "M-08", guardian: "Mrs. T. Goredema", emergencyPhone: "+263 73 209 4456", admitted: "2023-01-09", status: "Active", dietary: "None" },
];

const MEAL_PLAN = [
  { day: "Monday", breakfast: "Porridge, eggs, fruit", lunch: "Sadza, beef stew, vegetables", dinner: "Rice, chicken curry, salad" },
  { day: "Tuesday", breakfast: "Bread, peanut butter, milk", lunch: "Pasta, beans, coleslaw", dinner: "Sadza, fish, greens" },
  { day: "Wednesday", breakfast: "Porridge, sausages", lunch: "Sadza, chicken, vegetables", dinner: "Rice, beef stir-fry" },
  { day: "Thursday", breakfast: "Bread, eggs, juice", lunch: "Rice, lentil stew, salad", dinner: "Sadza, beef, greens" },
  { day: "Friday", breakfast: "Porridge, fruit", lunch: "Sadza, fish, vegetables", dinner: "Pizza night" },
  { day: "Saturday", breakfast: "Pancakes, fruit", lunch: "Burgers, chips", dinner: "Rice, chicken, vegetables" },
  { day: "Sunday", breakfast: "Bread, eggs, milk", lunch: "Roast chicken, roast potatoes", dinner: "Light soup, bread rolls" },
];

const HOSTEL_FEES = [
  { house: "Acacia House", boarders: 31, termFee: 420, collected: 11760, target: 13020 },
  { house: "Baobab House", boarders: 28, termFee: 420, collected: 10080, target: 11760 },
  { house: "Msasa House", boarders: 19, termFee: 380, collected: 7220, target: 7220 },
  { house: "Mopane House", boarders: 22, termFee: 380, collected: 7600, target: 8360 },
];

/* ============================== ROOM DETAIL MODAL ============================== */
function RoomModal({ room, onClose }) {
  if (!room) return null;
  const occupants = BOARDERS.filter((b) => b.room === room.id);
  return (
    <Modal open={!!room} onClose={onClose} title={`Room ${room.id} — ${room.house}`} wide>
      <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
        <Pill tone={statusTone(room.status)}>{room.status}</Pill>
        <Pill tone="slate">{room.occupants}/{room.capacity} beds occupied</Pill>
      </div>
      <ProgressBar value={(room.occupants / room.capacity) * 100} tone={room.occupants >= room.capacity ? "red" : "green"} />
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 12, color: C.textFaint, textTransform: "uppercase", marginBottom: 10 }}>Occupants</div>
        {occupants.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {occupants.map((b) => (
              <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={b.name} size={30} />
                <div>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 11.5, color: C.textMuted }}>{b.cls}{b.dietary !== "None" ? ` · ${b.dietary}` : ""}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.textMuted }}>No students currently assigned.</div>
        )}
      </div>
    </Modal>
  );
}

/* ============================== ADMIN / HOSTEL MASTER VIEW ============================== */
function HostelAdminView() {
  const [tab, setTab] = useState("rooms");
  const [houseFilter, setHouseFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);

  const filteredRooms = ROOMS.filter((r) => houseFilter === "All" || r.house === houseFilter);
  const filteredBoarders = BOARDERS.filter((b) => (houseFilter === "All" || b.house === houseFilter) && b.name.toLowerCase().includes(query.toLowerCase()));
  const totalBeds = ROOMS.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = ROOMS.reduce((s, r) => s + r.occupants, 0);
  const totalCollected = HOSTEL_FEES.reduce((s, h) => s + h.collected, 0);
  const totalTarget = HOSTEL_FEES.reduce((s, h) => s + h.target, 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <StatCard icon={Users} label="Total Boarders" value={BOARDERS.length} tone="indigo" />
        <StatCard icon={Bed} label="Bed Occupancy" value={`${totalOccupied}/${totalBeds}`} tone="cyan" />
        <StatCard icon={Home} label="Boarding Houses" value={HOUSES.length} tone="green" />
        <StatCard icon={Wallet} label="Term Fees Collected" value={fmtMoney(totalCollected)} tone="amber" />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Tag active={tab === "rooms"} onClick={() => setTab("rooms")}>Room Allocation</Tag>
        <Tag active={tab === "boarders"} onClick={() => setTab("boarders")}>Boarding Records</Tag>
        <Tag active={tab === "meals"} onClick={() => setTab("meals")}>Meal Management</Tag>
        <Tag active={tab === "fees"} onClick={() => setTab("fees")}>Hostel Fees</Tag>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select value={houseFilter} onChange={(e) => setHouseFilter(e.target.value)} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", color: C.text, fontSize: 13 }}>
          <option>All</option>
          {HOUSES.map((h) => <option key={h}>{h}</option>)}
        </select>
      </div>

      {tab === "rooms" && (
        <Card>
          <SectionHeader title="Room Allocation" subtitle="Click a room to see occupants" action={
            <button style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={14} /> Add Room
            </button>
          } />
          <Table
            onRowClick={setSelectedRoom}
            columns={[
              { key: "id", label: "Room" },
              { key: "house", label: "House" },
              { key: "occupants", label: "Occupancy", render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 70 }}><ProgressBar value={(r.occupants / r.capacity) * 100} tone={r.occupants >= r.capacity ? "red" : "green"} h={6} /></div>
                  <span style={{ fontSize: 12 }}>{r.occupants}/{r.capacity}</span>
                </div>
              ) },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={filteredRooms}
          />
        </Card>
      )}

      {tab === "boarders" && (
        <Card>
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 12px", flex: 1, maxWidth: 280 }}>
              <Search size={14} color={C.textFaint} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search boarders…" style={{ background: "none", border: "none", outline: "none", color: C.text, fontSize: 13, flex: 1 }} />
            </div>
          </div>
          <Table
            columns={[
              { key: "name", label: "Student", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={r.name} size={28} /><div><div style={{ fontWeight: 600 }}>{r.name}</div><div style={{ fontSize: 11, color: C.textFaint }}>{r.cls}</div></div></div> },
              { key: "house", label: "House" },
              { key: "room", label: "Room" },
              { key: "dietary", label: "Dietary Notes", render: (r) => r.dietary === "None" ? <span style={{ color: C.textFaint }}>—</span> : <Pill tone="amber">{r.dietary}</Pill> },
              { key: "emergencyPhone", label: "Emergency Contact" },
              { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            ]}
            rows={filteredBoarders}
          />
        </Card>
      )}

      {tab === "meals" && (
        <Card>
          <SectionHeader title="Weekly Meal Plan" subtitle="All boarding houses share the same kitchen menu" />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr>
                  {["Day", "Breakfast", "Lunch", "Dinner"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0 12px 10px", color: C.textFaint, fontSize: 11, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MEAL_PLAN.map((d) => (
                  <tr key={d.day}>
                    <td style={{ padding: "10px 12px", color: C.text, fontWeight: 600, borderBottom: `1px solid ${C.borderSoft}` }}>{d.day}</td>
                    <td style={{ padding: "10px 12px", color: C.textMuted, borderBottom: `1px solid ${C.borderSoft}` }}>{d.breakfast}</td>
                    <td style={{ padding: "10px 12px", color: C.textMuted, borderBottom: `1px solid ${C.borderSoft}` }}>{d.lunch}</td>
                    <td style={{ padding: "10px 12px", color: C.textMuted, borderBottom: `1px solid ${C.borderSoft}` }}>{d.dinner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 18 }}>
            <SectionHeader title="Dietary Requirements on File" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {BOARDERS.filter((b) => b.dietary !== "None").map((b) => (
                <Pill key={b.name} tone="amber">{b.name} — {b.dietary}</Pill>
              ))}
            </div>
          </div>
        </Card>
      )}

      {tab === "fees" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Card>
            <SectionHeader title="Collection by House" subtitle="This term (USD)" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={HOSTEL_FEES}>
                <CartesianGrid stroke={C.borderSoft} vertical={false} />
                <XAxis dataKey="house" stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={C.textFaint} fontSize={11} tickLine={false} axisLine={false} width={42} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="target" name="Target" fill={C.border} radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Collected" fill={C.cyan} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionHeader title="Hostel Fee Status" subtitle={`Total: ${fmtMoney(totalCollected)} of ${fmtMoney(totalTarget)} collected`} />
            <Table
              columns={[
                { key: "house", label: "House" },
                { key: "boarders", label: "Boarders", align: "center" },
                { key: "termFee", label: "Term Fee", render: (r) => fmtMoney(r.termFee) },
                { key: "collected", label: "Collected", render: (r) => fmtMoney(r.collected) },
                { key: "progress", label: "Progress", render: (r) => (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 90 }}><ProgressBar value={(r.collected / r.target) * 100} tone={r.collected >= r.target ? "green" : "amber"} h={6} /></div>
                    <span style={{ fontSize: 12 }}>{Math.round((r.collected / r.target) * 100)}%</span>
                  </div>
                ) },
              ]}
              rows={HOSTEL_FEES}
            />
          </Card>
        </div>
      )}

      <RoomModal room={selectedRoom} onClose={() => setSelectedRoom(null)} />
    </div>
  );
}

/* ============================== STUDENT / PARENT VIEW ============================== */
function HostelPersonalView({ role }) {
  const me = BOARDERS[0]; // Tadiwa Mhofu, demo boarder
  const roommates = BOARDERS.filter((b) => b.room === me.room && b.name !== me.name);
  const todayIndex = new Date().getDay(); // 0=Sun
  const dayMap = [6, 0, 1, 2, 3, 4, 5]; // map JS Sunday-first to our Monday-first array index
  const today = MEAL_PLAN[dayMap[todayIndex]];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <Avatar name={me.name} size={48} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{role === "parent" ? `${me.name}'s Room` : "My Room"}</div>
          <div style={{ fontSize: 12.5, color: C.textMuted }}>{me.house} · Room {me.room}</div>
        </div>
        <div style={{ marginLeft: "auto" }}><Pill tone={statusTone(me.status)}>{me.status}</Pill></div>
      </Card>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Card style={{ flex: 1, minWidth: 240 }}>
          <SectionHeader title="Roommates" />
          {roommates.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {roommates.map((r) => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={r.name} size={28} />
                  <div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11.5, color: C.textMuted }}>{r.cls}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <div style={{ fontSize: 13, color: C.textMuted }}>No roommates on file.</div>}
        </Card>
        <Card style={{ flex: 1, minWidth: 240 }}>
          <SectionHeader title="Emergency Contact" />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <UserCircle2 size={16} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{me.guardian}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Phone size={16} color={C.textMuted} /><span style={{ fontSize: 13, color: C.text }}>{me.emergencyPhone}</span>
          </div>
          {me.dietary !== "None" && (
            <div style={{ marginTop: 14 }}>
              <Pill tone="amber">{me.dietary}</Pill>
            </div>
          )}
        </Card>
      </div>

      <Card>
        <SectionHeader title="Today's Meals" subtitle={today.day} />
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {[["Breakfast", today.breakfast, Coffee], ["Lunch", today.lunch, Sun], ["Dinner", today.dinner, Moon]].map(([label, menu, Icon]) => (
            <div key={label} style={{ flex: 1, minWidth: 180, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon size={14} color={C.cyan} />
                <span style={{ fontSize: 12.5, fontWeight: 700, color: C.text }}>{label}</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.textMuted, lineHeight: 1.5 }}>{menu}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function HostelModule({ role }) {
  return role === "admin" ? <HostelAdminView /> : <HostelPersonalView role={role} />;
}

export { HostelModule };