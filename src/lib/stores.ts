import { atom } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { Language } from './i18n.ts';

export type AppStep = 'setup' | 'scanning' | 'results' | 'tracking';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'impossible';

export type RequestStatus = 'pending' | 'expired' | 'completed' | 'no_record' | 'partial' | 'rejected';

export interface DiscoveredService {
  id: string;
  name: string;
  domain: string;
  privacyEmail: string | null;
  deleteUrl: string | null;
  difficulty: Difficulty;
  emailDate: string;
  emailSubject: string;
  selected: boolean;
  region?: string;
  categories?: string[];
  webform?: string | null;
  runs?: string[];
  sourceType?: 'account' | 'newsletter';
}

export interface SentRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceDomain: string;
  sentAt: string;
  deadlineAt: string;
  status: RequestStatus;
  followUpSentAt: string | null;
  requestType?: 'deletion' | 'access';
}

export interface ScanProgress {
  total: number;
  scanned: number;
  found: number;
}

export const $language = persistentAtom<Language>('wipeme:language', 'de', {
  encode: (v) => v,
  decode: (v): Language => (v === 'de' ? 'de' : 'en'),
});

const SESSION_KEY = 'wipeme:credentials';

function createSessionAtom() {
  const store = atom<string | null>(null);

  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) store.set(saved);

    store.listen((value) => {
      if (value === null) {
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        sessionStorage.setItem(SESSION_KEY, value);
      }
    });
  }

  return store;
}

export const $credentials = createSessionAtom();

export const $services = persistentAtom<DiscoveredService[]>(
  'wipeme:services',
  [],
  {
    encode: JSON.stringify,
    decode: (v) => {
      try {
        return JSON.parse(v) as DiscoveredService[];
      } catch {
        return [];
      }
    },
  },
);

export const $sentRequests = persistentAtom<SentRequest[]>(
  'wipeme:sent-requests',
  [],
  {
    encode: JSON.stringify,
    decode: (v) => {
      try {
        return JSON.parse(v) as SentRequest[];
      } catch {
        return [];
      }
    },
  },
);

export const $lastScanDate = persistentAtom<string>('wipeme:last-scan-date', '', {
  encode: (v) => v,
  decode: (v) => v,
});

export const $previousServices = persistentAtom<DiscoveredService[]>('wipeme:previous-services', [], {
  encode: JSON.stringify,
  decode: (v) => {
    try {
      return JSON.parse(v) as DiscoveredService[];
    } catch {
      return [];
    }
  },
});

export const $notificationsEnabled = persistentAtom<string>('wipeme:notifications', 'false', {
  encode: (v) => v,
  decode: (v) => v,
});

export const $lastNotifiedAt = persistentAtom<string>('wipeme:last-notified', '', {
  encode: (v) => v,
  decode: (v) => v,
});

export const $currentStep = atom<AppStep>('setup');

export const $isConnected = atom<boolean>(false);

export const $scanProgress = atom<ScanProgress | null>(null);

export function setLanguage(lang: Language): void {
  $language.set(lang);
}

export function getLanguage(): Language {
  return $language.get();
}
