export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      lead_credenciamento: {
        Row: {
          agencia: string | null
          agencia_digito: string | null
          banco_codigo: string | null
          banco_nome: string | null
          conta_digito: string | null
          conta_numero: string | null
          conta_operacao: string | null
          conta_tipo: string | null
          created_at: string
          data_abertura_empresa: string | null
          doc_atividade_url: string | null
          doc_cnpj_url: string | null
          doc_foto_url: string | null
          doc_residencia_url: string | null
          documentos_pendentes: boolean | null
          id: string
          lead_id: string
          responsavel_cpf: string | null
          responsavel_data_nascimento: string | null
          responsavel_nome: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agencia?: string | null
          agencia_digito?: string | null
          banco_codigo?: string | null
          banco_nome?: string | null
          conta_digito?: string | null
          conta_numero?: string | null
          conta_operacao?: string | null
          conta_tipo?: string | null
          created_at?: string
          data_abertura_empresa?: string | null
          doc_atividade_url?: string | null
          doc_cnpj_url?: string | null
          doc_foto_url?: string | null
          doc_residencia_url?: string | null
          documentos_pendentes?: boolean | null
          id?: string
          lead_id: string
          responsavel_cpf?: string | null
          responsavel_data_nascimento?: string | null
          responsavel_nome?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agencia?: string | null
          agencia_digito?: string | null
          banco_codigo?: string | null
          banco_nome?: string | null
          conta_digito?: string | null
          conta_numero?: string | null
          conta_operacao?: string | null
          conta_tipo?: string | null
          created_at?: string
          data_abertura_empresa?: string | null
          doc_atividade_url?: string | null
          doc_cnpj_url?: string | null
          doc_foto_url?: string | null
          doc_residencia_url?: string | null
          documentos_pendentes?: boolean | null
          id?: string
          lead_id?: string
          responsavel_cpf?: string | null
          responsavel_data_nascimento?: string | null
          responsavel_nome?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_credenciamento_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_precificacao: {
        Row: {
          created_at: string
          elo_credito_vista: number | null
          elo_debito: number | null
          elo_parcelado_13a18: number | null
          elo_parcelado_2a6: number | null
          elo_parcelado_7a12: number | null
          id: string
          lead_id: string
          master_credito_vista: number | null
          master_debito: number | null
          master_parcelado_13a18: number | null
          master_parcelado_2a6: number | null
          master_parcelado_7a12: number | null
          outras_credito_vista: number | null
          outras_debito: number | null
          outras_parcelado_13a18: number | null
          outras_parcelado_2a6: number | null
          outras_parcelado_7a12: number | null
          taxa_antecipacao: number | null
          taxa_pix: number | null
          user_id: string
          visa_credito_vista: number | null
          visa_debito: number | null
          visa_parcelado_13a18: number | null
          visa_parcelado_2a6: number | null
          visa_parcelado_7a12: number | null
        }
        Insert: {
          created_at?: string
          elo_credito_vista?: number | null
          elo_debito?: number | null
          elo_parcelado_13a18?: number | null
          elo_parcelado_2a6?: number | null
          elo_parcelado_7a12?: number | null
          id?: string
          lead_id: string
          master_credito_vista?: number | null
          master_debito?: number | null
          master_parcelado_13a18?: number | null
          master_parcelado_2a6?: number | null
          master_parcelado_7a12?: number | null
          outras_credito_vista?: number | null
          outras_debito?: number | null
          outras_parcelado_13a18?: number | null
          outras_parcelado_2a6?: number | null
          outras_parcelado_7a12?: number | null
          taxa_antecipacao?: number | null
          taxa_pix?: number | null
          user_id: string
          visa_credito_vista?: number | null
          visa_debito?: number | null
          visa_parcelado_13a18?: number | null
          visa_parcelado_2a6?: number | null
          visa_parcelado_7a12?: number | null
        }
        Update: {
          created_at?: string
          elo_credito_vista?: number | null
          elo_debito?: number | null
          elo_parcelado_13a18?: number | null
          elo_parcelado_2a6?: number | null
          elo_parcelado_7a12?: number | null
          id?: string
          lead_id?: string
          master_credito_vista?: number | null
          master_debito?: number | null
          master_parcelado_13a18?: number | null
          master_parcelado_2a6?: number | null
          master_parcelado_7a12?: number | null
          outras_credito_vista?: number | null
          outras_debito?: number | null
          outras_parcelado_13a18?: number | null
          outras_parcelado_2a6?: number | null
          outras_parcelado_7a12?: number | null
          taxa_antecipacao?: number | null
          taxa_pix?: number | null
          user_id?: string
          visa_credito_vista?: number | null
          visa_debito?: number | null
          visa_parcelado_13a18?: number | null
          visa_parcelado_2a6?: number | null
          visa_parcelado_7a12?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_precificacao_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          cod_lead: number
          credenciado: number | null
          data_registro: string | null
          doc: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_estado: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          funil_app: number | null
          id: string
          lat: number | null
          lng: number | null
          mcc: string | null
          nome_fantasia: string
          nome1: string | null
          observacao: string | null
          prazo_recebimento: string | null
          qtd_equipamentos: number | null
          razao_social: string | null
          segmento: string | null
          share_credito_vista: number | null
          share_debito_pix: number | null
          share_parcelado_2a6: number | null
          share_parcelado_7a12: number | null
          telefone: string | null
          tpv: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cod_lead?: number
          credenciado?: number | null
          data_registro?: string | null
          doc?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          funil_app?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          mcc?: string | null
          nome_fantasia: string
          nome1?: string | null
          observacao?: string | null
          prazo_recebimento?: string | null
          qtd_equipamentos?: number | null
          razao_social?: string | null
          segmento?: string | null
          share_credito_vista?: number | null
          share_debito_pix?: number | null
          share_parcelado_2a6?: number | null
          share_parcelado_7a12?: number | null
          telefone?: string | null
          tpv?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cod_lead?: number
          credenciado?: number | null
          data_registro?: string | null
          doc?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          funil_app?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          mcc?: string | null
          nome_fantasia?: string
          nome1?: string | null
          observacao?: string | null
          prazo_recebimento?: string | null
          qtd_equipamentos?: number | null
          razao_social?: string | null
          segmento?: string | null
          share_credito_vista?: number | null
          share_debito_pix?: number | null
          share_parcelado_2a6?: number | null
          share_parcelado_7a12?: number | null
          telefone?: string | null
          tpv?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lembretes: {
        Row: {
          adicionado_rota: boolean | null
          created_at: string
          data_lembrete: string
          descricao: string | null
          estabelecimento_bairro: string | null
          estabelecimento_cep: string | null
          estabelecimento_cidade: string | null
          estabelecimento_endereco: string | null
          estabelecimento_estado: string | null
          estabelecimento_lat: number | null
          estabelecimento_lng: number | null
          estabelecimento_nome: string | null
          estabelecimento_numero: string | null
          hora_lembrete: string
          id: string
          lead_id: string | null
          status: string
          tipo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          adicionado_rota?: boolean | null
          created_at?: string
          data_lembrete: string
          descricao?: string | null
          estabelecimento_bairro?: string | null
          estabelecimento_cep?: string | null
          estabelecimento_cidade?: string | null
          estabelecimento_endereco?: string | null
          estabelecimento_estado?: string | null
          estabelecimento_lat?: number | null
          estabelecimento_lng?: number | null
          estabelecimento_nome?: string | null
          estabelecimento_numero?: string | null
          hora_lembrete: string
          id?: string
          lead_id?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          adicionado_rota?: boolean | null
          created_at?: string
          data_lembrete?: string
          descricao?: string | null
          estabelecimento_bairro?: string | null
          estabelecimento_cep?: string | null
          estabelecimento_cidade?: string | null
          estabelecimento_endereco?: string | null
          estabelecimento_estado?: string | null
          estabelecimento_lat?: number | null
          estabelecimento_lng?: number | null
          estabelecimento_nome?: string | null
          estabelecimento_numero?: string | null
          hora_lembrete?: string
          id?: string
          lead_id?: string | null
          status?: string
          tipo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lembretes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          ano: number
          created_at: string | null
          created_by: string | null
          id: string
          mes: number
          meta_clientes: number | null
          meta_valor: number | null
          meta_visitas: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ano: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          mes: number
          meta_clientes?: number | null
          meta_valor?: number | null
          meta_visitas?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ano?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          mes?: number
          meta_clientes?: number | null
          meta_valor?: number | null
          meta_visitas?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ordens_servico: {
        Row: {
          atendido_por: string | null
          created_at: string
          data_atendimento: string | null
          entregue_no_prazo: boolean | null
          id: string
          lead_id: string
          observacao: string | null
          prazo_entrega: string | null
          quantidade: number
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          atendido_por?: string | null
          created_at?: string
          data_atendimento?: string | null
          entregue_no_prazo?: boolean | null
          id?: string
          lead_id: string
          observacao?: string | null
          prazo_entrega?: string | null
          quantidade: number
          status?: string
          tipo?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          atendido_por?: string | null
          created_at?: string
          data_atendimento?: string | null
          entregue_no_prazo?: boolean | null
          id?: string
          lead_id?: string
          observacao?: string | null
          prazo_entrega?: string | null
          quantidade?: number
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nome: string
          regiao: string | null
          telefone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          nome: string
          regiao?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          regiao?: string | null
          telefone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sla_config: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          prazo_dias: number
          tipo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          prazo_dias?: number
          tipo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          prazo_dias?: number
          tipo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_hierarchy: {
        Row: {
          created_at: string | null
          id: string
          manager_id: string
          subordinate_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manager_id: string
          subordinate_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manager_id?: string
          subordinate_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitas: {
        Row: {
          data_visita: string | null
          id: string
          lat: number | null
          lead_id: string
          lng: number | null
          observacao: string | null
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          data_visita?: string | null
          id?: string
          lat?: number | null
          lead_id: string
          lng?: number | null
          observacao?: string | null
          status: string
          tipo: string
          user_id: string
        }
        Update: {
          data_visita?: string | null
          id?: string
          lat?: number | null
          lead_id?: string
          lng?: number | null
          observacao?: string | null
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_lead: {
        Args: { _lead_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_user: {
        Args: { _target_id: string; _viewer_id: string }
        Returns: boolean
      }
      get_subordinates: {
        Args: { _manager_id: string }
        Returns: {
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_manager_of: {
        Args: { _manager_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "comercial" | "regional" | "nacional" | "diretor" | "logistica"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["comercial", "regional", "nacional", "diretor", "logistica"],
    },
  },
} as const
