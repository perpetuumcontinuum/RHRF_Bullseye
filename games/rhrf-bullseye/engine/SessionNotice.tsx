import React, { useState } from "react";
import { useT } from "./i18n";

// Non-blocking top banner. SDK v0.1.4 has no save API and no localStorage in
// the sandbox, so progress is session-only — this says so honestly. Dismissal
// is remembered in localStorage where available; in the sandbox it shows each load.
const KEY = "rhrf-bullseye:session-notice";

export default function SessionNotice() {
  const t = useT();
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(KEY) !== "1"; } catch { return true; }
  });
  if (!visible) return null;
  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(KEY, "1"); } catch {}
  };
  return (
    <div className="rf-notice-bar" role="alert">
      <span className="rf-notice-text">{t("notice.session")}</span>
      <button className="rf-notice-btn" onClick={dismiss}>{t("notice.ok")}</button>
    
      <div className="rf-notice-beta">{t("session.beta")}</div>
    </div>
  );
}
