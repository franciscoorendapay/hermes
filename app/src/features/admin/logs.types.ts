export interface Log {
  id: string;
  user: {
    id: string;
    name: string;
  } | null;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  category: 'visit' | 'accreditation' | 'api_error' | 'api_request' | 'system' | 'auth';
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  message: string;
  context: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface LogFilters {
  category?: string;
  level?: string;
  entity_type?: string;
  entity_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  total_logs: number;
  by_level: Record<string, number>;
  by_category: Record<string, number>;
  errors_by_day: Array<{
    date: string;
    count: number;
  }>;
  top_errors: Array<{
    message: string;
    count: number;
  }>;
}
