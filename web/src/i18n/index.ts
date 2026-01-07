import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ptBR from './locales/pt-BR.json';
import es from './locales/es.json';
import hi from './locales/hi.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';

const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
  pt: { translation: ptBR }, // Fallback for pt
  es: { translation: es },
  hi: { translation: hi },
  zh: { translation: zh },
  'zh-CN': { translation: zh }, // Simplified Chinese
  'zh-TW': { translation: zh }, // Traditional Chinese fallback
  ja: { translation: ja },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'pt-BR', 'pt', 'es', 'hi', 'zh', 'zh-CN', 'zh-TW', 'ja'],

    detection: {
      // Order of language detection
      order: ['navigator', 'htmlTag', 'localStorage'],
      // Cache user language preference
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
