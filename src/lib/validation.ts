import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(120),
  email: z.string().trim().email('Invalid email').max(200),
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
  message: z.string().trim().min(10, 'Message too short').max(5000),
  source: z.string().trim().max(80).optional().nullable(),
  // Honeypot — hidden field. Bots usually fill it in.
  website: z.string().max(0).optional().nullable(),
  // Turnstile token (optional — only validated if CF_TURNSTILE_SECRET is set).
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
