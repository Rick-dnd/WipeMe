export interface MatchPatterns {
  subjectPatterns: RegExp[];
  fromDomainBlacklist: string[];
}

export const matchPatterns: MatchPatterns = {
  subjectPatterns: [
    /\bwelcome\b/i,
    /\bwillkommen\b/i,
    /\bverify\s+(your\s+)?email/i,
    /\be-?mail\s+(bestätigen|verifizieren)/i,
    /\bconfirm\s+(your\s+)?(email|account|registration)/i,
    /\bbestätige?\s+(deine?|ihre?)\s+(e-?mail|registrierung|konto)/i,
    /\baccount\s+created/i,
    /\bkonto\s+(erstellt|angelegt)/i,
    /\bregistration\s+(successful|confirmed|complete)/i,
    /\bregistrierung\s+(erfolgreich|bestätigt|abgeschlossen)/i,
    /\bsign[\s-]?up\s+(confirmed|successful|complete)/i,
    /\banmeldung\s+(erfolgreich|bestätigt)/i,
    /\bactivate\s+(your\s+)?(account|email)/i,
    /\baktivier(e|ung)\s+(dein|ihr)\s+(konto|e-?mail)/i,
    /\byou[''']?re\s+(in|registered)/i,
    /\byou\s+have\s+(successfully\s+)?registered/i,
    /\bthanks?\s+for\s+(signing\s+up|registering|joining|creating)/i,
    /\bdanke?\s+für\s+(deine?\s+)?registrierung/i,
    /\bget\s+started\s+with\b/i,
    /\bfinish\s+(setting\s+up|your\s+registration)/i,
    /\bcomplete\s+(your\s+)?(registration|sign[\s-]?up)/i,
    /\bone\s+more\s+step/i,
    /\bfast\s+geschafft\b/i,
    /\bjust\s+one\s+more\s+step/i,
    /\byour\s+(new\s+)?account\b/i,
    /\bdein\s+(neues?\s+)?konto\b/i,
    /\bpassword\s+(created|set|reset)\b/i,
    /\bpasswort\s+(erstellt|gesetzt|zurückgesetzt)\b/i,
    /\bplease\s+verify\b/i,
    /\bbitte\s+bestätige?\b/i,
    /\bwir\s+haben\s+(deine?|ihre?)\s+(registrierung|anmeldung)\b/i,
  ],

  fromDomainBlacklist: [
    'mailchimp.com',
    'sendgrid.net',
    'constantcontact.com',
    'klaviyo.com',
    'hubspot.com',
    'salesforce.com',
    'pardot.com',
    'marketo.com',
    'mailgun.org',
    'postmarkapp.com',
    'sendinblue.com',
    'brevo.com',
    'aweber.com',
    'campaignmonitor.com',
    'activecampaign.com',
    'drip.com',
    'convertkit.com',
    'omnisend.com',
    'moosend.com',
    'getresponse.com',
    'list-manage.com',
    'bounce.linkedin.com',
    'em.netflix.com',
    'email.spotify.com',
    'mailer.twitter.com',
    'facebookmail.com',
    'notification.instagram.com',
  ],
};

const NOISE_WORDS = new Set([
  'welcome', 'willkommen', 'hello', 'hallo', 'hi', 'dear', 'liebe',
  'noreply', 'no-reply', 'no_reply', 'donotreply', 'do-not-reply',
  'notifications', 'newsletter', 'info', 'support', 'team', 'mail',
  'email', 'account', 'accounts', 'service', 'services', 'reply',
  'mailer', 'automated', 'notification',
]);

function titleCase(str: string): string {
  return str
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function extractServiceName(from: string, subject: string): string {
  const displayNameMatch = from.match(/^"?([^"<@]+)"?\s*</);
  if (displayNameMatch) {
    const raw = displayNameMatch[1].trim();
    const lower = raw.toLowerCase();
    if (!NOISE_WORDS.has(lower) && raw.length > 1 && raw.length < 60) {
      return raw.replace(/\s+(team|support|notifications?|no.?reply)$/i, '').trim();
    }
  }

  const emailMatch = from.match(/@([^>.\s]+)\.[a-z]{2,}/i);
  if (emailMatch) {
    const domain = emailMatch[1].toLowerCase();
    if (!NOISE_WORDS.has(domain)) {
      return titleCase(domain);
    }
  }

  const subjectServiceMatch = subject.match(
    /(?:welcome\s+to|willkommen\s+bei|your\s+account\s+at|thank\s+you\s+for\s+(?:joining|registering\s+(?:with|at)))\s+(.+?)(?:\s*[!.,]|$)/i,
  );
  if (subjectServiceMatch) {
    const candidate = subjectServiceMatch[1].trim();
    if (candidate.length > 1 && candidate.length < 60) {
      return candidate;
    }
  }

  const domainMatch = from.match(/[\w.-]+@([\w-]+(?:\.[\w-]+)*\.[a-z]{2,})/i);
  if (domainMatch) {
    const parts = domainMatch[1].split('.');
    const name = parts[parts.length - 2] ?? parts[0];
    return titleCase(name);
  }

  return 'Unknown Service';
}

export function extractDomainFromAddress(from: string): string | null {
  const match = from.match(/<[^>]*@([\w.-]+)>/) ?? from.match(/@([\w.-]+)/);
  if (!match) return null;
  const domain = match[1].toLowerCase();
  return domain.length > 0 ? domain : null;
}

export const newsletterPatterns: RegExp[] = [
  /\bunsubscribe\b/i,
  /\babmelden\b/i,
  /\bnewsletter\b/i,
  /\babonnement\b/i,
  /\bsubscription\s+(confirmed|active)/i,
  /\bweekly\s+(digest|update|recap)/i,
  /\bmonthly\s+(digest|update|recap)/i,
  /\bdaily\s+digest\b/i,
  /\babo\s+bestätigt\b/i,
];

export function isNewsletterEmail(subject: string, _from: string): boolean {
  return newsletterPatterns.some((pattern) => pattern.test(subject));
}

export function isAccountEmail(subject: string, from: string): boolean {
  const fromDomain = from.match(/@([\w.-]+)/i)?.[1]?.toLowerCase() ?? '';

  const isBlacklisted = matchPatterns.fromDomainBlacklist.some(
    (d) => fromDomain === d || fromDomain.endsWith(`.${d}`),
  );
  if (isBlacklisted) return false;

  return matchPatterns.subjectPatterns.some((pattern) => pattern.test(subject));
}

export const responsePatterns: RegExp[] = [
  /daten.*gelöscht/i,
  /löschung.*bestätigt/i,
  /erasure.*completed/i,
  /data.*deleted/i,
  /request.*processed/i,
  /your.*data.*has.*been.*removed/i,
  /löschantrag.*bearbeitet/i,
  /deletion.*request.*fulfilled/i,
  /wir haben.*gelöscht/i,
  /account.*closed/i,
  /konto.*geschlossen/i,
  /your.*account.*has.*been.*deleted/i,
  /dein.*konto.*wurde.*gelöscht/i,
];

export function isResponseEmail(subject: string): boolean {
  return responsePatterns.some((p) => p.test(subject));
}
