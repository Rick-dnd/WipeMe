export const prerender = false;

import type { APIRoute } from 'astro';
import { ImapFlow } from 'imapflow';
import { classifyImapError } from '../../lib/error-classifiers.ts';
import { getTlsOptions } from '../../lib/tls.ts';

interface RequestBody {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure?: boolean;
}

type SuccessResponse = { success: true; mailboxes: string[] };
type ErrorResponse = { success: false; error: string };

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

  const { host, port, user, pass, secure = true } = body;

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

  const trimmedHost = host.trim();

  const client = new ImapFlow({
    host: trimmedHost,
    port,
    secure,
    auth: { user: user.trim(), pass },
    logger: false,
    tls: getTlsOptions(trimmedHost),
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    disableAutoIdle: true,
  });

  try {
    await client.connect();

    const listings = await client.list();
    const mailboxes: string[] = listings.map((m) => m.path).sort();

    await client.logout();

    const payload: SuccessResponse = { success: true, mailboxes };
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
