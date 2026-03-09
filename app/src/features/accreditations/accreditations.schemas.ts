import { z } from "zod";

export const AccreditationSchema = z.object({
  id: z.string().optional(),
  lead: z.union([
    z.string(),
    z.object({
      id: z.string(),
      name: z.string().nullable().optional(),
      tradeName: z.string().nullable().optional(),
      companyName: z.string().nullable().optional(),
      document: z.string().nullable().optional(),
      city: z.string().nullable().optional(),
      state: z.string().nullable().optional(),
    })
  ]).nullable().optional(),
  user: z.string().or(z.object({ id: z.string() })).nullable().optional(),

  responsibleName: z.string(),
  responsibleCpf: z.string(),
  responsibleBirthDate: z.string().nullable().optional(),
  companyOpeningDate: z.string().nullable().optional(),

  bankName: z.string(),
  bankCode: z.string(),
  accountType: z.string(),
  accountOperation: z.string().nullable().optional(),
  bankBranch: z.string(),
  bankBranchDigit: z.string().nullable().optional(),
  bankAccount: z.string(),
  bankAccountDigit: z.string().nullable().optional(),

  docCnpjUrl: z.string().nullable().optional(),
  docPhotoUrl: z.string().nullable().optional(),
  docResidenceUrl: z.string().nullable().optional(),
  docActivityUrl: z.string().nullable().optional(),
  pendingDocuments: z.any().optional(), // Can be text or boolean in some contexts? Entity says TEXT.

  createdAt: z.string().optional(),
  updatedAt: z.string().nullable().optional(),

  status: z.string().optional(),
  rejectionReason: z.string().nullable().optional(),
}).passthrough();

export type AccreditationAPI = z.infer<typeof AccreditationSchema>;
