import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDailyScores } from '../hooks/useDailyScores';
import { useGroups } from '../hooks/useGroups';
import { useNotifications } from '../hooks/useNotifications';
import { parseShareText } from '../services/parser';
import { triggerHapticClick, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';
import { useTranslation } from 'react-i18next';
import { Clipboard, ShieldAlert, CheckCircle2, Volume2, VolumeX, X, ArrowLeft, Copy, Share2, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Clipboard as CapClipboard } from '@capacitor/clipboard';
import coinX3 from '../assets/coin_x3.svg';
import streakHot from '../assets/streak_hot.svg';
import streakCold from '../assets/streak_cold.svg';
import streakProtector from '../assets/streak_protector.svg';
import { supabase } from '../services/supabase';
import { AvatarViewer } from '../components/AvatarViewer';



const BANNER_PRESETS = [
  { name: 'Timber Forest', url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Chess Castle', url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Retro Arcade', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80' },
  { name: 'Neon Space', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80' }
];

const SUGGESTED_NAMES = [
  "Ghostbusters 👻",
  "Mind Benders 🧠",
  "Sudoku Slayers 🔢",
  "Word Hunters 🔍",
  "Grid Gurus 🗺️",
  "Chess Champions 👑",
  "Connection Queens 👑",
  "Daily Solvers 📅",
  "Trivia Titans 💡",
  "Logic Legends 🧩"
];

export const Dashboard = () => {
  const { profile } = useAuth();
  const { scores, submitScore, loading: scoresLoading } = useDailyScores();
  const { groups, createGroup, joinGroup, loading: groupsLoading, getStandings, getGroupMembers } = useGroups();
  const { unreadMessages, pendingGames } = useNotifications();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [clipboardText, setClipboardText] = useState('');
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showStreakAnimation, setShowStreakAnimation] = useState(false);
  const [streakAnimationValue, setStreakAnimationValue] = useState(0);

  const [showCalendar, setShowCalendar] = useState(false);
  const [solvedDates, setSolvedDates] = useState<string[]>([]);

  useEffect(() => {
    const fetchSolvedDates = async () => {
      if (!profile?.id) return;
      const { data, error } = await supabase
        .from('daily_scores')
        .select('solved_date')
        .eq('profile_id', profile.id);
      if (!error && data) {
        const dates = data.map((d: any) => d.solved_date);
        setSolvedDates(Array.from(new Set(dates)));
      }
    };
    fetchSolvedDates();
  }, [profile?.id, scores]);

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date());

  const handlePrevMonth = () => {
    triggerHapticClick();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    triggerHapticClick();
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon...

    // Total days in the month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];
    // Pad leading days from previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Add current month days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const playedToday = scores.length > 0;



  // Standings and members state per group
  const [groupStandings, setGroupStandings] = useState<Record<string, any[]>>({});
  const [groupMembers, setGroupMembers] = useState<Record<string, any[]>>({});
  const [mutedGroups, setMutedGroups] = useState<Record<string, boolean>>({});
  const [cosmetics, setCosmetics] = useState<any[]>([]);

  // Fetch cosmetics for character resolution
  useEffect(() => {
    supabase.from('cosmetics').select('*').then(({ data }) => {
      if (data) setCosmetics(data);
    });
  }, []);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showClipboardModal, setShowClipboardModal] = useState(false);
  const [clipboardDetectText, setClipboardDetectText] = useState('');
  const [detectedGame, setDetectedGame] = useState<{ gameId: string; gameName: string } | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(BANNER_PRESETS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [createStep, setCreateStep] = useState(1);
  const [createdGroup, setCreatedGroup] = useState<any>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [suggestedName] = useState(() => {
    const randomIndex = Math.floor(Math.random() * SUGGESTED_NAMES.length);
    return SUGGESTED_NAMES[randomIndex];
  });

  // Check for join/code query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('join') || params.get('code');
    if (code) {
      setJoinInviteCode(code);
      setShowJoinModal(true);
      // Remove query parameters from URL without page reload
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Check clipboard on app load and focus/interaction
  useEffect(() => {
    if (!profile?.id || scoresLoading || groupsLoading) return;

    const checkClipboard = async () => {
      let text = '';
      if (Capacitor.isNativePlatform()) {
        try {
          const { value } = await CapClipboard.read();
          text = value || '';
        } catch (err) {
          console.warn('Failed to read native clipboard:', err);
        }
      } else {
        try {
          text = await navigator.clipboard.readText();
        } catch (err) {
          // Silent catch since browsers block clipboard reading until user interaction
          console.debug('Clipboard read blocked or denied:', err);
        }
      }

      if (!text || !text.trim()) return;

      // Avoid prompting if they already ignored/submitted this exact text
      const lastIgnored = sessionStorage.getItem('puzzlr_last_ignored_clip');
      if (lastIgnored === text) return;

      const parsed = parseShareText(text);
      if (!parsed) return;

      // Check if user already submitted a score for this minigame today
      const alreadySubmitted = scores.some((s) => 
        s.game_id === parsed.gameId || 
        ((parsed.gameId === 'wordle_es' || parsed.gameId === 'la_palabra') && 
         (s.game_id === 'wordle_es' || s.game_id === 'la_palabra'))
      );

      if (!alreadySubmitted) {
        setClipboardDetectText(text);
        setDetectedGame({ gameId: parsed.gameId, gameName: parsed.gameName });
        setShowClipboardModal(true);
        triggerHapticClick();
      }
    };

    // Run once after mount/load delay
    const timer = setTimeout(() => {
      checkClipboard();
    }, 1000);

    // Run when window gets focus (e.g. user switches tab back after copying)
    const handleFocus = () => {
      checkClipboard();
    };

    // Run on click as a fallback to guarantee user interaction gesture
    const handleInteraction = () => {
      checkClipboard();
      window.removeEventListener('click', handleInteraction);
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('click', handleInteraction);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('click', handleInteraction);
    };
  }, [profile?.id, scoresLoading, groupsLoading, scores]);

  const openCreateModal = () => {
    setNewGroupName('');
    setSelectedPresetUrl(BANNER_PRESETS[0].url);
    setCustomImageUrl('');
    setUploadedImageUrl('');
    setUploadedFileName('');
    setCreateStep(1);
    setCreatedGroup(null);
    setCopiedCode(false);
    setCopiedLink(false);
    setShowCreateModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result as string);
        setSelectedPresetUrl(''); // Clear preset selection
        setCustomImageUrl(''); // Clear custom URL
      };
      reader.readAsDataURL(file);
    }
  };
  // Fetch standings and members for user groups
  useEffect(() => {
    if (groups.length > 0) {
      groups.forEach(async (g) => {
        const standings = await getStandings(g.id);
        setGroupStandings((prev) => ({ ...prev, [g.id]: standings }));

        const members = await getGroupMembers(g.id);
        setGroupMembers((prev) => ({ ...prev, [g.id]: members }));
      });
    }
  }, [groups]);

  const processSubmission = async (text: string) => {
    if (!text.trim()) return;
    await triggerHapticClick();
    setSubmitMessage(null);

    const parsed = parseShareText(text);
    if (!parsed) {
      await triggerHapticError();
      setSubmitMessage({ type: 'error', text: t('dashboard.errors.failedToParse', 'Failed to parse the minigame. Please try again.') });
      return;
    }

    // Check if user has any groups joined
    if (groups.length === 0) {
      await triggerHapticError();
      setSubmitMessage({
        type: 'error',
        text: t('dashboard.errors.noGroupsWithGame', 'You dont have any group with this minigame. Please add this minigame to a group or create a new group with this minigame.')
      });
      return;
    }

    // Query active games for the user's groups to see if the minigame is assigned to any of them
    const gameIdsToCheck = parsed.gameId === 'wordle_es' || parsed.gameId === 'la_palabra'
      ? ['wordle_es', 'la_palabra']
      : [parsed.gameId];

    // Query active games for the user's groups to see if the minigame is assigned to any of them
    const { data: activeGroupGames, error: activeErr } = await supabase
      .from('group_games')
      .select('group_id')
      .in('game_id', gameIdsToCheck)
      .in('group_id', groups.map(g => g.id));

    if (activeErr || !activeGroupGames || activeGroupGames.length === 0) {
      await triggerHapticError();
      setSubmitMessage({
        type: 'error',
        text: t('dashboard.errors.noGroupsWithGame', 'You dont have any group with this minigame. Please add this minigame to a group or create a new group with this minigame.')
      });
      return;
    }

    // Check if user already submitted this game today
    const alreadySubmitted = scores.some((s) => 
      s.game_id === parsed.gameId || 
      ((parsed.gameId === 'wordle_es' || parsed.gameId === 'la_palabra') && 
       (s.game_id === 'wordle_es' || s.game_id === 'la_palabra'))
    );
    if (alreadySubmitted) {
      await triggerHapticError();
      setSubmitMessage({ type: 'error', text: t('dashboard.alreadySubmitted') });
      return;
    }

    const isFirstSubmissionToday = scores.length === 0;

    // Submit via RPC
    const res = await submitScore(parsed.gameId, text, parsed.score, parsed.maxScore);
    if (res.success) {
      await triggerHapticSuccess();
      setSubmitMessage({
        type: 'success',
        text: `${t('dashboard.submitSuccess')} (+${res.pointsEarned} pts)`,
      });
      setClipboardText('');
      // Refresh standings
      groups.forEach(async (g) => {
        const standings = await getStandings(g.id);
        setGroupStandings((prev) => ({ ...prev, [g.id]: standings }));
      });

      // Show streak animation if first submission today
      if (isFirstSubmissionToday) {
        setStreakAnimationValue(res.newStreakCount || (profile?.streak_count || 0) + 1);
        setShowStreakAnimation(true);
      }

      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitMessage(null);
      }, 2000);
    } else {
      await triggerHapticError();
      setSubmitMessage({ type: 'error', text: res.message });
    }
  };

  // Listen for native share target events forwarded via route state
  useEffect(() => {
    const locState = location.state as any;
    if (locState?.sharedText) {
      const text = locState.sharedText;
      // Clear navigation state to prevent re-submitting on reload/re-render
      navigate(location.pathname, { replace: true, state: {} });
      
      // Open modal, set clipboardText, and auto-submit
      setShowSubmitModal(true);
      setClipboardText(text);
      
      // Process submission automatically after a slight delay to allow modal render
      setTimeout(() => {
        processSubmission(text);
      }, 500);
    }
  }, [location.state, navigate, groups, scores]);

  const handleSubmitScore = async () => {
    await processSubmission(clipboardText);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await triggerHapticClick();

    const imageUrlToUse = uploadedImageUrl || customImageUrl.trim() || selectedPresetUrl;
    const res = await createGroup(newGroupName, imageUrlToUse);
    if (res.success && res.group) {
      await triggerHapticSuccess();
      setCreatedGroup(res.group);
      setCreateStep(3);
    } else {
      await triggerHapticError();
      alert(res.error || "Failed to create league");
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInviteCode.trim()) return;
    await triggerHapticClick();

    const res = await joinGroup(joinInviteCode);
    if (res.success) {
      await triggerHapticSuccess();
      setJoinInviteCode('');
      setShowJoinModal(false);
    } else {
      await triggerHapticError();
      alert(res.error || t('dashboard.errors.joinFailed'));
    }
  };

  const toggleMuteGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    triggerHapticClick();
    setMutedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (showCreateModal) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-emerald-50 text-slate-800 pt-safe pb-safe">
        {/* Full-view header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/50 backdrop-blur-md">
          <button
            onClick={async () => {
              await triggerHapticClick();
              if (createStep === 1) {
                setShowCreateModal(false);
              } else if (createStep === 2) {
                setCreateStep(1);
              } else if (createStep === 3) {
                setCreateStep(2);
              }
            }}
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-full transition-all active:scale-95"
            title={t('dashboard.createModal.backBtn')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <span className="text-sm font-black tracking-tight text-slate-800">
            {t('dashboard.createModal.title')}
          </span>

          <button
            onClick={async () => {
              await triggerHapticClick();
              setShowCreateModal(false);
            }}
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-full transition-all active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Full-view body */}
        <main className="flex-1 max-w-md w-full mx-auto px-5 py-6 flex flex-col justify-between">
          <div className="space-y-6 flex-1 flex flex-col justify-center">
            {createStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-slate-900">{t('dashboard.createModal.step1Title')}</h3>
                  <p className="text-sm text-slate-500 mt-1.5">{t('dashboard.createModal.step1Subtitle')}</p>
                </div>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={t('dashboard.createModal.namePlaceholder')}
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800/10 focus:border-slate-800 transition-all font-semibold shadow-sm"
                  />

                  <button
                    type="button"
                    onClick={() => setCreateStep(2)}
                    disabled={!newGroupName.trim()}
                    className="w-full py-4 bg-[#fed049] hover:bg-[#fed049]/95 text-slate-900 disabled:opacity-50 font-black rounded-2xl transition-all text-sm flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm active:scale-[0.98]"
                  >
                    {t('dashboard.createModal.nextBtn')}
                  </button>
                </div>
              </div>
            )}

            {createStep === 2 && (
              <form onSubmit={handleCreateGroup} className="space-y-5">
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-900">{t('dashboard.createModal.step2Title')}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t('dashboard.createModal.step2Subtitle')}</p>
                </div>

                {/* Selected Image Preview Panel */}
                <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner flex items-center justify-center">
                  {uploadedImageUrl || selectedPresetUrl ? (
                    <img
                      src={uploadedImageUrl || selectedPresetUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">No Image Selected</span>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-[8px] text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">
                    Preview
                  </div>
                </div>

                {/* Preset Banner Selection Grid */}
                <div className="space-y-1">
                  <div className="grid grid-cols-4 gap-2">
                    {BANNER_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setSelectedPresetUrl(preset.url);
                          setUploadedImageUrl('');
                          setUploadedFileName('');
                          setCustomImageUrl('');
                        }}
                        className={`relative h-10 rounded-lg overflow-hidden border-2 transition-all ${selectedPresetUrl === preset.url ? 'border-slate-800' : 'border-transparent'
                          }`}
                        title={preset.name}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Separator */}
                <div className="text-center text-xs text-slate-400 font-bold my-1">— or —</div>

                {/* Upload Image Section */}
                <div className="space-y-1.5">
                  <label className="flex flex-col items-center justify-center border border-dashed border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/10 rounded-2xl p-3.5 cursor-pointer transition-all shadow-sm">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] text-slate-500 font-bold mt-1 text-center">
                      {uploadedFileName ? t('dashboard.createModal.fileSelected', { name: uploadedFileName }) : "Choose image file (PNG, JPG)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-4 bg-[#fed049] hover:bg-[#fed049]/95 text-slate-900 font-black rounded-2xl transition-all text-sm uppercase tracking-wider shadow-sm active:scale-[0.98]"
                  >
                    {t('dashboard.createModal.createBtn')}
                  </button>
                </div>
              </form>
            )}

            {createStep === 3 && createdGroup && (
              <div className="space-y-6 text-center">
                <div className="space-y-1.5">
                  <h3 className="text-2xl font-black text-slate-900">{t('dashboard.createModal.step3Title')}</h3>
                  <p className="text-sm text-slate-500 mt-1.5">{t('dashboard.createModal.step3Subtitle')}</p>
                </div>

                {/* 6-Digit Code Display */}
                <div className="py-4 text-center">
                  <div className="text-5xl font-black text-slate-900 tracking-[0.2em] pl-[0.2em] select-all font-mono">
                    {createdGroup.invite_code}
                  </div>
                  <button
                    onClick={async () => {
                      await triggerHapticClick();
                      navigator.clipboard.writeText(createdGroup.invite_code);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-extrabold flex items-center gap-1.5 mx-auto pt-3 active:scale-95 transition-transform"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-600" />
                    {copiedCode ? t('dashboard.createModal.codeCopied') : t('dashboard.createModal.copyCodeBtn')}
                  </button>
                </div>

                {/* Share Link Actions */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await triggerHapticClick();
                        navigator.clipboard.writeText(`${window.location.origin}?join=${createdGroup.invite_code}`);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                    >
                      <Copy className="w-4 h-4 text-slate-400" />
                      {copiedLink ? "Link Copied!" : t('dashboard.createModal.copyLinkBtn')}
                    </button>

                    <button
                      onClick={async () => {
                        await triggerHapticClick();
                        const inviteLink = `${window.location.origin}?join=${createdGroup.invite_code}`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: createdGroup.name,
                              text: `Join my league on Puzzlr!`,
                              url: inviteLink,
                            });
                          } catch (err) {
                            // ignore
                          }
                        } else {
                          navigator.clipboard.writeText(inviteLink);
                          setCopiedLink(true);
                          setTimeout(() => setCopiedLink(false), 2000);
                        }
                      }}
                      className="flex-1 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-2xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98]"
                    >
                      <Share2 className="w-4 h-4 text-indigo-600" />
                      {t('dashboard.createModal.shareLinkBtn')}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 font-semibold italic">
                  {t('dashboard.createModal.expiresHint')}
                </p>

                <button
                  onClick={async () => {
                    await triggerHapticClick();
                    setShowCreateModal(false);
                  }}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all text-sm uppercase tracking-wider shadow-md active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Visual Step Indicator (3 Dots) moved out of card, placed at the bottom of the UI */}
          <div className="flex justify-center items-center gap-2.5 py-6">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${createStep === 1 ? 'bg-slate-800 scale-125' : 'bg-slate-300 hover:bg-slate-400'}`} />
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${createStep === 2 ? 'bg-slate-800 scale-125' : 'bg-slate-300 hover:bg-slate-400'}`} />
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${createStep === 3 ? 'bg-slate-800 scale-125' : 'bg-slate-300 hover:bg-slate-400'}`} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full min-h-screen bg-gradient-to-b from-surface-container-low to-surface-container text-on-surface font-body-md pb-24 pt-safe pb-safe">
      {/* Top Navbar */}
      <header className="flex justify-between items-center px-margin-mobile h-16 w-full z-50 fixed top-0 bg-surface-container-low/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary-fixed shadow-sm">
            <img
              alt="Puzzlr Mascot"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida/AP1WRLs6-Xdfp4G9uAP_f3ikAd5th19MEN4H7U-gbkiEoBfwhXyWRkUHE9daxPltsbDfy5pPiG0sKd2b90nGHShiBm7Rf_iIF24S3Rf3Tc0Ibl75tgZEreZaMkFA8Ht00_FHomHkW5wdcYEEGy7fwkJ1n6o3Vb2UeCj6A_5MfjOGNVFZ_BQFJ554l4yZcTDunt-kFdIPQeS0AwHnGZJ1cIkNePpc8kWhmBXvEhLD5zDrwKqBbbwu0aYnFOQazA1S"
            />
          </div>
          <h1 className="text-headline-md font-headline-md text-on-surface">Puzzlr</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Stats - Streak */}
          <button
            onClick={() => {
              triggerHapticClick();
              setShowCalendar(!showCalendar);
            }}
            className={`flex items-center bg-surface-container-lowest shadow-sm rounded-full px-3 py-1.5 border border-white/50 transition-all active:scale-95 cursor-pointer ${playedToday
              ? 'text-orange-600 border-orange-200 bg-orange-50'
              : 'text-sky-600 border-sky-300 bg-sky-50/80 animate-pulse shadow-[0_0_12px_rgba(14,165,233,0.45)]'
              }`}
            title="Streak Progress"
          >
            <img
              src={playedToday ? streakHot : streakCold}
              alt={playedToday ? "Hot Streak" : "Cold Streak"}
              className={`w-5 h-5 object-contain select-none mr-1 ${!playedToday ? 'animate-bounce' : ''}`}
            />
            <span className="text-label-bold font-label-bold text-primary leading-none tabular-nums">
              {profile?.streak_count || 0}
            </span>
          </button>

          {/* Stats - Coins */}
          <Link
            to="/shop"
            onClick={() => triggerHapticClick()}
            className="flex items-center bg-surface-container-lowest shadow-sm rounded-full px-3 py-1.5 border border-white/50 text-slate-800 transition-all active:scale-95 cursor-pointer"
            title={t('dashboard.shop')}
          >
            <img src={coinX3} alt="Coins" className="w-5 h-5 object-contain mr-1 select-none" />
            <span className="text-label-bold font-label-bold text-on-surface leading-none tabular-nums">
              {profile?.spendable_points || 0}
            </span>
          </Link>

          {/* Settings Button */}
          <Link
            to="/settings"
            onClick={() => triggerHapticClick()}
            className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center text-on-surface-variant hover:opacity-80 transition-opacity border border-white/50"
            title={t('dashboard.settings')}
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </div>
      </header>

      {/* Content Wrapper to offset the fixed header */}
      <div className="w-full pt-16 flex-1 flex flex-col">
        {/* Mini Calendar Drawer - Moves the rest of the UI down */}
        <div className={`bg-white/95 border-slate-200/50 shadow-sm transition-all duration-500 ease-in-out overflow-hidden ${showCalendar
          ? 'max-h-[500px] py-5 px-6 opacity-100 border-y'
          : 'max-h-0 py-0 px-6 opacity-0 border-y-0'
          }`}>
          <div className="max-w-md mx-auto space-y-4">

            {/* Header controls for Calendar */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-800 uppercase tracking-widest min-w-[120px] text-center">
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs font-black text-slate-600 flex items-center gap-1.5 select-none">
                <span>{profile?.streak_protectors || 0} x</span>
                <img src={streakProtector} alt="Streak Protector" className="w-4 h-4 object-contain" />
              </div>
            </div>

            {/* Calendar grid headers */}
            <div className="grid grid-cols-7 gap-2 text-center border-b border-slate-100 pb-1.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label) => (
                <span key={label} className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{label}</span>
              ))}
            </div>

            {/* Calendar grid days */}
            <div className="grid grid-cols-7 gap-x-2 gap-y-3">
              {getMonthDays().map((dayDate, idx) => {
                if (!dayDate) {
                  return <div key={`empty-${idx}`} className="w-9 h-9" />;
                }

                // YYYY-MM-DD local construction safely
                const year = dayDate.getFullYear();
                const monthStr = String(dayDate.getMonth() + 1).padStart(2, '0');
                const dateStrNum = String(dayDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${monthStr}-${dateStrNum}`;

                const isSolved = solvedDates.includes(dateStr);
                const todayStr = new Date().toISOString().split('T')[0];
                const signupDateStr = profile?.created_at ? profile.created_at.split('T')[0] : '';

                const isBeforeSignup = signupDateStr ? dateStr < signupDateStr : false;
                const isAfterToday = dateStr > todayStr;
                const isToday = dateStr === todayStr;

                // Simple render if outside of active user usage bounds (before signup or in future)
                if (isBeforeSignup || isAfterToday) {
                  return (
                    <div key={dateStr} className="flex flex-col items-center justify-center h-9">
                      <span className={`text-[10px] font-bold text-slate-300 w-7 h-7 rounded-full flex items-center justify-center ${isToday ? 'border border-indigo-200 text-slate-500' : ''}`}>
                        {dayDate.getDate()}
                      </span>
                    </div>
                  );
                }

                // Render with streak state indicator (Solved vs Cold)
                return (
                  <div key={dateStr} className="flex flex-col items-center justify-center h-9">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs border-2 transition-all relative ${isSolved
                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-300 text-white shadow-sm'
                        : isToday
                          ? 'border-indigo-400 border-dashed text-slate-800 bg-slate-50'
                          : 'bg-slate-50 border-slate-100 text-slate-300'
                        }`}
                      title={isSolved ? 'Solved!' : 'Cold day'}
                    >
                      <span>{dayDate.getDate()}</span>
                      {isSolved && (
                        <span className="absolute -top-1.5 -right-1 text-[8px]">🔥</span>
                      )}
                      {!isSolved && (
                        <span className="absolute -top-1.5 -right-1 text-[8px]">❄️</span>
                      )}
                      {isToday && !isSolved && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Main Container */}
        <main className="w-full px-margin-mobile max-w-lg mx-auto pt-4 space-y-6 flex-1">

          {/* Group / League Cards */}
          <div className="space-y-6">
            {groupsLoading ? (
              <div className="py-12 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-500 font-bold tracking-wider uppercase">{t('dashboard.loadingLeagues')}</p>
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center py-12 bg-white/70 border border-slate-200/60 rounded-[32px] p-8 backdrop-blur-md shadow-sm flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center shadow-inner">
                  <span className="text-3xl">👥</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">{t('groups.noGroups')}</h3>
                  <p className="text-xs text-slate-500 font-medium max-w-[200px] mx-auto leading-relaxed">{t('dashboard.createGroupHint')}</p>
                </div>
              </div>
            ) : (
              groups.map((group) => {
                const standings = groupStandings[group.id] || [];
                const members = groupMembers[group.id] || [];
                const isMuted = mutedGroups[group.id] || false;

                const userRank = standings.findIndex((s) => s.profile_id === profile?.id) + 1;

                return (
                  <Link
                    key={group.id}
                    to={`/group/${group.id}`}
                    onClick={() => triggerHapticClick()}
                    className="block bg-white rounded-[32px] overflow-hidden shadow-xl border border-white/5 transition-transform hover:scale-[1.01]"
                  >
                    {/* Banner image with overlapping avatars */}
                    <div className="relative h-44 w-full bg-slate-900">
                      <img
                        src={group.image_url || BANNER_PRESETS[0].url}
                        alt={group.name}
                        className="w-full h-full object-cover opacity-90"
                      />

                      {/* Volume Mute Toggle */}
                      <button
                        onClick={(e) => toggleMuteGroup(group.id, e)}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-all text-white border border-white/10"
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </button>

                      {/* Member Avatars Overlapping at the bottom-left */}
                      <div className="absolute -bottom-3 left-5 flex -space-x-3.5 z-10">
                        {members.slice(0, 4).map((member, idx) => (
                          <div
                            key={member.profile_id || idx}
                            className="w-12 h-12 flex items-center justify-center relative overflow-visible"
                            style={{ zIndex: 10 - idx }}
                            title={member.username}
                          >
                            <AvatarViewer
                              characterKey={cosmetics.find(c => c.id === member.equipped_character_id)?.asset_key || 'char_base'}
                              badgeKey={cosmetics.find(c => c.id === member.equipped_badge_id)?.asset_key || ''}
                              size="md"
                              borderClass="border-white"
                              shadowClass="shadow-md"
                            />
                          </div>
                        ))}
                        {members.length > 4 && (
                          <div className="w-12 h-12 rounded-full border-2 border-white bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shadow-md z-0">
                            +{members.length - 4}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info details under the banner image */}
                    <div className="p-6 pt-5 bg-white text-slate-900 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-extrabold text-xl text-slate-900 tracking-tight leading-tight">
                            {group.name}
                          </h3>
                        </div>

                        {/* Right-aligned badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Unread Chat Messages Badge */}
                          {unreadMessages[group.id] > 0 && (
                            <div className="bg-sky-50 text-sky-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-sky-100 shadow-sm animate-pulse">
                              <span>💬</span>
                              <span>{unreadMessages[group.id]}</span>
                            </div>
                          )}

                          {/* Pending Games Badge */}
                          {pendingGames[group.id] > 0 && (
                            <div className="bg-emerald-50 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100 shadow-sm">
                              <span>🎯</span>
                              <span>{pendingGames[group.id]} {pendingGames[group.id] === 1 ? 'play' : 'plays'}</span>
                            </div>
                          )}

                          {/* Streak fire badge */}
                          <div className="bg-slate-100 text-slate-700 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            <img
                              src={playedToday ? streakHot : streakCold}
                              alt="Streak"
                              className="w-4 h-4 object-contain select-none"
                            />
                            <span>{profile?.streak_count || 0}</span>
                          </div>

                          {/* Ranking Trophy badge */}
                          <div className="bg-slate-100 text-slate-700 font-extrabold text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span>#{userRank || 1}</span>
                            <span className="text-yellow-500">🏆</span>
                          </div>
                        </div>
                      </div>

                      {/* Expandable standings list breakdown inside card */}
                      {standings.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          <p className="text-[10px] text-slate-400 font-black tracking-widest uppercase">{t('dashboard.leaderboard')}</p>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {standings.map((userSt, i) => (
                              <div key={userSt.profile_id} className="flex justify-between items-center text-xs font-bold py-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-300 w-3 font-black">#{i + 1}</span>
                                  <span className={userSt.profile_id === profile?.id ? 'text-emerald-600' : 'text-slate-600'}>
                                    {userSt.username} {userSt.profile_id === profile?.id && ` ${t('dashboard.you')}`}
                                  </span>
                                </div>
                                <span className="text-emerald-600 font-black">{userSt.points} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Removed created date block */}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          {/* Group Suggestion Box */}
          <section className="w-full mt-6 border-2 border-dashed border-primary/20 rounded-3xl py-6 flex flex-col items-center justify-center bg-surface-container-lowest/50 backdrop-blur-sm">
            <h3 className="text-headline-sm font-headline-sm text-on-surface mb-1 flex items-center gap-2">
              {suggestedName}
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant">
              {t('dashboard.groupSuggestion')}
            </p>
          </section>

          {/* Create/Join Action Buttons */}
          <div className="w-full mt-8 flex flex-col gap-4 pb-8">
            {/* + NUEVO GRUPO button in yellow */}
            <button
              onClick={() => {
                triggerHapticClick();
                openCreateModal();
              }}
              className="w-full py-4 rounded-2xl font-headline-sm text-headline-sm font-bold text-on-tertiary-fixed bg-tertiary-fixed-dim shadow-[0_4px_14px_rgba(249,189,34,0.3)] hover:scale-[0.98] transition-transform flex items-center justify-center gap-2 border-b-4 border-tertiary/20 uppercase"
            >
              {t('dashboard.newGroupBtn')}
            </button>

            {/* Unirse a grupo pill link */}
            <button
              onClick={() => {
                triggerHapticClick();
                setShowJoinModal(true);
              }}
              className="w-max mx-auto px-8 py-3 rounded-full font-label-bold text-label-bold text-on-surface bg-surface-container-lowest shadow-sm border border-outline-variant/30 hover:scale-[0.98] transition-transform"
            >
              {t('dashboard.joinGroupBtn')}
            </button>
          </div>

        </main>
      </div>



      {/* JOIN GROUP MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowJoinModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900">{t('dashboard.joinModal.title')}</h3>
              <p className="text-xs text-slate-400 mt-1">{t('dashboard.joinModal.subtitle')}</p>
            </div>

            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t('groups.inviteCode')}</label>
                <input
                  type="text"
                  placeholder={t('dashboard.joinModal.codePlaceholder')}
                  value={joinInviteCode}
                  onChange={(e) => setJoinInviteCode(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-center text-sm font-black text-slate-800 placeholder-slate-400 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!joinInviteCode.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 font-bold rounded-2xl transition-all text-xs"
              >
                {t('dashboard.joinModal.joinBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SCORE SUBMISSION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowSubmitModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 flex items-center justify-center gap-2">
                <Clipboard className="w-5 h-5 text-emerald-600" /> {t('dashboard.submitModal.title')}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{t('dashboard.submitModal.subtitle')}</p>
            </div>

            <div className="space-y-4">
              <textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                placeholder={t('dashboard.pastePlaceholder')}
                rows={4}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all font-medium text-xs"
              />

              {submitMessage && (
                <div
                  className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${submitMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                    }`}
                >
                  {submitMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                  <span className="text-[10px]">{submitMessage.text}</span>
                </div>
              )}

              <button
                onClick={handleSubmitScore}
                disabled={!clipboardText.trim()}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 font-bold rounded-2xl shadow-sm transition-all text-xs"
              >
                {t('dashboard.pasteButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STREAK INCREASE ANIMATION MODAL */}
      {showStreakAnimation && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 text-white rounded-[32px] max-w-sm w-full p-8 shadow-2xl relative border border-white/20 transform scale-100 transition-all duration-300 flex flex-col items-center text-center space-y-6 animate-scale-up">
            
            {/* Sparkles / Effects */}
            <div className="absolute top-4 right-6 text-2xl animate-ping opacity-60">✨</div>
            <div className="absolute bottom-6 left-6 text-xl animate-bounce">⭐</div>
            
            {/* Animated Fire Icon */}
            <div className="relative w-28 h-28 flex items-center justify-center bg-white/20 rounded-full border border-white/30 shadow-lg animate-pulse">
              <img
                src={streakHot}
                alt="Streak Fire"
                className="w-20 h-20 object-contain select-none"
              />
            </div>
            
            {/* Text */}
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight uppercase drop-shadow-sm">
                {t('dashboard.streakIncreased', 'Streak Increased!')}
              </h2>
              <p className="text-xs font-semibold opacity-90 leading-relaxed">
                Your daily puzzle solving streak is heating up! Keep it going tomorrow.
              </p>
            </div>
            
            {/* Streak Count Circle */}
            <div className="bg-white text-orange-600 rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg border border-orange-200">
              <span className="text-3xl font-black leading-none tabular-nums">{streakAnimationValue}</span>
              <span className="text-[10px] font-black uppercase tracking-wider mt-0.5">Days</span>
            </div>
            
            {/* CTA Close Button */}
            <button
              onClick={async () => {
                await triggerHapticClick();
                setShowStreakAnimation(false);
              }}
              className="w-full py-4 bg-white hover:bg-slate-50 text-orange-600 font-black rounded-2xl transition-all text-sm uppercase tracking-wider shadow-md active:scale-[0.98] cursor-pointer"
            >
              Sweet!
            </button>
          </div>
        </div>
      )}

      {/* CLIPBOARD SCORE DETECTED MODAL */}
      {showClipboardModal && detectedGame && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative border border-slate-100">
            <button
              onClick={async () => {
                await triggerHapticClick();
                setShowClipboardModal(false);
                sessionStorage.setItem('puzzlr_last_ignored_clip', clipboardDetectText);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 mb-2">
                <Clipboard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                {t('dashboard.clipboardModal.title', 'Score Detected')}
              </h3>
              <p className="text-xs text-slate-500 font-medium px-2 leading-relaxed">
                {t('dashboard.clipboardModal.prompt', {
                  defaultValue: 'We found a score for {{gameName}} in your clipboard. Do you want to submit it to your leagues?',
                  gameName: detectedGame.gameName
                })}
              </p>
            </div>

            {/* Snippet of the clipboard text formatted nicely */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 max-h-24 overflow-y-auto">
              <pre className="text-[10px] text-slate-500 font-mono whitespace-pre-wrap break-all leading-tight">
                {clipboardDetectText}
              </pre>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={async () => {
                  await triggerHapticClick();
                  setShowClipboardModal(false);
                  sessionStorage.setItem('puzzlr_last_ignored_clip', clipboardDetectText);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all text-xs active:scale-[0.98]"
              >
                {t('dashboard.clipboardModal.ignoreBtn', 'No, Ignore')}
              </button>
              <button
                onClick={async () => {
                  await triggerHapticClick();
                  setShowClipboardModal(false);
                  sessionStorage.setItem('puzzlr_last_ignored_clip', clipboardDetectText);
                  // Open submit modal and auto-submit
                  setClipboardText(clipboardDetectText);
                  setShowSubmitModal(true);
                  // Process submission
                  await processSubmission(clipboardDetectText);
                }}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all text-xs shadow-sm active:scale-[0.98]"
              >
                {t('dashboard.clipboardModal.submitBtn', 'Yes, Submit')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
