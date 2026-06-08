import { useState, useEffect, useCallback } from 'react';
import type { FinancialQuestionsResponse, DayFilter } from '../types';
import { fetchFinancialQuestions, bustFinancialCache, peekFinancialQuestions, isFreshFinancialQuestions } from '../api/financial';
import FilterBar from '../components/FilterBar';
import { FinancialQuestionsTable } from '../components/QuestionsTable';
import { ErrorBlock, TableSkeleton } from '../components/UI';

const LIMIT = 50;

export default function FinancialQuestionsPage() {
  const [days, setDays]               = useState<DayFilter>(7);
  const [offset, setOffset]           = useState(0);
  const [langFilter, setLangFilter]   = useState('');
  const [catFilter, setCatFilter]     = useState('');
  const [data, setData]               = useState<FinancialQuestionsResponse | null>(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  const load = useCallback(async (bust = false) => {
    if (bust) bustFinancialCache();
    else {
      const stale = peekFinancialQuestions(days, LIMIT, offset, catFilter, langFilter);
      if (stale) setData(stale);
      if (isFreshFinancialQuestions(days, LIMIT, offset, catFilter, langFilter)) return;
      if (!stale) setLoading(true);
    }
    setError(null);
    try {
      setData(await fetchFinancialQuestions(days, LIMIT, offset, catFilter, langFilter));
    } catch (e) {
      if (!data) setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [days, offset, catFilter, langFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleDaysChange = (d: DayFilter) => { setDays(d); setOffset(0); };
  const handleLangFilter = (l: string)    => { setLangFilter(l); setOffset(0); };
  const handleCatFilter  = (c: string)    => { setCatFilter(c); setOffset(0); };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <FilterBar
        days={days}
        onDaysChange={handleDaysChange}
        onRefresh={() => load(true)}
        loading={loading}
        title="Questions"
        subtitle={data ? `${data.total.toLocaleString()} total questions` : undefined}
      />

      <div className="flex-1 overflow-y-auto">
        {error && !data ? (
          <div className="p-5"><ErrorBlock message={error} onRetry={() => load(true)} /></div>
        ) : (
          <div className="p-5">
            <div className="card overflow-hidden animate-fadeUp">
              {loading && !data
                ? <TableSkeleton rows={8} />
                : data
                  ? <FinancialQuestionsTable
                      data={data.data}
                      total={data.total}
                      offset={offset}
                      limit={LIMIT}
                      langFilter={langFilter}
                      categoryFilter={catFilter}
                      onLangFilter={handleLangFilter}
                      onCategoryFilter={handleCatFilter}
                      onPage={setOffset}
                    />
                  : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
