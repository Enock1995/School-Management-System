import React, { useState, useEffect } from "react";
import { BookMarked, AlertTriangle, CheckCircle2, Loader2, Plus, Pencil, Trash2, RotateCcw } from "lucide-react";
import { C, fmtMoney } from "../lib/theme";
import { Pill, Card, SectionHeader, StatCard, Table, Modal, statusTone } from "../components/ui";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

const BOOK_CATEGORIES = ["Fiction","Non-Fiction","Science","Mathematics","History","Geography","Literature","Reference","Biography","Other"];
const EMPTY_BOOK = { id: "", title: "", author: "", category: "Reference", copies: 1 };
const EMPTY_LOAN = { student: "", book: "", due: "" };

function EmptyState({ icon: Icon, message, hint }) {
  return (
    <div style={{ textAlign: "center", padding: "44px 20px" }}>
      <Icon size={36} color={C.border} style={{ marginBottom: 12 }} />
      <div style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}>{message}</div>
      {hint && <div style={{ fontSize: 12.5, color: C.textFaint, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function LibraryModule({ role }) {
  const [books, setBooks]   = useState([]);
  const [loans, setLoans]   = useState([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const [bookModal,   setBookModal]   = useState(null);
  const [bookForm,    setBookForm]    = useState(EMPTY_BOOK);
  const [savingBook,  setSavingBook]  = useState(false);

  const [loanOpen,    setLoanOpen]    = useState(false);
  const [loanForm,    setLoanForm]    = useState(EMPTY_LOAN);
  const [savingLoan,  setSavingLoan]  = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    Promise.all([
      supabase.from("books").select("*").order("title"),
      supabase.from("loans").select("*").order("due"),
    ]).then(([bR, lR]) => {
      setBooks(bR.data || []);
      setLoans(lR.data || []);
      setLoading(false);
    });
  }, []);

  /* ---- Book CRUD ---- */
  function openAddBook()   { setBookForm(EMPTY_BOOK); setBookModal({ mode: "add" }); }
  function openEditBook(b) { setBookForm({ id: b.id, title: b.title, author: b.author, category: b.category, copies: b.copies }); setBookModal({ mode: "edit", data: b }); }

  function saveBook() {
    if (!bookForm.title.trim() || !bookForm.author.trim()) return;
    setSavingBook(true);
    if (bookModal.mode === "edit") {
      const id = bookModal.data.id;
      const payload = { title: bookForm.title, author: bookForm.author, category: bookForm.category, copies: Number(bookForm.copies) };
      if (isSupabaseConfigured) {
        supabase.from("books").update(payload).eq("id", id).then(({ error }) => {
          if (error) console.warn("Book update error:", error.message);
          setBooks((arr) => arr.map((b) => b.id === id ? { ...b, ...payload } : b));
          setSavingBook(false); setBookModal(null);
        });
      } else {
        setBooks((arr) => arr.map((b) => b.id === id ? { ...b, ...payload } : b));
        setSavingBook(false); setBookModal(null);
      }
    } else {
      const newId = bookForm.id.trim() || `BK-${String(books.length + 1).padStart(3, "0")}`;
      const row = { id: newId, title: bookForm.title, author: bookForm.author, category: bookForm.category, copies: Number(bookForm.copies), available: Number(bookForm.copies) };
      if (isSupabaseConfigured) {
        supabase.from("books").insert(row).select().single().then(({ data, error }) => {
          if (error) console.warn("Book insert error:", error.message);
          setBooks((arr) => [...arr, data || row]);
          setSavingBook(false); setBookModal(null); setBookForm(EMPTY_BOOK);
        });
      } else {
        setBooks((arr) => [...arr, row]);
        setSavingBook(false); setBookModal(null); setBookForm(EMPTY_BOOK);
      }
    }
  }

  /* ---- Loan CRUD ---- */
  function saveLoan() {
    if (!loanForm.student.trim() || !loanForm.book || !loanForm.due) return;
    setSavingLoan(true);
    const row = { student: loanForm.student, book: loanForm.book, due: loanForm.due, status: "Active", fine: 0 };
    if (isSupabaseConfigured) {
      supabase.from("loans").insert(row).select().single().then(({ data, error }) => {
        if (error) console.warn("Loan insert error:", error.message);
        else {
          const b = books.find((bk) => bk.title === loanForm.book);
          if (b && b.available > 0) {
            supabase.from("books").update({ available: b.available - 1 }).eq("id", b.id).then(() =>
              setBooks((arr) => arr.map((bk) => bk.id === b.id ? { ...bk, available: bk.available - 1 } : bk))
            );
          }
        }
        setLoans((arr) => [data || { ...row, id: Date.now() }, ...arr]);
        setSavingLoan(false); setLoanOpen(false); setLoanForm(EMPTY_LOAN);
      });
    } else {
      setLoans((arr) => [{ ...row, id: Date.now() }, ...arr]);
      setSavingLoan(false); setLoanOpen(false); setLoanForm(EMPTY_LOAN);
    }
  }

  function returnLoan(loan) {
    setLoans((arr) => arr.map((l) => l.id === loan.id ? { ...l, status: "Returned" } : l));
    if (!isSupabaseConfigured) return;
    supabase.from("loans").update({ status: "Returned" }).eq("id", loan.id).then(({ error }) => {
      if (error) { console.warn("Return error:", error.message); return; }
      const b = books.find((bk) => bk.title === loan.book);
      if (b) supabase.from("books").update({ available: b.available + 1 }).eq("id", b.id).then(() =>
        setBooks((arr) => arr.map((bk) => bk.id === b.id ? { ...bk, available: bk.available + 1 } : bk))
      );
    });
  }

  /* ---- Delete ---- */
  function confirmAndDelete() {
    setDeleting(true);
    const { type, id } = confirmDelete;
    if (isSupabaseConfigured) {
      supabase.from(type === "book" ? "books" : "loans").delete().eq("id", id).then(({ error }) => {
        if (error) console.warn("Delete error:", error.message);
        if (type === "book") setBooks((arr) => arr.filter((b) => b.id !== id));
        else setLoans((arr) => arr.filter((l) => l.id !== id));
        setDeleting(false); setConfirmDelete(null);
      });
    } else {
      if (type === "book") setBooks((arr) => arr.filter((b) => b.id !== id));
      else setLoans((arr) => arr.filter((l) => l.id !== id));
      setDeleting(false); setConfirmDelete(null);
    }
  }

  const F = { width: "100%", background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 13, boxSizing: "border-box" };
  const L = { fontSize: 12, color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: 5 };
  const iconBtn = (color) => ({ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", color });
  const isAdmin = role === "admin";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.textFaint }}><Loader2 size={12} className="spin" /> Syncing…</span>}

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard icon={BookMarked}    label="Total Titles"  value={books.length}                                        tone="indigo" />
        <StatCard icon={CheckCircle2} label="Active Loans"  value={loans.filter((l) => l.status === "Active").length}  tone="cyan"   />
        <StatCard icon={AlertTriangle} label="Overdue"       value={loans.filter((l) => l.status === "Overdue").length} tone="red"    />
      </div>

      {/* ── CATALOG ── */}
      <Card>
        <SectionHeader title="Catalog" action={isAdmin && (
          <button onClick={openAddBook} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Add Book
          </button>
        )} />
        {loading ? null : books.length === 0
          ? <EmptyState icon={BookMarked} message="No books in the catalog yet." hint={isAdmin ? 'Click "Add Book" to add the first title.' : undefined} />
          : <Table columns={[
              { key: "title",     label: "Title" },
              { key: "author",    label: "Author" },
              { key: "category",  label: "Category",    render: (r) => <Pill tone="slate">{r.category}</Pill> },
              { key: "available", label: "Availability", render: (r) => r.available > 0 ? <span style={{ color: C.green }}>{r.available}/{r.copies} available</span> : <span style={{ color: C.red }}>All on loan</span> },
              ...(isAdmin ? [{ key: "actions", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={iconBtn(C.textMuted)} onClick={(e) => { e.stopPropagation(); openEditBook(r); }}><Pencil size={14} /></button>
                  <button style={iconBtn(C.red)}       onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "book", id: r.id, label: r.title }); }}><Trash2 size={14} /></button>
                </div>
              ) }] : []),
            ]} rows={books} />
        }
      </Card>

      {/* ── LOANS ── */}
      <Card>
        <SectionHeader title={role === "student" ? "My Loans" : "Issue & Return Tracker"} action={isAdmin && (
          <button onClick={() => { setLoanForm(EMPTY_LOAN); setLoanOpen(true); }} style={{ display: "flex", alignItems: "center", gap: 6, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={14} /> Issue Loan
          </button>
        )} />
        {loading ? null : loans.length === 0
          ? <EmptyState icon={CheckCircle2} message="No loans on record." hint={isAdmin ? 'Click "Issue Loan" to issue the first book.' : undefined} />
          : <Table columns={[
              { key: "student", label: "Student" },
              { key: "book",    label: "Book" },
              { key: "due",     label: "Due Date" },
              { key: "status",  label: "Status", render: (r) => <Pill tone={statusTone(r.status)}>{r.status}</Pill> },
              { key: "fine",    label: "Fine",   render: (r) => r.fine ? fmtMoney(r.fine) : "—" },
              ...(isAdmin ? [{ key: "actions", label: "", render: (r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  {(r.status === "Active" || r.status === "Overdue") && (
                    <button style={iconBtn(C.green)} title="Return" onClick={(e) => { e.stopPropagation(); returnLoan(r); }}><RotateCcw size={14} /></button>
                  )}
                  <button style={iconBtn(C.red)} onClick={(e) => { e.stopPropagation(); setConfirmDelete({ type: "loan", id: r.id, label: `${r.student} — ${r.book}` }); }}><Trash2 size={14} /></button>
                </div>
              ) }] : []),
            ]} rows={loans} />
        }
      </Card>

      {/* ── ADD/EDIT BOOK ── */}
      <Modal open={!!bookModal} onClose={() => setBookModal(null)} title={bookModal?.mode === "edit" ? "Edit Book" : "Add Book"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {bookModal?.mode === "add" && <div><label style={L}>Book ID (optional)</label><input placeholder="e.g. BK-042" value={bookForm.id} onChange={(e) => setBookForm((f) => ({ ...f, id: e.target.value }))} style={F} /></div>}
          <div><label style={L}>Title</label><input placeholder="Book title" value={bookForm.title} onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))} style={F} /></div>
          <div><label style={L}>Author</label><input placeholder="Author name" value={bookForm.author} onChange={(e) => setBookForm((f) => ({ ...f, author: e.target.value }))} style={F} /></div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 2 }}><label style={L}>Category</label><select value={bookForm.category} onChange={(e) => setBookForm((f) => ({ ...f, category: e.target.value }))} style={F}>{BOOK_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div style={{ flex: 1 }}><label style={L}>Copies</label><input type="number" min="1" value={bookForm.copies} onChange={(e) => setBookForm((f) => ({ ...f, copies: e.target.value }))} style={F} /></div>
          </div>
          <button onClick={saveBook} disabled={savingBook || !bookForm.title.trim() || !bookForm.author.trim()} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: savingBook ? 0.7 : 1 }}>
            {savingBook ? <><Loader2 size={14} className="spin" /> Saving…</> : bookModal?.mode === "edit" ? "Save Changes" : "Add Book"}
          </button>
        </div>
      </Modal>

      {/* ── ISSUE LOAN ── */}
      <Modal open={loanOpen} onClose={() => setLoanOpen(false)} title="Issue Loan">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={L}>Student Name</label><input placeholder="e.g. Tadiwa Mhofu" value={loanForm.student} onChange={(e) => setLoanForm((f) => ({ ...f, student: e.target.value }))} style={F} /></div>
          <div><label style={L}>Book</label>
            <select value={loanForm.book} onChange={(e) => setLoanForm((f) => ({ ...f, book: e.target.value }))} style={F}>
              <option value="">Select a book…</option>
              {books.filter((b) => b.available > 0).map((b) => <option key={b.id} value={b.title}>{b.title} ({b.available} available)</option>)}
            </select>
          </div>
          <div><label style={L}>Due Date</label><input type="date" value={loanForm.due} onChange={(e) => setLoanForm((f) => ({ ...f, due: e.target.value }))} style={F} /></div>
          <button onClick={saveLoan} disabled={savingLoan || !loanForm.student.trim() || !loanForm.book || !loanForm.due} style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.indigo, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: savingLoan ? 0.7 : 1 }}>
            {savingLoan ? <><Loader2 size={14} className="spin" /> Saving…</> : "Issue Loan"}
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

export { LibraryModule };