import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

import en from './locales/en.json';
import ar from './locales/ar.json';

const LANGUAGE_KEY = 'user-language';

const resources = {
  en,
  ar,
};

export const initI18n = async () => {
  let savedLanguage = null;
  let deviceLanguage = 'ar';

  if (Platform.OS !== 'web' || typeof window !== 'undefined') {
    try {
      savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      deviceLanguage = Localization.getLocales()[0]?.languageCode === 'en' ? 'en' : 'ar';
    } catch (e) {
      console.warn('Error getting language settings:', e);
    }
  }
  
  const currentLanguage = savedLanguage || deviceLanguage;

  const isRTL = currentLanguage === 'ar';
  
  if (Platform.OS !== 'web' || typeof window !== 'undefined') {
    try {
      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
      }
    } catch (e) {
      console.warn('Error setting RTL:', e);
    }
  }

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: currentLanguage,
      fallbackLng: 'ar',
      interpolation: {
        escapeValue: false, // react already safes from xss
      },
    });

  return i18n;
};

export const switchLanguage = async (lang: 'en' | 'ar') => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  await i18n.changeLanguage(lang);
  
  const isRTL = lang === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    
    // Automatically reload app to apply native RTL/LTR physical changes as per user agreement
    setTimeout(() => {
      Updates.reloadAsync();
    }, 100);
  }
};

export default i18n;
