import { useState, useEffect, useCallback } from 'react';
import { Users, MessageSquare, Activity, UserCheck, Clock, CheckCircle, RefreshCw, RotateCcw } from 'lucide-react';
import type { FinancialOverview, FinancialBotStatus, DayFilter } from '../types';
import {
  fetchFinancialOverview, bustFinancialCache, peekFinancialOverview, isFreshFinancialOverview,
  fetchFinancialStatus, peekFinancialStatus,
} from '../api/financial';
import FilterBar from '../components/FilterBar';
import StatCard from '../components/StatCard';
import { CategoryBarChart, LanguagePieChart, FinancialAreaChart } from '../components/Charts';
import { ChartSkeleton, StatCardSkeleton, ErrorBlock, SectionCard } from '../components/UI';

function fmtMs(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function BotStatusBanner({ status }: { status: FinancialBotStatus }) {
  const isOk = status.status === 'operational';
  return (
    <div className="card px-3 sm:px-4 md:px-5 py-3 md:py-4 flex items-center gap-3 flex-wrap animate-fadeUp text-[12px] sm:text-[13px]">
      <div className="flex items-center gap-2">
        <span className={isOk ? 'live-dot' : undefined}
              style={!isOk ? { width: 8, height: 8, borderRadius: '50%', background: 'var(--bad)', display: 'inline-block' } : undefined} />
        <span className="font-bold" style={{ color: isOk ? 'var(--ok)' : 'var(--bad)' }}>
          {isOk ? 'Operational' : status.status}
        </span>
      </div>
      <div className="hidden sm:block h-4 w-px" style={{ background: 'var(--line)' }} />
      <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>
        <span className="font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{status.active_sessions}</span> active
      </span>
      <div className="hidden sm:block h-4 w-px" style={{ background: 'var(--line)' }} />
      <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>
        <span className="font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{status.messages_last_24h.toLocaleString()}</span> msgs (24h)
      </span>
      <div className="hidden sm:block h-4 w-px" style={{ background: 'var(--line)' }} />
      <span className="font-semibold" style={{ color: 'var(--ink-2)' }}>
        reply <span className="font-bold tabular-nums" style={{ color: 'var(--ink)' }}>{fmtMs(status.avg_reply_ms_24h)}</span>
      </span>
      {status.last_message_at && (
        <span className="text-[11px] sm:text-[12px]" style={{ color: 'var(--ink-3)' }}>
          last {new Date(status.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

export default function FinancialPage() {
  const [days, setDays]         = useState<DayFilter>(7);
  const [data, setData]         = useState<FinancialOverview | null>(() => peekFinancialOverview(7));
  const [status, setStatus]     = useState<FinancialBotStatus | null>(() => peekFinancialStatus());
  const [loading, setLoading]   = useState(!peekFinancialOverview(7));
  const [error, setError]       = useState<string | null>(null);

  const load = useCallback(async (bust = false) => {
    if (bust) {
      bustFinancialCache();
    } else {
      const stale = peekFinancialOverview(days);
      if (stale) setData(stale);
      if (isFreshFinancialOverview(days)) return;
      if (!stale) setLoading(true);
    }
    setError(null);
    try {
      const [overview, botStatus] = await Promise.all([
        fetchFinancialOverview(days),
        fetchFinancialStatus(),
      ]);
      setData(overview);
      setStatus(botStatus);
    } catch (e) {
      if (!data) setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => load(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [load]);

  const chartData = data
    ? data.days.map((d, i) => ({
        key: d.key,
        messages: data.total_series[i] ?? 0,
        users: data.unique_users_series[i] ?? 0,
      }))
    : [];

  const categoryData = data
    ? Object.entries(data.category_breakdown)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  const langData = data
    ? Object.entries(data.language_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  const outcomes = data?.session_outcomes;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <FilterBar
        days={days}
        onDaysChange={(d) => setDays(d as DayFilter)}
        onRefresh={() => load(true)}
        loading={loading}
        title="Financial Literacy TZ"
        subtitle={data ? `${data.total_messages.toLocaleString()} messages in the last ${days} days` : undefined}
      />

      <div className="flex-1 overflow-y-auto">
        {error && !data ? (
          <div className="p-5"><ErrorBlock message={error} onRetry={() => load(true)} /></div>
        ) : (
          <div className="p-3 sm:p-4 md:p-5 flex flex-col gap-3 md:gap-5">

            {/* Bot status banner */}
            {status && <BotStatusBanner status={status} />}

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {loading && !data ? (
                <><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></>
              ) : data ? (
                <>
                  <StatCard label="Messages"       value={data.total_messages}  icon={MessageSquare} subtitle={`Last ${days} days`} />
                  <StatCard label="Unique Users"    value={data.unique_users}    icon={UserCheck}     subtitle={`Last ${days} days`} />
                  <StatCard label="Total Users"     value={data.total_users}     icon={Users}         subtitle="All time"            />
                  <StatCard label="Avg Reply Time"  value={fmtMs(data.avg_reply_ms)} icon={Clock}    subtitle={`Last ${days} days`} />
                </>
              ) : null}
            </div>

            {/* Conversation outcomes */}
            <SectionCard title="Conversation Outcomes" description={`Session states — last ${days} days`}>
              {loading && !data ? (
                <div className="p-5 grid grid-cols-3 gap-4">
                  {[0,1,2].map(i => <div key={i} className="skeleton h-16 rounded-[10px]" />)}
                </div>
              ) : outcomes ? (
                <div className="grid grid-cols-3 divide-x divide-[var(--line)]">
                  {[
                    { label: 'Active',    value: outcomes.active,    icon: Activity,    color: 'var(--accent)'  },
                    { label: 'Completed', value: outcomes.completed, icon: CheckCircle, color: 'var(--ok)'      },
                    { label: 'Resets',    value: outcomes.resets,    icon: RotateCcw,   color: 'var(--ink-3)'   },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex flex-col items-center justify-center py-4 md:py-6 gap-1.5 md:gap-2">
                      <Icon size={20} style={{ color }} />
                      <p className="font-extrabold tabular-nums text-[22px] md:text-[28px] leading-none" style={{ color: 'var(--ink)' }}>
                        {value.toLocaleString()}
                      </p>
                      <p className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>{label}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </SectionCard>

            {/* Daily trend chart */}
            <SectionCard title="Daily Activity" description="Messages and unique users per day">
              {loading && !data
                ? <ChartSkeleton />
                : data
                  ? <div className="px-4 pt-2 pb-2"><FinancialAreaChart data={chartData} /></div>
                  : null}
            </SectionCard>

            {/* Category + Language side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SectionCard title="Questions by Category" description={`Top topics — last ${days} days`}>
                {loading && !data
                  ? <ChartSkeleton />
                  : data
                    ? <div className="px-4 pt-2 pb-2"><CategoryBarChart data={categoryData} /></div>
                    : null}
              </SectionCard>

              <SectionCard title="Language Distribution" description="English vs Kiswahili">
                {loading && !data
                  ? <ChartSkeleton height={200} />
                  : data
                    ? <div className="px-4 pt-2 pb-2">
                        <LanguagePieChart data={langData} centerLabel={data.unique_users.toLocaleString()} />
                      </div>
                    : null}
              </SectionCard>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
