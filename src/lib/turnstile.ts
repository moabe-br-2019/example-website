/**
 * Valida token do Cloudflare Turnstile.
 * Se secret/token estiverem ausentes, retorna `skipped: true` (modo "sem proteção").
 */
export async function verifyTurnstile(opts: {
  secret: string | undefined;
  token: string | null | undefined;
  remoteIp?: string | null;
}): Promise<{ ok: boolean; skipped: boolean }> {
  if (!opts.secret) return { ok: true, skipped: true };
  if (!opts.token) return { ok: false, skipped: false };

  const body = new FormData();
  body.append('secret', opts.secret);
  body.append('response', opts.token);
  if (opts.remoteIp) body.append('remoteip', opts.remoteIp);

  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    { method: 'POST', body },
  );
  if (!res.ok) return { ok: false, skipped: false };
  const data = (await res.json()) as { success: boolean };
  return { ok: data.success === true, skipped: false };
}
