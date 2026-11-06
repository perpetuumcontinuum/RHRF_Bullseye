export type SceneWho =
  | "rep"
  | "cyber"
  | "crowd"
  | "ether"
  | "elder"
  | "cyber_npc";

export type SceneAction = "armWave" | "giveBow";

export type SceneLine = { who: SceneWho; text: string; action?: SceneAction };

export type SceneKey =
  | "stableArrival"
  | "stableThanks"
  | "stableDeparture"
  | "nftArrival"
  | "nftThanks"
  | "nftDeparture"
  | "bitcoinArrival"
  | "bitcoinThanks"
  | "bitcoinDeparture"
  | "stableShield"
  | "nftShield"
  | "bitcoinShield"
  | "arcIntro"
  | "rwaIntro"
  | "rwaFarewell"
  | "arcFinal";

export type ScenesMap = Partial<Record<SceneKey, SceneLine[]>>;
