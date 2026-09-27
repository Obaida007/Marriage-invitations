import {
  Almarai,
  Amiri,
  Aref_Ruqaa,
  Cairo,
  Changa,
  Cormorant_Garamond,
  El_Messiri,
  Great_Vibes,
  Lateef,
  Mirza,
  Noto_Kufi_Arabic,
  Playfair_Display,
  Rakkas,
  Reem_Kufi,
  Scheherazade_New,
  Tajawal,
} from "next/font/google";

const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-amiri", display: "swap" });
const arefRuqaa = Aref_Ruqaa({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-aref-ruqaa", display: "swap", preload: false });
const reemKufi = Reem_Kufi({ subsets: ["arabic", "latin"], variable: "--f-reem-kufi", display: "swap", preload: false });
const elMessiri = El_Messiri({ subsets: ["arabic", "latin"], variable: "--f-el-messiri", display: "swap", preload: false });
const lateef = Lateef({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-lateef", display: "swap", preload: false });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--f-cairo", display: "swap" });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--f-tajawal", display: "swap", preload: false });
const rakkas = Rakkas({ subsets: ["arabic", "latin"], weight: "400", variable: "--f-rakkas", display: "swap", preload: false });
const mirza = Mirza({ subsets: ["arabic", "latin"], weight: ["400", "600"], variable: "--f-mirza", display: "swap", preload: false });
const scheherazade = Scheherazade_New({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--f-scheherazade", display: "swap", preload: false });
const notoKufi = Noto_Kufi_Arabic({ subsets: ["arabic", "latin"], variable: "--f-noto-kufi", display: "swap", preload: false });
const almarai = Almarai({ subsets: ["arabic"], weight: ["300", "400", "700"], variable: "--f-almarai", display: "swap", preload: false });
const changa = Changa({ subsets: ["arabic", "latin"], variable: "--f-changa", display: "swap", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--f-playfair", display: "swap", preload: false });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "600"], variable: "--f-cormorant", display: "swap", preload: false });
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--f-great-vibes", display: "swap", preload: false });

export const fontVariables = [
  amiri, arefRuqaa, reemKufi, elMessiri, lateef, cairo, tajawal, rakkas, mirza, scheherazade, notoKufi, almarai, changa, playfair, cormorant, greatVibes,
]
  .map((f) => f.variable)
  .join(" ");
