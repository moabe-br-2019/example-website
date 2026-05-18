import type { APIRoute } from 'astro';
import { approveSchema } from '../../lib/validation';
import { getDB, sha256Hex, type ProjectApproval } from '../../lib/db';
import { sendEmail, escapeHtml } from '../../lib/email';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const env = locals.runtime?.env;
  if (!env) return json({ error: 'runtime unavailable' }, 500);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: 'invalid payload' }, 400);
  }

  const parsed = approveSchema.safeParse(raw);
  if (!parsed.success) {
    return json({ error: 'invalid data' }, 400);
  }
  const { token, decision, comment } = parsed.data;

  const db = getDB(locals);
  const tokenHash = await sha256Hex(token);

  const row = await db
    .prepare('SELECT * FROM project_approvals WHERE token_hash = ? LIMIT 1')
    .bind(tokenHash)
    .first<ProjectApproval>();

  if (!row) return json({ error: 'invalid token' }, 404);
  if (row.status !== 'pending') {
    return json({ error: 'this approval has already been decided' }, 409);
  }

  const now = Date.now();
  if (row.expires_at !== null && row.expires_at < now) {
    return json({ error: 'link expired' }, 410);
  }

  try {
    await db
      .prepare(
        `UPDATE project_approvals
           SET status = ?, comment = ?, decided_at = ?
         WHERE id = ? AND status = 'pending'`,
      )
      .bind(decision, comment, now, row.id)
      .run();
  } catch (err) {
    console.error('approve update failed', err);
    return json({ error: 'failed to save' }, 500);
  }

  // Notification (best-effort).
  if (env.RESEND_API_KEY && env.CONTACT_FROM_EMAIL && env.APPROVAL_NOTIFY_EMAIL) {
    try {
      await sendEmail({
        apiKey: env.RESEND_API_KEY,
        from: env.CONTACT_FROM_EMAIL,
        to: env.APPROVAL_NOTIFY_EMAIL,
        replyTo: row.client_email,
        subject: `[${decision === 'approved' ? 'APPROVED' : 'REJECTED'}] ${row.project_title ?? row.project_slug}`,
        html: renderNotifyEmail({
          decision,
          clientName: row.client_name,
          clientEmail: row.client_email,
          projectTitle: row.project_title ?? row.project_slug,
          comment,
        }),
      });
    } catch (err) {
      console.error('approve notify email failed', err);
    }
  }

  return json({ ok: true, decision });
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function renderNotifyEmail(d: {
  decision: 'approved' | 'rejected';
  clientName: string;
  clientEmail: string;
  projectTitle: string;
  comment: string | null;
}): string {
  const verb = d.decision === 'approved' ? 'approved' : 'rejected';
  return `
    <h2>Project ${d.decision === 'approved' ? 'APPROVED' : 'REJECTED / changes requested'}</h2>
    <p><strong>${escapeHtml(d.clientName)}</strong> &lt;${escapeHtml(d.clientEmail)}&gt; ${verb} the project:</p>
    <p><strong>${escapeHtml(d.projectTitle)}</strong></p>
    ${d.comment ? `<hr><p><em>Client comment:</em></p><p style="white-space:pre-wrap">${escapeHtml(d.comment)}</p>` : ''}
  `;
}
