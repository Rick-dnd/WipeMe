export const prerender = false;

import type { APIRoute } from 'astro';
import { ImapFlow } from 'imapflow';
import { isResponseEmail } from '../../lib/email-patterns.ts';
import { classifyImapError } from '../../lib/error-classifiers.ts';
import { getTlsOptions } from '../../lib/tls.ts';

interface CheckEntry {
  domain: string;
  sinceDate: string;
}

interface RequestBody {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure?: boolean;
  checks: CheckEntry[];
}

export interface ResponseMatch {
  domain: string;
  subject: string;
  date: string;
  from: string;
}

type SuccessResponse = { success: true; responses: ResponseMatch[] };
type ErrorResponse = { success: false; error: string };

const MAX_CHECKS = 50;
const MAX_MAILS_PER_DOMAIN = 1000;

function normaliseHeader(raw: string | undefined): string {
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ');
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
    checks,
  } = body;

  if (
    typeof host !== 'string' || host.trim() === '' ||
    typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535 ||
    typeof user !== 'string' || user.trim() === '' ||
    typeof pass !== 'string' || pass === '' ||
    !Array.isArray(checks) || checks.length === 0
  ) {
    const payload: ErrorResponse = {
      success: false,
      error: 'Missing or invalid fields: host, port, user, pass, and checks are required.',
    };
    return new Response(JSON.stringify(payload), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const limitedChecks = checks.slice(0, MAX_CHECKS);

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
    const responses: ResponseMatch[] = [];

    let lock;
    try {
      lock = await client.getMailboxLock('INBOX', { readOnly: true });
    } catch (err) {
      try { client.close(); } catch { }
      const payload: ErrorResponse = { success: false, error: classifyImapError(err) };
      return new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      for (const check of limitedChecks) {
        const sinceDate = new Date(check.sinceDate);
        if (isNaN(sinceDate.getTime())) continue;

        const uids = await client.search(
          { since: sinceDate, from: `@${check.domain}` },
          { uid: true },
        );
        if (!uids || uids.length === 0) continue;

        const limited = uids.slice(0, MAX_MAILS_PER_DOMAIN);

        const messages = client.fetch(
          limited.join(','),
          { envelope: true, internalDate: true },
          { uid: true },
        );

        for await (const msg of messages) {
          const envelope = msg.envelope;
          if (!envelope) continue;

          const subject = normaliseHeader(envelope.subject ?? '');
          if (!isResponseEmail(subject)) continue;

          const fromAddr = envelope.from?.[0];
          if (!fromAddr) continue;

          const fromStr = fromAddr.name
            ? `${fromAddr.name} <${fromAddr.address ?? ''}>`
            : (fromAddr.address ?? '');

          const rawDate = msg.internalDate;
          const dateStr = rawDate instanceof Date
            ? rawDate.toISOString()
            : typeof rawDate === 'string'
              ? rawDate
              : new Date().toISOString();

          responses.push({
            domain: check.domain,
            subject,
            date: dateStr,
            from: fromStr,
          });

          break;
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    const payload: SuccessResponse = { success: true, responses };
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
