import { Amiri, Aref_Ruqaa, Cairo, El_Messiri, Lateef, Playfair_Display, Reem_Kufi, Tajawal } from "next/font/google";

const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-amiri", display: "swap" });
const arefRuqaa = Aref_Ruqaa({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-aref-ruqaa", display: "swap", preload: false });
const reemKufi = Reem_Kufi({ subsets: ["arabic", "latin"], variable: "--f-reem-kufi", display: "swap", preload: false });
const elMessiri = El_Messiri({ subsets: ["arabic", "latin"], variable: "--f-el-messiri", display: "swap", preload: false });
const lateef = Lateef({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-lateef", display: "swap", preload: false });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--f-cairo", display: "swap" });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--f-tajawal", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--f-playfair", display: "swap", preload: false });

export const fontVariables = [amiri, arefRuqaa, reemKufi, elMessiri, lateef, cairo, tajawal, playfair]
  .map((f) => f.variable)
  .join(" ");

