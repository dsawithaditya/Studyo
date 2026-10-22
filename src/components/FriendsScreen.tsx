import React, { useState } from 'react';
import { useStudyStore } from '../store/useStudyStore';
import { FriendProfile } from '../types';
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  Copy,
  Share2,
  Flame,
  Target,
  Clock,
  Sparkles,
  BookOpen,
  MessageSquare,
  Send,
  Trash2,
  ChevronLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FriendsScreenProps {
  onBackToTimer?: () => void;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ onBackToTimer }) => {
  const {
    user,
    friends,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    addFriendComment,
    deleteFriendComment,
  } = useStudyStore();

  // Active sub-tab inside the social network page:
  // 'search' | 'requests' | 'friends' | 'table'
  const [subTab, setSubTab] = useState<'search' | 'requests' | 'friends' | 'table'>('friends');

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [searchedFriend, setSearchedFriend] = useState<FriendProfile | null>(null);

  // Selected friend for Study Table & Comments view (case-insensitive lookup)
  const [selectedFriendCode, setSelectedFriendCode] = useState<string | null>(() => {
    const firstAccepted = friends.find((f) => f.status === 'accepted');
    return firstAccepted ? firstAccepted.code.toUpperCase() : null;
  });

  // Comment input state
  const [commentInput, setCommentInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Filtered lists
  const acceptedFriends = friends.filter((f) => f.status === 'accepted');
  const incomingRequests = friends.filter((f) => f.status === 'incoming_request');
  const outgoingRequests = friends.filter((f) => f.status === 'outgoing_request');

  const selectedFriend =
    friends.find((f) => f.code.toUpperCase() === (selectedFriendCode || '').toUpperCase()) ||
    acceptedFriends[0] ||
    null;

  // Copy user's student code to clipboard
  const handleCopyCode = () => {
    const code = user.friendCode || 'A9X4K';
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Share user's invite message
  const handleShareInvite = () => {
    const code = user.friendCode || 'A9X4K';
    const text = `Hey! Connect with me on Studyo. My Student Code is: ${code}`;
    if (navigator.share) {
      navigator.share({
        title: 'Studyo Student Code',
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2000);
    }
  };

  // Execute Search for code
  const handleSearch = (codeToSearch?: string) => {
    const query = (codeToSearch || searchQuery).trim().toUpperCase();
    if (!query) {
      setSearchFeedback({ type: 'error', text: 'Please enter a 4-5 digit student code.' });
      setSearchedFriend(null);
      return;
    }

    if (query === (user.friendCode || 'A9X4K').toUpperCase()) {
      setSearchFeedback({ type: 'info', text: 'This is your own student code!' });
      setSearchedFriend(null);
      return;
    }

    const match = friends.find((f) => f.code.toUpperCase() === query);
    if (match) {
      setSearchedFriend(match);
      setSearchFeedback({ type: 'success', text: `Student found: ${match.name} (#${match.code})` });
    } else {
      // Dynamic fallback for any valid alphanumeric 4-5 digit code
      const dynamicPeer: FriendProfile = {
        code: query,
        name: `Student ${query}`,
        avatar: query.charAt(0),
        bio: `Studyo peer student • Code #${query}`,
        streakDays: 8,
        dailyTargetMinutes: 300,
        todayStudyMinutes: 180,
        lastActive: 'Recently',
        status: 'none',
        studyLogs: [
          {
            date: new Date().toISOString().split('T')[0],
            studyHours: 4.5,
            attendedClass: true,
            pyqsSolved: 20,
            revisionDone: true,
            mockTestTaken: false,
            sleepHours: 7.5,
            focusRating: 5,
            notes: 'Consistent problem solving and syllabus revision.',
          },
          {
            date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
            studyHours: 4.0,
            attendedClass: true,
            pyqsSolved: 18,
            revisionDone: true,
            mockTestTaken: false,
            sleepHours: 7.0,
            focusRating: 4,
            notes: 'Formula review and practice test analysis.',
          },
        ],
        comments: [],
      };
      setSearchedFriend(dynamicPeer);
      setSearchFeedback({ type: 'success', text: `Discovered student profile for #${query}` });
    }
  };

  // Send friend request
  const handleSendRequest = (code: string) => {
    const res = sendFriendRequest(code);
    if (res.success) {
      setSearchFeedback({ type: 'success', text: res.message });
      // Update searched friend state
      if (searchedFriend && searchedFriend.code.toUpperCase() === code.toUpperCase()) {
        setSearchedFriend({ ...searchedFriend, status: 'outgoing_request' });
      }
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } else {
      setSearchFeedback({ type: 'error', text: res.message });
    }
  };

  // Select a friend without leaving current view (updates the top navigation tab option to their name)
  const handleSelectFriend = (friend: FriendProfile) => {
    setSelectedFriendCode(friend.code.toUpperCase());
  };

  // Open Friend's Study Table and details (switches view to table)
  const handleOpenStudyTable = (friend: FriendProfile) => {
    setSelectedFriendCode(friend.code.toUpperCase());
    setSubTab('table');
  };

  // Add Comment on selected friend's study table
  const handlePostComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentInput.trim() || !selectedFriend) return;
    addFriendComment(selectedFriend.code, commentInput.trim());
    setCommentInput('');
  };

  return (
    <div className="w-full flex flex-col space-y-6 animate-fadeIn font-mono">
      {/* ======================================================== */}
      {/* 1. TOP HEADER BANNER & UNIQUE STUDENT CODE CARD          */}
      {/* ======================================================== */}
      <div className="w-full p-6 sm:p-7 rounded-3xl glass-panel relative overflow-hidden border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Ambient Orange Refraction Glow */}
        <div
          className="absolute -top-16 -right-16 w-80 h-80 rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #ff5f00 0%, #e9762b 50%, transparent 80%)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Title */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#e9762b]/15 text-[#e9762b] border border-[#e9762b]/30">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight uppercase font-mono">
                STUDENT NETWORK
              </h1>
            </div>
          </div>

          {/* Right: Unique Student Code Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3.5 rounded-2xl bg-white/90 dark:bg-black/60 border border-[#e9762b]/40 shadow-[0_4px_25px_rgba(233,118,43,0.15)]">
            <div className="px-3 py-1 flex flex-col">
              <span className="text-[10px] text-stone-600 dark:text-slate-400 uppercase tracking-widest font-bold">
                YOUR UNIQUE CODE
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black tracking-widest text-[#e9762b] font-mono select-all">
                  {user.friendCode || 'A9X4K'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#e9762b] text-black font-extrabold text-xs transition hover:bg-[#ff5f00] shadow-[0_0_15px_rgba(233,118,43,0.4)] cursor-pointer active:scale-95"
                title="Copy student code"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>COPIED</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>COPY CODE</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareInvite}
                className="p-2.5 rounded-full glass-pill border border-orange-950/15 dark:border-white/20 text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white transition cursor-pointer hover:bg-orange-500/10 dark:hover:bg-white/10"
                title="Share invite link or message"
              >
                {copiedShareLink ? <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SUB-NAVIGATION TABS (Capsule Dock matching Border Magic theme) */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-1.5 rounded-full border-magic-bar text-xs sm:text-sm uppercase tracking-wider font-bold">
        {/* Tab 1: My Friends */}
        <button
          type="button"
          onClick={() => setSubTab('friends')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full transition font-mono whitespace-nowrap cursor-pointer ${
            subTab === 'friends'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_20px_rgba(233,118,43,0.35)]'
              : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>FRIENDS ({acceptedFriends.length}/51)</span>
        </button>

        {/* Tab 2: Find Students */}
        <button
          type="button"
          onClick={() => setSubTab('search')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full transition font-mono whitespace-nowrap cursor-pointer ${
            subTab === 'search'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_20px_rgba(233,118,43,0.35)]'
              : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>FIND STUDENTS</span>
        </button>

        {/* Tab 3: Requests */}
        <button
          type="button"
          onClick={() => setSubTab('requests')}
          className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full transition font-mono whitespace-nowrap cursor-pointer relative ${
            subTab === 'requests'
              ? 'bg-[#e9762b] text-black font-extrabold shadow-[0_0_20px_rgba(233,118,43,0.35)]'
              : 'text-stone-700 dark:text-slate-300 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/5 border border-transparent'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>REQUESTS</span>
          {incomingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#ff5f00] text-black ring-1 ring-white/20">
              {incomingRequests.length}
            </span>
          )}
        </button>

        {/* Tab 4: Friend Study Table & Comments (Dynamically shows clicked person's name) */}
        {selectedFriend && (
          <button
            type="button"
            onClick={() => setSubTab('table')}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full transition-all duration-200 font-mono whitespace-nowrap cursor-pointer ml-auto border shadow-sm ${
              subTab === 'table'
                ? 'bg-gradient-to-r from-[#e9762b] to-[#ff5f00] text-black font-extrabold shadow-[0_0_20px_rgba(233,118,43,0.4)] border-[#e9762b]'
                : 'text-stone-700 dark:text-slate-200 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-white/10 border-stone-300/80 dark:border-white/15 hover:border-[#e9762b]/50'
            }`}
            title={`View ${selectedFriend.name}'s study table & comments`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="tracking-wider">TABLE: {selectedFriend.name.toUpperCase()}</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. SUB-VIEW: MY STUDY CIRCLE (ACCEPTED FRIENDS)          */}
      {/* ======================================================== */}
      {subTab === 'friends' && (
        <div className="w-full space-y-5 animate-fadeIn">
          {acceptedFriends.length === 0 ? (
            <div className="w-full p-12 rounded-3xl glass-panel text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white uppercase">Your Study Circle is Empty</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Search student codes or accept incoming friend requests to see their daily study tables and exchange feedback.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSubTab('search')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e9762b] text-black font-bold text-xs uppercase transition hover:bg-[#ff5f00]"
              >
                <Search className="w-4 h-4" />
                <span>Search Student Codes</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedFriends.map((friend) => {
                const isSelected = selectedFriend?.code.toUpperCase() === friend.code.toUpperCase();
                return (
                  <div
                    key={friend.code}
                    onClick={() => handleSelectFriend(friend)}
                    className={`p-5 rounded-2xl glass-panel glass-panel-interactive flex flex-col justify-between space-y-4 transition-all duration-200 border shadow-xl relative group cursor-pointer ${
                      isSelected
                        ? 'border-[#e9762b] shadow-[0_0_25px_rgba(233,118,43,0.25)] ring-1 ring-[#e9762b] bg-white/[0.04]'
                        : 'border-white/10 hover:border-[#e9762b]/60 hover:shadow-2xl'
                    }`}
                    title={`Click to select ${friend.name} (shows name in table option)`}
                  >
                    {/* Top: Avatar, Name, Code */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-base transition-transform group-hover:scale-105 ${
                              isSelected ? 'shadow-[0_0_20px_rgba(233,118,43,0.6)]' : 'shadow-[0_0_15px_rgba(233,118,43,0.4)]'
                            }`}
                          >
                            {friend.avatar || friend.name.charAt(0)}
                          </div>
                          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10b981] border-2 border-black" title="Active student" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base tracking-tight group-hover:text-[#e9762b] transition-colors">
                              {friend.name}
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#e9762b]">
                              #{friend.code}
                            </span>
                          </div>
                          {friend.bio ? (
                            <p className="text-[11px] text-slate-400 line-clamp-1">{friend.bio}</p>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Remove ${friend.name} from your study circle?`)) {
                            removeFriend(friend.code);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition opacity-0 group-hover:opacity-100"
                        title="Remove friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Metrics Badges */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Flame className="w-3 h-3 text-[#ff5f00]" /> STREAK
                        </span>
                        <span className="font-extrabold text-white text-sm mt-0.5">{friend.streakDays}d</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Target className="w-3 h-3 text-[#e9762b]" /> TARGET
                        </span>
                        <span className="font-extrabold text-white text-sm mt-0.5">{(friend.dailyTargetMinutes / 60).toFixed(1)}h</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col items-center">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" /> ACTIVE
                        </span>
                        <span className="font-extrabold text-slate-300 text-xs mt-1">{friend.lastActive}</span>
                      </div>
                    </div>

                    {/* Bottom Action: View Details */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenStudyTable(friend);
                      }}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs uppercase transition shadow-sm cursor-pointer ${
                        isSelected
                          ? 'bg-[#e9762b] text-black shadow-[0_0_15px_rgba(233,118,43,0.4)]'
                          : 'bg-[#e9762b]/15 text-[#e9762b] border border-[#e9762b]/40 hover:bg-[#e9762b] hover:text-black group-hover:bg-[#e9762b] group-hover:text-black'
                      }`}
                      title={`Open ${friend.name}'s study table & comments`}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SUB-VIEW: FIND STUDENTS (SEARCH BY CODE)              */}
      {/* ======================================================== */}
      {subTab === 'search' && (
        <div className="w-full space-y-6 animate-fadeIn">
          {/* Search Box Card */}
          <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-[#e9762b]" />
              SEARCH STUDENT BY 4-5 DIGIT CODE
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch();
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 4-5 digit friend code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value.toUpperCase());
                    setSearchFeedback(null);
                  }}
                  className="w-full glass-input rounded-xl px-4 py-3 text-sm text-white font-mono uppercase tracking-wider focus:outline-none focus:border-[#e9762b] placeholder-slate-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchedFriend(null);
                      setSearchFeedback(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#e9762b] text-black font-extrabold text-xs uppercase tracking-wider transition hover:bg-[#ff5f00] shadow-[0_0_20px_rgba(233,118,43,0.35)] cursor-pointer flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </button>
            </form>

            {/* Feedback notification */}
            {searchFeedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  searchFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                    : searchFeedback.type === 'error'
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    : 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                }`}
              >
                {searchFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{searchFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Search Result Card */}
          {searchedFriend && (
            <div className="p-6 rounded-3xl glass-panel border border-[#e9762b]/40 shadow-2xl space-y-5 animate-fadeIn">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-xl shadow-[0_0_20px_rgba(233,118,43,0.4)]">
                    {searchedFriend.avatar || searchedFriend.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-extrabold text-white text-lg">{searchedFriend.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#e9762b]/15 text-[#e9762b] border border-[#e9762b]/30">
                        #{searchedFriend.code}
                      </span>
                    </div>
                    {searchedFriend.bio ? (
                      <p className="text-xs text-slate-300 mt-1 max-w-lg">{searchedFriend.bio}</p>
                    ) : null}
                  </div>
                </div>

                {/* Friend Action Button */}
                <div>
                  {searchedFriend.status === 'accepted' ? (
                    <button
                      type="button"
                      onClick={() => handleOpenStudyTable(searchedFriend)}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold uppercase transition hover:bg-emerald-500/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Already Friends • View Details</span>
                    </button>
                  ) : searchedFriend.status === 'outgoing_request' ? (
                    <button
                      type="button"
                      onClick={() => {
                        cancelFriendRequest(searchedFriend.code);
                        setSearchedFriend({ ...searchedFriend, status: 'none' });
                      }}
                      className="px-5 py-2.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase transition hover:bg-amber-500/20 flex items-center gap-2 cursor-pointer"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Request Pending (Cancel)</span>
                    </button>
                  ) : searchedFriend.status === 'incoming_request' ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (acceptedFriends.length >= 51) {
                            alert('Friend limit reached (max 51 friends allowed).');
                            return;
                          }
                          acceptFriendRequest(searchedFriend.code);
                          setSearchedFriend({ ...searchedFriend, status: 'accepted' });
                        }}
                        className="px-4 py-2.5 rounded-xl bg-[#e9762b] text-black text-xs font-extrabold uppercase transition hover:bg-[#ff5f00] flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Check className="w-4 h-4" />
                        <span>Accept Request</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          declineFriendRequest(searchedFriend.code);
                          setSearchedFriend({ ...searchedFriend, status: 'none' });
                        }}
                        className="px-3 py-2.5 rounded-xl glass-pill text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (acceptedFriends.length >= 51) {
                          alert('Friend limit reached (max 51 friends allowed).');
                          return;
                        }
                        handleSendRequest(searchedFriend.code);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#e9762b] text-black font-extrabold text-xs uppercase tracking-wider transition hover:bg-[#ff5f00] shadow-[0_0_20px_rgba(233,118,43,0.4)] flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Send Friend Request</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Profile Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">STREAK DAYS</span>
                  <span className="text-base font-extrabold text-white mt-1 block">🔥 {searchedFriend.streakDays} Days</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">DAILY TARGET</span>
                  <span className="text-base font-extrabold text-white mt-1 block">🎯 {(searchedFriend.dailyTargetMinutes / 60).toFixed(1)} Hours</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">LAST ACTIVE</span>
                  <span className="text-base font-extrabold text-cyan-400 mt-1 block">{searchedFriend.lastActive}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. SUB-VIEW: FRIEND REQUESTS (INCOMING & OUTGOING)       */}
      {/* ======================================================== */}
      {subTab === 'requests' && (
        <div className="w-full space-y-6 animate-fadeIn">
          {/* Section A: Incoming Requests */}
          <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#e9762b]" />
                INCOMING REQUESTS ({incomingRequests.length})
              </h2>
            </div>

            {incomingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                No incoming friend requests at this time. Give your student code to peers to connect.
              </p>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((req) => (
                  <div
                    key={req.code}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-sm">
                        {req.avatar || req.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{req.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#e9762b]/15 text-[#e9762b]">
                            #{req.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {req.bio ? `${req.bio} · ` : ''}🔥 {req.streakDays}d streak
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          if (acceptedFriends.length >= 51) {
                            alert('Friend limit reached (max 51 friends allowed).');
                            return;
                          }
                          acceptFriendRequest(req.code);
                          setSelectedFriendCode(req.code.toUpperCase());
                        }}
                        className="px-4 py-2 rounded-xl bg-[#e9762b] text-black font-extrabold text-xs uppercase transition hover:bg-[#ff5f00] flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => declineFriendRequest(req.code)}
                        className="px-3.5 py-2 rounded-xl glass-pill text-slate-400 hover:text-white text-xs font-bold uppercase cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section B: Outgoing Requests */}
          <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              SENT REQUESTS ({outgoingRequests.length})
            </h2>

            {outgoingRequests.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 italic">
                You have no pending outgoing friend requests.
              </p>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((req) => (
                  <div
                    key={req.code}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-sm">
                        {req.avatar || req.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{req.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                            #{req.code}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Request Sent · Awaiting response</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => cancelFriendRequest(req.code)}
                      className="px-3.5 py-1.5 rounded-xl glass-pill text-xs font-bold text-slate-400 hover:text-rose-400 transition cursor-pointer"
                    >
                      Cancel Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SUB-VIEW: FRIEND'S STUDY TABLE & DISCUSSION BOARD     */}
      {/* ======================================================== */}
      {subTab === 'table' && selectedFriend && (
        <div className="w-full space-y-6 animate-fadeIn">
          {/* Friend Banner & Quick Switcher */}
          <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSubTab('friends')}
                  className="p-2 rounded-xl glass-pill hover:border-white/30 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Back to Friends List"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-extrabold text-black text-lg shadow-[0_0_20px_rgba(233,118,43,0.4)]">
                  {selectedFriend.avatar || selectedFriend.name.charAt(0)}
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-extrabold text-white tracking-tight">{selectedFriend.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#e9762b]/15 text-[#e9762b] border border-[#e9762b]/30">
                      #{selectedFriend.code}
                    </span>
                  </div>
                  {selectedFriend.bio ? (
                    <p className="text-xs text-slate-300 mt-0.5">{selectedFriend.bio}</p>
                  ) : null}
                </div>
              </div>

              {/* Switch friend buttons if multiple friends exist */}
              {acceptedFriends.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400 text-[11px] font-bold">Switch Friend:</span>
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10">
                    {acceptedFriends.map((f) => {
                      const isCurr = f.code.toUpperCase() === selectedFriend.code.toUpperCase();
                      return (
                        <button
                          key={f.code}
                          type="button"
                          onClick={() => setSelectedFriendCode(f.code.toUpperCase())}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isCurr
                              ? 'bg-[#e9762b] text-black shadow-md'
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                              isCurr ? 'bg-black text-[#e9762b]' : 'bg-white/10 text-slate-300'
                            }`}
                          >
                            {f.avatar || f.name.charAt(0)}
                          </span>
                          <span>{f.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-orange-950/10 dark:border-white/10 text-xs">
              <div className="p-3 rounded-xl bg-orange-500/5 dark:bg-white/5 border border-orange-950/10 dark:border-white/5 flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#ff5f00]/15 text-[#ff5f00]">
                  <Flame className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase tracking-widest block font-bold">STREAK</span>
                  <span className="font-extrabold text-stone-900 dark:text-white text-sm">{selectedFriend.streakDays} Consecutive Days</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-500/5 dark:bg-white/5 border border-orange-950/10 dark:border-white/5 flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#e9762b]/15 text-[#e9762b]">
                  <Target className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase tracking-widest block font-bold">DAILY GOAL</span>
                  <span className="font-extrabold text-stone-900 dark:text-white text-sm">{(selectedFriend.dailyTargetMinutes / 60).toFixed(1)} Hours/Day</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-orange-500/5 dark:bg-white/5 border border-orange-950/10 dark:border-white/5 flex items-center gap-3">
                <span className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500 dark:text-emerald-400">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 uppercase tracking-widest block font-bold">STATUS</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-300 text-sm">{selectedFriend.lastActive}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="p-6 rounded-3xl glass-panel border border-orange-950/10 dark:border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#e9762b]" />
                DAILY STUDY TABLE
              </h3>
              <span className="text-xs text-stone-600 dark:text-slate-400">
                {selectedFriend.studyLogs.length} days logged
              </span>
            </div>

            {/* The Actual Table */}
            <div className="overflow-x-auto rounded-2xl border border-orange-950/10 dark:border-white/10 bg-white/95 dark:bg-black/40 shadow-inner">
              <table className="w-full min-w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-orange-950/10 dark:border-white/10 bg-orange-500/5 dark:bg-white/5 text-stone-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold">
                    <th className="py-3 px-4 min-w-[110px] rounded-tl-xl">DATE</th>
                    <th className="py-3 px-4 text-center min-w-[90px]">STUDY TIME</th>
                    <th className="py-3 px-4 text-center min-w-[75px]">CLASS</th>
                    <th className="py-3 px-4 text-center min-w-[80px]">PYQS</th>
                    <th className="py-3 px-4 text-center min-w-[75px]">REV</th>
                    <th className="py-3 px-4 text-center min-w-[75px]">MOCK</th>
                    <th className="py-3 px-4 text-center min-w-[75px]">FOCUS</th>
                    <th className="py-3 px-4 sm:px-5 min-w-[200px] rounded-tr-xl">NOTES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-950/5 dark:divide-white/5">
                  {selectedFriend.studyLogs.map((log) => (
                    <tr key={log.date} className="hover:bg-orange-500/5 dark:hover:bg-white/[0.04] transition">
                      {/* Date */}
                      <td className="py-3 px-4 font-bold text-stone-900 dark:text-white whitespace-nowrap">
                        {log.date}
                      </td>

                      {/* Study Hours */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-extrabold text-[#e9762b] px-2 py-0.5 rounded-md bg-[#e9762b]/15 border border-[#e9762b]/30">
                          {log.studyHours !== null && log.studyHours !== undefined ? `${log.studyHours} hrs` : '--'}
                        </span>
                      </td>

                      {/* Attended Class */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {log.attendedClass ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            YES
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-stone-200/60 dark:bg-white/5 text-stone-600 dark:text-slate-500 text-[10px]">
                            NO
                          </span>
                        )}
                      </td>

                      {/* PYQs */}
                      <td className="py-3 px-4 text-center font-bold text-cyan-600 dark:text-cyan-300 whitespace-nowrap">
                        {log.pyqsSolved !== null && log.pyqsSolved !== undefined ? `${log.pyqsSolved} Qs` : '--'}
                      </td>

                      {/* Revision */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {log.revisionDone ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                        ) : (
                          <span className="text-stone-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Mock Test */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {log.mockTestTaken ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                            DONE
                          </span>
                        ) : (
                          <span className="text-stone-400 dark:text-slate-600">-</span>
                        )}
                      </td>

                      {/* Focus */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="font-extrabold text-amber-500 dark:text-amber-300">
                          {'★'.repeat(log.focusRating || 0)}{'☆'.repeat(5 - (log.focusRating || 0))}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 sm:px-5 text-stone-700 dark:text-slate-300 text-xs">
                        {log.notes || <span className="text-stone-400 dark:text-slate-600 italic">No notes added</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments & Discussion Board Section */}
          <div className="p-6 rounded-3xl glass-panel border border-white/10 shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#e9762b]" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                COMMENTS ({selectedFriend.comments.length})
              </h3>
            </div>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[#e9762b] placeholder-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={!commentInput.trim()}
                className="px-5 py-3 rounded-xl bg-[#e9762b] text-black font-extrabold text-xs uppercase tracking-wider transition hover:bg-[#ff5f00] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(233,118,43,0.3)]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </button>
            </form>

            {/* Comments Feed */}
            <div className="space-y-3 pt-2">
              {selectedFriend.comments.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-slate-400 italic">
                  No comments on this study table yet. Be the first to post a motivational message!
                </div>
              ) : (
                selectedFriend.comments.map((comment) => {
                  const isAuthor = comment.authorCode === (user.friendCode || 'A9X4K');
                  return (
                    <div
                      key={comment.id}
                      className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff5f00] to-[#e9762b] flex items-center justify-center font-bold text-black text-xs shrink-0 mt-0.5">
                          {comment.authorName.charAt(0)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{comment.authorName}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#e9762b]">
                              #{comment.authorCode}
                            </span>
                            {isAuthor && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                                You
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500">
                              {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed">{comment.text}</p>
                        </div>
                      </div>

                      {/* Delete button if user wrote this comment */}
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => deleteFriendComment(selectedFriend.code, comment.id)}
                          className="p-1 rounded-md text-slate-500 hover:text-red-400 hover:bg-white/5 transition opacity-0 group-hover:opacity-100"
                          title="Delete comment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendsScreen;
