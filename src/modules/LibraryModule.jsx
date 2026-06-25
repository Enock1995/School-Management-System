import React, { useState, useEffect } from "react";
import {
  BookMarked, AlertTriangle, CheckCircle2, Loader2
} from "lucide-react";
import { C, fmtMoney, monoFont, displayFont } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, ProgressBar, Avatar, Table, Modal, Tag, CustomTooltip, riskTone, statusTone } from "../components/ui";
import { BOOKS as MOCK_BOOKS, LOANS as MOCK_LOANS } from "../data/mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

function LibraryModule({ role }) {
  const [books, setBooks] = useState(MOCK_BOOKS);
  const [loans, setLoans] = useState(MOCK_LOANS);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [usingLiveData, setUsingLiveData] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([
      supabase.from("books").select("*").order("title"),
      supabase.from("loans").select("*").order("due"),
    ]).then(([booksRes, loansRes]) => {
      let anyLive = false;
      if (!booksRes.error && booksRes.data && booksRes.data.length > 0) {
        setBooks(booksRes.data);
        anyLive = true;
      } else if (booksRes.error) {
        console.warn("Falling back to demo book data:", booksRes.error.message);
      }
      if (!loansRes.error && loansRes.data && loansRes.data.length > 0) {
        setLoans(loansRes.data);
        anyLive = true;
      } else if (loansRes.error) {
        console.warn("Falling back to demo loan data:", loansRes.error.message);
      }
      setUsingLiveData(anyLive);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(loading || usingLiveData) && (
        <div>
          {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing live data…</span>}
          {usingLiveData && <Pill tone="green">Live data</Pill>}
        </div>
      )}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={BookMarked} label="Total Titles" value={books.length} tone="indigo" />
        <StatCard icon={CheckCircle2} label="Active Loans" value={loans.filter(l => l.status === "Active").length} tone="cyan" />
        <StatCard icon={AlertTriangle} label="Overdue" value={loans.filter(l => l.status === "Overdue").length} tone="red" />
      </div>
      <Card>
        <SectionHeader title="Catalog" />
        <Table
          columns={[
            { key: "title", label: "Title" },
            { key: "author", label: "Author" },
            { key: "category", label: "Category", render: (r) => <Pill tone="slate">{r.category}</Pill> },
            { key: "available", label: "Availability", render: (r) => r.available > 0 ? <span style={{ color: C.green }}>{r.available}/{r.copies} available</span> : <span style={{ color: C.red }}>All copies on loan</span> },
          ]}
          rows={books}
        />
      </Card>
      <Card>
        <SectionHeader title={role === "student" ? "My Loans" : "Issue & Return Tracker"} />
        <Table
          columns={[
            { key: "student", label: "Student" },
            { key: "book", label: "Book" },
            { key: "due", label: "Due Date" },
            { key: "status", label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
            { key: "fine", label: "Fine", render: (r) => r.fine ? fmtMoney(r.fine) : "—" },
          ]}
          rows={loans}
        />
      </Card>
    </div>
  );
}

export { LibraryModule };