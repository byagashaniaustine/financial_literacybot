import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import type { FinancialUsersResponse, DayFilter } from '../types';
import { fetchFinancialUsers, bustFinancialCache, peekFinancialUsers, isFreshFinancialUsers } from '../api/financial';
import FilterBar from '../components/FilterBar';
import { LangBadge, CategoryBadge, Pagination, ErrorBlock, TableSkeleton, EmptyState } from '../components/UI';

const LIMIT = 50;

export default function FinancialUsersPage() {
  const [days, setDays]       = useState<DayFilter>(7);
  const [offset, setOffset]   = useState(0);
  const [data, setData]       = useState<FinancialUsersResponse | null>(() => peekFinancialUsers(7, LIMIT, 0));
  const [loading, setLoading] = useState(!peekFinancialUsers(7, LIMIT, 0));
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async (bust = false) => {
    if (bust) bustFinancialCache();
    else {
      const stale = peekFinancialUsers(days, LIMIT, offset);
      if (stale) setData(stale);
      if (isFreshFinancialUsers(days, LIMIT, offset)) return;
      if (!stale) setLoading(true);
    }
    setError(null);
    try {
      setData(await fetchFinancialUsers(days, LIMIT, offset));
    } catch (e) {
      if (!data) setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [days, offset]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleDaysChange = (d: DayFilter) => { setDays(d); setOffset(0); };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <FilterBar
        days={days}
        onDaysChange={handleDaysChange}
        onRefresh={() => load(true)}
        loading={loading}
        title="Users"
        subtitle={data ? `${data.total.toLocaleString()} active users` : undefined}
      />

      <div className="flex-1 overflow-y-auto">
        {error && !data ? (
          <div className="p-5"><ErrorBlock message={error} onRetry={() => load(true)} /></div>
        ) : (
          <div className="p-5">
            <div className="card overflow-hidden animate-fadeUp">
              {loading && !data ? (
                <TableSkeleton rows={8} />
              ) : !data || data.data.length === 0 ? (
                <EmptyState message="No users found for the selected period." />
              ) : (
                <>
                  {/* Table header */}
                  <div className="grid grid-cols-[1fr_80px_120px_160px_100px] gap-4 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.06em]"
                       style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink-3)' }}>
                    <span>User</span>
                    <span>Messages</span>
                    <span>Language</span>
                    <span>Top Category</span>
                    <span>Last Active</span>
                  </div>

                  {data.data.map((user, i) => (
                    <div key={user.user_key}
                         className="grid grid-cols-[1fr_80px_120px_160px_100px] gap-4 px-5 py-3.5 items-center"
                         style={{
                           borderBottom: i < data.data.length - 1 ? '1px solid var(--line)' : 'none',
                           background: 'var(--surface)',
                         }}
                         onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                         onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}>
                      <div>
                        <p className="font-mono text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
                          #{user.user_key}
                        </p>
                      </div>
                      <p className="font-bold tabular-nums text-[14px]" style={{ color: 'var(--ink)' }}>
                        {user.message_count}
                      </p>
                      <div>
                        <LangBadge lang={user.language} />
                      </div>
                      <div>
                        {user.categories_used[0]
                          ? <CategoryBadge category={user.categories_used[0]} />
                          : <span style={{ color: 'var(--ink-3)' }}>—</span>}
                      </div>
                      <p className="text-[12px] tabular-nums" style={{ color: 'var(--ink-3)' }}>
                        {format(new Date(user.last_active), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  ))}

                  <Pagination offset={offset} limit={LIMIT} total={data.total} onPage={setOffset} unit="users" />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
