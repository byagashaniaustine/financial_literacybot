import { User } from 'lucide-react';
import { format } from 'date-fns';
import type { FinancialQuestion } from '../types';
import { LangBadge, CategoryBadge, Pagination, EmptyState } from './UI';

const PAGE = 50;

const LANG_OPTIONS = [
  { key: '',   label: 'All'       },
  { key: 'en', label: 'English'   },
  { key: 'sw', label: 'Kiswahili' },
];

const CAT_OPTIONS = [
  { key: '',                label: 'All'            },
  { key: 'loan_inquiry',    label: 'Loan Inquiry'   },
  { key: 'loan_calculation',label: 'Loan Calc'      },
  { key: 'interest_rates',  label: 'Interest'       },
  { key: 'savings',         label: 'Savings'        },
  { key: 'budgeting',       label: 'Budgeting'      },
  { key: 'investment',      label: 'Investment'     },
  { key: 'greeting',        label: 'Greeting'       },
  { key: 'general',         label: 'General'        },
];

interface Props {
  data: FinancialQuestion[];
  total: number;
  offset: number;
  limit?: number;
  langFilter: string;
  categoryFilter: string;
  onLangFilter: (lang: string) => void;
  onCategoryFilter: (cat: string) => void;
  onPage: (offset: number) => void;
}

export function FinancialQuestionsTable({
  data, total, offset, limit = PAGE,
  langFilter, categoryFilter,
  onLangFilter, onCategoryFilter, onPage,
}: Props) {
  return (
    <div>
      {/* Filters */}
      <div className="px-5 py-3 flex flex-wrap items-center gap-x-5 gap-y-2"
           style={{ borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--ink-3)' }}>Lang</span>
          <div className="flex flex-wrap gap-1.5">
            {LANG_OPTIONS.map((opt) => {
              const isActive = langFilter === opt.key;
              return (
                <button key={opt.key} type="button"
                        onClick={() => { onLangFilter(opt.key); onPage(0); }}
                        className="rounded-full text-[12px] font-semibold transition-all"
                        style={{
                          padding: '3px 10px',
                          background: isActive ? 'var(--accent)' : 'var(--surface)',
                          color: isActive ? '#fff' : 'var(--ink-2)',
                          border: `1px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                        }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: 'var(--ink-3)' }}>Category</span>
          <div className="flex flex-wrap gap-1.5">
            {CAT_OPTIONS.map((opt) => {
              const isActive = categoryFilter === opt.key;
              return (
                <button key={opt.key} type="button"
                        onClick={() => { onCategoryFilter(opt.key); onPage(0); }}
                        className="rounded-full text-[12px] font-semibold transition-all"
                        style={{
                          padding: '3px 10px',
                          background: isActive ? 'var(--accent)' : 'var(--surface)',
                          color: isActive ? '#fff' : 'var(--ink-2)',
                          border: `1px solid ${isActive ? 'var(--accent)' : 'var(--line)'}`,
                        }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState message="No questions found for the selected filters." />
      ) : (
        <>
          {data.map((q, i) => (
            <div key={q.id}
                 className="px-5 py-4 flex items-start gap-3 cursor-default"
                 style={{
                   borderBottom: i < data.length - 1 ? '1px solid var(--line)' : 'none',
                   background: 'var(--surface)',
                 }}
                 onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                 onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}>
              <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center flex-none mt-0.5"
                   style={{ background: 'var(--accent-soft)' }}>
                <User size={15} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold leading-snug line-clamp-2" style={{ color: 'var(--ink)' }}>
                  {q.question}
                </p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <CategoryBadge category={q.category} />
                  <LangBadge lang={q.language} />
                  <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--ink-3)' }}>
                    {format(new Date(q.askedAt), 'MMM d, HH:mm')}
                  </span>
                  <span className="text-[11px] font-mono" style={{ color: 'var(--ink-3)' }}>
                    #{q.user_key}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <Pagination offset={offset} limit={limit} total={total} onPage={onPage} unit="questions" />
        </>
      )}
    </div>
  );
}
