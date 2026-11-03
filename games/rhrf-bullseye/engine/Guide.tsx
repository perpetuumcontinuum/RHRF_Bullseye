import React, { useEffect } from "react";
import { useT } from "./i18n";

type GuideProps = { onClose: () => void };

const CONTROLS: ReadonlyArray<{ tokens: string; act: string }> = [
  { tokens: "1", act: "guide.hk.laser" },
  { tokens: "2", act: "guide.hk.shot" },
  { tokens: "3", act: "guide.hk.jump" },
  { tokens: "Space", act: "guide.hk.pause" },
  { tokens: "TAB", act: "guide.hk.tabPause" },
  { tokens: "M", act: "guide.hk.sound" },
  { tokens: "S", act: "guide.hk.shop" },
  { tokens: "P", act: "guide.hk.profile" },
  { tokens: "G", act: "guide.hk.guide" },
  { tokens: "Esc", act: "guide.hk.close" },
];

const GLOSSARY: ReadonlyArray<{ term: string; key: string }> = [
  { term: "peg", key: "peg" },
  { term: "depeg", key: "depeg" },
  { term: "repeg", key: "repeg" },
  { term: "floor price", key: "floor_price" },
  { term: "hashrate", key: "hashrate" },
  { term: "orphan", key: "orphan" },
  { term: "reorg", key: "reorg" },
  { term: "mint", key: "mint" },
  { term: "remint", key: "remint" },
  { term: "soulbound", key: "soulbound" },
  { term: "provenance", key: "provenance" },
  { term: "allowlist", key: "allowlist" },
  { term: "gas war", key: "gas_war" },
  { term: "rug pull", key: "rug_pull" },
  { term: "fake drop", key: "fake_drop" },
  { term: "RF", key: "rf" },
];

const COLS = ["bow", "outfit", "amulet", "arrows", "energy", "shields"] as const;
const ROWS = ["base", "rare", "epic", "legendary"] as const;

const CELL: Record<(typeof ROWS)[number], Record<(typeof COLS)[number], string>> = {
  base: { bow: "1x", outfit: "1x", amulet: "1x", arrows: "1x", energy: "1x", shields: "0s" },
  rare: { bow: "x2", outfit: "x2", amulet: "x2", arrows: "x2", energy: "x2", shields: "-2s" },
  epic: { bow: "x3", outfit: "x3", amulet: "x3", arrows: "x3", energy: "x3", shields: "-4s" },
  legendary: { bow: "x4", outfit: "x4", amulet: "x4", arrows: "x4", energy: "x4", shields: "-6s" },
};

export default function Guide({ onClose }: GuideProps) {
  const t = useT();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="rf-guide-overlay" onClick={onClose}>
      <div className="rf-guide-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rf-guide-header">
          <div className="rf-guide-title">{t("guide.title")}</div>
          <button className="rf-guide-close" onClick={onClose} aria-label={t("guide.close")}>
            ✕
          </button>
        </div>

        <div className="rf-guide-body">
          <div className="rf-guide-section">
            <div className="rf-guide-section-title">{t("guide.general.title")}</div>

            <div className="rf-guide-sub">{t("guide.general.controls")}</div>
            <ul className="rf-guide-list rf-guide-list--compact">
              {CONTROLS.map((c) => (
                <li key={c.tokens}>
                  <span className="rf-guide-key">{c.tokens}</span>
                  <span> — </span>
                  <span>{t(c.act)}</span>
                </li>
              ))}
            </ul>

            <div className="rf-guide-sub">{t("guide.general.multipliers")}</div>
            <table className="rf-guide-table">
              <thead>
                <tr>
                  <th className="rf-guide-table-corner">{t("guide.tbl.items")}</th>
                  {COLS.map((c) => (
                    <th key={c}>{t(`guide.tbl.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r}>
                    <td className="rf-guide-table-row">{t(`guide.tbl.${r}`)}</td>
                    {COLS.map((c) => (
                      <td key={c}>{CELL[r][c]}</td>
                    ))}
                  </tr>
                ))}
                <tr className="rf-guide-table-cyber">
                  <td className="rf-guide-table-row">{t("guide.tbl.cyber")}</td>
                  <td className="rf-guide-table-cyber-note" colSpan={COLS.length}>
                    {t("guide.tbl.cyberNote")}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="rf-guide-sub">{t("guide.general.score")}</div>
            <ul className="rf-guide-list rf-guide-list--compact">
              <li>{t("guide.score.points")}</li>
              <li>{t("guide.score.rf")}</li>
            </ul>

            <div className="rf-guide-sub">{t("guide.general.beta")}</div>
            <div className="rf-guide-note">{t("guide.beta.text")}</div>
          </div>

          <div className="rf-guide-section">
            <div className="rf-guide-section-title">{t("guide.cp.title")}</div>
            <div className="rf-guide-note">{t("guide.cp.text")}</div>
          </div>

          <div className="rf-guide-section">
            <div className="rf-guide-section-title">{t("guide.lb.title")}</div>
            <div className="rf-guide-note">{t("guide.lb.text")}</div>
          </div>

          <div className="rf-guide-section">
            <div className="rf-guide-section-title">{t("guide.sing.title")}</div>
            <ul className="rf-guide-list rf-guide-list--compact">
              <li>{t("guide.sing.base")}</li>
              <li>{t("guide.sing.gold")}</li>
            </ul>
            <div className="rf-guide-note">{t("guide.sing.unlock")}</div>
          </div>
          <div className="rf-guide-section rf-guide-glossary">
            <div className="rf-guide-section-title">{t("guide.glossary.title")}</div>
            <ul className="rf-guide-list rf-guide-list--compact">
              {GLOSSARY.map((x) => (
                <li key={x.key}>
                  <span className="rf-guide-key">{x.term}</span>
                  <span> — </span>
                  <span>{t(`guide.glossary.${x.key}`)}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
