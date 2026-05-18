import { config, collection, singleton, fields } from '@keystatic/core';

// TODO: ao criar o repo no GitHub, trocar owner/name abaixo.
const GITHUB_REPO = { owner: 'TROCAR-OWNER', name: 'example-full-website' };

const isProd = process.env.NODE_ENV === 'production';

export default config({
  storage: isProd
    ? { kind: 'github', repo: GITHUB_REPO }
    : { kind: 'local' },

  ui: {
    brand: { name: 'Portfólio' },
    navigation: {
      Conteúdo: ['services', 'projects', 'testimonials'],
      Configurações: ['siteSettings'],
    },
  },

  collections: {
    services: collection({
      label: 'Serviços',
      slugField: 'title',
      path: 'content/services/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['title', 'order'],
      schema: {
        title: fields.slug({
          name: { label: 'Título' },
          slug: { label: 'Slug (URL)' },
        }),
        description: fields.text({
          label: 'Descrição curta',
          description: 'Aparece nos cards de serviço (até ~140 caracteres).',
          multiline: true,
          validation: { length: { max: 160 } },
        }),
        icon: fields.text({
          label: 'Ícone (nome lucide)',
          description: 'Ex: "code", "palette", "rocket". Lista em lucide.dev/icons',
        }),
        order: fields.integer({
          label: 'Ordem de exibição',
          defaultValue: 0,
        }),
        content: fields.markdoc({
          label: 'Conteúdo (página do serviço)',
        }),
      },
    }),

    projects: collection({
      label: 'Projetos / Cases',
      slugField: 'title',
      path: 'content/projects/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      columns: ['title', 'client', 'publishedAt'],
      schema: {
        title: fields.slug({
          name: { label: 'Título' },
          slug: { label: 'Slug (URL)' },
        }),
        client: fields.text({ label: 'Cliente' }),
        summary: fields.text({
          label: 'Resumo',
          multiline: true,
          validation: { length: { max: 280 } },
        }),
        coverImage: fields.image({
          label: 'Imagem de capa',
          directory: 'public/images/projects',
          publicPath: '/images/projects/',
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          { label: 'Tags', itemLabel: (p) => p.value },
        ),
        publishedAt: fields.date({ label: 'Publicado em' }),
        content: fields.markdoc({ label: 'Descrição do projeto' }),
      },
    }),

    testimonials: collection({
      label: 'Depoimentos',
      slugField: 'author',
      path: 'content/testimonials/*',
      format: { data: 'json' },
      columns: ['author', 'company'],
      schema: {
        author: fields.slug({
          name: { label: 'Autor' },
          slug: { label: 'Slug' },
        }),
        role: fields.text({ label: 'Cargo' }),
        company: fields.text({ label: 'Empresa' }),
        quote: fields.text({
          label: 'Depoimento',
          multiline: true,
          validation: { length: { min: 20, max: 600 } },
        }),
        avatar: fields.image({
          label: 'Foto (opcional)',
          directory: 'public/images/testimonials',
          publicPath: '/images/testimonials/',
        }),
      },
    }),
  },

  singletons: {
    siteSettings: singleton({
      label: 'Configurações do site',
      path: 'content/settings/site',
      format: { data: 'json' },
      schema: {
        siteName: fields.text({ label: 'Nome do site' }),
        tagline: fields.text({
          label: 'Slogan',
          multiline: true,
        }),
        contactEmail: fields.text({
          label: 'Email de contato',
          validation: { isRequired: true },
        }),
        phone: fields.text({ label: 'Telefone' }),
        whatsapp: fields.text({
          label: 'WhatsApp (somente números, com DDI)',
          description: 'Ex: 5511999999999',
        }),
        social: fields.object({
          instagram: fields.url({ label: 'Instagram' }),
          linkedin: fields.url({ label: 'LinkedIn' }),
          github: fields.url({ label: 'GitHub' }),
        }, { label: 'Redes sociais' }),
      },
    }),
  },
});
