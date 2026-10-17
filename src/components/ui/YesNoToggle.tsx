import React from 'react';

interface YesNoToggleProps {
  value: boolean;
  onChange: (val: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const YesNoToggle: React.FC<YesNoToggleProps> = ({
  value,
  onChange,
  size = 'md',
  disabled = false,
}) => {
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl font-mono select-none transition-all ${
        isSm ? 'text-[11px] gap-1' : 'text-xs gap-1.5'
      } bg-stone-200/80 dark:bg-black/50 border border-stone-300 dark:border-white/10 shadow-inner w-full justify-between`}
    >
      {/* YES button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`flex-1 py-1 px-2.5 rounded-lg font-extrabold uppercase transition-all duration-200 cursor-pointer text-center ${
          value
            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-md shadow-emerald-600/30 font-black'
            : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-300/60 dark:hover:bg-white/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
      >
        YES
      </button>

      {/* NO button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`flex-1 py-1 px-2.5 rounded-lg font-bold uppercase transition-all duration-200 cursor-pointer text-center ${
          !value
            ? 'bg-stone-400/90 text-stone-900 dark:bg-white/20 dark:text-white shadow-sm font-extrabold'
            : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-300/60 dark:hover:bg-white/5'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
      >
        NO
      </button>
    </div>
  );
};
