import { Lead } from "@/hooks/useLeads";
import { LeadAPI } from "./leads.schemas";

/**
 * Converte os dados da API (Symfony) para o formato do App
 */
export const adaptLeadApiToApp = (apiLead: LeadAPI): Lead => {
  // 1. Identificação do Contato (Prioridade para camelCase do Symfony)
  const rawContact = apiLead.firstContactName || apiLead.first_contact_name || apiLead.contactName || apiLead.contact_name;
  const contactRef = rawContact ? String(rawContact) : null;

  // 2. Normalização do Decision Maker (Consumo para o UI)
  let isDecisionMakerState: string | null = null;
  const rawTD = apiLead.isDecisionMaker ?? apiLead.is_decision_maker;

  if (rawTD !== undefined && rawTD !== null) {
    const val = String(rawTD).trim().toLowerCase();
    if (val === "sim" || val === "yes" || val === "true" || val === "1" || val === "t") {
      isDecisionMakerState = "sim";
    } else if (val === "nao" || val === "não" || val === "no" || val === "false" || val === "0" || val === "f") {
      isDecisionMakerState = "nao";
    }
  }

  // 3. Nome do Estabelecimento (Loja)
  const store = apiLead.tradeName || apiLead.trade_name || apiLead.name || apiLead.companyName || "Sem Nome";

  const adapted: Lead = {
    id: String(apiLead.id),
    cod_lead: Number(apiLead.leadCode || apiLead.lead_code || apiLead.id || 0),
    user_id: String(apiLead.user?.id || apiLead.user_id || "0"),
    nome_fantasia: String(store),
    nome1: contactRef,
    razao_social: apiLead.companyName || apiLead.company_name || null,
    doc: apiLead.document || apiLead.doc || null,
    email: apiLead.email || null,
    telefone: apiLead.phone ? String(apiLead.phone) : null,
    tpv: apiLead.tpv ? String(apiLead.tpv) : null,
    data_registro: (apiLead.createdAt || apiLead.created_at || new Date().toISOString()) as string,
    data_credenciamento: (apiLead.accreditationDate || apiLead.accreditation_date || null) as string | null,
    funil_app: Number(apiLead.appFunnel || apiLead.app_funnel || 1),
    credenciado: Number(apiLead.accreditation || 0),
    mcc: apiLead.mcc || null,
    segmento: apiLead.segment || apiLead.segmento || null,
    prazo_recebimento: apiLead.paymentTerm || apiLead.payment_term || null,
    share_debito_pix: apiLead.debitShare !== undefined && apiLead.debitShare !== null ? Number(apiLead.debitShare) : null,
    share_credito_vista: apiLead.creditShare !== undefined && apiLead.creditShare !== null ? Number(apiLead.creditShare) : null,
    share_parcelado_2a6: apiLead.installmentShare !== undefined && apiLead.installmentShare !== null ? Number(apiLead.installmentShare) : null,
    share_parcelado_7a12: apiLead.installmentShare712 !== undefined && apiLead.installmentShare712 !== null ? Number(apiLead.installmentShare712) : null,
    endereco_cep: apiLead.zipCode || apiLead.zip_code || null,
    endereco_logradouro: apiLead.street || null,
    endereco_numero: apiLead.number || null,
    endereco_bairro: apiLead.neighborhood || null,
    endereco_cidade: apiLead.city || null,
    endereco_estado: apiLead.state || null,
    lat: apiLead.lat ? String(apiLead.lat) : null,
    lng: apiLead.lng ? String(apiLead.lng) : null,
    observacao: apiLead.notes || null,
    updated_at: apiLead.updatedAt || apiLead.updated_at || null,
    qtd_equipamentos: apiLead.equipmentCount !== undefined && apiLead.equipmentCount !== null ? Number(apiLead.equipmentCount) : null,

    // Rates
    taxa_antecipacao: apiLead.anticipationRate ? Number(apiLead.anticipationRate) : null,
    taxa_pix: apiLead.pixRate ? Number(apiLead.pixRate) : null,

    visa_debito: apiLead.visaDebit ? Number(apiLead.visaDebit) : null,
    visa_credito_vista: apiLead.visaCredit ? Number(apiLead.visaCredit) : null,
    visa_parcelado_2a6: apiLead.visaInstallment2to6 ? Number(apiLead.visaInstallment2to6) : null,
    visa_parcelado_7a12: apiLead.visaInstallment7to12 ? Number(apiLead.visaInstallment7to12) : null,
    visa_parcelado_13a18: apiLead.visaInstallment13to18 ? Number(apiLead.visaInstallment13to18) : null,

    master_debito: apiLead.masterDebit ? Number(apiLead.masterDebit) : null,
    master_credito_vista: apiLead.masterCredit ? Number(apiLead.masterCredit) : null,
    master_parcelado_2a6: apiLead.masterInstallment2to6 ? Number(apiLead.masterInstallment2to6) : null,
    master_parcelado_7a12: apiLead.masterInstallment7to12 ? Number(apiLead.masterInstallment7to12) : null,
    master_parcelado_13a18: apiLead.masterInstallment13to18 ? Number(apiLead.masterInstallment13to18) : null,

    elo_debito: apiLead.eloDebit ? Number(apiLead.eloDebit) : null,
    elo_credito_vista: apiLead.eloCredit ? Number(apiLead.eloCredit) : null,
    elo_parcelado_2a6: apiLead.eloInstallment2to6 ? Number(apiLead.eloInstallment2to6) : null,
    elo_parcelado_7a12: apiLead.eloInstallment7to12 ? Number(apiLead.eloInstallment7to12) : null,
    elo_parcelado_13a18: apiLead.eloInstallment13to18 ? Number(apiLead.eloInstallment13to18) : null,

    outras_debito: apiLead.othersDebit ? Number(apiLead.othersDebit) : null,
    outras_credito_vista: apiLead.othersCredit ? Number(apiLead.othersCredit) : null,
    outras_parcelado_2a6: apiLead.othersInstallment2to6 ? Number(apiLead.othersInstallment2to6) : null,
    outras_parcelado_7a12: apiLead.othersInstallment7to12 ? Number(apiLead.othersInstallment7to12) : null,
    outras_parcelado_13a18: apiLead.othersInstallment13to18 ? Number(apiLead.othersInstallment13to18) : null,

    is_decision_maker: isDecisionMakerState,
    nome_tomador_decisao: contactRef,
    apiToken: (apiLead as any).apiToken || null,
  };

  return adapted;
};

/**
 * Converte os dados do App para o formato da API (Symfony)
 * CORREÇÃO: Envia campos baseados exatamente no Trace do Symfony
 */
export const adaptAppToLeadApi = (lead: Partial<Lead> & { nome_tomador_decisao?: string }): Partial<LeadAPI> => {
  const isDecision = (lead as any).is_decision_maker === "sim" || lead.is_decision_maker === "sim";
  const contactValue = lead.nome1 || lead.nome_tomador_decisao || "";
  const storeValue = lead.nome_fantasia || "Sem Nome";
  const funnelValue = Number(lead.funil_app || 1);

  // Payload redundante para garantir que o Symfony capture independente da configuração do Serializer
  const payload: any = {
    // NOMES
    name: storeValue,
    tradeName: storeValue,
    trade_name: storeValue,
    companyName: lead.razao_social || storeValue,
    company_name: lead.razao_social || storeValue,

    // CONTATO
    firstContactName: contactValue,
    first_contact_name: contactValue,
    nome1: contactValue,

    // STATUS DECISÃO - Ajuste V6: Texto "1"/"0" para satisfazer Symfony e MySQL
    isDecisionMaker: isDecision,
    is_decision_maker: isDecision,

    // FUNIL E SISTEMA
    appFunnel: funnelValue,
    app_funnel: funnelValue,
    funil_app: funnelValue,
    user_id: lead.user_id,
    phone: lead.telefone,
    email: lead.email,
    document: lead.doc,

    // ENDEREÇO
    zip_code: lead.endereco_cep,
    zipCode: lead.endereco_cep,
    street: lead.endereco_logradouro,
    number: lead.endereco_numero,
    neighborhood: lead.endereco_bairro,
    city: lead.endereco_cidade,
    state: lead.endereco_estado,

    // TIPAGEM BUSINESS
    accreditation: lead.credenciado ? Number(lead.credenciado) : 0,
    tpv: lead.tpv ? String(lead.tpv) : "0",
    segment: lead.segmento || "",
    paymentTerm: lead.prazo_recebimento || "",
    payment_term: lead.prazo_recebimento || "",
    equipmentCount: lead.qtd_equipamentos ? Number(lead.qtd_equipamentos) : null,
    notes: lead.observacao || "",

    // MCC E LOCALIZAÇÃO
    mcc: lead.mcc || "",
    lat: lead.lat ? String(lead.lat) : null,
    lng: lead.lng ? String(lead.lng) : null,

    // SHARES (Mappings)
    debitShare: lead.share_debito_pix !== undefined && lead.share_debito_pix !== null ? String(lead.share_debito_pix) : null,
    debit_share: lead.share_debito_pix !== undefined && lead.share_debito_pix !== null ? String(lead.share_debito_pix) : null,
    creditShare: lead.share_credito_vista !== undefined && lead.share_credito_vista !== null ? String(lead.share_credito_vista) : null,
    credit_share: lead.share_credito_vista !== undefined && lead.share_credito_vista !== null ? String(lead.share_credito_vista) : null,
    installmentShare: lead.share_parcelado_2a6 !== undefined && lead.share_parcelado_2a6 !== null ? String(lead.share_parcelado_2a6) : null,
    installment_share: lead.share_parcelado_2a6 !== undefined && lead.share_parcelado_2a6 !== null ? String(lead.share_parcelado_2a6) : null,
    installmentShare712: lead.share_parcelado_7a12 !== undefined && lead.share_parcelado_7a12 !== null ? String(lead.share_parcelado_7a12) : null,
    installment_share_712: lead.share_parcelado_7a12 !== undefined && lead.share_parcelado_7a12 !== null ? String(lead.share_parcelado_7a12) : null,

    // Rates
    anticipationRate: lead.taxa_antecipacao ? String(lead.taxa_antecipacao) : null,
    pixRate: lead.taxa_pix ? String(lead.taxa_pix) : null,

    visaDebit: lead.visa_debito ? String(lead.visa_debito) : null,
    visaCredit: lead.visa_credito_vista ? String(lead.visa_credito_vista) : null,
    visaInstallment2to6: lead.visa_parcelado_2a6 ? String(lead.visa_parcelado_2a6) : null,
    visaInstallment7to12: lead.visa_parcelado_7a12 ? String(lead.visa_parcelado_7a12) : null,
    visaInstallment13to18: lead.visa_parcelado_13a18 ? String(lead.visa_parcelado_13a18) : null,

    masterDebit: lead.master_debito ? String(lead.master_debito) : null,
    masterCredit: lead.master_credito_vista ? String(lead.master_credito_vista) : null,
    masterInstallment2to6: lead.master_parcelado_2a6 ? String(lead.master_parcelado_2a6) : null,
    masterInstallment7to12: lead.master_parcelado_7a12 ? String(lead.master_parcelado_7a12) : null,
    masterInstallment13to18: lead.master_parcelado_13a18 ? String(lead.master_parcelado_13a18) : null,

    eloDebit: lead.elo_debito ? String(lead.elo_debito) : null,
    eloCredit: lead.elo_credito_vista ? String(lead.elo_credito_vista) : null,
    eloInstallment2to6: lead.elo_parcelado_2a6 ? String(lead.elo_parcelado_2a6) : null,
    eloInstallment7to12: lead.elo_parcelado_7a12 ? String(lead.elo_parcelado_7a12) : null,
    eloInstallment13to18: lead.elo_parcelado_13a18 ? String(lead.elo_parcelado_13a18) : null,

    othersDebit: lead.outras_debito ? String(lead.outras_debito) : null,
    othersCredit: lead.outras_credito_vista ? String(lead.outras_credito_vista) : null,
    othersInstallment2to6: lead.outras_parcelado_2a6 ? String(lead.outras_parcelado_2a6) : null,
    othersInstallment7to12: lead.outras_parcelado_7a12 ? String(lead.outras_parcelado_7a12) : null,
    othersInstallment13to18: lead.outras_parcelado_13a18 ? String(lead.outras_parcelado_13a18) : null,
  };

  console.log("!!! [ADAPTER_V6] Enviando Payload:", payload);
  return payload;
};
