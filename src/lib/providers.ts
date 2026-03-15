export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
}

export interface ProviderGuide {
  steps: { de: string; en: string }[];
  url?: string;
}

export interface EmailProvider {
  id: string;
  name: string;
  domains: string[];
  imap: ImapConfig;
  smtp: SmtpConfig;
  guide: ProviderGuide;
}

export const providers: EmailProvider[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    domains: ['gmail.com', 'googlemail.com'],
    imap: { host: 'imap.gmail.com', port: 993, secure: true },
    smtp: { host: 'smtp.gmail.com', port: 465, secure: true },
    guide: {
      url: 'https://myaccount.google.com/apppasswords',
      steps: [
        {
          de: 'Rufe dein Google-Konto unter myaccount.google.com auf.',
          en: 'Go to your Google Account at myaccount.google.com',
        },
        {
          de: 'Wähle im linken Navigationsbereich „Sicherheit".',
          en: 'Select Security in the left navigation panel',
        },
        {
          de: 'Klicke unter „So meldest du dich bei Google an" auf „Bestätigung in zwei Schritten".',
          en: 'Under "How you sign in to Google", select 2-Step Verification',
        },
        {
          de: 'Scrolle nach unten und wähle „App-Passwörter".',
          en: 'At the bottom of the page, select App passwords',
        },
        {
          de: 'Gib einen Namen ein (z. B. WipeMe) und klicke auf „Erstellen".',
          en: 'Enter a name (e.g. WipeMe) and click Create',
        },
        {
          de: 'Kopiere das angezeigte 16-stellige Passwort und füge es hier ein.',
          en: 'Copy the 16-character password shown and paste it here',
        },
      ],
    },
  },
  {
    id: 'outlook',
    name: 'Outlook / Hotmail',
    domains: ['outlook.com', 'hotmail.com', 'live.com', 'msn.com'],
    imap: { host: 'outlook.office365.com', port: 993, secure: true },
    smtp: { host: 'smtp.office365.com', port: 587, secure: false },
    guide: {
      url: 'https://account.microsoft.com/security',
      steps: [
        {
          de: 'Rufe account.microsoft.com auf und melde dich an.',
          en: 'Go to account.microsoft.com and sign in',
        },
        {
          de: 'Wähle „Sicherheit" und dann „Erweiterte Sicherheitsoptionen".',
          en: 'Select Security, then Advanced security options',
        },
        {
          de: 'Klicke unter „App-Passwörter" auf „Neues App-Passwort erstellen".',
          en: 'Under App passwords, select Create a new app password',
        },
        {
          de: 'Kopiere das generierte Passwort und füge es hier ein.',
          en: 'Copy the generated password and paste it here',
        },
        {
          de: 'Hinweis: Bei moderner Authentifizierung musst du IMAP ggf. in den Outlook-Einstellungen aktivieren.',
          en: 'Note: If you use modern authentication, you may need to allow IMAP in Outlook settings',
        },
      ],
    },
  },
  {
    id: 'gmx',
    name: 'GMX',
    domains: ['gmx.de', 'gmx.net', 'gmx.at', 'gmx.ch'],
    imap: { host: 'imap.gmx.net', port: 993, secure: true },
    smtp: { host: 'mail.gmx.net', port: 465, secure: true },
    guide: {
      url: 'https://www.gmx.net/mail/einstellungen/',
      steps: [
        {
          de: 'Melde dich bei GMX an und öffne die Einstellungen.',
          en: 'Log in to GMX and open Settings (Einstellungen)',
        },
        {
          de: 'Gehe zu E-Mail → Externer Zugriff (POP3 & IMAP).',
          en: 'Navigate to E-Mail → External access (POP3 & IMAP)',
        },
        {
          de: 'Aktiviere den IMAP-Zugriff.',
          en: 'Enable IMAP access',
        },
        {
          de: 'Verwende dein normales GMX-Passwort — kein App-Passwort erforderlich.',
          en: 'Use your normal GMX password — no app password required',
        },
      ],
    },
  },
  {
    id: 'webde',
    name: 'web.de',
    domains: ['web.de'],
    imap: { host: 'imap.web.de', port: 993, secure: true },
    smtp: { host: 'smtp.web.de', port: 465, secure: true },
    guide: {
      url: 'https://web.de/einstellungen/',
      steps: [
        {
          de: 'Melde dich bei web.de an und öffne die Einstellungen.',
          en: 'Log in to web.de and open Settings (Einstellungen)',
        },
        {
          de: 'Gehe zu E-Mail → Externer Zugriff (POP3 & IMAP).',
          en: 'Navigate to E-Mail → External access (POP3 & IMAP)',
        },
        {
          de: 'Aktiviere den IMAP-Zugriff.',
          en: 'Enable IMAP access',
        },
        {
          de: 'Verwende dein normales web.de-Passwort — kein App-Passwort erforderlich.',
          en: 'Use your normal web.de password — no app password required',
        },
      ],
    },
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    domains: ['yahoo.com', 'yahoo.de', 'yahoo.co.uk', 'yahoo.fr', 'ymail.com'],
    imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.yahoo.com', port: 465, secure: true },
    guide: {
      url: 'https://login.yahoo.com/account/security',
      steps: [
        {
          de: 'Rufe die Yahoo-Kontosicherheitsseite auf.',
          en: 'Go to your Yahoo Account Security page',
        },
        {
          de: 'Scrolle zum Abschnitt „Weitere Anmeldemöglichkeiten".',
          en: 'Scroll to the "Other ways to sign in" section',
        },
        {
          de: 'Klicke auf „App-Passwort generieren".',
          en: 'Click "Generate app password"',
        },
        {
          de: 'Wähle „Andere App" und gib WipeMe ein.',
          en: 'Select "Other app" and enter WipeMe',
        },
        {
          de: 'Kopiere das generierte Passwort und füge es hier ein.',
          en: 'Copy the generated password and paste it here',
        },
      ],
    },
  },
  {
    id: 'icloud',
    name: 'iCloud Mail',
    domains: ['icloud.com', 'me.com', 'mac.com'],
    imap: { host: 'imap.mail.me.com', port: 993, secure: true },
    smtp: { host: 'smtp.mail.me.com', port: 587, secure: false },
    guide: {
      url: 'https://appleid.apple.com/account/manage',
      steps: [
        {
          de: 'Rufe appleid.apple.com auf und melde dich an.',
          en: 'Go to appleid.apple.com and sign in',
        },
        {
          de: 'Klicke im Bereich „Anmeldung und Sicherheit" auf „App-spezifische Passwörter".',
          en: 'In the Sign-In and Security section, click App-Specific Passwords',
        },
        {
          de: 'Klicke auf das +-Symbol, um ein neues App-Passwort zu erstellen.',
          en: 'Click the + button to generate a new app password',
        },
        {
          de: 'Gib „WipeMe" als Bezeichnung ein und klicke auf „Erstellen".',
          en: 'Enter "WipeMe" as the label and click Create',
        },
        {
          de: 'Kopiere das angezeigte Passwort und füge es hier ein.',
          en: 'Copy the password shown and paste it here',
        },
      ],
    },
  },
  {
    id: 'proton',
    name: 'Proton Mail',
    domains: ['protonmail.com', 'protonmail.ch', 'proton.me', 'pm.me'],
    imap: { host: '127.0.0.1', port: 1143, secure: false },
    smtp: { host: '127.0.0.1', port: 1025, secure: false },
    guide: {
      url: 'https://proton.me/mail/bridge',
      steps: [
        {
          de: 'Proton Mail benötigt die Proton Mail Bridge Desktop-App für den IMAP-Zugriff.',
          en: 'Proton Mail requires the Proton Mail Bridge desktop app for IMAP access',
        },
        {
          de: 'Lade Proton Bridge unter proton.me/mail/bridge herunter und installiere sie.',
          en: 'Download and install Proton Bridge from proton.me/mail/bridge',
        },
        {
          de: 'Melde dich in Proton Bridge mit deinem Proton-Konto an.',
          en: 'Sign in to Proton Bridge with your Proton account',
        },
        {
          de: 'Suche in Bridge das IMAP-Passwort für dein Konto.',
          en: 'In Bridge, find the IMAP password for your account',
        },
        {
          de: 'WipeMe verbindet sich mit Bridge, das lokal läuft.',
          en: 'WipeMe will connect to Bridge running on localhost',
        },
      ],
    },
  },
  {
    id: 'tonline',
    name: 'T-Online',
    domains: ['t-online.de', 'magenta.de'],
    imap: { host: 'secureimap.t-online.de', port: 993, secure: true },
    smtp: { host: 'securesmtp.t-online.de', port: 465, secure: true },
    guide: {
      url: 'https://www.t-online.de/email/einstellungen/',
      steps: [
        {
          de: 'Melde dich bei email.t-online.de an.',
          en: 'Log in to email.t-online.de',
        },
        {
          de: 'Öffne Einstellungen → E-Mail-Programme / mobile Geräte.',
          en: 'Open Settings → Email programs / mobile devices',
        },
        {
          de: 'IMAP ist standardmäßig aktiviert.',
          en: 'IMAP is enabled by default',
        },
        {
          de: 'Verwende deine T-Online-E-Mail-Adresse und dein Kontokennwort.',
          en: 'Use your T-Online email address and account password',
        },
      ],
    },
  },
  {
    id: 'custom',
    name: 'Custom / Other',
    domains: [],
    imap: { host: '', port: 993, secure: true },
    smtp: { host: '', port: 465, secure: true },
    guide: {
      steps: [
        {
          de: 'Gib den Hostnamen und Port deines IMAP-Servers ein.',
          en: 'Enter your IMAP server hostname and port',
        },
        {
          de: 'Gib den Hostnamen und Port deines SMTP-Servers ein.',
          en: 'Enter your SMTP server hostname and port',
        },
        {
          de: 'Verwende deine E-Mail-Adresse und dein Kontokennwort (oder ein App-Passwort, falls verfügbar).',
          en: 'Use your email address and account password (or app password if available)',
        },
        {
          de: 'Kontaktiere deinen E-Mail-Anbieter für spezifische Servereinstellungen.',
          en: 'Contact your email provider for specific server settings',
        },
      ],
    },
  },
];

export function detectProvider(email: string): EmailProvider {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return providers[providers.length - 1];

  const match = providers.find((p) => p.domains.includes(domain));
  return match ?? providers[providers.length - 1];
}
