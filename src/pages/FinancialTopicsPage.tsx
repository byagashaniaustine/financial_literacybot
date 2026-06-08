import { useState, useEffect, useCallback } from 'react';
import type { FinancialTopics, DayFilter } from '../types';
import { fetchFinancialTopics, bustFinancialCache, peekFinancialTopics, isFreshFinancialTopics } from '../api/financial';
import FilterBar from '../components/FilterBar';
import { CategoryBarChart } from '../components/Charts';
import { ChartSkeleton, ErrorBlock, SectionCard, LangBadge, EmptyState } from '../components/UI';

export default function FinancialTopicsPage() {
  const [days, setDays]       = useState<DayFilter>(7);
  const [data, setData]       = useState<FinancialTopics | null>(() => peekFinancialTopics(7));
  const [loading, setLoading] = useState(!peekFinancialTopics(7));
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async (bust = false) => {
    if (bust) bustFinancialCache();
    else {
      const stale = peekFinancialTopics(days);
      if (stale) setData(stale);
      if (isFreshFinancialTopics(days)) return;
      if (!stale) setLoading(true);
    }
    setError(null);
    try {
      setData(await fetchFinancialTopics(days));
    } catch (e) {
      if (!data) setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const chartData = data
    ? data.categories.map(c => ({ name: c.category, count: c.count }))
    : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <FilterBar
        days={days}
        onDaysChange={(d) => setDays(d as DayFilter)}
        onRefresh={() => load(true)}
        loading={loading}
        title="Topics"
        subtitle={data ? `${data.total_messages.toLocaleString()} messages across ${data.categories.length} categories` : undefined}
      />

      <div className="flex-1 overflow-y-auto">
        {error && !data ? (
          <div className="p-5"><ErrorBlock message={error} onRetry={() => load(true)} /></div>
        ) : (
          <div className="p-5 flex flex-col gap-5">

            <SectionCard title="Message Categories" description={`Distribution over the last ${days} days`}>
              {loading && !data
                ? <ChartSkeleton />
                : data && data.categories.length > 0
                  ? <div className="px-4 pt-2 pb-2"><CategoryBarChart data={chartData} /></div>
                  : <EmptyState message="No data for the selected period." />}
            </SectionCard>

            <SectionCard title="Category Breakdown" description="Count and language split per category">
              {loading && !data ? (
                <div className="p-4 flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 rounded-[8px]" />
                  ))}
                </div>
              ) : data && data.categories.length > 0 ? (
                <div>
                  {data.categories.map((cat, i) => {
                    const pct = Math.round(cat.share * 100);
                    return (
                      <div key={cat.category}
                           className="px-5 py-4 flex items-center gap-4"
                           style={{ borderBottom: i < data.categories.length - 1 ? '1px solid var(--line)' : 'none' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink)' }}>
                              {cat.category}
                            </span>
                            <div className="flex items-center gap-3">
                              {Object.entries(cat.languages).map(([lang]) => (
                                <LangBadge key={lang} lang={lang} />
                              ))}
                              <span className="font-bold tabular-nums text-[13px]" style={{ color: 'var(--ink)' }}>
                                {cat.count.toLocaleString()}
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
              ) : (
                <EmptyState message="No data for the selected period." />
              )}
            </SectionCard>

          </div>
        )}
      </div>
    </div>
  );
}
