// Shared mock data for Springfield International High School demo
import { C } from "../lib/theme";

const CLASSES = [
  { id: "f1a", name: "Form 1A", level: "IGCSE", curriculum: "Cambridge", teacher: "Mr. T. Moyo", count: 28 },
  { id: "f1b", name: "Form 1B", level: "IGCSE", curriculum: "Cambridge", teacher: "Mrs. R. Chikore", count: 26 },
  { id: "f2a", name: "Form 2A", level: "IGCSE", curriculum: "Cambridge", teacher: "Mr. S. Ndlovu", count: 27 },
  { id: "f3a", name: "Form 3A", level: "IGCSE", curriculum: "ZIMSEC", teacher: "Mrs. P. Gumbo", count: 25 },
  { id: "f4a", name: "Form 4A", level: "IGCSE", curriculum: "Cambridge", teacher: "Mr. D. Banda", count: 24 },
  { id: "f5a", name: "Form 5A", level: "A-Level", curriculum: "Cambridge", teacher: "Mrs. L. Marufu", count: 19 },
  { id: "f6a", name: "Form 6A", level: "A-Level", curriculum: "Cambridge", teacher: "Mr. K. Sibanda", count: 17 },
];

const SUBJECTS = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "Business Studies", "Computer Science", "History", "Geography", "French"];

const STUDENTS = [
  { id: "STU-1042", name: "Tadiwa Mhofu", cls: "Form 4A", gender: "M", guardian: "Mr. C. Mhofu", phone: "+263 77 412 9981", email: "c.mhofu@gmail.com", attendance: 96, average: 84, balance: 0, risk: "Low", status: "Enrolled" },
  { id: "STU-1043", name: "Anesu Chitate", cls: "Form 4A", gender: "F", guardian: "Mrs. F. Chitate", phone: "+263 77 220 1145", email: "f.chitate@gmail.com", attendance: 91, average: 78, balance: 120, risk: "Low", status: "Enrolled" },
  { id: "STU-1044", name: "Liam Osei", cls: "Form 2A", gender: "M", guardian: "Mr. K. Osei", phone: "+263 78 901 2233", email: "k.osei@outlook.com", attendance: 74, average: 58, balance: 640, risk: "High", status: "Enrolled" },
  { id: "STU-1045", name: "Rutendo Marecha", cls: "Form 1A", gender: "F", guardian: "Mrs. N. Marecha", phone: "+263 71 556 7790", email: "n.marecha@gmail.com", attendance: 99, average: 91, balance: 0, risk: "Low", status: "Enrolled" },
  { id: "STU-1046", name: "Brian Mutasa", cls: "Form 3A", gender: "M", guardian: "Mr. W. Mutasa", phone: "+263 77 334 8821", email: "w.mutasa@gmail.com", attendance: 83, average: 66, balance: 310, risk: "Watch", status: "Enrolled" },
  { id: "STU-1047", name: "Chiedza Goredema", cls: "Form 5A", gender: "F", guardian: "Mrs. T. Goredema", phone: "+263 73 209 4456", email: "t.goredema@gmail.com", attendance: 95, average: 88, balance: 0, risk: "Low", status: "Enrolled" },
  { id: "STU-1048", name: "Kudzai Nyamande", cls: "Form 2A", gender: "M", guardian: "Mr. P. Nyamande", phone: "+263 78 667 1290", email: "p.nyamande@gmail.com", attendance: 68, average: 49, balance: 890, risk: "High", status: "Enrolled" },
  { id: "STU-1049", name: "Stephanie Mhike", cls: "Form 1B", gender: "F", guardian: "Mrs. J. Mhike", phone: "+263 77 880 3321", email: "j.mhike@gmail.com", attendance: 97, average: 86, balance: 0, risk: "Low", status: "Enrolled" },
  { id: "STU-1050", name: "Tinotenda Chigumba", cls: "Form 6A", gender: "M", guardian: "Mr. E. Chigumba", phone: "+263 71 442 9087", email: "e.chigumba@gmail.com", attendance: 89, average: 73, balance: 150, risk: "Watch", status: "Enrolled" },
  { id: "STU-1051", name: "Maria Fernandez", cls: "Form 4A", gender: "F", guardian: "Mr. A. Fernandez", phone: "+263 78 112 6654", email: "a.fernandez@gmail.com", attendance: 93, average: 81, balance: 0, risk: "Low", status: "Enrolled" },
  { id: "STU-1052", name: "Tapiwa Chirwa", cls: "Form 3A", gender: "M", guardian: "Mrs. S. Chirwa", phone: "+263 77 998 4432", email: "s.chirwa@gmail.com", attendance: 78, average: 61, balance: 420, risk: "Watch", status: "Enrolled" },
  { id: "STU-1053", name: "Natasha Sibanda", cls: "Form 1A", gender: "F", guardian: "Mr. G. Sibanda", phone: "+263 73 776 5510", email: "g.sibanda@gmail.com", attendance: 98, average: 89, balance: 0, risk: "Low", status: "Enrolled" },
];

const APPLICANTS = [
  { id: "APP-301", name: "Joseph Mangwana", forClass: "Form 1A", stage: "Applied", date: "2026-06-02" },
  { id: "APP-302", name: "Emily Watson", forClass: "Form 1B", stage: "Reviewed", date: "2026-05-28" },
  { id: "APP-303", name: "Farai Madziva", forClass: "Form 2A", stage: "Accepted", date: "2026-05-20" },
  { id: "APP-304", name: "Grace Mupanduki", forClass: "Form 1A", stage: "Enrolled", date: "2026-05-12" },
  { id: "APP-305", name: "Daniel Chuma", forClass: "Form 1B", stage: "Applied", date: "2026-06-10" },
  { id: "APP-306", name: "Vimbai Hove", forClass: "Form 2A", stage: "Reviewed", date: "2026-06-05" },
];

const STAFF = [
  { id: "T-01", name: "Mr. T. Moyo", subject: "Mathematics", classes: ["Form 1A", "Form 4A"], load: 24 },
  { id: "T-02", name: "Mrs. R. Chikore", subject: "English Language", classes: ["Form 1B"], load: 20 },
  { id: "T-03", name: "Mr. S. Ndlovu", subject: "Physics", classes: ["Form 2A", "Form 5A"], load: 26 },
  { id: "T-04", name: "Mrs. P. Gumbo", subject: "Biology", classes: ["Form 3A"], load: 22 },
  { id: "T-05", name: "Mr. D. Banda", subject: "Computer Science", classes: ["Form 4A", "Form 6A"], load: 28 },
];

const ENROLLMENT_TREND = [
  { term: "T1 '25", students: 312 }, { term: "T2 '25", students: 324 },
  { term: "T3 '25", students: 330 }, { term: "T1 '26", students: 341 },
  { term: "T2 '26", students: 356 }, { term: "T3 '26 (proj.)", students: 368 },
];

const REVENUE_TREND = [
  { term: "Jan", collected: 38000, target: 42000 }, { term: "Feb", collected: 41000, target: 42000 },
  { term: "Mar", collected: 39500, target: 42000 }, { term: "Apr", collected: 44000, target: 44000 },
  { term: "May", collected: 40200, target: 44000 }, { term: "Jun", collected: 45800, target: 46000 },
];

const CLASS_PERFORMANCE = [
  { cls: "F1A", avg: 82 }, { cls: "F1B", avg: 76 }, { cls: "F2A", avg: 64 },
  { cls: "F3A", avg: 69 }, { cls: "F4A", avg: 81 }, { cls: "F5A", avg: 85 }, { cls: "F6A", avg: 79 },
];

const FEE_STATUS = [
  { name: "Paid in full", value: 218, color: C.green },
  { name: "Partial", value: 94, color: C.amber },
  { name: "Overdue", value: 44, color: C.red },
];

const AI_ALERTS = [
  { id: 1, type: "Attendance", severity: "High", student: "Kudzai Nyamande", msg: "Attendance dropped to 68% over the last 3 weeks — pattern suggests possible disengagement.", date: "Jun 18" },
  { id: 2, type: "Fee Default", severity: "High", student: "Kudzai Nyamande", msg: "Outstanding balance of $890 is 45 days overdue, highest risk of default this term.", date: "Jun 17" },
  { id: 3, type: "Academic", severity: "Watch", student: "Liam Osei", msg: "Average dropped 12 points across two terms — flagged for academic support.", date: "Jun 16" },
  { id: 4, type: "Dropout Risk", severity: "Watch", student: "Brian Mutasa", msg: "Combined attendance and grade decline places this student in the moderate dropout-risk band.", date: "Jun 15" },
  { id: 5, type: "Teacher Workload", severity: "Info", student: "Mr. D. Banda", msg: "Teaching load of 28 periods/week is above the recommended threshold of 26.", date: "Jun 14" },
  { id: 6, type: "Top Performer", severity: "Positive", student: "Natasha Sibanda", msg: "Sustained average above 88% for three consecutive terms.", date: "Jun 12" },
];

const EXAMS = [
  { id: "EX-01", title: "Mid-Term Test", subject: "Mathematics", cls: "Form 4A", date: "2026-06-23", status: "Scheduled" },
  { id: "EX-02", title: "Mid-Term Test", subject: "Physics", cls: "Form 5A", date: "2026-06-24", status: "Scheduled" },
  { id: "EX-03", title: "End of Term Exam", subject: "English Language", cls: "Form 1B", date: "2026-06-30", status: "Scheduled" },
  { id: "EX-04", title: "Mock Exam", subject: "Chemistry", cls: "Form 6A", date: "2026-06-20", status: "Marking" },
  { id: "EX-05", title: "Unit Test 3", subject: "Computer Science", cls: "Form 4A", date: "2026-06-15", status: "Graded" },
];

const RESULTS_F4A_MATH = [
  { name: "Tadiwa Mhofu", score: 88, grade: "A" }, { name: "Anesu Chitate", score: 74, grade: "B" },
  { name: "Maria Fernandez", score: 81, grade: "A" }, { name: "Tapiwa Chirwa", score: 0, grade: "—" },
];

const INVOICES = [
  { id: "INV-2201", student: "Tadiwa Mhofu", cls: "Form 4A", amount: 980, paid: 980, due: "2026-06-10", status: "Paid" },
  { id: "INV-2202", student: "Anesu Chitate", cls: "Form 4A", amount: 980, paid: 860, due: "2026-06-10", status: "Partial" },
  { id: "INV-2203", student: "Liam Osei", cls: "Form 2A", amount: 760, paid: 120, due: "2026-05-20", status: "Overdue" },
  { id: "INV-2204", student: "Kudzai Nyamande", cls: "Form 2A", amount: 760, paid: 0, due: "2026-05-05", status: "Overdue" },
  { id: "INV-2205", student: "Rutendo Marecha", cls: "Form 1A", amount: 720, paid: 720, due: "2026-06-10", status: "Paid" },
  { id: "INV-2206", student: "Brian Mutasa", cls: "Form 3A", amount: 810, paid: 500, due: "2026-06-01", status: "Partial" },
];

const PAYMENT_METHODS = [
  { name: "EcoCash", share: 46 }, { name: "Paynow", share: 24 }, { name: "Bank Transfer", share: 18 },
  { name: "Stripe (Intl.)", share: 8 }, { name: "OneMoney", share: 4 },
];

const ANNOUNCEMENTS = [
  { id: 1, title: "Mid-Term Exam Timetable Released", audience: "All Parents & Students", channel: "Email + Push", date: "Jun 17", body: "The Mid-Term examination timetable for Term 2 is now available on the portal. Please review the schedule for your form and prepare accordingly." },
  { id: 2, title: "Inter-House Sports Day — 28 June", audience: "All Students", channel: "Push", date: "Jun 16", body: "Sports Day will be held on 28 June starting 8am. Students should wear house colours and bring water bottles." },
  { id: 3, title: "Term 2 Fee Statements Issued", audience: "All Parents", channel: "SMS + Email", date: "Jun 14", body: "Fee statements for Term 2 have been issued. Outstanding balances should be settled by 30 June to avoid late fees." },
  { id: 4, title: "Form 4 & 6 Mock Exam Results", audience: "Form 4A, Form 6A Parents", channel: "Email", date: "Jun 10", body: "Mock examination results are now available for review on the student portal under Examinations." },
];

const BOOKS = [
  { id: "BK-001", title: "Pure Mathematics 1", author: "Hugh Neill", category: "Mathematics", copies: 12, available: 3 },
  { id: "BK-002", title: "Things Fall Apart", author: "Chinua Achebe", category: "Literature", copies: 18, available: 9 },
  { id: "BK-003", title: "Physics for IGCSE", author: "Tom Duncan", category: "Science", copies: 15, available: 0 },
  { id: "BK-004", title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", copies: 6, available: 4 },
  { id: "BK-005", title: "Business Studies Coursebook", author: "Karen Borrington", category: "Business", copies: 10, available: 6 },
];

const LOANS = [
  { student: "Liam Osei", book: "Physics for IGCSE", due: "2026-06-10", status: "Overdue", fine: 4.5 },
  { student: "Natasha Sibanda", book: "Things Fall Apart", due: "2026-06-25", status: "Active", fine: 0 },
  { student: "Tinotenda Chigumba", book: "A Brief History of Time", due: "2026-06-20", status: "Active", fine: 0 },
];

const ROUTES = [
  { id: "RT-01", name: "Borrowdale Loop", bus: "AEZ 4471", driver: "Mr. Farai Zhou", capacity: 32, assigned: 29, status: "On Route", eta: "7:42 AM" },
  { id: "RT-02", name: "Mt Pleasant Express", bus: "ADX 9012", driver: "Mr. Joseph Banda", capacity: 28, assigned: 25, status: "At School", eta: "Arrived" },
  { id: "RT-03", name: "Avondale — Marlborough", bus: "AFK 2290", driver: "Mrs. Susan Mhiripiri", capacity: 30, assigned: 18, status: "Maintenance", eta: "—" },
];

const TIMETABLE_F4A = [
  { time: "7:30–8:15", mon: "Mathematics", tue: "Physics", wed: "English", thu: "Computer Sci.", fri: "Biology" },
  { time: "8:15–9:00", mon: "Mathematics", tue: "Physics", wed: "English", thu: "Computer Sci.", fri: "Biology" },
  { time: "9:15–10:00", mon: "Chemistry", tue: "Business St.", wed: "History", thu: "Geography", fri: "French" },
  { time: "10:15–11:00", mon: "English", tue: "Mathematics", wed: "Physics", thu: "Chemistry", fri: "Mathematics" },
  { time: "11:00–11:45", mon: "Geography", tue: "Biology", wed: "Computer Sci.", thu: "English", fri: "Business St." },
];


export { CLASSES, SUBJECTS, STUDENTS, APPLICANTS, STAFF, ENROLLMENT_TREND, REVENUE_TREND, CLASS_PERFORMANCE, FEE_STATUS, AI_ALERTS, EXAMS, RESULTS_F4A_MATH, INVOICES, PAYMENT_METHODS, ANNOUNCEMENTS, BOOKS, LOANS, ROUTES, TIMETABLE_F4A };
