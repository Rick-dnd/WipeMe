import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  $sentRequests,
  $language,
  type DiscoveredService,
  type SentRequest,
} from '../lib/stores.ts';
import {
  generateDeletionRequest,
  generateAccessRequest,
  type DeletionRequestParams,
} from '../lib/templates.ts';
import { getCredentials, getSenderEmail } from '../lib/credentials.ts';
import { useTranslation } from '../lib/i18n.ts';
import type { Language } from '../lib/i18n.ts';
import { FRAMEWORKS, type LegalRegion } from '../lib/legal-frameworks.ts';
import Spinner from './Spinner.tsx';

type SendResult =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success' }
  | { state: 'error'; message: string };

type ViewMode = 'preview' | 'edit';
type RequestType = 'deletion' | 'access';

interface DeleteRequestFormProps {
  service: DiscoveredService;
  onClose: () => void;
  onSent?: (request: SentRequest) => void;
}

export default function DeleteRequestForm({
  service,
  onClose,
  onSent,
}: DeleteRequestFormProps) {
  const globalLanguage = useStore($language);
  const t = useTranslation(globalLanguage);

  const [templateLang, setTemplateLang] = useState<Language>(globalLanguage);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [requestType, setRequestType] = useState<RequestType>('deletion');
  const [toEmail, setToEmail] = useState(service.privacyEmail || '');
  const [userName, setUserName] = useState('');
  const [sendResult, setSendResult] = useState<SendResult>({ state: 'idle' });

  const senderEmail = getSenderEmail();

  const serviceRegion = (service.region ?? 'eu') as LegalRegion;
  const fw = FRAMEWORKS[serviceRegion];

  const params: DeletionRequestParams = useMemo(
    () => ({
      language: templateLang,
      userName: userName || senderEmail,
      userEmail: senderEmail,
      serviceName: service.name,
      region: serviceRegion,
      categories: service.categories ?? [],
    }),
    [templateLang, userName, senderEmail, service.name, serviceRegion, service.categories],
  );

  const template = useMemo(
    () => requestType === 'access' ? generateAccessRequest(params) : generateDeletionRequest(params),
    [params, requestType],
  );

  const [bodyText, setBodyText] = useState(template.body);

  useEffect(() => {
    if (viewMode === 'preview') {
      setBodyText(
        requestType === 'access'
          ? generateAccessRequest(params).body
          : generateDeletionRequest(params).body,
      );
    }
  }, [params, viewMode, requestType]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const mailtoHref = useMemo(() => {
    const subj = encodeURIComponent(template.subject);
    const body = encodeURIComponent(bodyText);
    const full = `mailto:${toEmail}?subject=${subj}&body=${body}`;
    if (full.length > 2000) {
      return `mailto:${toEmail}?subject=${subj}&body=${encodeURIComponent(bodyText.slice(0, 1200) + '\n\n[...]')}`;
    }
    return full;
  }, [toEmail, template.subject, bodyText]);

  const handleSend = useCallback(async () => {
    if (!toEmail) return;

    const creds = getCredentials();
    if (!creds) return;

    setSendResult({ state: 'loading' });

    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtp: {
            host: creds.smtp.host,
            port: creds.smtp.port,
            user: creds.email,
            pass: creds.password,
            secure: creds.smtp.secure,
          },
          from: creds.email,
          to: toEmail,
          subject: template.subject,
          body: bodyText,
        }),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (!data.success) {
        setSendResult({
          state: 'error',
          message: data.error ?? t.general.error,
        });
        return;
      }

      const newRequest: SentRequest = {
        id: crypto.randomUUID(),
        serviceId: service.id,
        serviceName: service.name,
        serviceDomain: service.domain,
        sentAt: new Date().toISOString(),
        deadlineAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        followUpSentAt: null,
        requestType,
      };

      $sentRequests.set([...$sentRequests.get(), newRequest]);
      setSendResult({ state: 'success' });
      onSent?.(newRequest);

      setTimeout(onClose, 1200);
    } catch (err) {
      setSendResult({
        state: 'error',
        message: err instanceof Error ? err.message : t.general.error,
      });
    }
  }, [toEmail, template, bodyText, service, t, onSent, onClose, requestType]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.templates.deletionRequest}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white border border-[var(--color-sand)] shadow-xl flex flex-col max-h-[95dvh] overflow-hidden">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--color-sand)] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[var(--color-forest)] font-semibold text-base">
                {requestType === 'access' ? t.templates.accessRequest : t.templates.deletionRequest}
              </h2>
              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-[var(--color-cream-dark)] border border-[var(--color-sand)] text-[var(--color-ink-muted)]">
                {fw.name[globalLanguage]}
              </span>
            </div>
            <p className="text-[var(--color-ink-muted)] text-xs mt-0.5">{service.name} — {service.domain}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg bg-[var(--color-cream-dark)] p-1 border border-[var(--color-sand)]">
              <button
                onClick={() => setRequestType('deletion')}
                aria-pressed={requestType === 'deletion'}
                className={[
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
                  requestType === 'deletion'
                    ? 'bg-[var(--color-forest)] text-white shadow-sm'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
                ].join(' ')}
              >
                {t.templates.deletionRequest}
              </button>
              <button
                onClick={() => setRequestType('access')}
                aria-pressed={requestType === 'access'}
                className={[
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200',
                  requestType === 'access'
                    ? 'bg-[var(--color-forest)] text-white shadow-sm'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
                ].join(' ')}
              >
                {t.templates.accessRequest}
              </button>
            </div>
            <button
              onClick={onClose}
              aria-label={t.general.cancel}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] transition-all duration-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--color-ink-light)] font-medium">
                {t.templates.to}
              </label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder={service.privacyEmail ?? 'privacy@example.com'}
                aria-label={t.templates.recipientEmail}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:border-[var(--color-sage)] transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--color-ink-light)] font-medium">
                {t.templates.yourName}
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t.templates.namePlaceholder}
                aria-label={t.templates.yourName}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:border-[var(--color-sage)] transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-lg bg-[var(--color-cream-dark)] p-1 border border-[var(--color-sand)]">
              {(['de', 'en'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setTemplateLang(lang)}
                  aria-pressed={templateLang === lang}
                  className={[
                    'px-3 py-1 rounded-md text-xs font-semibold tracking-wider transition-all duration-200',
                    templateLang === lang
                      ? 'bg-[var(--color-forest)] text-white shadow-sm'
                      : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
                  ].join(' ')}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-[var(--color-cream-dark)] p-1 border border-[var(--color-sand)]">
              <button
                onClick={() => setViewMode('preview')}
                aria-pressed={viewMode === 'preview'}
                className={[
                  'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
                  viewMode === 'preview'
                    ? 'bg-white text-[var(--color-ink)] shadow-sm border border-[var(--color-sand)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
                ].join(' ')}
              >
                {t.templates.preview}
              </button>
              <button
                onClick={() => setViewMode('edit')}
                aria-pressed={viewMode === 'edit'}
                className={[
                  'px-3 py-1 rounded-md text-xs font-medium transition-all duration-200',
                  viewMode === 'edit'
                    ? 'bg-white text-[var(--color-ink)] shadow-sm border border-[var(--color-sand)]'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
                ].join(' ')}
              >
                {t.templates.edit}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-cream-dark)] border border-[var(--color-sand)] text-xs">
            <span className="text-[var(--color-ink-muted)] shrink-0">
              {t.templates.subject}
            </span>
            <span className="text-[var(--color-ink-light)] truncate">{template.subject}</span>
          </div>

          {viewMode === 'preview' ? (
            <div className="rounded-xl bg-[var(--color-cream-dark)] border border-[var(--color-sand)] p-4">
              <pre className="text-[var(--color-ink-light)] text-xs leading-relaxed whitespace-pre-wrap font-mono">
                {bodyText}
              </pre>
            </div>
          ) : (
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={14}
              aria-label={t.templates.emailBody}
              className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink)] text-xs leading-relaxed font-mono resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:border-[var(--color-sage)] transition-all duration-200"
            />
          )}

          {sendResult.state === 'success' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-mint)]/15 border border-[var(--color-mint)]/30 text-[var(--color-sage)] text-sm">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {t.templates.sentSuccessfully}
            </div>
          )}

          {sendResult.state === 'error' && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>
                <span className="font-medium">{t.general.error}:</span> {sendResult.message}
              </span>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[var(--color-sand)] flex flex-col gap-3 shrink-0">
          {service.webform && (
            <a
              href={service.webform}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-2 ${
                service.difficulty === 'impossible'
                  ? 'bg-[var(--color-teal)] hover:bg-[var(--color-sage)] text-white font-semibold'
                  : 'border border-[var(--color-teal)]/30 bg-[var(--color-teal)]/5 text-[var(--color-teal)] hover:bg-[var(--color-teal)]/10'
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t.templates.goDeletionPortal}
            </a>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={mailtoHref}
            className="flex-1 py-2.5 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-sm font-medium transition-all duration-200 text-center"
          >
            {t.services.openInEmailClient}
          </a>
          <button
            onClick={handleSend}
            disabled={
              !toEmail ||
              sendResult.state === 'loading' ||
              sendResult.state === 'success'
            }
            className="flex-[2] py-2.5 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] disabled:bg-[var(--color-sand)] disabled:text-[var(--color-ink-muted)] text-white font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sendResult.state === 'loading' ? (
              <>
                <Spinner className="h-4 w-4" />
                {t.general.loading}
              </>
            ) : (
              t.templates.send
            )}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
