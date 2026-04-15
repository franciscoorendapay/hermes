import { z } from "zod";

/**
 * Esquema exaustivo baseado no log do console do usuário.
 * Contém versões snake_case e camelCase para máxima compatibilidade.
 */
export const LeadApiSchema = z.object({
  id: z.string().or(z.number()),

  // Nomes e Identificação
  name: z.string().nullable().optional(),
  tradeName: z.string().nullable().optional(),
  trade_name: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  company_name: z.string().nullable().optional(),

  // Contato e Decisão (Visto no console como camelCase)
  firstContactName: z.string().nullable().optional(),
  first_contact_name: z.string().nullable().optional(),
  isDecisionMaker: z.any().optional(),
  is_decision_maker: z.any().optional(),

  // Relacionamentos
  user: z.object({
    id: z.string().or(z.number()),
    name: z.string().nullable().optional(),
  }).nullable().optional(),

  // Dados de Comunicação
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  document: z.string().nullable().optional(),
  doc: z.string().nullable().optional(),

  // Endereço (Misto snake/camel no console)
  street: z.string().nullable().optional(),
  number: z.string().nullable().optional(),
  neighborhood: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zipCode: z.string().nullable().optional(),
  zip_code: z.string().nullable().optional(),

  // Business / Financeiro
  tpv: z.any().optional(),
  mcc: z.string().nullable().optional(),
  segment: z.string().nullable().optional(),
  segmento: z.string().nullable().optional(),
  paymentTerm: z.string().nullable().optional(),
  payment_term: z.string().nullable().optional(),
  equipmentCount: z.any().optional(),
  equipment_count: z.any().optional(),

  // Shares
  debitShare: z.any().optional(),
  debit_share: z.any().optional(),
  creditShare: z.any().optional(),
  credit_share: z.any().optional(),
  installmentShare: z.any().optional(),
  installment_share: z.any().optional(),
  installmentShare712: z.any().optional(),
  installment_share_712: z.any().optional(),

  // Sistema
  appFunnel: z.any().optional(),
  app_funnel: z.any().optional(),
  accreditation: z.any().optional(),
  notes: z.string().nullable().optional(),
  observacao: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(),
  lat: z.any().optional(),
  lng: z.any().optional(),

  createdAt: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  accreditationDate: z.string().nullable().optional(),
  accreditation_date: z.string().nullable().optional(),

  leadCode: z.any().optional(),
  lead_code: z.any().optional(),

  // Orenda API fields
  apiToken: z.string().nullable().optional(),
  apiId: z.string().nullable().optional(),
}).passthrough();

export type LeadAPI = z.infer<typeof LeadApiSchema>;
