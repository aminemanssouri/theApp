import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Load English as default translations (will be updated by extractor)
import en from '../i18n/locales/en.json';

// Optionally load other locales if present
let it = {};
let ar = {};
try { it = require('../i18n/locales/it.json'); } catch (_) {}
try { ar = require('../i18n/locales/ar.json'); } catch (_) {}

const TRANSLATIONS = { en, it, ar };

// Simple interpolation: t('key', { name: 'John' })
function interpolate(str, params) {
  if (!params) return str;
  return Object.keys(params).reduce((acc, k) => acc.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), String(params[k])), str);
}

// Module-level state for a simple, importable t()
let currentLanguage = 'it';

export const rawT = (key, params) => {
  const dict = TRANSLATIONS[currentLanguage] || {};
  let val = key.split('.').reduce((obj, seg) => (obj && obj[seg] != null ? obj[seg] : undefined), dict);
  if (val == null) {
    // Fallback to English value if available
    const enDict = TRANSLATIONS.en || {};
    val = key.split('.').reduce((obj, seg) => (obj && obj[seg] != null ? obj[seg] : undefined), enDict);
  }
  const fallback = key;
  return interpolate(typeof val === 'string' ? val : fallback, params);
};

const LanguageContext = createContext({
  language: 'it',
  setLanguage: () => {},
  t: rawT,
});

export const LanguageProvider = ({ children, defaultLanguage = 'it' }) => {
  const [language, setLanguage] = useState(defaultLanguage);

  // keep module-level currentLanguage in sync so raw t() calls work anywhere
  currentLanguage = language;

  const ctx = useMemo(() => ({
    language,
    setLanguage,
    t: (key, params) => {
      const dict = TRANSLATIONS[language] || {};
      let val = key.split('.').reduce((obj, seg) => (obj && obj[seg] != null ? obj[seg] : undefined), dict);
      if (val == null) {
        const enDict = TRANSLATIONS.en || {};
        val = key.split('.').reduce((obj, seg) => (obj && obj[seg] != null ? obj[seg] : undefined), enDict);
      }
      const fallback = key;
      return interpolate(typeof val === 'string' ? val : fallback, params);
    },
  }), [language]);

  // Load persisted language on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('app_language');
        if (saved && (saved === 'en' || saved === 'it' || saved === 'ar')) {
          setLanguage(saved);
        }
      } catch (_) {
        // ignore
      }
    })();
  }, []);

  // Persist language on change
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('app_language', language);
      } catch (_) {
        // ignore
      }
    })();
  }, [language]);

  return (
    <LanguageContext.Provider value={ctx}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useI18n = () => useContext(LanguageContext);

// Named export t() to allow usage without hooks (safer for scripts/codemods)
export const t = (key, params) => rawT(key, params);

// Getter for non-React modules to access current language safely
export const getCurrentLanguage = () => currentLanguage;
