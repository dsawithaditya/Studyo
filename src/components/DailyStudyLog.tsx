import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  useStudyStore, 
  getLocalTodayDateString, 
  ensureDailyLogsDateWise 
} from '../store/useStudyStore';
import { DailyLogEntry, CustomColumn, CustomColumnType, CustomTableColumnType, DefaultTableColumnKey } from '../types';
import { ShinyButton } from './ui/shiny-button';
import { YesNoToggle } from './ui/YesNoToggle';
import { CustomStudyTableView } from './CustomStudyTableView';
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
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const DEFAULT_COLUMNS_CONFIG: {
  key: DefaultTableColumnKey;
  label: string;
  minWidth: string;
  title?: string;
  description: string;
}[] = [
  { key: 'studyHours', label: 'HOURS', minWidth: 'min-w-[78px] sm:min-w-[92px]', description: 'Study duration in hours' },
  { key: 'attendedClass', label: 'CLASS', minWidth: 'min-w-[72px] sm:min-w-[84px]', description: 'Attended lecture/class' },
  { key: 'pyqsSolved', label: 'PYQS', minWidth: 'min-w-[74px] sm:min-w-[86px]', description: 'Past year questions solved count' },
  { key: 'revisionDone', label: 'REV', minWidth: 'min-w-[72px] sm:min-w-[84px]', title: 'Revision Done', description: 'Revision completed status' },
  { key: 'mockTestTaken', label: 'MOCK', minWidth: 'min-w-[72px] sm:min-w-[84px]', title: 'Mock Test Taken', description: 'Mock exam or test taken' },
  { key: 'sleepHours', label: 'SLEEP', minWidth: 'min-w-[74px] sm:min-w-[86px]', description: 'Sleep duration in hours' },
  { key: 'notes', label: 'NOTES', minWidth: 'min-w-[72px] sm:min-w-[84px]', description: 'Daily summary notes' },
  { key: 'focusRating', label: 'FOCUS', minWidth: 'min-w-[78px] sm:min-w-[92px]', description: 'Focus rating (1-5)' },
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
    deleteDefaultColumn,
    restoreDefaultColumn,
    resetDefaultColumns,
    isDefaultTableDeleted = false,
    deleteDefaultTable,
    restoreDefaultTable,
    syncUserData,
    isSyncing,
    syncError,
  } = useStudyStore();

  const todayStr = getLocalTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayYear = yesterday.getFullYear();
  const yesterdayMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
  const yesterdayDay = String(yesterday.getDate()).padStart(2, '0');
  const yesterdayStr = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

  const dailyLogs = useMemo(
    () => ensureDailyLogsDateWise(Array.isArray(rawLogs) ? rawLogs : []),
    [rawLogs]
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
      const uid = useAuthStore.getState().currentUser?.id;
      if (uid) {
        syncUserData(uid);
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

  const [editingColumn, setEditingColumn] = useState<{
    id: string;
    name: string;
    type: CustomColumnType;
    options: string;
    index: number;
  } | null>(null);

  // Month/Year navigation and Chunk loading state
  const [selectedMonthYear, setSelectedMonthYear] = useState<string>('all');
  const [visibleLimit, setVisibleLimit] = useState<number>(20);

  // Add Row Modal State (for adding date rows - today or any past date)
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [addRowDate, setAddRowDate] = useState(todayStr);
  const [addRowStudyHours, setAddRowStudyHours] = useState<number | ''>('');
  const [addRowAttendedClass, setAddRowAttendedClass] = useState<boolean>(false);
  const [addRowPyqs, setAddRowPyqs] = useState<number | ''>('');
  const [addRowRevisionDone, setAddRowRevisionDone] = useState<boolean>(false);
  const [addRowMockTest, setAddRowMockTest] = useState<boolean>(false);
  const [addRowSleepHours, setAddRowSleepHours] = useState<number | ''>('');
  const [addRowRating, setAddRowRating] = useState<number | null>(null);
  const [addRowNotes, setAddRowNotes] = useState<string>('');
  const [addRowCustomData, setAddRowCustomData] = useState<Record<string, any>>({});

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

  const activeDefaultColsCount = useMemo(() => {
    return DEFAULT_COLUMNS_CONFIG.filter((c) => !deletedDefaultColumns.includes(c.key)).length;
  }, [deletedDefaultColumns]);

  const totalDefaultTableCols = 1 + activeDefaultColsCount + customColumns.length + 1; // 1 for DATE, 1 for DEL

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableTitle.trim()) return;

    let initialCols: Array<{ name: string; type: CustomTableColumnType; unit?: string; options?: string[] }> = [];

    if (selectedTemplate === 'mock') {
      initialCols = [
        { name: 'PAPER', type: 'text' },
        { name: 'SCORE', type: 'number' },
        { name: 'TOTAL', type: 'number' },
        { name: 'ACCURACY', type: 'number', unit: '%' },
        { name: 'DIFFICULTY', type: 'select', options: ['High', 'Normal', 'Low'] },
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
  const [attendedClass, setAttendedClass] = useState<boolean>(false);
  const [pyqsSolved, setPyqsSolved] = useState<number | ''>('');
  const [revisionDone, setRevisionDone] = useState<boolean>(false);
  const [mockTestTaken, setMockTestTaken] = useState<boolean>(false);
  const [sleepHours, setSleepHours] = useState<number | ''>('');
  const [focusRating, setFocusRating] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [formCustomData, setFormCustomData] = useState<Record<string, any>>({});

  // Accordion editing state for "expand in place"
  const [accordionState, setAccordionState] = useState<{
    date: string;
    studyHours: number | '';
    attendedClass: boolean;
    pyqsSolved: number | '';
    revisionDone: boolean;
    mockTestTaken: boolean;
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
      setAttendedClass(existing.attendedClass ?? false);
      setPyqsSolved(existing.pyqsSolved != null && existing.pyqsSolved > 0 ? existing.pyqsSolved : '');
      setRevisionDone(existing.revisionDone ?? false);
      setMockTestTaken(existing.mockTestTaken ?? false);
      setSleepHours(existing.sleepHours != null && existing.sleepHours > 0 ? existing.sleepHours : '');
      setFocusRating(existing.focusRating && existing.focusRating > 0 ? existing.focusRating : null);
      setNotes(existing.notes || '');
      setFormCustomData({ ...(existing.customData || {}) });
    } else {
      setStudyHours('');
      setAttendedClass(false);
      setPyqsSolved('');
      setRevisionDone(false);
      setMockTestTaken(false);
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

    // Center table vertically if it fits within screen height with padding, otherwise align to top
    if (tableHeight < windowHeight - 90) {
      const centerScrollY = targetY - (windowHeight - tableHeight) / 2;
      window.scrollTo({ top: Math.max(0, centerScrollY), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: Math.max(0, targetY - 80), behavior: 'smooth' });
    }
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
        attendedClass: entry.attendedClass ?? false,
        pyqsSolved: entry.pyqsSolved != null && entry.pyqsSolved > 0 ? entry.pyqsSolved : '',
        revisionDone: entry.revisionDone ?? false,
        mockTestTaken: entry.mockTestTaken ?? false,
        sleepHours: entry.sleepHours != null && entry.sleepHours > 0 ? entry.sleepHours : '',
        focusRating: entry.focusRating && entry.focusRating > 0 ? entry.focusRating : null,
        notes: entry.notes || '',
        customData: { ...(entry.customData || {}) },
      });
      if (tableContainerRef.current) {
        setContainerWidth(tableContainerRef.current.clientWidth);
        tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
      setTimeout(() => {
        scrollToCenterTable();
      }, 80);
    }
  };

  // Open and focus notes directly (in form on top, or in accordion if already expanded)
  const handleOpenNoteEdit = (entry: DailyLogEntry) => {
    if (expandedDate === entry.date) {
      setTimeout(() => {
        const el = document.getElementById(`accordion-notes-${entry.date}`);
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else {
      handleSelectDayForForm(entry);
      setTimeout(() => {
        const el = document.getElementById('log-form-notes');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
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

  // Filter logs based on Month/Year / Last 30 Days selection
  const filteredDailyLogs = useMemo(() => {
    if (selectedMonthYear === 'all') return dailyLogs;
    if (selectedMonthYear === 'last30') {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);
      const y = cutoff.getFullYear();
      const m = String(cutoff.getMonth() + 1).padStart(2, '0');
      const d = String(cutoff.getDate()).padStart(2, '0');
      const cutoffStr = `${y}-${m}-${d}`;
      return dailyLogs.filter((l) => l.date >= cutoffStr && l.date <= todayStr);
    }
    return dailyLogs.filter((l) => l.date.startsWith(selectedMonthYear));
  }, [dailyLogs, selectedMonthYear, todayStr]);

  // Paginated/Chunked visible logs
  const visibleLogs = filteredDailyLogs.slice(0, visibleLimit);

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
      setAddRowAttendedClass(existing.attendedClass ?? false);
      setAddRowPyqs(existing.pyqsSolved != null && existing.pyqsSolved > 0 ? existing.pyqsSolved : '');
      setAddRowRevisionDone(existing.revisionDone ?? false);
      setAddRowMockTest(existing.mockTestTaken ?? false);
      setAddRowSleepHours(existing.sleepHours != null && existing.sleepHours > 0 ? existing.sleepHours : '');
      setAddRowRating(existing.focusRating && existing.focusRating > 0 ? existing.focusRating : null);
      setAddRowNotes(existing.notes || '');
      setAddRowCustomData({ ...(existing.customData || {}) });
    } else {
      setAddRowStudyHours('');
      setAddRowAttendedClass(false);
      setAddRowPyqs('');
      setAddRowRevisionDone(false);
      setAddRowMockTest(false);
      setAddRowSleepHours('');
      setAddRowRating(null);
      setAddRowNotes('');
      const initCustom: Record<string, any> = {};
      customColumns.forEach((col) => {
        if (col.type === 'boolean') initCustom[col.id] = false;
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
      setAddRowAttendedClass(existing.attendedClass ?? false);
      setAddRowPyqs(existing.pyqsSolved != null && existing.pyqsSolved > 0 ? existing.pyqsSolved : '');
      setAddRowRevisionDone(existing.revisionDone ?? false);
      setAddRowMockTest(existing.mockTestTaken ?? false);
      setAddRowSleepHours(existing.sleepHours != null && existing.sleepHours > 0 ? existing.sleepHours : '');
      setAddRowRating(existing.focusRating && existing.focusRating > 0 ? existing.focusRating : null);
      setAddRowNotes(existing.notes || '');
      setAddRowCustomData({ ...(existing.customData || {}) });
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
      attendedClass: Boolean(accordionState.attendedClass),
      pyqsSolved: accordionState.pyqsSolved === '' ? null : Math.max(0, Number(accordionState.pyqsSolved)),
      revisionDone: Boolean(accordionState.revisionDone),
      mockTestTaken: Boolean(accordionState.mockTestTaken),
      sleepHours: accordionState.sleepHours === '' ? null : Math.max(0, Number(accordionState.sleepHours)),
      focusRating: accordionState.focusRating ?? null,
      notes: accordionState.notes.trim(),
      customData: accordionState.customData || {},
    };
    addOrUpdateDailyLog(updatedEntry);
    setExpandedDate(null);
    setAccordionState(null);
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
    <div className="w-full flex flex-col space-y-6 animate-fadeIn">
      {/* 0. Multi-Table Capsule Switcher Dock */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 scrollbar-none border-b border-white/10">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* Main Daily Study Log Tab */}
          <button
            type="button"
            onClick={() => setActiveTableId('main')}
            className={`px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${
              activeTableId === 'main'
                ? 'bg-[#e9762b] text-black font-extrabold shadow-md shadow-orange-500/20'
                : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white border border-stone-300/80 dark:border-white/10'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Study Log</span>
            {isDefaultTableDeleted && (
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-400 font-bold uppercase">
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
              className={`px-4 py-2 rounded-full text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-2 whitespace-nowrap active:scale-95 ${
                activeTableId === tbl.id
                  ? 'bg-[#e9762b] text-black font-extrabold shadow-md shadow-orange-500/20'
                  : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white border border-stone-300/80 dark:border-white/10'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>{tbl.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTableId === tbl.id ? 'bg-black/20 text-black font-extrabold' : 'bg-stone-200/80 dark:bg-white/10 text-stone-700 dark:text-slate-400'
                }`}
              >
                {tbl.rows.length}
              </span>
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
            className="px-3.5 py-2 rounded-full glass-pill hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition border border-dashed border-stone-300/80 dark:border-white/20 hover:border-[#e9762b] cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95"
            title="Create a new custom table"
          >
            <Plus className="w-3.5 h-3.5 text-[#e9762b]" />
            <span>Add Table</span>
          </button>

          {/* Cloud Sync Button */}
          <button
            type="button"
            onClick={() => {
              const u = useAuthStore.getState().currentUser;
              if (u?.id) syncUserData(u.id, true);
            }}
            disabled={isSyncing}
            className={`px-3.5 py-2 rounded-full glass-pill hover:bg-stone-200/60 dark:hover:bg-white/10 text-xs font-mono font-bold uppercase tracking-wider transition border cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 ${
              isSyncing
                ? 'opacity-70 animate-pulse text-[#e9762b] border-[#e9762b]/50'
                : syncError
                ? 'text-red-400 border-red-500/50 bg-red-500/10'
                : justSynced
                ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10'
                : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white border-stone-300/80 dark:border-white/20 hover:border-[#e9762b]'
            }`}
            title={syncError || 'Sync study log with cloud'}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-[#e9762b] animate-spin" />
                <span>Syncing...</span>
              </>
            ) : syncError ? (
              <>
                <X className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400">Sync failed – retry</span>
              </>
            ) : justSynced ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Synced</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-[#e9762b]" />
                <span>Sync</span>
              </>
            )}
          </button>
          {syncError && (
            <span className="text-[10px] font-mono text-red-400 max-w-[240px] leading-tight">{syncError}</span>
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
                className={`px-3.5 py-1.5 rounded-lg uppercase tracking-wider font-bold transition cursor-pointer ${
                  formDate === todayStr
                    ? 'bg-[#e9762b] text-black shadow-md shadow-orange-500/20'
                    : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                TODAY
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
                      className={`h-7 w-full min-w-0 rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center p-0 ${
                        focusRating === val
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

            {/* Row 2: Habit Indicators (Class, Revision, Mock + Custom Yes/No Trackers) - 4 in a row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono text-xs">
              {/* Attended Class */}
              <div className="space-y-1.5 glass-panel p-3 rounded-xl">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                  ATTENDED CLASS?
                </label>
                <YesNoToggle
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
                <YesNoToggle
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
                <YesNoToggle
                  size="sm"
                  value={mockTestTaken}
                  onChange={setMockTestTaken}
                />
              </div>

              {/* Custom Yes/No Trackers in Top Form */}
              {customColumns
                .filter((col) => col.type === 'boolean')
                .map((col) => (
                  <div key={col.id} className="space-y-1.5 glass-panel p-3 rounded-xl">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 block font-bold truncate">
                      {col.name.toUpperCase()}?
                    </label>
                    <YesNoToggle
                      size="sm"
                      value={Boolean(formCustomData[col.id])}
                      onChange={(val: boolean) =>
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
                    title="Add a custom Yes/No tracker column"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ TRACKER</span>
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
            {/* Table Top Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono pb-4 border-b border-white/10">
              <div className="select-none flex items-center gap-3">
                <div 
                  onClick={scrollToCenterTable}
                  className="cursor-pointer group/title"
                  title="Click to center table on screen"
                >
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white group-hover/title:text-[#e9762b] transition tracking-tight uppercase font-mono">
                    Study Log
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete the default Study Log table? (You can restore it anytime)')) {
                      deleteDefaultTable();
                    }
                  }}
                  className="p-1.5 rounded-lg glass-pill hover:bg-red-500/20 text-stone-400 hover:text-red-400 border border-stone-300/40 dark:border-white/10 transition cursor-pointer"
                  title="Delete default Study Log table"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    MONTH:
                  </span>
                  <select
                    value={selectedMonthYear}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedMonthYear(val);
                      setVisibleLimit(val === 'last30' ? 30 : 20);
                    }}
                    className="bg-transparent text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none font-bold uppercase cursor-pointer font-mono"
                  >
                    <option value="all" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">ALL MONTHS</option>
                    <option value="last30" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">LAST 30 DAYS</option>
                    {availableMonths.map((m) => (
                      <option key={m.value} value={m.value} className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">
                        {m.label.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* + ROW Button */}
                <button
                  type="button"
                  onClick={() => handleOpenAddRowModal(todayStr)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full glass-pill hover:bg-[#e9762b] text-stone-700 dark:text-slate-200 hover:text-black text-xs font-bold uppercase tracking-wider transition border border-orange-950/15 dark:border-white/10 hover:border-[#e9762b] cursor-pointer shadow-sm font-mono active:scale-95"
                  title="Add a date row (today or any past date)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ROW</span>
                </button>

                {/* + COLUMN Button at top right */}
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full glass-pill hover:bg-[#e9762b] text-slate-200 hover:text-black text-xs font-bold uppercase tracking-wider transition border border-white/10 hover:border-[#e9762b] cursor-pointer shadow-sm font-mono active:scale-95"
                  title="Add a custom column"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>COLUMN</span>
                </button>

                {/* COLUMNS Manager Button */}
                <button
                  type="button"
                  onClick={() => setShowColumnsManagerModal(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full glass-pill hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider transition border border-stone-300/80 dark:border-white/10 hover:border-[#e9762b] cursor-pointer shadow-sm font-mono active:scale-95"
                  title="Manage columns (delete/restore default & custom columns)"
                >
                  <Settings2 className="w-3.5 h-3.5 text-[#e9762b]" />
                  <span>COLUMNS</span>
                </button>
              </div>
            </div>

            {/* Table Container with Sticky Horizontal & Vertical Scroll */}
            <div ref={tableSectionRef} className="w-full rounded-2xl glass-panel overflow-hidden font-mono shadow-2xl scroll-mt-24">
              <div ref={tableContainerRef} className="overflow-x-auto max-h-[80vh] overflow-y-auto relative scrollbar-thin scrollbar-thumb-white/20">
                <table className="w-full min-w-full text-left text-xs sm:text-sm border-separate border-spacing-0">
                  {/* Sticky Top Header */}
                  <thead 
                    onClick={scrollToCenterTable}
                    className="sticky top-0 z-40 glass-table-header cursor-pointer select-none"
                    title="Click table bar to center table on screen"
                  >
                    <tr className="text-xs text-stone-800 dark:text-slate-200 uppercase tracking-widest font-bold">
                      {/* Sticky Date Column Header */}
                      <th 
                        onClick={scrollToCenterTable}
                        className="py-3.5 px-3 sm:px-4 font-bold sticky left-0 top-0 z-50 glass-sticky-th border-r border-white/12 min-w-[110px] w-[110px] sm:min-w-[125px] sm:w-[125px] cursor-pointer"
                        title="Click date column to center table on screen"
                      >
                        DATE
                      </th>

                      {/* Dynamic Default Columns */}
                      {DEFAULT_COLUMNS_CONFIG.map((col) => {
                        if (deletedDefaultColumns.includes(col.key)) return null;
                        return (
                          <th
                            key={col.key}
                            className={`py-3.5 px-2.5 sm:px-3.5 font-bold text-center sticky top-0 z-40 ${col.minWidth} group/col`}
                            title={col.title || col.description}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>{col.label}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Delete "${col.label}" column from table?`)) {
                                    deleteDefaultColumn(col.key);
                                  }
                                }}
                                className="opacity-0 group-hover/col:opacity-100 hover:text-red-400 p-0.5 rounded transition cursor-pointer text-stone-400"
                                title={`Delete ${col.label} column`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </th>
                        );
                      })}

                      {/* Dynamic Custom Column Headers */}
                      {customColumns.map((col, idx) => (
                        <th
                          key={col.id}
                          className="py-3.5 px-3 sm:px-4 font-bold text-center whitespace-nowrap sticky top-0 z-40 min-w-[100px] sm:min-w-[120px] max-w-[160px] group/customcol"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingColumn({
                                  id: col.id,
                                  name: col.name,
                                  type: col.type,
                                  options: (col.options || []).join(', '),
                                  index: idx,
                                });
                              }}
                              className="text-xs uppercase tracking-wider font-bold text-stone-800 dark:text-slate-200 hover:text-[#e9762b] truncate max-w-[110px] cursor-pointer transition select-none font-mono"
                              title={`Click to edit "${col.name}" column`}
                            >
                              {col.name}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Delete column "${col.name}"?`)) {
                                  deleteCustomColumn(col.id);
                                }
                              }}
                              className="opacity-0 group-hover/customcol:opacity-100 hover:text-red-400 p-0.5 rounded transition cursor-pointer text-stone-400"
                              title={`Delete ${col.name} column`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      ))}

                      {/* DEL Column Header */}
                      <th className="py-3.5 px-2 font-bold text-center sticky top-0 z-40 min-w-[50px] w-[50px] text-stone-500 rounded-tr-xl">
                        DEL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {visibleLogs.length === 0 ? (
                      <tr>
                        <td
                          colSpan={totalDefaultTableCols}
                          className="py-12 text-center text-stone-500 dark:text-slate-400 font-mono text-xs"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Calendar className="w-8 h-8 text-[#e9762b] opacity-60" />
                        <p>No log entries found for this period.</p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddRowModal(todayStr)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e9762b] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 transition shadow-md shadow-orange-500/20 cursor-pointer active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
                        onClick={() => {
                          if (idx === 0) {
                            scrollToCenterTable();
                          }
                        }}
                        className={`hover:bg-white/[0.04] transition group/row ${
                          isExpanded ? 'bg-white/[0.04]' : ''
                        } ${idx === 0 ? 'cursor-pointer' : ''}`}
                        title={idx === 0 ? 'Click first row to center table on screen' : undefined}
                      >
                        {/* Pinned / Sticky Date Column - The ONLY button that opens edit/details */}
                        <td
                          onClick={scrollToCenterTable}
                          className={`py-3 sm:py-3.5 px-3 sm:px-4 whitespace-nowrap sticky left-0 z-20 glass-sticky-col-cell border-r border-black/10 dark:border-white/10 min-w-[110px] w-[110px] sm:min-w-[125px] sm:w-[125px] cursor-pointer ${
                            isExpanded ? '!bg-amber-500/15 dark:!bg-[#1a1a18]' : ''
                          }`}
                          title="Click date column to center table on screen"
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand(entry);
                              }}
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

                        {/* Study Hours Column */}
                        {!deletedDefaultColumns.includes('studyHours') && (
                          <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center min-w-[78px] sm:min-w-[92px]">
                            {entry.studyHours != null && Number(entry.studyHours) > 0 ? (
                              <span className="text-stone-900 dark:text-white font-mono font-bold text-xs sm:text-sm">{entry.studyHours}h</span>
                            ) : (
                              <span className="text-stone-400 dark:text-slate-600 font-mono text-xs sm:text-sm">--</span>
                            )}
                          </td>
                        )}

                        {/* Class Attended Pill */}
                        {!deletedDefaultColumns.includes('attendedClass') && (
                          <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[72px] sm:min-w-[84px]">
                            <button
                              type="button"
                              disabled={!enableTopForm}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!enableTopForm) return;
                                updateDailyLogField(entry.date, 'attendedClass', !entry.attendedClass);
                              }}
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide transition-all select-none ${
                                enableTopForm ? 'cursor-pointer active:scale-95' : 'cursor-default'
                              } ${
                                entry.attendedClass
                                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-600/40 dark:border-emerald-500/40 shadow-xs shadow-emerald-500/20 font-extrabold'
                                  : enableTopForm
                                    ? 'bg-stone-200/80 dark:bg-white/5 text-stone-700 dark:text-slate-400 border border-stone-300/80 dark:border-white/10 hover:border-stone-400 hover:text-stone-900 dark:hover:border-white/20 dark:hover:text-slate-300 font-bold'
                                    : 'bg-stone-200/60 dark:bg-white/5 text-stone-600 dark:text-slate-500 border border-stone-300/60 dark:border-white/5 font-bold'
                              }`}
                              title={enableTopForm ? "Click to toggle Class Attended" : "Enable 'EDIT FORM' switch or click date button to edit"}
                            >
                              {entry.attendedClass ? 'YES' : 'NO'}
                            </button>
                          </td>
                        )}

                        {/* PYQs Solved */}
                        {!deletedDefaultColumns.includes('pyqsSolved') && (
                          <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[74px] sm:min-w-[86px]">
                            {entry.pyqsSolved != null && Number(entry.pyqsSolved) > 0 ? (
                              <span className="text-stone-900 dark:text-white font-mono font-bold text-xs sm:text-sm">{entry.pyqsSolved}</span>
                            ) : (
                              <span className="text-stone-400 dark:text-slate-600 font-mono text-xs sm:text-sm">--</span>
                            )}
                          </td>
                        )}

                        {/* Revision Done Pill */}
                        {!deletedDefaultColumns.includes('revisionDone') && (
                          <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[72px] sm:min-w-[84px]">
                            <button
                              type="button"
                              disabled={!enableTopForm}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!enableTopForm) return;
                                updateDailyLogField(entry.date, 'revisionDone', !entry.revisionDone);
                              }}
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide transition-all select-none ${
                                enableTopForm ? 'cursor-pointer active:scale-95' : 'cursor-default'
                              } ${
                                entry.revisionDone
                                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-600/40 dark:border-emerald-500/40 shadow-xs shadow-emerald-500/20 font-extrabold'
                                  : enableTopForm
                                    ? 'bg-stone-200/80 dark:bg-white/5 text-stone-700 dark:text-slate-400 border border-stone-300/80 dark:border-white/10 hover:border-stone-400 hover:text-stone-900 dark:hover:border-white/20 dark:hover:text-slate-300 font-bold'
                                    : 'bg-stone-200/60 dark:bg-white/5 text-stone-600 dark:text-slate-500 border border-stone-300/60 dark:border-white/5 font-bold'
                              }`}
                              title={enableTopForm ? "Click to toggle Revision Done" : "Enable 'EDIT FORM' switch or click date button to edit"}
                            >
                              {entry.revisionDone ? 'YES' : 'NO'}
                            </button>
                          </td>
                        )}

                        {/* Mock Test Taken Pill */}
                        {!deletedDefaultColumns.includes('mockTestTaken') && (
                          <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[72px] sm:min-w-[84px]">
                            <button
                              type="button"
                              disabled={!enableTopForm}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!enableTopForm) return;
                                updateDailyLogField(entry.date, 'mockTestTaken', !entry.mockTestTaken);
                              }}
                              className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-mono tracking-wide transition-all select-none ${
                                enableTopForm ? 'cursor-pointer active:scale-95' : 'cursor-default'
                              } ${
                                entry.mockTestTaken
                                  ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-600/40 dark:border-emerald-500/40 shadow-xs shadow-emerald-500/20 font-extrabold'
                                  : enableTopForm
                                    ? 'bg-stone-200/80 dark:bg-white/5 text-stone-700 dark:text-slate-400 border border-stone-300/80 dark:border-white/10 hover:border-stone-400 hover:text-stone-900 dark:hover:border-white/20 dark:hover:text-slate-300 font-bold'
                                    : 'bg-stone-200/60 dark:bg-white/5 text-stone-600 dark:text-slate-500 border border-stone-300/60 dark:border-white/5 font-bold'
                              }`}
                              title={enableTopForm ? "Click to toggle Mock Test Taken" : "Enable 'EDIT FORM' switch or click date button to edit"}
                            >
                              {entry.mockTestTaken ? 'YES' : 'NO'}
                            </button>
                          </td>
                        )}

                        {/* Sleep Hours */}
                        {!deletedDefaultColumns.includes('sleepHours') && (
                          <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[74px] sm:min-w-[86px]">
                            {entry.sleepHours != null && Number(entry.sleepHours) > 0 ? (
                              <span className="text-stone-900 dark:text-white font-mono font-bold text-xs sm:text-sm">{entry.sleepHours}h</span>
                            ) : (
                              <span className="text-stone-400 dark:text-slate-600 font-mono text-xs sm:text-sm">--</span>
                            )}
                          </td>
                        )}

                        {/* Notes Column with Rich Tooltip (no icon) */}
                        {!deletedDefaultColumns.includes('notes') && (
                          <td className="py-3 sm:py-3.5 px-2.5 sm:px-3.5 text-center min-w-[72px] sm:min-w-[84px]">
                            {hasNote ? (
                              <div className="relative inline-flex items-center justify-center group/note">
                                <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold text-orange-950 dark:text-[#e9762b] bg-orange-500/20 dark:bg-orange-500/15 border border-orange-500/40 dark:border-orange-500/30 select-none">
                                  Note
                                </span>

                                {/* Hover Tooltip showing the note text */}
                                <div className="opacity-0 group-hover/note:opacity-100 pointer-events-none transition-opacity duration-200 absolute bottom-full mb-2 z-40 left-1/2 -translate-x-1/2 glass-modal text-xs px-3.5 py-2 rounded-xl shadow-2xl max-w-sm min-w-[200px] text-left whitespace-normal">
                                  <span className="text-[10px] text-[#e9762b] uppercase font-bold tracking-wider block mb-1">
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
                        )}

                        {/* Focus Rating */}
                        {!deletedDefaultColumns.includes('focusRating') && (
                          <td className="py-3 sm:py-3.5 px-3 sm:px-4 text-center text-stone-900 dark:text-slate-200 font-mono font-bold text-xs sm:text-sm min-w-[78px] sm:min-w-[92px]">
                            {entry.focusRating != null && Number(entry.focusRating) > 0 ? (
                              <span>{entry.focusRating}/5</span>
                            ) : (
                              <span className="text-stone-400 dark:text-slate-600 font-mono text-xs sm:text-sm">--</span>
                            )}
                          </td>
                        )}

                        {/* Dynamic Custom Column Cells */}
                        {customColumns.map((col) => {
                          const val = entry.customData?.[col.id];
                          return (
                            <td key={col.id} className="py-3 sm:py-3.5 px-3 sm:px-4 text-center whitespace-nowrap font-mono text-xs sm:text-sm min-w-[100px] sm:min-w-[120px] max-w-[160px]">
                              {col.type === 'boolean' && (
                                <button
                                  type="button"
                                  disabled={!enableTopForm}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!enableTopForm) return;
                                    updateDailyLogCustomField(entry.date, col.id, !val);
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
                                val !== undefined && val !== null && val !== '' && Number(val) > 0 ? (
                                  <span className="text-stone-900 dark:text-white font-bold">{val}</span>
                                ) : (
                                  <span className="text-stone-400 dark:text-slate-600 font-mono">--</span>
                                )
                              )}
                              {col.type === 'text' && (
                                val && String(val).trim() ? (
                                  <span
                                    className="text-stone-800 dark:text-slate-200 text-xs sm:text-sm max-w-[130px] truncate inline-block font-medium"
                                    title={val || ''}
                                  >
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-stone-400 dark:text-slate-600 font-mono">--</span>
                                )
                              )}
                              {col.type === 'select' && (
                                val && String(val).trim() ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 dark:bg-purple-500/15 text-purple-900 dark:text-purple-300 border border-purple-500/40 dark:border-purple-500/30">
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-stone-400 dark:text-slate-600 font-mono">--</span>
                                )
                              )}
                            </td>
                          );
                        })}

                        {/* DEL Column Cell */}
                        <td className="py-3 sm:py-3.5 px-2 text-center whitespace-nowrap min-w-[50px] w-[50px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEntry(entry.date);
                            }}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>

                      {/* Expand in place accordion sub-panel */}
                      {isExpanded && accordionState && (
                        <tr className="bg-white/[0.02] backdrop-blur-2xl border-b border-white/10" onClick={(e) => e.stopPropagation()}>
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
                                        className={`h-7 w-full min-w-0 rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center p-0 ${
                                          accordionState.focusRating === val
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
                                  <YesNoToggle
                                    size="sm"
                                    value={accordionState.attendedClass}
                                    onChange={(val: boolean) =>
                                      setAccordionState({ ...accordionState, attendedClass: val })
                                    }
                                  />
                                </div>

                                {/* Revision Done? */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                    REVISION DONE?
                                  </label>
                                  <YesNoToggle
                                    size="sm"
                                    value={accordionState.revisionDone}
                                    onChange={(val: boolean) =>
                                      setAccordionState({ ...accordionState, revisionDone: val })
                                    }
                                  />
                                </div>

                                {/* Mock Test Taken? */}
                                <div className="space-y-1.5">
                                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block truncate">
                                    MOCK TEST?
                                  </label>
                                  <YesNoToggle
                                    size="sm"
                                    value={accordionState.mockTestTaken}
                                    onChange={(val: boolean) =>
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
                                      <YesNoToggle
                                        size="sm"
                                        value={Boolean(accordionState.customData?.[col.id])}
                                        onChange={(val: boolean) =>
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white/[0.03] backdrop-blur-xl border-t border-orange-950/10 dark:border-white/10 font-mono text-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-stone-600 dark:text-slate-400">
              Showing <span className="text-stone-900 dark:text-white font-bold">{visibleLogs.length}</span> of{' '}
              <span className="text-stone-900 dark:text-white font-bold">{filteredDailyLogs.length}</span> days recorded
            </span>

            <div className="flex items-center gap-2">
              {filteredDailyLogs.length > visibleLogs.length && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 10)}
                  className="px-4 py-1.5 rounded-lg glass-pill hover:border-orange-500/40 text-[#e9762b] font-bold uppercase tracking-wider transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Load More (+10)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}

              {visibleLimit > 10 && (
                <button
                  type="button"
                  onClick={() => setVisibleLimit(10)}
                  className="px-3 py-1.5 rounded-lg bg-stone-200/90 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 text-stone-700 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white uppercase font-bold text-[11px] transition cursor-pointer border border-stone-300/80 dark:border-white/10"
                >
                  Show Less
                </button>
              )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-modal rounded-2xl p-6 sm:p-7 space-y-5 border border-white/20 shadow-2xl font-mono max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-orange-950/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#e9762b]" />
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                  Add Study Log Row
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
              {/* Date Selector with quick pills (Today, Yesterday) & Date Picker */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  SELECT DATE (TODAY OR ANY PAST DATE)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddRowDateChange(todayStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs uppercase font-bold transition cursor-pointer ${
                      addRowDate === todayStr
                        ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/20'
                        : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddRowDateChange(yesterdayStr)}
                    className={`px-3 py-1.5 rounded-lg text-xs uppercase font-bold transition cursor-pointer ${
                      addRowDate === yesterdayStr
                        ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/20'
                        : 'glass-pill text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white'
                    }`}
                  >
                    Yesterday
                  </button>
                  <input
                    type="date"
                    max={todayStr}
                    value={addRowDate}
                    onChange={(e) => handleAddRowDateChange(e.target.value)}
                    className="glass-input rounded-lg px-3 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none flex-1 min-w-[140px] font-mono cursor-pointer"
                    required
                  />
                </div>
                {dailyLogs.some((l) => l.date === addRowDate && ((l.studyHours != null && l.studyHours > 0) || l.attendedClass || (l.pyqsSolved != null && l.pyqsSolved > 0) || l.notes)) && (
                  <p className="text-[11px] text-[#e9762b] font-medium flex items-center gap-1 pt-1">
                    <span>*</span> Existing log found for {formatDateDisplay(addRowDate)}. Saving will update this row.
                  </p>
                )}
              </div>

              {/* Numerical Fields: Study Hours, PYQs, Sleep Hours */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                {/* Study Hours */}
                <div className="glass-panel p-3 rounded-xl space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                    STUDY HOURS
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="0"
                      value={addRowStudyHours}
                      onChange={(e) => setAddRowStudyHours(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                      className="w-full glass-input rounded-lg px-2 py-1 text-center font-bold text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-500 dark:text-slate-400">h</span>
                  </div>
                </div>

                {/* PYQs */}
                <div className="glass-panel p-3 rounded-xl space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                    PYQS
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={addRowPyqs}
                      onChange={(e) => setAddRowPyqs(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value)))}
                      className="w-full glass-input rounded-lg px-2 py-1 text-center font-bold text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-500 dark:text-slate-400">q</span>
                  </div>
                </div>

                {/* Sleep */}
                <div className="glass-panel p-3 rounded-xl space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                    SLEEP
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="24"
                      placeholder="0"
                      value={addRowSleepHours}
                      onChange={(e) => setAddRowSleepHours(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value)))}
                      className="w-full glass-input rounded-lg px-2 py-1 text-center font-bold text-stone-900 dark:text-white text-xs focus:outline-none"
                    />
                    <span className="text-[10px] text-stone-500 dark:text-slate-400">h</span>
                  </div>
                </div>
              </div>

              {/* Habit Toggles: Class, Revision, Mock */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                    CLASS ATTENDED?
                  </label>
                  <YesNoToggle
                    size="sm"
                    value={addRowAttendedClass}
                    onChange={(val) => setAddRowAttendedClass(val)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                    REVISION DONE?
                  </label>
                  <YesNoToggle
                    size="sm"
                    value={addRowRevisionDone}
                    onChange={(val) => setAddRowRevisionDone(val)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                    MOCK TEST?
                  </label>
                  <YesNoToggle
                    size="sm"
                    value={addRowMockTest}
                    onChange={(val) => setAddRowMockTest(val)}
                  />
                </div>
              </div>

              {/* Focus Rating (1-5) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                    FOCUS RATING ({addRowRating ? `${addRowRating}/5` : 'Not Rated'})
                  </label>
                  {addRowRating && (
                    <button
                      type="button"
                      onClick={() => setAddRowRating(null)}
                      className="text-[10px] text-stone-500 hover:text-stone-700 dark:hover:text-slate-300 underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAddRowRating(addRowRating === val ? null : val)}
                      className={`h-8 rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                        addRowRating === val
                          ? 'bg-[#e9762b] text-black font-extrabold shadow-sm shadow-orange-500/20'
                          : 'glass-pill text-stone-700 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
                      }`}
                    >
                      {val}★
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Trackers (if any exist) */}
              {customColumns.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-orange-950/10 dark:border-white/10">
                  <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                    CUSTOM COLUMNS
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customColumns.map((col) => (
                      <div key={col.id} className="space-y-1.5 glass-panel p-2.5 rounded-xl">
                        <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block truncate">
                          {col.name}
                        </label>
                        {col.type === 'boolean' && (
                          <YesNoToggle
                            size="sm"
                            value={Boolean(addRowCustomData[col.id])}
                            onChange={(val) => setAddRowCustomData({ ...addRowCustomData, [col.id]: val })}
                          />
                        )}
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
                            className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none"
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
                            className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none"
                          />
                        )}
                        {col.type === 'select' && (
                          <select
                            value={addRowCustomData[col.id] ?? ''}
                            onChange={(e) =>
                              setAddRowCustomData({ ...addRowCustomData, [col.id]: e.target.value })
                            }
                            className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-white focus:outline-none cursor-pointer"
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  NOTES (OPTIONAL)
                </label>
                <textarea
                  rows={2}
                  value={addRowNotes}
                  onChange={(e) => setAddRowNotes(e.target.value)}
                  placeholder="Topics studied, key achievements, or notes for this date..."
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none resize-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-950/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddRowModal(false)}
                  className="px-4 py-2 rounded-lg bg-stone-200/90 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 text-stone-700 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white uppercase font-bold text-xs transition cursor-pointer border border-stone-300/80 dark:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20"
                >
                  Save Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Column */}
      {showAddColumnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl font-mono space-y-6">
            <div className="flex items-center justify-between border-b border-orange-950/10 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white uppercase tracking-tight">
                  Add Column
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddColumnModal(false)}
                className="p-1 rounded-lg hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateColumn} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  COLUMN NAME
                </label>
                <input
                  type="text"
                  required
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="e.g. Mood, Water intake, Exercise, Pages read"
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  COLUMN TYPE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      type: 'boolean' as CustomColumnType,
                      label: 'YES / NO',
                      desc: 'Clickable Yes/No badge',
                      icon: CheckSquare,
                      color: 'text-[#10b981]',
                    },
                    {
                      type: 'number' as CustomColumnType,
                      label: 'Number',
                      desc: 'Numeric value input',
                      icon: Hash,
                      color: 'text-sky-400',
                    },
                    {
                      type: 'text' as CustomColumnType,
                      label: 'Short Text',
                      desc: 'Free text entry',
                      icon: Type,
                      color: 'text-amber-400',
                    },
                    {
                      type: 'select' as CustomColumnType,
                      label: 'Dropdown / Select',
                      desc: 'Pick from custom options',
                      icon: List,
                      color: 'text-purple-400',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = newColType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setNewColType(item.type)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/10 border-[#e9762b] shadow-sm shadow-orange-500/20'
                            : 'glass-pill text-stone-700 dark:text-slate-300 hover:border-stone-400 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                          <span className="font-bold text-stone-900 dark:text-white text-[11px]">{item.label}</span>
                        </div>
                        <span className="text-[10px] text-stone-500 dark:text-slate-500">{item.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {newColType === 'select' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                    DROPDOWN OPTIONS (comma separated)
                  </label>
                  <input
                    type="text"
                    value={newColOptions}
                    onChange={(e) => setNewColOptions(e.target.value)}
                    placeholder="e.g. Good, Okay, Bad, Exhausted"
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-stone-500 dark:text-slate-500 block">
                    Default if empty: Good, Okay, Bad
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-orange-950/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddColumnModal(false)}
                  className="px-4 py-2 glass-pill text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white uppercase font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#e9762b] text-black font-extrabold uppercase text-xs tracking-wider hover:brightness-110 active:scale-95 transition cursor-pointer shadow-md shadow-orange-500/20"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit / Configure Custom Column */}
      {editingColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md glass-modal rounded-2xl p-6 shadow-2xl font-mono space-y-6">
            <div className="flex items-center justify-between border-b border-orange-950/10 dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white uppercase tracking-tight">
                  Configure Column
                </h3>
              </div>
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
                      type: e.target.value as CustomColumnType,
                    })
                  }
                  className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  <option value="boolean" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">YES / NO (Clickable badge)</option>
                  <option value="number" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">Number (Numeric input)</option>
                  <option value="text" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">Short Text (Free text)</option>
                  <option value="select" className="bg-[#f7f5f0] text-slate-900 dark:bg-[#141413] dark:text-white">Dropdown / Select (Option badge)</option>
                </select>
              </div>

              {editingColumn.type === 'select' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                    OPTIONS (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingColumn.options}
                    onChange={(e) =>
                      setEditingColumn({ ...editingColumn, options: e.target.value })
                    }
                    className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-stone-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {/* Column Reordering */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  COLUMN POSITION
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={editingColumn.index === 0}
                    onClick={() => handleMoveColumn(editingColumn.index, 'left')}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-stone-200/90 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 disabled:opacity-30 text-stone-700 dark:text-slate-300 font-bold uppercase text-[11px] border border-stone-300/80 dark:border-white/10 transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Move Left</span>
                  </button>
                  <button
                    type="button"
                    disabled={editingColumn.index === customColumns.length - 1}
                    onClick={() => handleMoveColumn(editingColumn.index, 'right')}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 rounded-lg bg-stone-200/90 dark:bg-white/5 hover:bg-stone-300 dark:hover:bg-white/10 disabled:opacity-30 text-stone-700 dark:text-slate-300 font-bold uppercase text-[11px] border border-stone-300/80 dark:border-white/10 transition cursor-pointer disabled:cursor-not-allowed"
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
                  <span>Delete</span>
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

      {/* Modal: Create New Custom Table */}
      {showCreateTableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-modal rounded-2xl p-6 sm:p-8 space-y-6 border border-white/15 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Table2 className="w-5 h-5 text-[#e9762b]" />
                <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-wide uppercase">
                  Create Custom Table
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateTableModal(false)}
                className="p-1 rounded-full hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  TABLE TITLE
                </label>
                <input
                  type="text"
                  required
                  value={newTableTitle}
                  onChange={(e) => setNewTableTitle(e.target.value)}
                  placeholder="e.g. Mock Tests"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
                  DESCRIPTION (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={newTableDesc}
                  onChange={(e) => setNewTableDesc(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-600 focus:outline-none focus:border-[#e9762b]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-600 dark:text-slate-400 font-bold block">
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
                        className={`px-3.5 py-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500/15 dark:bg-orange-500/20 border-[#e9762b] shadow-sm shadow-orange-500/20 text-stone-900 dark:text-white font-extrabold'
                            : 'bg-stone-100/70 dark:bg-white/5 border-stone-200 dark:border-white/10 text-stone-700 dark:text-slate-300 hover:border-stone-300 dark:hover:border-white/20 hover:text-stone-900 dark:hover:text-white font-bold'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#e9762b]' : 'text-stone-500 dark:text-slate-400'}`} />
                        <span className="text-xs tracking-wide uppercase text-stone-900 dark:text-white">{tmpl.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowCreateTableModal(false)}
                  className="px-5 py-2.5 rounded-full border border-stone-300 dark:border-white/10 text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white text-xs uppercase font-bold tracking-wider transition cursor-pointer hover:bg-stone-100 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <ShinyButton
                  type="submit"
                  label="Create Table"
                  className="!px-6 !py-2.5 !text-xs !font-mono !font-extrabold !uppercase !tracking-wider"
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Columns Manager (Delete / Restore Default & Custom Columns) */}
      {showColumnsManagerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg glass-modal rounded-2xl p-6 sm:p-7 space-y-5 border border-white/20 shadow-2xl font-mono max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-orange-950/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#e9762b]" />
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                    Columns Manager
                  </h3>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400">
                    Delete or restore any column in the default table
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnsManagerModal(false)}
                className="p-1 rounded-full hover:bg-stone-200/60 dark:hover:bg-white/10 text-stone-500 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Default Columns List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  DEFAULT COLUMNS ({activeDefaultColsCount} / {DEFAULT_COLUMNS_CONFIG.length} ACTIVE)
                </span>
                {deletedDefaultColumns.length > 0 && (
                  <button
                    type="button"
                    onClick={resetDefaultColumns}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#e9762b] hover:underline cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore All</span>
                  </button>
                )}
              </div>

              <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden glass-panel">
                {DEFAULT_COLUMNS_CONFIG.map((col) => {
                  const isDeleted = deletedDefaultColumns.includes(col.key);
                  return (
                    <div
                      key={col.key}
                      className="flex items-center justify-between p-3 gap-3 hover:bg-white/[0.02] transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold uppercase font-mono ${isDeleted ? 'line-through text-stone-400 dark:text-slate-500' : 'text-stone-900 dark:text-white'}`}>
                            {col.label}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                              isDeleted
                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            }`}
                          >
                            {isDeleted ? 'Deleted' : 'Active'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate mt-0.5">
                          {col.description}
                        </p>
                      </div>

                      {isDeleted ? (
                        <button
                          type="button"
                          onClick={() => restoreDefaultColumn(col.key)}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold transition cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete "${col.label}" column from default table?`)) {
                              deleteDefaultColumn(col.key);
                            }
                          }}
                          className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Columns List */}
            {customColumns.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] uppercase tracking-widest text-[#e9762b] font-bold block">
                  CUSTOM COLUMNS ({customColumns.length})
                </span>
                <div className="divide-y divide-white/5 border border-white/10 rounded-xl overflow-hidden glass-panel">
                  {customColumns.map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center justify-between p-3 gap-3 hover:bg-white/[0.02] transition"
                    >
                      <div className="min-w-0">
                        <span className="text-xs font-bold uppercase font-mono text-stone-900 dark:text-white">
                          {col.name}
                        </span>
                        <span className="text-[10px] ml-2 px-1.5 py-0.2 rounded bg-white/10 text-slate-400 font-mono">
                          {col.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete custom column "${col.name}"?`)) {
                            deleteCustomColumn(col.id);
                          }
                        }}
                        className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold transition cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-4 border-t border-stone-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowColumnsManagerModal(false)}
                className="px-5 py-2 rounded-full bg-[#e9762b] text-black text-xs font-mono font-bold uppercase tracking-wider hover:brightness-110 transition cursor-pointer active:scale-95 shadow-md shadow-orange-500/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyStudyLog;
