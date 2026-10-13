import React, { useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { translations } from '../i18n/translations';
import { RevisionConfidence, TopicStatus } from '../types';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  Sparkles, 
  Calendar, 
  Edit3, 
  Save, 
  X,
  Filter
} from 'lucide-react';

export const SyllabusMapScreen: React.FC = () => {
  const { 
    language, 
    subjects, 
    addSubject, 
    addChapter, 
    addTopic, 
    toggleTopicStatus, 
    setTopicConfidence, 
    updateChapterNotes 
  } = useStudyStore();
  const t = translations[language];

  // Filtering
  const [filterUrgent, setFilterUrgent] = useState(false);

  // Accordion state: open chapters
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({
    'ch-math-1': true,
    'ch-phys-1': true,
    'ch-chem-1': true,
    'ch-cs-1': true,
  });

  // Modal states
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjColor, setNewSubjColor] = useState('#e9762b');
  const [newSubjExamDate, setNewSubjExamDate] = useState('');

  const [addChapterModalSubjId, setAddChapterModalSubjId] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  const [addTopicModal, setAddTopicModal] = useState<{ subjId: string; chapId: string } | null>(null);
  const [newTopicName, setNewTopicName] = useState('');

  // Chapter notes modal
  const [activeNotesChap, setActiveNotesChap] = useState<{ subjId: string; chapId: string; title: string; notes: string; formulas: string } | null>(null);

  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  // Filter subjects if urgent (< 30 days to exam)
  const filteredSubjects = subjects.filter((s) => {
    if (!filterUrgent) return true;
    if (!s.examDate) return false;
    const diffDays = Math.ceil((new Date(s.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  });

  // Overall syllabus completion stats
  let totalTopics = 0;
  let completedTopics = 0;
  subjects.forEach((s) => {
    s.chapters.forEach((c) => {
      c.topics.forEach((top) => {
        totalTopics++;
        if (top.status === 'completed') completedTopics++;
      });
    });
  });
  const overallPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Add Subject submission
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubjName.trim()) {
      addSubject(newSubjName.trim(), newSubjColor, 'BookOpen', newSubjExamDate || undefined);
      setNewSubjName('');
      setShowAddSubjectModal(false);
    }
  };

  // Add Chapter submission
  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (addChapterModalSubjId && newChapterTitle.trim()) {
      addChapter(addChapterModalSubjId, newChapterTitle.trim());
      setNewChapterTitle('');
      setAddChapterModalSubjId(null);
    }
  };

  // Add Topic submission
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (addTopicModal && newTopicName.trim()) {
      addTopic(addTopicModal.subjId, addTopicModal.chapId, newTopicName.trim());
      setNewTopicName('');
      setAddTopicModal(null);
    }
  };

  // Save Chapter Notes
  const handleSaveNotes = () => {
    if (activeNotesChap) {
      updateChapterNotes(activeNotesChap.subjId, activeNotesChap.chapId, activeNotesChap.notes, activeNotesChap.formulas);
      setActiveNotesChap(null);
    }
  };

  const confidenceCycles: RevisionConfidence[] = ['strong', 'medium', 'weak'];

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-fadeIn">
      {/* ======================================================== */}
      {/* 1. HEADER & OVERALL PROGRESS                             */}
      {/* ======================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl glass-panel border border-white/10 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.syllabusMap.title}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {t.syllabusMap.subtitle}
          </h1>
          <p className="text-xs text-slate-400">
            {completedTopics} of {totalTopics} topics mastered ({overallPercent}%)
          </p>
        </div>

        {/* Filter and Add Subject Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setFilterUrgent(!filterUrgent)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
              filterUrgent
                ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                : 'bg-slate-800/80 border-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterUrgent ? t.syllabusMap.filterUrgent : t.syllabusMap.filterAll}</span>
          </button>

          <button
            onClick={() => setShowAddSubjectModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.syllabusMap.addSubject}</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SUBJECTS LIST & CHAPTER HIERARCHY                     */}
      {/* ======================================================== */}
      <div className="space-y-6">
        {filteredSubjects.map((subj) => {
          // Calculate subject stats
          let subjTopicsTotal = 0;
          let subjTopicsCompleted = 0;
          subj.chapters.forEach((c) => {
            c.topics.forEach((t) => {
              subjTopicsTotal++;
              if (t.status === 'completed') subjTopicsCompleted++;
            });
          });
          const subjPercent = subjTopicsTotal > 0 ? Math.round((subjTopicsCompleted / subjTopicsTotal) * 100) : 0;

          // Exam remaining days
          let daysToExam: number | null = null;
          if (subj.examDate) {
            daysToExam = Math.ceil((new Date(subj.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          }

          return (
            <div
              key={subj.id}
              className="rounded-3xl glass-panel border border-white/10 p-5 sm:p-6 shadow-xl space-y-4"
              style={{ borderLeftColor: subj.color, borderLeftWidth: '5px' }}
            >
              {/* Subject Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md font-bold"
                    style={{ backgroundColor: `${subj.color}25`, color: subj.color }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-extrabold text-white">
                        {subj.name}
                      </h2>
                      {daysToExam !== null && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          daysToExam <= 14 
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}>
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {t.syllabusMap.examIn} {daysToExam} {t.syllabusMap.days}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {subj.chapters.length} chapters • {subjTopicsCompleted}/{subjTopicsTotal} topics mastered
                    </p>
                  </div>
                </div>

                {/* Subject completion bar & Add Chapter button */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-24 sm:w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${subjPercent}%`, backgroundColor: subj.color }}
                      />
                    </div>
                    <span className="text-xs font-mono-numbers font-bold text-white">
                      {subjPercent}%
                    </span>
                  </div>

                  <button
                    onClick={() => setAddChapterModalSubjId(subj.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold border border-white/10 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.syllabusMap.addChapter}</span>
                  </button>
                </div>
              </div>

              {/* Chapters List */}
              <div className="space-y-3 pt-1">
                {subj.chapters.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center italic">
                    No chapters added yet. Click "+ Add Chapter" above.
                  </p>
                ) : (
                  subj.chapters.map((chap) => {
                    const isOpen = openChapters[chap.id] ?? false;
                    const chapTotal = chap.topics.length;
                    const chapDone = chap.topics.filter((t) => t.status === 'completed').length;

                    return (
                      <div
                        key={chap.id}
                        className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden transition"
                      >
                        {/* Chapter Accordion Header */}
                        <div className="flex items-center justify-between p-3.5 hover:bg-white/[0.02] cursor-pointer">
                          <div 
                            onClick={() => toggleChapter(chap.id)}
                            className="flex items-center gap-2.5 flex-1 min-w-0"
                          >
                            <button className="text-slate-400 hover:text-white transition">
                              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <span className="text-sm font-bold text-slate-200 truncate">
                              {chap.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({chapDone}/{chapTotal})
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Formulas & Notes Button */}
                            <button
                              onClick={() => setActiveNotesChap({
                                subjId: subj.id,
                                chapId: chap.id,
                                title: chap.title,
                                notes: chap.notes || '',
                                formulas: chap.formulas || ''
                              })}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition"
                              title="Open Formulas and Cheat-Sheet"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{t.syllabusMap.notesAndFormulas}</span>
                            </button>

                            {/* Add Topic to Chapter */}
                            <button
                              onClick={() => setAddTopicModal({ subjId: subj.id, chapId: chap.id })}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
                              title="Add Topic"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Topics List (Accordion Body) */}
                        {isOpen && (
                          <div className="p-3.5 pt-0 space-y-2 border-t border-white/5 bg-black/20">
                            {chap.topics.length === 0 ? (
                              <p className="text-xs text-slate-500 py-2 italic text-center">
                                No topics in this chapter. Click + to add topics.
                              </p>
                            ) : (
                              chap.topics.map((topic) => {
                                // Confidence label from dictionary
                                const confLabel = t.syllabusMap.confidenceTags[topic.confidence];
                                
                                return (
                                  <div
                                    key={topic.id}
                                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-white/10 transition"
                                  >
                                    {/* 1-Tap Status Toggle */}
                                    <div className="flex items-center gap-3 min-w-0">
                                      <button
                                        onClick={() => toggleTopicStatus(subj.id, chap.id, topic.id)}
                                        className="transition transform hover:scale-110 shrink-0"
                                        title={`Status: ${topic.status}. Click to cycle.`}
                                      >
                                        {topic.status === 'completed' && (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                                        )}
                                        {topic.status === 'in_progress' && (
                                          <Clock className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                                        )}
                                        {topic.status === 'pending' && (
                                          <div className="w-4 h-4 rounded-full border border-slate-600" />
                                        )}
                                      </button>
                                      <span className={`text-xs font-medium truncate ${
                                        topic.status === 'completed' ? 'text-slate-200 font-semibold' : 'text-slate-300'
                                      }`}>
                                        {topic.name}
                                      </span>
                                    </div>

                                    {/* Confidence Tag Pill (Cycle Strong / Medium / Weak) */}
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        onClick={() => {
                                          const nextIdx = (confidenceCycles.indexOf(topic.confidence) + 1) % confidenceCycles.length;
                                          setTopicConfidence(subj.id, chap.id, topic.id, confidenceCycles[nextIdx]);
                                        }}
                                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                                          topic.confidence === 'strong'
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                            : topic.confidence === 'medium'
                                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                        }`}
                                        title="Click to toggle revision confidence (Strong / Medium / Weak)"
                                      >
                                        {confLabel}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 3. CHAPTER NOTES & FORMULAS MODAL                        */}
      {/* ======================================================== */}
      {activeNotesChap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-[#0c0c0b] border border-indigo-500/30 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white truncate max-w-[280px]">
                  {activeNotesChap.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveNotesChap(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Key Formulas & Identities:
                </label>
                <textarea
                  value={activeNotesChap.formulas}
                  onChange={(e) => setActiveNotesChap({ ...activeNotesChap, formulas: e.target.value })}
                  placeholder="e.g. ∫sec²x dx = tan x + C | Maxwell Equations"
                  rows={3}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs font-mono text-cyan-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Summary Notes & Mnemonics:
                </label>
                <textarea
                  value={activeNotesChap.notes}
                  onChange={(e) => setActiveNotesChap({ ...activeNotesChap, notes: e.target.value })}
                  placeholder="Key concepts, common exam pitfalls, shortcuts..."
                  rows={4}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 shadow-inner"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveNotesChap(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSaveNotes}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 text-white text-xs font-bold shadow-lg transition"
              >
                <Save className="w-4 h-4" />
                <span>{t.syllabusMap.saveNotes}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ADD SUBJECT MODAL                                     */}
      {/* ======================================================== */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleCreateSubject} className="w-full max-w-md rounded-3xl p-6 bg-[#0c0c0b] border border-indigo-500/30 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {t.syllabusMap.addSubject}
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.syllabusMap.subjectName}:
              </label>
              <input
                type="text"
                required
                value={newSubjName}
                onChange={(e) => setNewSubjName(e.target.value)}
                placeholder="e.g. Inorganic Chemistry, World History..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.syllabusMap.colorTheme}:
              </label>
              <div className="flex items-center gap-2">
                {['#e9762b', '#e9e4da', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewSubjColor(color)}
                    className={`w-7 h-7 rounded-full transition transform ${newSubjColor === color ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Upcoming Exam Date (Optional):
              </label>
              <input
                type="date"
                value={newSubjExamDate}
                onChange={(e) => setNewSubjExamDate(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSubjectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                {t.syllabusMap.addSubject}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ADD CHAPTER MODAL                                     */}
      {/* ======================================================== */}
      {addChapterModalSubjId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleCreateChapter} className="w-full max-w-md rounded-3xl p-6 bg-[#0c0c0b] border border-indigo-500/30 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {t.syllabusMap.addChapter}
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Chapter Title:
              </label>
              <input
                type="text"
                required
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="e.g. Thermodynamics & Heat Transfer"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddChapterModalSubjId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                {t.syllabusMap.addChapter}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. ADD TOPIC MODAL                                       */}
      {/* ======================================================== */}
      {addTopicModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <form onSubmit={handleCreateTopic} className="w-full max-w-md rounded-3xl p-6 bg-[#0c0c0b] border border-indigo-500/30 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">
              {t.syllabusMap.addTopic}
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Topic Name:
              </label>
              <input
                type="text"
                required
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="e.g. Carnot Engine & Efficiency"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAddTopicModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                {t.syllabusMap.addTopic}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
