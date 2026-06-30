export type BrandConfig = {
  name: string;
  logoText: string;
  domain: string;
  appDomain: string;
  studioDomain: string;
  supportEmail: string;
  slogans: {
    de: string;
    en: string;
  };
  landing: {
    ctaPrimary: {
      de: string;
      en: string;
    };
  };
};

export const BRAND: BrandConfig = {
  name: 'UREEL',
  logoText: 'UREEL',
  domain: 'ureel.me',
  appDomain: 'app.ureel.me',
  studioDomain: 'studio.ureel.me',
  supportEmail: 'office@ureel.me',
  slogans: {
    de: 'Aus Video wird Aktion.',
    en: 'Turn video into action.',
  },
  landing: {
    ctaPrimary: {
      de: 'Kostenlos starten',
      en: 'Start free',
    },
  },
};

export const brandText = (lang: 'de' | 'en' = 'de') => ({
  name: BRAND.name,
  logoText: BRAND.logoText,
  domain: BRAND.domain,
  slogan: BRAND.slogans[lang],
  ctaPrimary: BRAND.landing.ctaPrimary[lang],
});
