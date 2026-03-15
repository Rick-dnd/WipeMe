const SITE = 'https://wipeme.cc';

export interface Alternate {
  hreflang: string;
  href: string;
}

export function getCanonicalUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE}${clean}`;
}

export function getAlternates(dePath: string, enPath: string): Alternate[] {
  return [
    { hreflang: 'de', href: getCanonicalUrl(dePath) },
    { hreflang: 'en', href: getCanonicalUrl(enPath) },
    { hreflang: 'x-default', href: getCanonicalUrl(dePath) },
  ];
}

export function generateWebAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'WipeMe',
    url: SITE,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web',
    description: 'WipeMe scannt dein Postfach, findet jeden Dienst bei dem du angemeldet bist, und verschickt DSGVO-Löschanfragen für dich.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    featureList: [
      'IMAP inbox scanning',
      'GDPR/CCPA deletion request generation',
      'Zero-knowledge architecture',
      'Self-hosted',
      'Open source (MIT)',
    ],
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
  };
}

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WipeMe',
    url: SITE,
    logo: `${SITE}/logo.svg`,
  };
}

export function generateFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
