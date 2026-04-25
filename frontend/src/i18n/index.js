import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

const STORAGE_KEY = "i18nLang";

function setDocumentLang(lng) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.setAttribute("lang", lng);
  html.setAttribute("dir", lng === "ar" ? "rtl" : "ltr");
  try {
    document.title = i18n.getFixedT(lng)("app.browserTitle");
  } catch {
    document.title = "HealthHub";
  }
}

const stored =
  typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
const initial = stored === "en" || stored === "ar" ? stored : "ar";

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initial,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

setDocumentLang(i18n.language);
localStorage.setItem(STORAGE_KEY, i18n.language);

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
  setDocumentLang(lng);
});

export default i18n;
