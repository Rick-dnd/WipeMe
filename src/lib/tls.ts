const forceVerify = process.env.WIPEME_FORCE_TLS_VERIFY === 'true';

export function getTlsOptions(servername: string) {
  return {
    servername,
    rejectUnauthorized: forceVerify,
  };
}
