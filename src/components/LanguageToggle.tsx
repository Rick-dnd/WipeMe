import { useStore } from '@nanostores/react';
import { $language, setLanguage } from '../lib/stores.ts';
import type { Language } from '../lib/i18n.ts';

function switchLang(lang: Language) {
  setLanguage(lang);
  const target = lang === 'de' ? '/app' : '/en/app';
  if (window.location.pathname !== target) {
    window.history.replaceState({}, '', target);
  }
}

export default function LanguageToggle() {
  const language = useStore($language);

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-white p-1 border border-[var(--color-sand)]">
      <button
        onClick={() => switchLang('de')}
        aria-label={language === 'de' ? 'Deutsch (aktiv)' : 'Zu Deutsch wechseln'}
        aria-pressed={language === 'de'}
        className={[
          'px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider transition-all duration-200',
          language === 'de'
            ? 'bg-[var(--color-forest)] text-white shadow-sm'
            : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
        ].join(' ')}
      >
        DE
      </button>
      <button
        onClick={() => switchLang('en')}
        aria-label={language === 'en' ? 'English (active)' : 'Switch to English'}
        aria-pressed={language === 'en'}
        className={[
          'px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider transition-all duration-200',
          language === 'en'
            ? 'bg-[var(--color-forest)] text-white shadow-sm'
            : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]',
        ].join(' ')}
      >
        EN
      </button>
    </div>
  );
}
