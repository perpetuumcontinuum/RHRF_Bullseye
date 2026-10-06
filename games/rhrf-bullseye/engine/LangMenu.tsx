import React from "react";
import { langs, setLang, useLang, translate } from "./i18n";

// Четвёртый оверлей в ряду Shop/Profile/Guide: паузу/звук/hotkey-lock даёт
// isMenuOpenRef() в index.tsx, здесь только выбор языка.
export default function LangMenu({ onClose, onSelect }: { onClose: () => void; onSelect: () => void }) {
  const lang = useLang();
  const title = translate(lang, "lang.title");
  const list = langs();

  const pick = (code: string) => {
    setLang(code);
    onSelect();
  };

  return (
    <div className="rf-lang-overlay" onClick={onClose}>
      <div className="rf-lang-panel" onClick={(e) => e.stopPropagation()}>
        <div className="rf-lang-header">
          <div className="rf-lang-title">{title}</div>
          <button className="rf-lang-close" onClick={onClose}>X</button>
        </div>
        <div className="rf-lang-grid">
          {list.map((code, i) => {
            const native = translate(code, "lang.self");
            const label = native === "lang.self" ? code.toUpperCase() : native;
            return (
              <button
                key={code}
                className={`rf-lang-option${code === lang ? " active" : ""}`}
                style={{ ["--i" as any]: i } as any}
                onClick={() => pick(code)}
              >
                <span className="rf-lang-code">{code.toUpperCase()}</span>
                <span className="rf-lang-name">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}