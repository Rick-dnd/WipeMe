export type LegalRegion = 'eu' | 'uk' | 'us' | 'brazil' | 'india' | 'south_korea' | 'thailand' | 'japan' | 'canada' | 'other';

export interface LegalFramework {
  region: LegalRegion;
  name: { de: string; en: string };
  article: { de: string; en: string };
  deadlineDays: number;
  enforcementBody: { de: string; en: string };
}

const EU_COUNTRIES = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  'IS', 'LI', 'NO', // EEA
]);

export function regionFromCountry(countryCode: string | undefined): LegalRegion {
  if (!countryCode) return 'eu';
  const code = countryCode.toUpperCase();
  if (EU_COUNTRIES.has(code)) return 'eu';
  if (code === 'GB') return 'uk';
  if (code === 'US') return 'us';
  if (code === 'BR') return 'brazil';
  if (code === 'IN') return 'india';
  if (code === 'KR') return 'south_korea';
  if (code === 'TH') return 'thailand';
  if (code === 'JP') return 'japan';
  if (code === 'CA') return 'canada';
  return 'other';
}

export const FRAMEWORKS: Record<LegalRegion, LegalFramework> = {
  eu: {
    region: 'eu',
    name: { de: 'DSGVO', en: 'GDPR' },
    article: { de: 'Art. 17 DSGVO', en: 'Art. 17 GDPR' },
    deadlineDays: 30,
    enforcementBody: {
      de: 'die zuständige Datenschutzaufsichtsbehörde',
      en: 'the competent data protection supervisory authority',
    },
  },
  uk: {
    region: 'uk',
    name: { de: 'UK GDPR', en: 'UK GDPR' },
    article: { de: 'Art. 17 UK GDPR', en: 'Art. 17 UK GDPR' },
    deadlineDays: 30,
    enforcementBody: {
      de: 'das Information Commissioner\'s Office (ICO)',
      en: 'the Information Commissioner\'s Office (ICO)',
    },
  },
  us: {
    region: 'us',
    name: { de: 'CCPA/CPRA', en: 'CCPA/CPRA' },
    article: {
      de: '§ 1798.105 California Consumer Privacy Act',
      en: '§ 1798.105 California Consumer Privacy Act',
    },
    deadlineDays: 45,
    enforcementBody: {
      de: 'die California Privacy Protection Agency (CPPA)',
      en: 'the California Privacy Protection Agency (CPPA)',
    },
  },
  brazil: {
    region: 'brazil',
    name: { de: 'LGPD', en: 'LGPD' },
    article: {
      de: 'Art. 18 Lei Geral de Proteção de Dados',
      en: 'Art. 18 Lei Geral de Proteção de Dados',
    },
    deadlineDays: 15,
    enforcementBody: {
      de: 'die Autoridade Nacional de Proteção de Dados (ANPD)',
      en: 'the Autoridade Nacional de Proteção de Dados (ANPD)',
    },
  },
  india: {
    region: 'india',
    name: { de: 'DPDPA', en: 'DPDPA' },
    article: { de: 'Section 13 Digital Personal Data Protection Act', en: 'Section 13 Digital Personal Data Protection Act' },
    deadlineDays: 90,
    enforcementBody: { de: 'das Data Protection Board of India (DPBI)', en: 'the Data Protection Board of India (DPBI)' },
  },
  south_korea: {
    region: 'south_korea',
    name: { de: 'PIPA', en: 'PIPA' },
    article: { de: 'Article 36 Personal Information Protection Act', en: 'Article 36 Personal Information Protection Act' },
    deadlineDays: 14,
    enforcementBody: { de: 'die Personal Information Protection Commission (PIPC)', en: 'the Personal Information Protection Commission (PIPC)' },
  },
  thailand: {
    region: 'thailand',
    name: { de: 'PDPA', en: 'PDPA' },
    article: { de: 'Section 33 Personal Data Protection Act', en: 'Section 33 Personal Data Protection Act' },
    deadlineDays: 90,
    enforcementBody: { de: 'das Personal Data Protection Committee (PDPC)', en: 'the Personal Data Protection Committee (PDPC)' },
  },
  japan: {
    region: 'japan',
    name: { de: 'APPI', en: 'APPI' },
    article: { de: 'Article 35 Act on Protection of Personal Information', en: 'Article 35 Act on Protection of Personal Information' },
    deadlineDays: 21,
    enforcementBody: { de: 'die Personal Information Protection Commission (PPC)', en: 'the Personal Information Protection Commission (PPC)' },
  },
  canada: {
    region: 'canada',
    name: { de: 'Gesetz 25', en: 'Law 25' },
    article: { de: 'Section 28 Loi 25', en: 'Section 28 Law 25' },
    deadlineDays: 30,
    enforcementBody: { de: "die Commission d'accès à l'information du Québec (CAI)", en: "the Commission d'accès à l'information du Québec (CAI)" },
  },
  other: {
    region: 'other',
    name: { de: 'DSGVO', en: 'GDPR' },
    article: { de: 'Art. 17 DSGVO', en: 'Art. 17 GDPR' },
    deadlineDays: 30,
    enforcementBody: {
      de: 'die zuständige Datenschutzaufsichtsbehörde',
      en: 'the competent data protection supervisory authority',
    },
  },
};

export type ServiceCategory =
  | 'social media' | 'commerce' | 'finance' | 'entertainment'
  | 'telecommunication' | 'ads' | 'health' | 'travel'
  | 'insurance' | 'addresses' | 'credit agency' | 'utility'
  | 'collection agency' | 'nonprofit' | 'church' | 'school'
  | 'political party' | 'public body';

const CATEGORY_DATA_DE: Partial<Record<ServiceCategory, string[]>> = {
  'social media': ['Profildaten', 'Beiträge und Kommentare', 'Likes und Reaktionen', 'Follower-/Freundeslisten', 'Direktnachrichten', 'hochgeladene Medien', 'KI-Trainingsdaten die aus meinen Inhalten abgeleitet wurden'],
  'commerce': ['Bestellhistorie', 'Zahlungsdaten', 'Lieferadressen', 'Wunschlisten', 'Bewertungen', 'Kundenkonto-Daten'],
  'finance': ['Kontodaten', 'Transaktionshistorie', 'KYC-Dokumente', 'Bonitätsdaten', 'Vertragsdokumente'],
  'entertainment': ['Wiedergabeverlauf', 'Watchlists und Playlists', 'Bewertungen und Empfehlungen', 'Abonnementdaten'],
  'telecommunication': ['Vertragsdaten', 'Rechnungen', 'Verbindungsdaten', 'Standortdaten'],
  'ads': ['Werbeprofile', 'Tracking-Daten', 'Interessen-Profile', 'Geräte-IDs', 'Cookie-Daten', 'KI-Trainingsdaten und Modell-Inputs', 'Inferenz-Protokolle und Konversationsdaten'],
  'health': ['Gesundheitsdaten', 'Fitness-Tracking-Daten', 'Versicherungsdaten', 'Arztberichte'],
  'travel': ['Buchungshistorie', 'Reisedaten', 'Vielfliegerprogramm-Daten', 'Ausweisdaten'],
  'insurance': ['Vertragsdaten', 'Schadensmeldungen', 'Gesundheitsdaten', 'Risikobewertungen'],
  'credit agency': ['Bonitätsdaten', 'Zahlungshistorie', 'Scoring-Daten', 'Anfragen-Protokolle'],
};

const CATEGORY_DATA_EN: Partial<Record<ServiceCategory, string[]>> = {
  'social media': ['profile data', 'posts and comments', 'likes and reactions', 'follower/friend lists', 'direct messages', 'uploaded media', 'AI training data derived from my content'],
  'commerce': ['order history', 'payment data', 'shipping addresses', 'wishlists', 'reviews', 'account data'],
  'finance': ['account data', 'transaction history', 'KYC documents', 'credit data', 'contract documents'],
  'entertainment': ['watch/listen history', 'watchlists and playlists', 'ratings and recommendations', 'subscription data'],
  'telecommunication': ['contract data', 'billing records', 'connection metadata', 'location data'],
  'ads': ['advertising profiles', 'tracking data', 'interest profiles', 'device IDs', 'cookie data', 'AI training data and model inputs', 'inference logs and conversation data'],
  'health': ['health data', 'fitness tracking data', 'insurance data', 'medical reports'],
  'travel': ['booking history', 'travel data', 'loyalty program data', 'identity documents'],
  'insurance': ['contract data', 'claims', 'health data', 'risk assessments'],
  'credit agency': ['credit data', 'payment history', 'scoring data', 'inquiry logs'],
};

export function getCategoryData(
  categories: string[],
  language: 'de' | 'en',
): string[] {
  const map = language === 'de' ? CATEGORY_DATA_DE : CATEGORY_DATA_EN;
  const result = new Set<string>();
  for (const cat of categories) {
    const items = map[cat as ServiceCategory];
    if (items) items.forEach((item) => result.add(item));
  }
  return Array.from(result);
}
