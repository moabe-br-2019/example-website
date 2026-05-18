/**
 * Post-build: prepara dist/ para deploy via Cloudflare Workers Static Assets.
 *
 * O adapter @astrojs/cloudflare gera dist/_worker.js/ (e às vezes _routes.json),
 * que são convenções do Cloudflare Pages. No modelo Workers + Static Assets,
 * `wrangler deploy` recusa subir esse diretório como asset público porque
 * exporia código server-side. Solução: declarar essas entradas no .assetsignore.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const target = resolve('dist', '.assetsignore');
const content = '_worker.js\n_routes.json\n';
writeFileSync(target, content, 'utf8');
console.log(`✓ wrote ${target}`);
