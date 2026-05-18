import type { APIRoute } from 'astro';
import { contactSchema } from '../../lib/validation';
import { getDB } from '../../lib/db';
import { sendEmail, escapeHtml } from '../../lib/email';
import { verifyTurnstile } from '../../lib/turnstile';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  const env = locals.runtime?.env;
  if (!env) {
    return json({ error: 'runtime unavailable' }, 500);
  }

  // 1) Accepts both JSON and form-data.
  const ct = request.headers.get('content-type') ?? '';
  let raw: Record<string, unknown>;
  try {
    if (ct.includes('application/json')) {
      raw = (await request.json()) as Record<string, unknown>;
    } else {
      const form = await request.formData();
      raw = Object.fromEntries(form.entries());
    }
  } catch {
    return json({ error: 'invalid payload' }, 400);
  }

  // 2) Validation.
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return json({ error: 'invalid data', fieldErrors }, 400);
  }
  const data = parsed.data;

  // 3) Honeypot — "website" field must be empty.
  if (data.website) {
    // Silent 200 so the bot doesn't learn we caught it.
    return json({ ok: true });
  }

  // 4) Turnstile (if configured).
  const ip = request.headers.get('cf-connecting-ip') ?? clientAddress ?? null;
  const turnstile = await verifyTurnstile({
    secret: env.CF_TURNSTILE_SECRET,
    token: data['cf-turnstile-response'],
    remoteIp: ip,
  });
  if (!turnstile.ok) {
    return json({ error: 'anti-spam verification failed' }, 400);
  }

  // 5) Insert into D1.
  const db = getDB(locals);
  const now = Date.now();
  const ua = request.headers.get('user-agent')?.slice(0, 500) ?? null;

  try {
    await db
      .prepare(
        `INSERT INTO contact_submissions
           (name, email, phone, subject, message, source, ip, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        data.name,
        data.email,
        data.phone,
        data.subject,
        data.message,
        data.source ?? null,
        ip,
        ua,
        now,
      )
      .run();
  } catch (err) {
    console.error('contact insert failed', err);
    return json({ error: 'failed to save' }, 500);
  }

  // 6) Email (best-effort — don't fail the request if email is down).
  if (env.RESEND_API_KEY && env.CONTACT_FROM_EMAIL && env.CONTACT_TO_EMAIL) {
    try {
      await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.CONTACT_FROM_EMAIL,
        to: env.CONTACT_TO_EMAIL,
        replyTo: data.email,
        subject: `New contact: ${data.subject ?? data.name}`,
        html: renderContactEmail(data),
      });
    } catch (err) {
      console.error('contact email failed', err);
    }
  }

  return json({ ok: true });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderContactEmail(d: {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
}): string {
  return `
    <h2>New contact from the website</h2>
    <p><strong>Name:</strong> ${escapeHtml(d.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(d.email)}</p>
    ${d.phone ? `<p><strong>Phone:</strong> ${escapeHtml(d.phone)}</p>` : ''}
    ${d.subject ? `<p><strong>Subject:</strong> ${escapeHtml(d.subject)}</p>` : ''}
    <hr>
    <p style="white-space:pre-wrap">${escapeHtml(d.message)}</p>
  `;
}
