import { ShieldCheck, BookOpen, GraduationCap, Heart } from "lucide-react";

const C = {
  bg: "#0a0d1a",
  bgGrad: "linear-gradient(180deg, #0a0d1a 0%, #0d1126 100%)",
  surface: "#121632",
  surface2: "#161b3a",
  surfaceHover: "#1c2247",
  border: "#232a52",
  borderSoft: "#1a2046",
  indigo: "#6366f1",
  indigoSoft: "rgba(99,102,241,0.16)",
  cyan: "#22d3ee",
  cyanSoft: "rgba(34,211,238,0.14)",
  green: "#34d399",
  greenSoft: "rgba(52,211,153,0.14)",
  amber: "#fbbf24",
  amberSoft: "rgba(251,191,36,0.14)",
  red: "#f87171",
  redSoft: "rgba(248,113,113,0.14)",
  text: "#e9ebf7",
  textMuted: "#8b93b8",
  textFaint: "#4e5584",
};

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');";

const displayFont = { fontFamily: "'Space Grotesk', sans-serif" };
const bodyFont = { fontFamily: "'Inter', sans-serif" };
const monoFont = { fontFamily: "'JetBrains Mono', monospace" };

function fmtMoney(n) {
  return "$" + Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}


const ROLE_META = {
  admin: { label: "Administrator", icon: ShieldCheck, name: "Mrs. Patience Mhike", sub: "Head of School" },
  teacher: { label: "Teacher", icon: BookOpen, name: "Mr. T. Moyo", sub: "Mathematics Dept." },
  student: { label: "Student", icon: GraduationCap, name: "Tadiwa Mhofu", sub: "Form 4A" },
  parent: { label: "Parent", icon: Heart, name: "Mr. C. Mhofu", sub: "Parent of Tadiwa Mhofu" },
};

export { C, FONT_IMPORT, displayFont, bodyFont, monoFont, fmtMoney, ROLE_META };
