import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MdPublic } from "react-icons/md";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher({ variant = "default" }) {
  const { i18n, t } = useTranslation();
  const LANGS = useMemo(
    () => [
      { code: "en", label: t("auth.langEn") },
      { code: "ar", label: t("auth.langAr") },
    ],
    [t]
  );
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const lng = i18n.resolvedLanguage || i18n.language;
  const isAr = lng === "ar" || lng?.startsWith("ar");
  const currentCode = isAr ? "ar" : "en";

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`lang-globe lang-globe--${variant} ${open ? "lang-globe--open" : ""}`}
    >
      <button
        type="button"
        className="lang-globe__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("app.chooseLanguage")}
        title={t("app.chooseLanguage")}
      >
        <span className="lang-globe__icon" aria-hidden>
          <MdPublic size={22} />
        </span>
        {variant === "auth" && (
          <span className="lang-globe__code">{isAr ? "ع" : "EN"}</span>
        )}
      </button>
      {open && (
        <div
          className="lang-globe__segment"
          role="radiogroup"
          aria-label={t("app.chooseLanguage")}
        >
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={currentCode === code}
              className={`lang-globe__seg${
                currentCode === code ? " lang-globe__seg--active" : ""
              }`}
              onClick={() => select(code)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
