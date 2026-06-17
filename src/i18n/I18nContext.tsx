import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

export type AppLanguage = "en" | "ru";

type TranslationParams = Record<string, string | number>;

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string, params?: TranslationParams) => string;
};

const STORAGE_KEY = "archont_language";

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: {
    "language.label": "Language",
    "navigation.backLogin": "Back to Login",
    "navigation.backHome": "Back to Home page",
    "system.capacity": "Building capacity",
    "system.capacityHint": "Built structures compared with this system's available resource slots.",
    "system.mineSlots": "Mines",
    "system.energySlots": "Power Plants",
    "system.storageSlots": "Supply Depots",
    "system.researchSlots": "Research Centers",
    "system.noSlots": "Unavailable",
    "patchNotes.kicker": "ARCHONT development log",
    "patchNotes.title": "Patch Notes",
    "patchNotes.description":
      "A public chronological record of gameplay decisions, system changes, development milestones and design direction.",
    "patchNotes.back": "Back to Home page",
    "patchNotes.game-design": "Game design",
    "patchNotes.backend": "Backend",
    "patchNotes.frontend": "Frontend",
    "patchNotes.system": "System",
    "patchNotes.balance": "Balance"
  },
  ru: {
    "language.label": "Язык",
    "navigation.backLogin": "Назад ко входу",
    "navigation.backHome": "На главную",
    "system.capacity": "Ограничения строительства",
    "system.capacityHint": "Количество построек относительно доступных ресурсных слотов этой системы.",
    "system.mineSlots": "Шахты",
    "system.energySlots": "Энергоблоки",
    "system.storageSlots": "Склады снабжения",
    "system.researchSlots": "Исследовательские центры",
    "system.noSlots": "Недоступно",
    "patchNotes.kicker": "Журнал разработки ARCHONT",
    "patchNotes.title": "Патч-ноуты",
    "patchNotes.description":
      "Публичная хронология игровых решений, изменений систем, этапов разработки и развития проекта.",
    "patchNotes.back": "На главную",
    "patchNotes.game-design": "Геймдизайн",
    "patchNotes.backend": "Бэкенд",
    "patchNotes.frontend": "Фронтенд",
    "patchNotes.system": "Система",
    "patchNotes.balance": "Баланс"
  }
};

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, String(value)),
    template
  );
}

function getInitialLanguage(): AppLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === "en" || stored === "ru") {
    return stored;
  }

  return "en";
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    setLanguageState(nextLanguage);
  }, []);

  const t = useCallback(
    (key: string, params?: TranslationParams) => {
      const template =
        TRANSLATIONS[language][key] ?? TRANSLATIONS.en[key] ?? key;

      return interpolate(template, params);
    },
    [language]
  );

  useEffect(() => {
    document.documentElement.lang = language === "ru" ? "ru" : "en";
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }

  return context;
}
