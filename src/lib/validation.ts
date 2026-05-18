import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  email: z.string().trim().email('Email inválido').max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => (v ? v : null)),
  subject: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? v : null)),
  message: z.string().trim().min(10, 'Mensagem muito curta').max(5000),
  source: z.string().trim().max(80).optional().nullable(),
  // Honeypot — campo escondido. Bots geralmente preenchem.
  website: z.string().max(0).optional().nullable(),
  // Turnstile token (opcional — só validado se CF_TURNSTILE_SECRET estiver definido).
  'cf-turnstile-response': z.string().optional().nullable(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const approveSchema = z.object({
  token: z.string().min(20).max(100),
  decision: z.enum(['approved', 'rejected']),
  comment: z
    .string()
    .trim()
    .max(2000)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null)),
});

export type ApproveInput = z.infer<typeof approveSchema>;
