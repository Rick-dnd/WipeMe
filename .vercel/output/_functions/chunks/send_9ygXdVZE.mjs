import nodemailer from 'nodemailer';
import { g as getTlsOptions, a as classifySmtpError } from './tls_CdLArUDM.mjs';

const prerender = false;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(value) {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}
function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function isValidPort(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 65535;
}
const POST = async ({ request }) => {
  let body;
  try {
    body = await request.json();
  } catch {
    const payload = { success: false, error: "Invalid JSON in request body." };
    return new Response(JSON.stringify(payload), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { smtp, from, to, subject, body: emailBody, replyTo } = body;
  if (!smtp || typeof smtp !== "object") {
    const payload = { success: false, error: "Missing smtp configuration object." };
    return new Response(JSON.stringify(payload), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  if (!isNonEmptyString(smtp.host)) {
    const payload = { success: false, error: "smtp.host is required." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!isValidPort(smtp.port)) {
    const payload = { success: false, error: "smtp.port must be an integer between 1 and 65535." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!isNonEmptyString(smtp.user)) {
    const payload = { success: false, error: "smtp.user is required." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (typeof smtp.pass !== "string" || smtp.pass === "") {
    const payload = { success: false, error: "smtp.pass is required." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!isValidEmail(from)) {
    const payload = { success: false, error: "from must be a valid email address." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!isValidEmail(to)) {
    const payload = { success: false, error: "to must be a valid email address." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!isNonEmptyString(subject)) {
    const payload = { success: false, error: "subject must be a non-empty string." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (!isNonEmptyString(emailBody)) {
    const payload = { success: false, error: "body must be a non-empty string." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  if (replyTo !== void 0 && !isValidEmail(replyTo)) {
    const payload = { success: false, error: "replyTo must be a valid email address." };
    return new Response(JSON.stringify(payload), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const secure = smtp.secure ?? smtp.port === 465;
  const transportOptions = {
    host: smtp.host.trim(),
    port: smtp.port,
    secure,
    auth: {
      user: smtp.user.trim(),
      pass: smtp.pass
    },
    tls: getTlsOptions(smtp.host.trim()),
    connectionTimeout: 15e3,
    greetingTimeout: 1e4,
    socketTimeout: 3e4
  };
  const transporter = nodemailer.createTransport(transportOptions);
  try {
    const info = await transporter.sendMail({
      from: from.trim(),
      to: to.trim(),
      subject: subject.trim(),
      text: emailBody.trim(),
      ...replyTo ? { replyTo: replyTo.trim() } : {},
      headers: {
        "X-Mailer": "WipeMe (https://wipeme.cc)"
      }
    });
    const messageId = (info.messageId ?? "").replace(/^<|>$/g, "");
    const payload = { success: true, messageId };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    const payload = { success: false, error: classifySmtpError(err) };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } finally {
    transporter.close();
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
