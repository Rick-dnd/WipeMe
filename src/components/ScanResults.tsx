import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import {
  $services,
  $credentials,
  $scanProgress,
  $currentStep,
  $language,
  $lastScanDate,
  $previousServices,
  type DiscoveredService,
  type Difficulty,
} from '../lib/stores.ts';
import { getCredentials } from '../lib/credentials.ts';
import { useTranslation } from '../lib/i18n.ts';
import companies from '../data/companies.json';

function DifficultyBadge({
  difficulty,
  webform,
  region,
}: {
  difficulty: Difficulty;
  webform?: string | null;
  region?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const language = useStore($language);
  const t = useTranslation(language);

  const styles: Record<Difficulty, string> = {
    easy: 'bg-[var(--color-mint)]/15 text-[var(--color-teal)] border-[var(--color-mint)]/40',
    medium: 'bg-amber-50 text-amber-600 border-amber-200',
    hard: 'bg-red-50 text-red-600 border-red-200',
    impossible: 'bg-red-100 text-red-700 border-red-300',
  };

  const labels: Record<Difficulty, string> = {
    easy: t.services.easy,
    medium: t.services.medium,
    hard: t.services.hard,
    impossible: t.services.impossible,
  };

  const hasPopover = difficulty === 'hard' || difficulty === 'impossible';

  useEffect(() => {
    if (!showTooltip) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-difficulty-popover]')) {
        setShowTooltip(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTooltip]);

  return (
    <div className="relative inline-block" data-difficulty-popover>
      <span
        role={hasPopover ? 'button' : undefined}
        tabIndex={hasPopover ? 0 : undefined}
        onClick={hasPopover ? () => setShowTooltip((v) => !v) : undefined}
        onKeyDown={
          hasPopover
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowTooltip((v) => !v);
                }
              }
            : undefined
        }
        className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-medium ${styles[difficulty]}${hasPopover ? ' cursor-pointer select-none' : ''}`}
      >
        {labels[difficulty]}
      </span>

      {hasPopover && showTooltip && (
        <div className="absolute top-full mt-2 right-0 z-20 w-64 rounded-xl bg-white border border-[var(--color-sand)] shadow-lg p-4 text-xs opacity-100 transition-opacity duration-150">
          <div className="flex items-start gap-2 mb-3">
            {difficulty === 'hard' ? (
              <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 shrink-0 mt-0.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <p className="text-[var(--color-ink-light)] leading-relaxed">
              {difficulty === 'hard' ? t.services.hardGuidance : t.services.impossibleGuidance}
            </p>
          </div>

          {webform && (
            <a
              href={webform}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full mb-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                difficulty === 'impossible'
                  ? 'bg-[var(--color-teal)] hover:bg-[var(--color-sage)] text-white'
                  : 'border border-[var(--color-teal)]/30 bg-[var(--color-teal)]/5 text-[var(--color-teal)] hover:bg-[var(--color-teal)]/10'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t.services.tryWebform}
            </a>
          )}

          {difficulty === 'impossible' && (
            <p className="text-[var(--color-ink-muted)] leading-relaxed">
              {region === 'eu' ? t.services.fileDpaComplaint : t.services.fileDpaComplaint}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ServiceCardProps {
  service: DiscoveredService;
  selected: boolean;
  onToggle: (id: string) => void;
  isNew?: boolean;
}

function ServiceCard({ service, selected, onToggle, isNew }: ServiceCardProps) {
  const language = useStore($language);
  const t = useTranslation(language);

  const formattedDate = useMemo(() => {
    try {
      return new Date(service.emailDate).toLocaleDateString(
        language === 'de' ? 'de-DE' : 'en-GB',
        { year: 'numeric', month: 'short', day: 'numeric' },
      );
    } catch {
      return service.emailDate;
    }
  }, [service.emailDate, language]);

  return (
    <label
      htmlFor={`service-${service.id}`}
      className={[
        'relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200',
        selected
          ? 'bg-[var(--color-forest)]/5 border-[var(--color-forest)]/30 shadow-sm'
          : 'bg-white border-[var(--color-sand)] hover:border-[var(--color-sage)] hover:shadow-sm hover:-translate-y-px',
      ].join(' ')}
    >
      <div className="mt-0.5 shrink-0">
        <input
          type="checkbox"
          id={`service-${service.id}`}
          checked={selected}
          onChange={() => onToggle(service.id)}
          className="sr-only"
        />
        <div
          className={[
            'h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-200',
            selected
              ? 'bg-[var(--color-forest)] border-[var(--color-forest)]'
              : 'border-[var(--color-sand)] bg-white',
          ].join(' ')}
          aria-hidden="true"
        >
          {selected && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {service.sourceType === 'newsletter' && (
              <svg className="h-3.5 w-3.5 text-[var(--color-ink-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            <p className="font-semibold text-[var(--color-ink)] text-sm leading-tight">{service.name}</p>
            {isNew && (
              <span className="inline-flex px-1.5 py-0.5 rounded-full bg-[var(--color-teal)]/10 text-[var(--color-teal)] border border-[var(--color-teal)]/30 text-xs font-medium">
                {t.scan.newSinceLastScan}
              </span>
            )}
          </div>
          <DifficultyBadge difficulty={service.difficulty} webform={service.webform} region={service.region} />
        </div>
        <p className="text-[var(--color-ink-muted)] text-xs mt-2 truncate">{service.domain} · {formattedDate}</p>
      </div>
    </label>
  );
}

function ScanProgressBar() {
  const progress = useStore($scanProgress);
  const language = useStore($language);
  const t = useTranslation(language);

  if (!progress) return null;

  const pct =
    progress.total > 0
      ? Math.min(100, Math.round((progress.scanned / progress.total) * 100))
      : 0;

  return (
    <div className="rounded-2xl bg-white border border-[var(--color-sand)] p-6 text-center space-y-4 shadow-sm">
      <div className="flex items-center justify-center gap-3">
        <svg className="animate-spin h-5 w-5 text-[var(--color-forest)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-[var(--color-ink)] font-semibold">{t.scan.scanning}</span>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 w-full rounded-full bg-[var(--color-cream-dark)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-sage)] transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-[var(--color-ink-light)] text-xs">
          {progress.scanned.toLocaleString()} / {progress.total.toLocaleString()}
          {' '}— {t.scan.foundServices(progress.found)}
        </p>
      </div>
    </div>
  );
}

interface ActionBarProps {
  selectedCount: number;
  onSendRequests: () => void;
}

function ActionBar({ selectedCount, onSendRequests }: ActionBarProps) {
  const language = useStore($language);
  const t = useTranslation(language);
  const services = useStore($services);

  const selectedServices = services.filter((s) => s.selected);

  const mailtoHref = useMemo(() => {
    if (selectedServices.length === 0) return '#';
    const first = selectedServices[0]!;
    const subj = encodeURIComponent(
      language === 'de'
        ? 'Antrag auf Löschung personenbezogener Daten gemäß Art. 17 DSGVO'
        : 'Request for erasure of personal data under Art. 17 GDPR',
    );
    return `mailto:${first.privacyEmail ?? ''}?subject=${subj}`;
  }, [selectedServices, language]);

  return (
    <div className="sticky bottom-0 z-10 mt-4 px-0">
      <div className="rounded-2xl bg-white border border-[var(--color-sand)] p-4 flex flex-col sm:flex-row items-center gap-3 shadow-md">
        <div className="flex-1 text-sm text-[var(--color-ink-light)]">
          <span className="text-[var(--color-ink)] font-semibold">{selectedCount}</span>{' '}
          {t.services.selected}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <a
            href={mailtoHref}
            className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-teal)] transition-colors duration-200 underline underline-offset-2"
          >
            {t.services.openInEmailClient}
          </a>
          <button
            onClick={onSendRequests}
            disabled={selectedCount === 0}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] disabled:bg-[var(--color-sand)] disabled:text-[var(--color-ink-muted)] text-white font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {t.services.sendDeletionRequest}{' '}
            {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ScanResultsProps {
  onSendRequests: (services: DiscoveredService[]) => void;
}

export default function ScanResults({ onSendRequests }: ScanResultsProps) {
  const language = useStore($language);
  const t = useTranslation(language);
  const services = useStore($services);
  const scanProgress = useStore($scanProgress);
  const credentials = useStore($credentials);
  const lastScanDate = useStore($lastScanDate);
  const previousServices = useStore($previousServices);

  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'account' | 'newsletter'>('all');
  const [hasStartedScan, setHasStartedScan] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvImportResult, setCsvImportResult] = useState<number | null>(null);
  const [modalSearch, setModalSearch] = useState('');
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showAllBrokers, setShowAllBrokers] = useState(false);
  const [dropDismissed, setDropDismissed] = useState(false);

  useEffect(() => {
    if (hasStartedScan || !credentials) return;
    if (scanProgress?.scanned != null && scanProgress.scanned > 0) return;

    setHasStartedScan(true);

    const startScan = async () => {
      try {
        const creds = getCredentials();
        if (!creds) return;

        $scanProgress.set({ scanned: 0, total: 0, found: 0 });

        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: creds.imap.host,
            port: creds.imap.port,
            user: creds.email,
            pass: creds.password,
            secure: creds.imap.secure,
            folders: creds.folders,
          }),
        });

        const data = (await res.json()) as {
          success: boolean;
          services?: Array<{
            name: string;
            domain: string;
            email: string;
            date: string;
            subject: string;
            matchType: 'subject' | 'from';
            sourceType: 'account' | 'newsletter';
          }>;
          stats?: { totalScanned: number; matchesFound: number };
          error?: string;
        };

        if (!data.success || !data.services) {
          $scanProgress.set(null);
          return;
        }

        const mapped: DiscoveredService[] = data.services.map((entry) => {
          const company = companies.find((c) =>
            c.domains.some(
              (d) => entry.domain.includes(d) || d.includes(entry.domain),
            ),
          );

          return {
            id: crypto.randomUUID(),
            name: entry.name,
            domain: entry.domain,
            privacyEmail: company?.privacyEmail || null,
            deleteUrl: company?.deleteUrl ?? null,
            difficulty: (company?.difficulty as DiscoveredService['difficulty']) ?? 'medium',
            emailDate: entry.date,
            emailSubject: entry.subject,
            selected: false,
            region: (company as Record<string, unknown>)?.region as string | undefined,
            categories: (company as Record<string, unknown>)?.categories as string[] | undefined,
            webform: (company as Record<string, unknown>)?.webform as string | undefined,
            runs: (company as Record<string, unknown>)?.runs as string[] | undefined,
            sourceType: entry.sourceType,
          };
        });

        $previousServices.set($services.get());
        $lastScanDate.set(new Date().toISOString());
        $services.set(mapped);
        $scanProgress.set({
          scanned: data.stats?.totalScanned ?? mapped.length,
          total: data.stats?.totalScanned ?? mapped.length,
          found: mapped.length,
        });

        setTimeout(() => $scanProgress.set(null), 600);
      } catch {
        $scanProgress.set(null);
      }
    };

    void startScan();
  }, [credentials, hasStartedScan, scanProgress]);

  const isScanning = scanProgress !== null;

  const previousDomains = useMemo(
    () => new Set(previousServices.map((s) => s.domain)),
    [previousServices],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = services;
    if (sourceFilter !== 'all') {
      result = result.filter((s) => (s.sourceType ?? 'account') === sourceFilter);
    }
    if (!q) return result;
    return result.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.domain.toLowerCase().includes(q),
    );
  }, [services, search, sourceFilter]);

  const selectedCount = useMemo(
    () => services.filter((s) => s.selected).length,
    [services],
  );

  const handleToggle = useCallback((id: string) => {
    $services.set(
      $services.get().map((s) => (s.id === id ? { ...s, selected: !s.selected } : s)),
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    $services.set($services.get().map((s) => ({ ...s, selected: true })));
  }, []);

  const handleDeselectAll = useCallback(() => {
    $services.set($services.get().map((s) => ({ ...s, selected: false })));
  }, []);

  const handleSendRequests = useCallback(() => {
    const selected = services.filter((s) => s.selected);
    if (selected.length > 0) onSendRequests(selected);
  }, [services, onSendRequests]);

  const existingDomains = useMemo(
    () => new Set(services.flatMap((s) => s.domain ? [s.domain] : [])),
    [services],
  );

  const brokerRecommendations = useMemo(() => {
    const brokerCategories = new Set(['addresses', 'credit agency', 'ads']);
    return companies.filter((c) => {
      const cats = (c as Record<string, unknown>).categories as string[] | undefined;
      if (!cats?.some((cat) => brokerCategories.has(cat))) return false;
      if (!c.privacyEmail) return false;
      const firstDomain = c.domains[0];
      if (!firstDomain) return false;
      return !c.domains.some((d) => existingDomains.has(d));
    });
  }, [existingDomains]);

  const visibleBrokers = showAllBrokers ? brokerRecommendations.slice(0, 15) : brokerRecommendations.slice(0, 5);

  const showDropBanner = !dropDismissed && brokerRecommendations.filter(
    (c) => (c as Record<string, unknown>).region === 'us',
  ).length >= 3;

  const handleAddBroker = useCallback((company: (typeof companies)[number]) => {
    const newService: DiscoveredService = {
      id: crypto.randomUUID(),
      name: company.name,
      domain: company.domains[0] ?? '',
      privacyEmail: company.privacyEmail || null,
      deleteUrl: company.deleteUrl ?? null,
      difficulty: (company.difficulty as Difficulty) ?? 'medium',
      emailDate: new Date().toISOString(),
      emailSubject: '',
      selected: true,
      region: (company as Record<string, unknown>).region as string | undefined,
      categories: (company as Record<string, unknown>).categories as string[] | undefined,
      webform: (company as Record<string, unknown>).webform as string | undefined,
      runs: (company as Record<string, unknown>).runs as string[] | undefined,
    };
    $services.set([...$services.get(), newService]);
    setAddedId(newService.id);
    setTimeout(() => setAddedId(null), 1500);
  }, []);

  const modalResults = useMemo(() => {
    const q = modalSearch.toLowerCase().trim();
    if (!q) return [];
    return companies
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.domains.some((d) => d.toLowerCase().includes(q)),
      )
      .slice(0, 20);
  }, [modalSearch]);

  const handleAddCompany = useCallback(
    (company: (typeof companies)[number]) => {
      const newService: DiscoveredService = {
        id: crypto.randomUUID(),
        name: company.name,
        domain: company.domains[0] ?? '',
        privacyEmail: company.privacyEmail || null,
        deleteUrl: company.deleteUrl ?? null,
        difficulty: (company.difficulty as Difficulty) ?? 'medium',
        emailDate: new Date().toISOString(),
        emailSubject: '',
        selected: true,
        region: (company as Record<string, unknown>).region as string | undefined,
        categories: (company as Record<string, unknown>).categories as string[] | undefined,
        webform: (company as Record<string, unknown>).webform as string | undefined,
        runs: (company as Record<string, unknown>).runs as string[] | undefined,
      };
      $services.set([...$services.get(), newService]);
      setAddedId(newService.id);
      setShowAddModal(false);
      setModalSearch('');
      setTimeout(() => setAddedId(null), 1500);
    },
    [],
  );

  const handleCsvImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;

      const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const urlColIndex = headers.findIndex((h) =>
        ['url', 'login_uri', 'urls', 'URL', 'Login URL'].includes(h),
      );
      if (urlColIndex === -1) {
        setShowCsvModal(false);
        return;
      }

      const existingDomains = new Set($services.get().map((s) => s.domain));
      const newServices: DiscoveredService[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]!.trim();
        if (!line) continue;

        const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        const rawUrl = cols[urlColIndex];
        if (!rawUrl) continue;

        let hostname: string;
        try {
          const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
          hostname = url.hostname.replace(/^www\./, '');
        } catch {
          continue;
        }

        const parts = hostname.split('.');
        const rootDomain = parts.length >= 2 ? parts.slice(-2).join('.') : hostname;

        if (existingDomains.has(rootDomain)) continue;

        const company = companies.find((c) =>
          c.domains.some((d) => d === rootDomain || rootDomain.endsWith(`.${d}`) || d.endsWith(`.${rootDomain}`)),
        );

        if (!company) continue;

        existingDomains.add(rootDomain);
        newServices.push({
          id: crypto.randomUUID(),
          name: company.name,
          domain: rootDomain,
          privacyEmail: company.privacyEmail || null,
          deleteUrl: company.deleteUrl ?? null,
          difficulty: (company.difficulty as Difficulty) ?? 'medium',
          emailDate: new Date().toISOString(),
          emailSubject: '',
          selected: true,
          region: (company as Record<string, unknown>).region as string | undefined,
          categories: (company as Record<string, unknown>).categories as string[] | undefined,
          webform: (company as Record<string, unknown>).webform as string | undefined,
          runs: (company as Record<string, unknown>).runs as string[] | undefined,
        });
      }

      if (newServices.length > 0) {
        $services.set([...$services.get(), ...newServices]);
      }
      setCsvImportResult(newServices.length);
      setTimeout(() => {
        setShowCsvModal(false);
        setCsvImportResult(null);
      }, 1800);
    };
    reader.readAsText(file);
  }, []);

  if (isScanning && services.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <ScanProgressBar />
      </div>
    );
  }

  if (!isScanning && services.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-[var(--color-cream-dark)] border border-[var(--color-sand)] mx-auto">
          <svg className="h-8 w-8 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-[var(--color-ink)] font-semibold">{t.scan.noServicesFound}</p>
        <p className="text-[var(--color-ink-light)] text-sm">
          {t.scan.noRegistrationEmails}
        </p>
        <button
          onClick={() => $currentStep.set('setup')}
          className="px-5 py-2.5 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-sm font-medium transition-all duration-200"
        >
          {t.general.back}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <div className="rounded-2xl bg-white border border-[var(--color-sand)] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-2xl font-bold text-[var(--color-ink)]">{services.length}</p>
            <p className="text-[var(--color-ink-light)] text-sm">
              {t.scan.foundServices(services.length)}
              {scanProgress && (
                <span className="ml-2 text-[var(--color-ink-muted)]">
                  — {scanProgress.scanned.toLocaleString()}{' '}
                  {t.scan.emailsScanned}
                </span>
              )}
            </p>
            {lastScanDate && !isScanning && (
              <p className="text-[var(--color-ink-muted)] text-xs mt-1">
                {t.scan.lastScanDate}:{' '}
                {new Date(lastScanDate).toLocaleDateString(
                  language === 'de' ? 'de-DE' : 'en-GB',
                  { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
                )}
              </p>
            )}
          </div>
          {isScanning && (
            <div className="flex items-center gap-2 text-[var(--color-sage)] text-sm">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t.scan.scanning}
            </div>
          )}
        </div>

        {isScanning && scanProgress && (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-[var(--color-cream-dark)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-sage)] transition-all duration-500"
                style={{
                  width: scanProgress.total > 0
                    ? `${Math.min(100, (scanProgress.scanned / scanProgress.total) * 100)}%`
                    : '0%',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-cream-dark)] border border-[var(--color-sand)]">
        {(['all', 'account', 'newsletter'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setSourceFilter(filter)}
            className={[
              'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
              sourceFilter === filter
                ? 'bg-white text-[var(--color-ink)] shadow-sm'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
            ].join(' ')}
          >
            {filter === 'all' ? t.scan.all : filter === 'account' ? t.scan.accounts : t.scan.newsletters}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.scan.filterServices}
            aria-label={t.scan.filterServices}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:border-[var(--color-sage)] transition-all duration-200"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-forest)] hover:border-[var(--color-forest)] text-sm font-medium transition-all duration-200"
          >
            {t.scan.selectAll}
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-4 py-2.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-forest)] hover:border-[var(--color-forest)] text-sm font-medium transition-all duration-200"
          >
            {t.scan.selectNone}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] text-white text-sm font-medium transition-all duration-200"
          >
            {t.scan.addManually}
          </button>
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-forest)] hover:border-[var(--color-forest)] text-sm font-medium transition-all duration-200"
          >
            {t.scan.importPasswords}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[var(--color-ink-muted)] py-8 text-sm">
          {t.scan.noSearchResults}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              selected={service.selected}
              onToggle={handleToggle}
              isNew={previousDomains.size > 0 && !previousDomains.has(service.domain)}
            />
          ))}
        </div>
      )}

      {brokerRecommendations.length > 0 && (
        <div className="rounded-2xl bg-white border border-[var(--color-sand)] p-5 shadow-sm space-y-4">
          <div>
            <h2 className="font-semibold text-[var(--color-ink)] text-base">{t.scan.recommendedDeletions}</h2>
            <p className="text-[var(--color-ink-muted)] text-xs mt-1">{t.scan.dataBrokerNotice}</p>
          </div>

          {showDropBanner && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
              <svg className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-blue-700 text-xs leading-relaxed flex-1">{t.scan.dropPlatformHint}</p>
              <button
                onClick={() => setDropDismissed(true)}
                className="h-5 w-5 shrink-0 flex items-center justify-center text-blue-400 hover:text-blue-600 transition-colors"
                aria-label={t.general.cancel}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {visibleBrokers.map((company) => {
              const cats = (company as Record<string, unknown>).categories as string[] | undefined;
              const brokerCategories = ['addresses', 'credit agency', 'ads'];
              const displayCat = cats?.find((c) => brokerCategories.includes(c));
              return (
                <div
                  key={company.name}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--color-sand)] bg-white"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--color-ink)] text-sm truncate">{company.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <p className="text-[var(--color-ink-muted)] text-xs truncate">{company.domains[0]}</p>
                      {displayCat && (
                        <span className="inline-flex px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium">
                          {displayCat}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddBroker(company)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] text-white text-xs font-medium transition-all duration-200"
                  >
                    {t.scan.addToList}
                  </button>
                </div>
              );
            })}
          </div>

          {!showAllBrokers && brokerRecommendations.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllBrokers(true)}
              className="w-full py-2 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-sm font-medium transition-all duration-200"
            >
              {t.scan.showMore}
            </button>
          )}
        </div>
      )}

      <ActionBar
        selectedCount={selectedCount}
        onSendRequests={handleSendRequests}
      />

      {addedId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[var(--color-forest)] text-white text-sm font-medium shadow-lg animate-fade-in">
          {t.scan.addedSuccessfully}
        </div>
      )}

      {showAddModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setModalSearch('');
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[var(--color-sand)] shadow-xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-[var(--color-sand)] flex items-center justify-between gap-3">
              <h3 className="font-semibold text-[var(--color-ink)]">{t.scan.addManually}</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setModalSearch('');
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] transition-all duration-200"
                aria-label={t.general.cancel}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-muted)] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  placeholder={t.scan.searchCompanies}
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:border-[var(--color-sage)] transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
              {modalResults.length === 0 && modalSearch.trim() !== '' && (
                <p className="text-center text-[var(--color-ink-muted)] py-6 text-sm">
                  {t.scan.noSearchResults}
                </p>
              )}
              {modalResults.map((company) => (
                <button
                  key={company.name}
                  type="button"
                  onClick={() => handleAddCompany(company)}
                  className="w-full text-left p-3 rounded-xl border border-[var(--color-sand)] bg-white hover:border-[var(--color-forest)] hover:bg-[var(--color-forest)]/5 transition-all duration-200"
                >
                  <p className="font-medium text-[var(--color-ink)] text-sm">{company.name}</p>
                  <p className="text-[var(--color-ink-muted)] text-xs mt-0.5">
                    {company.domains.slice(0, 3).join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCsvModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && csvImportResult === null) {
              setShowCsvModal(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[var(--color-sand)] shadow-xl">
            <div className="p-5 border-b border-[var(--color-sand)] flex items-center justify-between gap-3">
              <h3 className="font-semibold text-[var(--color-ink)]">{t.scan.importPasswords}</h3>
              <button
                onClick={() => setShowCsvModal(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-cream-dark)] transition-all duration-200"
                aria-label={t.general.cancel}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--color-cream-dark)] border border-[var(--color-sand)]">
                <svg className="h-4 w-4 shrink-0 mt-0.5 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[var(--color-ink-muted)] text-xs leading-relaxed">{t.scan.importNotice}</p>
              </div>
              {csvImportResult !== null ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-mint)]/15 border border-[var(--color-mint)]/30 text-[var(--color-sage)] text-sm">
                  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {t.scan.importedServices(csvImportResult)}
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-[var(--color-sand)] hover:border-[var(--color-sage)] cursor-pointer transition-all duration-200 group">
                  <svg className="h-8 w-8 text-[var(--color-ink-muted)] group-hover:text-[var(--color-sage)] transition-colors duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-[var(--color-ink-light)] group-hover:text-[var(--color-ink)] transition-colors duration-200">{t.scan.importFile}</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCsvImport(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
