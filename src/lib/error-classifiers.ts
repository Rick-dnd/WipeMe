export function classifyImapError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'An unexpected error occurred while connecting to the mail server.';
  }

  const msg = err.message.toLowerCase();

  if ('authenticationFailed' in err || msg.includes('authentication') || msg.includes('invalid credentials') || msg.includes('login failed')) {
    return 'Authentication failed. Please check your username and password.';
  }

  if (msg.includes('certificate') || msg.includes('ssl') || msg.includes('tls') || msg.includes('self-signed')) {
    return 'TLS/SSL error. The server certificate could not be verified. Try toggling the secure option.';
  }

  if (msg.includes('enotfound') || msg.includes('getaddrinfo') || msg.includes('dns')) {
    return 'Host not found. Please check the IMAP server hostname.';
  }

  if (msg.includes('econnrefused')) {
    return 'Connection refused. The server is not accepting connections on the specified port.';
  }

  if (msg.includes('etimedout') || msg.includes('timeout') || msg.includes('timed out')) {
    return 'Connection timed out. The server did not respond in time. Check the host and port.';
  }

  if (msg.includes('enetunreach') || msg.includes('network')) {
    return 'Network unreachable. Please check your internet connection.';
  }

  if (msg.includes('econnreset') || msg.includes('connection reset')) {
    return 'Connection was reset by the server. Verify the port and secure settings match your provider.';
  }

  console.error('[IMAP]', err.message);
  return 'Could not connect to the mail server. Please check your settings.';
}

export function classifySmtpError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'An unexpected error occurred while sending the email.';
  }

  const msg = err.message.toLowerCase();
  const code: string = (err as NodeJS.ErrnoException).code?.toLowerCase() ?? '';

  if (
    msg.includes('535') ||
    msg.includes('authentication') ||
    msg.includes('invalid credentials') ||
    msg.includes('username and password') ||
    code === 'eauth'
  ) {
    return 'SMTP authentication failed. Please verify your username and password.';
  }

  if (msg.includes('550') || msg.includes('551') || msg.includes('user unknown') || msg.includes('no such user')) {
    return 'The recipient address was rejected by the server. Verify the "to" address is correct.';
  }

  if (msg.includes('554') || msg.includes('relay') || msg.includes('not permitted')) {
    return 'The mail server rejected the relay. Your SMTP credentials may not permit sending to external addresses.';
  }

  if (msg.includes('certificate') || msg.includes('ssl') || msg.includes('tls') || code === 'esocket') {
    return 'TLS/SSL error connecting to the SMTP server. Try toggling the secure setting.';
  }

  if (msg.includes('enotfound') || msg.includes('getaddrinfo') || code === 'enotfound') {
    return 'SMTP host not found. Please check the server hostname.';
  }

  if (msg.includes('econnrefused') || code === 'econnrefused') {
    return 'SMTP connection refused. Verify the host and port are correct.';
  }

  if (msg.includes('etimedout') || msg.includes('timeout') || code === 'etimedout') {
    return 'SMTP connection timed out. The server did not respond in time.';
  }

  if (msg.includes('econnreset') || code === 'econnreset') {
    return 'SMTP connection was reset. Check that the port and secure settings match your provider.';
  }

  console.error('[SMTP]', err.message);
  return 'An unexpected error occurred while sending. Please try again.';
}
