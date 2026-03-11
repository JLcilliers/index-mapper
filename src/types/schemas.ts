import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  domain: z.string().min(1, "Domain is required"),
  niche: z.string().optional(),
  notes: z.string().optional(),
  gscProperty: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const projectRunSchema = z.object({
  name: z.string().min(1, "Run name is required"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
  crawlMaxPages: z.number().min(1).max(5000).default(500),
  crawlMaxDepth: z.number().min(1).max(20).default(10),
});

export type ProjectRunFormData = z.infer<typeof projectRunSchema>;

export const reviewDecisionSchema = z.object({
  urlRecordId: z.string(),
  finalRecommendation: z.enum([
    "KEEP_INDEXED",
    "KEEP_INDEXED_IMPROVE",
    "CONSIDER_NOINDEX",
    "MANUAL_REVIEW_REQUIRED",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  targetUrl: z.string().optional(),
  approved: z.boolean().default(false),
});

export type ReviewDecisionFormData = z.infer<typeof reviewDecisionSchema>;
