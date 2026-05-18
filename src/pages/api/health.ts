import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Health check para smoke test pós-deploy.
 * Confirma que o Worker está rodando e que o D1 responde.
 */
export const GET: APIRoute = async ({ locals }) => {
  const env = locals.runtime?.env;
  const checks: Record<string, unknown> = {
    runtime: !!env,
    db: false,
  };

  if (env?.DB) {
    try {
      const r = await env.DB.prepare('SELECT 1 AS ok').first<{ ok: number }>();
      checks.db = r?.ok === 1;
    } catch (err) {
      checks.db = false;
      checks.db_error = (err as Error).message;
    }
  }

  const ok = checks.runtime === true && checks.db === true;
  return new Response(JSON.stringify({ ok, ...checks, time: Date.now() }), {
    status: ok ? 200 : 503,
    headers: { 'content-type': 'application/json' },
  });
};
