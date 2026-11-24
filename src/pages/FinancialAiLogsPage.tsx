import { useState, useEffect, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { Activity, Zap, Database, AlertTriangle, Clock, Hash } from 'lucide-react';
import type { AiLogsResponse, DayFilter } from '../types';
import {
  fetchFinancialAiLogs, bustFinancialCache,
  peekFinancialAiLogs, isFreshFinancialAiLogs,
} from '../api/financial';
import FilterBar from '../components/FilterBar';
import StatCard from '../components/StatCard';
import {
  Pagination, ErrorBlock, TableSkeleton, EmptyState, SectionCard,
  StatCardSkeleton, LangBadge,
} from '../components/UI';

const LIMIT = 50;

function fmtMs(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtPct(v: number | null): string {
  if (v == null) return '—';
  return `${(v * 100).toFixed(1)}%`;
}

function fmtTokens(n: number | null): string {
  if (n == null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function FinancialAiLogsPage() {
  const [days, setDays]             = useState<DayFilter>(7);
  const [offset, setOffset]         = useState(0);
  const [agentType, setAgentType]   = useState('');
  const [language, setLanguage]     = useState('');
  const [onlyFallback, setFallback] = useState(false);
  const [data, setData]       = useState<AiLogsResponse | null>(() => peekFinancialAiLogs(7, LIMIT, 0, '', '', false));
  const [loading, setLoading] = useState(!peekFinancialAiLogs(7, LIMIT, 0, '', '', false));
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async (bust = false) => {
    if (bust) bustFinancialCache();
    else {
      const stale = peekFinancialAiLogs(days, LIMIT, offset, agentType, language, onlyFallback);
      if (stale) setData(stale);
      if (isFreshFinancialAiLogs(days, LIMIT, offset, agentType, language, onlyFallback)) return;
      if (!stale) setLoading(true);
    }
    setError(null);
    try {
      setData(await fetchFinancialAiLogs(days, LIMIT, offset, agentType, language, onlyFallback));
    } catch (e) {
      if (!data) setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [days, offset, agentType, language, onlyFallback]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleDaysChange = (d: DayFilter) => { setDays(d); setOffset(0); };

  const agg = data?.aggregates;

  const agentTypes = useMemo(() => {
    const set = new Set<string>();
    data?.data.forEach(r => set.add(r.agent_type));
    return Array.from(set).sort();
  }, [data]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    data?.data.forEach(r => r.language && set.add(r.language));
    return Array.from(set).sort();
  }, [data]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <FilterBar
        days={days}
        onDaysChange={handleDaysChange}
        onRefresh={() => load(true)}
        loading={loading}
        title="AI Logs"
        subtitle={agg ? `${agg.total_calls.toLocaleString()} calls · ${fmtTokens(agg.total_tokens)} tokens` : undefined}
      />

      <div className="flex-1 overflow-y-auto">
        {error && !data ? (
          <div className="p-5"><ErrorBlock message={error} onRetry={() => load(true)} /></div>
        ) : (
          <div className="p-5 flex flex-col gap-5">

            {/* Aggregate stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
              {loading && !agg ? (
                Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : agg ? (
                <>
                  <StatCard label="Total Calls"      value={agg.total_calls}             icon={Activity} />
                  <StatCard label="Total Tokens"     value={fmtTokens(agg.total_tokens)} icon={Hash} />
                  <StatCard label="Cache Hit Rate"   value={fmtPct(agg.cache_hit_rate)}  icon={Database} subtitle={`${fmtTokens(agg.total_cache_read_tokens)} cached`} />
                  <StatCard label="Fallback Rate"    value={fmtPct(agg.fallback_rate)}   icon={AlertTriangle} subtitle="Gemini fallback" />
                  <StatCard label="Avg Latency"      value={fmtMs(agg.avg_latency_ms)}   icon={Clock} subtitle={`max ${fmtMs(agg.max_latency_ms)}`} />
                  <StatCard label="Prompt / Output"  value={`${fmtTokens(agg.total_prompt_tokens)} / ${fmtTokens(agg.total_completion_tokens)}`} icon={Zap} />
                </>
              ) : null}
            </div>

            {/* Per-model breakdown */}
            {agg && agg.per_model.length > 0 && (
              <SectionCard title="Per-Model Usage" description={`Calls and total tokens over the last ${days} days`}>
                <div>
                  {agg.per_model.map((m, i) => {
                    const share = agg.total_calls > 0 ? m.calls / agg.total_calls : 0;
                    const pct = Math.round(share * 100);
                    return (
                      <div key={m.model ?? `_${i}`}
                           className="px-5 py-4 flex items-center gap-4"
                           style={{ borderBottom: i < agg.per_model.length - 1 ? '1px solid var(--line)' : 'none' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13.5px] font-semibold font-mono truncate" style={{ color: 'var(--ink)' }}>
                              {m.model ?? 'unknown'}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-bold tabular-nums text-[13px]" style={{ color: 'var(--ink)' }}>
                                {m.calls.toLocaleString()}
                              </span>
                              <span className="text-[12px] font-semibold tabular-nums" style={{ color: 'var(--ink-3)' }}>
                                {fmtTokens(m.total_tokens)} tok
                              </span>
                              <span className="text-[12px] font-semibold w-10 text-right" style={{ color: 'var(--ink-3)' }}>
                                {pct}%
                              </span>
                            </div>
                          </div>
                          <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                            <div className="h-full rounded-full transition-all duration-700"
                                 style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {/* Filters */}
            <SectionCard title="Recent Calls" description="Latest AI calls with token usage and latency">
              <div className="flex flex-wrap items-center gap-2 px-3 sm:px-5 py-3"
                   style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
                <select
                  value={agentType}
                  onChange={(e) => { setAgentType(e.target.value); setOffset(0); }}
                  className="h-[30px] px-2 rounded-[7px] text-[12px] font-semibold"
                  style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-2)' }}>
                  <option value="">All agents</option>
                  {agentTypes.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <select
                  value={language}
                  onChange={(e) => { setLanguage(e.target.value); setOffset(0); }}
                  className="h-[30px] px-2 rounded-[7px] text-[12px] font-semibold"
                  style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-2)' }}>
                  <option value="">All languages</option>
                  {languages.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer select-none"
                       style={{ color: 'var(--ink-2)' }}>
                  <input
                    type="checkbox"
                    checked={onlyFallback}
                    onChange={(e) => { setFallback(e.target.checked); setOffset(0); }}
                  />
                  Fallback only
                </label>
              </div>

              {loading && !data ? (
                <TableSkeleton rows={8} />
              ) : !data || data.data.length === 0 ? (
                <EmptyState message="No AI calls for the selected filters." />
              ) : (
                <>
                  {/* Table header */}
                  <div className="hidden md:grid grid-cols-[90px_1fr_180px_90px_110px_90px_90px] gap-4 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em]"
                       style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                    <span>User</span>
                    <span>Agent</span>
                    <span>Model</span>
                    <span>Tokens</span>
                    <span>Cache R/W</span>
                    <span>Latency</span>
                    <span>When</span>
                  </div>

                  {data.data.map((row, i) => (
                    <div key={row.id}
                         className="grid grid-cols-2 md:grid-cols-[90px_1fr_180px_90px_110px_90px_90px] gap-2 md:gap-4 px-3 md:px-5 py-3 md:py-3.5 items-center text-[12px] md:text-[13px]"
                         style={{
                           borderBottom: i < data.data.length - 1 ? '1px solid var(--line)' : 'none',
                           background: 'var(--surface)',
                         }}
                         onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                         onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}>
                      <span className="font-mono font-semibold" style={{ color: 'var(--ink)' }}>
                        #{row.user_key}
                      </span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold truncate" style={{ color: 'var(--ink)' }}>
                          {row.agent_type}
                        </span>
                        {row.used_fallback && (
                          <span className="inline-flex rounded-full text-[10px] font-bold uppercase flex-none"
                                style={{ padding: '2px 7px', background: 'var(--bad-soft)', color: 'var(--bad)' }}>
                            fallback
                          </span>
                        )}
                        {row.language && <LangBadge lang={row.language} />}
                      </div>
                      <span className="font-mono text-[11px] md:text-[12px] truncate" style={{ color: 'var(--ink-2)' }}>
                        {row.model ?? '—'}
                      </span>
                      <span className="tabular-nums font-semibold" style={{ color: 'var(--ink)' }}>
                        {fmtTokens(row.total_tokens)}
                      </span>
                      <span className="tabular-nums text-[11px] md:text-[12px]" style={{ color: 'var(--ink-3)' }}>
                        {fmtTokens(row.cache_read_tokens)} / {fmtTokens(row.cache_create_tokens)}
                      </span>
                      <span className="tabular-nums" style={{ color: 'var(--ink-2)' }}>
                        {fmtMs(row.latency_ms)}
                      </span>
                      <span className="tabular-nums text-[11px] md:text-[12px]" style={{ color: 'var(--ink-3)' }}>
                        {format(new Date(row.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                  ))}

                  <Pagination offset={offset} limit={LIMIT} total={data.total} onPage={setOffset} unit="calls" />
                </>
              )}
            </SectionCard>

          </div>
        )}
      </div>
    </div>
  );
}
