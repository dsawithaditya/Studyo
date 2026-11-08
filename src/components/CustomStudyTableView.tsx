import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStudyStore, getLocalTodayDateString, getLocalDateString } from '../store/useStudyStore';
import {
  CustomStudyTable,
  CustomTableColumn,
  CustomTableColumnType,
  CustomTableRow
} from '../types';
import {
  Plus,
  Search,
  Settings2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  X,
  Check,
  Trash2,
  Edit3,
  MoreVertical,
  Download,
  Columns,
  Eye,
  EyeOff,
  Sparkles,
  BarChart3,
  FileText,
  Copy,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Table2,
  Layers,
  LayoutGrid,
  ArrowLeft,
  Star,
  CheckSquare,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TriStateBadge, TriStatePillSelect, normalizeTriState } from './ui/TriStateToggle';

interface CustomStudyTableViewProps {
  table: CustomStudyTable;
}

// Helper: Format date like "Oct 25" matching the screenshot design
const formatDateDisplay = (dateStr: string) => {
  try {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const [, m, d] = dateStr.split('-').map(Number);
    if (!m || !d) return dateStr;
    return `${months[m - 1]} ${String(d).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
};

// Helper: Format column header with unit without duplicating units like (%) (%)
export const formatColumnHeader = (name: string, unit?: string) => {
  if (!name) return '';
  const cleanUnit = (unit || '').replace(/[()]/g, '').trim();

  // Strip all repeated occurrences of (%) or ( % ) with or without spaces
  let baseName = name.replace(/(\s*\(\s*%\s*\))+/gi, ' ').trim();

  if (cleanUnit) {
    const escaped = cleanUnit.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const duplicateUnitRegex = new RegExp(`(\\s*\\(\\s*${escaped}\\s*\\))+`, 'gi');
    baseName = baseName.replace(duplicateUnitRegex, ' ').trim();
    return `${baseName} (${cleanUnit})`;
  }

  // If no unit provided, but original name had (%), preserve exactly one (%)
  if (/(\s*\(\s*%\s*\))/i.test(name)) {
    return `${baseName} (%)`;
  }

  return baseName;
};

export const CustomStudyTableView: React.FC<CustomStudyTableViewProps> = ({ table }) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const scrollToCenterTable = () => {
    if (!tableContainerRef.current) return;
    const rect = tableContainerRef.current.getBoundingClientRect();
    const tableHeight = rect.height;
    const windowHeight = window.innerHeight;
    const targetY = rect.top + window.scrollY;
    const centerScrollY =
      tableHeight < windowHeight
        ? targetY - (windowHeight - tableHeight) / 2
        : targetY - 24;
    window.scrollTo({ top: Math.max(0, centerScrollY), behavior: 'smooth' });
  };

  const {
    addCustomTableRow,
    updateCustomTableCell,
    updateCustomTableRowNotes,
    deleteCustomTableRow,
    addCustomTableColumn,
    updateCustomTableColumn,
    deleteCustomTableColumn,
    reorderCustomTableColumns,
    updateCustomTable,
    setCustomTableAutoGenerateRows,
    ensureCustomTableTodayRow,
    deleteCustomTable,
    setActiveTableId,
    autoGenerateRows = true,
    showSortArrows,
    setShowSortArrows,
    enableClickToCycle = false,
    setEnableClickToCycle,
    theme,
  } = useStudyStore();

  const isDark = theme !== 'light';

  const todayStr = getLocalTodayDateString();
  const isTableAutoGen = table.autoGenerateRows ?? (table.id === 'tbl-check-demo' || table.id === 'tbl-check' ? false : autoGenerateRows);

  useEffect(() => {
    if (isTableAutoGen) {
      ensureCustomTableTodayRow(table.id);
    }
  }, [table.id, isTableAutoGen, ensureCustomTableTodayRow]);

  // 1. Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc',
  });

  // 2. Modals & Popovers
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [isFullTableView, setIsFullTableView] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'all' | 'columns' | 'meta' | 'display' | 'export' | 'danger'>('all');
  const customSettingsTabsRef = useRef<HTMLDivElement>(null);
  const scrollCustomSettingsTabs = (direction: 'left' | 'right') => {
    if (customSettingsTabsRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      customSettingsTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const [activeActionMenuRowId, setActiveActionMenuRowId] = useState<string | null>(null);

  // 3. Hidden Column IDs for user visibility toggles
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);

  // 4. In-line Accordion Row Editing
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [activeViewNoteRowId, setActiveViewNoteRowId] = useState<string | null>(null);
  const [editingRowState, setEditingRowState] = useState<{
    values: Record<string, any>;
    notes: string;
  } | null>(null);

  // 5. New Entry Modal Form State
  const [newEntryDate, setNewEntryDate] = useState(todayStr);
  const [newEntryValues, setNewEntryValues] = useState<Record<string, any>>({});
  const [newEntryNotes, setNewEntryNotes] = useState('');
  const [newEntryTab, setNewEntryTab] = useState<'all' | 'date' | 'metrics' | 'custom' | 'notes'>('all');
  const newEntryTabsRef = useRef<HTMLDivElement>(null);
  const scrollNewEntryTabs = (direction: 'left' | 'right') => {
    if (newEntryTabsRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      newEntryTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // 6. Settings Modal Column & Table Form State
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<CustomTableColumnType>('text');
  const [newColUnit, setNewColUnit] = useState('');
  const [newColOptions, setNewColOptions] = useState('High, Medium, Low');
  const [tableTitleInput, setTableTitleInput] = useState(table.title);
  const [tableDescInput, setTableDescInput] = useState(table.description || '');

  // Keep table meta inputs in sync with table changes
  useEffect(() => {
    setTableTitleInput(table.title);
    setTableDescInput(table.description || '');
  }, [table.title, table.description]);

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside to close row action kebab menu
  useEffect(() => {
    const handleWindowClick = () => {
      if (activeActionMenuRowId) {
        setActiveActionMenuRowId(null);
      }
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [activeActionMenuRowId]);

  // Available visible columns
  const visibleColumns = useMemo(
    () => table.columns.filter((col) => !hiddenColumnIds.includes(col.id)),
    [table.columns, hiddenColumnIds]
  );

  // Detect semantic columns for live calculations and specialized UI
  const semanticCols = useMemo(() => {
    const scoreCol = table.columns.find((c) => /score/i.test(c.name) || /score/i.test(c.id));
    const totalCol = table.columns.find((c) => /total|max/i.test(c.name) || /total|max/i.test(c.id));
    const accuracyCol = table.columns.find((c) => /accuracy|acc/i.test(c.name) || c.unit === '%' || /accuracy/i.test(c.id));
    const difficultyCol = table.columns.find((c) => /difficulty|diff/i.test(c.name) || c.type === 'select');
    const analyzedCol = table.columns.find((c) => /analyzed|review/i.test(c.name) || c.type === 'boolean');
    const paperCol = table.columns.find((c) => /paper|title|exam|subject/i.test(c.name) || (c.type === 'text' && c.id !== accuracyCol?.id));

    return { scoreCol, totalCol, accuracyCol, difficultyCol, analyzedCol, paperCol };
  }, [table.columns]);

  // Available months from existing row data
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    table.rows.forEach((r) => {
      if (r.date && r.date.length >= 7) set.add(r.date.substring(0, 7));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [table.rows]);

  // Column header sort toggle
  const handleSort = (key: string) => {
    if (!showSortArrows) return; // Completely OFF by default unless enabled in settings
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    let result = [...table.rows];

    // 1. Month Filter
    if (selectedMonth !== 'all') {
      result = result.filter((r) => r.date.startsWith(selectedMonth));
    }

    // 2. Instant Search Query (matches text across paper name, notes, difficulty, and cell values)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((r) => {
        const dateMatch = r.date.toLowerCase().includes(q);
        const notesMatch = String(r.notes || '').toLowerCase().includes(q);
        const valuesMatch = Object.values(r.values || {}).some((v) =>
          String(v ?? '').toLowerCase().includes(q)
        );
        return dateMatch || notesMatch || valuesMatch;
      });
    }

    // 3. Sorting (Default OFF: natural reverse chronological order by date)
    if (!showSortArrows) {
      return result.sort((a, b) => b.date.localeCompare(a.date));
    }

    result.sort((a, b) => {
      let valA: any = sortConfig.key === 'date' ? a.date : a.values?.[sortConfig.key];
      let valB: any = sortConfig.key === 'date' ? b.date : b.values?.[sortConfig.key];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      return sortConfig.direction === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [table.rows, selectedMonth, searchQuery, sortConfig, showSortArrows]);

  // Live KPI Summary stats for footer bar
  const stats = useMemo(() => {
    const totalCount = processedRows.length;
    if (totalCount === 0) return { avgScore: 0, avgAccuracy: '0.0', analyzedCount: 0 };

    let scoreSum = 0;
    let scoreCount = 0;
    let accSum = 0;
    let accCount = 0;
    let analyzedCount = 0;

    const { scoreCol, accuracyCol, analyzedCol } = semanticCols;

    processedRows.forEach((r) => {
      // Score
      if (scoreCol) {
        const val = Number(r.values?.[scoreCol.id]);
        if (!isNaN(val) && val > 0) {
          scoreSum += val;
          scoreCount++;
        }
      }
      // Accuracy
      if (accuracyCol) {
        const val = Number(r.values?.[accuracyCol.id]);
        if (!isNaN(val) && val > 0) {
          accSum += val;
          accCount++;
        }
      }
      // Analyzed / Boolean
      if (analyzedCol) {
        const tri = normalizeTriState(r.values?.[analyzedCol.id]);
        if (tri === 'yes') {
          analyzedCount++;
        }
      } else {
        // Fallback: check any boolean column
        const hasYes = Object.values(r.values || {}).some((v) => normalizeTriState(v) === 'yes');
        if (hasYes) analyzedCount++;
      }
    });

    return {
      avgScore: scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0,
      avgAccuracy: accCount > 0 ? (accSum / accCount).toFixed(1) : '0.0',
      analyzedCount,
    };
  }, [processedRows, semanticCols]);

  // Open New Entry Modal with clean initialized values
  const handleOpenNewEntryModal = () => {
    setNewEntryDate(todayStr);
    const initialVals: Record<string, any> = {};
    table.columns.forEach((col) => {
      if (col.type === 'boolean') initialVals[col.id] = 'na';
      else if (col.type === 'rating') initialVals[col.id] = 5;
      else if (col.type === 'select' && col.options && col.options.length > 0) initialVals[col.id] = col.options[1] || col.options[0];
      else if (col.id === semanticCols.totalCol?.id) initialVals[col.id] = 180;
      else initialVals[col.id] = '';
    });
    setNewEntryValues(initialVals);
    setNewEntryNotes('');
    setNewEntryTab('all');
    setShowAddEntryModal(true);
  };

  // Submit New Entry Modal
  const handleSubmitNewEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntryDate) return;

    // Clean numerical values
    const cleanedValues: Record<string, any> = { ...newEntryValues };
    table.columns.forEach((col) => {
      if (col.type === 'number' && cleanedValues[col.id] !== '' && cleanedValues[col.id] !== undefined) {
        cleanedValues[col.id] = Number(cleanedValues[col.id]);
      }
    });

    addCustomTableRow(table.id, newEntryDate, cleanedValues, newEntryNotes.trim());
    confetti({ particleCount: 25, spread: 60, origin: { y: 0.8 } });
    setShowAddEntryModal(false);
  };

  // Duplicate an existing row
  const handleDuplicateRow = (row: CustomTableRow) => {
    const baseNote = row.notes ? row.notes.replace(/\s*\(Copy(\s*\d+)?\)$/i, '').trim() : '';
    const cleanNote = baseNote ? `${baseNote} (Copy)` : '';
    addCustomTableRow(table.id, todayStr, { ...(row.values || {}) }, cleanNote);
    setActiveActionMenuRowId(null);
    confetti({ particleCount: 20, spread: 40 });
  };

  // Delete an existing row
  const handleDeleteRow = (rowId: string) => {
    if (window.confirm('Delete this entry permanently?')) {
      deleteCustomTableRow(table.id, rowId);
      if (expandedRowId === rowId) setExpandedRowId(null);
      setActiveActionMenuRowId(null);
    }
  };

  // Toggle column visibility
  const handleToggleColumnVisibility = (colId: string) => {
    setHiddenColumnIds((prev) =>
      prev.includes(colId) ? prev.filter((id) => id !== colId) : [...prev, colId]
    );
  };

  // Add new column via Settings Modal
  const handleAddNewColumn = (e: React.FormEvent) => {
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
      name: newColName.trim().toUpperCase(),
      type: newColType,
      unit: newColUnit.trim() || undefined,
      options: opts && opts.length > 0 ? opts : (newColType === 'select' ? ['High', 'Medium', 'Low'] : undefined),
    });

    setNewColName('');
    setNewColType('text');
    setNewColUnit('');
    setNewColOptions('High, Medium, Low');
  };

  // Export CSV (with formula injection & quote escaping protection)
  const escapeCsvCell = (raw: unknown): string => {
    const str = String(raw ?? '');
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const headers = ['Date', ...visibleColumns.map((c) => c.name), 'Notes'];
    const csvLines = [headers.map(escapeCsvCell).join(',')];
    processedRows.forEach((r) => {
      const line = [
        escapeCsvCell(r.date),
        ...visibleColumns.map((c) => escapeCsvCell(r.values?.[c.id] ?? '')),
        escapeCsvCell(r.notes ?? ''),
      ];
      csvLines.push(line.join(','));
    });
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.title.toLowerCase().replace(/\s+/g, '_')}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full flex flex-col space-y-3.5 sm:space-y-5 animate-fadeIn font-mono text-stone-900 dark:text-stone-100">

      {/* ======================================================== */}
      {/* 1. TOP TOOLBAR (Clean, Compact, No Clutter on Mobile)      */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-4 pb-2.5 sm:pb-4 border-b border-black/10 dark:border-white/10 select-none">

        {/* Left Side: Table Title, Row Counter Pill Badge, Subtitle */}
        <div>
          <div className="flex items-center gap-2 sm:gap-3.5">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight uppercase font-mono break-words min-w-0">
              {table.title}
            </h1>
            <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-extrabold bg-[#e9762b]/15 text-[#e9762b] border border-[#e9762b]/35 uppercase tracking-wider font-mono shadow-sm">
              {processedRows.length} {processedRows.length === 1 ? 'ENTRY' : 'ENTRIES'}
            </span>
          </div>
          {table.description && (
            <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 mt-0.5 sm:mt-1 font-mono">
              {table.description}
            </p>
          )}
        </div>

        {/* Right Side Action Cluster — clean, compact 2-row layout on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">

          {/* Row 1 on mobile: Search + Month side-by-side */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Instant Search Input */}
            <div className="relative flex-1 sm:w-56 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input rounded-full pl-8 pr-7 py-1.5 sm:py-2 text-xs text-stone-900 dark:text-white placeholder-stone-500 focus:outline-none focus:border-[#e9762b] transition w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer p-0.5"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Month Filter Dropdown */}
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full glass-pill border border-black/10 dark:border-white/12 text-xs shrink-0">
              <span className="text-[9px] sm:text-[10px] text-stone-500 dark:text-slate-400 uppercase font-bold">M:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-[#e9762b] font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-[#141413] text-[#e9762b]">All</option>
                {availableMonths.map((m) => {
                  const [year, month] = m.split('-');
                  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
                  const label = d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                  return (
                    <option key={m} value={m} className="bg-white dark:bg-[#141413] text-[#e9762b]">
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Row 2 on mobile: 3 action buttons side-by-side */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Primary Action: NEW ENTRY Button */}
            <button
              type="button"
              onClick={handleOpenNewEntryModal}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-b from-[#f28238] to-[#e9762b] hover:brightness-110 text-black font-mono font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_2px_12px_-2px_rgba(233,118,43,0.4)] border border-orange-300/30 active:scale-95 cursor-pointer whitespace-nowrap"
              title="Log new entry into this table"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>NEW ENTRY</span>
            </button>

            {/* Full Table View Button */}
            <button
              type="button"
              onClick={() => setIsFullTableView(true)}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full glass-pill hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/12 hover:border-[#e9762b]/50 text-stone-700 dark:text-stone-200 hover:text-black dark:hover:text-white font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-sm text-xs font-mono whitespace-nowrap"
              title="Expand into full-screen spreadsheet table view"
            >
              <Maximize2 className="w-3 h-3 text-[#e9762b]" />
              <span>FULL TABLE</span>
            </button>

            {/* Dedicated Settings Button */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full glass-pill hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/12 hover:border-[#e9762b]/50 text-stone-700 dark:text-stone-200 hover:text-black dark:hover:text-white font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-sm text-xs font-mono whitespace-nowrap"
              title="Configure table settings, columns, and export"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#e9762b]" />
              <span>SETTINGS</span>
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TABLE DATA GRID (Frosted Glassmorphism, JetBrains)    */}
      {/* ======================================================== */}
      <div ref={tableContainerRef} className="w-full rounded-2xl sm:rounded-3xl glass-panel overflow-hidden shadow-2xl">
        {/* Mobile Table Utility Header (Pinned above the horizontal scroll) */}
        <div className="sm:hidden flex items-center justify-between px-3.5 py-2 text-[11px] font-mono border-b border-black/10 dark:border-white/10 bg-stone-200/50 dark:bg-white/[0.03] select-none">
          <div className="flex items-center gap-2 text-stone-600 dark:text-slate-400">
            <span className="whitespace-nowrap">Tap date to edit</span>
            <span className="text-stone-400">•</span>
            <span className="text-[#e9762b] font-bold">Swipe →</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFullTableView(true)}
              className="flex items-center gap-1 text-[10px] font-extrabold text-[#e9762b] hover:text-[#ff5f00] px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 active:scale-95 cursor-pointer"
              title="Open full-screen table view"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="whitespace-nowrap">FULL TABLE</span>
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-1 text-[10px] font-extrabold text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 active:scale-95 cursor-pointer"
              title="Scroll to top of page"
            >
              <ArrowUp className="w-3 h-3" />
              <span>TOP</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[62dvh] sm:max-h-[82vh] overflow-y-auto table-scroll-container custom-scrollbar">
          <table className="w-full min-w-full text-left text-sm border-collapse">

            {/* Sticky Header with real Sorting Affordances */}
            <thead
              className="sticky top-0 z-30 glass-table-header text-stone-700 dark:text-slate-200 select-none"
            >
              <tr className="uppercase tracking-[0.14em] text-xs sm:text-[13px] font-bold">

                {/* Sticky Date Header (First row, first column) */}
                <th
                  className="py-2.5 sm:py-4 px-2 sm:px-5 sticky left-0 z-40 glass-sticky-th border-r border-black/10 dark:border-white/12 min-w-[88px] w-[88px] sm:min-w-[152px] sm:w-[152px] text-[11px] sm:text-xs"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span>DATE</span>
                    {showSortArrows && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSort('date');
                        }}
                        className="p-1 -m-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[#e9762b] transition cursor-pointer"
                        title="Sort by date"
                        aria-label="Sort by date"
                      >
                        {sortConfig.key === 'date' ? (
                          sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#e9762b]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#e9762b]" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 hover:text-white" />
                        )}
                      </button>
                    )}
                  </div>
                </th>

                {/* Dynamic Visible Columns */}
                {visibleColumns.map((col) => {
                  const isPaperCol = col.id === semanticCols.paperCol?.id || /paper|title/i.test(col.name);
                  const isLeftAligned = col.type === 'text' && isPaperCol;

                  return (
                    <th
                      key={col.id}
                      className={`py-2.5 sm:py-4 px-2.5 sm:px-5 whitespace-nowrap min-w-[100px] sm:min-w-[120px] text-[11px] sm:text-xs ${isLeftAligned ? 'text-left' : 'text-center'
                        }`}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${isLeftAligned ? 'justify-start' : 'justify-center'
                        }`}>
                        <span>{formatColumnHeader(col.name, col.unit)}</span>
                        {showSortArrows && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSort(col.id);
                            }}
                            className="p-1 -m-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[#e9762b] transition cursor-pointer"
                            title={`Sort by ${col.name}`}
                            aria-label={`Sort by ${col.name}`}
                          >
                            {sortConfig.key === col.id ? (
                              sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-[#e9762b]" /> : <ArrowDown className="w-3.5 h-3.5 text-[#e9762b]" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 hover:text-white" />
                            )}
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}

                {/* Notes Column */}
                <th className="py-2.5 sm:py-4 px-2.5 sm:px-5 text-left min-w-[160px] sm:min-w-[220px] text-[11px] sm:text-xs">NOTES</th>

                {/* Actions Menu Header */}
                <th aria-label="Actions" className="py-2.5 sm:py-4 px-2 text-center w-12 sm:w-16 text-stone-500 text-[11px] sm:text-xs">•••</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-black/5 dark:divide-white/[0.07]">
              {processedRows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 3} className="py-16 text-center text-stone-500">
                    <FileText className="w-9 h-9 mx-auto mb-2.5 opacity-40 text-stone-400" />
                    <p className="text-sm sm:text-base font-bold text-stone-700 dark:text-stone-300">No records found.</p>
                    <p className="text-xs sm:text-sm mt-1 text-stone-500">Try clearing your search query or click "+ NEW ENTRY" above.</p>
                  </td>
                </tr>
              ) : (
                processedRows.map((row) => {
                  const isExpanded = expandedRowId === row.id;
                  const handleDateToggle = () => {
                    if (isExpanded) {
                      setExpandedRowId(null);
                      setEditingRowState(null);
                    } else {
                      const cleanRowValues: Record<string, any> = { ...(row.values || {}) };
                      Object.keys(cleanRowValues).forEach((k) => {
                        const v = cleanRowValues[k];
                        if (typeof v === 'string' && v.includes('|')) {
                          cleanRowValues[k] = v.split('|').map((s) => s.trim()).filter(Boolean).pop() || v.split('|')[0].trim();
                        }
                      });
                      setExpandedRowId(row.id);
                      setEditingRowState({
                        values: cleanRowValues,
                        notes: row.notes || '',
                      });
                    }
                  };

                  return (
                    <React.Fragment key={row.id}>
                      <tr className="even:bg-white/[0.012] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors duration-150 group">

                        {/* Sticky Date Pill (OCT 25) with Amber Border */}
                        <td
                          onClick={handleDateToggle}
                          className="py-2 sm:py-3.5 px-2 sm:px-5 sticky left-0 z-20 glass-sticky-col-cell border-r border-black/10 dark:border-white/10 min-w-[88px] w-[88px] sm:min-w-[152px] sm:w-[152px] cursor-pointer"
                          title="Click to view/edit entry details"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateToggle();
                              }}
                              className={`inline-flex items-center justify-center px-2 sm:px-3.5 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[13px] font-extrabold tracking-wide transition-all duration-150 cursor-pointer select-none font-mono uppercase ${isExpanded
                                  ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/25'
                                  : 'text-[#e9762b] bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/35 hover:border-orange-500/60'
                                }`}
                              title="Click to view/edit entry details"
                            >
                              <span>{formatDateDisplay(row.date)}</span>
                            </button>
                          </div>
                        </td>

                        {/* Dynamic Column Values */}
                        {visibleColumns.map((col) => {
                          const val = row.values?.[col.id];

                          // 1. Accuracy (%) with Dynamic Progress Bar (Centered under ACCURACY (%) header)
                          const isAccuracy = col.id === semanticCols.accuracyCol?.id || /accuracy|acc/i.test(col.name) || col.unit === '%';
                          if (isAccuracy) {
                            const hasNumericVal = val !== undefined && val !== null && val !== '' && !Number.isNaN(Number(val));
                            if (hasNumericVal) {
                              const numVal = Number(val);
                              const barColor = numVal >= 75 ? 'bg-[#e9762b]' : numVal >= 60 ? 'bg-amber-400' : 'bg-red-400';
                              return (
                                <td key={col.id} className="py-2 sm:py-3.5 px-2 sm:px-5 text-center whitespace-nowrap">
                                  <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2.5 mx-auto">
                                    <div className="w-14 sm:w-20 bg-black/10 dark:bg-white/10 rounded-full h-1.5 sm:h-2 overflow-hidden shrink-0">
                                      <div className={`${barColor} h-full rounded-full transition-all`} style={{ width: `${Math.min(Math.max(numVal, 0), 100)}%` }} />
                                    </div>
                                    <span className="font-bold font-mono-numbers text-stone-900 dark:text-white text-xs sm:text-[15px]">{numVal}%</span>
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={col.id} className="py-2 sm:py-3.5 px-2 sm:px-5 text-center font-mono-numbers text-xs sm:text-[15px] whitespace-nowrap">
                                <span className="text-stone-400/50 dark:text-white/20 font-normal select-none">--</span>
                              </td>
                            );
                          }

                          // 2. Difficulty / Select Color-coded Status Pill (Always single value)
                          const isDifficulty = col.id === semanticCols.difficultyCol?.id || /difficulty|diff/i.test(col.name);
                          if ((isDifficulty || col.type === 'select') && val) {
                            const rawStr = String(val);
                            const strVal = rawStr.includes('|')
                              ? rawStr.split('|').map((s) => s.trim()).filter(Boolean).pop() || rawStr.split('|')[0].trim()
                              : rawStr.trim();
                            const lower = strVal.toLowerCase();
                            const badgeClasses =
                              lower === 'high' || lower === 'hard'
                                ? 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/35'
                                : lower === 'medium' || lower === 'med' || lower === 'normal'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/35'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/35';
                            return (
                              <td key={col.id} className="py-2 sm:py-3.5 px-2 sm:px-5 text-center whitespace-nowrap">
                                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-extrabold border ${badgeClasses}`}>
                                  {strVal}
                                </span>
                              </td>
                            );
                          }

                          // 3. Analyzed / Boolean Micro Pill Toggle (YES / NO / N/A)
                          if (col.type === 'boolean') {
                            return (
                              <td key={col.id} className="py-2 sm:py-3.5 px-2 sm:px-5 text-center whitespace-nowrap">
                                <TriStateBadge
                                  value={val}
                                  onChange={(newVal) => updateCustomTableCell(table.id, row.id, col.id, newVal)}
                                  cycleEnabled={enableClickToCycle}
                                  className="mx-auto"
                                />
                              </td>
                            );
                          }

                          // 4. Rating (1-5 Stars or Badge)
                          if (col.type === 'rating') {
                            const numVal = Number(val);
                            return (
                              <td key={col.id} className="py-2 sm:py-3.5 px-2 sm:px-5 text-center whitespace-nowrap">
                                {numVal ? (
                                  <span className="font-bold text-[#e9762b] text-xs sm:text-base">
                                    {'★'.repeat(Math.min(numVal, 5))}
                                    <span className="opacity-20">{'★'.repeat(Math.max(5 - numVal, 0))}</span>
                                  </span>
                                ) : (
                                  <span className="text-stone-400/50 dark:text-white/20 text-xs sm:text-sm select-none">--</span>
                                )}
                              </td>
                            );
                          }

                          // 5. Numbers (Centered bold text under centered header)
                          if (col.type === 'number') {
                            return (
                              <td key={col.id} className="py-2 sm:py-3.5 px-2 sm:px-5 text-center font-bold font-mono-numbers text-stone-900 dark:text-white text-xs sm:text-[15px] whitespace-nowrap">
                                {val !== undefined && val !== null && val !== '' ? val : <span className="text-stone-400/50 dark:text-white/20 font-normal">--</span>}
                              </td>
                            );
                          }

                          // 6. Paper / Default Text
                          const isPaper = col.id === semanticCols.paperCol?.id || /paper|title/i.test(col.name);
                          return (
                            <td key={col.id} className={`py-2 sm:py-3.5 px-2 sm:px-5 text-xs sm:text-[15px] ${isPaper ? 'text-left font-bold text-stone-900 dark:text-white' : 'text-center text-stone-700 dark:text-stone-200'}`}>
                              {val !== undefined && val !== null && val !== '' ? String(val) : <span className="text-stone-400/50 dark:text-white/20 text-xs sm:text-sm">--</span>}
                            </td>
                          );
                        })}

                        {/* Notes snippet & click to view only (not edit) */}
                        <td
                          className="py-2 sm:py-3.5 px-2.5 sm:px-5 text-stone-500 dark:text-stone-400 max-w-[160px] sm:max-w-xs truncate text-xs sm:text-sm relative"
                          title={row.notes ? row.notes : 'No note'}
                        >
                          {row.notes ? (
                            <div className="relative inline-block max-w-full">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveViewNoteRowId(activeViewNoteRowId === row.id ? null : row.id);
                                }}
                                className="text-left truncate max-w-full text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition cursor-pointer select-none active:scale-95 block"
                                title="Click to view note"
                              >
                                {row.notes}
                              </button>

                              {activeViewNoteRowId === row.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveViewNoteRowId(null);
                                    }}
                                  />
                                  <div
                                    className="absolute bottom-full mb-2 z-50 left-0 glass-modal text-xs p-3.5 rounded-xl shadow-2xl w-64 sm:w-80 text-left whitespace-normal border border-orange-500/30 animate-in fade-in zoom-in-95 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/10">
                                      <span className="text-[11px] text-[#e9762b] font-bold tracking-wider uppercase flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-[#e9762b]" />
                                        Note
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveViewNoteRowId(null);
                                            setExpandedRowId(row.id);
                                            setEditingRowState({ values: { ...(row.values || {}) }, notes: row.notes || '' });
                                          }}
                                          className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-[#e9762b] transition text-[10px] flex items-center gap-1"
                                          title="Edit Row"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setActiveViewNoteRowId(null)}
                                          className="p-1 rounded-lg hover:bg-white/10 text-stone-400 hover:text-white transition"
                                          title="Close"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-stone-900 dark:text-stone-200 text-xs sm:text-sm leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap break-words select-text">
                                      {row.notes}
                                    </p>
                                    <div className="w-2.5 h-2.5 glass-modal border-r border-b border-orange-500/30 transform rotate-45 absolute -bottom-1.5 left-4 pointer-events-none" />
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400/50 dark:text-white/20 select-none">--</span>
                          )}
                        </td>

                        {/* Row Action Kebab Menu (⋮) */}
                        <td className="py-2 sm:py-3.5 px-2 sm:px-3 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveActionMenuRowId(activeActionMenuRowId === row.id ? null : row.id)
                            }
                            className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
                            title="Row actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeActionMenuRowId === row.id && (
                            <div className="absolute right-3 top-11 z-50 w-48 rounded-2xl bg-white dark:bg-[#171716] border border-black/10 dark:border-white/12 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] p-1.5 text-[13px] text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedRowId(row.id);
                                  setEditingRowState({ values: { ...(row.values || {}) }, notes: row.notes || '' });
                                  setActiveActionMenuRowId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 transition cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#e9762b]" />
                                <span>Edit Entry</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateRow(row)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-stone-700 dark:text-stone-200 transition cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-[#e9762b]" />
                                <span>Duplicate</span>
                              </button>
                              <div className="my-1 border-t border-black/10 dark:border-white/10" />
                              <button
                                type="button"
                                onClick={() => handleDeleteRow(row.id)}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-500 dark:text-red-400 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Row Editing Accordion */}
                      {isExpanded && editingRowState && (
                        <tr className="bg-stone-50/50 dark:bg-white/[0.02]">
                          <td colSpan={visibleColumns.length + 3} className="p-4 sm:p-6 border-b border-black/10 dark:border-white/10">
                            <div className="space-y-4 rounded-xl bg-white dark:bg-black/40 border border-black/10 dark:border-white/10 p-4 sm:p-6 shadow-inner">
                              <div className="flex items-center justify-between pb-2 border-b border-black/10 dark:border-white/10">
                                <h3 className="text-sm font-bold text-stone-900 dark:text-white flex items-center gap-2">
                                  <Edit3 className="w-4 h-4 text-[#e9762b]" />
                                  <span>Editing Test Entry: {formatDateDisplay(row.date)}</span>
                                </h3>
                                <button
                                  type="button"
                                  onClick={() => setExpandedRowId(null)}
                                  className="text-stone-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {table.columns.map((col) => (
                                  <div key={col.id} className="space-y-1">
                                    <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider">
                                      {formatColumnHeader(col.name, col.unit)}
                                    </label>

                                    {col.type === 'boolean' ? (
                                      <TriStatePillSelect
                                        size="sm"
                                        value={editingRowState.values[col.id]}
                                        onChange={(val) =>
                                          setEditingRowState({
                                            ...editingRowState,
                                            values: {
                                              ...editingRowState.values,
                                              [col.id]: val,
                                            },
                                          })
                                        }
                                      />
                                    ) : col.type === 'select' ? (
                                      <select
                                        value={editingRowState.values[col.id] || ''}
                                        onChange={(e) =>
                                          setEditingRowState({
                                            ...editingRowState,
                                            values: {
                                              ...editingRowState.values,
                                              [col.id]: e.target.value,
                                            },
                                          })
                                        }
                                        className="w-full bg-stone-100 dark:bg-[#141413] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#e9762b]"
                                      >
                                        {(col.options || ['High', 'Medium', 'Low']).map((opt) => (
                                          <option key={opt} value={opt} className="bg-white dark:bg-[#141413]">
                                            {opt}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type={col.type === 'number' ? 'number' : 'text'}
                                        step={col.id === semanticCols.accuracyCol?.id ? '0.1' : undefined}
                                        value={editingRowState.values[col.id] ?? ''}
                                        onChange={(e) => {
                                          const nextVal = col.type === 'number'
                                            ? e.target.value === '' ? '' : Number(e.target.value)
                                            : e.target.value;

                                          const updatedVals = {
                                            ...editingRowState.values,
                                            [col.id]: nextVal,
                                          };

                                          // Live Auto-calc accuracy if score or total modified
                                          if (semanticCols.scoreCol && semanticCols.totalCol && semanticCols.accuracyCol) {
                                            if (col.id === semanticCols.scoreCol.id || col.id === semanticCols.totalCol.id) {
                                              const sc = col.id === semanticCols.scoreCol.id ? Number(nextVal) : Number(updatedVals[semanticCols.scoreCol.id]);
                                              const tot = col.id === semanticCols.totalCol.id ? Number(nextVal) : Number(updatedVals[semanticCols.totalCol.id]);
                                              if (tot > 0) {
                                                updatedVals[semanticCols.accuracyCol.id] = Number(((sc / tot) * 100).toFixed(1));
                                              }
                                            }
                                          }

                                          setEditingRowState({
                                            ...editingRowState,
                                            values: updatedVals,
                                          });
                                        }}
                                        className="w-full bg-stone-100 dark:bg-[#141413] border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#e9762b]"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Notes */}
                              <div className="space-y-1">
                                <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider">
                                  Notes &amp; Observations
                                </label>
                                <textarea
                                  rows={2}
                                  value={editingRowState.notes}
                                  onChange={(e) =>
                                    setEditingRowState({ ...editingRowState, notes: e.target.value })
                                  }
                                  className="w-full bg-stone-100 dark:bg-[#141413] border border-black/10 dark:border-white/10 rounded-lg p-3 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#e9762b]"
                                />
                              </div>

                              <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedRowId(null)}
                                  className="px-4 py-2 rounded-full border border-black/10 dark:border-white/10 text-xs text-stone-600 dark:text-stone-400 hover:text-black dark:hover:text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    Object.entries(editingRowState.values).forEach(([colId, val]) => {
                                      updateCustomTableCell(table.id, row.id, colId, val === '' ? null : val);
                                    });
                                    updateCustomTableRowNotes(table.id, row.id, editingRowState.notes.trim());
                                    setExpandedRowId(null);
                                    confetti({ particleCount: 20, spread: 40 });
                                  }}
                                  className="px-5 py-2 rounded-full bg-[#e9762b] text-black font-bold text-xs cursor-pointer hover:bg-[#ff5f00] transition active:scale-95"
                                >
                                  Save Changes
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

        {/* ======================================================== */}
        {/* 5. FOOTER METRICS BAR (Row Counter & Live KPI Chips)    */}
        {/* ======================================================== */}
        <div className="px-5 py-4 bg-white/[0.02] backdrop-blur-xl border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-[13px] text-stone-600 dark:text-stone-400 font-mono">
          <div className="uppercase tracking-wider text-xs">
            SHOWING <b className="text-stone-900 dark:text-white font-mono-numbers">{processedRows.length}</b> OF <b className="text-stone-900 dark:text-white font-mono-numbers">{table.rows.length}</b> ROWS
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08]">
              <BarChart3 className="w-3.5 h-3.5 text-[#e9762b]" />
              <span className="text-stone-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">AVG SCORE:</span>
              <b className="text-stone-900 dark:text-white font-extrabold font-mono-numbers text-xs sm:text-[13px]">{stats.avgScore} pts</b>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25">
              <span className="text-stone-700 dark:text-orange-300/80 uppercase tracking-wider text-[11px]">AVG ACCURACY:</span>
              <b className="text-[#e9762b] font-extrabold font-mono-numbers text-xs sm:text-[13px]">{stats.avgAccuracy}%</b>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08]">
              <span className="text-stone-600 dark:text-slate-400 uppercase tracking-wider text-[11px]">ANALYZED:</span>
              <b className="text-emerald-600 dark:text-emerald-400 font-extrabold font-mono-numbers text-xs sm:text-[13px]">{stats.analyzedCount}/{processedRows.length}</b>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MODAL: DEDICATED SETTINGS MODAL (Columns, Meta, Export)*/}
      {/* ======================================================== */}
      {showSettingsModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowSettingsModal(false); }}
        >
          <div
            className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border font-mono overflow-hidden transition-all duration-200"
            style={{
              backgroundColor: isDark ? 'rgba(18, 18, 17, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(36px)',
              WebkitBackdropFilter: 'blur(36px)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
              boxShadow: isDark
                ? '0 30px 90px -10px rgba(0,0,0,0.95), 0 0 60px -20px rgba(233,118,43,0.25)'
                : '0 30px 80px rgba(0, 0, 0, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
            }}
          >
            {/* Clean Compact Header */}
            <div className={`flex items-center justify-between border-b px-5 sm:px-6 py-4 shrink-0 transition-colors ${isDark ? 'bg-[#141413] border-white/10' : 'bg-[#f4f0e8] border-stone-200'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#e9762b] flex items-center justify-center border border-orange-500/40 shadow-inner">
                  <Settings2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                  SETTINGS — {table.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
                title="Close (Esc)"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 min-h-0 custom-scrollbar text-xs">

              {/* 1. TABLE DETAILS */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono block">
                  TABLE DETAILS
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold block">
                      NAME
                    </label>
                    <input
                      type="text"
                      value={tableTitleInput}
                      onChange={(e) => setTableTitleInput(e.target.value)}
                      placeholder="Table Name"
                      className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition ${isDark ? 'bg-[#121211] border-white/10 text-white placeholder-stone-600' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                        }`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold block">
                      SUBTITLE
                    </label>
                    <input
                      type="text"
                      value={tableDescInput}
                      onChange={(e) => setTableDescInput(e.target.value)}
                      placeholder="Optional subtitle"
                      className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition ${isDark ? 'bg-[#121211] border-white/10 text-white placeholder-stone-600' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. OPTIONS */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-2.5 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono block">
                  OPTIONS
                </span>

                <div className="space-y-2">
                  {/* Sort Arrows */}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-stone-700 dark:text-stone-300">
                      SORT ARROWS
                    </span>
                    <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${isDark ? 'bg-[#121211] border-white/10' : 'bg-stone-100 border-stone-300'
                      }`}>
                      <button
                        type="button"
                        onClick={() => setShowSortArrows(true)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${showSortArrows
                            ? 'bg-[#e9762b] text-white shadow-sm font-extrabold'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                          }`}
                      >
                        ON
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSortArrows(false)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${!showSortArrows
                            ? isDark
                              ? 'bg-white/10 text-white font-extrabold'
                              : 'bg-white text-stone-900 shadow-sm font-extrabold'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                          }`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>

                  {/* Click-to-Cycle */}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-stone-700 dark:text-stone-300">
                      CLICK-TO-CYCLE (YES / NO)
                    </span>
                    <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${isDark ? 'bg-[#121211] border-white/10' : 'bg-stone-100 border-stone-300'
                      }`}>
                      <button
                        type="button"
                        onClick={() => setEnableClickToCycle(true)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${enableClickToCycle
                            ? 'bg-[#e9762b] text-white shadow-sm font-extrabold'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                          }`}
                      >
                        ON
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnableClickToCycle(false)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${!enableClickToCycle
                            ? isDark
                              ? 'bg-white/10 text-white font-extrabold'
                              : 'bg-white text-stone-900 shadow-sm font-extrabold'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                          }`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>

                  {/* Auto-Generate Daily Rows by Date */}
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-stone-700 dark:text-stone-300">
                      AUTO-GENERATE ROWS (BY DATE)
                    </span>
                    <div className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 ${isDark ? 'bg-[#121211] border-white/10' : 'bg-stone-100 border-stone-300'
                      }`}>
                      <button
                        type="button"
                        onClick={() => setCustomTableAutoGenerateRows(table.id, true)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${isTableAutoGen
                            ? 'bg-[#e9762b] text-white shadow-sm font-extrabold'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                          }`}
                      >
                        ON
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomTableAutoGenerateRows(table.id, false)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${!isTableAutoGen
                            ? isDark
                              ? 'bg-white/10 text-white font-extrabold'
                              : 'bg-white text-stone-900 shadow-sm font-extrabold'
                            : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                          }`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. COLUMNS */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                    COLUMNS
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-orange-500/15 text-[#e9762b] border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider font-mono">
                    {table.columns.length} TOTAL
                  </span>
                </div>

                <div className={`divide-y rounded-xl border overflow-hidden max-h-48 overflow-y-auto custom-scrollbar ${isDark ? 'divide-white/5 border-white/10 bg-[#121211]' : 'divide-stone-200 border-stone-200 bg-[#faf6f0]'
                  }`}>
                  {table.columns.map((col, idx) => {
                    const isHidden = hiddenColumnIds.includes(col.id);
                    return (
                      <div
                        key={col.id}
                        className="flex items-center justify-between px-3 py-2.5 gap-2 hover:bg-black/5 dark:hover:bg-white/[0.02] transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-bold text-xs truncate ${isHidden ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-white'}`}>
                            {col.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-200/80 dark:bg-white/10 text-stone-500 dark:text-stone-400 uppercase font-bold">
                            {col.type}
                          </span>
                          {col.unit && <span className="text-[10px] text-[#e9762b] font-bold">({col.unit})</span>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => reorderCustomTableColumns(table.id, idx, idx - 1)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === table.columns.length - 1}
                            onClick={() => reorderCustomTableColumns(table.id, idx, idx + 1)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleColumnVisibility(col.id)}
                            className="p-1 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-white/10 cursor-pointer"
                            title={isHidden ? 'Show' : 'Hide'}
                          >
                            {isHidden ? <EyeOff className="w-3.5 h-3.5 text-stone-400" /> : <Eye className="w-3.5 h-3.5 text-[#e9762b]" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete column "${col.name}"?`)) {
                                deleteCustomTableColumn(table.id, col.id);
                              }
                            }}
                            className="p-1 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Column Compact Inline Form */}
                <form onSubmit={handleAddNewColumn} className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="New column name"
                      value={newColName}
                      onChange={(e) => setNewColName(e.target.value)}
                      className={`border focus:border-[#e9762b] rounded-xl px-3 py-2 text-xs focus:outline-none transition ${isDark ? 'bg-[#121211] border-white/10 text-white placeholder-stone-600' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                        }`}
                    />
                    <select
                      value={newColType}
                      onChange={(e) => setNewColType(e.target.value as CustomTableColumnType)}
                      className={`border focus:border-[#e9762b] rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer transition ${isDark ? 'bg-[#121211] border-white/10 text-white' : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                        }`}
                    >
                      <option value="text" className={isDark ? 'bg-[#141413] text-white' : 'bg-white text-stone-900'}>Text</option>
                      <option value="number" className={isDark ? 'bg-[#141413] text-white' : 'bg-white text-stone-900'}>Number</option>
                      <option value="boolean" className={isDark ? 'bg-[#141413] text-white' : 'bg-white text-stone-900'}>Yes / No</option>
                      <option value="select" className={isDark ? 'bg-[#141413] text-white' : 'bg-white text-stone-900'}>Dropdown</option>
                      <option value="rating" className={isDark ? 'bg-[#141413] text-white' : 'bg-white text-stone-900'}>Rating (1-5)</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Unit"
                        value={newColUnit}
                        onChange={(e) => setNewColUnit(e.target.value)}
                        className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 text-xs focus:outline-none transition ${isDark ? 'bg-[#121211] border-white/10 text-white placeholder-stone-600' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                          }`}
                      />
                      <button
                        type="submit"
                        disabled={!newColName.trim()}
                        className="px-3.5 py-2 rounded-xl bg-[#e9762b] text-white font-bold text-xs uppercase hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0 disabled:opacity-40"
                        title="Add Column"
                      >
                        + ADD
                      </button>
                    </div>
                  </div>
                  {newColType === 'select' && (
                    <input
                      type="text"
                      value={newColOptions}
                      onChange={(e) => setNewColOptions(e.target.value)}
                      placeholder="Options (comma separated, e.g. High, Medium, Low)"
                      className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 text-xs focus:outline-none transition ${isDark ? 'bg-[#121211] border-white/10 text-white placeholder-stone-600' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                        }`}
                    />
                  )}
                </form>
              </div>

              {/* 4. DATA & ACTIONS */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                    DATA &amp; ACTIONS
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
                    {table.rows.length} {table.rows.length === 1 ? 'ROW' : 'ROWS'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 ${isDark
                        ? 'bg-[#121211] border-white/10 text-white hover:border-[#e9762b]'
                        : 'bg-white border-stone-300 text-stone-800 hover:border-[#e9762b] shadow-sm'
                      }`}
                  >
                    <Download className="w-3.5 h-3.5 text-[#e9762b]" />
                    <span>EXPORT CSV</span>
                  </button>

                  <button
                    type="button"
                    disabled={table.rows.length === 0}
                    onClick={() => {
                      if (window.confirm(`Clear all ${table.rows.length} rows in "${table.title}"?`)) {
                        table.rows.forEach((r) => deleteCustomTableRow(table.id, r.id));
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isDark
                        ? 'bg-[#121211] border-white/10 text-stone-300 hover:text-red-400 hover:border-red-500/40'
                        : 'bg-white border-stone-300 text-stone-700 hover:text-red-600 hover:border-red-400 shadow-sm'
                      }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>CLEAR ROWS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Permanently delete table "${table.title}"?`)) {
                        deleteCustomTable(table.id);
                        setShowSettingsModal(false);
                        setActiveTableId('main');
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/25 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>DELETE TABLE</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Clean Footer */}
            <div className={`flex items-center justify-between border-t px-5 sm:px-6 py-3.5 shrink-0 transition-colors ${isDark ? 'bg-[#141413] border-white/10' : 'bg-[#f4f0e8] border-stone-200'
              }`}>
              <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#e9762b]" />
                <span className="uppercase tracking-wider font-bold text-stone-700 dark:text-stone-300">STUDYO</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className={`px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 ${isDark
                      ? 'bg-[#1c1c1b] border-white/10 text-slate-300 hover:text-white'
                      : 'bg-stone-200 border-stone-300 text-stone-800 hover:text-black'
                    }`}
                >
                  CLOSE
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (tableTitleInput.trim()) {
                      updateCustomTable(table.id, {
                        title: tableTitleInput.trim(),
                        description: tableDescInput.trim() || undefined,
                      });
                    }
                    setShowSettingsModal(false);
                  }}
                  className="px-6 py-2.5 rounded-full bg-[#e9762b] text-white text-xs font-mono font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-orange-500/25"
                >
                  SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MODAL: NEW ENTRY MODAL (With Live Auto-Calculation)   */}
      {/* ======================================================== */}
      {showAddEntryModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddEntryModal(false); }}
        >
          <div
            className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border font-mono overflow-hidden transition-all duration-200"
            style={{
              backgroundColor: isDark ? 'rgba(18, 18, 17, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(36px)',
              WebkitBackdropFilter: 'blur(36px)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
              boxShadow: isDark
                ? '0 30px 90px -10px rgba(0,0,0,0.95), 0 0 60px -20px rgba(233,118,43,0.25)'
                : '0 30px 80px rgba(0, 0, 0, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
            }}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b px-5 sm:px-6 py-4 shrink-0 transition-colors ${isDark ? 'bg-[#141413] border-white/10' : 'bg-[#f4f0e8] border-stone-200'
              }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#e9762b] flex items-center justify-center border border-orange-500/40 shadow-inner">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                    NEW ENTRY — {table.title.toUpperCase()}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEntryModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewEntry} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 min-h-0 custom-scrollbar text-xs">

                {/* 1. DATE SELECTOR */}
                <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                      DATE
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border bg-orange-500/15 text-[#e9762b] border-orange-500/30">
                      {formatDateDisplay(newEntryDate)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewEntryDate(todayStr)}
                      className={`px-4 py-2 rounded-xl text-xs uppercase font-extrabold transition cursor-pointer ${newEntryDate === todayStr
                          ? 'bg-[#e9762b] text-white shadow-md shadow-orange-500/25'
                          : isDark
                            ? 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300/80 shadow-sm'
                        }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() - 1);
                        setNewEntryDate(getLocalDateString(d));
                      }}
                      className={`px-4 py-2 rounded-xl text-xs uppercase font-extrabold transition cursor-pointer ${newEntryDate !== todayStr
                          ? 'bg-[#e9762b] text-white shadow-md shadow-orange-500/25'
                          : isDark
                            ? 'bg-white/5 hover:bg-white/10 text-stone-300 border border-white/10'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300/80 shadow-sm'
                        }`}
                    >
                      Yesterday
                    </button>
                    <input
                      type="date"
                      value={newEntryDate}
                      onChange={(e) => setNewEntryDate(e.target.value)}
                      className={`border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs focus:outline-none flex-1 min-w-[140px] font-mono font-bold cursor-pointer transition ${isDark
                          ? 'bg-[#121211] border-white/10 text-white'
                          : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                        }`}
                      required
                    />
                  </div>
                </div>

                {/* 2. PAPER & DIFFICULTY */}
                {(semanticCols.paperCol || semanticCols.difficultyCol) && (
                  <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                    }`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono block">
                      TEST DETAILS
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {semanticCols.paperCol && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider block truncate">
                            {semanticCols.paperCol.name}
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Mock Test #1"
                            value={newEntryValues[semanticCols.paperCol.id] ?? ''}
                            onChange={(e) =>
                              setNewEntryValues({
                                ...newEntryValues,
                                [semanticCols.paperCol!.id]: e.target.value,
                              })
                            }
                            className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs focus:outline-none transition ${isDark
                                ? 'bg-[#121211] border-white/10 text-white'
                                : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                              }`}
                          />
                        </div>
                      )}

                      {semanticCols.difficultyCol && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider block truncate">
                            {semanticCols.difficultyCol.name}
                          </label>
                          <select
                            value={newEntryValues[semanticCols.difficultyCol.id] ?? 'Medium'}
                            onChange={(e) =>
                              setNewEntryValues({
                                ...newEntryValues,
                                [semanticCols.difficultyCol!.id]: e.target.value,
                              })
                            }
                            className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs focus:outline-none cursor-pointer transition ${isDark
                                ? 'bg-[#121211] border-white/10 text-white'
                                : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                              }`}
                          >
                            {(semanticCols.difficultyCol.options || ['High', 'Medium', 'Low']).map((opt) => (
                              <option key={opt} value={opt} className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. SCORES, TOTAL & ACCURACY */}
                {(semanticCols.scoreCol || semanticCols.totalCol || semanticCols.accuracyCol) && (
                  <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                    }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                        SCORES &amp; ACCURACY
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-extrabold border border-emerald-500/30">
                        LIVE CALC
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {semanticCols.scoreCol && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider block truncate">
                            {semanticCols.scoreCol.name}
                          </label>
                          <input
                            type="number"
                            placeholder="135"
                            value={newEntryValues[semanticCols.scoreCol.id] ?? ''}
                            onChange={(e) => {
                              const score = Number(e.target.value);
                              const totalKey = semanticCols.totalCol?.id || 'col_total';
                              const accKey = semanticCols.accuracyCol?.id || 'col_accuracy';
                              const total = Number(newEntryValues[totalKey]) || 180;
                              const acc = total > 0 ? Number(((score / total) * 100).toFixed(1)) : 0;
                              setNewEntryValues({
                                ...newEntryValues,
                                [semanticCols.scoreCol!.id]: e.target.value === '' ? '' : score,
                                ...(semanticCols.accuracyCol ? { [accKey]: acc } : {}),
                              });
                            }}
                            className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 font-mono text-sm font-bold text-center focus:outline-none transition ${isDark
                                ? 'bg-[#121211] border-white/10 text-white'
                                : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                              }`}
                          />
                        </div>
                      )}

                      {semanticCols.totalCol && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider block truncate">
                            {semanticCols.totalCol.name}
                          </label>
                          <input
                            type="number"
                            placeholder="180"
                            value={newEntryValues[semanticCols.totalCol.id] ?? ''}
                            onChange={(e) => {
                              const total = Number(e.target.value);
                              const scoreKey = semanticCols.scoreCol?.id || 'col_score';
                              const accKey = semanticCols.accuracyCol?.id || 'col_accuracy';
                              const score = Number(newEntryValues[scoreKey]) || 0;
                              const acc = total > 0 ? Number(((score / total) * 100).toFixed(1)) : 0;
                              setNewEntryValues({
                                ...newEntryValues,
                                [semanticCols.totalCol!.id]: e.target.value === '' ? '' : total,
                                ...(semanticCols.accuracyCol ? { [accKey]: acc } : {}),
                              });
                            }}
                            className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 font-mono text-sm font-bold text-center focus:outline-none transition ${isDark
                                ? 'bg-[#121211] border-white/10 text-white'
                                : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                              }`}
                          />
                        </div>
                      )}

                      {semanticCols.accuracyCol && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider block truncate">
                            {formatColumnHeader(semanticCols.accuracyCol.name, semanticCols.accuracyCol.unit)}
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            placeholder="75.0"
                            value={newEntryValues[semanticCols.accuracyCol.id] ?? ''}
                            onChange={(e) =>
                              setNewEntryValues({
                                ...newEntryValues,
                                [semanticCols.accuracyCol!.id]: e.target.value === '' ? '' : Number(e.target.value),
                              })
                            }
                            className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 font-mono text-sm font-bold text-[#e9762b] text-center focus:outline-none transition ${isDark
                                ? 'bg-[#121211] border-white/10'
                                : 'bg-white border-stone-300 shadow-sm'
                              }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. OTHER CUSTOM COLUMNS */}
                {table.columns.filter(
                  (c) =>
                    c.id !== semanticCols.paperCol?.id &&
                    c.id !== semanticCols.difficultyCol?.id &&
                    c.id !== semanticCols.scoreCol?.id &&
                    c.id !== semanticCols.totalCol?.id &&
                    c.id !== semanticCols.accuracyCol?.id
                ).length > 0 && (
                    <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                      }`}>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono block">
                        CUSTOM FIELDS
                      </span>
                      <div className="space-y-3">
                        {table.columns
                          .filter(
                            (c) =>
                              c.id !== semanticCols.paperCol?.id &&
                              c.id !== semanticCols.difficultyCol?.id &&
                              c.id !== semanticCols.scoreCol?.id &&
                              c.id !== semanticCols.totalCol?.id &&
                              c.id !== semanticCols.accuracyCol?.id
                          )
                          .map((col) => (
                            <div key={col.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider truncate">
                                {formatColumnHeader(col.name, col.unit)}
                              </label>
                              <div className="w-full sm:w-56 shrink-0">
                                {col.type === 'boolean' ? (
                                  <TriStatePillSelect
                                    size="sm"
                                    value={newEntryValues[col.id]}
                                    onChange={(val) =>
                                      setNewEntryValues({
                                        ...newEntryValues,
                                        [col.id]: val,
                                      })
                                    }
                                  />
                                ) : col.type === 'select' ? (
                                  <select
                                    value={newEntryValues[col.id] || ''}
                                    onChange={(e) =>
                                      setNewEntryValues({
                                        ...newEntryValues,
                                        [col.id]: e.target.value,
                                      })
                                    }
                                    className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 text-xs focus:outline-none cursor-pointer transition ${isDark
                                        ? 'bg-[#121211] border-white/10 text-white'
                                        : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                                      }`}
                                  >
                                    {(col.options || []).map((opt) => (
                                      <option key={opt} value={opt} className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>
                                        {opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : col.type === 'rating' ? (
                                  <select
                                    value={newEntryValues[col.id] ?? ''}
                                    onChange={(e) =>
                                      setNewEntryValues({
                                        ...newEntryValues,
                                        [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                      })
                                    }
                                    className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 text-xs font-bold text-center focus:outline-none cursor-pointer transition ${isDark ? 'bg-[#121211] border-white/10 text-white' : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                                      }`}
                                  >
                                    <option value="" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>-- Rating --</option>
                                    <option value="5" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>5 ★ (Mastered)</option>
                                    <option value="4" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>4 ★ (Good)</option>
                                    <option value="3" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>3 ★ (Average)</option>
                                    <option value="2" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>2 ★ (Weak)</option>
                                    <option value="1" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>1 ★ (Review)</option>
                                  </select>
                                ) : (
                                  <input
                                    type={col.type === 'number' ? 'number' : 'text'}
                                    placeholder={col.type === 'number' ? '0' : 'Enter value...'}
                                    value={newEntryValues[col.id] ?? ''}
                                    onChange={(e) =>
                                      setNewEntryValues({
                                        ...newEntryValues,
                                        [col.id]: col.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value,
                                      })
                                    }
                                    className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 text-xs focus:outline-none transition ${isDark
                                        ? 'bg-[#121211] border-white/10 text-white'
                                        : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                                      }`}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                {/* 5. NOTES */}
                <div className={`p-4 rounded-2xl border shadow-sm space-y-2 transition-colors ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                  }`}>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono block">
                    NOTES
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Add notes, key formulas, or milestones..."
                    value={newEntryNotes}
                    onChange={(e) => setNewEntryNotes(e.target.value)}
                    className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition leading-relaxed resize-none custom-scrollbar ${isDark
                        ? 'bg-[#121211] border-white/10 text-white placeholder-stone-500'
                        : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                      }`}
                  />
                </div>

              </div>

              {/* Sticky Modal Footer (Settings style) */}
              <div className={`flex items-center justify-between px-6 py-3.5 border-t shrink-0 transition-colors ${isDark ? 'bg-[#141413] border-white/10' : 'bg-[#f4f0e8] border-stone-200'
                }`}>
                <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e9762b] animate-pulse" />
                  <span className="hidden sm:inline">STUDYO • </span>
                  <span>{formatDateDisplay(newEntryDate)}</span>
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddEntryModal(false)}
                    className={`px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 ${isDark
                        ? 'bg-[#1c1c1b] border-white/10 text-slate-300 hover:text-white'
                        : 'bg-stone-200 border-stone-300 text-stone-800 hover:text-black'
                      }`}
                  >
                    CLOSE
                  </button>
                  <button
                    type="submit"
                    className="px-7 py-2.5 rounded-full bg-[#e9762b] text-white text-xs font-mono font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-orange-500/25"
                  >
                    SAVE ENTRY
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. FULL TABLE SPREADSHEET MODAL / IMMERSIVE VIEW         */}
      {/* ======================================================== */}
      {isFullTableView && (
        <div className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-2xl flex flex-col p-2 sm:p-5 animate-fadeIn font-mono select-none">
          {/* Top Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl glass-panel border border-white/10 mb-2 sm:mb-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-[#e9762b] shrink-0">
                <Table2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider truncate">
                    {table.title}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e9762b]/20 text-[#e9762b] border border-orange-500/30">
                    FULL SPREADSHEET
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 hidden sm:block truncate">
                  Swipe horizontally and vertically to inspect all rows and columns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Row Count Pill */}
              <div className="hidden xs:flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-stone-300">
                <span>{processedRows.length} ROWS</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsFullTableView(false)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-b from-[#f28238] to-[#e9762b] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-orange-500/25"
                title="Exit full table view"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>EXIT FULL</span>
              </button>
            </div>
          </div>

          {/* Full Screen Scrollable Table Container */}
          <div className="flex-1 w-full rounded-2xl glass-panel overflow-hidden border border-white/10 shadow-2xl relative flex flex-col min-h-0">
            <div className="flex-1 overflow-auto table-scroll-container custom-scrollbar">
              <table className="w-full min-w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-40 glass-table-header text-stone-200 select-none">
                  <tr className="uppercase tracking-[0.14em] text-[11px] font-bold">
                    <th className="py-2.5 px-2.5 sm:px-4 sticky left-0 z-50 glass-sticky-th border-r border-white/10 min-w-[84px] w-[84px] sm:min-w-[130px] sm:w-[130px]">
                      DATE
                    </th>
                    {visibleColumns.map((col) => {
                      const isPaperCol = col.id === semanticCols.paperCol?.id || /paper|title/i.test(col.name);
                      return (
                        <th
                          key={col.id}
                          className={`py-2.5 px-2.5 sm:px-4 whitespace-nowrap min-w-[90px] sm:min-w-[110px] ${
                            isPaperCol ? 'text-left' : 'text-center'
                          }`}
                        >
                          {formatColumnHeader(col.name, col.unit)}
                        </th>
                      );
                    })}
                    <th className="py-2.5 px-2.5 sm:px-4 text-left min-w-[140px] sm:min-w-[200px]">NOTES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {processedRows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumns.length + 2} className="py-16 text-center text-stone-500">
                        No records match current filter.
                      </td>
                    </tr>
                  ) : (
                    processedRows.map((row) => (
                      <tr key={row.id} className="even:bg-white/[0.015] hover:bg-white/[0.05] transition-colors">
                        {/* Sticky Date */}
                        <td className="py-2 px-2 sm:px-3 sticky left-0 z-20 glass-sticky-col-cell border-r border-white/10 min-w-[84px] w-[84px] sm:min-w-[130px] sm:w-[130px]">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-extrabold text-[#e9762b] bg-orange-500/10 border border-orange-500/30">
                            {formatDateDisplay(row.date)}
                          </span>
                        </td>
                        {/* Values */}
                        {visibleColumns.map((col) => {
                          const val = row.values?.[col.id];
                          const isAccuracy = col.id === semanticCols.accuracyCol?.id || /accuracy|acc/i.test(col.name) || col.unit === '%';
                          if (isAccuracy && val !== undefined && val !== null && val !== '') {
                            const numVal = Number(val);
                            return (
                              <td key={col.id} className="py-2 px-2.5 text-center whitespace-nowrap font-mono-numbers">
                                <b className="text-[#e9762b]">{numVal}%</b>
                              </td>
                            );
                          }
                          if (col.type === 'boolean') {
                            return (
                              <td key={col.id} className="py-2 px-2 text-center whitespace-nowrap">
                                <TriStateBadge
                                  value={val}
                                  onChange={(newVal) => updateCustomTableCell(table.id, row.id, col.id, newVal)}
                                  cycleEnabled={enableClickToCycle}
                                  className="mx-auto"
                                />
                              </td>
                            );
                          }
                          const isPaper = col.id === semanticCols.paperCol?.id || /paper|title/i.test(col.name);
                          return (
                            <td key={col.id} className={`py-2 px-2.5 sm:px-4 text-[11px] sm:text-xs whitespace-nowrap ${isPaper ? 'text-left font-bold text-white max-w-[180px] truncate' : 'text-center text-stone-300'}`}>
                              {val !== undefined && val !== null && val !== '' ? String(val) : <span className="text-white/20">--</span>}
                            </td>
                          );
                        })}
                        <td
                          className="py-2 px-2.5 sm:px-4 text-stone-400 text-[11px] max-w-[180px] truncate relative"
                          title={row.notes ? row.notes : 'No note'}
                        >
                          {row.notes ? (
                            <div className="relative inline-block max-w-full">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveViewNoteRowId(activeViewNoteRowId === 'full-' + row.id ? null : 'full-' + row.id);
                                }}
                                className="text-left truncate max-w-full hover:text-white transition cursor-pointer select-none"
                                title="Click to view note"
                              >
                                {row.notes}
                              </button>
                              {activeViewNoteRowId === 'full-' + row.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveViewNoteRowId(null);
                                    }}
                                  />
                                  <div
                                    className="absolute bottom-full mb-2 z-50 left-0 glass-modal text-xs p-3.5 rounded-xl shadow-2xl w-64 sm:w-80 text-left whitespace-normal border border-orange-500/30 animate-in fade-in zoom-in-95 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="flex items-center justify-between gap-2 pb-1.5 mb-2 border-b border-white/10">
                                      <span className="text-[10px] text-[#e9762b] font-bold tracking-wider uppercase flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-[#e9762b]" />
                                        Note
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setActiveViewNoteRowId(null)}
                                        className="p-1 rounded hover:bg-white/10 text-stone-400 hover:text-white transition"
                                        title="Close"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <p className="text-stone-200 text-xs leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap break-words select-text">
                                      {row.notes}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/20 select-none">--</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
