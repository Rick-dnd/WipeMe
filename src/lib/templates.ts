import type { Language } from './i18n.ts';
import { FRAMEWORKS, getCategoryData, type LegalRegion } from './legal-frameworks.ts';

export interface DeletionRequestParams {
  language: Language;
  userName: string;
  userEmail: string;
  serviceName: string;
  region?: LegalRegion;
  categories?: string[];
  additionalInfo?: string;
}

export interface FollowUpRequestParams {
  language: Language;
  userName: string;
  userEmail: string;
  serviceName: string;
  originalRequestDate: string;
  region?: LegalRegion;
}

export interface EmailTemplate {
  subject: string;
  body: string;
}

function buildDataScope(
  language: Language,
  _serviceName: string,
  categories: string[],
  _framework: typeof FRAMEWORKS['eu'],
): string {
  const categoryItems = getCategoryData(categories, language);

  const baseItems = language === 'de'
    ? [
      'alle Profil- und Kontodaten',
      'alle von mir erstellten oder hochgeladenen Inhalte',
      'alle Protokoll- und Nutzungsdaten',
      'alle durch Cookies oder ähnliche Technologien erhobenen Daten',
      'alle an Dritte weitergegebenen Kopien meiner Daten',
    ]
    : [
      'all profile and account data',
      'all content I have created or uploaded',
      'all log and usage data',
      'all data collected via cookies or similar technologies',
      'all copies of my data that have been shared with third parties',
    ];

  const combined = [...baseItems];
  for (const item of categoryItems) {
    if (!combined.some((b) => b.toLowerCase().includes(item.toLowerCase()))) {
      combined.push(item);
    }
  }

  return combined.map((item) => `- ${item}`).join('\n');
}

function generateGdprDe(
  params: DeletionRequestParams,
  fw: typeof FRAMEWORKS['eu'],
): EmailTemplate {
  const { userName, userEmail, serviceName, additionalInfo } = params;
  const dataScope = buildDataScope('de', serviceName, params.categories ?? [], fw);

  const subject = `Antrag auf Löschung personenbezogener Daten gemäß ${fw.article.de}`;

  const body = `Sehr geehrte Damen und Herren,

hiermit fordere ich Sie auf, alle mich betreffenden personenbezogenen Daten gemäß ${fw.article.de} unverzüglich zu löschen.

Meine Kontaktdaten:
Name: ${userName}
E-Mail-Adresse: ${userEmail}
${additionalInfo ? `Weitere Informationen: ${additionalInfo}\n` : ''}
Umfang der Löschung:

Ich beantrage die vollständige und unwiderrufliche Löschung aller mich betreffenden personenbezogenen Daten, die ${serviceName} gespeichert hat oder verarbeitet. Dies umfasst insbesondere:

${dataScope}

Begründung:

Ich widerrufe hiermit ausdrücklich jede von mir erteilte Einwilligung zur Verarbeitung meiner personenbezogenen Daten.

Sofern Sie die Verarbeitung meiner Daten auf berechtigte Interessen stützen, widerspreche ich dieser Verarbeitung. Ich sehe keinen überwiegenden berechtigten Grund für die Fortführung der Verarbeitung.

Drittparteien:

Soweit Sie meine personenbezogenen Daten an Dritte weitergegeben haben, sind Sie verpflichtet, diesen Dritten meine Löschanforderung mitzuteilen. Ich bitte um Auskunft, welche Dritten informiert wurden.

Backup- und Archivierungssysteme:

Ich weise ausdrücklich darauf hin, dass meine Daten auch aus sämtlichen Backup- und Archivierungssystemen gelöscht werden müssen. Eine Auslagerung in Backup-Systeme stellt keine rechtmäßige Alternative zur vollständigen Löschung dar.

Frist:

Sie sind verpflichtet, mir unverzüglich, spätestens aber innerhalb von ${fw.deadlineDays} Tagen nach Eingang dieses Antrags, Auskunft über die ergriffenen Maßnahmen zu erteilen.

Begründungspflicht:

Sollten Sie die Löschung ganz oder teilweise ablehnen, sind Sie gemäß ${fw.article.de} verpflichtet, mir die Rechtsgrundlage und den konkreten Grund für jede Ausnahme unverzüglich schriftlich mitzuteilen.

Ich bitte Sie, mir schriftlich zu bestätigen, dass alle meine personenbezogenen Daten gelöscht wurden. Bei Nichtbeachtung behalte ich mir vor, eine Beschwerde bei ${fw.enforcementBody.de} einzureichen.

Mit freundlichen Grüßen,
${userName}
${userEmail}`;

  return { subject, body };
}

function generateGdprEn(
  params: DeletionRequestParams,
  fw: typeof FRAMEWORKS['eu'],
): EmailTemplate {
  const { userName, userEmail, serviceName, additionalInfo } = params;
  const dataScope = buildDataScope('en', serviceName, params.categories ?? [], fw);

  const subject = `Request for erasure of personal data under ${fw.article.en}`;

  const body = `Dear Sir or Madam,

I am hereby requesting the immediate erasure of all personal data concerning me, pursuant to ${fw.article.en}.

My contact details:
Name: ${userName}
Email address: ${userEmail}
${additionalInfo ? `Additional information: ${additionalInfo}\n` : ''}
Scope of erasure:

I request the complete and irreversible erasure of all personal data that ${serviceName} has stored or is processing. This includes in particular:

${dataScope}

Legal basis:

I hereby explicitly withdraw any consent I have given to the processing of my personal data.

To the extent that you base the processing of my data on legitimate interests, I object to such processing. I do not see any overriding legitimate reason for the continued processing.

Third parties:

Where you have shared my personal data with third parties, you are obliged to communicate my erasure request to those third parties. Please inform me of which third parties have been notified.

Backup and archival systems:

I expressly point out that my data must also be deleted from all backup and archival systems. Relegating data to backup systems does not constitute a lawful alternative to complete erasure.

Deadline:

You are obliged to inform me of the action taken on this request without undue delay and in any event within ${fw.deadlineDays} days of receipt of the request.

Obligation to justify:

Should you refuse the erasure in whole or in part, you are obliged under ${fw.article.en} to provide me with the legal basis and specific reason for each exception in writing without undue delay.

I request that you confirm in writing that all my personal data has been erased. Failure to comply may result in a complaint being filed with ${fw.enforcementBody.en}.

Yours faithfully,
${userName}
${userEmail}`;

  return { subject, body };
}

function generateCcpaDe(params: DeletionRequestParams): EmailTemplate {
  const { userName, userEmail, serviceName, additionalInfo } = params;
  const fw = FRAMEWORKS.us;
  const dataScope = buildDataScope('de', serviceName, params.categories ?? [], fw);

  const subject = `Antrag auf Löschung personenbezogener Daten gemäß ${fw.article.de}`;

  const body = `Sehr geehrte Damen und Herren,

hiermit stelle ich einen Antrag auf Löschung meiner persönlichen Daten gemäß dem California Consumer Privacy Act (CCPA), ${fw.article.de}.

Meine Kontaktdaten:
Name: ${userName}
E-Mail-Adresse: ${userEmail}
${additionalInfo ? `Weitere Informationen: ${additionalInfo}\n` : ''}
Ich fordere Sie auf, alle persönlichen Daten, die Sie über mich gesammelt haben, zu löschen und Ihre Dienstleister anzuweisen, dasselbe zu tun.

Umfang der Löschung:

${dataScope}

Gemäß CCPA haben Sie ${fw.deadlineDays} Tage Zeit, meinen Antrag zu bearbeiten und mir eine Bestätigung zukommen zu lassen.

Gemäß CCPA sind Sie zudem verpflichtet, den Eingang meines Antrags innerhalb von 10 Werktagen zu bestätigen.

Ich bitte Sie, mir schriftlich zu bestätigen, dass alle meine Daten gelöscht wurden.

Mit freundlichen Grüßen,
${userName}
${userEmail}`;

  return { subject, body };
}

function generateCcpaEn(params: DeletionRequestParams): EmailTemplate {
  const { userName, userEmail, serviceName, additionalInfo } = params;
  const fw = FRAMEWORKS.us;
  const dataScope = buildDataScope('en', serviceName, params.categories ?? [], fw);

  const subject = `Request for deletion of personal information under ${fw.article.en}`;

  const body = `Dear Sir or Madam,

I am writing to exercise my right to deletion of personal information under the California Consumer Privacy Act (CCPA), ${fw.article.en}.

My contact details:
Name: ${userName}
Email address: ${userEmail}
${additionalInfo ? `Additional information: ${additionalInfo}\n` : ''}
I request that you delete all personal information you have collected from me and direct your service providers to do the same.

Scope of deletion:

${dataScope}

Under the CCPA, you have ${fw.deadlineDays} days to process my request and provide confirmation.

Under the CCPA, you are also required to acknowledge receipt of my request within 10 business days.

I request that you confirm in writing that all my personal information has been deleted.

Yours faithfully,
${userName}
${userEmail}`;

  return { subject, body };
}

function generateLgpdDe(params: DeletionRequestParams): EmailTemplate {
  const { userName, userEmail, serviceName, additionalInfo } = params;
  const fw = FRAMEWORKS.brazil;
  const dataScope = buildDataScope('de', serviceName, params.categories ?? [], fw);

  const subject = `Antrag auf Löschung personenbezogener Daten gemäß ${fw.article.de}`;

  const body = `Sehr geehrte Damen und Herren,

hiermit beantrage ich die Löschung meiner personenbezogenen Daten gemäß der Lei Geral de Proteção de Dados (LGPD), ${fw.article.de}.

Meine Kontaktdaten:
Name: ${userName}
E-Mail-Adresse: ${userEmail}
${additionalInfo ? `Weitere Informationen: ${additionalInfo}\n` : ''}
Ich widerrufe meine Einwilligung zur Datenverarbeitung und fordere die vollständige Löschung meiner Daten bei ${serviceName}:

${dataScope}

Gemäß LGPD haben Sie ${fw.deadlineDays} Tage Zeit, meinen Antrag zu bearbeiten.

Mit freundlichen Grüßen,
${userName}
${userEmail}`;

  return { subject, body };
}

function generateLgpdEn(params: DeletionRequestParams): EmailTemplate {
  const { userName, userEmail, serviceName, additionalInfo } = params;
  const fw = FRAMEWORKS.brazil;
  const dataScope = buildDataScope('en', serviceName, params.categories ?? [], fw);

  const subject = `Request for deletion of personal data under ${fw.article.en}`;

  const body = `Dear Sir or Madam,

I am writing to request the deletion of my personal data pursuant to the Lei Geral de Proteção de Dados (LGPD), ${fw.article.en}.

My contact details:
Name: ${userName}
Email address: ${userEmail}
${additionalInfo ? `Additional information: ${additionalInfo}\n` : ''}
I hereby withdraw my consent to data processing and request the complete deletion of my data held by ${serviceName}:

${dataScope}

Under the LGPD, you have ${fw.deadlineDays} days to process my request.

Yours faithfully,
${userName}
${userEmail}`;

  return { subject, body };
}

export function generateDeletionRequest(
  params: DeletionRequestParams,
): EmailTemplate {
  const region = params.region ?? 'eu';
  const fw = FRAMEWORKS[region];

  if (region === 'us') {
    return params.language === 'de' ? generateCcpaDe(params) : generateCcpaEn(params);
  }

  if (region === 'brazil') {
    return params.language === 'de' ? generateLgpdDe(params) : generateLgpdEn(params);
  }

  if (['india', 'south_korea', 'thailand', 'japan', 'canada'].includes(region)) {
    return params.language === 'de' ? generateGdprDe(params, fw) : generateGdprEn(params, fw);
  }

  return params.language === 'de'
    ? generateGdprDe(params, fw)
    : generateGdprEn(params, fw);
}

export function generateAccessRequest(
  params: DeletionRequestParams,
): EmailTemplate {
  const { language, userName, userEmail, serviceName, additionalInfo } = params;
  const region = params.region ?? 'eu';
  const fw = FRAMEWORKS[region];

  if (region === 'us') {
    const subject = language === 'de'
      ? `Auskunftsanfrage gemäß § 1798.100 CCPA`
      : `Subject access request under CCPA § 1798.100`;

    const body = language === 'de'
      ? `Sehr geehrte Damen und Herren,

hiermit stelle ich gemäß § 1798.100 des California Consumer Privacy Act (CCPA) einen Antrag auf Auskunft über alle personenbezogenen Daten, die Sie über mich gespeichert haben oder verarbeiten.

Meine Kontaktdaten:
Name: ${userName}
E-Mail-Adresse: ${userEmail}
${additionalInfo ? `Weitere Informationen: ${additionalInfo}\n` : ''}
Ich beantrage Auskunft über:

- alle personenbezogenen Daten, die ${serviceName} über mich gesammelt hat
- die Kategorien und konkreten Informationen der gesammelten Daten
- die Zwecke der Datenerhebung und -verarbeitung
- die Kategorien von Dritten, an die meine Daten weitergegeben wurden
- die Herkunft der Daten, sofern nicht direkt von mir erhoben

Gemäß CCPA haben Sie ${fw.deadlineDays} Tage Zeit, meinen Antrag zu bearbeiten und mir eine Kopie der Daten zuzusenden.

Mit freundlichen Grüßen,
${userName}
${userEmail}`
      : `Dear Sir or Madam,

I am writing to exercise my right to know under the California Consumer Privacy Act (CCPA), § 1798.100.

My contact details:
Name: ${userName}
Email address: ${userEmail}
${additionalInfo ? `Additional information: ${additionalInfo}\n` : ''}
I request disclosure of:

- all personal information ${serviceName} has collected about me
- the categories and specific pieces of personal information collected
- the purposes for which my personal information is collected or used
- the categories of third parties with whom my personal information is shared
- the sources from which my personal information is collected

Under the CCPA, you have ${fw.deadlineDays} days to respond to this request and provide a copy of my personal information.

Yours faithfully,
${userName}
${userEmail}`;

    return { subject, body };
  }

  if (region === 'brazil') {
    const subject = language === 'de'
      ? `Antrag auf Auskunft über personenbezogene Daten gemäß Art. 18 LGPD`
      : `Subject access request under Art. 18 LGPD`;

    const body = language === 'de'
      ? `Sehr geehrte Damen und Herren,

hiermit beantrage ich gemäß Art. 18 der Lei Geral de Proteção de Dados (LGPD) Auskunft über alle personenbezogenen Daten, die ${serviceName} über mich gespeichert hat oder verarbeitet.

Meine Kontaktdaten:
Name: ${userName}
E-Mail-Adresse: ${userEmail}
${additionalInfo ? `Weitere Informationen: ${additionalInfo}\n` : ''}
Ich beantrage Auskunft über:

- eine vollständige Kopie aller mich betreffenden personenbezogenen Daten
- den Zweck der Datenverarbeitung
- die Empfänger oder Kategorien von Empfängern, an die meine Daten weitergegeben wurden
- die Dauer der Datenspeicherung
- die Herkunft der Daten

Gemäß LGPD haben Sie ${fw.deadlineDays} Tage Zeit, meinen Antrag zu beantworten.

Mit freundlichen Grüßen,
${userName}
${userEmail}`
      : `Dear Sir or Madam,

I am writing to exercise my right of access under Art. 18 of the Lei Geral de Proteção de Dados (LGPD).

My contact details:
Name: ${userName}
Email address: ${userEmail}
${additionalInfo ? `Additional information: ${additionalInfo}\n` : ''}
I request disclosure of:

- a complete copy of all personal data ${serviceName} holds about me
- the purpose of the data processing
- the recipients or categories of recipients to whom my data has been disclosed
- the retention period for my personal data
- the source from which my personal data was obtained

Under the LGPD, you have ${fw.deadlineDays} days to respond to this request.

Yours faithfully,
${userName}
${userEmail}`;

    return { subject, body };
  }

  const articleRef = fw.article[language];

  if (language === 'de') {
    const subject = `Antrag auf Auskunft über personenbezogene Daten gemäß ${articleRef}`;

    const body = `Sehr geehrte Damen und Herren,

hiermit stelle ich gemäß ${articleRef} der Datenschutz-Grundverordnung (DSGVO) einen Antrag auf Auskunft über alle personenbezogenen Daten, die ${serviceName} über mich gespeichert hat oder verarbeitet.

Meine Kontaktdaten:
Name: ${userName}
E-Mail-Adresse: ${userEmail}
${additionalInfo ? `Weitere Informationen: ${additionalInfo}\n` : ''}
Ich beantrage Auskunft über:

- eine vollständige Kopie aller mich betreffenden personenbezogenen Daten
- den Zweck der Verarbeitung meiner personenbezogenen Daten
- die Kategorien personenbezogener Daten, die verarbeitet werden
- die Empfänger oder Kategorien von Empfängern, denen die Daten offengelegt wurden oder werden
- die geplante Dauer der Speicherung meiner personenbezogenen Daten
- die Herkunft der Daten, sofern diese nicht direkt bei mir erhoben wurden

Frist:

Sie sind verpflichtet, mir unverzüglich, spätestens aber innerhalb von ${fw.deadlineDays} Tagen nach Eingang dieses Antrags, Auskunft zu erteilen.

Bei Nichtbeachtung behalte ich mir vor, eine Beschwerde bei ${fw.enforcementBody.de} einzureichen.

Mit freundlichen Grüßen,
${userName}
${userEmail}`;

    return { subject, body };
  }

  const subject = `Subject access request under ${articleRef} GDPR`;

  const body = `Dear Sir or Madam,

I am writing to exercise my right of access under ${articleRef} of the General Data Protection Regulation (GDPR).

My contact details:
Name: ${userName}
Email address: ${userEmail}
${additionalInfo ? `Additional information: ${additionalInfo}\n` : ''}
I request disclosure of:

- a complete copy of all personal data ${serviceName} holds about me
- the purpose of the processing of my personal data
- the categories of personal data being processed
- the recipients or categories of recipients to whom my personal data has been or will be disclosed
- the envisaged retention period for my personal data
- the source from which my personal data was obtained, where it was not collected directly from me

Deadline:

You are obliged to respond without undue delay and in any event within ${fw.deadlineDays} days of receipt of this request.

Failure to comply may result in a complaint being filed with ${fw.enforcementBody.en}.

Yours faithfully,
${userName}
${userEmail}`;

  return { subject, body };
}

export function generateFollowUpRequest(
  params: FollowUpRequestParams,
): EmailTemplate {
  const { language, userName, userEmail, serviceName, originalRequestDate } = params;
  const region = params.region ?? 'eu';
  const fw = FRAMEWORKS[region];

  if (language === 'de') {
    const subject = `Nachfrage: Antrag auf Löschung personenbezogener Daten vom ${originalRequestDate}`;

    const body = `Sehr geehrte Damen und Herren,

am ${originalRequestDate} habe ich an Sie einen Antrag auf Löschung meiner personenbezogenen Daten gemäß ${fw.article.de} gestellt. Ich habe bislang weder eine Bestätigung des Eingangs noch eine Rückmeldung zu den ergriffenen Maßnahmen erhalten.

Meine Kontaktdaten:
Name: ${userName}
E-Mail-Adresse: ${userEmail}

Sie waren verpflichtet, mir innerhalb von ${fw.deadlineDays} Tagen nach Eingang meines Antrags zu antworten. Diese Frist ist abgelaufen.

Ich fordere Sie hiermit erneut und ausdrücklich auf, meinen ursprünglichen Löschantrag unverzüglich zu bearbeiten und mir die vollständige Löschung aller mich betreffenden personenbezogenen Daten bei ${serviceName} schriftlich zu bestätigen.

Ich weise darauf hin, dass bei fortgesetzter Untätigkeit eine Beschwerde bei ${fw.enforcementBody.de} sowie weitere rechtliche Schritte möglich sind.

Mit freundlichen Grüßen,
${userName}
${userEmail}`;

    return { subject, body };
  }

  const subject = `Follow-up: Request for erasure of personal data dated ${originalRequestDate}`;

  const body = `Dear Sir or Madam,

On ${originalRequestDate}, I submitted a request for the erasure of my personal data pursuant to ${fw.article.en}. I have not yet received an acknowledgement of receipt or any response regarding the actions taken.

My contact details:
Name: ${userName}
Email address: ${userEmail}

You were obliged to respond to my request within ${fw.deadlineDays} days of its receipt. That deadline has now passed.

I hereby formally reiterate my original erasure request and demand that you process it without further delay and confirm in writing that all personal data concerning me held by ${serviceName} has been completely erased.

Please be aware that continued inaction may result in a complaint being filed with ${fw.enforcementBody.en} and may lead to further legal action.

Yours faithfully,
${userName}
${userEmail}`;

  return { subject, body };
}
