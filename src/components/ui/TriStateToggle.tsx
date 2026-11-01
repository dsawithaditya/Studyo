import React from 'react';
import type { TriStateStatus } from '../../types';

/**
 * Normalizes any value (boolean, string, nullish) into a valid TriStateStatus.
 * Backward compatibility:
 * - true / 'yes' / 'true' -> 'yes'
 * - false / 'no' / 'false' -> 'no'
 * - null / undefined / '' / 'na' -> 'na'
 */
export function normalizeTriState(val: unknown): TriStateStatus {
  if (val === 'yes' || val === true || val === 'true') return 'yes';
  if (val === 'no' || val === false || val === 'false') return 'no';
  return 'na';
}

/**
 * Cycles the state in the specified order:
 * N/A ➔ YES ➔ NO ➔ N/A
 */
export function cycleTriState(curr: unknown): TriStateStatus {
  const norm = normalizeTriState(curr);
  if (norm === 'na') return 'yes';
  if (norm === 'yes') return 'no';
  return 'na';
}

/**
 * Merges two tri-state values for sync / optimistic merge:
 * 'yes' beats 'no' beats 'na'.
 */
export function mergeTriState(a: unknown, b: unknown): TriStateStatus {
  const normA = normalizeTriState(a);
  const normB = normalizeTriState(b);
  if (normA === 'yes' || normB === 'yes') return 'yes';
  if (normA === 'no' || normB === 'no') return 'no';
  return 'na';
}

interface TriStateBadgeProps {
  value: unknown;
  onChange?: (next: TriStateStatus) => void;
  disabled?: boolean;
  cycleEnabled?: boolean;
  className?: string;
  title?: string;
}

/**
 * Compact Table Cell Badge & Cycle Button
 * When cycleEnabled: Cycles N/A ➔ YES ➔ NO ➔ N/A
 * When not cycleEnabled: Functions as static status badge (clicking does not cycle)
 * - YES: Vibrant emerald badge
 * - NO: Vibrant red/rose badge
 * - N/A: Muted neutral badge
 */
export const TriStateBadge: React.FC<TriStateBadgeProps> = ({
  value,
  onChange,
  disabled = false,
  cycleEnabled = false,
  className = '',
  title,
}) => {
  const status = normalizeTriState(value);

  const canCycle = !disabled && cycleEnabled && Boolean(onChange);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canCycle || !onChange) return;
    onChange(cycleTriState(status));
  };

  const getStyle = () => {
    switch (status) {
      case 'yes':
        return `bg-emerald-500/15 text-emerald-400 border-emerald-500/35 shadow-sm shadow-emerald-950/30 ${
          canCycle ? 'hover:bg-emerald-500/25 hover:border-emerald-400/50' : ''
        }`;
      case 'no':
        return `bg-red-500/15 text-red-400 border-red-500/35 shadow-sm shadow-red-950/30 ${
          canCycle ? 'hover:bg-red-500/25 hover:border-red-400/50' : ''
        }`;
      case 'na':
      default:
        return `bg-white/[0.04] text-stone-400 dark:text-stone-400 border-white/10 ${
          canCycle ? 'hover:bg-white/10 hover:text-stone-200 hover:border-white/20' : ''
        }`;
    }
  };

  const label = status === 'yes' ? 'YES' : status === 'no' ? 'NO' : 'N/A';
  const defaultTitle = canCycle
    ? `Status: ${label}. Click to cycle (N/A ➔ YES ➔ NO)`
    : `Status: ${label}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={title || defaultTitle}
      className={`px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-mono font-extrabold tracking-wider uppercase border transition-all duration-150 inline-flex items-center justify-center min-w-[58px] sm:min-w-[66px] select-none ${
        disabled
          ? 'cursor-default opacity-60'
          : canCycle
          ? 'cursor-pointer active:scale-95'
          : 'cursor-default'
      } ${getStyle()} ${className}`}
    >
      {label}
    </button>
  );
};

interface TriStatePillSelectProps {
  value: unknown;
  onChange: (val: TriStateStatus) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * 3-segment pill control for Modals & Forms:
 * [ YES | NO | N/A ]
 */
export const TriStatePillSelect: React.FC<TriStatePillSelectProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  const status = normalizeTriState(value);
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl font-mono select-none transition-all ${
        isSm ? 'text-xs gap-1' : 'text-xs sm:text-sm gap-1.5'
      } bg-stone-200/90 dark:bg-black/55 border border-stone-300 dark:border-white/12 shadow-inner w-full justify-between ${className}`}
    >
      {/* YES button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('yes')}
        className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold uppercase transition-all duration-150 cursor-pointer text-center ${
          status === 'yes'
            ? 'bg-emerald-500/20 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 dark:border-emerald-500/45 shadow-sm font-black'
            : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
      >
        YES
      </button>

      {/* NO button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('no')}
        className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold uppercase transition-all duration-150 cursor-pointer text-center ${
          status === 'no'
            ? 'bg-red-500/20 dark:bg-red-500/25 text-red-700 dark:text-red-400 border border-red-500/40 dark:border-red-500/45 shadow-sm font-black'
            : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
      >
        NO
      </button>

      {/* N/A button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange('na')}
        className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold uppercase transition-all duration-150 cursor-pointer text-center ${
          status === 'na'
            ? 'bg-stone-300/80 dark:bg-white/15 text-stone-900 dark:text-stone-200 border border-stone-400/50 dark:border-white/25 shadow-sm font-black'
            : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border border-transparent'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
      >
        N/A
      </button>
    </div>
  );
};
