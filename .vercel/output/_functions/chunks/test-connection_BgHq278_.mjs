import { ImapFlow } from 'imapflow';
import { g as getTlsOptions, c as classifyImapError } from './tls_CdLArUDM.mjs';

const prerender = false;
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
  const { host, port, user, pass, secure = true } = body;
  if (typeof host !== "string" || host.trim() === "" || typeof port !== "number" || !Number.isInteger(port) || port < 1 || port > 65535 || typeof user !== "string" || user.trim() === "" || typeof pass !== "string" || pass === "") {
    const payload = {
      success: false,
      error: "Missing or invalid fields: host, port (1–65535), user, and pass are required."
    };
    return new Response(JSON.stringify(payload), {
      status: 400,
      headers: { "Content-Type": "application/json" }
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
    connectionTimeout: 15e3,
    greetingTimeout: 1e4,
    socketTimeout: 2e4,
    disableAutoIdle: true
  });
  try {
    await client.connect();
    const listings = await client.list();
    const mailboxes = listings.map((m) => m.path).sort();
    await client.logout();
    const payload = { success: true, mailboxes };
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
