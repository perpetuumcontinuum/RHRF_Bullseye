const WIDE: Array<[number, number]> = [
  [0x1100, 0x115f],
  [0x2e80, 0x303e],
  [0x3041, 0x33ff],
  [0x3400, 0x4dbf],
  [0x4e00, 0x9fff],
  [0xa000, 0xa4cf],
  [0xa960, 0xa97f],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x20000, 0x2fffd],
  [0x30000, 0x3fffd],
];

const NO_START = new Set<number>([
  0x3001, 0x3002, 0x3005, 0x300d, 0x300e, 0x300f, 0x3010, 0x3011,
  0x3015, 0x3016, 0x3017, 0x3018, 0x3019, 0x301e, 0x301f, 0x303b,
  0x303c, 0x3041, 0x3043, 0x3045, 0x3047, 0x3049, 0x305d, 0x305f,
  0x3061, 0x3063, 0x3065, 0x3067, 0x3069, 0x3085, 0x3087, 0x308f,
  0x3094, 0x3095, 0x3096, 0x309b, 0x309c, 0x30a1, 0x30a3, 0x30a5,
  0x30a7, 0x30a9, 0x30c3, 0x30c6, 0x30fc, 0x30e5, 0x30e7, 0x30ee,
  0x30f5, 0x30f6, 0x31f0, 0x31f1, 0x31f2, 0x31f3, 0x31f4, 0x31fd,
  0x31fe, 0x31ff, 0xff01, 0xff02, 0xff05, 0xff06, 0xff07, 0xff0c,
  0xff0e, 0xff1a, 0xff1b, 0xff1f, 0xff20, 0xff61, 0xff62, 0xff63,
  0xfe30, 0xfe31, 0xfe33, 0xfe34, 0xfe4f, 0x2010, 0x2013, 0x2014,
  0x2020, 0x2021, 0x2025, 0x2030, 0x2032, 0x2033, 0x203a, 0x2044,
  0x2e, 0x2c, 0x3a, 0x3b, 0x21, 0x3f, 0x25,
]);

const COMBINING = new Set<number>([
  0x0e31, 0x0e34, 0x0e35, 0x0e36, 0x0e37, 0x0e38, 0x0e39, 0x0e3a,
  0x0e47, 0x0e48, 0x0e49, 0x0e4a, 0x0e4b, 0x0e4c, 0x0e4d, 0x0e4e,
  0x0eb1, 0x0eb4, 0x0eb5, 0x0eb6, 0x0eb7, 0x0eb8, 0x0eb9, 0x0eba,
  0x0ecc, 0x0ecd,
]);

function isWide(cp: number): boolean {
  for (const [lo, hi] of WIDE) if (cp >= lo && cp <= hi) return true;
  return false;
}

export function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (COMBINING.has(cp)) continue;
    w += isWide(cp) ? 2 : 1;
  }
  return w;
}

function clusterize(s: string): string[] {
  const out: string[] = [];
  let buf = "";
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    if (COMBINING.has(cp) || (cp >= 0x200d && cp <= 0x200f)) {
      buf += ch;
      continue;
    }
    if (buf) out.push(buf);
    buf = ch;
  }
  if (buf) out.push(buf);
  return out;
}

type Tok = { t: string; gap: number };

function tokenize(text: string): Tok[] {
  const out: Tok[] = [];
  const chars = Array.from(text);
  let buf = "";
  let pendingGap = 0;

  const flush = () => {
    if (!buf) return;
    out.push({ t: buf, gap: pendingGap });
    buf = "";
    pendingGap = 0;
  };

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cp = ch.codePointAt(0)!;

    if (ch === " " || ch === "\n" || ch === "\t") {
      flush();
      pendingGap = 1;
      continue;
    }

    if (COMBINING.has(cp)) {
      buf += ch;
      continue;
    }

    if (isWide(cp)) {
      flush();
      let unit = ch;
      while (i + 1 < chars.length) {
        const ncp = chars[i + 1].codePointAt(0)!;
        if (NO_START.has(ncp) || COMBINING.has(ncp)) unit += chars[++i];
        else break;
      }
      out.push({ t: unit, gap: pendingGap });
      pendingGap = 0;
      continue;
    }

    buf += ch;
  }
  flush();
  return out;
}

export function wrapText(text: string, maxCols: number): string[] {
  const limit = Math.max(8, Math.floor(maxCols));
  const toks = tokenize(String(text || ""));
  if (!toks.length) return [""];

  const lines: string[] = [];
  let cur = "";
  let curW = 0;

  const append = (t: string, gap: number) => {
    cur += (gap && cur ? " " : "") + t;
    curW += (gap && curW ? 1 : 0) + displayWidth(t);
  };

  for (const { t, gap } of toks) {
    const w = displayWidth(t);
    const sep = gap && curW ? 1 : 0;

    if (curW + sep + w > limit) {
      if (cur) {
        lines.push(cur);
        cur = "";
        curW = 0;
      }
      if (w > limit) {
        let part = "";
        let partW = 0;
        for (const cl of clusterize(t)) {
          const cw = displayWidth(cl);
          if (partW + cw > limit && part) {
            lines.push(part);
            part = "";
            partW = 0;
          }
          part += cl;
          partW += cw;
        }
        cur = part;
        curW = partW;
        continue;
      }
    }

    append(t, gap);
  }

  if (cur) lines.push(cur);
  return lines.length ? lines : [""];
}
