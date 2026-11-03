type Planet = "stable" | "nft" | "bitcoin" | "rwa" | "cyber";
type Phase = "arrival" | "thanks" | "departure" | "shield";

const COMMON: Record<string, Record<string, string>> = {
  ru: { cyber: "КИБЕР-ГЕРОЙ", ether: "ETHER", elder: "СТАРЕЙШИНА", cyber_npc: "КИБЕР", tower: "БАШНЯ", stage: "", rep: "" },
  en: { cyber: "CYBER HERO", ether: "ETHER", elder: "ELDER", cyber_npc: "CYBER", tower: "TOWER", stage: "", rep: "" },
  uk: { cyber: "КІБЕР-ГЕРОЙ", ether: "ETHER", elder: "СТАРІЙШИНА", cyber_npc: "КІБЕР", tower: "ВЕЖА", stage: "", rep: "" },
  cs: { cyber: "KYBER-HRDINA", ether: "ETHER", elder: "STARŠÍ", cyber_npc: "KYBER", tower: "VĚŽ", stage: "", rep: "" },
  pl: { cyber: "KYBER-BOHATER", ether: "ETHER", elder: "STARSZY", cyber_npc: "KYBER", tower: "WIEŻA", stage: "", rep: "" },
  es: { cyber: "CIBER-HÉROE", ether: "ETHER", elder: "ANCIANO", cyber_npc: "CIBER", tower: "TORRE", stage: "", rep: "" },
  pt: { cyber: "CIBER-HERÓI", ether: "ETHER", elder: "ANCIÃO", cyber_npc: "CIBER", tower: "TORRE", stage: "", rep: "" },
  fr: { cyber: "CYBER-HÉROS", ether: "ETHER", elder: "ANCIEN", cyber_npc: "CYBER", tower: "TOUR", stage: "", rep: "" },
  it: { cyber: "CYBER-EROE", ether: "ETHER", elder: "ANZIANO", cyber_npc: "CYBER", tower: "TORRE", stage: "", rep: "" },
  de: { cyber: "CYBER-HELD", ether: "ETHER", elder: "ÄLTESTER", cyber_npc: "CYBER", tower: "TURM", stage: "", rep: "" },
  nl: { cyber: "CYBER-HELD", ether: "ETHER", elder: "OUDSTE", cyber_npc: "CYBER", tower: "TOREN", stage: "", rep: "" },
  sv: { cyber: "CYBERHJÄLTE", ether: "ETHER", elder: "ÄLDSTE", cyber_npc: "CYBER", tower: "TORN", stage: "", rep: "" },
  da: { cyber: "CYBERHELT", ether: "ETHER", elder: "ÆLDSTE", cyber_npc: "CYBER", tower: "TÅRN", stage: "", rep: "" },
  no: { cyber: "CYBERHELT", ether: "ETHER", elder: "ELDSTE", cyber_npc: "CYBER", tower: "TÅRN", stage: "", rep: "" },
  fi: { cyber: "CYBER-SANKARI", ether: "ETHER", elder: "VANIN", cyber_npc: "CYBER", tower: "TORNI", stage: "", rep: "" },
  hu: { cyber: "KIBER-HŐS", ether: "ETHER", elder: "VÉN", cyber_npc: "KIBER", tower: "TORONY", stage: "", rep: "" },
  ro: { cyber: "CYBER-EROU", ether: "ETHER", elder: "BĂTRÂN", cyber_npc: "CYBER", tower: "TURN", stage: "", rep: "" },
  el: { cyber: "ΚΥΒΕΡ-ΗΡΩΑΣ", ether: "ETHER", elder: "ΠΡΕΣΒΥΤΕΡΟΣ", cyber_npc: "ΚΥΒΕΡ", tower: "ΠΥΡΓΟΣ", stage: "", rep: "" },
  tr: { cyber: "SİBER-KAHRAMAN", ether: "ETHER", elder: "AKSAKAL", cyber_npc: "SİBER", tower: "KULE", stage: "", rep: "" },
  id: { cyber: "CYBER-PAHLAWAN", ether: "ETHER", elder: "TETUA", cyber_npc: "CYBER", tower: "MENARA", stage: "", rep: "" },
  vi: { cyber: "NGƯỜI HÙNG CYBER", ether: "ETHER", elder: "TRƯỞNG LÃO", cyber_npc: "CYBER", tower: "THÁP", stage: "", rep: "" },
  ar: { cyber: "بَطَل السايبر", ether: "ETHER", elder: "الشُّيُوخ", cyber_npc: "السايبر", tower: "البُرْج", stage: "", rep: "" },
  hi: { cyber: "साइबर नायक", ether: "ETHER", elder: "प्रवीण", cyber_npc: "साइबर", tower: "मीनार", stage: "", rep: "" },
  th: { cyber: "วีรบุรุษไซเบอร์", ether: "ETHER", elder: "ผู้เฒ่า", cyber_npc: "ไซเบอร์", tower: "หอคอย", stage: "", rep: "" },
  ja: { cyber: "サイバー英雄", ether: "ETHER", elder: "長老", cyber_npc: "サイバー", tower: "塔", stage: "", rep: "" },
  ko: { cyber: "사이버 영웅", ether: "ETHER", elder: "장로", cyber_npc: "사이버", tower: "탑", stage: "", rep: "" },
  zh: { cyber: "赛博英雄", ether: "ETHER", elder: "长老", cyber_npc: "赛博", tower: "塔", stage: "", rep: "" },
};

const COMMON_LATIN: Record<string, string> = {
  cyber: "CYBER HERO", ether: "ETHER", elder: "ELDER", cyber_npc: "CYBER", tower: "TOWER", stage: "", rep: "",
};

const CROWD: Record<string, Record<string, string>> = {
  ru: {
    stableDeparture: "ПРИВЯЗАНЫЕ",
    nftDeparture: "РЕДКИЕ",
    bitcoinDeparture: "МАЙНЯЩИЕ",
    arcFinal: "КИБЕРЫ",
  },
  es: {
    stableDeparture: "VINCULADOS",
    nftDeparture: "RAROS",
    bitcoinDeparture: "MINEROS",
    arcFinal: "CIBERES",
  },
  pt: {
    stableDeparture: "VINCULADOS",
    nftDeparture: "RAROS",
    bitcoinDeparture: "MINEIROS",
    arcFinal: "CIBERES",
  },
  fr: {
    stableDeparture: "LIÉS",
    nftDeparture: "RARÉFIÉS",
    bitcoinDeparture: "MINEURS",
    arcFinal: "CYBERS",
  },
  it: {
    stableDeparture: "LEGATI",
    nftDeparture: "RARI",
    bitcoinDeparture: "MINATORI",
    arcFinal: "CIBER",
  },
  de: {
    stableDeparture: "GEBUNDENE",
    nftDeparture: "SELTENE",
    bitcoinDeparture: "MINER",
    arcFinal: "CYBERS",
  },
  nl: {
    stableDeparture: "GEBONDEN",
    nftDeparture: "ZELDZAME",
    bitcoinDeparture: "MINEURS",
    arcFinal: "CYBERS",
  },
  sv: {
    stableDeparture: "BUNDNA",
    nftDeparture: "SÄLLSYNTA",
    bitcoinDeparture: "MINERARE",
    arcFinal: "CYBRARNA",
  },
  da: {
    stableDeparture: "BUNNE",
    nftDeparture: "SJÆLDNE",
    bitcoinDeparture: "MINER",
    arcFinal: "CYBERNE",
  },
  no: {
    stableDeparture: "DE BUNDNE",
    nftDeparture: "DE SJELDNE",
    bitcoinDeparture: "MINERNE",
    arcFinal: "CYBERNE",
  },
  fi: {
    stableDeparture: "SIDOTUT",
    nftDeparture: "HARVINAISSET",
    bitcoinDeparture: "LOUHIJAT",
    arcFinal: "CYBERIT",
  },
  hu: {
    stableDeparture: "KÖTÖTTEK",
    nftDeparture: "RITKÁK",
    bitcoinDeparture: "BÁNYÁSZOK",
    arcFinal: "KIBEREK",
  },
  ro: {
    stableDeparture: "LEGAȚI",
    nftDeparture: "RARII",
    bitcoinDeparture: "MINERI",
    arcFinal: "CYBERI",
  },
  el: {
    stableDeparture: "ΔΕΜΕΝΟΙ",
    nftDeparture: "ΣΠΑΝΙΟΙ",
    bitcoinDeparture: "ΟΡΥΧΟΙ",
    arcFinal: "ΚΥΒΕΡ",
  },
  tr: {
    stableDeparture: "BAĞLILAR",
    nftDeparture: "NADİRLER",
    bitcoinDeparture: "MADENCİLER",
    arcFinal: "SİBERLER",
  },
  id: {
    stableDeparture: "TERIKAT",
    nftDeparture: "LANGKA",
    bitcoinDeparture: "PENAMBANG",
    arcFinal: "CYBER",
  },
  vi: {
    stableDeparture: "KẺ GẮN KẾT",
    nftDeparture: "KẺ HIẾM",
    bitcoinDeparture: "THỢ ĐÀO",
    arcFinal: "CYBER",
  },
  ar: {
    stableDeparture: "المُرْتَبِطُون",
    nftDeparture: "النَّادِرُون",
    bitcoinDeparture: "العَادِنُون",
    arcFinal: "السايبر",
  },
  hi: {
    stableDeparture: "पैगधारी",
    nftDeparture: "दुर्लभ",
    bitcoinDeparture: "खनिक",
    arcFinal: "साइबर",
  },
  th: {
    stableDeparture: "ผู้ถูกตรึง",
    nftDeparture: "ผู้หายาก",
    bitcoinDeparture: "นักขุด",
    arcFinal: "ไซเบอร์",
  },
  ja: {
    stableDeparture: "縛られし者",
    nftDeparture: "稀有なる者",
    bitcoinDeparture: "採掘者",
    arcFinal: "サイバーたち",
  },
  ko: {
    stableDeparture: "묶인 자",
    nftDeparture: "희귀한 자",
    bitcoinDeparture: "채굴자",
    arcFinal: "사이버들",
  },
  zh: {
    stableDeparture: "绑定者",
    nftDeparture: "稀有者",
    bitcoinDeparture: "矿工",
    arcFinal: "赛博们",
  },
  pl: {
    stableDeparture: "PRZYWIĄZANI",
    nftDeparture: "RZADCY",
    bitcoinDeparture: "MINERZY",
    arcFinal: "KYBEROWIE",
  },
  cs: {
    stableDeparture: "NAVÁZANÍ",
    nftDeparture: "VZÁCNÍ",
    bitcoinDeparture: "TĚŽAŘI",
    arcFinal: "KYBEROVÉ",
  },
  uk: {
    stableDeparture: "ПРИВ’ЯЗАНІ",
    nftDeparture: "РЕДКІ",
    bitcoinDeparture: "МАЙНЕРИ",
    arcFinal: "КІБЕРИ",
  },
  en: {
    stableDeparture: "PEGGED",
    nftDeparture: "RARE",
    bitcoinDeparture: "MINERS",
    arcFinal: "CYBERS",
  },
};

const CROWD_FALLBACK: Record<string, string> = {
  ru: "ЖИТЕЛИ",
  es: "HABITANTES",
  pt: "HABITANTES",
  fr: "HABITANTS",
  it: "ABITANTI",
  de: "EINWOHNER",
  nl: "INWONERS",
  sv: "INVÅNARE",
  da: "INDBOERE",
  no: "INNBYGGERNE",
  fi: "ASUKKAAT",
  hu: "LAKOSOK",
  ro: "LOCUITORI",
  el: "ΚΑΤΟΙΚΟΙ",
  tr: "SAKİNLER",
  id: "PENHUNI",
  vi: "CƯ DÂN",
  ar: "السُّكَّان",
  hi: "लोक",
  th: "ประชากร",
  ja: "住民",
  ko: "주민",
  zh: "居民",
  pl: "MIESZKAŃCY",
  cs: "OBYVATELÉ",
  uk: "ЖИТЕЛІ",
  en: "CROWD",
};

type NameOpts = { planet?: Planet; phase?: Phase; sceneKey?: string };

function sceneKeyOf(opts?: NameOpts): string {
  if (opts?.sceneKey) return opts.sceneKey;
  if (opts?.planet && opts?.phase) {
    return opts.planet + opts.phase.charAt(0).toUpperCase() + opts.phase.slice(1);
  }
  return "";
}

export function getSpeakerName(who: string, lang: string, opts?: NameOpts): string {
  const base = String(lang || "").split("-")[0];

  if (who === "crowd") {
    const k = sceneKeyOf(opts);
    const direct = CROWD[base]?.[k];
    if (direct) return direct;

    if (base === "ru") return CROWD.ru[k] ?? CROWD_FALLBACK.ru;
    return CROWD.en[k] ?? CROWD_FALLBACK[base] ?? CROWD_FALLBACK.en;
  }

  return COMMON[base]?.[who] ?? COMMON_LATIN[who] ?? "";
}
