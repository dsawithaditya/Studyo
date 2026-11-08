import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  useStudyStore,
  getLocalTodayDateString,
  ensureDailyLogsDateWise
} from '../store/useStudyStore';
import { DailyLogEntry, CustomColumn, CustomColumnType, CustomTableColumnType, DefaultTableColumnKey } from '../types';
import { ShinyButton } from './ui/shiny-button';
import { YesNoToggle } from './ui/YesNoToggle';
import { CustomStudyTableView, formatColumnHeader } from './CustomStudyTableView';
import {
  Plus,
  Check,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Edit3,
  FileText,
  ChevronRight,
  Trash2,
  Settings2,
  CheckSquare,
  Hash,
  Type,
  List,
  ArrowLeft,
  ArrowRight,
  Table2,
  Layers,
  BookOpen,
  RotateCcw,
  Eye,
  EyeOff,
  RefreshCw,
  Star,
  Search,
  Download,
  MoreVertical,
  BarChart3,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ChevronLeft,
  Sliders,
  LayoutGrid,
  Columns,
  Clock,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { TriStateBadge, TriStatePillSelect, normalizeTriState } from './ui/TriStateToggle';
import type { TriStateStatus } from '../types';

const DEFAULT_COLUMNS_CONFIG: {
  key: DefaultTableColumnKey;
  label: string;
  minWidth: string;
  title?: string;
  description: string;
}[] = [
    { key: 'studyHours', label: 'HOURS', minWidth: 'min-w-[76px] sm:min-w-[120px]', description: 'Study duration in hours' },
    { key: 'attendedClass', label: 'CLASS', minWidth: 'min-w-[76px] sm:min-w-[114px]', description: 'Attended lecture/class' },
    { key: 'pyqsSolved', label: 'PYQS', minWidth: 'min-w-[76px] sm:min-w-[114px]', description: 'Past year questions solved count' },
    { key: 'revisionDone', label: 'REV', minWidth: 'min-w-[76px] sm:min-w-[114px]', title: 'Revision Done', description: 'Revision completed status' },
    { key: 'mockTestTaken', label: 'MOCK', minWidth: 'min-w-[76px] sm:min-w-[114px]', title: 'Mock Test Taken', description: 'Mock exam or test taken' },
    { key: 'sleepHours', label: 'SLEEP', minWidth: 'min-w-[76px] sm:min-w-[114px]', description: 'Sleep duration in hours' },
    { key: 'notes', label: 'NOTES', minWidth: 'min-w-[84px] sm:min-w-[124px]', description: 'Daily summary notes' },
    { key: 'focusRating', label: 'FOCUS', minWidth: 'min-w-[76px] sm:min-w-[120px]', description: 'Focus rating (1-5)' },
  ];

export const DailyStudyLog: React.FC = () => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const tableSectionRef = useRef<HTMLDivElement>(null);
  const {
    dailyLogs: rawLogs,
    ensureTodayDailyLog,
    addOrUpdateDailyLog,
    updateDailyLogField,
    deleteDailyLog,
    customColumns,
    addCustomColumn,
    updateCustomColumn,
    deleteCustomColumn,
    reorderCustomColumns,
    updateDailyLogCustomField,
    customTables,
    activeTableId,
    setActiveTableId,
    addCustomTable,
    deletedDefaultColumns = [],
    deletedDailyLogDates = [],
    deleteDefaultColumn,
    restoreDefaultColumn,
    resetDefaultColumns,
    isDefaultTableDeleted = false,
    deleteDefaultTable,
    restoreDefaultTable,
    autoGenerateRows = true,
    setAutoGenerateRows,
    showSortArrows = false,
    setShowSortArrows,
    enableClickToCycle = false,
    setEnableClickToCycle,
    mainTableTitle = 'Study Log',
    setMainTableTitle,
    mainTableDescription = 'Daily Habit, Hours & Performance Tracker',
    setMainTableDescription,
    syncUserData,
    isSyncing,
    syncError,
    theme,
  } = useStudyStore();

  const isDark = theme !== 'light';

  const todayStr = getLocalTodayDateString();
  const yesterdayStr = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d - 1);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }, [todayStr]);

  const dailyLogs = useMemo(
    () =>
      ensureDailyLogsDateWise(
        Array.isArray(rawLogs) ? rawLogs : [],
        deletedDailyLogDates,
        autoGenerateRows
      ),
    [rawLogs, deletedDailyLogDates, autoGenerateRows]
  );

  const hasMountedSyncRef = useRef(false);
  const [justSynced, setJustSynced] = useState(false);
  const prevSyncingRef = useRef(isSyncing);

  useEffect(() => {
    if (prevSyncingRef.current && !isSyncing && !syncError) {
      setJustSynced(true);
      prevSyncingRef.current = isSyncing;
      const timer = setTimeout(() => setJustSynced(false), 2000);
      return () => clearTimeout(timer);
    }
    prevSyncingRef.current = isSyncing;
  }, [isSyncing, syncError]);

  useEffect(() => {
    ensureTodayDailyLog();
    if (!hasMountedSyncRef.current) {
      hasMountedSyncRef.current = true;
      const u = useAuthStore.getState().currentUser;
      const s = useAuthStore.getState().session;
      if (u?.id && u.id !== 'demo-user-1' && s?.token && s.token !== 'demo-token') {
        syncUserData(u.id);
      }
    }
  }, [ensureTodayDailyLog, syncUserData]);

  // UI state
  const [enableTopForm, setEnableTopForm] = useState(false); // By-default disabled per user request!
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

  // Custom Columns UI state
  const [showAddColumnModal, setShowAddColumnModal] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<CustomColumnType>('boolean');
  const [newColOptions, setNewColOptions] = useState('');
  const [newColOptionInput, setNewColOptionInput] = useState('');

  const [editingColumn, setEditingColumn] = useState<{
    id: string;
    name: string;
    type: CustomColumnType;
    options: string;
    index: number;
  } | null>(null);
  const [editColOptionInput, setEditColOptionInput] = useState('');

  // Month/Year navigation and Chunk loading state
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('all');
  const [visibleLimit, setVisibleLimit] = useState<number>(20);
  const [isFullTableView, setIsFullTableView] = useState(false);

  // Add Row Modal State (for adding date rows - today or any past date)
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [addRowDate, setAddRowDate] = useState(todayStr);
  const [addRowStudyHours, setAddRowStudyHours] = useState<number | ''>('');
  const [addRowAttendedClass, setAddRowAttendedClass] = useState<TriStateStatus>('na');
  const [addRowPyqs, setAddRowPyqs] = useState<number | ''>('');
  const [addRowRevisionDone, setAddRowRevisionDone] = useState<TriStateStatus>('na');
  const [addRowMockTest, setAddRowMockTest] = useState<TriStateStatus>('na');
  const [addRowSleepHours, setAddRowSleepHours] = useState<number | ''>('');
  const [addRowRating, setAddRowRating] = useState<number | null>(null);
  const [addRowNotes, setAddRowNotes] = useState<string>('');
  const [addRowCustomData, setAddRowCustomData] = useState<Record<string, any>>({});
  const [activeViewNoteDate, setActiveViewNoteDate] = useState<string | null>(null);

  // Custom Tables Create Modal state
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTableTitle, setNewTableTitle] = useState('');
  const [newTableDesc, setNewTableDesc] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'mock' | 'pyq' | 'habits' | 'blank'>('mock');

  const activeCustomTable = useMemo(() => {
    return (customTables || []).find((t) => t.id === activeTableId);
  }, [customTables, activeTableId]);

  // Modal to manage & delete/restore columns
  const [showColumnsManagerModal, setShowColumnsManagerModal] = useState(false);
  const [mainSettingsTab, setMainSettingsTab] = useState<'all' | 'columns' | 'meta' | 'display' | 'export' | 'danger'>('all');
  const mainSettingsTabsRef = useRef<HTMLDivElement>(null);
  const scrollMainSettingsTabs = (direction: 'left' | 'right') => {
    if (mainSettingsTabsRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      mainSettingsTabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const mainSearchInputRef = useRef<HTMLInputElement>(null);
  const [mainActiveActionMenuDate, setMainActiveActionMenuDate] = useState<string | null>(null);
  const [mainSortField, setMainSortField] = useState<string>('date');
  const [mainSortAsc, setMainSortAsc] = useState<boolean>(false);

  const handleMainSort = (field: string) => {
    if (!showSortArrows) return; // Completely OFF by default unless enabled in settings
    if (mainSortField === field) {
      setMainSortAsc((prev) => !prev);
    } else {
      setMainSortField(field);
      setMainSortAsc(false);
    }
  };

  // Keyboard shortcut '/' to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        mainSearchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeDefaultColsCount = useMemo(() => {
    return DEFAULT_COLUMNS_CONFIG.filter((c) => !deletedDefaultColumns.includes(c.key)).length;
  }, [deletedDefaultColumns]);

  const totalDefaultTableCols = 1 + activeDefaultColsCount + customColumns.length + 1; // 1 for DATE, 1 for Actions

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableTitle.trim()) return;

    let initialCols: Array<{ name: string; type: CustomTableColumnType; unit?: string; options?: string[] }> = [];

    if (selectedTemplate === 'mock') {
      initialCols = [
        { name: 'PAPER', type: 'text' },
        { name: 'SCORE', type: 'number', unit: 'pts' },
        { name: 'TOTAL', type: 'number', unit: 'pts' },
        { name: 'ACCURACY', type: 'number', unit: '%' },
        { name: 'DIFFICULTY', type: 'select', options: ['High', 'Medium', 'Low'] },
        { name: 'ANALYZED', type: 'boolean' },
      ];
    } else if (selectedTemplate === 'pyq') {
      initialCols = [
        { name: 'TOPIC', type: 'text' },
        { name: 'SOLVED', type: 'number' },
        { name: 'TIME', type: 'number', unit: 'm' },
        { name: 'RATING', type: 'rating' },
        { name: 'CLEARED', type: 'boolean' },
      ];
    } else if (selectedTemplate === 'habits') {
      initialCols = [
        { name: 'WATER', type: 'number', unit: 'L' },
        { name: 'WORKOUT', type: 'boolean' },
        { name: 'ENERGY', type: 'select', options: ['High', 'Normal', 'Low'] },
        { name: 'SLEEP', type: 'number', unit: 'h' },
        { name: 'FOCUS', type: 'rating' },
      ];
    } else {
      initialCols = [
        { name: 'ITEM', type: 'text' },
        { name: 'DONE', type: 'boolean' },
      ];
    }

    const createdId = addCustomTable({
      title: newTableTitle.trim(),
      description: newTableDesc.trim(),
      columns: initialCols,
    });

    setNewTableTitle('');
    setNewTableDesc('');
    setSelectedTemplate('mock');
    setShowCreateTableModal(false);
    setActiveTableId(createdId);
  };

  // Form State
  const [formDate, setFormDate] = useState(todayStr);
  const [studyHours, setStudyHours] = useState<number | ''>('');
  const [attendedClass, setAttendedClass] = useState<TriStateStatus>('na');
  const [pyqsSolved, setPyqsSolved] = useState<number | ''>('');
  const [revisionDone, setRevisionDone] = useState<TriStateStatus>('na');
  const [mockTestTaken, setMockTestTaken] = useState<TriStateStatus>('na');
  const [sleepHours, setSleepHours] = useState<number | ''>('');
  const [focusRating, setFocusRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [formCustomData, setFormCustomData] = useState<Record<string, any>>({});

  // Accordion editing state for "expand in place"
  const [accordionState, setAccordionState] = useState<{
    date: string;
    studyHours: number | '';
    attendedClass: TriStateStatus;
    pyqsSolved: number | '';
    revisionDone: TriStateStatus;
    mockTestTaken: TriStateStatus;
    sleepHours: number | '';
    focusRating: number | null;
    notes: string;
    customData: Record<string, any>;
  } | null>(null);

  // Helper to format Date: "Oct 09" with double digit padding
  const formatDateDisplay = (dateStr: string) => {
    try {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [y, m, d] = dateStr.split('-').map(Number);
      return `${months[m - 1]} ${String(d).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  // Populate form with a given day's data
  const handleSelectDayForForm = (entry?: DailyLogEntry, targetDate?: string) => {
    const d = entry ? entry.date : targetDate || todayStr;
    const existing = entry || dailyLogs.find((l) => l.date === d);

    setFormDate(d);
    if (existing) {
      setStudyHours(existing.studyHours != null && existing.studyHours > 0 ? existing.studyHours : '');
      setAttendedClass(normalizeTriState(existing.attendedClass));
      setPyqsSolved(existing.pyqsSolved != null && existing.pyqsSolved > 0 ? existing.pyqsSolved : '');
      setRevisionDone(normalizeTriState(existing.revisionDone));
      setMockTestTaken(normalizeTriState(existing.mockTestTaken));
      setSleepHours(existing.sleepHours != null && existing.sleepHours > 0 ? existing.sleepHours : '');
      setFocusRating(existing.focusRating && existing.focusRating > 0 ? existing.focusRating : null);
      setNotes(existing.notes || '');
      setFormCustomData({ ...(existing.customData || {}) });
    } else {
      setStudyHours('');
      setAttendedClass('na');
      setPyqsSolved('');
      setRevisionDone('na');
      setMockTestTaken('na');
      setSleepHours('');
      setFocusRating(null);
      setNotes('');
      setFormCustomData({});
    }
    setShowForm(true);

    // Smooth scroll to form
    setTimeout(() => {
      document.getElementById('log-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // Smoothly scroll down so the full table is centered and fully visible on screen
  const scrollToCenterTable = () => {
    if (!tableSectionRef.current) return;
    const rect = tableSectionRef.current.getBoundingClientRect();
    const tableHeight = rect.height;
    const windowHeight = window.innerHeight;
    const targetY = rect.top + window.scrollY;

    // Center table vertically in the viewport
    const centerScrollY =
      tableHeight < windowHeight
        ? targetY - (windowHeight - tableHeight) / 2
        : targetY - 24;
    window.scrollTo({ top: Math.max(0, centerScrollY), behavior: 'smooth' });
  };

  // Scroll the table row into view if inside scrollable container
  const scrollToRowCenter = (date: string) => {
    setTimeout(() => {
      const container = tableContainerRef.current;
      const accordionEl = document.getElementById(`log-accordion-${date}`);
      const rowEl = document.getElementById(`log-row-${date}`);
      const target = accordionEl || rowEl;
      if (container && target && container.scrollHeight > container.clientHeight) {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const offsetTop = targetRect.top - containerRect.top + container.scrollTop;
        const desiredScrollTop = offsetTop - (container.clientHeight - targetRect.height) / 2;
        container.scrollTo({ top: Math.max(0, desiredScrollTop), behavior: 'smooth' });
      }
    }, 90);
  };

  // Toggle expand in place for a specific entry
  const handleToggleExpand = (entry: DailyLogEntry) => {
    if (expandedDate === entry.date) {
      setExpandedDate(null);
      setAccordionState(null);
    } else {
      setExpandedDate(entry.date);
      setAccordionState({
        date: entry.date,
        studyHours: entry.studyHours != null && entry.studyHours > 0 ? entry.studyHours : '',
        attendedClass: normalizeTriState(entry.attendedClass),
        pyqsSolved: entry.pyqsSolved != null && entry.pyqsSolved > 0 ? entry.pyqsSolved : '',
        revisionDone: normalizeTriState(entry.revisionDone),
        mockTestTaken: normalizeTriState(entry.mockTestTaken),
        sleepHours: entry.sleepHours != null && entry.sleepHours > 0 ? entry.sleepHours : '',
        focusRating: entry.focusRating && entry.focusRating > 0 ? entry.focusRating : null,
        notes: entry.notes || '',
        customData: { ...(entry.customData || {}) },
      });
      if (tableContainerRef.current) {
        setContainerWidth(tableContainerRef.current.clientWidth);
        tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
      scrollToRowCenter(entry.date);
    }
  };

  // Open and focus notes directly (in top form or in accordion)
  const handleOpenNoteEdit = (entry: DailyLogEntry) => {
    if (enableTopForm) {
      handleSelectDayForForm(entry);
      setTimeout(() => {
        const el = document.getElementById('log-form-notes');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      if (expandedDate !== entry.date) {
        handleToggleExpand(entry);
      }
      setTimeout(() => {
        const el = document.getElementById(`accordion-notes-${entry.date}`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  };

  // Month/Year navigation list
  const availableMonths = useMemo(() => {
    const map = new Map<string, number>();
    dailyLogs.forEach((l) => {
      const ym = l.date.substring(0, 7); // e.g. "2026-10"
      map.set(ym, (map.get(ym) || 0) + 1);
    });
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([ym, count]) => {
        const [y, m] = ym.split('-').map(Number);
        return {
          value: ym,
          label: `${months[m - 1]} ${y}`,
          count,
        };
      });
  }, [dailyLogs]);

  // Filter logs based on Month/Year / Last 30 Days selection + Instant Search Query
  const filteredDailyLogs = useMemo(() => {
    let logs = dailyLogs;
    if (selectedMonthYear === 'last30') {
      const [ty, tm, td] = todayStr.split('-').map(Number);
      const cutoff = new Date(ty, tm - 1, td - 30);
      const y = cutoff.getFullYear();
      const m = String(cutoff.getMonth() + 1).padStart(2, '0');
      const d = String(cutoff.getDate()).padStart(2, '0');
      const cutoffStr = `${y}-${m}-${d}`;
      logs = dailyLogs.filter((l) => l.date >= cutoffStr && l.date <= todayStr);
    } else if (selectedMonthYear !== 'all') {
      logs = dailyLogs.filter((l) => l.date.startsWith(selectedMonthYear));
    }

    if (mainSearchQuery.trim()) {
      const q = mainSearchQuery.toLowerCase();
      logs = logs.filter((l) => {
        if (l.date.toLowerCase().includes(q)) return true;
        if (l.notes && l.notes.toLowerCase().includes(q)) return true;
        if (l.customData && Object.values(l.customData).some((v) => String(v).toLowerCase().includes(q))) return true;
        return false;
      });
    }

    // If sorting is OFF (default), keep natural chronological order (latest date first)
    if (!showSortArrows) {
      return [...logs].sort((a, b) => b.date.localeCompare(a.date));
    }

    return [...logs].sort((a, b) => {
      let valA: any;
      let valB: any;
      if (mainSortField === 'date') {
        valA = a.date;
        valB = b.date;
      } else if (mainSortField in a) {
        valA = (a as any)[mainSortField];
        valB = (b as any)[mainSortField];
      } else {
        valA = a.customData?.[mainSortField];
        valB = b.customData?.[mainSortField];
      }

      if (valA === valB) return 0;
      if (valA == null || valA === '') return mainSortAsc ? -1 : 1;
      if (valB == null || valB === '') return mainSortAsc ? 1 : -1;

      // Handle Boolean & TriState Status sorting
      const isTriA = typeof valA === 'boolean' || valA === 'yes' || valA === 'no' || valA === 'na';
      const isTriB = typeof valB === 'boolean' || valB === 'yes' || valB === 'no' || valB === 'na';
      if (isTriA && isTriB) {
        const score = (v: any) => {
          const s = normalizeTriState(v);
          return s === 'yes' ? 2 : s === 'no' ? 1 : 0;
        };
        return mainSortAsc ? score(valA) - score(valB) : score(valB) - score(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return mainSortAsc ? valA - valB : valB - valA;
      }
      return mainSortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [dailyLogs, selectedMonthYear, todayStr, mainSearchQuery, mainSortField, mainSortAsc, showSortArrows]);

  // Paginated/Chunked visible logs
  const visibleLogs = filteredDailyLogs.slice(0, visibleLimit);

  // Summary statistics for the footer metrics bar with proper Tri-State attendance rate
  const mainStats = useMemo(() => {
    const total = visibleLogs.length;
    if (total === 0) {
      return {
        avgHours: 0,
        classPercent: 0,
        avgSleep: 0,
        totalHours: 0,
        classBreakdown: '0 Attended • 0 Missed • 0 No Class (N/A)',
      };
    }
    let hoursSum = 0;
    let sleepSum = 0;
    let classYes = 0;
    let classNo = 0;
    let classNa = 0;

    visibleLogs.forEach((l) => {
      if (l.studyHours) hoursSum += Number(l.studyHours);
      if (l.sleepHours) sleepSum += Number(l.sleepHours);
      const st = normalizeTriState(l.attendedClass);
      if (st === 'yes') classYes++;
      else if (st === 'no') classNo++;
      else classNa++;
    });

    const scheduledDays = classYes + classNo;
    const classPercent = scheduledDays > 0 ? Math.round((classYes / scheduledDays) * 100) : 100;

    return {
      totalHours: Number(hoursSum.toFixed(1)),
      avgHours: Number((hoursSum / total).toFixed(1)),
      classPercent,
      avgSleep: Number((sleepSum / total).toFixed(1)),
      classBreakdown: `${classYes} Attended • ${classNo} Missed • ${classNa} No Class (N/A)`,
      classYes,
      classNo,
      classNa,
    };
  }, [visibleLogs]);

  // Export Daily Logs to CSV (with formula injection & quote escaping protection)
  const escapeCsvCell = (raw: unknown): string => {
    const str = String(raw ?? '');
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const handleExportCSV = () => {
    const activeDefault = DEFAULT_COLUMNS_CONFIG.filter((c) => !deletedDefaultColumns.includes(c.key));
    const headers = ['Date', ...activeDefault.map((c) => c.label), ...customColumns.map((c) => c.name), 'Notes'];
    const csvLines = [headers.map(escapeCsvCell).join(',')];
    visibleLogs.forEach((entry) => {
      const line = [
        escapeCsvCell(entry.date),
        ...activeDefault.map((c) => {
          if (c.key === 'attendedClass') {
            const st = normalizeTriState(entry.attendedClass);
            return escapeCsvCell(st === 'yes' ? 'YES' : st === 'no' ? 'NO' : 'N/A');
          }
          if (c.key === 'revisionDone') {
            const st = normalizeTriState(entry.revisionDone);
            return escapeCsvCell(st === 'yes' ? 'YES' : st === 'no' ? 'NO' : 'N/A');
          }
          if (c.key === 'mockTestTaken') {
            const st = normalizeTriState(entry.mockTestTaken);
            return escapeCsvCell(st === 'yes' ? 'YES' : st === 'no' ? 'NO' : 'N/A');
          }
          return escapeCsvCell((entry as any)[c.key] ?? '');
        }),
        ...customColumns.map((c) => {
          const val = entry.customData?.[c.id];
          if (c.type === 'boolean') {
            const st = normalizeTriState(val);
            return escapeCsvCell(st === 'yes' ? 'YES' : st === 'no' ? 'NO' : 'N/A');
          }
          return escapeCsvCell(val ?? '');
        }),
        escapeCsvCell(entry.notes ?? ''),
      ];
      csvLines.push(line.join(','));
    });
    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studyo_study_log_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Row click dispatcher: opens the form on top ONLY if enableTopForm is true; otherwise toggles inline accordion
  const handleRowClick = (entry: DailyLogEntry) => {
    if (enableTopForm) {
      handleSelectDayForForm(entry);
    } else {
      handleToggleExpand(entry);
    }
  };

  // Save form
  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: DailyLogEntry = {
      date: formDate,
      studyHours: studyHours === '' ? null : Math.max(0, Number(studyHours)),
      attendedClass,
      pyqsSolved: pyqsSolved === '' ? null : Math.max(0, Number(pyqsSolved)),
      revisionDone,
      mockTestTaken,
      sleepHours: sleepHours === '' ? null : Math.max(0, Number(sleepHours)),
      focusRating: focusRating ?? null,
      notes: notes.trim(),
      customData: formCustomData,
    };
    addOrUpdateDailyLog(newEntry);
    setShowForm(false);
  };

  // Quick Open Add Row Modal for Today or Any Past Date
  const handleOpenAddRowModal = (targetDate?: string) => {
    const d = targetDate || todayStr;
    setAddRowDate(d);
    const existing = dailyLogs.find((l) => l.date === d);
    if (existing) {
      setAddRowStudyHours(existing.studyHours != null && existing.studyHours > 0 ? existing.studyHours : '');
      setAddRowAttendedClass(normalizeTriState(existing.attendedClass));
      setAddRowPyqs(existing.pyqsSolved != null && existing.pyqsSolved > 0 ? existing.pyqsSolved : '');
      setAddRowRevisionDone(normalizeTriState(existing.revisionDone));
      setAddRowMockTest(normalizeTriState(existing.mockTestTaken));
      setAddRowSleepHours(existing.sleepHours != null && existing.sleepHours > 0 ? existing.sleepHours : '');
      setAddRowRating(existing.focusRating && existing.focusRating > 0 ? existing.focusRating : null);
      setAddRowNotes(existing.notes || '');
      setAddRowCustomData({ ...(existing.customData || {}) });
    } else {
      setAddRowStudyHours('');
      setAddRowAttendedClass('na');
      setAddRowPyqs('');
      setAddRowRevisionDone('na');
      setAddRowMockTest('na');
      setAddRowSleepHours('');
      setAddRowRating(null);
      setAddRowNotes('');
      const initCustom: Record<string, any> = {};
      customColumns.forEach((col) => {
        if (col.type === 'boolean') initCustom[col.id] = 'na';
        else if (col.type === 'select' && col.options && col.options.length > 0) initCustom[col.id] = col.options[0];
        else initCustom[col.id] = '';
      });
      setAddRowCustomData(initCustom);
    }
    setShowAddRowModal(true);
  };

  // Handle changing the date inside the Add Row modal
  const handleAddRowDateChange = (newDate: string) => {
    setAddRowDate(newDate);
    const existing = dailyLogs.find((l) => l.date === newDate);
    if (existing) {
      setAddRowStudyHours(existing.studyHours != null && existing.studyHours > 0 ? existing.studyHours : '');
      setAddRowAttendedClass(normalizeTriState(existing.attendedClass));
      setAddRowPyqs(existing.pyqsSolved != null && existing.pyqsSolved > 0 ? existing.pyqsSolved : '');
      setAddRowRevisionDone(normalizeTriState(existing.revisionDone));
      setAddRowMockTest(normalizeTriState(existing.mockTestTaken));
      setAddRowSleepHours(existing.sleepHours != null && existing.sleepHours > 0 ? existing.sleepHours : '');
      setAddRowRating(existing.focusRating && existing.focusRating > 0 ? existing.focusRating : null);
      setAddRowNotes(existing.notes || '');
      setAddRowCustomData({ ...(existing.customData || {}) });
    } else {
      setAddRowStudyHours('');
      setAddRowAttendedClass('na');
      setAddRowPyqs('');
      setAddRowRevisionDone('na');
      setAddRowMockTest('na');
      setAddRowSleepHours('');
      setAddRowRating(null);
      setAddRowNotes('');
      const initCustom: Record<string, any> = {};
      customColumns.forEach((col) => {
        if (col.type === 'boolean') initCustom[col.id] = 'na';
        else if (col.type === 'select' && col.options && col.options.length > 0) initCustom[col.id] = col.options[0];
        else initCustom[col.id] = '';
      });
      setAddRowCustomData(initCustom);
    }
  };

  // Submit Add Row from Modal
  const handleSubmitAddRowModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addRowDate) return;
    const newEntry: DailyLogEntry = {
      date: addRowDate,
      studyHours: addRowStudyHours === '' ? null : Math.max(0, Number(addRowStudyHours)),
      attendedClass: addRowAttendedClass,
      pyqsSolved: addRowPyqs === '' ? null : Math.max(0, Number(addRowPyqs)),
      revisionDone: addRowRevisionDone,
      mockTestTaken: addRowMockTest,
      sleepHours: addRowSleepHours === '' ? null : Math.max(0, Number(addRowSleepHours)),
      focusRating: addRowRating ?? null,
      notes: addRowNotes.trim(),
      customData: addRowCustomData,
    };
    addOrUpdateDailyLog(newEntry);

    // If current month filter would hide this new date, switch to 'all' so user sees it right away
    if (selectedMonthYear !== 'all') {
      const entryMonth = addRowDate.substring(0, 7);
      if (selectedMonthYear !== entryMonth && selectedMonthYear !== 'last30') {
        setSelectedMonthYear('all');
      }
    }

    setShowAddRowModal(false);
  };

  // Save accordion full day edits atomically
  const handleSaveAccordion = (date: string) => {
    if (!accordionState) return;
    const updatedEntry: DailyLogEntry = {
      date,
      studyHours: accordionState.studyHours === '' ? null : Math.max(0, Number(accordionState.studyHours)),
      attendedClass: accordionState.attendedClass,
      pyqsSolved: accordionState.pyqsSolved === '' ? null : Math.max(0, Number(accordionState.pyqsSolved)),
      revisionDone: accordionState.revisionDone,
      mockTestTaken: accordionState.mockTestTaken,
      sleepHours: accordionState.sleepHours === '' ? null : Math.max(0, Number(accordionState.sleepHours)),
      focusRating: accordionState.focusRating ?? null,
      notes: accordionState.notes.trim(),
      customData: accordionState.customData || {},
    };
    addOrUpdateDailyLog(updatedEntry);
    setExpandedDate(null);
    setAccordionState(null);
  };

  // Add single option to newColOptions
  const handleAddOptionToNewCol = (optText?: string) => {
    const textToAdd = (optText !== undefined ? optText : newColOptionInput).trim();
    if (!textToAdd) return;
    const currentList = newColOptions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!currentList.includes(textToAdd)) {
      currentList.push(textToAdd);
      setNewColOptions(currentList.join(', '));
    }
    setNewColOptionInput('');
  };

  // Remove single option from newColOptions
  const handleRemoveOptionFromNewCol = (optToRemove: string) => {
    const currentList = newColOptions
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = currentList.filter((o) => o !== optToRemove);
    setNewColOptions(updated.join(', '));
  };

  // Add single option to editingColumn.options
  const handleAddOptionToEditCol = (optText?: string) => {
    if (!editingColumn) return;
    const textToAdd = (optText !== undefined ? optText : editColOptionInput).trim();
    if (!textToAdd) return;
    const currentList = (editingColumn.options || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!currentList.includes(textToAdd)) {
      currentList.push(textToAdd);
      setEditingColumn({ ...editingColumn, options: currentList.join(', ') });
    }
    setEditColOptionInput('');
  };

  // Remove single option from editingColumn.options
  const handleRemoveOptionFromEditCol = (optToRemove: string) => {
    if (!editingColumn) return;
    const currentList = (editingColumn.options || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const updated = currentList.filter((o) => o !== optToRemove);
    setEditingColumn({ ...editingColumn, options: updated.join(', ') });
  };

  // Create new custom column
  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    const opts =
      newColType === 'select'
        ? newColOptions
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        : undefined;

    addCustomColumn({
      name: newColName.trim(),
      type: newColType,
      options: opts && opts.length > 0 ? opts : ['Good', 'Okay', 'Bad'],
    });

    setNewColName('');
    setNewColType('boolean');
    setNewColOptions('');
    setNewColOptionInput('');
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

    updateCustomColumn(editingColumn.id, {
      name: editingColumn.name.trim(),
      type: editingColumn.type,
      options: opts && opts.length > 0 ? opts : ['Good', 'Okay', 'Bad'],
    });
    setEditingColumn(null);
  };

  // Delete column
  const handleDeleteColumn = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" column and its tracked values?`)) {
      deleteCustomColumn(id);
      setEditingColumn(null);
    }
  };

  // Move column left or right
  const handleMoveColumn = (currentIndex: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= customColumns.length) return;
    reorderCustomColumns(currentIndex, targetIndex);
    if (editingColumn) {
      setEditingColumn({ ...editingColumn, index: targetIndex });
    }
  };

  // Delete day log entry
  const handleDeleteEntry = (date: string) => {
    if (window.confirm(`Delete log entry for ${formatDateDisplay(date)}?`)) {
      deleteDailyLog(date);
      setExpandedDate(null);
      setAccordionState(null);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4 sm:space-y-7 pb-8 sm:pb-12 animate-fadeIn">
      {/* 0. Multi-Table Capsule Switcher Dock — compact single-line scroll on mobile */}
      <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3.5 border-b border-black/10 dark:border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0 flex-1">
          {/* Main Daily Study Log Tab */}
          <button
            type="button"
            onClick={() => setActiveTableId('main')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${activeTableId === 'main'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_15px_rgba(233,118,43,0.3)]'
              : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white border border-stone-300/80 dark:border-white/12'
              }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Study Log</span>
            {isDefaultTableDeleted && (
              <span className="text-[8px] px-1 py-0.2 rounded-full bg-red-500/20 text-red-400 font-bold uppercase">
                Deleted
              </span>
            )}
          </button>

          {/* User Custom Tables */}
          {(customTables || []).map((tbl) => (
            <button
              key={tbl.id}
              type="button"
              onClick={() => setActiveTableId(tbl.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap active:scale-95 ${activeTableId === tbl.id
                ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_15px_rgba(233,118,43,0.3)]'
                : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white border border-stone-300/80 dark:border-white/12'
                }`}
            >
              <Table2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-none">{tbl.title}</span>
            </button>
          ))}

          {/* + Add Table Button */}
          <button
            type="button"
            onClick={() => {
              setNewTableTitle('');
              setNewTableDesc('');
              setSelectedTemplate('mock');
              setShowCreateTableModal(true);
            }}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full glass-pill hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border border-dashed border-stone-300/80 dark:border-white/20 hover:border-[#e9762b] cursor-pointer flex items-center gap-1 shrink-0 whitespace-nowrap active:scale-95"
            title="Create a new custom table"
          >
            <Plus className="w-3.5 h-3.5 text-[#e9762b]" />
            <span className="hidden xs:inline sm:inline">Add Table</span>
            <span className="xs:hidden sm:hidden">Table</span>
          </button>
        </div>

        {/* Right: Cloud Sync Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const u = useAuthStore.getState().currentUser;
              const s = useAuthStore.getState().session;
              if (u?.id && u.id !== 'demo-user-1' && s?.token && s.token !== 'demo-token') {
                syncUserData(u.id, true);
              } else {
                useAuthStore.getState().setAuthModalView('login');
              }
            }}
            disabled={isSyncing}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full glass-pill hover:bg-stone-200/60 dark:hover:bg-white/10 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 shrink-0 ${isSyncing
              ? 'opacity-70 animate-pulse text-[#e9762b] border-[#e9762b]/50'
              : syncError
                ? 'text-red-400 border-red-500/50 bg-red-500/10 hover:bg-red-500/20'
                : justSynced
                  ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10'
                  : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white border-stone-300/80 dark:border-white/15 hover:border-[#e9762b]'
              }`}
            title={syncError || 'Sync study log with cloud'}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3 h-3 text-[#e9762b] animate-spin" />
                <span className="hidden sm:inline">Syncing...</span>
              </>
            ) : syncError ? (
              <>
                <X className="w-3 h-3 text-red-400" />
                <span className="text-red-400 text-[10px] sm:text-xs">Retry</span>
              </>
            ) : justSynced ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 hidden xs:inline sm:inline">Synced</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 text-stone-500" />
                <span className="hidden xs:inline sm:inline">Sync</span>
              </>
            )}
          </button>
          {syncError && (
            <button
              type="button"
              onClick={() => useAuthStore.getState().setAuthModalView('login')}
              className="text-[10px] font-mono text-red-400 hover:text-red-300 hover:underline max-w-[240px] leading-tight text-left cursor-pointer"
              title="Click to sign in"
            >
              {syncError}
            </button>
          )}
        </div>
      </div>

      {activeTableId !== 'main' && activeCustomTable ? (
        <CustomStudyTableView table={activeCustomTable} />
      ) : (
        <>
          {/* 3. Log an Entry (Quick Add / Edit Form) - ONLY SHOWN WHEN ENABLED VIA TOGGLE */}
          {enableTopForm && showForm && (
            <div
              id="log-form-container"
              className="w-full p-6 sm:p-8 rounded-2xl glass-panel-glow shadow-2xl space-y-6 animate-fadeIn"
            >
              {/* Form Top Title */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-orange-950/10 dark:border-white/10 pb-4">
                <h2 className="text-lg font-bold text-stone-900 dark:text-white font-mono">
                  Editing – {formatDateDisplay(formDate)}
                </h2>
              </div>

              <form onSubmit={handleSaveEntry} className="space-y-6">
                {/* Row 1: Date Picker */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <span className="text-stone-500 dark:text-slate-400 uppercase tracking-widest font-bold">DATE</span>
                  <button
                    type="button"
                    onClick={() => handleSelectDayForForm(undefined, todayStr)}
                    className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition cursor-pointer ${formDate === todayStr
                      ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                      : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                      }`}
                  >
                    TODAY
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDayForForm(undefined, yesterdayStr)}
                    className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition cursor-pointer ${formDate === yesterdayStr
                      ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                      : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                      }`}
                  >
                    YESTERDAY
                  </button>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => handleSelectDayForForm(undefined, e.target.value)}
                    className="glass-input rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Row 1: Numerical & Rating Fields (Study Hours, PYQs, Sleep Hours, Focus Rating) - 4 in a row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  {/* Study Hours */}
                  <div className="space-y-1.5 glass-panel p-3 rounded-xl">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                      STUDY HOURS
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="--"
                        value={studyHours}
                        onChange={(e) => setStudyHours(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                        className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-stone-900 dark:text-white font-mono text-center font-bold focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                      />
                      <span className="text-xs text-slate-400 font-bold">hrs</span>
                    </div>
                  </div>

                  {/* PYQs Solved */}
                  <div className="space-y-1.5 glass-panel p-3 rounded-xl">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                      PYQS SOLVED
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="--"
                        value={pyqsSolved}
                        onChange={(e) => setPyqsSolved(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                        className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-stone-900 dark:text-white font-mono text-center font-bold focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                      />
                      <span className="text-xs text-slate-400 font-bold">ques</span>
                    </div>
                  </div>

                  {/* Sleep Hours */}
                  <div className="space-y-1.5 glass-panel p-3 rounded-xl">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                      SLEEP HOURS
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="--"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                        className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-stone-900 dark:text-white font-mono text-center font-bold focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                      />
                      <span className="text-xs text-slate-400 font-bold">hrs</span>
                    </div>
                  </div>

                  {/* Focus Rating */}
                  <div className="space-y-1.5 glass-panel p-3 rounded-xl">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                      FOCUS ({focusRating ? `${focusRating}/5` : '--'})
                    </label>
                    <div className="grid grid-cols-5 gap-1 pt-1 w-full min-w-0">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFocusRating(focusRating === val ? null : val)}
                          className={`h-7 w-full min-w-0 rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center p-0 ${focusRating === val
                            ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/30'
                            : 'glass-pill text-stone-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                            }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Habit Indicators (Class, Revision, Mock + Custom Tri-State Trackers) - 4 in a row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono text-xs">
                  {/* Attended Class */}
                  <div className="space-y-1.5 glass-panel p-3 rounded-xl">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                      ATTENDED CLASS?
                    </label>
                    <TriStatePillSelect
                      size="sm"
                      value={attendedClass}
                      onChange={setAttendedClass}
                    />
                  </div>

                  {/* Revision Done */}
                  <div className="space-y-1.5 glass-panel p-3 rounded-xl">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                      REVISION DONE?
                    </label>
                    <TriStatePillSelect
                      size="sm"
                      value={revisionDone}
                      onChange={setRevisionDone}
                    />
                  </div>

                  {/* Mock Test Taken */}
                  <div className="space-y-1.5 glass-panel p-3 rounded-xl">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                      MOCK TEST?
                    </label>
                    <TriStatePillSelect
                      size="sm"
                      value={mockTestTaken}
                      onChange={setMockTestTaken}
                    />
                  </div>

                  {/* Custom Tri-State Trackers in Top Form */}
                  {customColumns
                    .filter((col) => col.type === 'boolean')
                    .map((col) => (
                      <div key={col.id} className="space-y-1.5 glass-panel p-3 rounded-xl">
                        <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                          {col.name.toUpperCase()}?
                        </label>
                        <TriStatePillSelect
                          size="sm"
                          value={formCustomData[col.id]}
                          onChange={(val) =>
                            setFormCustomData({ ...formCustomData, [col.id]: val })
                          }
                        />
                      </div>
                    ))}

                  {/* Quick Add Custom Habit/Tracker in 4th slot if no boolean columns exist */}
                  {customColumns.filter((col) => col.type === 'boolean').length === 0 && (
                    <div className="space-y-1.5 glass-panel p-3 rounded-xl flex flex-col justify-between border border-dashed border-stone-300 dark:border-white/20 hover:border-[#e9762b] dark:hover:border-[#e9762b] transition-all">
                      <label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-slate-400 block font-bold truncate">
                        CUSTOM TRACKER
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setNewColType('boolean');
                          setShowAddColumnModal(true);
                        }}
                        className="w-full h-8 rounded-lg bg-orange-500/10 hover:bg-[#e9762b] text-[#e9762b] hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        title="Add a custom Yes/No/NA tracker column"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD TRACKER</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Row 3: Notes */}
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold">
                    NOTES &amp; OBSERVATIONS <span className="opacity-60">(optional)</span>
                  </label>
                  <input
                    id="log-form-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything worth remembering about today..."
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
                  />
                </div>

                {/* Row 4: Additional Custom Trackers (Numbers, Select, Text) */}
                {customColumns.some((col) => col.type !== 'boolean') && (
                  <div className="space-y-3 pt-3 border-t border-white/10 font-mono">
                    <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                      ADDITIONAL CUSTOM TRACKERS
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {customColumns
                        .filter((col) => col.type !== 'boolean')
                        .map((col) => (
                          <div key={col.id} className="space-y-1.5 glass-panel p-3 rounded-xl">
                            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                              {col.name}
                            </label>
                            {col.type === 'number' && (
                              <input
                                type="number"
                                step="any"
                                value={formCustomData[col.id] ?? ''}
                                onChange={(e) =>
                                  setFormCustomData({
                                    ...formCustomData,
                                    [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                  })
                                }
                                placeholder="Enter number..."
                                className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#e9762b]"
                              />
                            )}
                            {col.type === 'text' && (
                              <input
                                type="text"
                                value={formCustomData[col.id] ?? ''}
                                onChange={(e) =>
                                  setFormCustomData({ ...formCustomData, [col.id]: e.target.value })
                                }
                                placeholder="Enter text..."
                                className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#e9762b]"
                              />
                            )}
                            {col.type === 'select' && (
                              <select
                                value={formCustomData[col.id] ?? ''}
                                onChange={(e) =>
                                  setFormCustomData({ ...formCustomData, [col.id]: e.target.value })
                                }
                                className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-[#e9762b] cursor-pointer"
                              >
                                <option value="" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">
                                  -- Select --
                                </option>
                                {(col.options || []).map((opt) => (
                                  <option key={opt} value={opt} className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            )}
                            {col.type === 'rating' && (
                              <select
                                value={formCustomData[col.id] ?? ''}
                                onChange={(e) =>
                                  setFormCustomData({
                                    ...formCustomData,
                                    [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                  })
                                }
                                className="w-full glass-input rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-white font-bold text-center focus:outline-none focus:border-[#e9762b] cursor-pointer"
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
                  </div>
                )}

                {/* Form Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2.5 rounded-full bg-stone-200/90 hover:bg-stone-300 dark:bg-[#141413] dark:hover:bg-[#1f1f1e] border border-stone-300/80 dark:border-white/10 text-stone-700 dark:text-slate-400 hover:text-black dark:hover:text-white text-xs uppercase font-bold tracking-wider transition cursor-pointer shadow-sm"
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

          {/* 4. Study Log Table Section */}
          <div className="space-y-4">
            {isDefaultTableDeleted ? (
              <div className="w-full p-8 sm:p-12 rounded-2xl glass-panel text-center space-y-4 border border-dashed border-red-500/40 animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto shadow-inner">
                  <Trash2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-bold font-mono text-stone-900 dark:text-white uppercase tracking-tight">
                    Default Study Log Table Deleted
                  </h2>
                  <p className="text-xs sm:text-sm font-mono text-stone-600 dark:text-slate-400 max-w-md mx-auto">
                    This table is hidden. All your previous logs remain safely saved in your account and can be restored anytime.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={restoreDefaultTable}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#e9762b] text-black font-mono font-bold text-xs uppercase tracking-wider hover:brightness-110 transition shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore Study Log Table</span>
                </button>
              </div>
            ) : (
              <>
                {/* Clean Modern Top Toolbar — Compact 2-row layout on mobile */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5 sm:gap-5 font-mono pb-2.5 sm:pb-5 border-b border-white/10">
                  {/* Left Side: Title, Entries Pill, Subtitle */}
                  <div className="flex flex-col gap-1 select-none">
                    <div className="flex items-center gap-2 sm:gap-3.5">
                      <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-stone-900 dark:text-white uppercase tracking-tight font-mono break-words min-w-0">
                        {mainTableTitle || 'Study Log'}
                      </h1>
                      <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-extrabold tracking-wider bg-orange-500/15 text-[#e9762b] border border-orange-500/35 uppercase shadow-sm">
                        {filteredDailyLogs.length} {filteredDailyLogs.length === 1 ? 'ENTRY' : 'ENTRIES'}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 font-mono tracking-tight">
                      {mainTableDescription || 'Daily Habit, Hours & Performance Tracker'}
                    </p>
                  </div>

                  {/* Right Side Action Cluster — clean, compact 2-row layout on mobile */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
                    {/* Row 1 on mobile: Search + Month side-by-side */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Instant Search Input */}
                      <div className="relative flex-1 sm:w-56 sm:flex-initial">
                        <Search className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          ref={mainSearchInputRef}
                          type="text"
                          value={mainSearchQuery}
                          onChange={(e) => setMainSearchQuery(e.target.value)}
                          placeholder="Search logs..."
                          className="pl-8 pr-7 py-1.5 sm:py-2 w-full rounded-full glass-input text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#e9762b] font-mono transition-all"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          {mainSearchQuery ? (
                            <button
                              type="button"
                              onClick={() => setMainSearchQuery('')}
                              className="text-stone-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          ) : (
                            <span className="hidden sm:inline-block text-[9px] text-stone-500 dark:text-slate-500 px-1 py-0.5 rounded border border-white/10 font-mono">
                              /
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Month Filter Dropdown */}
                      <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full glass-pill border border-white/12 text-xs font-mono shrink-0">
                        <Calendar className="w-3.5 h-3.5 text-[#e9762b]" />
                        <select
                          value={selectedMonthYear}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedMonthYear(val);
                            setVisibleLimit(val === 'last30' ? 30 : 25);
                          }}
                          className="bg-transparent text-xs text-[#e9762b] focus:outline-none font-bold cursor-pointer font-mono"
                        >
                          <option value="all" className="bg-[#141413] text-[#e9762b]">All</option>
                          <option value="last30" className="bg-[#141413] text-white">Last 30d</option>
                          {availableMonths.map((m) => (
                            <option key={m.value} value={m.value} className="bg-[#141413] text-white">
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2 on mobile: 3 action buttons side-by-side */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* Primary NEW ENTRY Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenAddRowModal(todayStr)}
                        className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-b from-[#f28238] to-[#e9762b] hover:brightness-110 text-black font-mono font-black text-xs uppercase tracking-wider active:scale-95 transition-all duration-200 cursor-pointer shadow-[0_2px_12px_-2px_rgba(233,118,43,0.4)] border border-orange-300/30 whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>NEW ENTRY</span>
                      </button>

                      {/* Full Table View Button */}
                      <button
                        type="button"
                        onClick={() => setIsFullTableView(true)}
                        className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full glass-pill hover:bg-white/10 text-stone-700 dark:text-slate-200 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border border-white/12 hover:border-[#e9762b] cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                        title="Open full-screen immersive spreadsheet table view"
                      >
                        <Maximize2 className="w-3 h-3 text-[#e9762b]" />
                        <span>FULL TABLE</span>
                      </button>

                      {/* Dedicated Settings Button */}
                      <button
                        type="button"
                        onClick={() => setShowColumnsManagerModal(true)}
                        className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-full glass-pill hover:bg-white/10 text-stone-700 dark:text-slate-200 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border border-white/12 hover:border-[#e9762b] cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                        title="Open Table Settings"
                      >
                        <Settings2 className="w-3.5 h-3.5 text-[#e9762b]" />
                        <span>SETTINGS</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Container with Sticky Horizontal & Vertical Scroll */}
                <div ref={tableSectionRef} className="w-full rounded-2xl sm:rounded-3xl glass-panel overflow-hidden font-mono shadow-2xl scroll-mt-24">
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

                  <div
                    ref={tableContainerRef}
                    className="overflow-x-auto max-h-[62dvh] sm:max-h-[82vh] overflow-y-auto table-scroll-container relative scrollbar-thin scrollbar-thumb-white/20"
                  >
                    <table className="w-full min-w-full text-left text-sm border-separate border-spacing-0">
                      {/* Sticky Top Header with Sort Affordances */}
                      <thead
                        className="sticky top-0 z-40 glass-table-header select-none"
                      >
                        <tr className="text-[11px] sm:text-[13px] text-stone-800 dark:text-slate-200 uppercase tracking-[0.14em] font-bold">
                          {/* Sticky Date Column Header (First row, first column) */}
                          <th
                            className="py-2.5 sm:py-4 px-2 sm:px-5 font-bold sticky left-0 top-0 z-50 glass-sticky-th border-r border-white/12 min-w-[88px] w-[88px] sm:min-w-[152px] sm:w-[152px] group"
                          >
                            <div className="flex items-center gap-2">
                              <span>DATE</span>
                              {showSortArrows && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMainSort('date');
                                  }}
                                  className="p-1 -m-1 rounded hover:bg-white/10 text-[#e9762b] transition cursor-pointer"
                                  title="Sort by date"
                                  aria-label="Sort by date"
                                >
                                  {mainSortField === 'date' ? (
                                    <span className="text-[#e9762b] text-[10px] font-bold">{mainSortAsc ? '▲' : '▼'}</span>
                                  ) : (
                                    <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 hover:text-white" />
                                  )}
                                </button>
                              )}
                            </div>
                          </th>

                          {/* Dynamic Default Columns */}
                          {DEFAULT_COLUMNS_CONFIG.map((col) => {
                            if (deletedDefaultColumns.includes(col.key)) return null;
                            const isSorted = mainSortField === col.key;
                            return (
                              <th
                                key={col.key}
                                className={`py-2.5 sm:py-4 px-2 sm:px-5 font-bold text-center sticky top-0 z-40 ${col.minWidth} group/col select-none text-[11px] sm:text-xs`}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span>{col.label}</span>
                                  {showSortArrows && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMainSort(col.key);
                                      }}
                                      className="p-1 -m-1 rounded hover:bg-white/10 text-[#e9762b] transition cursor-pointer"
                                      title={`Sort by ${col.label}`}
                                      aria-label={`Sort by ${col.label}`}
                                    >
                                      {isSorted ? (
                                        <span className="text-[#e9762b] text-[10px] font-bold">{mainSortAsc ? '▲' : '▼'}</span>
                                      ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 hover:text-white" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </th>
                            );
                          })}

                          {/* Dynamic Custom Column Headers */}
                          {customColumns.map((col) => {
                            const isSorted = mainSortField === col.id;
                            return (
                              <th
                                key={col.id}
                                className="py-2.5 sm:py-4 px-2.5 sm:px-5 font-bold text-center whitespace-nowrap sticky top-0 z-40 min-w-[90px] sm:min-w-[144px] max-w-[200px] group/customcol select-none text-[11px] sm:text-xs"
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <span className="text-[11px] sm:text-[13px] uppercase tracking-[0.14em] font-bold text-stone-800 dark:text-slate-200 truncate max-w-[130px] font-mono">
                                    {formatColumnHeader(col.name, col.unit)}
                                  </span>
                                  {showSortArrows && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMainSort(col.id);
                                      }}
                                      className="p-1 -m-1 rounded hover:bg-white/10 text-[#e9762b] transition cursor-pointer"
                                      title={`Sort by ${col.name}`}
                                      aria-label={`Sort by ${col.name}`}
                                    >
                                      {isSorted ? (
                                        <span className="text-[#e9762b] text-[10px] font-bold">{mainSortAsc ? '▲' : '▼'}</span>
                                      ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 hover:text-white" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </th>
                            );
                          })}

                          {/* Subtle Action Column Header */}
                          <th aria-label="Actions" className="py-2.5 sm:py-4 px-2 font-bold text-center sticky top-0 z-40 w-12 sm:w-16 text-stone-500 rounded-tr-xl text-[11px] sm:text-xs">
                            •••
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.07]">
                        {visibleLogs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={totalDefaultTableCols}
                              className="py-16 text-center text-stone-500 dark:text-slate-400 font-mono text-sm"
                            >
                              <div className="flex flex-col items-center justify-center space-y-4">
                                <Calendar className="w-10 h-10 text-[#e9762b] opacity-60" />
                                <p>No log entries found for this period.</p>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddRowModal(todayStr)}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e9762b] text-black text-xs sm:text-sm font-bold uppercase tracking-wider hover:brightness-110 transition shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>Add Date Row</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          visibleLogs.map((entry, idx) => {
                            const isExpanded = expandedDate === entry.date;
                            const hasNote = Boolean(entry.notes && entry.notes.trim().length > 0);
                            return (
                              <React.Fragment key={entry.date}>
                                <tr
                                  id={`log-row-${entry.date}`}
                                  className={`even:bg-white/[0.012] hover:bg-white/[0.04] transition-colors duration-150 group/row ${isExpanded ? '!bg-white/[0.05]' : ''
                                    }`}
                                >
                                  {/* Pinned / Sticky Date Column - Click to open details & edit */}
                                  <td
                                    onClick={() => handleToggleExpand(entry)}
                                    className={`py-2 sm:py-3.5 px-2 sm:px-5 whitespace-nowrap sticky left-0 z-20 glass-sticky-col-cell border-r border-black/10 dark:border-white/10 min-w-[88px] w-[88px] sm:min-w-[152px] sm:w-[152px] cursor-pointer ${isExpanded ? '!bg-amber-500/15 dark:!bg-[#1a1a18]' : ''
                                      }`}
                                    title="Click date to open details & edit"
                                  >
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleExpand(entry);
                                        }}
                                        className={`inline-flex items-center justify-center px-2 sm:px-3.5 py-1 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-[13px] font-extrabold tracking-wide transition-all duration-150 cursor-pointer select-none font-mono uppercase ${isExpanded
                                          ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/25'
                                          : 'text-[#e9762b] bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/35 hover:border-orange-500/60'
                                          }`}
                                        title="Click date to open details & edit"
                                      >
                                        <span>{formatDateDisplay(entry.date)}</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* Study Hours Column */}
                                  {!deletedDefaultColumns.includes('studyHours') && (
                                    <td className="py-2 sm:py-3.5 px-2 sm:px-5 text-center min-w-[76px] sm:min-w-[120px]">
                                      {entry.studyHours != null && Number(entry.studyHours) > 0 ? (
                                        <span className="text-stone-900 dark:text-white font-mono-numbers font-bold text-xs sm:text-[15px]">{entry.studyHours}h</span>
                                      ) : (
                                        <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm select-none">--</span>
                                      )}
                                    </td>
                                  )}

                                  {/* Class Attended Pill */}
                                  {!deletedDefaultColumns.includes('attendedClass') && (
                                    <td className="py-2 sm:py-3.5 px-2 sm:px-5 text-center min-w-[76px] sm:min-w-[114px]">
                                      <TriStateBadge
                                        value={entry.attendedClass}
                                        onChange={(newVal) => updateDailyLogField(entry.date, 'attendedClass', newVal)}
                                        cycleEnabled={enableClickToCycle}
                                        className="mx-auto"
                                      />
                                    </td>
                                  )}

                                  {/* PYQs Solved */}
                                  {!deletedDefaultColumns.includes('pyqsSolved') && (
                                    <td className="py-2 sm:py-3.5 px-2 sm:px-5 text-center min-w-[76px] sm:min-w-[114px]">
                                      {entry.pyqsSolved != null && Number(entry.pyqsSolved) > 0 ? (
                                        <span className="text-stone-900 dark:text-white font-mono-numbers font-bold text-xs sm:text-[15px]">{entry.pyqsSolved}</span>
                                      ) : (
                                        <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm select-none">--</span>
                                      )}
                                    </td>
                                  )}

                                  {/* Revision Done Pill */}
                                  {!deletedDefaultColumns.includes('revisionDone') && (
                                    <td className="py-2 sm:py-3.5 px-2 sm:px-5 text-center min-w-[76px] sm:min-w-[114px]">
                                      <TriStateBadge
                                        value={entry.revisionDone}
                                        onChange={(newVal) => updateDailyLogField(entry.date, 'revisionDone', newVal)}
                                        cycleEnabled={enableClickToCycle}
                                        className="mx-auto"
                                      />
                                    </td>
                                  )}

                                  {/* Mock Test Taken Pill */}
                                  {!deletedDefaultColumns.includes('mockTestTaken') && (
                                    <td className="py-2 sm:py-3.5 px-2 sm:px-5 text-center min-w-[76px] sm:min-w-[114px]">
                                      <TriStateBadge
                                        value={entry.mockTestTaken}
                                        onChange={(newVal) => updateDailyLogField(entry.date, 'mockTestTaken', newVal)}
                                        cycleEnabled={enableClickToCycle}
                                        className="mx-auto"
                                      />
                                    </td>
                                  )}

                                  {/* Sleep Hours */}
                                  {!deletedDefaultColumns.includes('sleepHours') && (
                                    <td className="py-2 sm:py-3.5 px-2 sm:px-5 text-center min-w-[76px] sm:min-w-[114px]">
                                      {entry.sleepHours != null && Number(entry.sleepHours) > 0 ? (
                                        <span className="text-stone-900 dark:text-white font-mono-numbers font-bold text-xs sm:text-[15px]">{entry.sleepHours}h</span>
                                      ) : (
                                        <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm select-none">--</span>
                                      )}
                                    </td>
                                  )}

                                  {/* Notes Column with Rich In-Place Note Viewer */}
                                  {!deletedDefaultColumns.includes('notes') && (
                                    <td
                                      className="py-2 sm:py-3.5 px-2 sm:px-5 text-center min-w-[84px] sm:min-w-[124px] relative"
                                    >
                                      {hasNote ? (
                                        <div className="relative inline-flex items-center justify-center group/note">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveViewNoteDate(activeViewNoteDate === entry.date ? null : entry.date);
                                            }}
                                            className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold text-orange-950 dark:text-[#e9762b] bg-orange-500/20 dark:bg-orange-500/15 hover:bg-orange-500/30 border border-orange-500/40 dark:border-orange-500/35 transition cursor-pointer select-none active:scale-95 shadow-sm"
                                            title="Click to view note"
                                          >
                                            Note
                                          </button>

                                          {/* Desktop Hover Tooltip */}
                                          {activeViewNoteDate !== entry.date && (
                                            <div className="opacity-0 group-hover/note:opacity-100 pointer-events-none transition-opacity duration-200 absolute bottom-full mb-2 z-40 left-1/2 -translate-x-1/2 glass-modal text-xs px-4 py-2.5 rounded-xl shadow-2xl max-w-sm min-w-[180px] sm:min-w-[220px] text-left whitespace-normal border border-white/10">
                                              <span className="text-[10px] text-[#e9762b] uppercase font-bold tracking-wider block mb-1 font-mono">
                                                {formatDateDisplay(entry.date).toUpperCase()} NOTE:
                                              </span>
                                              <p className="text-stone-900 dark:text-slate-200 text-xs sm:text-sm leading-relaxed break-words font-mono whitespace-pre-wrap">
                                                {entry.notes}
                                              </p>
                                              <div className="w-2 h-2 glass-modal border-r border-b border-white/20 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                            </div>
                                          )}

                                          {/* In-place Note Tooltip Bubble when Clicked */}
                                          {activeViewNoteDate === entry.date && (
                                            <>
                                              <div
                                                className="fixed inset-0 z-40"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveViewNoteDate(null);
                                                }}
                                              />
                                              <div
                                                className="absolute bottom-full mb-2 z-50 left-1/2 -translate-x-1/2 glass-modal text-xs px-4 py-2.5 rounded-xl shadow-2xl max-w-sm min-w-[180px] sm:min-w-[220px] text-left whitespace-normal border border-white/10 animate-in fade-in zoom-in-95 duration-150"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <span className="text-[10px] text-[#e9762b] uppercase font-bold tracking-wider block mb-1 font-mono">
                                                  {formatDateDisplay(entry.date).toUpperCase()} NOTE:
                                                </span>
                                                <p className="text-stone-900 dark:text-slate-200 text-xs sm:text-sm leading-relaxed break-words font-mono whitespace-pre-wrap select-text">
                                                  {entry.notes}
                                                </p>
                                                <div className="w-2 h-2 glass-modal border-r border-b border-white/20 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm select-none">
                                          --
                                        </span>
                                      )}
                                    </td>
                                  )}

                                  {/* Focus Rating */}
                                  {!deletedDefaultColumns.includes('focusRating') && (
                                    <td className="py-2 sm:py-3.5 px-2 sm:px-5 text-center text-stone-900 dark:text-slate-200 font-mono-numbers font-bold text-xs sm:text-[15px] min-w-[76px] sm:min-w-[120px]">
                                      {entry.focusRating != null && Number(entry.focusRating) > 0 ? (
                                        <span>{entry.focusRating}/5</span>
                                      ) : (
                                        <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm font-normal select-none">--</span>
                                      )}
                                    </td>
                                  )}

                                  {/* Dynamic Custom Column Cells */}
                                  {customColumns.map((col) => {
                                    const val = entry.customData?.[col.id];
                                    return (
                                      <td key={col.id} className="py-2 sm:py-3.5 px-2 sm:px-5 text-center whitespace-nowrap font-mono text-xs sm:text-[15px] min-w-[90px] sm:min-w-[144px] max-w-[200px]">
                                        {col.type === 'boolean' && (
                                          <TriStateBadge
                                            value={val}
                                            onChange={(newVal) => updateDailyLogCustomField(entry.date, col.id, newVal)}
                                            cycleEnabled={enableClickToCycle}
                                            className="mx-auto"
                                          />
                                        )}
                                        {col.type === 'number' && (
                                          val !== undefined && val !== null && val !== '' && Number(val) > 0 ? (
                                            <span className="text-stone-900 dark:text-white font-mono-numbers font-bold">{val}</span>
                                          ) : (
                                            <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm select-none">--</span>
                                          )
                                        )}
                                        {col.type === 'text' && (
                                          val && String(val).trim() ? (
                                            <span
                                              className="text-stone-800 dark:text-slate-200 text-xs sm:text-sm max-w-[150px] truncate inline-block font-medium"
                                              title={val || ''}
                                            >
                                              {val}
                                            </span>
                                          ) : (
                                            <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm select-none">--</span>
                                          )
                                        )}
                                        {col.type === 'select' && (
                                          val && String(val).trim() ? (
                                            <span className="inline-block px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold bg-purple-500/20 dark:bg-purple-500/15 text-purple-900 dark:text-purple-300 border border-purple-500/40 dark:border-purple-500/35">
                                              {String(val).includes('|')
                                                ? String(val).split('|').map((s) => s.trim()).filter(Boolean).pop() || String(val).split('|')[0].trim()
                                                : String(val).trim()}
                                            </span>
                                          ) : (
                                            <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm select-none">--</span>
                                          )
                                        )}
                                        {col.type === 'rating' && (
                                          val !== undefined && val !== null && Number(val) > 0 ? (
                                            <span className="text-stone-900 dark:text-slate-200 font-mono-numbers font-bold text-xs sm:text-[15px]">
                                              {val}/5
                                            </span>
                                          ) : (
                                            <span className="text-stone-400/50 dark:text-white/20 font-mono text-xs sm:text-sm select-none">--</span>
                                          )
                                        )}
                                      </td>
                                    );
                                  })}

                                  {/* Subtle Action Column Cell */}
                                  <td className="py-2 sm:py-3.5 px-2 text-center whitespace-nowrap min-w-[50px] w-[50px] sm:min-w-[64px] sm:w-[64px] relative">
                                    <div className="relative inline-block text-left">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMainActiveActionMenuDate(mainActiveActionMenuDate === entry.date ? null : entry.date);
                                        }}
                                        className="p-2 rounded-xl hover:bg-white/10 text-stone-400 hover:text-white transition cursor-pointer active:scale-95"
                                        title="Row actions"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </button>

                                      {mainActiveActionMenuDate === entry.date && (
                                        <div
                                          onClick={(e) => e.stopPropagation()}
                                          className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/12 bg-[#171716] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] p-1.5 z-50 animate-fadeIn font-mono text-[13px]"
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleToggleExpand(entry);
                                              setMainActiveActionMenuDate(null);
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/10 flex items-center gap-2.5 text-stone-200 hover:text-white cursor-pointer transition"
                                          >
                                            <Edit3 className="w-3.5 h-3.5 text-[#e9762b]" />
                                            <span>Edit</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleOpenAddRowModal(todayStr);
                                              setAddRowStudyHours(entry.studyHours != null && entry.studyHours > 0 ? entry.studyHours : '');
                                              setAddRowAttendedClass(normalizeTriState(entry.attendedClass));
                                              setAddRowPyqs(entry.pyqsSolved != null && entry.pyqsSolved > 0 ? entry.pyqsSolved : '');
                                              setAddRowRevisionDone(normalizeTriState(entry.revisionDone));
                                              setAddRowMockTest(normalizeTriState(entry.mockTestTaken));
                                              setAddRowSleepHours(entry.sleepHours != null && entry.sleepHours > 0 ? entry.sleepHours : '');
                                              setAddRowRating(entry.focusRating ?? null);
                                              setAddRowNotes(entry.notes || '');
                                              setAddRowCustomData({ ...(entry.customData || {}) });
                                              setMainActiveActionMenuDate(null);
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/10 flex items-center gap-2.5 text-stone-200 hover:text-white cursor-pointer transition"
                                          >
                                            <Copy className="w-3.5 h-3.5 text-sky-400" />
                                            <span>Duplicate</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              handleDeleteEntry(entry.date);
                                              setMainActiveActionMenuDate(null);
                                            }}
                                            className="w-full px-3 py-2.5 rounded-xl text-left hover:bg-red-500/15 flex items-center gap-2.5 text-red-400 hover:text-red-300 cursor-pointer transition"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                            <span>Delete</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>

                                {/* Expand in place accordion sub-panel */}
                                {isExpanded && accordionState && (
                                  <tr id={`log-accordion-${entry.date}`} className="bg-white/[0.02] backdrop-blur-2xl border-b border-white/10" onClick={(e) => e.stopPropagation()}>
                                    <td colSpan={totalDefaultTableCols} className="p-0 border-b border-white/10">
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
                                            onClick={() => handleDeleteEntry(entry.date)}
                                            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-xs font-mono font-bold transition cursor-pointer"
                                            title="Delete this day's entry"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                            <span>DELETE DAY</span>
                                          </button>
                                        </div>

                                        {/* Row 1: Numerical Fields (Study Hours, PYQs, Sleep Hours, Focus Rating) */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono">
                                          {/* Study Hours */}
                                          <div className="glass-panel p-3 rounded-xl space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                                              STUDY HOURS
                                            </label>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                max="24"
                                                placeholder="--"
                                                value={accordionState.studyHours}
                                                onChange={(e) =>
                                                  setAccordionState({
                                                    ...accordionState,
                                                    studyHours: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)),
                                                  })
                                                }
                                                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-stone-900 dark:text-white font-bold text-center focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                                              />
                                              <span className="text-xs text-stone-600 dark:text-slate-400 font-bold">hrs</span>
                                            </div>
                                          </div>

                                          {/* PYQs Solved */}
                                          <div className="glass-panel p-3 rounded-xl space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                                              PYQS SOLVED
                                            </label>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                step="1"
                                                min="0"
                                                placeholder="--"
                                                value={accordionState.pyqsSolved}
                                                onChange={(e) =>
                                                  setAccordionState({
                                                    ...accordionState,
                                                    pyqsSolved: e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)),
                                                  })
                                                }
                                                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-stone-900 dark:text-white font-bold text-center focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                                              />
                                              <span className="text-xs text-stone-600 dark:text-slate-400 font-bold">ques</span>
                                            </div>
                                          </div>

                                          {/* Sleep Hours */}
                                          <div className="glass-panel p-3 rounded-xl space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                                              SLEEP HOURS
                                            </label>
                                            <div className="flex items-center gap-2">
                                              <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                max="24"
                                                placeholder="--"
                                                value={accordionState.sleepHours}
                                                onChange={(e) =>
                                                  setAccordionState({
                                                    ...accordionState,
                                                    sleepHours: e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)),
                                                  })
                                                }
                                                className="w-full glass-input rounded-lg px-2.5 py-1.5 text-sm text-stone-900 dark:text-white font-bold text-center focus:outline-none placeholder-stone-400 dark:placeholder-slate-600"
                                              />
                                              <span className="text-xs text-stone-600 dark:text-slate-400 font-bold">hrs</span>
                                            </div>
                                          </div>

                                          {/* Focus Rating */}
                                          <div className="glass-panel p-3 rounded-xl space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                                              FOCUS ({accordionState.focusRating ? `${accordionState.focusRating}/5` : '--'})
                                            </label>
                                            <div className="grid grid-cols-5 gap-1 pt-1 w-full min-w-0">
                                              {[1, 2, 3, 4, 5].map((val) => (
                                                <button
                                                  key={val}
                                                  type="button"
                                                  onClick={() =>
                                                    setAccordionState({
                                                      ...accordionState,
                                                      focusRating: accordionState.focusRating === val ? null : val,
                                                    })
                                                  }
                                                  className={`h-7 w-full min-w-0 rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center p-0 ${accordionState.focusRating === val
                                                    ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/30'
                                                    : 'glass-pill text-stone-700 dark:text-slate-400 hover:text-stone-950 dark:hover:text-white'
                                                    }`}
                                                >
                                                  {val}
                                                </button>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Row 2: Habit Indicators (Class, Revision, Mock + Custom Yes/No Trackers) - 4 in a row */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono text-xs">
                                          {/* Attended Class? */}
                                          <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                              ATTENDED CLASS?
                                            </label>
                                            <TriStatePillSelect
                                              size="sm"
                                              value={accordionState.attendedClass}
                                              onChange={(val) =>
                                                setAccordionState({ ...accordionState, attendedClass: val })
                                              }
                                            />
                                          </div>

                                          {/* Revision Done? */}
                                          <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                              REVISION DONE?
                                            </label>
                                            <TriStatePillSelect
                                              size="sm"
                                              value={accordionState.revisionDone}
                                              onChange={(val) =>
                                                setAccordionState({ ...accordionState, revisionDone: val })
                                              }
                                            />
                                          </div>

                                          {/* Mock Test Taken? */}
                                          <div className="space-y-1.5">
                                            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                              MOCK TEST?
                                            </label>
                                            <TriStatePillSelect
                                              size="sm"
                                              value={accordionState.mockTestTaken}
                                              onChange={(val) =>
                                                setAccordionState({ ...accordionState, mockTestTaken: val })
                                              }
                                            />
                                          </div>

                                          {/* Custom Yes/No Trackers */}
                                          {customColumns
                                            .filter((col) => col.type === 'boolean')
                                            .map((col) => (
                                              <div key={col.id} className="space-y-1.5">
                                                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                                  {col.name.toUpperCase()}?
                                                </label>
                                                <TriStatePillSelect
                                                  size="sm"
                                                  value={accordionState.customData?.[col.id]}
                                                  onChange={(val) =>
                                                    setAccordionState({
                                                      ...accordionState,
                                                      customData: {
                                                        ...accordionState.customData,
                                                        [col.id]: val,
                                                      },
                                                    })
                                                  }
                                                />
                                              </div>
                                            ))}

                                          {/* Quick Add Custom Habit/Tracker in 4th slot if no boolean custom columns exist */}
                                          {customColumns.filter((col) => col.type === 'boolean').length === 0 && (
                                            <div className="space-y-1.5 flex flex-col justify-between">
                                              <label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-slate-400 font-bold block truncate">
                                                CUSTOM TRACKER
                                              </label>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setNewColType('boolean');
                                                  setShowAddColumnModal(true);
                                                }}
                                                className="w-full h-8 rounded-lg bg-orange-500/10 hover:bg-[#e9762b] text-[#e9762b] hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-dashed border-[#e9762b]/40 hover:border-[#e9762b]"
                                                title="Add a custom Yes/No tracker column"
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>+ TRACKER</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>

                                        {/* Row 3: Notes Input in Accordion */}
                                        <div className="space-y-1.5 font-mono">
                                          <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">
                                            NOTES &amp; OBSERVATIONS
                                          </label>
                                          <input
                                            id={`accordion-notes-${entry.date}`}
                                            type="text"
                                            value={accordionState.notes}
                                            onChange={(e) =>
                                              setAccordionState({ ...accordionState, notes: e.target.value })
                                            }
                                            placeholder="Write any thoughts, chapters covered, roadblocks..."
                                            className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
                                          />
                                        </div>

                                        {/* Row 4: Custom Trackers & Metrics in Accordion (Non-boolean: Number, Text, Select) */}
                                        {customColumns.some((col) => col.type !== 'boolean') && (
                                          <div className="space-y-3 pt-3 border-t border-white/10 font-mono">
                                            <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                                              ADDITIONAL CUSTOM TRACKERS
                                            </span>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                                              {customColumns
                                                .filter((col) => col.type !== 'boolean')
                                                .map((col) => (
                                                  <div
                                                    key={col.id}
                                                    className="glass-panel p-3 rounded-xl space-y-1.5"
                                                  >
                                                    <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                                      {col.name}
                                                    </label>
                                                    {col.type === 'number' && (
                                                      <input
                                                        type="number"
                                                        step="any"
                                                        value={accordionState.customData?.[col.id] ?? ''}
                                                        onChange={(e) =>
                                                          setAccordionState({
                                                            ...accordionState,
                                                            customData: {
                                                              ...accordionState.customData,
                                                              [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                                            },
                                                          })
                                                        }
                                                        placeholder="--"
                                                        className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
                                                      />
                                                    )}
                                                    {col.type === 'text' && (
                                                      <input
                                                        type="text"
                                                        value={accordionState.customData?.[col.id] ?? ''}
                                                        onChange={(e) =>
                                                          setAccordionState({
                                                            ...accordionState,
                                                            customData: {
                                                              ...accordionState.customData,
                                                              [col.id]: e.target.value,
                                                            },
                                                          })
                                                        }
                                                        placeholder="--"
                                                        className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
                                                      />
                                                    )}
                                                    {col.type === 'select' && (
                                                      <select
                                                        value={accordionState.customData?.[col.id] ?? ''}
                                                        onChange={(e) =>
                                                          setAccordionState({
                                                            ...accordionState,
                                                            customData: {
                                                              ...accordionState.customData,
                                                              [col.id]: e.target.value,
                                                            },
                                                          })
                                                        }
                                                        className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                                                      >
                                                        <option value="" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">
                                                          -- Select --
                                                        </option>
                                                        {(col.options || []).map((opt) => (
                                                          <option key={opt} value={opt} className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">
                                                            {opt}
                                                          </option>
                                                        ))}
                                                      </select>
                                                    )}
                                                    {col.type === 'rating' && (
                                                      <select
                                                        value={accordionState.customData?.[col.id] ?? ''}
                                                        onChange={(e) =>
                                                          setAccordionState({
                                                            ...accordionState,
                                                            customData: {
                                                              ...accordionState.customData,
                                                              [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                                            },
                                                          })
                                                        }
                                                        className="w-full glass-input rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-white font-bold text-center focus:outline-none cursor-pointer"
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
                                          </div>
                                        )}

                                        {/* Accordion Action Buttons */}
                                        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-white/10">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setExpandedDate(null);
                                              setAccordionState(null);
                                            }}
                                            className="px-5 py-2 rounded-lg bg-stone-200/90 hover:bg-stone-300 dark:bg-[#1c1c1b] dark:hover:bg-[#252524] border border-stone-300/80 dark:border-white/10 text-stone-700 dark:text-slate-400 hover:text-black dark:hover:text-white text-xs uppercase font-bold tracking-wider transition cursor-pointer shadow-sm"
                                          >
                                            CLOSE
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleSaveAccordion(entry.date)}
                                            className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20 shrink-0"
                                          >
                                            SAVE CHANGES
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

                  {/* Bottom Table Navigation & Chunk Loading Bar */}
                  {/* Footer Metrics Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-white/[0.02] backdrop-blur-xl border-t border-white/10 font-mono text-xs sm:text-[13px]">
                    {/* Left: Row Count & Load More */}
                    <div className="flex flex-wrap items-center gap-3 text-stone-500 dark:text-slate-400">
                      <span className="uppercase tracking-wider text-xs">
                        SHOWING <span className="text-stone-900 dark:text-white font-bold font-mono-numbers">{visibleLogs.length}</span> OF{' '}
                        <span className="text-stone-900 dark:text-white font-bold font-mono-numbers">{filteredDailyLogs.length}</span> ROWS
                      </span>
                      {filteredDailyLogs.length > visibleLogs.length && (
                        <button
                          type="button"
                          onClick={() => setVisibleLimit((prev) => prev + 15)}
                          className="px-3.5 py-1.5 rounded-full glass-pill hover:border-[#e9762b] text-[#e9762b] text-xs font-bold uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>+ Load 15 More</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {visibleLimit > 20 && (
                        <button
                          type="button"
                          onClick={() => setVisibleLimit(20)}
                          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                        >
                          Show Less
                        </button>
                      )}
                    </div>

                    {/* Right: Live KPI Chips (Desktop only) */}
                    <div className="hidden sm:flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs font-mono">
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                        <span className="text-slate-400 uppercase tracking-wider text-[11px]">AVG HOURS:</span>
                        <span className="text-stone-900 dark:text-white font-extrabold font-mono-numbers text-xs sm:text-[13px]">{mainStats.avgHours} hrs</span>
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                        <span className="text-slate-400 uppercase tracking-wider text-[11px]">CLASS ATTENDED:</span>
                        <span className="text-emerald-400 font-extrabold font-mono-numbers text-xs sm:text-[13px]">{mainStats.classPercent}%</span>
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                        <span className="text-slate-400 uppercase tracking-wider text-[11px]">AVG SLEEP:</span>
                        <span className="text-stone-900 dark:text-white font-extrabold font-mono-numbers text-xs sm:text-[13px]">{mainStats.avgSleep} hrs</span>
                      </div>
                      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/25">
                        <span className="text-orange-300/80 uppercase tracking-wider text-[11px]">TOTAL:</span>
                        <span className="text-[#e9762b] font-extrabold font-mono-numbers text-xs sm:text-[13px]">{mainStats.totalHours} hrs</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal: Add Log Row for Any Date (Today or Past Date) */}
      {showAddRowModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddRowModal(false); }}
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
                    NEW STUDY LOG ENTRY
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRowModal(false)}
                className="p-1.5 rounded-lg hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
                title="Close modal (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitAddRowModal} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-3.5 min-h-0 custom-scrollbar text-xs">

                {/* 1. DATE SELECTOR */}
                <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${
                  isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                      DATE
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border bg-orange-500/15 text-[#e9762b] border-orange-500/30">
                      {formatDateDisplay(addRowDate)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddRowDateChange(todayStr)}
                      className={`px-4 py-2 rounded-xl text-xs uppercase font-extrabold transition cursor-pointer ${
                        addRowDate === todayStr
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
                      onClick={() => handleAddRowDateChange(yesterdayStr)}
                      className={`px-4 py-2 rounded-xl text-xs uppercase font-extrabold transition cursor-pointer ${
                        addRowDate === yesterdayStr
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
                      max={todayStr}
                      value={addRowDate}
                      onChange={(e) => handleAddRowDateChange(e.target.value)}
                      className={`border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs focus:outline-none flex-1 min-w-[140px] font-mono font-bold cursor-pointer transition ${
                        isDark
                          ? 'bg-[#121211] border-white/10 text-white'
                          : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* 2. STUDY & REST METRICS */}
                <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${
                  isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                      STUDY &amp; REST METRICS
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 font-extrabold border border-sky-500/30">
                      3 METRICS
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider block truncate">
                        STUDY HOURS (HRS)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="0"
                        value={addRowStudyHours}
                        onChange={(e) => setAddRowStudyHours(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                        className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 font-mono text-sm font-bold text-center focus:outline-none transition ${
                          isDark
                            ? 'bg-[#121211] border-white/10 text-white'
                            : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider block truncate">
                        PYQS SOLVED (QUES)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        placeholder="0"
                        value={addRowPyqs}
                        onChange={(e) => setAddRowPyqs(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                        className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 font-mono text-sm font-bold text-center focus:outline-none transition ${
                          isDark
                            ? 'bg-[#121211] border-white/10 text-white'
                            : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                        }`}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider block truncate">
                        SLEEP HOURS (HRS)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="0"
                        value={addRowSleepHours}
                        onChange={(e) => setAddRowSleepHours(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                        className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 font-mono text-sm font-bold text-center focus:outline-none transition ${
                          isDark
                            ? 'bg-[#121211] border-white/10 text-white'
                            : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. DAILY HABITS */}
                <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${
                  isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono block">
                    DAILY HABITS
                  </span>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider truncate">
                        ATTENDED CLASS
                      </label>
                      <div className="w-full sm:w-56 shrink-0">
                        <TriStatePillSelect
                          size="sm"
                          value={addRowAttendedClass}
                          onChange={setAddRowAttendedClass}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider truncate">
                        REVISION DONE
                      </label>
                      <div className="w-full sm:w-56 shrink-0">
                        <TriStatePillSelect
                          size="sm"
                          value={addRowRevisionDone}
                          onChange={setAddRowRevisionDone}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider truncate">
                        MOCK TEST TAKEN
                      </label>
                      <div className="w-full sm:w-56 shrink-0">
                        <TriStatePillSelect
                          size="sm"
                          value={addRowMockTest}
                          onChange={setAddRowMockTest}
                        />
                      </div>
                    </div>

                    {customColumns.filter((col) => col.type === 'boolean').map((col) => (
                      <div key={col.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider truncate">
                          {formatColumnHeader(col.name, col.unit)}
                        </label>
                        <div className="w-full sm:w-56 shrink-0">
                          <TriStatePillSelect
                            size="sm"
                            value={addRowCustomData[col.id]}
                            onChange={(val) => setAddRowCustomData({ ...addRowCustomData, [col.id]: val })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. FOCUS RATING */}
                <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${
                  isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                      FOCUS RATING
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase border ${
                        addRowRating
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : isDark
                            ? 'bg-white/5 text-stone-400 border-white/10'
                            : 'bg-stone-100 text-stone-500 border-stone-200'
                      }`}>
                        {addRowRating ? `${addRowRating}/5 STARS` : 'NOT RATED'}
                      </span>
                      {addRowRating && (
                        <button
                          type="button"
                          onClick={() => setAddRowRating(null)}
                          className="text-[10px] text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white underline cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = addRowRating === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAddRowRating(isSelected ? null : val)}
                          className={`h-9 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                            isSelected
                              ? 'bg-[#e9762b] text-white shadow-md shadow-orange-500/25 border border-orange-500/40'
                              : isDark
                                ? 'bg-[#121211] hover:bg-white/10 text-stone-300 border border-white/10'
                                : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 shadow-sm'
                          }`}
                        >
                          <span>{val}</span>
                          <span className={isSelected ? 'text-white' : 'text-amber-500 dark:text-amber-400'}>★</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. NOTES */}
                <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${
                  isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                      NOTES &amp; REFLECTIONS
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                      isDark ? 'bg-white/10 text-stone-300 border-white/10' : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}>
                      OPTIONAL
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    value={addRowNotes}
                    onChange={(e) => setAddRowNotes(e.target.value)}
                    placeholder="Write any thoughts, key formulas reviewed, or milestones achieved today..."
                    className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition leading-relaxed resize-none custom-scrollbar ${
                      isDark
                        ? 'bg-[#121211] border-white/10 text-white placeholder-stone-500'
                        : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                    }`}
                  />
                </div>

                {/* 6. ADDITIONAL CUSTOM TRACKERS (non-boolean) */}
                {customColumns.filter((c) => c.type !== 'boolean').length > 0 && (
                  <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${
                    isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200/90'
                  }`}>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono block">
                      CUSTOM FIELDS
                    </span>
                    <div className="space-y-3">
                      {customColumns
                        .filter((c) => c.type !== 'boolean')
                        .map((col) => (
                          <div key={col.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-[10px] text-stone-500 dark:text-stone-400 uppercase font-bold tracking-wider truncate">
                              {formatColumnHeader(col.name, col.unit)}
                            </label>
                            <div className="w-full sm:w-56 shrink-0">
                              {col.type === 'number' && (
                                <input
                                  type="number"
                                  step="any"
                                  value={addRowCustomData[col.id] ?? ''}
                                  onChange={(e) =>
                                    setAddRowCustomData({
                                      ...addRowCustomData,
                                      [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className={`w-full border focus:border-[#e9762b] rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none transition ${
                                    isDark ? 'bg-[#121211] border-white/10 text-white' : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                                  }`}
                                />
                              )}
                              {col.type === 'text' && (
                                <input
                                  type="text"
                                  value={addRowCustomData[col.id] ?? ''}
                                  onChange={(e) =>
                                    setAddRowCustomData({ ...addRowCustomData, [col.id]: e.target.value })
                                  }
                                  placeholder="Enter text..."
                                  className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs focus:outline-none transition ${
                                    isDark ? 'bg-[#121211] border-white/10 text-white' : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                                  }`}
                                />
                              )}
                              {col.type === 'select' && (
                                <select
                                  value={addRowCustomData[col.id] ?? ''}
                                  onChange={(e) =>
                                    setAddRowCustomData({ ...addRowCustomData, [col.id]: e.target.value })
                                  }
                                  className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs focus:outline-none cursor-pointer transition ${
                                    isDark ? 'bg-[#121211] border-white/10 text-white' : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                                  }`}
                                >
                                  <option value="" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>-- Select --</option>
                                  {(col.options || []).map((opt) => (
                                    <option key={opt} value={opt} className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {col.type === 'rating' && (
                                <select
                                  value={addRowCustomData[col.id] ?? ''}
                                  onChange={(e) =>
                                    setAddRowCustomData({
                                      ...addRowCustomData,
                                      [col.id]: e.target.value === '' ? '' : Number(e.target.value),
                                    })
                                  }
                                  className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs font-bold text-center focus:outline-none cursor-pointer transition ${
                                    isDark ? 'bg-[#121211] border-white/10 text-white' : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                                  }`}
                                >
                                  <option value="" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>-- Rating --</option>
                                  <option value="5" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>5/5 (Mastered)</option>
                                  <option value="4" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>4/5 (Good)</option>
                                  <option value="3" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>3/5 (Average)</option>
                                  <option value="2" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>2/5 (Weak)</option>
                                  <option value="1" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>1/5 (Need Review)</option>
                                </select>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Modal Footer (Settings style) */}
              <div className={`flex items-center justify-between border-t px-6 sm:px-8 py-3.5 shrink-0 transition-colors ${isDark ? 'bg-[#141413] border-white/10' : 'bg-[#f4f0e8] border-stone-200'
                }`}>
                <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#e9762b] animate-pulse" />
                  <span className="hidden sm:inline">STUDYO • </span>
                  <span>{formatDateDisplay(addRowDate)}</span>
                </span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    onClick={() => setShowAddRowModal(false)}
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

      {/* Modal: Add Custom Column */}
      {showAddColumnModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowAddColumnModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-3xl border font-mono overflow-hidden transition-all duration-200"
            style={{
              backgroundColor: isDark ? 'rgba(18, 18, 17, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
              boxShadow: isDark
                ? '0 30px 90px -10px rgba(0,0,0,0.95), 0 0 60px -20px rgba(233,118,43,0.25)'
                : '0 30px 80px rgba(0, 0, 0, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
            }}
          >
            <div className={`flex items-center justify-between border-b px-5 sm:px-6 py-4 ${isDark ? 'bg-[#141413] border-white/10' : 'bg-[#f4f0e8] border-stone-200'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#e9762b] flex items-center justify-center border border-orange-500/40 shadow-inner">
                  <Columns className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                  ADD COLUMN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddColumnModal(false)}
                className="p-1.5 rounded-xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateColumn} className="p-6 space-y-5 text-xs">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  COLUMN NAME
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Mood, Water intake, Exercise, Pages read"
                  className={`w-full border focus:border-[#e9762b] rounded-xl px-4 py-3 text-xs focus:outline-none transition ${isDark
                    ? 'bg-black/40 border-white/10 text-white placeholder-stone-500'
                    : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                    }`}
                  autoFocus
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  COLUMN TYPE
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { type: 'boolean' as CustomColumnType, label: 'Yes/No', desc: 'Clickable yes/no', icon: CheckSquare, color: 'text-[#10b981]' },
                    { type: 'number' as CustomColumnType, label: 'Number', desc: 'Numeric value', icon: Hash, color: 'text-sky-500 dark:text-sky-400' },
                    { type: 'text' as CustomColumnType, label: 'Text', desc: 'Free text', icon: Type, color: 'text-amber-500 dark:text-amber-400' },
                    { type: 'select' as CustomColumnType, label: 'Dropdown', desc: 'Pick from your options', icon: List, color: 'text-purple-500 dark:text-purple-400' },
                    { type: 'rating' as CustomColumnType, label: 'Rating', desc: 'Score from 1 to 5', icon: Star, color: 'text-amber-500 dark:text-amber-400' },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = newColType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setNewColType(item.type)}
                        aria-pressed={isSelected}
                        title={item.desc}
                        className={`py-3 px-1.5 rounded-xl border transition flex flex-col items-center gap-1.5 cursor-pointer ${isSelected
                          ? 'bg-orange-500/15 border-[#e9762b] shadow-sm shadow-orange-500/20'
                          : isDark
                            ? 'bg-[#181817] border-white/10 text-stone-300 hover:border-white/25'
                            : 'bg-[#faf6f0] border-stone-200 text-stone-700 hover:border-stone-300'
                          }`}
                      >
                        <Icon className={`w-4 h-4 ${item.color}`} />
                        <span className="font-bold text-stone-900 dark:text-white text-[10px] leading-none">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {{
                    boolean: 'Clickable YES / NO / N/A status badge',
                    number: 'Numeric value (supports decimals & totals)',
                    text: 'Free text note or label',
                    select: 'Dropdown menu with custom options',
                    rating: '1 to 5 star score rating',
                  }[newColType] ?? ''}
                </p>
              </div>

              {newColType === 'select' && (() => {
                const optList = newColOptions.split(',').map((s) => s.trim()).filter(Boolean);
                return (
                  <div className={`space-y-3 p-4 rounded-2xl border animate-fadeIn ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200 shadow-sm'
                    }`}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                        DROPDOWN OPTIONS
                      </label>
                      <span className="text-[10px] text-[#e9762b] font-mono font-bold">{optList.length} added</span>
                    </div>

                    <div className={`flex flex-wrap gap-1.5 min-h-[42px] max-h-28 overflow-y-auto p-2.5 rounded-xl border items-center ${isDark ? 'bg-black/40 border-white/10' : 'bg-[#faf6f0] border-stone-200'
                      }`}>
                      {optList.length > 0 ? (
                        optList.map((opt) => (
                          <span
                            key={opt}
                            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-[#e9762b] border border-orange-500/30 animate-fadeIn"
                          >
                            <span>{opt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromNewCol(opt)}
                              className="w-4 h-4 rounded-full hover:bg-orange-500/30 flex items-center justify-center transition cursor-pointer hover:text-red-400"
                              aria-label={`Remove ${opt}`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-stone-500 px-1">No options added yet</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newColOptionInput}
                        onChange={(e) => setNewColOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOptionToNewCol();
                          }
                        }}
                        placeholder="Type option & press Enter"
                        className={`flex-1 min-w-0 border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs focus:outline-none transition ${isDark ? 'bg-black/40 border-white/10 text-white placeholder-stone-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddOptionToNewCol()}
                        disabled={!newColOptionInput.trim()}
                        aria-label="Add option"
                        className="w-9 h-9 rounded-xl bg-[#e9762b] text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { label: 'Status', opts: ['Done', 'In Progress', 'Pending'] },
                        { label: 'Priority', opts: ['High', 'Medium', 'Low'] },
                        { label: 'Quality', opts: ['Good', 'Okay', 'Bad'] },
                        { label: 'Level', opts: ['Easy', 'Medium', 'Hard'] },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          title={preset.opts.join(', ')}
                          onClick={() => setNewColOptions(Array.from(new Set([...optList, ...preset.opts])).join(', '))}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition cursor-pointer ${isDark ? 'bg-white/5 hover:bg-white/10 text-stone-300 border-white/10' : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                            }`}
                        >
                          + {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-white/10' : 'border-stone-200'
                }`}>
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className={`px-5 py-2.5 rounded-full border uppercase font-bold text-xs transition cursor-pointer ${isDark
                    ? 'bg-[#1c1c1b] border-white/10 text-slate-300 hover:text-white'
                    : 'bg-stone-200 border-stone-300 text-stone-800 hover:text-black'
                    }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#e9762b] text-white font-black uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-orange-500/25"
                >
                  CREATE COLUMN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit / Configure Custom Column */}
      {editingColumn && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setEditingColumn(null); }}
        >
          <div
            className="w-full max-w-lg rounded-3xl border font-mono overflow-hidden transition-all duration-200"
            style={{
              backgroundColor: isDark ? 'rgba(18, 18, 17, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
              boxShadow: isDark
                ? '0 30px 90px -10px rgba(0,0,0,0.95), 0 0 60px -20px rgba(233,118,43,0.25)'
                : '0 30px 80px rgba(0, 0, 0, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
            }}
          >
            <div className={`flex items-center justify-between border-b px-5 sm:px-6 py-4 ${isDark ? 'bg-[#141413] border-white/10' : 'bg-[#f4f0e8] border-stone-200'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#e9762b] flex items-center justify-center border border-orange-500/40 shadow-inner">
                  <Settings2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white uppercase tracking-wider font-mono">
                  CONFIGURE COLUMN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingColumn(null)}
                className="p-1.5 rounded-xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditColumn} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  COLUMN NAME
                </label>
                <input
                  type="text"
                  required
                  value={editingColumn.name}
                  onChange={(e) =>
                    setEditingColumn({ ...editingColumn, name: e.target.value })
                  }
                  className={`w-full border focus:border-[#e9762b] rounded-xl px-4 py-2.5 text-xs focus:outline-none transition ${isDark
                    ? 'bg-black/40 border-white/10 text-white'
                    : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                    }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  COLUMN TYPE
                </label>
                <select
                  value={editingColumn.type}
                  onChange={(e) =>
                    setEditingColumn({
                      ...editingColumn,
                      type: e.target.value as CustomColumnType,
                    })
                  }
                  className={`w-full border focus:border-[#e9762b] rounded-xl px-4 py-2.5 text-xs focus:outline-none cursor-pointer transition ${isDark
                    ? 'bg-black/40 border-white/10 text-white'
                    : 'bg-white border-stone-300 text-stone-900 shadow-sm'
                    }`}
                >
                  <option value="boolean" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>Yes / No</option>
                  <option value="number" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>Number</option>
                  <option value="text" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>Text</option>
                  <option value="select" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>Dropdown</option>
                  <option value="rating" className={isDark ? "bg-[#141413] text-white" : "bg-white text-stone-900"}>Rating</option>
                </select>
              </div>

              {editingColumn.type === 'select' && (() => {
                const optList = (editingColumn.options || '').split(',').map((s) => s.trim()).filter(Boolean);
                return (
                  <div className={`space-y-2.5 p-4 rounded-2xl border ${isDark ? 'bg-[#181817] border-white/10' : 'bg-white/95 border-stone-200 shadow-sm'
                    }`}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-stone-300 font-bold block">
                        OPTIONS
                      </label>
                      <span className="text-[10px] text-[#e9762b] font-mono font-bold">{optList.length}</span>
                    </div>

                    <div className={`flex flex-wrap gap-1.5 min-h-[40px] max-h-28 overflow-y-auto p-2.5 rounded-xl border items-center ${isDark ? 'bg-black/40 border-white/10' : 'bg-[#faf6f0] border-stone-200'
                      }`}>
                      {optList.length > 0 ? (
                        optList.map((opt) => (
                          <span
                            key={opt}
                            className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-[#e9762b] border border-orange-500/30 animate-fadeIn"
                          >
                            <span>{opt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromEditCol(opt)}
                              className="w-4 h-4 rounded-full hover:bg-orange-500/30 flex items-center justify-center transition cursor-pointer hover:text-red-400"
                              aria-label={`Remove ${opt}`}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-stone-500 px-1">No options yet</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editColOptionInput}
                        onChange={(e) => setEditColOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOptionToEditCol();
                          }
                        }}
                        placeholder="Add option, press Enter"
                        className={`flex-1 min-w-0 border focus:border-[#e9762b] rounded-xl px-3.5 py-2 text-xs focus:outline-none ${isDark ? 'bg-black/40 border-white/10 text-white placeholder-stone-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                          }`}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddOptionToEditCol()}
                        disabled={!editColOptionInput.trim()}
                        aria-label="Add option"
                        className="w-9 h-9 rounded-xl bg-[#e9762b] text-white flex items-center justify-center hover:brightness-110 active:scale-95 transition cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Column Reordering */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400 font-bold block">
                  COLUMN POSITION
                </label>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={editingColumn.index === 0}
                    onClick={() => handleMoveColumn(editingColumn.index, 'left')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl disabled:opacity-30 font-bold uppercase text-[11px] border transition cursor-pointer disabled:cursor-not-allowed ${isDark ? 'bg-[#181817] hover:bg-white/10 text-stone-200 border-white/10' : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300 shadow-sm'
                      }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Move Left</span>
                  </button>
                  <button
                    type="button"
                    disabled={editingColumn.index === customColumns.length - 1}
                    onClick={() => handleMoveColumn(editingColumn.index, 'right')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl disabled:opacity-30 font-bold uppercase text-[11px] border transition cursor-pointer disabled:cursor-not-allowed ${isDark ? 'bg-[#181817] hover:bg-white/10 text-stone-200 border-white/10' : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300 shadow-sm'
                      }`}
                  >
                    <span>Move Right</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Danger Zone: Delete Column */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleDeleteColumn(editingColumn.id, editingColumn.name)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 dark:text-red-400 hover:bg-red-500/20 border border-red-500/30 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Column</span>
                </button>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-white/10' : 'border-stone-200'
                }`}>
                <button
                  type="button"
                  onClick={() => setEditingColumn(null)}
                  className={`px-5 py-2.5 rounded-full border uppercase font-bold text-xs transition cursor-pointer ${isDark
                    ? 'bg-[#1c1c1b] border-white/10 text-slate-300 hover:text-white'
                    : 'bg-stone-200 border-stone-300 text-stone-800 hover:text-black'
                    }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-[#e9762b] text-white font-black uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-orange-500/25"
                >
                  SAVE CHANGES
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create New Custom Table */}
      {showCreateTableModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreateTableModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-3xl border font-mono overflow-hidden transition-all duration-200"
            style={{
              backgroundColor: isDark ? 'rgba(18, 18, 17, 0.98)' : 'rgba(255, 255, 255, 0.98)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)',
              boxShadow: isDark
                ? '0 30px 90px -10px rgba(0,0,0,0.95), 0 0 60px -20px rgba(233,118,43,0.25)'
                : '0 30px 80px rgba(0, 0, 0, 0.14), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
            }}
          >
            <div className={`flex items-center justify-between border-b px-5 sm:px-6 py-4 ${isDark ? 'bg-[#141413] border-white/10' : 'bg-[#f4f0e8] border-stone-200'
              }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-[#e9762b] flex items-center justify-center border border-orange-500/40 shadow-inner">
                  <Table2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-white tracking-wider uppercase font-mono">
                  NEW TABLE
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTableModal(false)}
                className="p-1.5 rounded-xl hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="p-6 sm:p-7 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  TABLE TITLE
                </label>
                <input
                  type="text"
                  required
                  value={newTableTitle}
                  onChange={(e) => setNewTableTitle(e.target.value)}
                  placeholder="e.g. Mock Tests"
                  className={`w-full border focus:border-[#e9762b] rounded-xl px-4 py-3 text-xs focus:outline-none transition ${isDark ? 'bg-black/40 border-white/10 text-white placeholder-stone-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                    }`}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  DESCRIPTION <span className="text-stone-500">(OPTIONAL)</span>
                </label>
                <input
                  type="text"
                  value={newTableDesc}
                  onChange={(e) => setNewTableDesc(e.target.value)}
                  placeholder="Optional subtitle or goal..."
                  className={`w-full border focus:border-[#e9762b] rounded-xl px-4 py-3 text-xs focus:outline-none transition ${isDark ? 'bg-black/40 border-white/10 text-white placeholder-stone-500' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                    }`}
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  CHOOSE A TEMPLATE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'mock' as const,
                      title: 'Mock Tests',
                      icon: Sparkles,
                    },
                    {
                      id: 'pyq' as const,
                      title: 'PYQ Practice',
                      icon: BookOpen,
                    },
                    {
                      id: 'habits' as const,
                      title: 'Habits',
                      icon: Layers,
                    },
                    {
                      id: 'blank' as const,
                      title: 'Blank Table',
                      icon: Plus,
                    },
                  ].map((tmpl) => {
                    const Icon = tmpl.icon;
                    const isSelected = selectedTemplate === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tmpl.id);
                          if (!newTableTitle.trim()) {
                            setNewTableTitle(tmpl.title);
                          }
                        }}
                        className={`px-4 py-3.5 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${isSelected
                          ? 'bg-orange-500/15 border-[#e9762b] shadow-sm shadow-orange-500/20 text-[#e9762b] font-extrabold'
                          : isDark
                            ? 'bg-[#181817] border-white/10 text-stone-300 hover:border-white/25 hover:text-white font-bold'
                            : 'bg-[#faf6f0] border-stone-200 text-stone-700 hover:border-stone-300 hover:bg-stone-100 font-bold shadow-sm'
                          }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#e9762b]' : 'text-stone-400'}`} />
                        <span className="text-xs tracking-wide uppercase text-stone-900 dark:text-white">{tmpl.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-white/10' : 'border-stone-200'
                }`}>
                <button
                  type="button"
                  onClick={() => setShowCreateTableModal(false)}
                  className={`px-5 py-2.5 rounded-full border text-xs uppercase font-bold tracking-wider transition cursor-pointer ${isDark
                    ? 'bg-[#1c1c1b] border-white/10 text-slate-300 hover:text-white'
                    : 'bg-stone-200 border-stone-300 text-stone-800 hover:text-black'
                    }`}
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-7 py-2.5 rounded-full bg-[#e9762b] text-white text-xs font-mono font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-lg shadow-orange-500/25"
                >
                  CREATE TABLE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Columns Manager (Delete / Restore Default & Custom Columns) */}
      {showColumnsManagerModal && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowColumnsManagerModal(false); }}
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
                  SETTINGS — {(mainTableTitle || 'STUDY LOG').toUpperCase()}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnsManagerModal(false)}
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
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark
                ? 'bg-[#181817] border-white/10'
                : 'bg-white/95 border-stone-200/90'
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
                      value={mainTableTitle}
                      onChange={(e) => setMainTableTitle(e.target.value)}
                      placeholder="Study Log"
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
                      value={mainTableDescription}
                      onChange={(e) => setMainTableDescription(e.target.value)}
                      placeholder="Optional subtitle"
                      className={`w-full border focus:border-[#e9762b] rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition ${isDark ? 'bg-[#121211] border-white/10 text-white placeholder-stone-600' : 'bg-white border-stone-300 text-stone-900 placeholder-stone-400 shadow-sm'
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. OPTIONS */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-2.5 transition-colors ${isDark
                ? 'bg-[#181817] border-white/10'
                : 'bg-white/95 border-stone-200/90'
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
                          : 'text-stone-500 hover:text-black dark:text-stone-400 dark:hover:text-white'
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
                          : 'text-stone-500 hover:text-black dark:text-stone-400 dark:hover:text-white'
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
                          : 'text-stone-500 hover:text-black dark:text-stone-400 dark:hover:text-white'
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
                          : 'text-stone-500 hover:text-black dark:text-stone-400 dark:hover:text-white'
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
                        onClick={() => setAutoGenerateRows(true)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${autoGenerateRows
                          ? 'bg-[#e9762b] text-white shadow-sm font-extrabold'
                          : 'text-stone-500 hover:text-black dark:text-stone-400 dark:hover:text-white'
                          }`}
                      >
                        ON
                      </button>
                      <button
                        type="button"
                        onClick={() => setAutoGenerateRows(false)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase transition cursor-pointer ${!autoGenerateRows
                          ? isDark
                            ? 'bg-white/10 text-white font-extrabold'
                            : 'bg-white text-stone-900 shadow-sm font-extrabold'
                          : 'text-stone-500 hover:text-black dark:text-stone-400 dark:hover:text-white'
                          }`}
                      >
                        OFF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. DEFAULT COLUMNS */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark
                ? 'bg-[#181817] border-white/10'
                : 'bg-white/95 border-stone-200/90'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                      DEFAULT COLUMNS
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-orange-500/15 text-[#e9762b] border border-orange-500/30 text-[10px] font-bold font-mono">
                      {activeDefaultColsCount}/{DEFAULT_COLUMNS_CONFIG.length}
                    </span>
                  </div>
                  {deletedDefaultColumns.length > 0 && (
                    <button
                      type="button"
                      onClick={resetDefaultColumns}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-[#e9762b] hover:bg-orange-500/20 border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>RESTORE ALL</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEFAULT_COLUMNS_CONFIG.map((col) => {
                    const isDeleted = deletedDefaultColumns.includes(col.key);
                    return (
                      <button
                        key={col.key}
                        type="button"
                        onClick={() => isDeleted ? restoreDefaultColumn(col.key) : deleteDefaultColumn(col.key)}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition cursor-pointer active:scale-95 ${isDeleted
                            ? isDark
                              ? 'bg-[#121211]/60 border-white/5 text-stone-500'
                              : 'bg-stone-100/80 border-stone-200 text-stone-400'
                            : isDark
                              ? 'bg-[#121211] border-white/10 text-white hover:border-[#e9762b]/50'
                              : 'bg-white border-stone-300 text-stone-900 hover:border-[#e9762b]/50 shadow-sm'
                          }`}
                        title={isDeleted ? `Show ${col.label}` : `Hide ${col.label}`}
                      >
                        <span className={`text-[11px] font-bold uppercase font-mono truncate ${isDeleted ? 'line-through' : ''}`}>
                          {col.label}
                        </span>
                        {isDeleted ? (
                          <EyeOff className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-[#e9762b] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. CUSTOM COLUMNS */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark
                ? 'bg-[#181817] border-white/10'
                : 'bg-white/95 border-stone-200/90'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                      CUSTOM COLUMNS
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-orange-500/15 text-[#e9762b] border border-orange-500/30 text-[10px] font-bold font-mono">
                      {customColumns.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddColumnModal(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#e9762b] text-white text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3 h-3 stroke-[3]" />
                    <span>ADD COLUMN</span>
                  </button>
                </div>

                {customColumns.length > 0 ? (
                  <div className={`divide-y rounded-xl border overflow-hidden max-h-48 overflow-y-auto custom-scrollbar ${isDark
                    ? 'divide-white/5 border-white/10 bg-[#121211]'
                    : 'divide-stone-200 border-stone-200 bg-[#faf6f0]'
                    }`}>
                    {customColumns.map((col, idx) => (
                      <div
                        key={col.id}
                        className="flex items-center justify-between px-3 py-2.5 gap-2 hover:bg-black/5 dark:hover:bg-white/[0.02] transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold uppercase font-mono text-stone-900 dark:text-white truncate">
                            {col.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-stone-200/80 dark:bg-white/10 text-stone-600 dark:text-slate-400 font-mono uppercase font-bold">
                            {col.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveColumn(idx, 'left')}
                            className="p-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move left"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === customColumns.length - 1}
                            onClick={() => handleMoveColumn(idx, 'right')}
                            className="p-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-400 hover:text-stone-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                            title="Move right"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete custom column "${col.name}"?`)) {
                                deleteCustomColumn(col.id);
                              }
                            }}
                            className="p-1 rounded-lg hover:bg-red-500/20 text-stone-400 hover:text-red-500 transition cursor-pointer"
                            title="Delete column"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-500 dark:text-slate-500 font-mono">
                    No custom columns yet.
                  </p>
                )}
              </div>

              {/* 5. DATA & ACTIONS */}
              <div className={`p-4 rounded-2xl border shadow-sm space-y-3 transition-colors ${isDark
                ? 'bg-[#181817] border-white/10'
                : 'bg-white/95 border-stone-200/90'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#e9762b] font-mono">
                    DATA &amp; ACTIONS
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
                    {dailyLogs.length} {dailyLogs.length === 1 ? 'ENTRY' : 'ENTRIES'}
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
                    disabled={dailyLogs.length === 0}
                    onClick={() => {
                      if (window.confirm('Delete ALL recorded daily log entries? This cannot be undone.')) {
                        dailyLogs.forEach((l) => deleteDailyLog(l.date));
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isDark
                        ? 'bg-[#121211] border-white/10 text-stone-300 hover:text-red-400 hover:border-red-500/40'
                        : 'bg-white border-stone-300 text-stone-700 hover:text-red-600 hover:border-red-400 shadow-sm'
                      }`}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>CLEAR LOGS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Hide the default Study Log table? (You can restore it anytime)')) {
                        deleteDefaultTable();
                        setShowColumnsManagerModal(false);
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/25 text-[11px] font-bold uppercase tracking-wider transition cursor-pointer active:scale-95"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>HIDE TABLE</span>
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
                  onClick={() => setShowColumnsManagerModal(false)}
                  className={`px-5 py-2.5 rounded-full border text-xs font-bold uppercase tracking-wider transition cursor-pointer active:scale-95 ${isDark
                    ? 'bg-[#1c1c1b] border-white/10 text-slate-300 hover:text-white'
                    : 'bg-stone-200 border-stone-300 text-stone-800 hover:text-black'
                    }`}
                >
                  CLOSE
                </button>
                <button
                  type="button"
                  onClick={() => setShowColumnsManagerModal(false)}
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
      {/* FULL TABLE SPREADSHEET MODAL / IMMERSIVE VIEW             */}
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
                    {mainTableTitle}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e9762b]/20 text-[#e9762b] border border-orange-500/30">
                    FULL SPREADSHEET
                  </span>
                </div>
                <p className="text-[10px] text-stone-400 hidden sm:block truncate">
                  Inspect multiple rows and columns simultaneously
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="hidden xs:flex items-center px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-stone-300">
                <span>{filteredDailyLogs.length} DAYS</span>
              </div>
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
              <table className="w-full min-w-full text-left text-xs border-separate border-spacing-0">
                <thead className="sticky top-0 z-40 glass-table-header text-stone-200 select-none">
                  <tr className="uppercase tracking-[0.14em] text-[11px] font-bold">
                    <th className="py-2.5 px-2.5 sm:px-4 sticky left-0 z-50 glass-sticky-th border-r border-white/10 min-w-[84px] w-[84px] sm:min-w-[130px] sm:w-[130px]">
                      DATE
                    </th>
                    {DEFAULT_COLUMNS_CONFIG.map((col) => {
                      if (deletedDefaultColumns.includes(col.key)) return null;
                      return (
                        <th key={col.key} className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[70px]">
                          {col.label}
                        </th>
                      );
                    })}
                    {customColumns.map((col) => (
                      <th key={col.id} className="py-2.5 px-2.5 text-center whitespace-nowrap min-w-[80px]">
                        {formatColumnHeader(col.name, col.unit)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredDailyLogs.map((entry) => (
                    <tr key={entry.date} className="even:bg-white/[0.015] hover:bg-white/[0.05] transition-colors">
                      {/* Sticky Date */}
                      <td className="py-2 px-2 sm:px-3 sticky left-0 z-20 glass-sticky-col-cell border-r border-white/10 min-w-[84px] w-[84px] sm:min-w-[130px] sm:w-[130px]">
                        <span className="inline-block px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-extrabold text-[#e9762b] bg-orange-500/10 border border-orange-500/30">
                          {formatDateDisplay(entry.date)}
                        </span>
                      </td>
                      {/* Default Cols */}
                      {!deletedDefaultColumns.includes('studyHours') && (
                        <td className="py-2 px-2.5 text-center font-mono-numbers">
                          {entry.studyHours ? <b className="text-white">{entry.studyHours}h</b> : <span className="text-white/20">--</span>}
                        </td>
                      )}
                      {!deletedDefaultColumns.includes('attendedClass') && (
                        <td className="py-2 px-2 text-center">
                          <TriStateBadge
                            value={entry.attendedClass}
                            onChange={(v) => updateDailyLogField(entry.date, 'attendedClass', v)}
                            cycleEnabled={enableClickToCycle}
                            className="mx-auto"
                          />
                        </td>
                      )}
                      {!deletedDefaultColumns.includes('pyqsSolved') && (
                        <td className="py-2 px-2.5 text-center font-mono-numbers">
                          {entry.pyqsSolved ? <span className="text-white font-bold">{entry.pyqsSolved}</span> : <span className="text-white/20">--</span>}
                        </td>
                      )}
                      {!deletedDefaultColumns.includes('revisionDone') && (
                        <td className="py-2 px-2 text-center">
                          <TriStateBadge
                            value={entry.revisionDone}
                            onChange={(v) => updateDailyLogField(entry.date, 'revisionDone', v)}
                            cycleEnabled={enableClickToCycle}
                            className="mx-auto"
                          />
                        </td>
                      )}
                      {!deletedDefaultColumns.includes('mockTestTaken') && (
                        <td className="py-2 px-2 text-center">
                          <TriStateBadge
                            value={entry.mockTestTaken}
                            onChange={(v) => updateDailyLogField(entry.date, 'mockTestTaken', v)}
                            cycleEnabled={enableClickToCycle}
                            className="mx-auto"
                          />
                        </td>
                      )}
                      {!deletedDefaultColumns.includes('sleepHours') && (
                        <td className="py-2 px-2.5 text-center font-mono-numbers">
                          {entry.sleepHours ? `${entry.sleepHours}h` : <span className="text-white/20">--</span>}
                        </td>
                      )}
                      {!deletedDefaultColumns.includes('notes') && (
                        <td
                          className="py-2 px-2.5 text-center text-[10px] text-stone-400 max-w-[140px] truncate relative"
                          title={entry.notes ? entry.notes : 'No note'}
                        >
                          {entry.notes ? (
                            <div className="relative inline-flex items-center justify-center group/note">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveViewNoteDate(activeViewNoteDate === 'full-' + entry.date ? null : 'full-' + entry.date);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-[#e9762b] bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 transition cursor-pointer select-none active:scale-95"
                                title="Click to view note"
                              >
                                Note
                              </button>
                              {activeViewNoteDate === 'full-' + entry.date && (
                                <>
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveViewNoteDate(null);
                                    }}
                                  />
                                  <div
                                    className="absolute bottom-full mb-2 z-50 left-1/2 -translate-x-1/2 glass-modal text-xs px-4 py-2.5 rounded-xl shadow-2xl max-w-sm min-w-[180px] sm:min-w-[220px] text-left whitespace-normal border border-white/10 animate-in fade-in zoom-in-95 duration-150"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[10px] text-[#e9762b] uppercase font-bold tracking-wider block mb-1 font-mono">
                                      {formatDateDisplay(entry.date).toUpperCase()} NOTE:
                                    </span>
                                    <p className="text-stone-200 text-xs sm:text-sm leading-relaxed break-words font-mono whitespace-pre-wrap select-text">
                                      {entry.notes}
                                    </p>
                                    <div className="w-2 h-2 glass-modal border-r border-b border-white/20 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/20">--</span>
                          )}
                        </td>
                      )}
                      {!deletedDefaultColumns.includes('focusRating') && (
                        <td className="py-2 px-2.5 text-center font-mono-numbers">
                          {entry.focusRating ? `${entry.focusRating}/5` : <span className="text-white/20">--</span>}
                        </td>
                      )}
                      {/* Custom columns */}
                      {customColumns.map((col) => {
                        const val = entry.customData?.[col.id];
                        return (
                          <td key={col.id} className="py-2 px-2.5 text-center text-xs whitespace-nowrap">
                            {col.type === 'boolean' ? (
                              <TriStateBadge
                                value={val}
                                onChange={(nv) => updateDailyLogCustomField(entry.date, col.id, nv)}
                                cycleEnabled={enableClickToCycle}
                                className="mx-auto"
                              />
                            ) : val !== undefined && val !== null && val !== '' ? (
                              String(val)
                            ) : (
                              <span className="text-white/20">--</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyStudyLog;
