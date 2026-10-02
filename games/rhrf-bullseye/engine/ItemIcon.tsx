import React from "react";
import { type ShopIcon } from "./catalog";

type ItemLike = {
  id?: string;
  category?: string;
  rarity?: string;
  icon?: ShopIcon;
};

type Variant = ShopIcon | "unknown";

function Glyph({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width="100%"
      height="100%"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function Bow() {
  return (
    <>
      <path d="M28 10C13 19 13 45 28 54" />
      <path d="M28 10v44" />
      <path d="M28 32h18" />
      <path d="M46 32l-7-4v8z" fill="currentColor" stroke="none" />
    </>
  );
}

function Arrow() {
  return (
    <>
      <path d="M16 48 48 16" />
      <path d="M48 16l-9 2 2-9z" fill="currentColor" stroke="none" />
      <path d="M16 48l7-2" />
      <path d="M16 48l2-7" />
      <path d="M22 42l4 4" />
    </>
  );
}

function Armor() {
  return (
    <>
      <path
        className="rf-item-fill-bg"
        d="M32 7 50 14v18c0 12-8 19-18 25-10-6-18-13-18-25V14z"
      />
      <path d="M32 18v28" />
      <path d="M22 26h20" />
      <path d="M24 38h16" />
    </>
  );
}

function Energy() {
  return (
    <>
      <path d="M36 6 18 36h12l-4 22 22-32H34z" fill="currentColor" stroke="none" />
      <path d="M12 18h6" />
      <path d="M46 46h6" />
    </>
  );
}

function Amulet() {
  return (
    <>
      <path d="M18 10q14 12 28 0" />
      <path d="M32 22 42 36 32 54 22 36z" />
      <path d="M32 30v12" />
      <path d="M26 36h12" />
    </>
  );
}

function Clothes() {
  return (
    <>
      <circle cx="32" cy="12" r="6" />
      <path d="M23 23h18l4 18-7 2-2-9H28l-2 9-7-2z" />
      <path d="M23 23 13 33" />
      <path d="M41 23l10 10" />
      <path d="M28 41l-2 15" />
      <path d="M36 41l2 15" />
      <path d="M32 23v18" />
      <path d="M26 29h12" />
    </>
  );
}

function Cyber() {
  return (
    <>
      <path d="M32 9c4 0 7 3 7 7s-3 7-7 7-7-3-7-7 3-7 7-7z" />
      <path d="M23 27h18l5 17-8-3-3 12-4-12-3 12-8-3z" />
      <path d="M23 27 12 35" />
      <path d="M41 27l11 8" />
      <path d="M28 44l-2 13" />
      <path d="M36 44l2 13" />
      <path d="M20 24 10 18l8 20z" fill="currentColor" stroke="none" opacity=".45" />
      <path d="M44 24 54 18l-8 20z" fill="currentColor" stroke="none" opacity=".45" />
    </>
  );
}

function Unknown() {
  return (
    <>
      <circle cx="32" cy="32" r="18" />
      <path d="M32 20v24" />
      <path d="M20 32h24" />
    </>
  );
}

function shapeFor(v: Variant): React.ReactNode {
  switch (v) {
    case "bow":
      return <Bow />;
    case "arrow":
      return <Arrow />;
    case "armor":
      return <Armor />;
    case "energy":
      return <Energy />;
    case "amulet":
      return <Amulet />;
    case "clothes":
      return <Clothes />;
    case "cyber":
      return <Cyber />;
    default:
      return <Unknown />;
  }
}

export default function ItemIcon({ item }: { item: ItemLike }) {
  const id = String(item.id ?? "").toLowerCase();
  const category = String(item.category ?? "").toLowerCase();

  let variant: Variant = item.icon ?? "unknown";

  if (!item.icon) {
    if (id.includes("cyber")) variant = "cyber";
    else if (id.includes("arrow")) variant = "arrow";
    else if (id.includes("armor")) variant = "armor";
    else if (id.includes("energy")) variant = "energy";
    else if (category === "bow") variant = "bow";
    else if (category === "hat") variant = "clothes";
    else if (category === "amulet") variant = "amulet";
    else if (category === "consumable") variant = "energy";
  }

  return (
    <div className={`rf-shop-item-icon rf-item-icon--${variant}`} aria-hidden="true">
      <Glyph>{shapeFor(variant)}</Glyph>
    </div>
  );
}
