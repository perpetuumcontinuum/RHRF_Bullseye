import React from "react";
import { langs, setLang, useLang, useT } from "./i18n";

function languageLabel(code: string): string {
  try {
    const DN = (Intl as any).DisplayNames;
    if (DN) {
      const dn = new DN([code], { type: "language" });
      return dn.of(code) || code.toUpperCase();
    }
  } catch {
    // ignore
  }
  return code.toUpperCase();
}

export default function EntryFlow({
  onEnterGame,
  loading = false,
}: {
  onEnterGame: () => void;
  loading?: boolean;
}) {
  const t = useT();
  const lang = useLang();
  const codes = React.useMemo(() => langs(), []);
  const [stage, setStage] = React.useState<"lang" | "mode">("lang");

  const pickLang = (code: string) => {
    setLang(code);
    setStage("mode");
  };

  return (
    <div className="rf-entry-screen" data-no-bubble-dismiss>
      <div className="rf-entry-panel" data-stage={stage}>
        <div className="rf-entry-logo">RHRF BULLSEYE</div>

        {loading && <div className="rf-entry-loading" role="status" aria-label="Loading" />}

        {stage === "lang" ? (
          <section className="rf-entry-stage rf-entry-stage--lang">
            <div className="rf-entry-title">{t("entry.lang.title")}</div>
            <div className="rf-entry-hint">{t("entry.lang.hint")}</div>

            <div className="rf-entry-lang-grid">
              {codes.map((code) => (
                <button
                  key={code}
                  type="button"
                  className={`rf-entry-lang${code === lang ? " active" : ""}`}
                  onClick={() => pickLang(code)}
                >
                  <span className="rf-entry-lang-code">{String(code).toUpperCase()}</span>
                  <span className="rf-entry-lang-name">{languageLabel(code)}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="rf-entry-stage rf-entry-stage--mode">
            <div className="rf-entry-title">{t("entry.mode.title")}</div>

            <div className="rf-entry-mode-grid">
              <button type="button" className="rf-entry-mode rf-entry-mode--plateau" disabled>
                <span className="rf-entry-mode-title">{t("entry.mode.plateau")}</span>
                <span className="rf-entry-mode-sub">{t("entry.mode.soon")}</span>
              </button>

              <button
                type="button"
                className="rf-entry-mode rf-entry-mode--leaderboard"
                onClick={onEnterGame}
              >
                <span className="rf-entry-mode-title">{t("entry.mode.leaderboard")}</span>
                <span className="rf-entry-mode-sub">{t("entry.mode.leaderboardHint")}</span>
              </button>
            </div>

            <button type="button" className="rf-entry-back" onClick={() => setStage("lang")}>
              {t("entry.mode.back")}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
