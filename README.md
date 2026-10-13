# Studyo — Study Tracker Web App (PWA)

> **Hyper-optimized study analytics app with Pomodoro focus engine, syllabus map, 365-day GitHub-style heatmap, and zero-lag multilingual support (English, Hinglish, Hindi).**

---

## 🚀 Live Local URL
The application is currently running locally at:
👉 **[http://localhost:5173/](http://localhost:5173/)**

Recommended active workspace directory:
`C:\Users\dsawi\.gemini\antigravity-ide\scratch\study-tracker-pwa`

---

## 🌟 Implemented Features Blueprint

### 1. 🏠 Dashboard (Home Screen)
- **Daily Target Progress Ring**: Radial SVG progress tracker showing hours logged vs daily target (e.g. 3.5 / 5.0 hrs) with animated percentage completion.
- **Streak Counter**: Active consecutive days counter with flame 🔥 indicator and safeguard status.
- **Quick 'Continue Studying' 1-Click Launch**: Launches directly into the last active subject and chapter with zero friction.
- **Today's Top 3 Priority Tasks**: Check off priorities directly from the home card with instant optimistic completion & celebratory confetti.
- **Daily Motivational Quote & Tip Banner**: Curated student insights and study strategies with 1-click refresh, localized across EN, Hinglish, and Hindi.
- **Neglected Subject Alert**: Proactively detects and highlights subjects untouched for 3+ days (e.g. *"Aapne Maths ko 3 din se touch nahi kiya"*) with an instant "Study Now" button.
- **Quick 4-Grid Metrics**: Today's Focus Hours, Weekly Total & Average, Tasks Finished, and Syllabus Coverage %.

### 2. ⏱️ Study Room (Focus Engine)
- **Timer Modes**: Pomodoro (25m), Short Break (5m), Long Break (15m), and open-ended Stopwatch.
- **Active Subject & Chapter Selector**: Dropdowns synced with the student's Syllabus Map.
- **Distraction Quick-Scratchpad**: Instant thought-capture drawer to jot down stray thoughts without losing focus, with 1-click conversion into actionable Tasks.
- **Synthesized Ambient Soundscapes (Web Audio API)**:
  - 🌧️ Cozy Rain Ambience
  - 🟤 Warm Brown Noise (Deep Focus)
  - 🧠 Binaural Beats (40Hz Gamma waves)
  - ☕ Study Cafe Murmur
  - 🕰️ Mechanical Clock Tick-Tock
  - 🔔 Session completion chime bell
  *(100% offline, zero network requests or buffering)*
- **Zen Mode**: Distraction-free fullscreen focus room with smooth breathing guide animation, big digital timer, and ambient sound controls.
- **Post-Session Focus Rating**: 1-5 ⭐ rating popup with reflection notes that automatically logs duration and updates streaks & heatmaps.

### 3. 🗺️ Syllabus Map (Data Management)
- **Subject Cards**: Custom color themes and icons for Mathematics, Physics, Organic Chemistry, Computer Science, and custom subjects.
- **Chapter & Topic Hierarchy**: Expandable accordion tree with topic counts.
- **Real-Time Syllabus Completion %**: Visual progress bars per subject and overall.
- **Revision Confidence Tags**: 1-tap cycling between:
  - **Strong** / **Pakka** / **मजबूत**
  - **Medium** / **Theek-thaak** / **मध्यम**
  - **Weak** / **Kamzor** / **कमजोर**
- **Formulas & Cheat-Sheet Drawer**: Attach key formulas and mnemonics to any chapter.
- **1-Tap Topic Status Toggle**: Pending ⏳ → In Progress 🔄 → Mastered ✅.
- **Exam Urgency Filter**: Filter subjects by upcoming test deadlines (< 30 days).

### 4. 📊 Analytics Hub (Study Analysing)
- **365-Day GitHub-Style Activity Heatmap**: 52-week grid with color intensity based on daily study minutes (0m, <1h, 1-2h, 2-4h, >4h).
- **Interactive Day Inspector**: Tap any cell in the heatmap to view all logged study sessions, subject names, durations, and focus ratings for that date.
- **Subject Time Distribution**: Interactive time allocation bars and statistics showing exact hours and percentage breakdown.
- **Peak Productivity Hours**: Morning (5 AM - 12 PM) vs Afternoon (12 PM - 6 PM) vs Night (6 PM - 4 AM) circadian focus distribution.
- **Weekly vs Monthly Comparative Trends**: Pace comparison (+% vs previous week) and daily study averages.
- **One-Click Study Summary Export**: Generates an official student performance card receipt with printable layout and PDF download trigger.

### 5. ✅ Task Planner (Actionables)
- **Categorized Tabs**: Today, Upcoming, and Completed task lists.
- **Subject Tagging & Priority Badges**: High (Red), Med (Yellow), Low (Green).
- **Exam Countdown Cards**: Visual days-remaining deadline counters with urgency pulses.
- **1-Click Timer Launch**: Launch a dedicated Pomodoro session for any specific task.
- **Quick Sort**: Sort by Priority or Due Date.
- **Add Task & Add Exam Modals**: Estimated Pomodoro session counters and notes.

---

## 🌐 Instant Multilingual Support
Toggle between 3 languages anytime via the top navbar pill without page reloads:
| Screen / Feature | English | Hinglish | Hindi |
|---|---|---|---|
| **Dashboard Greeting** | *Welcome back! Ready to study?* | *Welcome! Aaj ka target kya hai?* | *स्वागत है! आज का क्या लक्ष्य है?* |
| **Study Timer** | *Start Deep Focus Session* | *Study shuru karein (Focus on!)* | *अध्ययन शुरू करें (ध्यान केंद्रित)* |
| **Analytics Alert** | *You haven't studied Math for 3 days* | *Aapne Maths ko 3 din se touch nahi kiya* | *आपने 3 दिनों से गणित नहीं पढ़ा है* |
| **Task Completed** | *Goal Completed!* | *Target khatam! Shabaash!* | *लक्ष्य पूरा हुआ! बहुत बढ़िया!* |
| **Revision Confidence** | *Strong / Medium / Weak* | *Pakka / Theek-thaak / Kamzor* | *मजबूत / मध्यम / कमजोर* |

---

## ⚡ Zero-Lag Architecture & Supabase Sync
1. **Optimistic UI (0ms Perceived Latency)**: Zustand with `localStorage` persistence saves all tasks, sessions, and syllabus updates immediately in memory before any background server sync.
2. **Offline-First PWA**: Web App Manifest (`manifest.json`) and Service Worker (`sw.js`) enable "Install to Phone Home Screen" and full offline operation.
3. **Supabase Cloud Sync Ready**:
   - PostgreSQL schema with composite indexes on `(user_id, created_at)` and `(user_id, subject_id)` for sub-15ms analytics queries.
   - Row Level Security (RLS) policies isolating student data.
   - Built-in credentials modal to connect your own Supabase free tier project anytime.

---

## ⌨️ Keyboard Shortcuts
- `Space`: Play / Pause active timer
- `Z`: Toggle Fullscreen Zen Mode
- `1`: Jump to Dashboard
- `2`: Jump to Study Room
- `3`: Jump to Syllabus Map
- `4`: Jump to Analytics Hub
- `5`: Jump to Task Planner
