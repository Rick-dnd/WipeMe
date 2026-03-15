import { useState, useEffect, Fragment } from 'react';
import { useStore } from '@nanostores/react';
import {
  $currentStep,
  $language,
  $isConnected,
  $sentRequests,
  $notificationsEnabled,
  $lastNotifiedAt,
  type AppStep,
  type DiscoveredService,
} from '../lib/stores.ts';
import { useTranslation, type Translations, type Language } from '../lib/i18n.ts';
import LanguageToggle from './LanguageToggle.tsx';
import SetupWizard from './SetupWizard.tsx';
import ScanResults from './ScanResults.tsx';
import DeleteRequestForm from './DeleteRequestForm.tsx';
import BatchSendModal from './BatchSendModal.tsx';
import TrackingDashboard from './TrackingDashboard.tsx';

function LogoMark() {
  return <img src="/logo.svg" alt="WipeMe" className="w-7 h-7 shrink-0" />;
}

const STEPS: AppStep[] = ['setup', 'scanning', 'results', 'tracking'];

function StepIndicator({
  currentStep,
  t,
}: {
  currentStep: AppStep;
  t: Translations;
}) {
  const currentIndex = STEPS.indexOf(currentStep);

  const labels: Record<AppStep, string> = {
    setup: t.steps.connect,
    scanning: t.steps.scan,
    results: t.steps.services,
    tracking: t.steps.requests,
  };

  return (
    <nav aria-label="Progress steps" className="hidden sm:flex items-center gap-1">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step} className="flex items-center gap-1">
            {index > 0 && (
              <div
                className={[
                  'w-5 h-px transition-colors duration-300',
                  isDone ? 'bg-[var(--color-sage)]/50' : 'bg-[var(--color-sand)]',
                ].join(' ')}
                aria-hidden="true"
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={[
                  'rounded-full transition-all duration-300',
                  isCurrent
                    ? 'h-2 w-2 bg-[var(--color-forest)] ring-2 ring-[var(--color-forest)]/20'
                    : isDone
                      ? 'h-1.5 w-1.5 bg-[var(--color-sage)]/60'
                      : 'h-1.5 w-1.5 bg-[var(--color-sand)]',
                ].join(' ')}
                aria-hidden="true"
              />
              <span
                className={[
                  'text-xs font-medium transition-colors duration-200',
                  isCurrent
                    ? 'text-[var(--color-forest)]'
                    : isDone
                      ? 'text-[var(--color-ink-muted)]'
                      : 'text-[var(--color-ink-muted)]',
                ].join(' ')}
              >
                {labels[step]}
              </span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function AppFooter({ t, language }: { t: Translations; language: Language }) {
  const prefix = language === 'de' ? '' : '/en';
  const links = [
    { href: `${prefix}/legal`, label: t.footer.legal },
    { href: `${prefix}/privacy`, label: t.footer.privacy },
    { href: `${prefix}/faq`, label: t.footer.faq },
    { href: `${prefix}/why`, label: t.footer.why },
  ];

  return (
    <footer className="py-12 px-6 border-t border-[var(--color-sand)]">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="WipeMe" className="w-5 h-5 opacity-50" />
          <span className="text-sm text-[var(--color-ink-muted)]">{t.footer.copy}</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6 flex-wrap justify-center">
          {links.map((link, i) => (
            <Fragment key={link.href}>
              {i > 0 && <span className="text-[var(--color-sand)] hidden md:inline">|</span>}
              <a
                href={link.href}
                className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-forest)] transition-colors"
              >
                {link.label}
              </a>
            </Fragment>
          ))}
          <span className="text-[var(--color-sand)] hidden md:inline">|</span>
          <a
            href="https://github.com/Rick-dnd/WipeMe"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

function ScanningView({ t }: { t: Translations }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="relative h-20 w-20 mx-auto">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--color-forest)]/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-[var(--color-forest)]/30 animate-ping [animation-delay:200ms]" />
          <div className="absolute inset-4 rounded-full border-2 border-[var(--color-forest)]/60 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-7 w-7 text-[var(--color-forest)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-[var(--color-ink)] font-semibold text-lg">
            {t.scan.scanningInbox}
          </p>
          <p className="text-[var(--color-ink-light)] text-sm leading-relaxed">
            {t.scan.scanningDescription}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const currentStep = useStore($currentStep);
  const language = useStore($language);
  const isConnected = useStore($isConnected);
  const sentRequests = useStore($sentRequests);
  const t = useTranslation(language);

  useEffect(() => {
    const isEnglishPath = window.location.pathname.startsWith('/en/');
    $language.set(isEnglishPath ? 'en' : 'de');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ($notificationsEnabled.get() !== 'true') return;
    if (Notification.permission !== 'granted') return;

    const today = new Date().toISOString().slice(0, 10);
    if ($lastNotifiedAt.get() === today) return;

    const requests = $sentRequests.get();
    const pending = requests.filter((r) => r.status === 'pending' || r.status === 'expired');

    for (const r of pending) {
      const days = Math.ceil((new Date(r.deadlineAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (days <= 7) {
        new Notification(`WipeMe: ${r.serviceName}`, {
          body: days < 0
            ? `Frist ${Math.abs(days)} Tage überfällig`
            : `Frist in ${days} Tagen`,
          icon: '/logo.svg',
        });
      }
    }

    $lastNotifiedAt.set(today);
  }, []);

  useEffect(() => {
    if (currentStep === 'scanning' && isConnected) {
      $currentStep.set('results');
    }
  }, [currentStep, isConnected]);

  const [deletionTargets, setDeletionTargets] = useState<DiscoveredService[]>([]);
  const [deletionIndex, setDeletionIndex] = useState(0);

  const currentDeletionTarget = deletionTargets[deletionIndex] ?? null;

  const pendingCount = sentRequests.filter((r) => r.status !== 'completed').length;

  const handleSendRequests = (services: DiscoveredService[]) => {
    if (services.length === 0) return;
    setDeletionTargets(services);
    setDeletionIndex(0);
  };

  const handleModalClose = () => {
    if (deletionIndex + 1 < deletionTargets.length) {
      setDeletionIndex((i) => i + 1);
    } else {
      setDeletionTargets([]);
      setDeletionIndex(0);
    }
  };

  const renderView = () => {
    switch (currentStep) {
      case 'setup':
        return <SetupWizard />;

      case 'scanning':
        return <ScanningView t={t} />;

      case 'results':
        return <ScanResults onSendRequests={handleSendRequests} />;

      case 'tracking':
        return <TrackingDashboard />;

      default:
        return <SetupWizard />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)] antialiased">
      <header className="sticky top-0 z-40 w-full border-b border-[var(--color-sand)] bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <a
            href={language === 'de' ? '/' : '/en/'}
            className="flex items-center gap-2 group"
            aria-label="WipeMe"
          >
            <LogoMark />
            <span className="font-bold text-[var(--color-forest)] text-sm tracking-tight group-hover:text-[var(--color-forest-light)] transition-colors duration-200">
              WipeMe
            </span>
          </a>

          <div className="flex-1 flex justify-center">
            <StepIndicator currentStep={currentStep} t={t} />
          </div>

          <div className="flex items-center gap-2.5">
            {pendingCount > 0 && currentStep !== 'tracking' && (
              <button
                onClick={() => $currentStep.set('tracking')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--color-cream-dark)] border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-xs font-medium transition-all duration-200"
                aria-label={t.general.openRequests(pendingCount)}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                {pendingCount} {t.general.open}
              </button>
            )}
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main id="main-content">
        {renderView()}
      </main>

      <AppFooter t={t} language={language} />

      {deletionTargets.length > 1 && (
        <BatchSendModal
          services={deletionTargets}
          onClose={() => {
            setDeletionTargets([]);
            setDeletionIndex(0);
          }}
          onComplete={() => {
            setDeletionTargets([]);
            setDeletionIndex(0);
          }}
        />
      )}

      {deletionTargets.length === 1 && currentDeletionTarget && (
        <DeleteRequestForm
          service={currentDeletionTarget}
          onClose={handleModalClose}
          onSent={() => {
            handleModalClose();
          }}
        />
      )}
    </div>
  );
}
