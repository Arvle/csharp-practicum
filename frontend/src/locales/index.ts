import { ru } from './ru';

export const locales = {
  ru
};

export type LocaleKey = keyof typeof locales;

export const useTranslation = () => {
  const currentLocale = 'ru';
  
  return {
    t: locales[currentLocale],
    locale: currentLocale
  };
};