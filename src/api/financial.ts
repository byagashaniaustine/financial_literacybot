import type { FinancialOverview, FinancialQuestionsResponse, FinancialUsersResponse, FinancialTopics, FinancialBotStatus, AiLogsResponse, BotHealth, DayFilter } from '../types';
import { cacheGet, cacheGetStale, cacheIsFresh, cacheSet, cacheBust } from '../lib/cache';

const BASE   = import.meta.env.VITE_FINANCIAL_BASE_URL || '';
const SECRET = import.meta.env.VITE_FINANCIAL_SECRET ?? '';

function url(path: string): string {
  return BASE ? `${BASE}${path}` : `/financial-api${path}`;
}

function headers(): HeadersInit {
  return SECRET ? { Authorization: `Bearer ${SECRET}` } : {};
}

function fetchWithTimeout(input: string, init: RequestInit, ms = 30_000): Promise<Response> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(tid));
}

export function bustFinancialCache() { cacheBust('financial:'); }

// ─── Overview ────────────────────────────────────────────────────────────────
export function peekFinancialOverview(days: DayFilter): FinancialOverview | null {
  return cacheGetStale<FinancialOverview>(`financial:overview:${days}`);
}
export function isFreshFinancialOverview(days: DayFilter): boolean {
  return cacheIsFresh(`financial:overview:${days}`);
}
export async function fetchFinancialOverview(days: DayFilter): Promise<FinancialOverview> {
  const key = `financial:overview:${days}`;
  const hit = cacheGet<FinancialOverview>(key);
  if (hit) return hit;
  const res = await fetchWithTimeout(url(`/insights/overview?days=${days}`), { headers: headers() });
  if (!res.ok) throw new Error(`Financial overview: ${res.status} ${res.statusText}`);
  const data: FinancialOverview = await res.json();
  cacheSet(key, data);
  return data;
}

// ─── Questions ───────────────────────────────────────────────────────────────
export function peekFinancialQuestions(days: DayFilter, limit: number, offset: number, category: string, language: string): FinancialQuestionsResponse | null {
  return cacheGetStale<FinancialQuestionsResponse>(`financial:questions:${days}:${limit}:${offset}:${category}:${language}`);
}
export function isFreshFinancialQuestions(days: DayFilter, limit: number, offset: number, category: string, language: string): boolean {
  return cacheIsFresh(`financial:questions:${days}:${limit}:${offset}:${category}:${language}`);
}
export async function fetchFinancialQuestions(days: DayFilter, limit = 50, offset = 0, category = '', language = ''): Promise<FinancialQuestionsResponse> {
  const key = `financial:questions:${days}:${limit}:${offset}:${category}:${language}`;
  const hit = cacheGet<FinancialQuestionsResponse>(key);
  if (hit) return hit;
  const params = new URLSearchParams({ days: String(days), limit: String(limit), offset: String(offset) });
  if (category) params.set('category', category);
  if (language) params.set('language', language);
  const res = await fetchWithTimeout(url(`/insights/questions?${params}`), { headers: headers() });
  if (!res.ok) throw new Error(`Financial questions: ${res.status} ${res.statusText}`);
  const data: FinancialQuestionsResponse = await res.json();
  cacheSet(key, data);
  return data;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export function peekFinancialUsers(days: DayFilter, limit: number, offset: number): FinancialUsersResponse | null {
  return cacheGetStale<FinancialUsersResponse>(`financial:users:${days}:${limit}:${offset}`);
}
export function isFreshFinancialUsers(days: DayFilter, limit: number, offset: number): boolean {
  return cacheIsFresh(`financial:users:${days}:${limit}:${offset}`);
}
export async function fetchFinancialUsers(days: DayFilter, limit = 50, offset = 0): Promise<FinancialUsersResponse> {
  const key = `financial:users:${days}:${limit}:${offset}`;
  const hit = cacheGet<FinancialUsersResponse>(key);
  if (hit) return hit;
  const params = new URLSearchParams({ days: String(days), limit: String(limit), offset: String(offset) });
  const res = await fetchWithTimeout(url(`/insights/users?${params}`), { headers: headers() });
  if (!res.ok) throw new Error(`Financial users: ${res.status} ${res.statusText}`);
  const data: FinancialUsersResponse = await res.json();
  cacheSet(key, data);
  return data;
}

// ─── Topics ──────────────────────────────────────────────────────────────────
export function peekFinancialTopics(days: DayFilter): FinancialTopics | null {
  return cacheGetStale<FinancialTopics>(`financial:topics:${days}`);
}
export function isFreshFinancialTopics(days: DayFilter): boolean {
  return cacheIsFresh(`financial:topics:${days}`);
}
export async function fetchFinancialTopics(days: DayFilter): Promise<FinancialTopics> {
  const key = `financial:topics:${days}`;
  const hit = cacheGet<FinancialTopics>(key);
  if (hit) return hit;
  const res = await fetchWithTimeout(url(`/insights/topics?days=${days}`), { headers: headers() });
  if (!res.ok) throw new Error(`Financial topics: ${res.status} ${res.statusText}`);
  const data: FinancialTopics = await res.json();
  cacheSet(key, data);
  return data;
}

// ─── AI Logs ─────────────────────────────────────────────────────────────────
export function peekFinancialAiLogs(days: DayFilter, limit: number, offset: number, agentType: string, language: string, fallback: boolean): AiLogsResponse | null {
  return cacheGetStale<AiLogsResponse>(`financial:ai-logs:${days}:${limit}:${offset}:${agentType}:${language}:${fallback}`);
}
export function isFreshFinancialAiLogs(days: DayFilter, limit: number, offset: number, agentType: string, language: string, fallback: boolean): boolean {
  return cacheIsFresh(`financial:ai-logs:${days}:${limit}:${offset}:${agentType}:${language}:${fallback}`);
}
export async function fetchFinancialAiLogs(days: DayFilter, limit = 50, offset = 0, agentType = '', language = '', fallback = false): Promise<AiLogsResponse> {
  const key = `financial:ai-logs:${days}:${limit}:${offset}:${agentType}:${language}:${fallback}`;
  const hit = cacheGet<AiLogsResponse>(key);
  if (hit) return hit;
  const params = new URLSearchParams({ days: String(days), limit: String(limit), offset: String(offset) });
  if (agentType) params.set('agent_type', agentType);
  if (language) params.set('language', language);
  if (fallback) params.set('fallback', 'true');
  const res = await fetchWithTimeout(url(`/insights/ai-logs?${params}`), { headers: headers() });
  if (!res.ok) throw new Error(`Financial AI logs: ${res.status} ${res.statusText}`);
  const data: AiLogsResponse = await res.json();
  cacheSet(key, data);
  return data;
}

// ─── Bot Health ──────────────────────────────────────────────────────────────
export function peekFinancialHealth(limit: number): BotHealth | null {
  return cacheGetStale<BotHealth>(`financial:health:${limit}`);
}
export function isFreshFinancialHealth(limit: number): boolean {
  return cacheIsFresh(`financial:health:${limit}`);
}
export async function fetchFinancialHealth(limit = 50): Promise<BotHealth> {
  const key = `financial:health:${limit}`;
  const hit = cacheGet<BotHealth>(key);
  if (hit) return hit;
  const res = await fetchWithTimeout(url(`/insights/health?limit=${limit}`), { headers: headers() }, 10_000);
  if (!res.ok) throw new Error(`Financial health: ${res.status} ${res.statusText}`);
  const data: BotHealth = await res.json();
  cacheSet(key, data);
  return data;
}

// ─── Bot Status ──────────────────────────────────────────────────────────────
export function peekFinancialStatus(): FinancialBotStatus | null {
  return cacheGetStale<FinancialBotStatus>('financial:status');
}
export async function fetchFinancialStatus(): Promise<FinancialBotStatus> {
  const hit = cacheGet<FinancialBotStatus>('financial:status');
  if (hit) return hit;
  const res = await fetchWithTimeout(url('/insights/status'), { headers: headers() }, 10_000);
  if (!res.ok) throw new Error(`Financial status: ${res.status} ${res.statusText}`);
  const data: FinancialBotStatus = await res.json();
  cacheSet('financial:status', data);
  return data;
}

export function prefetchFinancial(): Promise<void> {
  return Promise.allSettled([
    fetchFinancialOverview(7),
    fetchFinancialQuestions(7, 50, 0),
    fetchFinancialUsers(7, 50, 0),
    fetchFinancialTopics(7),
  ]).then(() => {});
}
