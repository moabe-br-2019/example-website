/**
 * Gera um link de aprovação para o cliente.
 *
 * Uso:
 *   npm run approval:create -- --project=<slug> --name="..." --email=... [--days=7] [--remote] [--base-url=https://...]
 *
 * Fluxo:
 *   1. Gera token aleatório (32 bytes, base64url) — só aparece no link.
 *   2. Calcula SHA-256 do token (token_hash vai pro D1).
 *   3. Lê o projeto via Keystatic reader e renderiza o markdoc → HTML (snapshot).
 *   4. Roda `wrangler d1 execute --file=...` para inserir a linha.
 *   5. Imprime o link.
 */
import { randomBytes, createHash } from 'node:crypto';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import Markdoc from '@markdoc/markdoc';
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../keystatic.config';

type Args = {
  project: string;
  name: string;
  email: string;
  days?: string;
  remote?: boolean;
  baseUrl?: string;
};

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> & Record<string, string | boolean> = {};
  for (const arg of argv) {
    if (arg === '--remote') out.remote = true;
    else if (arg === '--local') out.remote = false;
    else if (arg.startsWith('--')) {
      const [k, ...rest] = arg.slice(2).split('=');
      out[k] = rest.join('=') || 'true';
    }
  }
  if (!out.project || !out.name || !out.email) {
    console.error('Uso: --project=<slug> --name="Cliente" --email=cliente@x.com [--days=7] [--remote] [--base-url=https://...]');
    process.exit(1);
  }
  return out as Args;
}

function sqlEscape(s: string | null): string {
  if (s === null) return 'NULL';
  return `'${s.replace(/'/g, "''")}'`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const baseUrl = args.baseUrl ?? 'http://localhost:4321';
  const isRemote = !!args.remote;
  const days = args.days ? parseInt(args.days, 10) : 7;

  // 1) Carrega o projeto.
  const reader = createReader(process.cwd(), keystaticConfig);
  const project = await reader.collections.projects.read(args.project);
  if (!project) {
    console.error(`Projeto não encontrado: ${args.project}`);
    console.error('Slugs disponíveis:');
    const all = await reader.collections.projects.all();
    for (const p of all) console.error('  -', p.slug);
    process.exit(1);
  }

  // 2) Renderiza markdoc → HTML (snapshot).
  // O reader do Keystatic devolve { node } (não o node direto).
  const content = (await project.content()) as { node: unknown };
  const transformed = Markdoc.transform(content.node as any);
  const html = Markdoc.renderers.html(transformed);

  // 3) Gera token + hash.
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');

  // 4) Monta SQL e executa via wrangler.
  const now = Date.now();
  const expiresAt = days > 0 ? now + days * 24 * 60 * 60 * 1000 : null;

  const sql = `
INSERT INTO project_approvals
  (project_slug, client_name, client_email, token_hash, status,
   expires_at, created_at, project_title, project_summary, project_html)
VALUES
  (${sqlEscape(args.project)},
   ${sqlEscape(args.name)},
   ${sqlEscape(args.email)},
   ${sqlEscape(tokenHash)},
   'pending',
   ${expiresAt === null ? 'NULL' : expiresAt},
   ${now},
   ${sqlEscape(project.title)},
   ${sqlEscape(project.summary)},
   ${sqlEscape(html)});
`.trim();

  const tmpDir = resolve(process.cwd(), '.wrangler', 'tmp');
  mkdirSync(tmpDir, { recursive: true });
  const sqlFile = resolve(tmpDir, `approval-${Date.now()}.sql`);
  writeFileSync(sqlFile, sql, 'utf8');

  const wranglerArgs = [
    'wrangler',
    'd1',
    'execute',
    'example-full-website-db',
    isRemote ? '--remote' : '--local',
    `--file=${sqlFile}`,
  ];
  console.error(`→ ${wranglerArgs.join(' ')}`);
  const r = spawnSync('npx', wranglerArgs, { stdio: 'inherit', shell: true });
  rmSync(sqlFile, { force: true });

  if (r.status !== 0) {
    console.error('Falha ao executar wrangler d1.');
    process.exit(r.status ?? 1);
  }

  const link = `${baseUrl.replace(/\/$/, '')}/aprovar/${token}`;
  console.log('\n✓ Link de aprovação gerado:');
  console.log(`\n  ${link}\n`);
  console.log(`Projeto:  ${project.title}`);
  console.log(`Cliente:  ${args.name} <${args.email}>`);
  if (expiresAt) {
    console.log(`Expira:   ${new Date(expiresAt).toISOString()}`);
  }
  console.log(`Ambiente: ${isRemote ? 'REMOTO (produção)' : 'LOCAL (dev)'}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
