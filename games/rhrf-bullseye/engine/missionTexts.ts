import { translate } from "./i18n";

export type MissionRarity = "rare" | "epic" | "legendary";
export type MissionSupplyKind = "arrow" | "energy" | "armor";

export interface MissionTexts {
  mission: string;
  activateTower: string;
  leavePlanet: string;
  openProfile: string;
  equipCyber: string;
  hitBullseye: string;
  enterPortal: string;
  required: string;
  locked: string;
  done: string;
  ok: string;
  pressG: string;
  tapBeam: string;
  missions: string;
  planets: Record<string, string>;
  bow: Record<MissionRarity, string>;
  outfit: Record<MissionRarity, string>;
  amulet: Record<MissionRarity, string>;
  supply: Record<MissionRarity, Record<MissionSupplyKind, string>>;
}

const EN: MissionTexts = {
  mission: "MISSION",
  activateTower: "ACTIVATE TOWER",
  leavePlanet: "LEAVE PLANET",
  openProfile: "OPEN PROFILE",
  equipCyber: "EQUIP CYBER IN PROFILE",
  hitBullseye: "HIT BULLSEYE x10",
  enterPortal: "ENTER PORTAL",
  required: "REQUIRED",
  locked: "LOCKED",
  done: "DONE",
  ok: "OK",
  pressG: "PRESS G",
  tapBeam: "TAP BEAM",
  missions: "MISSIONS",
  planets: {
    cyber: "CYBER LEADERBOARD",
    stable: "STABLE",
    nft: "NFT",
    bitcoin: "BITCOIN",
    rwa: "RWA",
  },
  bow: {
    rare: "RARE BOW",
    epic: "EPIC BOW",
    legendary: "LEGENDARY BOW",
  },
  outfit: {
    rare: "RARE OUTFIT",
    epic: "EPIC OUTFIT",
    legendary: "LEGENDARY OUTFIT",
  },
  amulet: {
    rare: "RARE AMULET",
    epic: "EPIC AMULET",
    legendary: "LEGENDARY AMULET",
  },
  supply: {
    rare: {
      arrow: "RARE ARROWS",
      energy: "RARE ENERGY",
      armor: "RARE SHIELDS",
    },
    epic: {
      arrow: "EPIC ARROWS",
      energy: "EPIC ENERGY",
      armor: "EPIC SHIELDS",
    },
    legendary: {
      arrow: "LEGENDARY ARROWS",
      energy: "LEGENDARY ENERGY",
      armor: "LEGENDARY SHIELDS",
    },
  },
};

export function normalizeMissionRarity(value?: string): MissionRarity {
  const s = String(value || "").toLowerCase();
  if (s.includes("legend")) return "legendary";
  if (s.includes("epic")) return "epic";
  return "rare";
}

export function getMissionTexts(lang: string): MissionTexts {
  const tr = (k: string, fb: string) => translate(lang, k, undefined, fb);
  return {
    mission: tr("mission.mission", EN.mission),
    activateTower: tr("mission.activateTower", EN.activateTower),
    leavePlanet: tr("mission.leavePlanet", EN.leavePlanet),
    openProfile: tr("mission.openProfile", EN.openProfile),
    equipCyber: tr("mission.equipCyber", EN.equipCyber),
    hitBullseye: tr("mission.hitBullseye", EN.hitBullseye),
    enterPortal: tr("mission.enterPortal", EN.enterPortal),
    required: tr("mission.required", EN.required),
    locked: tr("mission.locked", EN.locked),
    done: tr("mission.done", EN.done),
    ok: tr("mission.ok", EN.ok),
    pressG: tr("mission.pressG", EN.pressG),
    tapBeam: tr("mission.tapBeam", EN.tapBeam),
    missions: tr("mission.missions", EN.missions),
    planets: {
      cyber: tr("mission.planets.cyber", EN.planets.cyber),
      stable: tr("mission.planets.stable", EN.planets.stable),
      nft: tr("mission.planets.nft", EN.planets.nft),
      bitcoin: tr("mission.planets.bitcoin", EN.planets.bitcoin),
      rwa: tr("mission.planets.rwa", EN.planets.rwa),
    },
    bow: {
      rare: tr("mission.bow.rare", EN.bow.rare),
      epic: tr("mission.bow.epic", EN.bow.epic),
      legendary: tr("mission.bow.legendary", EN.bow.legendary),
    },
    outfit: {
      rare: tr("mission.outfit.rare", EN.outfit.rare),
      epic: tr("mission.outfit.epic", EN.outfit.epic),
      legendary: tr("mission.outfit.legendary", EN.outfit.legendary),
    },
    amulet: {
      rare: tr("mission.amulet.rare", EN.amulet.rare),
      epic: tr("mission.amulet.epic", EN.amulet.epic),
      legendary: tr("mission.amulet.legendary", EN.amulet.legendary),
    },
    supply: {
      rare: {
        arrow: tr("mission.supply.rare.arrow", EN.supply.rare.arrow),
        energy: tr("mission.supply.rare.energy", EN.supply.rare.energy),
        armor: tr("mission.supply.rare.armor", EN.supply.rare.armor),
      },
      epic: {
        arrow: tr("mission.supply.epic.arrow", EN.supply.epic.arrow),
        energy: tr("mission.supply.epic.energy", EN.supply.epic.energy),
        armor: tr("mission.supply.epic.armor", EN.supply.epic.armor),
      },
      legendary: {
        arrow: tr("mission.supply.legendary.arrow", EN.supply.legendary.arrow),
        energy: tr("mission.supply.legendary.energy", EN.supply.legendary.energy),
        armor: tr("mission.supply.legendary.armor", EN.supply.legendary.armor),
      },
    },
  };
}
