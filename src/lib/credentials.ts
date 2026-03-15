import { $credentials } from './stores.ts';

export interface StoredCredentials {
  email: string;
  password: string;
  imap: { host: string; port: number; secure: boolean };
  smtp: { host: string; port: number; secure: boolean };
  folders?: string[];
}

export function getCredentials(): StoredCredentials | null {
  const raw = $credentials.get();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredCredentials;
  } catch {
    return null;
  }
}

export function getSenderEmail(): string {
  return getCredentials()?.email ?? '';
}
