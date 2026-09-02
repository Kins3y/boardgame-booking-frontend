import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useI18n, type AppLanguage } from "../i18n/I18nContext";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();
  const location = useLocation();
  const isGameplayPage = /^\/game\/sessions\/[^/]+\/play$/.test(location.pathname);
  const isGameLogsPage = /^\/game\/sessions\/[^/]+\/logs$/.test(location.pathname);
  const isCompactGameContext = isGameplayPage || isGameLogsPage;
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function chooseLanguage(nextLanguage: AppLanguage) {
    setLanguage(nextLanguage);
    setIsOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={`archont-language-switcher${isCompactGameContext ? " gameplay-language-switcher" : ""}`}
      title={t("language.label")}
    >
      <button
        type="button"
        className="archont-language-trigger"
        aria-label={t("language.label")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isCompactGameContext && (
          <span className="archont-language-globe" aria-hidden="true">
            ◉
          </span>
        )}
        {!isCompactGameContext && (
          <span className="archont-language-label">{t("language.label")}</span>
        )}
        <strong>{language.toUpperCase()}</strong>
        <span className="archont-language-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {isOpen && (
        <div className="archont-language-menu" role="menu">
          <button
            type="button"
            role="menuitemradio"
            aria-checked={language === "ru"}
            className={language === "ru" ? "active" : ""}
            onClick={() => chooseLanguage("ru")}
          >
            <span>Русский</span>
            <strong>RU</strong>
          </button>
          <button
            type="button"
            role="menuitemradio"
            aria-checked={language === "en"}
            className={language === "en" ? "active" : ""}
            onClick={() => chooseLanguage("en")}
          >
            <span>English</span>
            <strong>EN</strong>
          </button>
        </div>
      )}
    </div>
  );
}
