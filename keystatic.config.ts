import { config, collection, singleton, fields } from '@keystatic/core';

const GITHUB_REPO = { owner: 'moabe-br-2019', name: 'example-website' };

const isProd = process.env.NODE_ENV === 'production';

export default config({
  storage: isProd
    ? { kind: 'github', repo: GITHUB_REPO }
    : { kind: 'local' },

  ui: {
    brand: { name: 'Portfolio' },
    navigation: {
      Content: ['services', 'projects', 'testimonials'],
      Settings: ['siteSettings'],
    },
  },

  collections: {
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
