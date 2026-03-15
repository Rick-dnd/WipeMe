import { ImapFlow } from 'imapflow';
import { i as isResponseEmail } from './email-patterns_CJZ_4we0.mjs';
import { g as getTlsOptions, c as classifyImapError } from './tls_CdLArUDM.mjs';

const prerender = false;
const MAX_CHECKS = 50;
const MAX_MAILS_PER_DOMAIN = 1e3;
function normaliseHeader(raw) {
  if (!raw) return "";
  return raw.trim().replace(/\s+/g, " ");
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
  const {
    host,
    port,
    user,
    pass,
    secure = true,
    checks
  } = body;
  if (typeof host !== "string" || host.trim() === "" || typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535 || typeof user !== "string" || user.trim() === "" || typeof pass !== "string" || pass === "" || !Array.isArray(checks) || checks.length === 0) {
    const payload = {
      success: false,
      error: "Missing or invalid fields: host, port, user, pass, and checks are required."
    };
    return new Response(JSON.stringify(payload), {
      status: 400,
      headers: { "Content-Type": "application/json" }
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
    connectionTimeout: 2e4,
    greetingTimeout: 1e4,
    socketTimeout: 12e4
  });
  try {
    await client.connect();
  } catch (err) {
    try {
      client.close();
    } catch {
    }
    const payload = { success: false, error: classifyImapError(err) };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const responses = [];
    let lock;
    try {
      lock = await client.getMailboxLock("INBOX", { readOnly: true });
    } catch (err) {
      try {
        client.close();
      } catch {
      }
      const payload2 = { success: false, error: classifyImapError(err) };
      return new Response(JSON.stringify(payload2), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    try {
      for (const check of limitedChecks) {
        const sinceDate = new Date(check.sinceDate);
        if (isNaN(sinceDate.getTime())) continue;
        const uids = await client.search(
          { since: sinceDate, from: `@${check.domain}` },
          { uid: true }
        );
        if (!uids || uids.length === 0) continue;
        const limited = uids.slice(0, MAX_MAILS_PER_DOMAIN);
        const messages = client.fetch(
          limited.join(","),
          { envelope: true, internalDate: true },
          { uid: true }
        );
        for await (const msg of messages) {
          const envelope = msg.envelope;
          if (!envelope) continue;
          const subject = normaliseHeader(envelope.subject ?? "");
          if (!isResponseEmail(subject)) continue;
          const fromAddr = envelope.from?.[0];
          if (!fromAddr) continue;
          const fromStr = fromAddr.name ? `${fromAddr.name} <${fromAddr.address ?? ""}>` : fromAddr.address ?? "";
          const rawDate = msg.internalDate;
          const dateStr = rawDate instanceof Date ? rawDate.toISOString() : typeof rawDate === "string" ? rawDate : (/* @__PURE__ */ new Date()).toISOString();
          responses.push({
            domain: check.domain,
            subject,
            date: dateStr,
            from: fromStr
          });
          break;
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
    const payload = { success: true, responses };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    try {
      client.close();
    } catch {
    }
    const payload = { success: false, error: classifyImapError(err) };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
