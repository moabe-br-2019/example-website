import { reader } from './keystatic';

type ResolvedItem = {
  label: string;
  href: string;
  opensInNewTab: boolean;
};

type RawNavItem =
  | {
      discriminant: 'page';
      value: { page: string | null; labelOverride: string | null; opensInNewTab: boolean };
    }
  | {
      discriminant: 'section';
      value: { section: string; label: string; opensInNewTab: boolean };
    }
  | {
      discriminant: 'url';
      value: { label: string; href: string; opensInNewTab: boolean };
    };

const SECTION_HREFS: Record<string, string> = {
  home: '/',
  services: '/services',
  projects: '/projects',
  contact: '/contact',
};

/**
 * Resolves a raw navigation item from Keystatic into { label, href, opensInNewTab }.
 * Returns null for items that can't be resolved (e.g. page reference points to a
 * deleted/non-existent page) — caller should filter those out.
 */
export async function resolveNavItem(
  raw: RawNavItem,
): Promise<ResolvedItem | null> {
  if (raw.discriminant === 'section') {
    const href = SECTION_HREFS[raw.value.section];
    if (!href) return null;
    return {
      label: raw.value.label,
      href,
      opensInNewTab: raw.value.opensInNewTab,
    };
  }

  if (raw.discriminant === 'url') {
    return {
      label: raw.value.label,
      href: raw.value.href,
      opensInNewTab: raw.value.opensInNewTab,
    };
  }

  // page
  const slug = raw.value.page;
  if (!slug) return null;
  const page = await reader.collections.pages.read(slug);
  if (!page) return null;
  return {
    label: raw.value.labelOverride || page.title,
    href: `/${slug}`,
    opensInNewTab: raw.value.opensInNewTab,
  };
}

export async function resolveNavItems(
  raws: ReadonlyArray<RawNavItem> | null | undefined,
): Promise<ResolvedItem[]> {
  if (!raws) return [];
  const resolved = await Promise.all(raws.map(resolveNavItem));
  return resolved.filter((r): r is ResolvedItem => r !== null);
}
