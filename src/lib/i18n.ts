export type Language = 'de' | 'en';

export interface Translations {
  nav: {
    home: string;
    app: string;
    about: string;
  };
  setup: {
    connectEmail: string;
    emailAddress: string;
    appPassword: string;
    testConnection: string;
    connectedSuccessfully: string;
    connectionFailed: string;
    step1Description: string;
    providerDetected: (name: string) => string;
    createAppPassword: string;
    openProviderSettings: string;
    haveAppPassword: string;
    securityNotice: string;
    footerNotice: string;
  };
  scan: {
    scanInbox: string;
    scanning: string;
    scanningInbox: string;
    scanningDescription: string;
    foundServices: (count: number) => string;
    noServicesFound: string;
    noRegistrationEmails: string;
    emailsScanned: string;
    filterServices: string;
    selectAll: string;
    selectNone: string;
    noSearchResults: string;
    addManually: string;
    searchCompanies: string;
    addedSuccessfully: string;
    selectFolders: string;
    continueToScan: string;
    importPasswords: string;
    importNotice: string;
    importedServices: (count: number) => string;
    importFile: string;
    accounts: string;
    newsletters: string;
    all: string;
    newSinceLastScan: string;
    lastScanDate: string;
    recommendedDeletions: string;
    dataBrokerNotice: string;
    dropPlatformHint: string;
    showMore: string;
    addToList: string;
  };
  services: {
    service: string;
    difficulty: string;
    status: string;
    easy: string;
    medium: string;
    hard: string;
    impossible: string;
    sendDeletionRequest: string;
    openInEmailClient: string;
    selected: string;
    hardGuidance: string;
    impossibleGuidance: string;
    tryWebform: string;
    fileDpaComplaint: string;
  };
  templates: {
    deletionRequest: string;
    accessRequest: string;
    requestType: string;
    yourName: string;
    preview: string;
    send: string;
    sentSuccessfully: string;
    to: string;
    subject: string;
    recipientEmail: string;
    namePlaceholder: string;
    emailBody: string;
    edit: string;
    goDeletionPortal: string;
    batchSend: string;
    sendingProgress: (current: number, total: number) => string;
    batchComplete: string;
    successCount: (count: number) => string;
    failedCount: (count: number) => string;
    skippedNoEmail: string;
    startBatchSend: string;
  };
  tracking: {
    sentRequests: string;
    pending: string;
    deadlineExpired: string;
    completed: string;
    followUp: string;
    export: string;
    exportJson: string;
    exportCsv: string;
    exportPrint: string;
    exportCalendar: string;
    total: string;
    clearAll: string;
    clearAllTitle: string;
    clearAllDescription: string;
    noRequests: string;
    daysOverdue: (days: number) => string;
    daysLeft: (days: number) => string;
    done: string;
    sendFollowUp: string;
    followUpSent: string;
    followUpRecipient: string;
    noRecord: string;
    partial: string;
    rejected: string;
    markAs: string;
    enableNotifications: string;
    notificationsEnabled: string;
    checkResponses: string;
    possibleResponse: string;
    checking: string;
  };
  steps: {
    connect: string;
    scan: string;
    services: string;
    requests: string;
  };
  general: {
    settings: string;
    language: string;
    disconnect: string;
    cancel: string;
    confirm: string;
    back: string;
    next: string;
    loading: string;
    error: string;
    open: string;
    openRequests: (count: number) => string;
  };
  footer: {
    legal: string;
    privacy: string;
    faq: string;
    why: string;
    copy: string;
  };
  landing: {
    headline: string;
    subheadline: string;
    getStarted: string;
    howItWorks: string;
    yourDataStaysYours: string;
    openSource: string;
    step1: string;
    step2: string;
    step3: string;
  };
}

const de: Translations = {
  nav: {
    home: 'Startseite',
    app: 'App',
    about: 'Über uns',
  },
  setup: {
    connectEmail: 'E-Mail verbinden',
    emailAddress: 'E-Mail-Adresse',
    appPassword: 'App-Passwort',
    testConnection: 'Verbindung testen',
    connectedSuccessfully: 'Verbindung erfolgreich',
    connectionFailed: 'Verbindung fehlgeschlagen',
    step1Description: 'Gib deine E-Mail-Adresse ein — wir erkennen den Anbieter automatisch.',
    providerDetected: (name) => `${name} erkannt — Servereinstellungen automatisch ausgefüllt.`,
    createAppPassword: 'App-Passwort erstellen',
    openProviderSettings: 'Direkt zu den Einstellungen',
    haveAppPassword: 'Ich habe mein App-Passwort',
    securityNotice: 'Deine Zugangsdaten bleiben in deiner Browser-Sitzung und werden beim Schließen des Tabs gelöscht. Für Scan und Versand gehen sie verschlüsselt per HTTPS raus, werden nur kurz im Arbeitsspeicher verarbeitet und dann sofort verworfen.',
    footerNotice: 'Zugangsdaten bleiben in der Browser-Sitzung — bei uns wird nichts dauerhaft gespeichert. Open Source unter MIT-Lizenz.',
  },
  scan: {
    scanInbox: 'Posteingang durchsuchen',
    scanning: 'Wird durchsucht…',
    scanningInbox: 'Posteingang wird durchsucht…',
    scanningDescription: 'Wir schauen deine Mails nach Registrierungsbestätigungen durch. Kann ein paar Minuten dauern.',
    foundServices: (count) => `${count} Dienste gefunden`,
    noServicesFound: 'Keine Dienste gefunden',
    noRegistrationEmails: 'Wir haben keine Registrierungs-E-Mails gefunden.',
    emailsScanned: 'E-Mails gescannt',
    filterServices: 'Dienste filtern…',
    selectAll: 'Alle',
    selectNone: 'Keine',
    noSearchResults: 'Keine Ergebnisse für diese Suche.',
    addManually: 'Manuell hinzufügen',
    searchCompanies: 'Unternehmen suchen…',
    addedSuccessfully: 'Hinzugefügt',
    selectFolders: 'Ordner zum Scannen auswählen',
    continueToScan: 'Scan starten',
    importPasswords: 'Passwörter importieren',
    importNotice: 'Die Datei wird nur in deinem Browser verarbeitet. Passwörter werden ignoriert.',
    importedServices: (count) => `${count} neue Dienste importiert`,
    importFile: 'CSV-Datei auswählen',
    accounts: 'Accounts',
    newsletters: 'Newsletter',
    all: 'Alle',
    newSinceLastScan: 'Neu',
    lastScanDate: 'Letzter Scan',
    recommendedDeletions: 'Empfohlene Löschungen',
    dataBrokerNotice: 'Diese Datenbroker haben wahrscheinlich deine Daten — auch ohne Registrierung.',
    dropPlatformHint: 'Kalifornische Nutzer: Die DROP-Plattform ermöglicht Löschanfragen bei 500+ Datenbrokern gleichzeitig.',
    showMore: 'Mehr anzeigen',
    addToList: 'Hinzufügen',
  },
  services: {
    service: 'Dienst',
    difficulty: 'Schwierigkeit',
    status: 'Status',
    easy: 'Einfach',
    medium: 'Mittel',
    hard: 'Schwer',
    impossible: 'Unmöglich',
    sendDeletionRequest: 'Löschanfrage senden',
    openInEmailClient: 'Im E-Mail-Client öffnen',
    selected: 'ausgewählt',
    hardGuidance: 'Dieser Dienst reagiert oft langsam auf Löschanfragen. Bleib dran und sende ggf. eine Nachfassung.',
    impossibleGuidance: 'Löschung per E-Mail ist bei diesem Dienst sehr schwierig. Nutze wenn möglich das Webformular.',
    tryWebform: 'Webformular nutzen',
    fileDpaComplaint: 'Beschwerde bei Aufsichtsbehörde',
  },
  templates: {
    deletionRequest: 'Löschanfrage',
    accessRequest: 'Auskunftsanfrage',
    requestType: 'Anfragetyp',
    yourName: 'Ihr Name',
    preview: 'Vorschau',
    send: 'Senden',
    sentSuccessfully: 'Erfolgreich gesendet',
    to: 'An:',
    subject: 'Betreff:',
    recipientEmail: 'Empfänger-E-Mail',
    namePlaceholder: 'Max Mustermann',
    emailBody: 'E-Mail-Text',
    edit: 'Bearbeiten',
    goDeletionPortal: 'Direkt zum Löschportal',
    batchSend: 'Sammelversand',
    sendingProgress: (current, total) => `${current} von ${total}\u2026`,
    batchComplete: 'Versand abgeschlossen',
    successCount: (count) => `${count} erfolgreich`,
    failedCount: (count) => `${count} fehlgeschlagen`,
    skippedNoEmail: 'Übersprungen (keine E-Mail)',
    startBatchSend: 'Alle senden',
  },
  tracking: {
    sentRequests: 'Gesendete Anfragen',
    pending: 'Ausstehend',
    deadlineExpired: 'Frist abgelaufen',
    completed: 'Abgeschlossen',
    followUp: 'Nachfassen',
    export: 'Exportieren',
    exportJson: 'Als JSON',
    exportCsv: 'Als CSV',
    exportPrint: 'Drucken',
    exportCalendar: 'Kalender (.ics)',
    total: 'Gesamt',
    clearAll: 'Alle löschen',
    clearAllTitle: 'Alle Daten löschen?',
    clearAllDescription: 'Damit werden alle gespeicherten Anfragen, Dienste und Zugangsdaten endgültig gelöscht.',
    noRequests: 'Du hast noch keine Löschanfragen gesendet.',
    daysOverdue: (days) => `${days}T überfällig`,
    daysLeft: (days) => `${days}T verbleibend`,
    done: 'Erledigt',
    sendFollowUp: 'Nachfassung senden',
    followUpSent: 'Nachfassung erfolgreich gesendet',
    followUpRecipient: 'Empfänger',
    noRecord: 'Keine Daten',
    partial: 'Teilweise',
    rejected: 'Abgelehnt',
    markAs: 'Markieren als\u2026',
    enableNotifications: 'Erinnerungen',
    notificationsEnabled: 'Erinnerungen aktiv',
    checkResponses: 'Antworten prüfen',
    possibleResponse: 'Mögliche Antwort gefunden',
    checking: 'Wird geprüft\u2026',
  },
  steps: {
    connect: 'Verbinden',
    scan: 'Scannen',
    services: 'Dienste',
    requests: 'Anfragen',
  },
  general: {
    settings: 'Einstellungen',
    language: 'Sprache',
    disconnect: 'Trennen',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    back: 'Zurück',
    next: 'Weiter',
    loading: 'Wird geladen…',
    error: 'Fehler',
    open: 'offen',
    openRequests: (count) => `${count} offene Anfragen`,
  },
  footer: {
    legal: 'Impressum',
    privacy: 'Datenschutz',
    faq: 'FAQ',
    why: 'Warum WipeMe',
    copy: 'WipeMe \u00B7 Open Source \u00B7 MIT-Lizenz',
  },
  landing: {
    headline: 'Hol dir deine Daten zurück',
    subheadline:
      'WipeMe durchsucht dein Postfach, findet jeden Dienst bei dem du angemeldet bist, und verschickt Löschanfragen für dich. Läuft im Browser, bei uns wird nichts gespeichert.',
    getStarted: 'Loslegen',
    howItWorks: 'So geht\u2019s',
    yourDataStaysYours: 'Wir können deine Daten gar nicht sehen',
    openSource: 'Open Source',
    step1: 'Schritt 1: Verbinden',
    step2: 'Schritt 2: Scannen',
    step3: 'Schritt 3: Löschen',
  },
};

const en: Translations = {
  nav: {
    home: 'Home',
    app: 'App',
    about: 'About',
  },
  setup: {
    connectEmail: 'Connect your email',
    emailAddress: 'Email address',
    appPassword: 'App password',
    testConnection: 'Test connection',
    connectedSuccessfully: 'Connected successfully',
    connectionFailed: 'Connection failed',
    step1Description: 'Type in your email address — we\'ll detect your provider automatically.',
    providerDetected: (name) => `${name} detected — server settings filled in.`,
    createAppPassword: 'Create an app password',
    openProviderSettings: 'Open provider settings',
    haveAppPassword: 'I have my app password',
    securityNotice: 'Your credentials stay in your browser session and get wiped when you close the tab. For scanning and sending, they go out encrypted over HTTPS, get processed briefly in memory, and are thrown away right after.',
    footerNotice: 'Credentials stay in your browser session — nothing stored on our end. Open source under MIT license.',
  },
  scan: {
    scanInbox: 'Scan inbox',
    scanning: 'Scanning...',
    scanningInbox: 'Looking through your inbox…',
    scanningDescription: 'Checking your emails for signup confirmations. This can take a few minutes.',
    foundServices: (count) => `Found ${count} services`,
    noServicesFound: 'No services found',
    noRegistrationEmails: 'Didn\'t find any registration emails.',
    emailsScanned: 'emails scanned',
    filterServices: 'Filter services…',
    selectAll: 'All',
    selectNone: 'None',
    noSearchResults: 'No results for this search.',
    addManually: 'Add manually',
    searchCompanies: 'Search companies…',
    addedSuccessfully: 'Added',
    selectFolders: 'Select folders to scan',
    continueToScan: 'Start scan',
    importPasswords: 'Import passwords',
    importNotice: 'The file is only processed in your browser. Passwords are ignored.',
    importedServices: (count) => `${count} new services imported`,
    importFile: 'Select CSV file',
    accounts: 'Accounts',
    newsletters: 'Newsletters',
    all: 'All',
    newSinceLastScan: 'New',
    lastScanDate: 'Last scan',
    recommendedDeletions: 'Recommended deletions',
    dataBrokerNotice: 'These data brokers likely have your data — even without registration.',
    dropPlatformHint: 'California residents: The DROP platform lets you request deletion from 500+ data brokers at once.',
    showMore: 'Show more',
    addToList: 'Add',
  },
  services: {
    service: 'Service',
    difficulty: 'Difficulty',
    status: 'Status',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
    impossible: 'Impossible',
    sendDeletionRequest: 'Send deletion request',
    openInEmailClient: 'Open in email client',
    selected: 'selected',
    hardGuidance: 'This service often responds slowly to deletion requests. Follow up if needed.',
    impossibleGuidance: 'Deletion via email is very difficult for this service. Use the web form if available.',
    tryWebform: 'Use web form',
    fileDpaComplaint: 'File complaint with authority',
  },
  templates: {
    deletionRequest: 'Deletion request',
    accessRequest: 'Access request',
    requestType: 'Request type',
    yourName: 'Your name',
    preview: 'Preview',
    send: 'Send',
    sentSuccessfully: 'Sent successfully',
    to: 'To:',
    subject: 'Subject:',
    recipientEmail: 'Recipient email',
    namePlaceholder: 'Jane Smith',
    emailBody: 'Email body',
    edit: 'Edit',
    goDeletionPortal: 'Go to deletion portal',
    batchSend: 'Batch send',
    sendingProgress: (current, total) => `${current} of ${total}\u2026`,
    batchComplete: 'Sending complete',
    successCount: (count) => `${count} successful`,
    failedCount: (count) => `${count} failed`,
    skippedNoEmail: 'Skipped (no email)',
    startBatchSend: 'Send all',
  },
  tracking: {
    sentRequests: 'Sent requests',
    pending: 'Pending',
    deadlineExpired: 'Deadline expired',
    completed: 'Completed',
    followUp: 'Follow up',
    export: 'Export',
    exportJson: 'As JSON',
    exportCsv: 'As CSV',
    exportPrint: 'Print',
    exportCalendar: 'Calendar (.ics)',
    total: 'Total',
    clearAll: 'Clear all',
    clearAllTitle: 'Clear all data?',
    clearAllDescription: 'This deletes all your stored requests, services, and credentials for good.',
    noRequests: 'No deletion requests sent yet.',
    daysOverdue: (days) => `${days}d overdue`,
    daysLeft: (days) => `${days}d left`,
    done: 'Done',
    sendFollowUp: 'Send follow-up',
    followUpSent: 'Follow-up sent successfully',
    followUpRecipient: 'Recipient',
    noRecord: 'No record',
    partial: 'Partial',
    rejected: 'Rejected',
    markAs: 'Mark as\u2026',
    enableNotifications: 'Reminders',
    notificationsEnabled: 'Reminders active',
    checkResponses: 'Check responses',
    possibleResponse: 'Possible response found',
    checking: 'Checking\u2026',
  },
  steps: {
    connect: 'Connect',
    scan: 'Scan',
    services: 'Services',
    requests: 'Requests',
  },
  general: {
    settings: 'Settings',
    language: 'Language',
    disconnect: 'Disconnect',
    cancel: 'Cancel',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    loading: 'Loading...',
    error: 'Error',
    open: 'open',
    openRequests: (count) => `${count} open requests`,
  },
  footer: {
    legal: 'Legal Notice',
    privacy: 'Privacy Policy',
    faq: 'FAQ',
    why: 'Why WipeMe',
    copy: 'WipeMe \u00B7 Open Source \u00B7 MIT License',
  },
  landing: {
    headline: 'Take back your data',
    subheadline:
      'WipeMe scans your inbox, finds every service you signed up for, and sends deletion requests on your behalf. Runs in your browser, nothing gets saved on our end.',
    getStarted: 'Get started',
    howItWorks: 'How it works',
    yourDataStaysYours: 'We can\'t see your data',
    openSource: 'Open source',
    step1: 'Step 1: Connect',
    step2: 'Step 2: Scan',
    step3: 'Step 3: Delete',
  },
};

const translationMap: Record<Language, Translations> = { de, en };

export function getTranslations(lang: Language): Translations {
  return translationMap[lang];
}

export function useTranslation(lang: Language): Translations {
  return translationMap[lang];
}
