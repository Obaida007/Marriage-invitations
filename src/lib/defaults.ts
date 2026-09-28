import { SECTION_IDS, type InvitationContent, type ThemeId } from "./invitation-schema";
import { THEMES } from "./themes";

/** A clean style for a theme: every shape/color override reset to "inherit". */
export function defaultStyle(themeId: ThemeId = "royal-gold"): InvitationContent["style"] {
  const th = THEMES[themeId];
  return {
    theme: th.id,
    accent: "",
    colors: {},
    headingFont: th.headingFont,
    bodyFont: th.bodyFont,
    headingScale: "md",
    ornament: "",
    pattern: "",
    radius: "",
    frame: "",
    coverShape: "",
    corners: true,
    animation: "fade",
    envelope: true,
    envelopeStyle: "",
    petals: true,
    particle: "",
    heroTone: "auto",
    heroOverlay: 55,
    heroBlur: 0,
    backgroundScope: "hero",
    heroLayout: "",
    dateStyle: "",
    countdownStyle: "",
    cardStyle: "",
  };
}

function inDays(days: number, time = "20:00") {
  const d = new Date(Date.now() + days * 86400000);
  return `${d.toISOString().slice(0, 10)}T${time}`;
}

export function defaultContent(): InvitationContent {
  return {
    locale: "ar",
    couple: {
      groomName: "محمد",
      brideName: "سارة",
      groomFamily: "نجل السيد / أحمد عبدالله",
      brideFamily: "كريمة السيد / خالد إبراهيم",
      brideFirst: false,
      hideBrideName: false,
      groomTitle: "",
      brideTitle: "",
      titlesInline: false,
      monogram: "",
    },
    texts: {
      opening: "quran-rum",
      customOpening: "",
      hosts: "يتشرف آل عبدالله وآل إبراهيم",
      invitationLine: "بدعوتكم لحضور حفل زفاف أبنائهم، وبحضوركم تكتمل فرحتنا",
      closing: "دمتم ودامت أفراحكم عامرة",
      sectionTitles: {},
    },
    events: [
      {
        id: "main",
        title: "حفل الزفاف",
        startsAt: inDays(45),
        endsAt: "",
        venueName: "قاعة الماسة للاحتفالات",
        address: "الرياض، حي الملقا",
        mapUrl: "",
        lat: null,
        lng: null,
        note: "",
      },
    ],
    program: [
      { id: "p1", time: "8:00 م", title: "استقبال الضيوف", icon: "hall" },
      { id: "p2", time: "9:30 م", title: "زفة العروسين", icon: "rings" },
      { id: "p3", time: "11:00 م", title: "العشاء", icon: "dinner" },
    ],
    notes: ["نعتذر عن اصطحاب الأطفال", "يُرجى عدم التصوير داخل القاعة"],
    media: { coverImage: "", heroBackground: "", backgroundVideo: "", gallery: [], musicUrl: "" },
    style: defaultStyle("royal-gold"),
    sections: [...SECTION_IDS],
    features: {
      countdown: true,
      hijriDate: true,
      map: true,
      calendar: true,
      rsvp: true,
      wishes: true,
      gallery: true,
      program: true,
      music: false,
      qrPass: true,
    },
    rsvp: { deadline: "", openRsvp: true, defaultCompanions: 1, askNote: true },
    contact: { name: "", phone: "" },
    timezone: "Asia/Riyadh",
  };
}
