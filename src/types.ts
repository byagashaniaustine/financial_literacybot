export type DayFilter = 7 | 30 | 90;

export type Page = 'summary' | 'questions' | 'users' | 'topics' | 'ai-logs' | 'health';

export interface FinancialSessionOutcomes {
  active: number;
  completed: number;
  resets: number;
}

export interface FinancialBotStatus {
  status: string;
  active_sessions: number;
  messages_last_24h: number;
  last_message_at: string | null;
  avg_reply_ms_24h: number | null;
}

export interface FinancialOverview {
  period: { days: number };
  total_messages: number;
  unique_users: number;
  total_users: number;
  active_sessions: number;
  avg_reply_ms: number | null;
  session_outcomes: FinancialSessionOutcomes;
  language_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
  days: { key: string; date: string }[];
  total_series: number[];
  unique_users_series: number[];
}

export interface FinancialQuestion {
  id: number;
  user_key: string;
  question: string;
  category: string;
  language: string;
  askedAt: string;
}

export interface FinancialQuestionsResponse {
  total: number;
  offset: number;
  limit: number;
  data: FinancialQuestion[];
}

export interface FinancialUser {
  user_key: string;
  message_count: number;
  categories_used: string[];
  language: string;
  last_active: string;
}

export interface FinancialUsersResponse {
  total: number;
  offset: number;
  limit: number;
  data: FinancialUser[];
}

export interface FinancialTopic {
  category: string;
  count: number;
  share: number;
  languages: Record<string, number>;
}

export interface FinancialTopics {
  total_messages: number;
  period_days: number;
  categories: FinancialTopic[];
}

export interface AiLog {
  id: number;
  user_key: string;
  agent_type: string;
  model: string | null;
  used_fallback: boolean;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  cache_create_tokens: number | null;
  cache_read_tokens: number | null;
  latency_ms: number | null;
  language: string | null;
  createdAt: string;
}

export interface AiLogsAggregates {
  total_calls: number;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_cache_read_tokens: number;
  total_cache_create_tokens: number;
  cache_hit_rate: number | null;
  fallback_rate: number;
  avg_latency_ms: number | null;
  max_latency_ms: number | null;
  per_model: { model: string | null; calls: number; total_tokens: number }[];
}

export interface AiLogsResponse {
  period: { days: number };
  aggregates: AiLogsAggregates;
  total: number;
  offset: number;
  limit: number;
  data: AiLog[];
}

export type HealthStatus = 'operational' | 'degraded' | 'down';

export interface HealthLogEntry {
  time: string;
  level: number;
  level_label: 'warn' | 'error' | 'fatal' | 'info';
  msg: string | null;
  err_type: string | null;
  err_message: string | null;
}

export interface BotHealth {
  status: HealthStatus;
  checked_at: string;
  last_message_at: string | null;
  mins_since_last_message: number | null;
  streamlogia_connected: boolean;
  counts: {
    errors_1h: number;
    warnings_1h: number;
    errors_24h: number;
    warnings_24h: number;
  };
  recent: HealthLogEntry[];
}
