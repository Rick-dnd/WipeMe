import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { detectProvider, type EmailProvider } from '../lib/providers.ts';
import {
  $credentials,
  $currentStep,
  $isConnected,
  $language,
} from '../lib/stores.ts';
import { useTranslation } from '../lib/i18n.ts';
import Spinner from './Spinner.tsx';

type WizardStep = 1 | 2 | 3;

type TestResult =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; mailboxes: string[] }
  | { state: 'error'; message: string };

function ProviderBadge({ provider }: { provider: EmailProvider }) {
  const colorMap: Record<string, string> = {
    gmail: 'bg-red-50 text-red-600 border-red-200',
    outlook: 'bg-blue-50 text-blue-600 border-blue-200',
    yahoo: 'bg-purple-50 text-purple-600 border-purple-200',
    icloud: 'bg-sky-50 text-sky-600 border-sky-200',
    proton: 'bg-violet-50 text-violet-600 border-violet-200',
    gmx: 'bg-orange-50 text-orange-600 border-orange-200',
    webde: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    tonline: 'bg-pink-50 text-pink-600 border-pink-200',
    custom: 'bg-[var(--color-cream-dark)] text-[var(--color-ink-light)] border-[var(--color-sand)]',
  };
  const color = colorMap[provider.id] ?? colorMap['custom']!;
  const initials = provider.name.slice(0, 2).toUpperCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${color} transition-all duration-300`}
    >
      <span className="text-base leading-none">{initials}</span>
      {provider.name}
    </span>
  );
}

function StepDots({ current }: { current: WizardStep }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {([1, 2, 3] as WizardStep[]).map((n) => (
        <div
          key={n}
          className={[
            'h-2 rounded-full transition-all duration-300',
            n === current
              ? 'w-6 bg-[var(--color-forest)]'
              : n < current
                ? 'w-2 bg-[var(--color-sage)]/50'
                : 'w-2 bg-[var(--color-sand)]',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

export default function SetupWizard() {
  const language = useStore($language);
  const tr = useTranslation(language);

  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [provider, setProvider] = useState<EmailProvider | null>(null);
  const [testResult, setTestResult] = useState<TestResult>({ state: 'idle' });
  const [selectedFolders, setSelectedFolders] = useState<string[]>(['INBOX']);

  useEffect(() => {
    if (email.includes('@')) {
      setProvider(detectProvider(email));
    } else {
      setProvider(null);
    }
  }, [email]);

  const handleEmailNext = useCallback(() => {
    if (email.trim() && email.includes('@')) {
      setWizardStep(2);
    }
  }, [email]);

  const handleTestConnection = useCallback(async () => {
    if (!email || !password || !provider) return;

    setTestResult({ state: 'loading' });

    try {
      const res = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: provider.imap.host,
          port: provider.imap.port,
          user: email,
          pass: password,
          secure: provider.imap.secure,
        }),
      });

      const data = (await res.json()) as { success: boolean; mailboxes?: string[]; error?: string };

      if (!data.success) {
        setTestResult({
          state: 'error',
          message: data.error ?? tr.setup.connectionFailed,
        });
        return;
      }

      const mailboxes = data.mailboxes ?? ['INBOX'];
      setSelectedFolders(['INBOX']);
      $isConnected.set(true);
      setTestResult({ state: 'success', mailboxes });
    } catch (err) {
      setTestResult({
        state: 'error',
        message: err instanceof Error ? err.message : tr.setup.connectionFailed,
      });
    }
  }, [email, password, provider, tr]);

  const handleToggleFolder = useCallback((folder: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folder) ? prev.filter((f) => f !== folder) : [...prev, folder],
    );
  }, []);

  const handleContinueToScan = useCallback(() => {
    if (!provider) return;
    $credentials.set(
      JSON.stringify({
        email,
        password,
        imap: provider.imap,
        smtp: provider.smtp,
        folders: selectedFolders,
      }),
    );
    $currentStep.set('scanning');
  }, [email, password, provider, selectedFolders]);

  const renderStep1 = () => (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-forest)]">{tr.setup.connectEmail}</h2>
        <p className="text-[var(--color-ink-light)] text-sm">
          {tr.setup.step1Description}
        </p>
      </div>

      <div className="w-full space-y-3">
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailNext()}
            placeholder={tr.setup.emailAddress}
            autoFocus
            aria-label={tr.setup.emailAddress}
            className="w-full px-4 py-3.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:border-[var(--color-sage)] transition-all duration-200"
          />
          {provider && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-fade-in">
              <ProviderBadge provider={provider} />
            </div>
          )}
        </div>

        {provider && provider.id !== 'custom' && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-mint)]/10 border border-[var(--color-mint)]/30 text-[var(--color-sage)] text-xs animate-fade-in">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {tr.setup.providerDetected(provider.name)}
          </div>
        )}
      </div>

      <button
        onClick={handleEmailNext}
        disabled={!email.includes('@')}
        className="w-full py-3 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] disabled:bg-[var(--color-sand)] disabled:text-[var(--color-ink-muted)] text-white font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed"
      >
        {tr.general.next}
      </button>
    </div>
  );

  const renderStep2 = () => {
    const guide = provider?.guide ?? {
      steps: [
        {
          de: 'Öffne die Sicherheitseinstellungen deines E-Mail-Anbieters.',
          en: 'Open your email provider security settings.',
        },
        {
          de: 'Erstelle ein App-Passwort für WipeMe.',
          en: 'Create an app password for WipeMe.',
        },
      ],
    };

    return (
      <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-[var(--color-forest)]">
            {tr.setup.createAppPassword}
          </h2>
          {provider && (
            <div className="flex justify-center">
              <ProviderBadge provider={provider} />
            </div>
          )}
        </div>

        <ol className="space-y-3">
          {guide.steps.map((step, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-forest)]/10 text-[var(--color-forest)] text-xs font-bold mt-0.5 border border-[var(--color-forest)]/20">
                {i + 1}
              </span>
              <span className="text-[var(--color-ink-light)] text-sm leading-relaxed">{step[language]}</span>
            </li>
          ))}
        </ol>

        {provider?.guide.url && (
          <a
            href={provider.guide.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[var(--color-teal)] hover:text-[var(--color-sage)] text-sm transition-colors duration-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {tr.setup.openProviderSettings}
          </a>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setWizardStep(1)}
            className="flex-1 py-3 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-sm font-medium transition-all duration-200"
          >
            {tr.general.back}
          </button>
          <button
            onClick={() => setWizardStep(3)}
            className="flex-[2] py-3 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] text-white font-semibold text-sm transition-all duration-200"
          >
            {tr.setup.haveAppPassword}
          </button>
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-[var(--color-forest)]">{tr.setup.testConnection}</h2>
        <p className="text-[var(--color-ink-light)] text-sm">
          {email}
        </p>
      </div>

      <div className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTestConnection()}
          placeholder={tr.setup.appPassword}
          autoFocus
          aria-label={tr.setup.appPassword}
          className="w-full px-4 py-3.5 rounded-xl bg-white border border-[var(--color-sand)] text-[var(--color-ink)] placeholder-[var(--color-ink-muted)] text-base focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)]/30 focus:border-[var(--color-sage)] transition-all duration-200"
        />

        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-[var(--color-cream-dark)] border border-[var(--color-sand)] text-[var(--color-ink-muted)] text-xs">
          <svg className="h-4 w-4 shrink-0 text-[var(--color-forest)] mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>
            {tr.setup.securityNotice}
          </span>
        </div>
      </div>

      {testResult.state === 'success' && (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-mint)]/15 border border-[var(--color-mint)]/30 text-[var(--color-sage)] text-sm">
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {tr.setup.connectedSuccessfully}
          </div>

          <div className="rounded-xl border border-[var(--color-sand)] bg-[var(--color-cream-dark)] p-4 space-y-3">
            <p className="text-xs font-semibold text-[var(--color-ink-light)] uppercase tracking-wide">
              {tr.scan.selectFolders}
            </p>
            <div className="flex flex-wrap gap-2">
              {testResult.mailboxes.map((folder) => {
                const active = selectedFolders.includes(folder);
                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => handleToggleFolder(folder)}
                    className={[
                      'px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200',
                      active
                        ? 'bg-[var(--color-forest)] border-[var(--color-forest)] text-white'
                        : 'bg-white border-[var(--color-sand)] text-[var(--color-ink-light)] hover:border-[var(--color-sage)]',
                    ].join(' ')}
                  >
                    {folder}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {testResult.state === 'error' && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm animate-fade-in">
          <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>
            <span className="font-medium">{tr.setup.connectionFailed}:</span>{' '}
            {testResult.message}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => {
            setWizardStep(2);
            setTestResult({ state: 'idle' });
          }}
          disabled={testResult.state === 'loading'}
          className="flex-1 py-3 rounded-xl border border-[var(--color-sand)] text-[var(--color-ink-light)] hover:text-[var(--color-ink)] hover:border-[var(--color-sage)] text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tr.general.back}
        </button>
        {testResult.state === 'success' ? (
          <button
            onClick={handleContinueToScan}
            disabled={selectedFolders.length === 0}
            className="flex-[2] py-3 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] disabled:bg-[var(--color-sand)] disabled:text-[var(--color-ink-muted)] text-white font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed"
          >
            {tr.scan.continueToScan}
          </button>
        ) : (
          <button
            onClick={handleTestConnection}
            disabled={!password || testResult.state === 'loading'}
            className="flex-[2] py-3 rounded-xl bg-[var(--color-forest)] hover:bg-[var(--color-forest-light)] disabled:bg-[var(--color-sand)] disabled:text-[var(--color-ink-muted)] text-white font-semibold text-sm transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {testResult.state === 'loading' ? (
              <>
                <Spinner />
                {tr.general.loading}
              </>
            ) : (
              tr.setup.testConnection
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl bg-white border border-[var(--color-sand)] p-8 shadow-sm">
          <StepDots current={wizardStep} />
          {wizardStep === 1 && renderStep1()}
          {wizardStep === 2 && renderStep2()}
          {wizardStep === 3 && renderStep3()}
        </div>

        <p className="text-center text-[var(--color-ink-muted)] text-xs mt-6">
          {tr.setup.footerNotice}
        </p>
      </div>
    </div>
  );
}
