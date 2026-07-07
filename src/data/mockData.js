// mockData.js — utility constants only.
// All large data arrays (STUDENTS, INVOICES, STAFF, etc.) have been removed.
// All modules now start with empty state and load from Supabase.

export const CLASSES = [
  { id: "f1a", name: "Form 1A" }, { id: "f1b", name: "Form 1B" },
  { id: "f2a", name: "Form 2A" }, { id: "f3a", name: "Form 3A" },
  { id: "f4a", name: "Form 4A" }, { id: "f5a", name: "Form 5A" },
  { id: "f6a", name: "Form 6A" },
];

export const SUBJECTS = [
  "Mathematics", "English Language", "Physics", "Chemistry", "Biology",
  "Business Studies", "Computer Science", "History", "Geography", "French",
];

export const APPLICANTS = [
  { id: "APP-001", name: "Simbarashe Munemo", forClass: "Form 1A", stage: "Applied",  date: "2026-06-10" },
  { id: "APP-002", name: "Rudo Chimwemwe",    forClass: "Form 2A", stage: "Reviewed", date: "2026-06-05" },
  { id: "APP-003", name: "Tendai Murambwa",   forClass: "Form 1A", stage: "Accepted", date: "2026-05-28" },
  { id: "APP-004", name: "Farai Gwandu",      forClass: "Form 3A", stage: "Enrolled", date: "2026-05-20" },
  { id: "APP-005", name: "Nyasha Chikwanda",  forClass: "Form 1B", stage: "Applied",  date: "2026-06-12" },
  { id: "APP-006", name: "Tanaka Mushore",    forClass: "Form 2A", stage: "Reviewed", date: "2026-06-08" },
];

export const PAYMENT_METHODS = [
  { name: "Bank Transfer" }, { name: "EcoCash" }, { name: "Paynow" }, { name: "Stripe" },
];

// Finance chart reference data (historical projections — no live DB table yet)
export const REVENUE_TREND = [
  { term: "T1 2025", target: 48000, collected: 44100 },
  { term: "T2 2025", target: 48000, collected: 46800 },
  { term: "T3 2025", target: 48000, collected: 43200 },
  { term: "T1 2026", target: 52000, collected: 50700 },
  { term: "T2 2026", target: 52000, collected: 38400 },
];

export const FEE_STATUS = [
  { name: "Paid",    value: 68, color: "#22d3ee" },
  { name: "Partial", value: 21, color: "#f59e0b" },
  { name: "Overdue", value: 11, color: "#f87171" },
];