import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { $sentRequests, $language, type DiscoveredService, type SentRequest } from '../lib/stores.ts';
import { generateDeletionRequest } from '../lib/templates.ts';
import { getCredentials, getSenderEmail } from '../lib/credentials.ts';
import { useTranslation } from '../lib/i18n.ts';
import type { Language } from '../lib/i18n.ts';
import { FRAMEWORKS, type LegalRegion } from '../lib/legal-frameworks.ts';
import Spinner from './Spinner.tsx';

interface BatchSendModalProps {
  services: DiscoveredService[];
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'form' | 'sending' | 'result';

interface SendResultEntry {
  service: DiscoveredService;
  success: boolean;
  error?: string;
}

export default function BatchSendModal({ services, onClose, onComplete }: BatchSendModalProps) {
  const language = useStore($language);
  const t = useTranslation(language);

  const [step, setStep] = useState<Step>('form');
  const [userName, setUserName] = useState('');
  const [templateLang, setTemplateLang] = useState<Language>(language);
  const [sendingIndex, setSendingIndex] = useState(0);
  const [results, setResults] = useState<SendResultEntry[]>([]);

  const sendable = services.filter((s) => s.privacyEmail);
  const skipped = services.filter((s) => !s.privacyEmail);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && step !== 'sending') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, step]);

  const runBatch = useCallback(async () => {
    setStep('sending');
    setSendingIndex(0);
    setResults([]);

    const creds = getCredentials();
    const senderEmail = getSenderEmail();
    const collectedResults: SendResultEntry[] = [];

    for (let i = 0; i < sendable.length; i++) {
      setSendingIndex(i + 1);
      const service = sendable[i];
      const region = (service.region ?? 'eu') as LegalRegion;
      const params = {
        language: templateLang,
        userName: userName || senderEmail,
        userEmail: senderEmail,
        serviceName: service.name,
        region,
        categories: service.categories ?? [],
      };
      const template = generateDeletionRequest(params);

      if (!creds) {
        collectedResults.push({ service, success: false, error: t.general.error });
        continue;
      }

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
            to: service.privacyEmail,
            subject: template.subject,
            body: template.body,
          }),
        });

        const data = (await res.json()) as { success: boolean; error?: string };

        if (data.success) {
          const newRequest: SentRequest = {
            id: crypto.randomUUID(),
            serviceId: service.id,
            serviceName: service.name,
            serviceDomain: service.domain,
            sentAt: new Date().toISOString(),
            deadlineAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            followUpSentAt: null,
          };
          $sentRequests.set([...$sentRequests.get(), newRequest]);
          collectedResults.push({ service, success: true });
        } else {
          collectedResults.push({ service, success: false, error: data.error ?? t.general.error });
        }
      } catch (err) {
        collectedResults.push({
          service,
          success: false,
          error: err instanceof Error ? err.message : t.general.error,
        });
      }

      if (i < sendable.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    setResults(collectedResults);
    setStep('result');
  }, [sendable, templateLang, userName, t]);

  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;
  const progressPct = sendable.length > 0 ? Math.round((sendingIndex / sendable.length) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.templates.batchSend}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={step !== 'sending' ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white border border-[var(--color-sand)] shadow-xl flex flex-col max-h-[95dvh] overflow-hidden">

        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--color-sand)] shrink-0">
          <h2 className="text-[var(--color-forest)] font-semibold text-base">{t.templates.batchSend}</h2>
          {step !== 'sending' && (
            <button
              onClick={onClose}
              aria-label={t.general.cancel}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] transition-all duration-200"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {step === 'form' && (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
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
                <div className="space-y-1.5">
                  <label className="text-xs text-[var(--color-ink-light)] font-medium">
                    {t.general.language}
                  </label>
                  <div className="flex items-center gap-1 rounded-lg bg-[var(--color-cream-dark)] p-1 border border-[var(--color-sand)] w-fit">
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
                </div>
              </div>

              {sendable.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--color-ink-light)] font-medium">
                    {t.templates.send} ({sendable.length})
                  </p>
                  <ul className="rounded-xl border border-[var(--color-sand)] divide-y divide-[var(--color-sand)] overflow-hidden">
                    {sendable.map((s) => {
                      const region = (s.region ?? 'eu') as LegalRegion;
                      const fw = FRAMEWORKS[region];
                      return (
                        <li key={s.id} className="flex items-center justify-between px-3 py-2 bg-white text-sm">
                          <span className="text-[var(--color-ink)]">{s.name}</span>
                          <span className="text-[var(--color-ink-muted)] text-xs">{fw.name[language]}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {skipped.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-[var(--color-ink-muted)] font-medium">
                    {t.templates.skippedNoEmail} ({skipped.length})
                  </p>
                  <ul className="rounded-xl border border-[var(--color-sand)] divide-y divide-[var(--color-sand)] overflow-hidden">
                    {skipped.map((s) => (
                      <li key={s.id} className="flex items-center justify-between px-3 py-2 bg-[var(--color-cream-dark)] text-sm">
                        <span className="text-[var(--color-ink-muted)]">{s.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {step === 'sending' && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 text-[var(--color-forest)]">
                <Spinner className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  {t.templates.sendingProgress(sendingIndex, sendable.length)}
                </p>
              </div>
              <div className="w-full bg-[var(--color-cream-dark)] rounded-full h-2 border border-[var(--color-sand)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-forest)] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                  role="progressbar"
                  aria-valuenow={sendingIndex}
                  aria-valuemin={0}
                  aria-valuemax={sendable.length}
                />
              </div>
            </div>
          )}

          {step === 'result' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                {successCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-mint)]/15 border border-[var(--color-mint)]/30 text-[var(--color-sage)] text-sm font-medium">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {t.templates.successCount(successCount)}
                  </span>
                )}
                {failedCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {t.templates.failedCount(failedCount)}
                  </span>
                )}
              </div>

              <ul className="rounded-xl border border-[var(--color-sand)] divide-y divide-[var(--color-sand)] overflow-hidden">
                {results.map((r) => (
                  <li key={r.service.id} className="flex items-center gap-3 px-3 py-2.5 bg-white">
                    {r.success ? (
                      <svg className="h-4 w-4 text-[var(--color-sage)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-sm text-[var(--color-ink)] flex-1">{r.service.name}</span>
                    {r.error && (
                      <span className="text-xs text-red-500 truncate max-w-[40%]">{r.error}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[var(--color-sand)] shrink-0">
          {step === 'form' && (
            <button
              onClick={runBatch}
              disabled={sendable.length === 0}
              className="w-full py-2.5 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] disabled:bg-[var(--color-sand)] disabled:text-[var(--color-ink-muted)] text-white font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed"
            >
              {t.templates.startBatchSend} ({sendable.length})
            </button>
          )}
          {step === 'result' && (
            <button
              onClick={onComplete}
              className="w-full py-2.5 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] text-white font-semibold text-sm transition-all duration-200"
            >
              {t.tracking.done}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
