import { useState, useEffect, useCallback, useContext } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { RefreshCw, Menu, Heart, AlertTriangle, AlertCircle, CheckCircle2, Zap, Radio } from 'lucide-react';
import type { BotHealth, HealthStatus, HealthLogEntry } from '../types';
import {
  fetchFinancialHealth, bustFinancialCache,
  peekFinancialHealth, isFreshFinancialHealth,
} from '../api/financial';
import StatCard from '../components/StatCard';
import { ErrorBlock, SectionCard, EmptyState, TableSkeleton, StatCardSkeleton } from '../components/UI';
import { AppContext } from '../context';

const LIMIT = 50;

const STATUS_COPY: Record<HealthStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  operational: { label: 'Operational', color: 'var(--ok)',  bg: 'var(--ok-soft)',  icon: CheckCircle2 },
  degraded:    { label: 'Degraded',    color: '#B45309',    bg: '#FEF3C7',         icon: AlertTriangle },
  down:        { label: 'Down',        color: 'var(--bad)', bg: 'var(--bad-soft)', icon: AlertCircle   },
};

function levelStyle(label: HealthLogEntry['level_label']) {
  switch (label) {
    case 'fatal':
    case 'error': return { bg: 'var(--bad-soft)',  color: 'var(--bad)' };
    case 'warn':  return { bg: '#FEF3C7',          color: '#B45309'    };
    default:      return { bg: 'var(--surface-3)', color: 'var(--ink-2)' };
  }
}

export default function FinancialHealthPage() {
  const { openSidebar } = useContext(AppContext);
  const [data, setData]       = useState<BotHealth | null>(() => peekFinancialHealth(LIMIT));
  const [loading, setLoading] = useState(!peekFinancialHealth(LIMIT));
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async (bust = false) => {
    if (bust) bustFinancialCache();
    else {
      const stale = peekFinancialHealth(LIMIT);
      if (stale) setData(stale);
      if (isFreshFinancialHealth(LIMIT)) return;
      if (!stale) setLoading(true);
    }
    setError(null);
    try {
      setData(await fetchFinancialHealth(LIMIT));
    } catch (e) {
      if (!data) setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 30_000);
    return () => clearInterval(id);
  }, [load]);

  const status = data?.status ?? 'operational';
  const StatusConf = STATUS_COPY[status];
  const StatusIcon = StatusConf.icon;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 sm:px-4 md:px-5 py-3 flex-shrink-0 min-w-0"
           style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>
        <button type="button" onClick={openSidebar} aria-label="Open sidebar"
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[8px] flex-none"
                style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>
          <Menu size={17} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-extrabold text-[18px] md:text-[19px] lg:text-[20px] tracking-tight leading-none truncate"
              style={{ color: 'var(--ink)' }}>
            Bot Health
          </h1>
          {data && (
            <p className="text-[11px] sm:text-[12px] font-medium mt-[3px] truncate" style={{ color: 'var(--ink-3)' }}>
              Last checked {formatDistanceToNow(new Date(data.checked_at), { addSuffix: true })}
              {data.streamlogia_connected ? ' · streamlogia connected' : ' · streamlogia offline'}
            </p>
          )}
        </div>
        <button type="button" onClick={() => load(true)} disabled={loading} aria-label="Refresh"
                className="w-9 h-9 flex items-center justify-center rounded-[8px] disabled:opacity-40 flex-none"
                style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-3)' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {error && !data ? (
          <div className="p-5"><ErrorBlock message={error} onRetry={() => load(true)} /></div>
        ) : (
          <div className="p-5 flex flex-col gap-5">

            {/* Status banner */}
            {data && (
              <div className="card px-4 py-4 flex items-center gap-4 flex-wrap animate-fadeUp"
                   style={{ borderLeft: `4px solid ${StatusConf.color}` }}>
                <div className="w-[48px] h-[48px] rounded-[12px] flex items-center justify-center flex-none"
                     style={{ background: StatusConf.bg }}>
                  <StatusIcon size={22} style={{ color: StatusConf.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[18px] font-extrabold tracking-tight" style={{ color: StatusConf.color }}>
                    {StatusConf.label}
                  </p>
                  <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
                    {data.mins_since_last_message != null
                      ? `Last message ${data.mins_since_last_message} min ago`
                      : 'No messages recorded yet'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-none">
                  <Radio size={14} style={{ color: data.streamlogia_connected ? 'var(--ok)' : 'var(--ink-3)' }} />
                  <span className="text-[12px] font-semibold" style={{ color: data.streamlogia_connected ? 'var(--ok)' : 'var(--ink-3)' }}>
                    streamlogia {data.streamlogia_connected ? 'live' : 'off'}
                  </span>
                </div>
              </div>
            )}

            {/* Counts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {loading && !data ? (
                Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : data ? (
                <>
                  <StatCard label="Errors (1h)"    value={data.counts.errors_1h}   icon={AlertCircle}   subtitle={`${data.counts.errors_24h} in 24h`} />
                  <StatCard label="Warnings (1h)"  value={data.counts.warnings_1h} icon={AlertTriangle} subtitle={`${data.counts.warnings_24h} in 24h`} />
                  <StatCard label="Errors (24h)"   value={data.counts.errors_24h}  icon={Zap} />
                  <StatCard label="Warnings (24h)" value={data.counts.warnings_24h} icon={Heart} />
                </>
              ) : null}
            </div>

            {/* Recent errors/warnings */}
            <SectionCard title="Recent Errors & Warnings" description="Most recent 50 entries from the in-memory log buffer">
              {loading && !data ? (
                <TableSkeleton rows={6} />
              ) : !data || data.recent.length === 0 ? (
                <EmptyState message="No errors or warnings in the last 24 hours." />
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-[110px_80px_1fr_220px] gap-4 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em]"
                       style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                    <span>Time</span>
                    <span>Level</span>
                    <span>Message</span>
                    <span>Error</span>
                  </div>
                  {data.recent.map((row, i) => {
                    const ls = levelStyle(row.level_label);
                    return (
                      <div key={i}
                           className="grid grid-cols-1 md:grid-cols-[110px_80px_1fr_220px] gap-1 md:gap-4 px-3 md:px-5 py-3 items-start md:items-center text-[12px] md:text-[13px]"
                           style={{
                             borderBottom: i < data.recent.length - 1 ? '1px solid var(--line)' : 'none',
                             background: 'var(--surface)',
                           }}>
                        <span className="tabular-nums text-[11px] md:text-[12px]" style={{ color: 'var(--ink-3)' }}>
                          {format(new Date(row.time), 'MMM d, HH:mm:ss')}
                        </span>
                        <span className="inline-flex rounded-full text-[10.5px] font-bold uppercase tracking-[0.04em] w-fit"
                              style={{ padding: '2px 8px', background: ls.bg, color: ls.color }}>
                          {row.level_label}
                        </span>
                        <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                          {row.msg ?? '—'}
                        </span>
                        <span className="font-mono text-[11px] md:text-[12px] truncate" style={{ color: 'var(--ink-3)' }}>
                          {row.err_type ? `${row.err_type}: ${row.err_message ?? ''}` : (row.err_message ?? '—')}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </SectionCard>

          </div>
        )}
      </div>
    </div>
  );
}
