import { reader } from './keystatic';

/**
 * Returns the favicon URL configured in siteSettings (or null if not set).
 * Call only from prerendered pages — the reader uses node:fs which doesn't
 * exist at runtime on Cloudflare Workers.
 */
export async function getFaviconUrl(): Promise<string | null> {
  const settings = await reader.singletons.siteSettings.read();
  return settings?.favicon ?? null;
}
