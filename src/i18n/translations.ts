import { Language, RevisionConfidence } from '../types';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  nav: {
    dashboard: string;
    studyRoom: string;
    syllabusMap: string;
    analyticsHub: string;
    taskPlanner: string;
  };
  dashboard: {
    greeting: string;
    subGreeting: string;
    dailyTarget: string;
    targetProgress: string;
    streakCounter: string;
    streakDays: string;
    continueStudying: string;
    resumeSubject: string;
    topTasks: string;
    noTasksToday: string;
    quoteTitle: string;
    statsTotalToday: string;
    statsWeekTotal: string;
    statsTasksDone: string;
    statsSyllabusProgress: string;
    quickLaunch: string;
    neglectedWarning: string;
  };
  studyRoom: {
    title: string;
    startFocus: string;
    pomodoro: string;
    shortBreak: string;
    longBreak: string;
    stopwatch: string;
    selectSubject: string;
    selectChapter: string;
    noChapter: string;
    pause: string;
    resume: string;
    reset: string;
    complete: string;
    zenMode: string;
    exitZen: string;
    ambientSound: string;
    soundOff: string;
    soundRain: string;
    soundBrownNoise: string;
    soundBinaural: string;
    soundCafe: string;
    soundClock: string;
    scratchpadTitle: string;
    scratchpadPlaceholder: string;
    scratchpadHint: string;
    addDistraction: string;
    convertToTask: string;
    ratingModalTitle: string;
    ratingPrompt: string;
    sessionNotesPlaceholder: string;
    saveSession: string;
    ratingLabels: string[];
  };
  syllabusMap: {
    title: string;
    subtitle: string;
    overallCompletion: string;
    filterAll: string;
    filterUrgent: string;
    addSubject: string;
    addChapter: string;
    addTopic: string;
    confidenceTags: Record<RevisionConfidence, string>;
    statusPending: string;
    statusInProgress: string;
    statusCompleted: string;
    notesAndFormulas: string;
    noNotesYet: string;
    saveNotes: string;
    examIn: string;
    days: string;
    subjectName: string;
    colorTheme: string;
  };
  analyticsHub: {
    title: string;
    subtitle: string;
    heatmapTitle: string;
    heatmapSubtitle: string;
    filter7D: string;
    filter30D: string;
    filterAllTime: string;
    timeDistribution: string;
    peakHoursTitle: string;
    morning: string;
    afternoon: string;
    night: string;
    weeklyComparison: string;
    thisWeek: string;
    lastWeek: string;
    dailyAverage: string;
    neglectedAlert: (subject: string, days: number) => string;
    studyNow: string;
    exportSummary: string;
    exportPdf: string;
    close: string;
    sessionsOnDay: string;
    noSessionsDay: string;
    totalFocusHours: string;
    avgFocusQuality: string;
  };
  taskPlanner: {
    title: string;
    subtitle: string;
    tabToday: string;
    tabUpcoming: string;
    tabCompleted: string;
    addTask: string;
    taskTitle: string;
    subject: string;
    priority: string;
    dueDate: string;
    priorityHigh: string;
    priorityMed: string;
    priorityLow: string;
    countdownTitle: string;
    startPomodoroForTask: string;
    goalCompleted: string;
    markDone: string;
    deleteTask: string;
    noTasks: string;
    examCountdown: string;
    addExamCountdown: string;
  };
  common: {
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    loading: string;
    hours: string;
    minutes: string;
    hrs: string;
    mins: string;
    offlineMode: string;
    syncConnected: string;
    settings: string;
    language: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    appName: "Studyo",
    tagline: "Hyper-Optimized Student Analytics & Focus Engine",
    nav: {
      dashboard: "Dashboard",
      studyRoom: "Study Room",
      syllabusMap: "Syllabus Map",
      analyticsHub: "Analytics Hub",
      taskPlanner: "Task Planner",
    },
    dashboard: {
      greeting: "Welcome back! Ready to study?",
      subGreeting: "Consistency compounds. Keep the momentum going today.",
      dailyTarget: "Daily Target",
      targetProgress: "Target Progress",
      streakCounter: "Streak Counter",
      streakDays: "Days Streak",
      continueStudying: "Continue Studying",
      resumeSubject: "Quick Resume",
      topTasks: "Today's Top 3 Priorities",
      noTasksToday: "No pending priority tasks for today! Great job.",
      quoteTitle: "Daily Motivation & Insight",
      statsTotalToday: "Today's Focus",
      statsWeekTotal: "This Week",
      statsTasksDone: "Tasks Finished",
      statsSyllabusProgress: "Syllabus Done",
      quickLaunch: "Launch Focus Session",
      neglectedWarning: "Subject Attention Needed",
    },
    studyRoom: {
      title: "Focus Engine",
      startFocus: "Start Deep Focus Session",
      pomodoro: "Pomodoro (25m)",
      shortBreak: "Short Break (5m)",
      longBreak: "Long Break (15m)",
      stopwatch: "Stopwatch",
      selectSubject: "Select Subject",
      selectChapter: "Select Chapter",
      noChapter: "General Study / Problem Solving",
      pause: "Pause",
      resume: "Resume",
      reset: "Reset",
      complete: "End & Log Session",
      zenMode: "Zen Mode",
      exitZen: "Exit Zen Mode",
      ambientSound: "Ambient Soundscapes",
      soundOff: "Off",
      soundRain: "Rain Ambience",
      soundBrownNoise: "Brown Noise",
      soundBinaural: "Binaural (40Hz)",
      soundCafe: "Study Cafe",
      soundClock: "Clock Tick",
      scratchpadTitle: "Distraction Quick-Scratchpad",
      scratchpadPlaceholder: "Got a stray thought? Type it here so your mind stays clear...",
      scratchpadHint: "Jot it down to clear mental cache without switching tabs.",
      addDistraction: "Jot Down",
      convertToTask: "Move to Tasks",
      ratingModalTitle: "Session Completed!",
      ratingPrompt: "How focused did you feel during this session?",
      sessionNotesPlaceholder: "What formulas, chapters, or concepts did you master?",
      saveSession: "Save to Analytics",
      ratingLabels: ["Distracted", "Fair", "Focused", "High Flow", "God Mode 🔥"],
    },
    syllabusMap: {
      title: "Syllabus Map",
      subtitle: "Chapter & Topic Hierarchy with Mastery Tracking",
      overallCompletion: "Overall Completion",
      filterAll: "All Subjects",
      filterUrgent: "Exam Urgency (< 30d)",
      addSubject: "Add Subject",
      addChapter: "Add Chapter",
      addTopic: "Add Topic",
      confidenceTags: {
        strong: "Strong",
        medium: "Medium",
        weak: "Weak",
      },
      statusPending: "Pending",
      statusInProgress: "In Progress",
      statusCompleted: "Mastered",
      notesAndFormulas: "Formulas & Cheat-sheet",
      noNotesYet: "No notes or formula attachments yet. Click Edit to add key summaries.",
      saveNotes: "Save Notes",
      examIn: "Exam in",
      days: "days",
      subjectName: "Subject Name",
      colorTheme: "Color Theme",
    },
    analyticsHub: {
      title: "Analytics Hub",
      subtitle: "365-Day Activity Heatmap & Deep Performance Metrics",
      heatmapTitle: "Yearly Activity Heatmap",
      heatmapSubtitle: "Click any cell to inspect logged study sessions",
      filter7D: "Last 7 Days",
      filter30D: "Last 30 Days",
      filterAllTime: "All-Time",
      timeDistribution: "Subject Time Distribution",
      peakHoursTitle: "Peak Productivity Hours",
      morning: "Morning (5 AM - 12 PM)",
      afternoon: "Afternoon (12 PM - 6 PM)",
      night: "Night (6 PM - 4 AM)",
      weeklyComparison: "Weekly vs Monthly Trends",
      thisWeek: "This Week",
      lastWeek: "Previous Week",
      dailyAverage: "Daily Average",
      neglectedAlert: (subject, days) => `You haven't studied ${subject} for ${days} days`,
      studyNow: "Study Now",
      exportSummary: "Export Study Summary",
      exportPdf: "Download PDF / Printable Receipt",
      close: "Close",
      sessionsOnDay: "Sessions on",
      noSessionsDay: "No study sessions recorded on this day.",
      totalFocusHours: "Total Focus Hours",
      avgFocusQuality: "Avg Focus Rating",
    },
    taskPlanner: {
      title: "Task Planner",
      subtitle: "Actionable Priorities, Due Dates & Exam Countdowns",
      tabToday: "Today",
      tabUpcoming: "Upcoming",
      tabCompleted: "Completed",
      addTask: "New Actionable Task",
      taskTitle: "Task Title",
      subject: "Subject Tag",
      priority: "Priority Level",
      dueDate: "Due Date",
      priorityHigh: "High Priority",
      priorityMed: "Medium",
      priorityLow: "Low",
      countdownTitle: "Upcoming Exams & Deadlines",
      startPomodoroForTask: "Start Timer for this Task",
      goalCompleted: "Goal Completed!",
      markDone: "Mark Done",
      deleteTask: "Delete",
      noTasks: "No tasks found in this view.",
      examCountdown: "Exam Countdown",
      addExamCountdown: "Add Exam Deadline",
    },
    common: {
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      loading: "Loading...",
      hours: "hours",
      minutes: "mins",
      hrs: "h",
      mins: "m",
      offlineMode: "Offline Mode (Local Storage)",
      syncConnected: "Supabase Cloud Synced",
      settings: "Settings",
      language: "Language",
    },
  },

  hinglish: {
    appName: "Studyo",
    tagline: "Hyper-Optimized Student Analytics & Focus Engine",
    nav: {
      dashboard: "Dashboard",
      studyRoom: "Study Room",
      syllabusMap: "Syllabus Map",
      analyticsHub: "Analytics Hub",
      taskPlanner: "Task Planner",
    },
    dashboard: {
      greeting: "Welcome! Aaj ka target kya hai?",
      subGreeting: "Consistency se hi rank aayegi. Aaj ka focus session start karo!",
      dailyTarget: "Daily Target",
      targetProgress: "Target Progress",
      streakCounter: "Streak Counter",
      streakDays: "Days ki Streak 🔥",
      continueStudying: "Study shuru karein (Focus on!)",
      resumeSubject: "Quick Resume",
      topTasks: "Aaj ke Top 3 Priority Tasks",
      noTasksToday: "Aaj koi pending priority task nahi hai! Badhiya kaam.",
      quoteTitle: "Aaj Ka Motivation & Strategy",
      statsTotalToday: "Aaj ki Study",
      statsWeekTotal: "Is Hafte ki Study",
      statsTasksDone: "Tasks Khatam",
      statsSyllabusProgress: "Syllabus Covered",
      quickLaunch: "Focus Timer Start Karo",
      neglectedWarning: "Subject Alert! Attention Chahiye",
    },
    studyRoom: {
      title: "Focus Engine",
      startFocus: "Study shuru karein (Focus on!)",
      pomodoro: "Pomodoro (25m)",
      shortBreak: "Chhota Break (5m)",
      longBreak: "Lamba Break (15m)",
      stopwatch: "Stopwatch (Open study)",
      selectSubject: "Subject Chuniye",
      selectChapter: "Chapter Chuniye",
      noChapter: "General Study / Question Practice",
      pause: "Ruko (Pause)",
      resume: "Wapas Shuru (Resume)",
      reset: "Reset Karo",
      complete: "Session Finish & Save",
      zenMode: "Zen Mode (Distraction-Free)",
      exitZen: "Exit Zen Mode",
      ambientSound: "Focus Ambient Sounds",
      soundOff: "Off",
      soundRain: "Barish (Rain)",
      soundBrownNoise: "Brown Noise (Deep Focus)",
      soundBinaural: "Binaural Beats (40Hz)",
      soundCafe: "Library / Cafe",
      soundClock: "Ghadi ki Tik-Tik",
      scratchpadTitle: "Distraction Quick-Scratchpad",
      scratchpadPlaceholder: "Bhatakne wala khayal aaya? Yahan likh do taaki dimaag clear rahe...",
      scratchpadHint: "Fatafat likh do taaki focus na toote aur baad mein task bana sako.",
      addDistraction: "Likh Lo",
      convertToTask: "Task Mein Bhejo",
      ratingModalTitle: "Session Khatam! Shabaash!",
      ratingPrompt: "Is session mein focus kaisa raha?",
      sessionNotesPlaceholder: "Kaunse concepts, formulas ya chapters cover kiye?",
      saveSession: "Analytics Mein Save Karo",
      ratingLabels: ["Dhyan bhatak gaya", "Theek-thaak", "Achha focus", "Deep Flow", "Ekdum God Mode 🔥"],
    },
    syllabusMap: {
      title: "Syllabus Map",
      subtitle: "Chapters, Topics aur Revision Confidence Tracker",
      overallCompletion: "Overall Syllabus Completed",
      filterAll: "Saare Subjects",
      filterUrgent: "Exam Jaldi Hai (< 30 Din)",
      addSubject: "Naya Subject Add Karo",
      addChapter: "Naya Chapter Add Karo",
      addTopic: "Naya Topic Add Karo",
      confidenceTags: {
        strong: "Pakka",
        medium: "Theek-thaak",
        weak: "Kamzor",
      },
      statusPending: "Baaki Hai",
      statusInProgress: "Chal Raha Hai",
      statusCompleted: "Ho Gaya!",
      notesAndFormulas: "Formulas & Quick Notes",
      noNotesYet: "Abhi koi notes nahi hain. Edit par click karke formulas likho.",
      saveNotes: "Notes Save Karo",
      examIn: "Exam aane mein",
      days: "din bache hain",
      subjectName: "Subject Ka Naam",
      colorTheme: "Color Theme",
    },
    analyticsHub: {
      title: "Analytics Hub",
      subtitle: "365 Din ka Heatmap aur Deep Performance Breakdown",
      heatmapTitle: "Yearly Study Activity Heatmap",
      heatmapSubtitle: "Kisi bhi square par click karke sessions dekho",
      filter7D: "Pichhle 7 Din",
      filter30D: "Pichhle 30 Din",
      filterAllTime: "Shuru se Ab tak",
      timeDistribution: "Kis Subject ko Kitna Time Diya",
      peakHoursTitle: "Sabse Zyada Padhai Kab Hoti Hai?",
      morning: "Subah (5 AM - 12 PM)",
      afternoon: "Dopahar (12 PM - 6 PM)",
      night: "Raat (6 PM - 4 AM)",
      weeklyComparison: "Weekly vs Monthly Trends",
      thisWeek: "Is Hafte",
      lastWeek: "Pichhle Hafte",
      dailyAverage: "Roz ka Average",
      neglectedAlert: (subject, days) => `Aapne ${subject} ko ${days} din se touch nahi kiya`,
      studyNow: "Abhi Padho",
      exportSummary: "Study Report Card Nikalo",
      exportPdf: "Download PDF / Printable Receipt",
      close: "Band Karo",
      sessionsOnDay: "Is din ki padhai:",
      noSessionsDay: "Is din koi padhai log nahi hui.",
      totalFocusHours: "Kul Focus Ghante",
      avgFocusQuality: "Average Focus Rating",
    },
    taskPlanner: {
      title: "Task Planner",
      subtitle: "Priorities, Due Dates aur Exam Deadlines",
      tabToday: "Aaj Ka Kaam",
      tabUpcoming: "Aage Ka Schedule",
      tabCompleted: "Pura Ho Gaya",
      addTask: "Naya Task Banao",
      taskTitle: "Task Ka Naam",
      subject: "Subject Tag",
      priority: "Priority",
      dueDate: "Kab Tak Karna Hai",
      priorityHigh: "High Priority (Zaroori)",
      priorityMed: "Medium",
      priorityLow: "Low",
      countdownTitle: "Aane Wale Exams & Deadlines",
      startPomodoroForTask: "Is Task Ke Liye Timer Lagao",
      goalCompleted: "Target khatam! Shabaash!",
      markDone: "Done Karo",
      deleteTask: "Delete Karo",
      noTasks: "Is category mein koi task nahi hai.",
      examCountdown: "Exam Countdown",
      addExamCountdown: "Exam Deadline Jodo",
    },
    common: {
      cancel: "Cancel",
      save: "Save Karo",
      delete: "Delete",
      edit: "Edit",
      close: "Band Karo",
      loading: "Load ho raha hai...",
      hours: "ghante",
      minutes: "minute",
      hrs: "h",
      mins: "m",
      offlineMode: "Offline Mode (Local Storage)",
      syncConnected: "Supabase Cloud Connected",
      settings: "Settings",
      language: "Bhasha (Language)",
    },
  },

  hi: {
    appName: "Studyo",
    tagline: "अध्ययन विश्लेषण और एकाग्रता इंजन",
    nav: {
      dashboard: "डैशबोर्ड",
      studyRoom: "अध्ययन कक्ष",
      syllabusMap: "पाठ्यक्रम मानचित्र",
      analyticsHub: "विश्लेषण केंद्र",
      taskPlanner: "कार्य योजना",
    },
    dashboard: {
      greeting: "स्वागत है! आज का क्या लक्ष्य है?",
      subGreeting: "निरंतरता ही सफलता की कुंजी है। आज का सत्र शुरू करें।",
      dailyTarget: "दैनिक लक्ष्य",
      targetProgress: "लक्ष्य प्रगति",
      streakCounter: "दैनिक स्ट्रीक",
      streakDays: "दिनों की स्ट्रीक 🔥",
      continueStudying: "अध्ययन शुरू करें (ध्यान केंद्रित)",
      resumeSubject: "त्वरित अध्ययन",
      topTasks: "आज के शीर्ष 3 प्राथमिक कार्य",
      noTasksToday: "आज के लिए कोई लंबित कार्य नहीं है! अति उत्तम।",
      quoteTitle: "दैनिक प्रेरणा और सुझाव",
      statsTotalToday: "आज का अध्ययन",
      statsWeekTotal: "इस सप्ताह",
      statsTasksDone: "पूर्ण कार्य",
      statsSyllabusProgress: "पाठ्यक्रम प्रगति",
      quickLaunch: "सत्र शुरू करें",
      neglectedWarning: "ध्यान देने की आवश्यकता",
    },
    studyRoom: {
      title: "एकाग्रता इंजन",
      startFocus: "अध्ययन शुरू करें (ध्यान केंद्रित)",
      pomodoro: "पोमोडोरो (25 मिनट)",
      shortBreak: "लघु विराम (5 मिनट)",
      longBreak: "दीर्घ विराम (15 मिनट)",
      stopwatch: "स्टॉपवॉच (खुला अध्ययन)",
      selectSubject: "विषय चुनें",
      selectChapter: "अध्याय चुनें",
      noChapter: "सामान्य अध्ययन / प्रश्न अभ्यास",
      pause: "विराम",
      resume: "पुनः आरंभ",
      reset: "रीसेट",
      complete: "सत्र समाप्त करें व सहेजें",
      zenMode: "ज़ेन मोड (विघ्न-रहित)",
      exitZen: "ज़ेन मोड बंद करें",
      ambientSound: "एकाग्रता ध्वनियाँ",
      soundOff: "बंद",
      soundRain: "वर्षा की ध्वनि",
      soundBrownNoise: "ब्राउन नॉइज़ (गहन एकाग्रता)",
      soundBinaural: "बाइनॉरल बीट्स (40Hz)",
      soundCafe: "पुस्तकालय / कैफे",
      soundClock: "घड़ी की टिक-टिक",
      scratchpadTitle: "विघ्न त्वरित-स्क्रैचपैड",
      scratchpadPlaceholder: "कोई भटकता हुआ विचार आया? यहाँ लिख लें ताकि मन शांत रहे...",
      scratchpadHint: "एकाग्रता तोड़े बिना तुरंत नोट करें, बाद में कार्य बना सकते हैं।",
      addDistraction: "नोट करें",
      convertToTask: "कार्य में बदलें",
      ratingModalTitle: "सत्र पूर्ण! बहुत बढ़िया!",
      ratingPrompt: "इस सत्र के दौरान आपकी एकाग्रता कैसी रही?",
      sessionNotesPlaceholder: "आपने कौन से सूत्र, सिद्धांत या अध्याय सीखे?",
      saveSession: "विश्लेषण में सहेजें",
      ratingLabels: ["ध्यान भटका हुआ", "सामान्य", "एकाग्र", "गहन प्रवाह", "उत्कृष्ट एकाग्रता 🔥"],
    },
    syllabusMap: {
      title: "पाठ्यक्रम मानचित्र",
      subtitle: "अध्याय एवं विषय पदानुक्रम व पुनरीक्षण स्थिति",
      overallCompletion: "कुल पाठ्यक्रम पूर्णता",
      filterAll: "सभी विषय",
      filterUrgent: "निकट परीक्षा (< 30 दिन)",
      addSubject: "नया विषय जोड़ें",
      addChapter: "नया अध्याय जोड़ें",
      addTopic: "नया विषय-बिंदु जोड़ें",
      confidenceTags: {
        strong: "मजबूत",
        medium: "मध्यम",
        weak: "कमजोर",
      },
      statusPending: "लंबित",
      statusInProgress: "प्रगति पर",
      statusCompleted: "पूर्ण",
      notesAndFormulas: "सूत्र एवं मुख्य बिंदु",
      noNotesYet: "अभी कोई सूत्र या नोट्स नहीं हैं। जोड़ने के लिए संपादित करें।",
      saveNotes: "नोट्स सहेजें",
      examIn: "परीक्षा में शेष",
      days: "दिन",
      subjectName: "विषय का नाम",
      colorTheme: "रंग थीम",
    },
    analyticsHub: {
      title: "विश्लेषण केंद्र",
      subtitle: "365-दिवसीय गतिविधि हीटमैप और प्रदर्शन आंकड़े",
      heatmapTitle: "वार्षिक अध्ययन गतिविधि हीटमैप",
      heatmapSubtitle: "लॉग किए गए सत्र देखने के लिए किसी भी सेल पर टैप करें",
      filter7D: "गत 7 दिन",
      filter30D: "गत 30 दिन",
      filterAllTime: "संपूर्ण अवधि",
      timeDistribution: "विषयवार समय वितरण",
      peakHoursTitle: "सर्वाधिक उत्पादकता के घंटे",
      morning: "प्रातःकाल (5 AM - 12 PM)",
      afternoon: "अपराह्न (12 PM - 6 PM)",
      night: "रात्रिकाल (6 PM - 4 AM)",
      weeklyComparison: "साप्ताहिक तुलनात्मक रुझान",
      thisWeek: "इस सप्ताह",
      lastWeek: "गत सप्ताह",
      dailyAverage: "दैनिक औसत",
      neglectedAlert: (subject, days) => `आपने ${days} दिनों से ${subject} नहीं पढ़ा है`,
      studyNow: "अभी पढ़ें",
      exportSummary: "अध्ययन रिपोर्ट कार्ड निर्यात करें",
      exportPdf: "पीडीएफ / मुद्रण योग्य रसीद डाउनलोड करें",
      close: "बंद करें",
      sessionsOnDay: "इस दिन के सत्र:",
      noSessionsDay: "इस दिन कोई अध्ययन सत्र दर्ज नहीं है।",
      totalFocusHours: "कुल अध्ययन घंटे",
      avgFocusQuality: "औसत एकाग्रता रेटिंग",
    },
    taskPlanner: {
      title: "कार्य योजना",
      subtitle: "प्राथमिकताएँ, नियत तिथियाँ और परीक्षा उलटी गिनती",
      tabToday: "आज का कार्य",
      tabUpcoming: "आगामी",
      tabCompleted: "पूर्ण",
      addTask: "नया कार्य जोड़ें",
      taskTitle: "कार्य का शीर्षक",
      subject: "संबंधित विषय",
      priority: "प्राथमिकता",
      dueDate: "नियत तिथि",
      priorityHigh: "उच्च प्राथमिकता",
      priorityMed: "मध्यम",
      priorityLow: "निम्न",
      countdownTitle: "आगामी परीक्षाएं और अंतिम तिथियां",
      startPomodoroForTask: "इस कार्य हेतु टाइमर चलाएँ",
      goalCompleted: "लक्ष्य पूरा हुआ! बहुत बढ़िया!",
      markDone: "पूर्ण चिह्नित करें",
      deleteTask: "हटाएँ",
      noTasks: "यहाँ कोई कार्य नहीं है।",
      examCountdown: "परीक्षा उलटी गिनती",
      addExamCountdown: "परीक्षा समयसीमा जोड़ें",
    },
    common: {
      cancel: "रद्द करें",
      save: "सहेजें",
      delete: "हटाएँ",
      edit: "संपादित करें",
      close: "बंद करें",
      loading: "लोड हो रहा है...",
      hours: "घंटे",
      minutes: "मिनट",
      hrs: "घं",
      mins: "मि",
      offlineMode: "ऑफलाइन मोड (स्थानीय संग्रहण)",
      syncConnected: "सुपाबेस क्लाउड सिंक सक्रिय",
      settings: "सेटिंग्स",
      language: "भाषा",
    },
  },
};
