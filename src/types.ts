export type DayFilter = 7 | 30 | 90;

export type Page = 'summary' | 'questions' | 'users' | 'topics';

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
