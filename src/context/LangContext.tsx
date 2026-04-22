"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Lang, translations, TKey } from "@/lib/i18n";

type LangCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey) => string;
};

const LangContext = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = (key: TKey) => translations[lang][key] ?? translations.en[key] ?? key;
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
