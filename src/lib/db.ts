import type { APIContext } from 'astro';

export type ContactSubmission = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  ip: string | null;
  user_agent: string | null;
  created_at: number;
};

export type ProjectApprovalStatus = 'pending' | 'approved' | 'rejected';

export type ProjectApproval = {
  id: number;
  project_slug: string;
  client_name: string;
  client_email: string;
  token_hash: string;
  status: ProjectApprovalStatus;
  comment: string | null;
  expires_at: number | null;
  decided_at: number | null;
  created_at: number;
  project_title: string | null;
  project_summary: string | null;
  project_html: string | null;
};

export function getDB(locals: APIContext['locals']): D1Database {
  const db = locals.runtime?.env?.DB;
  if (!db) {
    throw new Error(
      'D1 binding "DB" não encontrado. Verifique wrangler.toml e rode `npm run db:create` se ainda não criou o banco.',
    );
  }
  return db;
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
