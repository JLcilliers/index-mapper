import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  domain: z.string().min(1, "Domain is required"),
  niche: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const projectRunSchema = z.object({
  name: z.string().min(1, "Run name is required"),
  description: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
});

export type ProjectRunFormData = z.infer<typeof projectRunSchema>;

export const reviewDecisionSchema = z.object({
  urlRecordId: z.string(),
  finalClassification: z.enum([
    "keep_as_is",
    "improve_update",
    "redirect_consolidate",
    "remove_deindex",
  ]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  targetUrl: z.string().optional(),
});

export type ReviewDecisionFormData = z.infer<typeof reviewDecisionSchema>;

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignInFormData = z.infer<typeof signInSchema>;
