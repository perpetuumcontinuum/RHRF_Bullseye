import React from "react";

type ItemLike = {
  id?: string;
  category?: string;
  rarity?: string;
};

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
      <path d="M32 8 52 16v16c0 12-10 20-20 24-10-4-20-12-20-24V16z" />
      <path d="M32 16v32" />
      <path d="M20 24h24" />
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
      <path d="M20 14 32 10 44 14 52 24 46 30 44 26v28H20V26l-2 4-6-6z" />
      <path d="M32 10v44" />
      <path d="M24 18l4 6" />
      <path d="M40 18l-4 6" />
      <path d="M20 40h24" />
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

export default function ItemIcon({ item }: { item: ItemLike }) {
  const id = String(item.id ?? "").toLowerCase();
  const category = String(item.category ?? "").toLowerCase();

  let shape: React.ReactNode = <Unknown />;

  if (id.includes("arrow")) shape = <Arrow />;
  else if (id.includes("armor")) shape = <Armor />;
  else if (id.includes("energy")) shape = <Energy />;
  else if (category === "bow") shape = <Bow />;
  else if (category === "hat") shape = <Clothes />;
  else if (category === "amulet") shape = <Amulet />;
  else if (category === "consumable") shape = <Energy />;

  return (
    <div className="rf-shop-item-icon" aria-hidden="true">
      <Glyph>{shape}</Glyph>
    </div>
  );
}
