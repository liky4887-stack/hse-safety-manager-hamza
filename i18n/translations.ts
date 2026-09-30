import { useStore } from '@/store';
import { translations, isRTL } from '@/i18n/translations';
import type { Translation } from '@/i18n/translations';

export function useI18n(): { t: Translation; lang: 'ar' | 'en'; rtl: boolean; setLang: (l: 'ar' | 'en') => void } {
  const language = useStore((s) => s.language);
  const setLanguage = useStore((s) => s.setLanguage);
  return {
    t: translations[language],
    lang: language,
    rtl: isRTL(language),
    setLang: setLanguage,
  };
}
