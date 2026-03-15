import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import {
  $sentRequests,
  $services,
  $language,
  $notificationsEnabled,
  type SentRequest,
  type RequestStatus,
} from '../lib/stores.ts';
import { getCredentials, getSenderEmail } from '../lib/credentials.ts';
import {
  generateFollowUpRequest,
} from '../lib/templates.ts';
import { useTranslation } from '../lib/i18n.ts';
import Spinner from './Spinner.tsx';
import type { ResponseMatch } from '../pages/api/check-responses.ts';

function daysUntilDeadline(deadlineAt: string): number {
  const now = Date.now();
  const deadline = new Date(deadlineAt).getTime();
  return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
}

const FINAL_STATUSES: RequestStatus[] = ['completed', 'no_record', 'partial', 'rejected'];

function isFinal(status: RequestStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

function StatusBadge({ status, deadlineAt }: { status: RequestStatus; deadlineAt: string }) {
  const language = useStore($language);
  const t = useTranslation(language);

  if (status === 'completed') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full border text-xs font-medium bg-[var(--color-mint)]/15 text-[var(--color-sage)] border-[var(--color-mint)]/30">
        {t.tracking.completed}
      </span>
    );
  }

  if (status === 'no_record') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full border text-xs font-medium bg-gray-50 text-gray-500 border-gray-200">
        {t.tracking.noRecord}
      </span>
    );
  }

  if (status === 'partial') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full border text-xs font-medium bg-orange-50 text-orange-600 border-orange-200">
        {t.tracking.partial}
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full border text-xs font-medium bg-red-100 text-red-700 border-red-300">
        {t.tracking.rejected}
      </span>
    );
  }

  const days = daysUntilDeadline(deadlineAt);

  if (status === 'expired' || days < 0) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full border text-xs font-medium bg-red-50 text-red-600 border-red-200">
        {t.tracking.deadlineExpired}
      </span>
    );
  }

  return (
    <span className="inline-flex px-2 py-0.5 rounded-full border text-xs font-medium bg-amber-50 text-amber-600 border-amber-200">
      {t.tracking.pending}
    </span>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'emerald' | 'yellow' | 'red' | 'slate';
}) {
  const colorMap = {
    emerald: 'text-[var(--color-sage)] bg-[var(--color-mint)]/10 border-[var(--color-mint)]/25',
    yellow: 'text-amber-600 bg-amber-50 border-amber-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    slate: 'text-[var(--color-ink)] bg-white border-[var(--color-sand)]',
  };

  return (
    <div className={`rounded-2xl border p-4 space-y-1 ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
  );
}

function ConfirmClearDialog({
  language,
  onConfirm,
  onCancel,
}: {
  language: 'de' | 'en';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslation(language);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white border border-[var(--color-sand)] p-6 shadow-xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 border border-red-200">
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <p className="text-[var(--color-ink)] font-semibold text-sm">
              {t.tracking.clearAllTitle}
            </p>
            <p className="text-[var(--color-ink-light)] text-xs mt-1 leading-relaxed">
              {t.tracking.clearAllDescription}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-sm font-medium transition-all duration-200"
          >
            {t.general.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all duration-200"
          >
            {t.general.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

function FollowUpModal({
  request,
  senderEmail,
  onClose,
}: {
  request: SentRequest;
  senderEmail: string;
  onClose: () => void;
}) {
  const language = useStore($language);
  const t = useTranslation(language);

  const prefillEmail = useMemo(() => {
    const svc = $services.get().find((s) => s.id === request.serviceId);
    return svc?.privacyEmail ?? '';
  }, [request.serviceId]);

  const [toEmail, setToEmail] = useState(prefillEmail);
  const [sendResult, setSendResult] = useState<'idle' | 'loading' | 'success' | { error: string }>('idle');

  const template = useMemo(
    () =>
      generateFollowUpRequest({
        language,
        userName: senderEmail,
        userEmail: senderEmail,
        serviceName: request.serviceName,
        originalRequestDate: new Date(request.sentAt).toLocaleDateString(
          language === 'de' ? 'de-DE' : 'en-GB',
          { year: 'numeric', month: 'long', day: 'numeric' },
        ),
      }),
    [language, senderEmail, request],
  );

  const mailtoHref = useMemo(() => {
    const subj = encodeURIComponent(template.subject);
    const body = encodeURIComponent(template.body);
    return `mailto:${toEmail}?subject=${subj}&body=${body}`;
  }, [template, toEmail]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSend = useCallback(async () => {
    if (!toEmail) return;
    const creds = getCredentials();
    if (!creds) return;

    setSendResult('loading');

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
          body: template.body,
        }),
      });

      const data = (await res.json()) as { success: boolean; error?: string };

      if (!data.success) {
        setSendResult({ error: data.error ?? t.general.error });
        return;
      }

      $sentRequests.set(
        $sentRequests.get().map((r) =>
          r.id === request.id ? { ...r, followUpSentAt: new Date().toISOString() } : r,
        ),
      );

      setSendResult('success');
      setTimeout(onClose, 1200);
    } catch (err) {
      setSendResult({ error: err instanceof Error ? err.message : t.general.error });
    }
  }, [toEmail, template, request.id, t, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl bg-white border border-[var(--color-sand)] shadow-xl flex flex-col max-h-[85dvh] overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--color-sand)] shrink-0">
          <div>
            <h2 className="text-[var(--color-forest)] font-semibold text-base">{t.tracking.followUp}</h2>
            <p className="text-[var(--color-ink-muted)] text-xs mt-0.5">{request.serviceName}</p>
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
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-[var(--color-ink-light)] font-medium">
              {t.tracking.followUpRecipient}
            </label>
            <input
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="privacy@example.com"
              aria-label={t.tracking.followUpRecipient}
              className="w-full px-3 py-2.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:border-[var(--color-sage)] transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-cream-dark)] border border-[var(--color-sand)] text-xs">
            <span className="text-[var(--color-ink-muted)] shrink-0">{t.templates.subject}</span>
            <span className="text-[var(--color-ink-light)] truncate">{template.subject}</span>
          </div>
          <div className="rounded-xl bg-[var(--color-cream-dark)] border border-[var(--color-sand)] p-4">
            <pre className="text-[var(--color-ink-light)] text-xs leading-relaxed whitespace-pre-wrap font-mono">{template.body}</pre>
          </div>
          {sendResult === 'success' && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-mint)]/15 border border-[var(--color-mint)]/30 text-[var(--color-sage)] text-sm">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              {t.tracking.followUpSent}
            </div>
          )}
          {typeof sendResult === 'object' && 'error' in sendResult && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>
                <span className="font-medium">{t.general.error}:</span> {sendResult.error}
              </span>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-[var(--color-sand)] flex gap-3 shrink-0">
          <a
            href={mailtoHref}
            className="flex-1 py-2.5 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-sm font-medium transition-all duration-200 text-center"
          >
            {t.services.openInEmailClient}
          </a>
          <button
            onClick={handleSend}
            disabled={!toEmail || sendResult === 'loading' || sendResult === 'success'}
            className="flex-[2] py-2.5 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] disabled:bg-[var(--color-sand)] disabled:text-[var(--color-ink-muted)] text-white font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {sendResult === 'loading' ? (
              <>
                <Spinner className="h-4 w-4" />
                {t.general.loading}
              </>
            ) : (
              t.tracking.sendFollowUp
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({
  requestId,
  onSelect,
  onClose,
  t,
}: {
  requestId: string;
  onSelect: (id: string, status: RequestStatus) => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const options: { status: RequestStatus; label: string; symbol: string; color: string }[] = [
    { status: 'completed', label: t.tracking.completed, symbol: '✓', color: 'text-[var(--color-sage)]' },
    { status: 'no_record', label: t.tracking.noRecord, symbol: '○', color: 'text-gray-400' },
    { status: 'partial', label: t.tracking.partial, symbol: '◐', color: 'text-orange-500' },
    { status: 'rejected', label: t.tracking.rejected, symbol: '✗', color: 'text-red-600' },
  ];

  return (
    <div
      ref={ref}
      className="absolute right-0 bottom-full mb-1 z-20 rounded-xl bg-white border border-[var(--color-sand)] shadow-lg overflow-hidden min-w-[10rem]"
    >
      {options.map((opt) => (
        <button
          key={opt.status}
          onClick={() => {
            onSelect(requestId, opt.status);
            onClose();
          }}
          className="w-full px-3 py-2 text-xs flex items-center gap-2 hover:bg-[var(--color-cream-dark)] cursor-pointer text-left"
        >
          <span className={`font-bold ${opt.color}`}>{opt.symbol}</span>
          <span className="text-[var(--color-ink-light)]">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

export default function TrackingDashboard() {
  const language = useStore($language);
  const t = useTranslation(language);
  const requests = useStore($sentRequests);
  const notificationsEnabled = useStore($notificationsEnabled);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [followUpRequest, setFollowUpRequest] = useState<SentRequest | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [checkingResponses, setCheckingResponses] = useState(false);
  const [responseMatches, setResponseMatches] = useState<ResponseMatch[]>([]);
  const [dismissedResponses, setDismissedResponses] = useState<Set<string>>(new Set());

  const senderEmail = getSenderEmail();

  useEffect(() => {
    if (!showExportMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const stats = useMemo(() => {
    const total = requests.length;
    const now = Date.now();
    let pending = 0;
    let expired = 0;
    let completed = 0;
    let noRecord = 0;
    let partial = 0;
    let rejected = 0;

    for (const r of requests) {
      if (r.status === 'completed') {
        completed++;
      } else if (r.status === 'no_record') {
        noRecord++;
      } else if (r.status === 'partial') {
        partial++;
      } else if (r.status === 'rejected') {
        rejected++;
      } else if (r.status === 'expired' || new Date(r.deadlineAt).getTime() < now) {
        expired++;
      } else {
        pending++;
      }
    }

    return { total, pending, expired, completed, noRecord, partial, rejected };
  }, [requests]);

  const handleSetStatus = useCallback((id: string, status: RequestStatus) => {
    $sentRequests.set(
      $sentRequests.get().map((r) =>
        r.id === id ? { ...r, status } : r,
      ),
    );
  }, []);

  const handleNotificationToggle = useCallback(async () => {
    if (notificationsEnabled === 'true') {
      $notificationsEnabled.set('false');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      $notificationsEnabled.set('true');
    }
  }, [notificationsEnabled]);

  const handleClearAll = useCallback(() => {
    $sentRequests.set([]);
    localStorage.removeItem('wipeme:services');
    localStorage.removeItem('wipeme:sent-requests');
    sessionStorage.removeItem('wipeme:credentials');
    setShowClearConfirm(false);
  }, []);

  const downloadBlob = useCallback((content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportJson = useCallback(() => {
    const data = JSON.stringify(
      { exportedAt: new Date().toISOString(), requests: $sentRequests.get() },
      null,
      2,
    );
    downloadBlob(data, `wipeme-export-${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
    setShowExportMenu(false);
  }, [downloadBlob]);

  const handleExportCsv = useCallback(() => {
    const reqs = $sentRequests.get();
    const header = language === 'de'
      ? 'Dienst,Domain,Gesendet,Frist,Status'
      : 'Service,Domain,Sent,Deadline,Status';
    const rows = reqs.map((r) =>
      [r.serviceName, r.serviceDomain, r.sentAt.slice(0, 10), r.deadlineAt.slice(0, 10), r.status].join(',')
    );
    downloadBlob([header, ...rows].join('\n'), `wipeme-export-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    setShowExportMenu(false);
  }, [language, downloadBlob]);

  const handlePrint = useCallback(() => {
    const reqs = $sentRequests.get();
    const now = Date.now();
    const colService = language === 'de' ? 'Dienst' : 'Service';
    const colSent = language === 'de' ? 'Gesendet' : 'Sent';
    const colDeadline = language === 'de' ? 'Frist' : 'Deadline';
    const colDays = language === 'de' ? 'Tage' : 'Days';
    const title = language === 'de' ? 'WipeMe \u2013 L\u00F6schanfragen' : 'WipeMe \u2013 Deletion Requests';

    const tableRows = reqs.map((r) => {
      const days = Math.ceil((new Date(r.deadlineAt).getTime() - now) / (1000 * 60 * 60 * 24));
      const daysLabel = isFinal(r.status)
        ? '\u2013'
        : days < 0
          ? (language === 'de' ? `${Math.abs(days)}T \u00FCberf\u00E4llig` : `${Math.abs(days)}d overdue`)
          : (language === 'de' ? `${days}T verbleibend` : `${days}d left`);
      return `<tr><td>${r.serviceName}</td><td>${r.serviceDomain}</td><td>${r.sentAt.slice(0, 10)}</td><td>${r.deadlineAt.slice(0, 10)}</td><td>${r.status}</td><td>${daysLabel}</td></tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;font-size:12px;margin:2rem;color:#1a1a1a}h1{font-size:16px;margin-bottom:1rem}table{border-collapse:collapse;width:100%}th{background:#f5f5f0;text-align:left;padding:6px 10px;border:1px solid #ddd;font-weight:600}td{padding:5px 10px;border:1px solid #ddd}tr:nth-child(even){background:#fafaf8}</style>
</head><body><h1>${title}</h1>
<table><thead><tr><th>${colService}</th><th>Domain</th><th>${colSent}</th><th>${colDeadline}</th><th>Status</th><th>${colDays}</th></tr></thead>
<tbody>${tableRows}</tbody></table></body></html>`;

    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
    setShowExportMenu(false);
  }, [language]);

  const handleExportIcs = useCallback(() => {
    const reqs = $sentRequests.get().filter((r) => !isFinal(r.status));
    const summaryPrefix = language === 'de' ? 'Frist: ' : 'Deadline: ';
    const description = language === 'de' ? 'L\u00F6schanfrage Frist' : 'Deletion request deadline';
    const alarmDesc = language === 'de' ? 'Frist in 3 Tagen' : 'Deadline in 3 days';

    const events = reqs.map((r) => {
      const dtstart = r.deadlineAt.slice(0, 10).replace(/-/g, '');
      return [
        'BEGIN:VEVENT',
        `UID:${r.id}@wipeme`,
        `DTSTART;VALUE=DATE:${dtstart}`,
        `SUMMARY:${summaryPrefix}${r.serviceName}`,
        `DESCRIPTION:${description}`,
        'BEGIN:VALARM',
        'TRIGGER:-P3D',
        'ACTION:DISPLAY',
        `DESCRIPTION:${alarmDesc}`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n');
    });

    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WipeMe//Deadline Tracker//DE', ...events, 'END:VCALENDAR'].join('\r\n');
    downloadBlob(ics, `wipeme-fristen-${new Date().toISOString().slice(0, 10)}.ics`, 'text/calendar');
    setShowExportMenu(false);
  }, [language, downloadBlob]);

  const handleCheckResponses = useCallback(async () => {
    const creds = getCredentials();
    if (!creds) return;

    setCheckingResponses(true);

    const pendingOrExpired = requests.filter(
      (r) => r.status === 'pending' || r.status === 'expired',
    );

    const checks = pendingOrExpired.map((r) => ({
      domain: r.serviceDomain,
      sinceDate: r.sentAt,
    }));

    try {
      const res = await fetch('/api/check-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: creds.imap.host,
          port: creds.imap.port,
          user: creds.email,
          pass: creds.password,
          secure: creds.imap.secure,
          checks,
        }),
      });

      const data = (await res.json()) as { success: boolean; responses?: ResponseMatch[]; error?: string };

      if (data.success && data.responses) {
        setResponseMatches(data.responses);
        setDismissedResponses(new Set());
      }
    } catch {
    } finally {
      setCheckingResponses(false);
    }
  }, [requests]);

  if (requests.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[var(--color-cream-dark)] border border-[var(--color-sand)] mx-auto">
          <svg className="h-8 w-8 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[var(--color-ink)] font-semibold">
          {t.tracking.sentRequests}
        </p>
        <p className="text-[var(--color-ink-light)] text-sm">
          {t.tracking.noRequests}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label={t.tracking.total}
            value={stats.total}
            color="slate"
          />
          <StatCard
            label={t.tracking.pending}
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            label={t.tracking.deadlineExpired}
            value={stats.expired}
            color="red"
          />
          <StatCard
            label={t.tracking.completed}
            value={stats.completed}
            color="emerald"
          />
        </div>

        {(stats.noRecord > 0 || stats.partial > 0 || stats.rejected > 0) && (
          <div className="flex items-center gap-4 flex-wrap text-xs text-[var(--color-ink-muted)]">
            {stats.noRecord > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-gray-400">○</span>
                <span>{t.tracking.noRecord}: <span className="font-semibold text-[var(--color-ink-light)]">{stats.noRecord}</span></span>
              </span>
            )}
            {stats.partial > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-orange-500">◐</span>
                <span>{t.tracking.partial}: <span className="font-semibold text-[var(--color-ink-light)]">{stats.partial}</span></span>
              </span>
            )}
            {stats.rejected > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-red-600">✗</span>
                <span>{t.tracking.rejected}: <span className="font-semibold text-[var(--color-ink-light)]">{stats.rejected}</span></span>
              </span>
            )}
          </div>
        )}

        {responseMatches.filter((m) => !dismissedResponses.has(m.domain)).map((match) => {
          const req = requests.find((r) => r.serviceDomain === match.domain);
          const name = req?.serviceName ?? match.domain;
          return (
            <div
              key={match.domain}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm"
            >
              <svg className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{t.tracking.possibleResponse}: {name}</span>
                <span className="ml-1 text-amber-700 truncate block">{match.subject}</span>
              </div>
              <button
                onClick={() => {
                  setDismissedResponses((prev) => new Set([...prev, match.domain]));
                  handleSetStatus(req?.id ?? '', 'completed');
                }}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-800 text-xs font-medium transition-all duration-200"
              >
                {t.tracking.done}
              </button>
            </div>
          );
        })}

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-[var(--color-ink)] font-semibold">{t.tracking.sentRequests}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckResponses}
              disabled={checkingResponses}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-xs font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {checkingResponses ? (
                <>
                  <Spinner className="h-3.5 w-3.5" />
                  {t.tracking.checking}
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t.tracking.checkResponses}
                </>
              )}
            </button>
            <button
              onClick={handleNotificationToggle}
              title={notificationsEnabled === 'true' ? t.tracking.notificationsEnabled : t.tracking.enableNotifications}
              aria-label={notificationsEnabled === 'true' ? t.tracking.notificationsEnabled : t.tracking.enableNotifications}
              className={[
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all duration-200',
                notificationsEnabled === 'true'
                  ? 'border-[var(--color-teal)]/40 bg-[var(--color-teal)]/10 text-[var(--color-teal)] hover:bg-[var(--color-teal)]/20'
                  : 'border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)]',
              ].join(' ')}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationsEnabled === 'true' ? t.tracking.notificationsEnabled : t.tracking.enableNotifications}
            </button>
            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setShowExportMenu((v) => !v)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-xs font-medium transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t.tracking.export}
                <svg className="h-3 w-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 z-20 rounded-xl bg-white border border-[var(--color-sand)] shadow-lg overflow-hidden">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-[var(--color-ink-light)] hover:bg-[var(--color-cream-dark)] hover:text-[var(--color-ink)] cursor-pointer transition-colors duration-150"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t.tracking.exportJson}
                  </button>
                  <button
                    onClick={handleExportCsv}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-[var(--color-ink-light)] hover:bg-[var(--color-cream-dark)] hover:text-[var(--color-ink)] cursor-pointer transition-colors duration-150"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
                    </svg>
                    {t.tracking.exportCsv}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-[var(--color-ink-light)] hover:bg-[var(--color-cream-dark)] hover:text-[var(--color-ink)] cursor-pointer transition-colors duration-150"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    {t.tracking.exportPrint}
                  </button>
                  <button
                    onClick={handleExportIcs}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-medium text-[var(--color-ink-light)] hover:bg-[var(--color-cream-dark)] hover:text-[var(--color-ink)] cursor-pointer transition-colors duration-150"
                  >
                    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {t.tracking.exportCalendar}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 text-xs font-medium transition-all duration-200"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t.tracking.clearAll}
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[var(--color-sand)] overflow-hidden shadow-sm">
          <div className="divide-y divide-[var(--color-sand)]">
            {requests.map((request) => {
              const days = daysUntilDeadline(request.deadlineAt);
              const final = isFinal(request.status);
              const isExpired =
                request.status === 'expired' ||
                (!final && days < 0);
              const showFollowUp = !final || request.status === 'rejected' || request.status === 'partial';

              return (
                <div
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-[var(--color-cream-dark)] transition-colors duration-150"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[var(--color-ink)] font-medium text-sm truncate">{request.serviceName}</p>
                    <p className="text-[var(--color-ink-muted)] text-xs">{request.serviceDomain}</p>
                  </div>

                  <div className="shrink-0 text-[var(--color-ink-muted)] text-xs">
                    {new Date(request.sentAt).toLocaleDateString(
                      language === 'de' ? 'de-DE' : 'en-GB',
                      { year: 'numeric', month: 'short', day: 'numeric' },
                    )}
                  </div>

                  <div className="shrink-0">
                    <StatusBadge status={request.status} deadlineAt={request.deadlineAt} />
                  </div>

                  {!final && (
                    <div
                      className={`shrink-0 text-xs font-medium tabular-nums ${
                        isExpired
                          ? 'text-red-500'
                          : days <= 7
                            ? 'text-amber-500'
                            : 'text-[var(--color-ink-muted)]'
                      }`}
                    >
                      {isExpired
                        ? t.tracking.daysOverdue(Math.abs(days))
                        : t.tracking.daysLeft(days)}
                    </div>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    {showFollowUp && (
                      <button
                        onClick={() => setFollowUpRequest(request)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--color-teal)]/10 border border-[var(--color-teal)]/30 text-[var(--color-teal)] hover:bg-[var(--color-teal)]/20 hover:border-[var(--color-teal)]/50 text-xs font-medium transition-all duration-200"
                      >
                        {t.tracking.followUp}
                      </button>
                    )}
                    {!final && (
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === request.id ? null : request.id)}
                          className="px-3 py-1.5 rounded-lg bg-[var(--color-mint)]/15 border border-[var(--color-mint)]/30 text-[var(--color-sage)] hover:bg-[var(--color-mint)]/25 text-xs font-medium transition-all duration-200"
                        >
                          {t.tracking.done}
                        </button>
                        {openDropdownId === request.id && (
                          <StatusDropdown
                            requestId={request.id}
                            onSelect={handleSetStatus}
                            onClose={() => setOpenDropdownId(null)}
                            t={t}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <ConfirmClearDialog
          language={language}
          onConfirm={handleClearAll}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}

      {followUpRequest && (
        <FollowUpModal
          request={followUpRequest}
          senderEmail={senderEmail}
          onClose={() => setFollowUpRequest(null)}
        />
      )}
    </>
  );
}
