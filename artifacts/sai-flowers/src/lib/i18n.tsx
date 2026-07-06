import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import en from '../translations/en.json';
import mr from '../translations/mr.json';

type Language = 'en' | 'mr';

type Translations = typeof en;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  tArray: (key: string) => string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = { en, mr };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('sai-lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'mr')) {
      setLangState(savedLang);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('sai-lang', newLang);
  };

  const resolve = (path: string, language: Language): unknown => {
    const keys = path.split('.');
    let current: any = translations[language];
    for (const key of keys) {
      if (current == null || current[key] === undefined) return undefined;
      current = current[key];
    }
    return current;
  };

  const t = (path: string): string => {
    const value = resolve(path, lang) ?? resolve(path, 'en') ?? path;
    return Array.isArray(value) ? value.join(', ') : String(value);
  };

  const tArray = (path: string): string[] => {
    const value = resolve(path, lang) ?? resolve(path, 'en');
    if (Array.isArray(value)) return value as string[];
    return [];
  };

  useEffect(() => {
    if (lang === 'mr') {
      document.body.classList.add('lang-mr');
    } else {
      document.body.classList.remove('lang-mr');
    }
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tArray }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
