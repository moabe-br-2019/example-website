/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

interface Env {
  // Bindings
  DB: D1Database;
  SESSION?: KVNamespace;
  ASSETS: Fetcher;

  // Keystatic OAuth (modo github em prod)
  KEYSTATIC_SECRET?: string;
  KEYSTATIC_GITHUB_CLIENT_ID?: string;
  KEYSTATIC_GITHUB_CLIENT_SECRET?: string;

  // Email (Fase 4 / 5)
  RESEND_API_KEY?: string;
  CONTACT_FROM_EMAIL?: string;        // ex: "Portfólio <noreply@dominio.com>"
  CONTACT_TO_EMAIL?: string;          // destino do form de contato
  APPROVAL_NOTIFY_EMAIL?: string;     // notificação quando cliente aprova/rejeita

  // Turnstile (opcional, Fase 4)
  CF_TURNSTILE_SECRET?: string;
}

interface ImportMetaEnv {
  readonly PUBLIC_CF_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals extends Runtime {}
}
