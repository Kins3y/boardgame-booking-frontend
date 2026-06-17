import { useI18n, type AppLanguage } from "../i18n/I18nContext";
import "./LanguageSwitcher.css";

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className="archont-language-switcher">
      <span>{t("language.label")}</span>
      <select
        aria-label={t("language.label")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as AppLanguage)}
      >
        <option value="en">EN</option>
        <option value="ru">RUS</option>
      </select>
    </label>
  );
}
