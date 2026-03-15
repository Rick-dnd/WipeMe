export const prerender = false;

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { classifySmtpError } from '../../lib/error-classifiers.ts';
import { getTlsOptions } from '../../lib/tls.ts';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure?: boolean;
}

interface RequestBody {
  smtp: SmtpConfig;
  from: string;
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}

type SuccessResponse = { success: true; messageId: string };
type ErrorResponse = { success: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidPort(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 65535;
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

  const { smtp, from, to, subject, body: emailBody, replyTo } = body;

  if (!smtp || typeof smtp !== 'object') {
    const payload: ErrorResponse = { success: false, error: 'Missing smtp configuration object.' };
    return new Response(JSON.stringify(payload), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isNonEmptyString(smtp.host)) {
    const payload: ErrorResponse = { success: false, error: 'smtp.host is required.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!isValidPort(smtp.port)) {
    const payload: ErrorResponse = { success: false, error: 'smtp.port must be an integer between 1 and 65535.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!isNonEmptyString(smtp.user)) {
    const payload: ErrorResponse = { success: false, error: 'smtp.user is required.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (typeof smtp.pass !== 'string' || smtp.pass === '') {
    const payload: ErrorResponse = { success: false, error: 'smtp.pass is required.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  if (!isValidEmail(from)) {
    const payload: ErrorResponse = { success: false, error: 'from must be a valid email address.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!isValidEmail(to)) {
    const payload: ErrorResponse = { success: false, error: 'to must be a valid email address.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!isNonEmptyString(subject)) {
    const payload: ErrorResponse = { success: false, error: 'subject must be a non-empty string.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (!isNonEmptyString(emailBody)) {
    const payload: ErrorResponse = { success: false, error: 'body must be a non-empty string.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (replyTo !== undefined && !isValidEmail(replyTo)) {
    const payload: ErrorResponse = { success: false, error: 'replyTo must be a valid email address.' };
    return new Response(JSON.stringify(payload), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const secure = smtp.secure ?? (smtp.port === 465);

  const transportOptions: SMTPTransport.Options = {
    host: smtp.host.trim(),
    port: smtp.port,
    secure,
    auth: {
      user: smtp.user.trim(),
      pass: smtp.pass,
    },
    tls: getTlsOptions(smtp.host.trim()),
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  };

  const transporter = nodemailer.createTransport(transportOptions);

  try {
    const info = await transporter.sendMail({
      from: from.trim(),
      to: to.trim(),
      subject: subject.trim(),
      text: emailBody.trim(),
      ...(replyTo ? { replyTo: replyTo.trim() } : {}),
      headers: {
        'X-Mailer': 'WipeMe (https://wipeme.cc)',
      },
    });

    const messageId = (info.messageId ?? '').replace(/^<|>$/g, '');

    const payload: SuccessResponse = { success: true, messageId };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const payload: ErrorResponse = { success: false, error: classifySmtpError(err) };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } finally {
    transporter.close();
  }
};
