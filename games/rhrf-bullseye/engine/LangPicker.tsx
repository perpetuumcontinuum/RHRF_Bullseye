import React from "react";
import { langs, setLang, useLang, useT } from "./i18n";

export default function LangPicker() {
  const lang = useLang();
  const t = useT();
  return (
    <label className="rf-lang-picker" title={t("lang.label")}>
      <span className="rf-lang-tag">{t("lang.label")}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)}>
        {langs().map((code) => (
          <option key={code} value={code}>{code.toUpperCase()}</option>
        ))}
      </select>
    </label>
  );
}