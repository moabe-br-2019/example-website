import { config, collection, singleton, fields } from '@keystatic/core';

const GITHUB_REPO = { owner: 'moabe-br-2019', name: 'example-website' };

const isProd = process.env.NODE_ENV === 'production';

// ---------- Navigation items (shared by header + footer) ----------

const SITE_SECTIONS = [
  { label: 'Home', value: 'home' },
  { label: 'Services', value: 'services' },
  { label: 'Projects', value: 'projects' },
  { label: 'Contact', value: 'contact' },
] as const;

function navItem() {
  return fields.conditional(
    fields.select({
      label: 'Type',
      defaultValue: 'page',
      options: [
        { label: 'Page (from Pages collection)', value: 'page' },
        { label: 'Site section', value: 'section' },
        { label: 'External / custom URL', value: 'url' },
      ],
    }),
    {
      page: fields.object({
        page: fields.relationship({
          label: 'Page',
          collection: 'pages',
        }),
        labelOverride: fields.text({
          label: 'Label override (optional)',
          description: 'Leave empty to use the page title.',
        }),
        opensInNewTab: fields.checkbox({
          label: 'Open in new tab',
          defaultValue: false,
        }),
      }),
      section: fields.object({
        section: fields.select({
          label: 'Section',
          defaultValue: 'services',
          options: SITE_SECTIONS as unknown as Array<{ label: string; value: string }>,
        }),
        label: fields.text({
          label: 'Label',
          validation: { isRequired: true },
        }),
        opensInNewTab: fields.checkbox({
          label: 'Open in new tab',
          defaultValue: false,
        }),
      }),
      url: fields.object({
        label: fields.text({
          label: 'Label',
          validation: { isRequired: true },
        }),
        href: fields.text({
          label: 'URL',
          description: 'Any URL — internal (/foo) or external (https://...).',
          validation: { isRequired: true },
        }),
        opensInNewTab: fields.checkbox({
          label: 'Open in new tab',
          defaultValue: false,
        }),
      }),
    },
  );
}

function navItemLabel(p: any): string {
  // p is ConditionalFieldPreviewProps: { discriminant, value, schema }
  // p.value is the ObjectFieldPreviewProps for the active variant: { fields, ... }
  const kind = p?.discriminant;
  const v = p?.value?.fields ?? {};
  if (kind === 'page') {
    const pg = v.page?.value;
    const override = v.labelOverride?.value;
    return `Page → ${pg || '?'}${override ? ` (${override})` : ''}`;
  }
  if (kind === 'section') {
    return `Section → ${v.label?.value || v.section?.value || '?'}`;
  }
  if (kind === 'url') {
    return `Link → ${v.label?.value || '?'} (${v.href?.value || '?'})`;
  }
  return 'Item';
}

export default config({
  storage: isProd
    ? { kind: 'github', repo: GITHUB_REPO }
    : { kind: 'local' },

  ui: {
    brand: { name: 'Portfolio' },
    navigation: {
      Content: ['pages', 'services', 'projects', 'testimonials'],
      Settings: ['siteSettings', 'navigation'],
    },
  },

  collections: {
    pages: collection({
      label: 'Pages',
      slugField: 'slug',
      path: 'content/pages/*',
      format: { data: 'json' },
      columns: ['title', 'slug'],
      schema: {
        title: fields.text({
          label: 'Title',
          validation: { isRequired: true },
        }),
        slug: fields.slug({
          name: { label: 'Title (also used as fallback slug)' },
          slug: {
            label: 'URL',
            description:
              'Auto-generated from the title. Edit only if you know what you\'re doing — must be lowercase letters, numbers and hyphens (e.g. "about-us"). Reserved: services, projects, contact, approve, api, keystatic.',
            validation: {
              pattern: {
                regex: /^[a-z0-9]+(-[a-z0-9]+)*$/,
                message:
                  'URL must be lowercase letters, numbers and single hyphens only (e.g. "about-us"). Use the regenerate button next to the field to restore the auto value.',
              },
            },
          },
        }),
        seo: fields.object(
          {
            description: fields.text({
              label: 'Meta description',
              multiline: true,
              validation: { length: { max: 200 } },
            }),
            ogImage: fields.image({
              label: 'Social share image (OG)',
              directory: 'public/images/og',
              publicPath: '/images/og/',
            }),
            noindex: fields.checkbox({
              label: 'Hide from search engines (noindex)',
              defaultValue: false,
            }),
          },
          { label: 'SEO' },
        ),
        blocks: fields.blocks(
          {
            hero: {
              label: 'Hero',
              itemLabel: (p) => `Hero — ${p.fields.heading.value || '(empty)'}`,
              schema: fields.object({
                heading: fields.text({ label: 'Heading', validation: { isRequired: true } }),
                subheading: fields.text({ label: 'Subheading', multiline: true }),
                ctaPrimary: fields.object(
                  {
                    label: fields.text({ label: 'Label' }),
                    href: fields.text({ label: 'Link' }),
                  },
                  { label: 'Primary CTA' },
                ),
                ctaSecondary: fields.object(
                  {
                    label: fields.text({ label: 'Label' }),
                    href: fields.text({ label: 'Link' }),
                  },
                  { label: 'Secondary CTA' },
                ),
                backgroundImage: fields.image({
                  label: 'Background image (optional)',
                  directory: 'public/images/pages',
                  publicPath: '/images/pages/',
                }),
              }),
            },
            features: {
              label: 'Features',
              itemLabel: (p) =>
                `Features — ${p.fields.heading.value || `${p.fields.items.elements.length} items`}`,
              schema: fields.object({
                heading: fields.text({ label: 'Heading' }),
                intro: fields.text({ label: 'Intro', multiline: true }),
                columns: fields.select({
                  label: 'Columns',
                  defaultValue: '3',
                  options: [
                    { label: '2', value: '2' },
                    { label: '3', value: '3' },
                    { label: '4', value: '4' },
                  ],
                }),
                items: fields.array(
                  fields.object({
                    icon: fields.text({ label: 'Icon (lucide name)' }),
                    title: fields.text({ label: 'Title' }),
                    description: fields.text({ label: 'Description', multiline: true }),
                  }),
                  {
                    label: 'Items',
                    itemLabel: (p) => p.fields.title.value || '(no title)',
                  },
                ),
              }),
            },
            cta: {
              label: 'Call to action',
              itemLabel: (p) => `CTA — ${p.fields.heading.value || '(empty)'}`,
              schema: fields.object({
                heading: fields.text({ label: 'Heading', validation: { isRequired: true } }),
                description: fields.text({ label: 'Description', multiline: true }),
                buttonLabel: fields.text({ label: 'Button label' }),
                buttonHref: fields.text({ label: 'Button link' }),
                style: fields.select({
                  label: 'Style',
                  defaultValue: 'dark',
                  options: [
                    { label: 'Dark', value: 'dark' },
                    { label: 'Light', value: 'light' },
                    { label: 'Accent', value: 'accent' },
                  ],
                }),
              }),
            },
            richText: {
              label: 'Rich text',
              itemLabel: () => 'Rich text',
              schema: fields.object({
                content: fields.markdoc({ label: 'Content' }),
              }),
            },
            image: {
              label: 'Image',
              itemLabel: (p) => `Image — ${p.fields.alt.value || '(no alt)'}`,
              schema: fields.object({
                src: fields.image({
                  label: 'Image',
                  directory: 'public/images/pages',
                  publicPath: '/images/pages/',
                  validation: { isRequired: true },
                }),
                alt: fields.text({
                  label: 'Alt text (accessibility)',
                  validation: { isRequired: true },
                }),
                caption: fields.text({ label: 'Caption (optional)' }),
                width: fields.select({
                  label: 'Width',
                  defaultValue: 'wide',
                  options: [
                    { label: 'Narrow', value: 'narrow' },
                    { label: 'Wide', value: 'wide' },
                    { label: 'Full', value: 'full' },
                  ],
                }),
              }),
            },
            faq: {
              label: 'FAQ',
              itemLabel: (p) =>
                `FAQ — ${p.fields.heading.value || `${p.fields.items.elements.length} questions`}`,
              schema: fields.object({
                heading: fields.text({ label: 'Heading' }),
                items: fields.array(
                  fields.object({
                    question: fields.text({ label: 'Question', validation: { isRequired: true } }),
                    answer: fields.text({
                      label: 'Answer',
                      multiline: true,
                      validation: { isRequired: true },
                    }),
                  }),
                  {
                    label: 'Q&A',
                    itemLabel: (p) => p.fields.question.value || '(no question)',
                  },
                ),
              }),
            },
            testimonialPull: {
              label: 'Testimonials',
              itemLabel: (p) =>
                `Testimonials — ${p.fields.testimonials.elements.length} item(s)`,
              schema: fields.object({
                heading: fields.text({ label: 'Heading' }),
                testimonials: fields.array(
                  fields.relationship({
                    label: 'Testimonial',
                    collection: 'testimonials',
                  }),
                  {
                    label: 'Pick testimonials',
                    itemLabel: (p) => p.value ?? '(none)',
                  },
                ),
              }),
            },
          },
          { label: 'Page blocks' },
        ),
      },
    }),

    services: collection({
      label: 'Services',
      slugField: 'title',
      path: 'content/services/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['title', 'order'],
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: { label: 'Slug (URL)' },
        }),
        description: fields.text({
          label: 'Short description',
          description: 'Used on service cards (up to ~140 characters).',
          multiline: true,
          validation: { length: { max: 160 } },
        }),
        icon: fields.text({
          label: 'Icon (lucide name)',
          description: 'e.g. "code", "palette", "rocket". Full list at lucide.dev/icons',
        }),
        order: fields.integer({
          label: 'Display order',
          defaultValue: 0,
        }),
        content: fields.markdoc({
          label: 'Service page content',
        }),
      },
    }),

    projects: collection({
      label: 'Projects / Cases',
      slugField: 'title',
      path: 'content/projects/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['title', 'client', 'publishedAt'],
      schema: {
        title: fields.slug({
          name: { label: 'Title' },
          slug: { label: 'Slug (URL)' },
        }),
        client: fields.text({ label: 'Client' }),
        summary: fields.text({
          label: 'Summary',
          multiline: true,
          validation: { length: { max: 280 } },
        }),
        coverImage: fields.image({
          label: 'Cover image',
          directory: 'public/images/projects',
          publicPath: '/images/projects/',
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          { label: 'Tags', itemLabel: (p) => p.value },
        ),
        publishedAt: fields.date({ label: 'Published at' }),
        content: fields.markdoc({ label: 'Project description' }),
      },
    }),

    testimonials: collection({
      label: 'Testimonials',
      slugField: 'author',
      path: 'content/testimonials/*',
      format: { data: 'json' },
      columns: ['author', 'company'],
      schema: {
        author: fields.slug({
          name: { label: 'Author' },
          slug: { label: 'Slug' },
        }),
        role: fields.text({ label: 'Role' }),
        company: fields.text({ label: 'Company' }),
        quote: fields.text({
          label: 'Quote',
          multiline: true,
          validation: { length: { min: 20, max: 600 } },
        }),
        avatar: fields.image({
          label: 'Photo (optional)',
          directory: 'public/images/testimonials',
          publicPath: '/images/testimonials/',
        }),
      },
    }),
  },

  singletons: {
    navigation: singleton({
      label: 'Navigation (menu)',
      path: 'content/settings/navigation',
      format: { data: 'json' },
      schema: {
        mainNavigation: fields.array(navItem(), {
          label: 'Header menu items',
          itemLabel: navItemLabel,
        }),
        footerLinks: fields.array(navItem(), {
          label: 'Footer links',
          itemLabel: navItemLabel,
        }),
        footerNote: fields.text({
          label: 'Footer note',
          description: 'Optional small text below the links (e.g. tagline, address).',
          multiline: true,
        }),
      },
    }),

    siteSettings: singleton({
      label: 'Site settings',
      path: 'content/settings/site',
      format: { data: 'json' },
      schema: {
        siteName: fields.text({ label: 'Site name' }),
        tagline: fields.text({
          label: 'Tagline',
          multiline: true,
        }),
        favicon: fields.image({
          label: 'Favicon',
          description:
            'Browser tab icon. SVG recommended (scales perfectly); PNG (32×32 or larger) also works. Leave empty to use the default.',
          directory: 'public/images/favicons',
          publicPath: '/images/favicons/',
        }),
        contactEmail: fields.text({
          label: 'Contact email',
          validation: { isRequired: true },
        }),
        phone: fields.text({ label: 'Phone' }),
        whatsapp: fields.text({
          label: 'WhatsApp (digits only, with country code)',
          description: 'e.g. 5511999999999',
        }),
        social: fields.object({
          instagram: fields.url({ label: 'Instagram' }),
          linkedin: fields.url({ label: 'LinkedIn' }),
          github: fields.url({ label: 'GitHub' }),
        }, { label: 'Social' }),
      },
    }),
  },
});
