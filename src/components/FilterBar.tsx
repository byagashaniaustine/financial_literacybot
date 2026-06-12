import { RefreshCw, Menu } from 'lucide-react';
import { useContext } from 'react';
import type { DayFilter } from '../types';
import { AppContext } from '../context';

interface Props {
  days: DayFilter;
  onDaysChange: (d: DayFilter) => void;
  onRefresh: () => void;
  loading: boolean;
  title: string;
  subtitle?: string;
}

const OPTIONS: { label: string; value: DayFilter }[] = [
  { label: '7d',  value: 7  },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

export default function FilterBar({ days, onDaysChange, onRefresh, loading, title, subtitle }: Props) {
  const { openSidebar } = useContext(AppContext);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-4 px-3 sm:px-4 md:px-5 py-3 flex-shrink-0"
         style={{ background: 'var(--surface)', borderBottom: '1px solid var(--line)' }}>

      {/* Row 1 (mobile): hamburger + title + refresh */}
      <div className="flex items-center gap-3 min-w-0">
        <button type="button" onClick={openSidebar} aria-label="Open sidebar"
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[8px] flex-none"
                style={{ border: '1px solid var(--line)', color: 'var(--ink-3)' }}>
          <Menu size={17} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-extrabold text-[18px] md:text-[19px] lg:text-[20px] tracking-tight leading-none truncate"
              style={{ color: 'var(--ink)' }}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] sm:text-[12px] font-medium mt-[3px] truncate" style={{ color: 'var(--ink-3)' }}>{subtitle}</p>
          )}
        </div>

        {/* Refresh — visible only on mobile */}
        <button type="button" onClick={onRefresh} disabled={loading} aria-label="Refresh"
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-[8px] disabled:opacity-40 flex-none"
                style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-3)' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Row 2 (mobile) / end of row (desktop): day filter tabs + desktop refresh */}
      <div className="flex items-center gap-3 lg:flex-none">
        <div className="flex items-center gap-[3px] p-[3px] rounded-[8px]"
             style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
          {OPTIONS.map((opt) => {
            const isActive = days === opt.value;
            return (
              <button key={String(opt.value)} type="button" onClick={() => onDaysChange(opt.value)}
                      className="rounded-[6px] text-[12px] lg:text-[13px] font-semibold transition-all duration-150"
                      style={{
                        height: '30px', padding: '0 10px', border: 'none', cursor: 'pointer',
                        background: isActive ? 'var(--surface)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--ink-3)',
                        boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      }}>
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Refresh — visible only on desktop */}
        <button type="button" onClick={onRefresh} disabled={loading} aria-label="Refresh"
                className="hidden lg:flex w-9 h-9 items-center justify-center rounded-[8px] disabled:opacity-40"
                style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink-3)' }}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
