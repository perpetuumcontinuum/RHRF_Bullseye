import { SPRITE_CACHE } from "./sprite-cache";

type Rec = { familyId: number; seed: number; generation: number; frames: string[] };
const CACHE = SPRITE_CACHE as Record<string, Rec>;

const ids = Object.keys(CACHE).map(BigInt);
const cmp = (a: bigint, b: bigint) => Number(a - b);
const GEN1 = ids.filter((id) => CACHE[id.toString()].generation === 1).sort(cmp);
const OTHER = ids.filter((id) => CACHE[id.toString()].generation !== 1).sort(cmp);

export const PLANETS = ["stable", "nft", "bitcoin"] as const;
export type ResidentPlanet = (typeof PLANETS)[number];

const FILLER_PER_PLANET = 5;
const BG_COUNT = 3;
const idx = (p: ResidentPlanet) => Math.max(0, PLANETS.indexOf(p));

export function leaderFor(planet: ResidentPlanet): bigint {
  return GEN1.length ? GEN1[idx(planet) % GEN1.length] : 65007n;
}

export function fillerFor(planet: ResidentPlanet): readonly bigint[] {
  const start = idx(planet) * FILLER_PER_PLANET;
  const out: bigint[] = [];
  for (let k = 0; k < FILLER_PER_PLANET && OTHER.length; k++) out.push(OTHER[(start + k) % OTHER.length]);
  return out;
}

export const NFT_BG_TOKENS: readonly bigint[] = (() => {
  const from = PLANETS.length * FILLER_PER_PLANET;
  const tail = OTHER.slice(from, from + BG_COUNT);
  if (tail.length >= BG_COUNT) return tail;
  const out = [...tail];
  for (let k = 0; out.length < BG_COUNT && OTHER.length; k++) {
    const t = OTHER[(from + k) % OTHER.length];
    if (!out.includes(t)) out.push(t);
  }
  return out;
})();

export function bgTokenFor(slot: number): bigint {
  const pool = NFT_BG_TOKENS.length ? NFT_BG_TOKENS : OTHER;
  return pool.length ? pool[slot % pool.length] : leaderFor("nft");
}

export function residentTokenFor(i: number, repIndex: number, planet: ResidentPlanet): bigint {
  if (i === repIndex) return leaderFor(planet);
  const k = i < repIndex ? i : i - 1;
  const f = fillerFor(planet);
  return f.length ? f[k % f.length] : leaderFor(planet);
}

export const LEADER_TOKEN: bigint = leaderFor("stable");
export const GEN1_RESERVE: readonly bigint[] = [];
export const CROWD_FILLER: readonly bigint[] = fillerFor("stable");
export const BG_TOKENS: readonly bigint[] = NFT_BG_TOKENS;
