export const prerender = false;

import type { APIRoute } from 'astro';
import { ImapFlow } from 'imapflow';
import { isAccountEmail, isNewsletterEmail, extractServiceName } from '../../lib/email-patterns.ts';
import { classifyImapError } from '../../lib/error-classifiers.ts';
import { getTlsOptions } from '../../lib/tls.ts';

function extractRootDomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  const lastTwo = `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
  const knownSecondLevel = /^(co|com|net|org|gov|edu|ac|me)\.(uk|au|nz|jp|za|in|br)$/i.test(lastTwo);
  if (knownSecondLevel && parts.length >= 3) return parts.slice(-3).join('.');
  return parts.slice(-2).join('.');
}

function extractDomainFromAddress(raw: string): string {
  const addrMatch = raw.match(/<([^>]+)>/) ?? raw.match(/\S+@\S+/);
  const addr = addrMatch ? addrMatch[1] ?? addrMatch[0] : raw;
  const atIdx = addr.lastIndexOf('@');
  if (atIdx === -1) return '';
  return extractRootDomain(addr.slice(atIdx + 1).toLowerCase());
}

interface RequestBody {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure?: boolean;
  folders?: string[];
  since?: string;
  limit?: number;
}

export interface DiscoveredEntry {
  name: string;
  domain: string;
  email: string;
  date: string;
  subject: string;
  matchType: 'subject' | 'from';
  sourceType: 'account' | 'newsletter';
}

type SuccessResponse = {
  success: true;
  services: DiscoveredEntry[];
  stats: { totalScanned: number; matchesFound: number };
};
type ErrorResponse = { success: false; error: string };

const DEFAULT_FOLDERS = ['INBOX'];
const DEFAULT_LIMIT = 5000;
const MAX_FOLDERS = 20;
const FETCH_BATCH_SIZE = 100;

function oneYearAgo(): Date {
  const d = new Date();
  d.setUTCFullYear(d.getUTCFullYear() - 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function normaliseHeader(raw: string | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ');
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

interface ScanFolderResult {
  entries: DiscoveredEntry[];
  scanned: number;
}

async function scanFolder(
  client: ImapFlow,
  folder: string,
  sinceDate: Date,
  remaining: number,
): Promise<ScanFolderResult> {
  const entries: DiscoveredEntry[] = [];
  let scanned = 0;

  let lock;
  try {
    lock = await client.getMailboxLock(folder, { readOnly: true });
  } catch {
    return { entries, scanned };
  }

  try {
    const uids = await client.search({ since: sinceDate }, { uid: true });
    if (!uids || uids.length === 0) {
      return { entries, scanned };
    }

    const limited = uids.slice(0, remaining);
    const batches = chunk(limited, FETCH_BATCH_SIZE);

    for (const batch of batches) {
      if (batch.length === 0) continue;

      const range = batch.join(',');

      const messages = client.fetch(
        range,
        { envelope: true, internalDate: true },
        { uid: true },
      );

      for await (const msg of messages) {
        scanned += 1;

        const envelope = msg.envelope;
        if (!envelope) continue;

        const subject = normaliseHeader(envelope.subject ?? '');
        const fromAddr = envelope.from?.[0];
        if (!fromAddr) continue;

        const fromRaw = fromAddr.name
          ? `${fromAddr.name} <${fromAddr.address ?? ''}>`
          : (fromAddr.address ?? '');

        if (!fromRaw) continue;

        const isAccount = isAccountEmail(subject, fromRaw);
        const isNewsletter = !isAccount && isNewsletterEmail(subject, fromRaw);

        if (!isAccount && !isNewsletter) continue;

        const subjectHit = isAccountEmail(subject, 'noreply@placeholder.invalid');
        const matchType: 'subject' | 'from' = subjectHit ? 'subject' : 'from';
        const sourceType: 'account' | 'newsletter' = isAccount ? 'account' : 'newsletter';

        const domain = extractDomainFromAddress(fromRaw);
        if (!domain) continue;

        const name = extractServiceName(fromRaw, subject);

        const rawDate = msg.internalDate;
        const dateStr = rawDate instanceof Date
          ? rawDate.toISOString()
          : typeof rawDate === 'string'
            ? rawDate
            : new Date().toISOString();

        entries.push({
          name,
          domain,
          email: fromAddr.address ?? fromRaw,
          date: dateStr,
          subject,
          matchType,
          sourceType,
        });
      }
    }
  } finally {
    lock.release();
  }

  return { entries, scanned };
}

export const POST: APIRoute = async ({ request }) => {
  let body: Partial<RequestBody>;
  try {
    body = await request.json() as Partial<RequestBody>;
  } catch {
    const payload: ErrorResponse = { success: false, error: 'Invalid JSON in request body.' };
    return new Response(JSON.stringify(payload), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    host,
    port,
    user,
    pass,
    secure = true,
    folders = DEFAULT_FOLDERS,
    since,
    limit = DEFAULT_LIMIT,
  } = body;

  if (
    typeof host !== 'string' || host.trim() === '' ||
    typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535 ||
    typeof user !== 'string' || user.trim() === '' ||
    typeof pass !== 'string' || pass === ''
  ) {
    const payload: ErrorResponse = {
      success: false,
      error: 'Missing or invalid fields: host, port (1–65535), user, and pass are required.',
    };
    return new Response(JSON.stringify(payload), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const scanLimit = typeof limit === 'number' && limit > 0 ? Math.min(limit, 50_000) : DEFAULT_LIMIT;

  let sinceDate: Date;
  if (since) {
    sinceDate = new Date(since);
    if (isNaN(sinceDate.getTime())) {
      const payload: ErrorResponse = {
        success: false,
        error: "Invalid 'since' date. Expected an ISO 8601 date string.",
      };
      return new Response(JSON.stringify(payload), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } else {
    sinceDate = oneYearAgo();
  }

  const foldersToScan: string[] = Array.isArray(folders) && folders.length > 0
    ? folders.filter((f) => typeof f === 'string' && f.trim() !== '').slice(0, MAX_FOLDERS)
    : DEFAULT_FOLDERS;

  const trimmedHost = host.trim();

  const client = new ImapFlow({
    host: trimmedHost,
    port,
    secure,
    auth: { user: user.trim(), pass },
    logger: false,
    tls: getTlsOptions(trimmedHost),
    disableAutoIdle: true,
    connectionTimeout: 20_000,
    greetingTimeout: 10_000,
    socketTimeout: 120_000,
  });

  try {
    await client.connect();
  } catch (err) {
    try { client.close(); } catch { }
    const payload: ErrorResponse = { success: false, error: classifyImapError(err) };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let totalScanned = 0;
    const byDomain = new Map<string, DiscoveredEntry>();
    let remaining = scanLimit;

    for (const folder of foldersToScan) {
      if (remaining <= 0) break;

      const result = await scanFolder(client, folder, sinceDate, remaining);
      totalScanned += result.scanned;
      remaining -= result.scanned;

      for (const entry of result.entries) {
        const existing = byDomain.get(entry.domain);
        if (!existing) {
          byDomain.set(entry.domain, entry);
        } else {
          if (existing.sourceType === 'newsletter' && entry.sourceType === 'account') {
            byDomain.set(entry.domain, entry);
          } else if (existing.sourceType === entry.sourceType && new Date(entry.date) > new Date(existing.date)) {
            byDomain.set(entry.domain, entry);
          }
        }
      }
    }

    await client.logout();

    const services = Array.from(byDomain.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const payload: SuccessResponse = {
      success: true,
      services,
      stats: { totalScanned, matchesFound: services.length },
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    try { client.close(); } catch { }
    const payload: ErrorResponse = { success: false, error: classifyImapError(err) };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
