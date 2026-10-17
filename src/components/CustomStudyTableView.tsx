import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStudyStore, getLocalTodayDateString } from '../store/useStudyStore';
import { 
  CustomStudyTable, 
  CustomTableColumn, 
  CustomTableColumnType, 
  CustomTableRow 
} from '../types';
import { ShinyButton } from './ui/shiny-button';
import { YesNoToggle } from './ui/YesNoToggle';
import {
  Plus,
  Trash2,
  Calendar,
  X,
  ArrowLeft,
  ArrowRight,
  Hash,
  Type,
  List,
  CheckSquare,
  Star
} from 'lucide-react';

interface CustomStudyTableViewProps {
  table: CustomStudyTable;
}

export const CustomStudyTableView: React.FC<CustomStudyTableViewProps> = ({ table }) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableSectionRef = useRef<HTMLDivElement>(null);

  const {
    addCustomTableRow,
    updateCustomTableCell,
    updateCustomTableRowNotes,
    deleteCustomTableRow,
    addCustomTableColumn,
    updateCustomTableColumn,
    deleteCustomTableColumn,
    reorderCustomTableColumns,
  } = useStudyStore();

  const todayStr = getLocalTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // UI state matching DailyStudyLog
  const [enableTopForm, setEnableTopForm] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return Math.min(window.innerWidth - 32, 1200);
    }
    return 800;
  });

  // Keep track of the visible width of the table container so the accordion fits perfectly without clipping
  useEffect(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    const updateWidth = () => {
      if (tableContainerRef.current) {
        setContainerWidth(tableContainerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        updateWidth();
      });
      ro.observe(el);
    }

    return () => {
      window.removeEventListener('resize', updateWidth);
      ro?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (tableContainerRef.current) {
      setContainerWidth(tableContainerRef.current.clientWidth);
    }
  }, [expandedDate]);

  // Filter & Pagination
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('all');
  const [visibleLimit, setVisibleLimit] = useState<number>(20);

  // Modals state
  const [showAddRowModal, setShowAddRowModal] = useState<boolean>(false);
  const [showAddColumnModal, setShowAddColumnModal] = useState<boolean>(false);

  // Column Editing Modal (click column header to configure)
  const [editingColumn, setEditingColumn] = useState<{
    id: string;
    name: string;
    type: CustomTableColumnType;
    unit: string;
    options: string;
    index: number;
  } | null>(null);

  // Top Quick Add / Edit Form State
  const [formDate, setFormDate] = useState(todayStr);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [formNotes, setFormNotes] = useState<string>('');

  // Accordion editing state for "expand in place"
  const [accordionState, setAccordionState] = useState<{
    rowId: string;
    date: string;
    values: Record<string, any>;
    notes: string;
  } | null>(null);

  // Add Column Form State
  const [newColName, setNewColName] = useState<string>('');
  const [newColType, setNewColType] = useState<CustomTableColumnType>('text');
  const [newColUnit, setNewColUnit] = useState<string>('');
  const [newColOptions, setNewColOptions] = useState<string>('');

  // Helper to format Date: "OCT 14" matching DailyStudyLog
  const formatDateDisplay = (dateStr: string) => {
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [y, m, d] = dateStr.split('-').map(Number);
      return `${months[m - 1]} ${String(d).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  // Available months extracted from rows
  const availableMonths = useMemo(() => {
    const setOfMonths = new Set<string>();
    table.rows.forEach((r) => {
      if (r.date && r.date.length >= 7) {
        setOfMonths.add(r.date.substring(0, 7));
      }
    });
    return Array.from(setOfMonths)
      .sort((a, b) => b.localeCompare(a))
      .map((ym) => {
        const [year, month] = ym.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, 1);
        return {
          value: ym,
          label: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        };
      });
  }, [table.rows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    const sorted = [...table.rows].sort((a, b) => b.date.localeCompare(a.date));
    if (selectedMonthYear === 'all') return sorted;
    if (selectedMonthYear === 'last30') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      return sorted.filter((r) => r.date >= cutoffStr);
    }
    return sorted.filter((r) => r.date.startsWith(selectedMonthYear));
  }, [table.rows, selectedMonthYear]);

  const visibleRows = filteredRows.slice(0, visibleLimit);

  // Toggle inline accordion
  const handleToggleExpand = (row: CustomTableRow) => {
    if (expandedDate === row.date) {
      setExpandedDate(null);
      setAccordionState(null);
    } else {
      setExpandedDate(row.date);
      setAccordionState({
        rowId: row.id,
        date: row.date,
        values: { ...(row.values || {}) },
        notes: row.notes || '',
      });
    }
  };

  // Populate top form
  const handleSelectDayForForm = (row?: CustomTableRow, targetDate?: string) => {
    const d = row ? row.date : targetDate || todayStr;
    const existing = row || table.rows.find((r) => r.date === d);

    setFormDate(d);
    if (existing) {
      setFormValues({ ...(existing.values || {}) });
      setFormNotes(existing.notes || '');
    } else {
      const initialVals: Record<string, any> = {};
      table.columns.forEach((col) => {
        if (col.type === 'boolean') initialVals[col.id] = false;
        else if (col.type === 'rating') initialVals[col.id] = 5;
        else initialVals[col.id] = '';
      });
      setFormValues(initialVals);
      setFormNotes('');
    }
    setShowForm(true);

    setTimeout(() => {
      document.getElementById('custom-table-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Save top form
  const handleSaveFormEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const existing = table.rows.find((r) => r.date === formDate);
    if (existing) {
      // Update existing row
      Object.entries(formValues).forEach(([colId, val]) => {
        updateCustomTableCell(table.id, existing.id, colId, val);
      });
      updateCustomTableRowNotes(table.id, existing.id, formNotes.trim());
    } else {
      // Add new row
      addCustomTableRow(table.id, formDate, formValues, formNotes.trim());
    }
    setShowForm(false);
  };

  // Save accordion full day edits
  const handleSaveAccordion = (rowId: string) => {
    if (!accordionState) return;
    Object.entries(accordionState.values).forEach(([colId, val]) => {
      updateCustomTableCell(table.id, rowId, colId, val === '' ? null : val);
    });
    updateCustomTableRowNotes(table.id, rowId, accordionState.notes.trim());
    setExpandedDate(null);
    setAccordionState(null);
  };

  // Delete row
  const handleDeleteRow = (rowId: string, date: string) => {
    if (window.confirm(`Delete entry for ${formatDateDisplay(date)}?`)) {
      deleteCustomTableRow(table.id, rowId);
      setExpandedDate(null);
      setAccordionState(null);
    }
  };

  // Quick Open Add Row Modal
  const handleOpenAddRowModal = () => {
    setFormDate(todayStr);
    const initialVals: Record<string, any> = {};
    table.columns.forEach((col) => {
      if (col.type === 'boolean') initialVals[col.id] = false;
      else if (col.type === 'rating') initialVals[col.id] = 5;
      else if (col.type === 'select' && col.options && col.options.length > 0) initialVals[col.id] = col.options[0];
      else initialVals[col.id] = '';
    });
    setFormValues(initialVals);
    setFormNotes('');
    setShowAddRowModal(true);
  };

  // Submit Add Row from Modal
  const handleSubmitAddRowModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDate) return;
    addCustomTableRow(table.id, formDate, formValues, formNotes.trim());
    setShowAddRowModal(false);
  };

  // Submit Add Column
  const handleSubmitAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    const opts =
      newColType === 'select'
        ? newColOptions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    addCustomTableColumn(table.id, {
      name: newColName.trim(),
      type: newColType,
      unit: newColUnit.trim() || undefined,
      options: opts && opts.length > 0 ? opts : (newColType === 'select' ? ['High', 'Normal', 'Low'] : undefined),
    });

    setNewColName('');
    setNewColType('text');
    setNewColUnit('');
    setNewColOptions('');
    setShowAddColumnModal(false);
  };

  // Save changes to existing custom column
  const handleSaveEditColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingColumn || !editingColumn.name.trim()) return;
    const opts =
      editingColumn.type === 'select'
        ? editingColumn.options
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    updateCustomTableColumn(table.id, editingColumn.id, {
      name: editingColumn.name.trim(),
      type: editingColumn.type,
      unit: editingColumn.unit.trim() || undefined,
      options: opts && opts.length > 0 ? opts : (editingColumn.type === 'select' ? ['High', 'Normal', 'Low'] : undefined),
    });
    setEditingColumn(null);
  };

  // Delete column
  const handleDeleteColumn = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" column and its tracked values in this table?`)) {
      deleteCustomTableColumn(table.id, id);
      setEditingColumn(null);
    }
  };

  // Move column left or right
  const handleMoveColumn = (currentIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= table.columns.length) return;
    reorderCustomTableColumns(table.id, currentIndex, targetIndex);
    if (editingColumn) {
      setEditingColumn({ ...editingColumn, index: targetIndex });
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 animate-fadeIn font-mono">
      {/* 1. Quick Add / Edit Form (Only shown when EDIT FORM switch is ON) */}
      {enableTopForm && showForm && (
        <div
          id="custom-table-form-container"
          className="w-full p-6 sm:p-8 rounded-2xl glass-panel-glow shadow-2xl space-y-6 animate-fadeIn"
        >
          {/* Form Top Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-stone-900 dark:text-white font-mono">
              Editing – {formatDateDisplay(formDate)}
            </h2>
          </div>

          <form onSubmit={handleSaveFormEntry} className="space-y-6">
            {/* Row 1: Date Picker */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <span className="text-stone-500 dark:text-slate-400 uppercase tracking-widest font-bold">DATE</span>
              <button
                type="button"
                onClick={() => handleSelectDayForForm(undefined, todayStr)}
                className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition cursor-pointer ${
                  formDate === todayStr
                    ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                    : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleSelectDayForForm(undefined, yesterdayStr)}
                className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition cursor-pointer ${
                  formDate === yesterdayStr
                    ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                    : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                Yesterday
              </button>
              <input
                type="date"
                value={formDate}
                onChange={(e) => handleSelectDayForForm(undefined, e.target.value)}
                className="glass-input rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none font-mono"
              />
            </div>

            {/* Dynamic Column Inputs in Top Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
              {table.columns.map((col) => (
                <div key={col.id} className="space-y-1.5 glass-panel p-3 rounded-xl">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                    {col.name} {col.unit ? `(${col.unit})` : ''}
                  </label>
                  {col.type === 'boolean' && (
                    <YesNoToggle
                      value={Boolean(formValues[col.id])}
                      onChange={(val: boolean) => setFormValues({ ...formValues, [col.id]: val })}
                    />
                  )}
                  {col.type === 'number' && (
                    <input
                      type="number"
                      step="any"
                      placeholder="--"
                      value={formValues[col.id] ?? ''}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      className="w-full glass-input rounded-lg px-3 py-2 text-stone-900 dark:text-white font-mono text-center focus:outline-none placeholder-stone-400 dark:placeholder-slate-600 font-bold"
                    />
                  )}
                  {col.type === 'text' && (
                    <input
                      type="text"
                      placeholder="Type text..."
                      value={formValues[col.id] ?? ''}
                      onChange={(e) =>
                        setFormValues({ ...formValues, [col.id]: e.target.value })
                      }
                      className="w-full glass-input rounded-lg px-3 py-2 text-stone-900 dark:text-white font-mono focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                    />
                  )}
                  {col.type === 'select' && (
                    <select
                      value={formValues[col.id] ?? ''}
                      onChange={(e) =>
                        setFormValues({ ...formValues, [col.id]: e.target.value })
                      }
                      className="w-full glass-input rounded-lg px-3 py-2 text-stone-900 dark:text-white font-mono focus:outline-none cursor-pointer"
                    >
                      <option value="" className="bg-[#f7f5f0] text-slate-500 dark:bg-[#141413] dark:text-slate-500">
                        -- Select --
                      </option>
                      {(col.options || []).map((opt) => (
                        <option key={opt} value={opt} className="bg-[#f7f5f0] text-stone-900 dark:bg-[#141413] dark:text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}
                  {col.type === 'rating' && (
                    <select
                      value={formValues[col.id] ?? ''}
                      onChange={(e) =>
                        setFormValues({ ...formValues, [col.id]: Number(e.target.value) })
                      }
                      className="w-full glass-input rounded-lg px-3 py-2 text-stone-900 dark:text-white font-mono focus:outline-none cursor-pointer text-center font-bold"
                    >
                      <option value="" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">-- Rating --</option>
                      <option value="5" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">5/5 (Mastered)</option>
                      <option value="4" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">4/5 (Good)</option>
                      <option value="3" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">3/5 (Average)</option>
                      <option value="2" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">2/5 (Weak)</option>
                      <option value="1" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">1/5 (Need Review)</option>
                    </select>
                  )}
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 block font-bold">
                NOTES &amp; OBSERVATIONS
              </label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Anything worth remembering about this day..."
                className="w-full glass-input rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* Form Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-full bg-black/5 dark:bg-[#141413] border border-black/10 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white text-xs uppercase font-bold tracking-wider transition cursor-pointer"
              >
                Cancel
              </button>
              <ShinyButton
                type="submit"
                label="Save"
                className="!px-7 !py-2.5 !text-xs !font-mono !font-extrabold !uppercase !tracking-wider active:scale-95 transition"
              />
            </div>
          </form>
        </div>
      )}

      {/* 2. Table Section (Exact same structure & CSS tokens as Study Log) */}
      <div className="space-y-4">
        {/* Table Top Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono pb-4 border-b border-white/10">
          <div className="select-none">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white transition tracking-tight uppercase font-mono">
              {table.title}
            </h1>
            {table.description && (
              <p className="text-xs text-stone-600 dark:text-slate-400 mt-1 font-mono">
                {table.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
            {/* Toggle to enable/disable Top Edit Form */}
            <div className="flex items-center gap-2.5 border-magic-bar px-4 py-2 rounded-full select-none">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">
                EDIT FORM:
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={enableTopForm}
                onClick={() => {
                  const next = !enableTopForm;
                  setEnableTopForm(next);
                  if (next) {
                    setShowForm(true);
                    handleSelectDayForForm(undefined, formDate || todayStr);
                  } else {
                    setShowForm(false);
                  }
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  enableTopForm
                    ? 'bg-[#e9762b] shadow-[0_0_10px_rgba(233,118,43,0.4)]'
                    : 'bg-[#e0d2c4] dark:bg-[#252524] border border-orange-950/15 dark:border-white/10'
                }`}
                title={enableTopForm ? 'Click to disable Top Edit Form' : 'Click to enable Top Edit Form'}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform ${
                    enableTopForm ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-mono font-bold uppercase ${enableTopForm ? 'text-[#e9762b]' : 'text-stone-600 dark:text-slate-500'}`}>
                {enableTopForm ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Month / Year Filter Dropdown */}
            <div className="flex items-center gap-2 border-magic-bar px-4 py-2 rounded-full">
              <span className="text-xs uppercase tracking-wider text-stone-600 dark:text-slate-400 font-bold">
                MONTH:
              </span>
              <select
                value={selectedMonthYear}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedMonthYear(val);
                  setVisibleLimit(val === 'last30' ? 30 : 20);
                }}
                className="bg-transparent text-xs sm:text-sm text-stone-900 dark:text-white focus:outline-none font-bold uppercase cursor-pointer font-mono"
              >
                <option value="all" className="bg-[#fff9f5] text-stone-900 dark:bg-[#141413] dark:text-white">ALL MONTHS</option>
                <option value="last30" className="bg-[#fff9f5] text-stone-900 dark:bg-[#141413] dark:text-white">LAST 30 DAYS</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value} className="bg-[#fff9f5] text-stone-900 dark:bg-[#141413] dark:text-white">
                    {m.label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* + ROW Button */}
            <button
              type="button"
              onClick={handleOpenAddRowModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full glass-pill hover:bg-[#e9762b] text-stone-700 dark:text-slate-200 hover:text-black text-xs font-bold uppercase tracking-wider transition border border-orange-950/15 dark:border-white/10 hover:border-[#e9762b] cursor-pointer shadow-sm font-mono active:scale-95"
              title="Add a date row"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ROW</span>
            </button>

            {/* + COLUMN Button at top right */}
            <button
              type="button"
              onClick={() => setShowAddColumnModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full glass-pill hover:bg-[#e9762b] text-stone-700 dark:text-slate-200 hover:text-black text-xs font-bold uppercase tracking-wider transition border border-orange-950/15 dark:border-white/10 hover:border-[#e9762b] cursor-pointer shadow-sm font-mono active:scale-95"
              title="Add a custom column"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>COLUMN</span>
            </button>
          </div>
        </div>

        {/* Table Container with Sticky Horizontal & Vertical Scroll (Exact same classes as Study Log) */}
        <div ref={tableSectionRef} className="w-full rounded-2xl glass-panel overflow-hidden font-mono shadow-2xl scroll-mt-24">
          <div ref={tableContainerRef} className="overflow-x-auto max-h-[80vh] overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/20">
            <table className="w-full min-w-full text-left text-xs sm:text-sm border-separate border-spacing-0">
              {/* Sticky Top Header */}
              <thead className="sticky top-0 z-40 glass-table-header select-none">
                <tr className="text-xs text-stone-800 dark:text-slate-200 uppercase tracking-widest font-bold">
                  {/* Sticky Date Column Header */}
                  <th className="py-3.5 px-3 sm:px-4 font-bold sticky left-0 top-0 z-50 glass-sticky-th border-r border-white/12 min-w-[110px] w-[110px] sm:min-w-[125px] sm:w-[125px]">
                    DATE
                  </th>

                  {/* Dynamic Custom Column Headers */}
                  {table.columns.map((col, idx) => (
                    <th
                      key={col.id}
                      className="py-3.5 px-3 sm:px-4 font-bold text-center whitespace-nowrap sticky top-0 z-40 min-w-[80px] sm:min-w-[96px]"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setEditingColumn({
                            id: col.id,
                            name: col.name,
                            type: col.type,
                            unit: col.unit || '',
                            options: (col.options || []).join(', '),
                            index: idx,
                          });
                        }}
                        className="text-xs uppercase tracking-wider font-bold text-stone-800 dark:text-slate-200 hover:text-[#e9762b] truncate max-w-[140px] cursor-pointer transition select-none font-mono"
                        title={`Click to edit "${col.name}" column`}
                      >
                        {col.name} {col.unit ? `(${col.unit})` : ''}
                      </button>
                    </th>
                  ))}

                  {/* NOTES Column - Rightmost Header with rounded corner */}
                  <th className="py-3.5 px-3 sm:px-4 font-bold text-center sticky top-0 z-40 min-w-[90px] sm:min-w-[110px] rounded-tr-xl">
                    NOTES
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {visibleRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={table.columns.length + 2}
                      className="py-12 text-center text-slate-500 font-mono text-xs"
                    >
                      NO ROWS RECORDED FOR THIS PERIOD.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((entry) => {
                    const isExpanded = expandedDate === entry.date;
                    const hasNote = Boolean(entry.notes && entry.notes.trim().length > 0);

                    return (
                      <React.Fragment key={entry.id}>
                        <tr
                          className={`hover:bg-white/[0.04] transition group/row ${
                            isExpanded ? 'bg-white/[0.04]' : ''
                          }`}
                        >
                          {/* Pinned / Sticky Date Column - Exact same orange badge button as in Study Table */}
                          <td
                            className={`py-3 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap sticky left-0 z-20 glass-sticky-col-cell border-r border-black/10 dark:border-white/10 min-w-[110px] w-[110px] sm:min-w-[125px] sm:w-[125px] ${
                              isExpanded ? '!bg-amber-500/15 dark:!bg-[#1a1a18]' : ''
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleExpand(entry)}
                                className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer select-none font-mono ${
                                  isExpanded
                                    ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                                    : 'text-[#e9762b] bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50'
                                }`}
                                title="Click date to open details & edit"
                              >
                                <span>{formatDateDisplay(entry.date)}</span>
                              </button>
                            </div>
                          </td>

                          {/* Dynamic Custom Column Cells */}
                          {table.columns.map((col) => {
                            const val = entry.values?.[col.id];

                            return (
                              <td
                                key={col.id}
                                className="py-3 sm:py-3.5 px-3 sm:px-4 text-center whitespace-nowrap font-mono text-xs sm:text-sm min-w-[80px] sm:min-w-[96px]"
                              >
                                {col.type === 'boolean' && (
                                  <button
                                    type="button"
                                    disabled={!enableTopForm}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!enableTopForm) return;
                                      updateCustomTableCell(table.id, entry.id, col.id, !val);
                                    }}
                                    className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide transition-all select-none ${
                                      enableTopForm ? 'cursor-pointer active:scale-95' : 'cursor-default'
                                    } ${
                                      val
                                        ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-600/40 dark:border-emerald-500/40 shadow-xs shadow-emerald-500/20 font-extrabold'
                                        : enableTopForm
                                          ? 'bg-stone-200/80 dark:bg-white/5 text-stone-700 dark:text-slate-400 border border-stone-300/80 dark:border-white/10 hover:border-stone-400 hover:text-stone-900 dark:hover:border-white/20 dark:hover:text-slate-300 font-bold'
                                          : 'bg-stone-200/60 dark:bg-white/5 text-stone-600 dark:text-slate-500 border border-stone-300/60 dark:border-white/5 font-bold'
                                    }`}
                                    title={enableTopForm ? `Click to toggle ${col.name}` : "Enable 'EDIT FORM' switch or click date button to edit"}
                                  >
                                    {val ? 'YES' : 'NO'}
                                  </button>
                                )}

                                {col.type === 'number' && (
                                  val !== undefined && val !== null && val !== '' ? (
                                    <span className="text-stone-900 dark:text-white font-mono font-bold text-xs sm:text-sm">
                                      {val}{col.unit ? col.unit : ''}
                                    </span>
                                  ) : (
                                    <span className="text-stone-400 dark:text-slate-600 font-mono text-xs sm:text-sm">--</span>
                                  )
                                )}

                                {col.type === 'text' && (
                                  val && String(val).trim() ? (
                                    <span
                                      className="text-stone-800 dark:text-slate-200 text-xs sm:text-sm max-w-[140px] truncate inline-block font-medium"
                                      title={String(val)}
                                    >
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-stone-400 dark:text-slate-600 font-mono text-xs sm:text-sm">--</span>
                                  )
                                )}

                                {col.type === 'select' && (
                                  val && String(val).trim() ? (
                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-500/40 dark:border-amber-500/30">
                                      {val}
                                    </span>
                                  ) : (
                                    <span className="text-stone-400 dark:text-slate-600 font-mono text-xs sm:text-sm">--</span>
                                  )
                                )}

                                {col.type === 'rating' && (
                                  val !== undefined && val !== null && Number(val) > 0 ? (
                                    <span className="text-stone-900 dark:text-slate-200 font-mono font-bold text-xs sm:text-sm">
                                      {val}/5
                                    </span>
                                  ) : (
                                    <span className="text-stone-400 dark:text-slate-600 font-mono text-xs sm:text-sm">--</span>
                                  )
                                )}
                              </td>
                            );
                          })}

                          {/* NOTES Column with Rich Tooltip (Exact same Note badge as Study Table) */}
                          <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center min-w-[90px] sm:min-w-[110px]">
                            {hasNote ? (
                              <div className="relative inline-flex items-center justify-center group/note">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold text-orange-950 dark:text-[#e9762b] bg-orange-500/20 dark:bg-orange-500/15 border border-orange-500/40 dark:border-orange-500/30 select-none">
                                  Note
                                </span>

                                {/* Hover Tooltip */}
                                <div className="opacity-0 group-hover/note:opacity-100 pointer-events-none transition-opacity duration-200 absolute bottom-full mb-2 z-40 left-1/2 -translate-x-1/2 glass-modal text-xs px-3.5 py-2 rounded-xl shadow-2xl max-w-sm min-w-[200px] text-left whitespace-normal font-sans">
                                  <span className="text-[10px] text-[#e9762b] uppercase font-bold tracking-wider block mb-1 font-mono">
                                    {formatDateDisplay(entry.date)} Note:
                                  </span>
                                  <p className="text-stone-900 dark:text-slate-200 text-xs leading-relaxed break-words">
                                    {entry.notes}
                                  </p>
                                  <div className="w-2 h-2 glass-modal border-r border-b border-white/20 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-stone-400 dark:text-slate-600 font-mono text-xs">--</span>
                            )}
                          </td>
                        </tr>

                        {/* Expand in place accordion sub-panel (Exact same design & layout as Study Table) */}
                        {isExpanded && accordionState && (
                          <tr
                            className="bg-white/[0.02] backdrop-blur-2xl border-b border-white/10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <td colSpan={table.columns.length + 2} className="p-0 border-b border-white/10">
                              <div
                                className="sticky left-0 p-3.5 sm:p-5 md:p-6 space-y-4 sm:space-y-5 box-border overflow-hidden"
                                style={{
                                  width: containerWidth ? `${containerWidth}px` : '100%',
                                  maxWidth: containerWidth ? `${containerWidth}px` : '100%',
                                }}
                              >
                                {/* Accordion Top Header with Delete Button */}
                                <div className="flex items-center justify-between border-b border-white/10 pb-3 gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[11px] font-mono uppercase tracking-widest text-[#e9762b] font-bold shrink-0">
                                      DETAILS &amp; EDITING —
                                    </span>
                                    <span className="text-sm font-bold text-stone-900 dark:text-white font-mono truncate">
                                      {formatDateDisplay(entry.date)}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(entry.id, entry.date)}
                                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-xs font-mono font-bold transition cursor-pointer"
                                    title="Delete this row"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                    <span>DELETE ROW</span>
                                  </button>
                                </div>

                                {/* Form Inputs for Columns */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono">
                                  {table.columns.map((col) => (
                                    <div key={col.id} className="glass-panel p-3 rounded-xl space-y-1.5">
                                      <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                                        {col.name} {col.unit ? `(${col.unit})` : ''}
                                      </label>
                                      {col.type === 'boolean' && (
                                        <YesNoToggle
                                          size="sm"
                                          value={Boolean(accordionState.values[col.id])}
                                          onChange={(val: boolean) =>
                                            setAccordionState({
                                              ...accordionState,
                                              values: { ...accordionState.values, [col.id]: val },
                                            })
                                          }
                                        />
                                      )}
                                      {col.type === 'number' && (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            step="any"
                                            placeholder="--"
                                            value={accordionState.values[col.id] ?? ''}
                                            onChange={(e) =>
                                              setAccordionState({
                                                ...accordionState,
                                                values: {
                                                  ...accordionState.values,
                                                  [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                                },
                                              })
                                            }
                                            className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-stone-900 dark:text-white font-bold text-center focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                                          />
                                          {col.unit && (
                                            <span className="text-xs text-stone-600 dark:text-slate-400 font-bold lowercase">
                                              {col.unit}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {col.type === 'text' && (
                                        <input
                                          type="text"
                                          placeholder="Type text..."
                                          value={accordionState.values[col.id] ?? ''}
                                          onChange={(e) =>
                                            setAccordionState({
                                              ...accordionState,
                                              values: {
                                                ...accordionState.values,
                                                [col.id]: e.target.value,
                                              },
                                            })
                                          }
                                          className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                                        />
                                      )}
                                      {col.type === 'select' && (
                                        <select
                                          value={accordionState.values[col.id] ?? ''}
                                          onChange={(e) =>
                                            setAccordionState({
                                              ...accordionState,
                                              values: {
                                                ...accordionState.values,
                                                [col.id]: e.target.value,
                                              },
                                            })
                                          }
                                          className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                                        >
                                          <option value="" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">-- Select --</option>
                                          {(col.options || []).map((opt) => (
                                            <option key={opt} value={opt} className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">
                                              {opt}
                                            </option>
                                          ))}
                                        </select>
                                      )}
                                      {col.type === 'rating' && (
                                        <select
                                          value={accordionState.values[col.id] ?? ''}
                                          onChange={(e) =>
                                            setAccordionState({
                                              ...accordionState,
                                              values: {
                                                ...accordionState.values,
                                                [col.id]: Number(e.target.value),
                                              },
                                            })
                                          }
                                          className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-white font-bold text-center focus:outline-none cursor-pointer"
                                        >
                                          <option value="" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">-- Rating --</option>
                                          <option value="5" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">5/5 (Mastered)</option>
                                          <option value="4" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">4/5 (Good)</option>
                                          <option value="3" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">3/5 (Average)</option>
                                          <option value="2" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">2/5 (Weak)</option>
                                          <option value="1" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">1/5 (Need Review)</option>
                                        </select>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Notes Input */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                                    NOTES
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={accordionState.notes}
                                    onChange={(e) =>
                                      setAccordionState({
                                        ...accordionState,
                                        notes: e.target.value,
                                      })
                                    }
                                    placeholder="Key takeaways, mistakes made, or formulas to review..."
                                    className="w-full glass-input rounded-xl px-4 py-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
                                  />
                                </div>

                                {/* Accordion Footer Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExpandedDate(null);
                                      setAccordionState(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-stone-200/90 hover:bg-stone-300 dark:bg-white/5 dark:hover:bg-white/10 text-stone-700 dark:text-slate-400 hover:text-black dark:hover:text-white border border-stone-300/80 dark:border-white/10 uppercase font-bold text-xs transition cursor-pointer shadow-sm"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveAccordion(entry.id)}
                                    className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20"
                                  >
                                    Save Day
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="py-2.5 px-4 border-t border-white/10 flex items-center justify-end text-[10px] text-slate-500 font-mono">
            <span>{visibleRows.length} OF {table.rows.length} ROWS DISPLAYED</span>
          </div>
        </div>
      </div>

      {/* 3. Modal: Add Date Row */}
      {showAddRowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-modal rounded-2xl p-6 sm:p-8 space-y-6 border border-orange-950/15 dark:border-white/15 shadow-2xl font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-orange-950/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#e9762b]" />
                <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-wide uppercase">
                  Add Date Row
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRowModal(false)}
                className="p-1 rounded-full hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddRowModal} className="space-y-5">
              {/* Date Selector */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  DATE
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDate(todayStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs uppercase font-bold transition cursor-pointer ${
                      formDate === todayStr
                        ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/20'
                        : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDate(yesterdayStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs uppercase font-bold transition cursor-pointer ${
                      formDate === yesterdayStr
                        ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/20'
                        : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                    }`}
                  >
                    Yesterday
                  </button>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="glass-input rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none flex-1 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Column Inputs */}
              <div className="space-y-4 pt-2 border-t border-orange-950/10 dark:border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  Column Values
                </span>

                {table.columns.length === 0 ? (
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    No custom columns in this table yet. Click &quot;COLUMN&quot; at the top to add tracking fields.
                  </p>
                ) : (
                  table.columns.map((col) => (
                    <div key={col.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-stone-700 dark:text-slate-300 uppercase tracking-wider font-bold">
                          {col.name}
                        </label>
                        {col.unit && (
                          <span className="text-[10px] text-[#e9762b] font-mono lowercase font-bold">
                            {col.unit}
                          </span>
                        )}
                      </div>

                      {col.type === 'boolean' && (
                        <YesNoToggle
                          value={Boolean(formValues[col.id])}
                          onChange={(val: boolean) => setFormValues({ ...formValues, [col.id]: val })}
                        />
                      )}

                      {col.type === 'number' && (
                        <input
                          type="number"
                          step="any"
                          value={formValues[col.id] ?? ''}
                          onChange={(e) =>
                            setFormValues({
                              ...formValues,
                              [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                            })
                          }
                          placeholder={`Enter ${col.name}...`}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#e9762b] placeholder-stone-400 dark:placeholder-slate-600"
                        />
                      )}

                      {col.type === 'text' && (
                        <input
                          type="text"
                          value={formValues[col.id] ?? ''}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [col.id]: e.target.value })
                          }
                          placeholder={`Enter ${col.name}...`}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#e9762b] placeholder-stone-400 dark:placeholder-slate-600"
                        />
                      )}

                      {col.type === 'select' && (
                        <select
                          value={formValues[col.id] ?? ''}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [col.id]: e.target.value })
                          }
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#e9762b] cursor-pointer"
                        >
                          <option value="" className="bg-[#f7f5f0] text-slate-500 dark:bg-[#141413] dark:text-slate-500">
                            -- Select Option --
                          </option>
                          {(col.options || []).map((opt) => (
                            <option key={opt} value={opt} className="bg-[#f7f5f0] text-stone-900 dark:bg-[#141413] dark:text-white">
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {col.type === 'rating' && (
                        <select
                          value={formValues[col.id] ?? ''}
                          onChange={(e) =>
                            setFormValues({ ...formValues, [col.id]: Number(e.target.value) })
                          }
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#e9762b] cursor-pointer font-bold text-center"
                        >
                          <option value="" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">-- Rating --</option>
                          <option value="5" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">5/5 (Mastered)</option>
                          <option value="4" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">4/5 (Good)</option>
                          <option value="3" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">3/5 (Average)</option>
                          <option value="2" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">2/5 (Weak)</option>
                          <option value="1" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">1/5 (Need Review)</option>
                        </select>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5 pt-2 border-t border-orange-950/10 dark:border-white/10">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  NOTES &amp; OBSERVATIONS
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Key learnings, question breakdown, or reminders..."
                  className="w-full glass-input rounded-xl p-3 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-950/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddRowModal(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-300 dark:border-white/10 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white text-xs uppercase font-bold tracking-wider transition cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <ShinyButton
                  type="submit"
                  label="Add Row"
                  className="!px-6 !py-2.5 !text-xs !font-mono !font-extrabold !uppercase !tracking-wider"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Add New Column */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-modal rounded-2xl p-6 sm:p-8 space-y-6 border border-orange-950/15 dark:border-white/15 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-orange-950/10 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#e9762b]" />
                <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-wide uppercase">
                  Add Column
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddColumnModal(false)}
                className="p-1 rounded-full hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddColumn} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  COLUMN NAME
                </label>
                <input
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Accuracy %, Difficulty, Solved"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  DATA TYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'boolean' as CustomTableColumnType, label: 'YES / NO', desc: 'Clickable Yes/No pill' },
                    { type: 'number' as CustomTableColumnType, label: 'NUMBER', desc: 'Numeric value input' },
                    { type: 'text' as CustomTableColumnType, label: 'SHORT TEXT', desc: 'Free text entry' },
                    { type: 'select' as CustomTableColumnType, label: 'DROPDOWN', desc: 'Custom options list' },
                    { type: 'rating' as CustomTableColumnType, label: 'RATING', desc: '1 to 5 score' },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setNewColType(item.type)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                        newColType === item.type
                          ? 'bg-orange-500/10 border-[#e9762b] shadow-sm shadow-orange-500/20'
                          : 'glass-panel border-stone-200 dark:border-white/10 text-stone-700 dark:text-slate-300 hover:border-stone-400 dark:hover:border-white/20'
                      }`}
                    >
                      <span className="font-bold text-stone-900 dark:text-white text-[11px] mb-1">{item.label}</span>
                      <span className="text-[10px] text-stone-500 dark:text-slate-400">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {newColType === 'number' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                    UNIT (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={newColUnit}
                    onChange={(e) => setNewColUnit(e.target.value)}
                    placeholder="e.g. %, marks, hrs, mins, count"
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                  />
                </div>
              )}

              {newColType === 'select' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                    OPTIONS (COMMA-SEPARATED)
                  </label>
                  <input
                    type="text"
                    value={newColOptions}
                    onChange={(e) => setNewColOptions(e.target.value)}
                    placeholder="e.g. High, Normal, Low"
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-orange-950/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-300 dark:border-white/10 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white text-xs uppercase font-bold tracking-wider transition cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <ShinyButton
                  type="submit"
                  label="Create Column"
                  className="!px-6 !py-2.5 !text-xs !font-mono !font-extrabold !uppercase !tracking-wider"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Column Configuration & Reordering (Opened when clicking Column Header) */}
      {editingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl font-mono space-y-6">
            <div className="flex items-center justify-between border-b border-orange-950/10 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-stone-900 dark:text-white uppercase tracking-tight">
                Configure Column
              </h3>
              <button
                type="button"
                onClick={() => setEditingColumn(null)}
                className="p-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditColumn} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  COLUMN NAME
                </label>
                <input
                  type="text"
                  required
                  value={editingColumn.name}
                  onChange={(e) =>
                    setEditingColumn({ ...editingColumn, name: e.target.value })
                  }
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  COLUMN TYPE
                </label>
                <select
                  value={editingColumn.type}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      type: e.target.value as CustomTableColumnType,
                    })
                  }
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="boolean" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">YES / NO</option>
                  <option value="number" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">NUMBER</option>
                  <option value="text" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">SHORT TEXT</option>
                  <option value="select" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">DROPDOWN</option>
                  <option value="rating" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">RATING (1-5)</option>
                </select>
              </div>

              {editingColumn.type === 'number' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                    UNIT (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={editingColumn.unit}
                    onChange={(e) =>
                      setEditingColumn({ ...editingColumn, unit: e.target.value })
                    }
                    placeholder="e.g. %, marks, hrs"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {editingColumn.type === 'select' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                    OPTIONS (COMMA SEPARATED)
                  </label>
                  <input
                    type="text"
                    value={editingColumn.options}
                    onChange={(e) =>
                      setEditingColumn({ ...editingColumn, options: e.target.value })
                    }
                    placeholder="e.g. High, Normal, Low"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {/* Position Reordering */}
              <div className="space-y-1.5 pt-2 border-t border-orange-950/10 dark:border-white/10">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  POSITION
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={editingColumn.index === 0}
                    onClick={() => handleMoveColumn(editingColumn.index, 'left')}
                    className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stone-200/90 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 disabled:opacity-30 text-stone-700 dark:text-slate-300 text-xs font-bold uppercase transition cursor-pointer border border-stone-300/80 dark:border-white/10"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Move Left</span>
                  </button>
                  <button
                    type="button"
                    disabled={editingColumn.index === table.columns.length - 1}
                    onClick={() => handleMoveColumn(editingColumn.index, 'right')}
                    className="inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-stone-200/90 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 disabled:opacity-30 text-stone-700 dark:text-slate-300 text-xs font-bold uppercase transition cursor-pointer border border-stone-300/80 dark:border-white/10"
                  >
                    <span>Move Right</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Column */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(editingColumn.id, editingColumn.name)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 border border-red-500/30 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Column</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-950/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingColumn(null)}
                  className="px-4 py-2 rounded-lg bg-stone-200/90 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 text-stone-700 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white uppercase font-bold text-xs transition cursor-pointer border border-stone-300/80 dark:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
