import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, X, Zap, Award, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Clipboard as CapClipboard } from '@capacitor/clipboard';
import { useAuth } from '../hooks/useAuth';
import { useDailyScores } from '../hooks/useDailyScores';
import { useGroups } from '../hooks/useGroups';
import { parseShareText } from '../services/parser';
import { supabase } from '../services/supabase';
import { triggerHapticClick, triggerHapticSuccess, triggerHapticError } from '../utils/haptics';

interface ClipboardAutoSubmitterProps {
  onSuccess: (gameId: string, pointsEarned: number, isFirstSubmission: boolean, newStreakCount?: number) => void;
}

export const ClipboardAutoSubmitter: React.FC<ClipboardAutoSubmitterProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { scores, submitScore, loading: scoresLoading } = useDailyScores();
  const { groups, loading: groupsLoading } = useGroups();

  const [notification, setNotification] = useState<{
    visible: boolean;
    gameName: string;
    scoreText: string;
    points: number;
    streak: number;
    isError?: boolean;
    errorText?: string;
  } | null>(null);

  const [notifTimeout, setNotifTimeout] = useState<any>(null);

  // Keep references to changing props and state to prevent listener re-registrations
  const profileRef = useRef(profile);
  const scoresRef = useRef(scores);
  const groupsRef = useRef(groups);
  const scoresLoadingRef = useRef(scoresLoading);
  const groupsLoadingRef = useRef(groupsLoading);
  const submitScoreRef = useRef(submitScore);
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    profileRef.current = profile;
    scoresRef.current = scores;
    groupsRef.current = groups;
    scoresLoadingRef.current = scoresLoading;
    groupsLoadingRef.current = groupsLoading;
    submitScoreRef.current = submitScore;
    onSuccessRef.current = onSuccess;
  });

  useEffect(() => {
    return () => {
      if (notifTimeout) clearTimeout(notifTimeout);
    };
  }, [notifTimeout]);

  // Clipboard checking routine
  useEffect(() => {
    if (!profile?.id) return;

    const showErrorNotification = (title: string, errorText: string) => {
      setNotification({
        visible: true,
        gameName: title,
        scoreText: '',
        points: 0,
        streak: 0,
        isError: true,
        errorText
      });

      if (notifTimeout) clearTimeout(notifTimeout);
      const timer = setTimeout(() => {
        setNotification(prev => prev ? { ...prev, visible: false } : null);
      }, 4500);
      setNotifTimeout(timer);
    };

    const checkAndSubmit = async (overrideText?: string) => {
      const currentScoresLoading = scoresLoadingRef.current;
      const currentGroupsLoading = groupsLoadingRef.current;
      const currentGroups = groupsRef.current;
      const currentScores = scoresRef.current;
      const currentProfile = profileRef.current;
      const currentSubmitScore = submitScoreRef.current;
      const currentOnSuccess = onSuccessRef.current;

      // Guard database checks while fetching initial data
      if (currentScoresLoading || currentGroupsLoading || currentGroups.length === 0) {
        if (overrideText) {
          await triggerHapticError();
          showErrorNotification("System Busy", t('dashboard.errors.loading', 'Loading data, please try again in a moment...'));
        }
        return;
      }

      let text = overrideText || '';
      
      if (!text) {
        if (Capacitor.isNativePlatform()) {
          try {
            const { value } = await CapClipboard.read();
            text = value || '';
          } catch (err) {
            console.warn('Failed to read native clipboard:', err);
          }
        } else {
          // On desktop web, do not call readText automatically to avoid browser prompts/warnings.
          // Web relies purely on manual paste (Ctrl+V) which fires the 'paste' event.
          return;
        }
      }

      if (!text || !text.trim()) return;

      // Avoid repeating if this exact clip was processed/ignored (only for background checks)
      if (!overrideText) {
        const lastProcessed = sessionStorage.getItem('puzzlr_last_ignored_clip');
        if (lastProcessed === text) return;
      }

      const parsed = parseShareText(text);
      if (!parsed) {
        if (overrideText) {
          await triggerHapticError();
          showErrorNotification("Format Error", t('dashboard.errors.failedToParse', 'Failed to parse the minigame. Please try again.'));
        }
        return;
      }

      // Check if user already submitted a score for this minigame today
      const alreadySubmitted = currentScores.some((s) =>
        s.game_id === parsed.gameId ||
        ((parsed.gameId === 'wordle_es' || parsed.gameId === 'la_palabra') &&
          (s.game_id === 'wordle_es' || s.game_id === 'la_palabra'))
      );

      if (alreadySubmitted) {
        if (overrideText) {
          await triggerHapticError();
          showErrorNotification(parsed.gameName, t('dashboard.alreadySubmitted', 'Score already submitted today!'));
        }
        return;
      }

      // Query active games for the user's groups to see if the minigame is assigned to any of them
      const gameIdsToCheck = parsed.gameId === 'wordle_es' || parsed.gameId === 'la_palabra'
        ? ['wordle_es', 'la_palabra']
        : [parsed.gameId];

      const { data: activeGroupGames, error: activeErr } = await supabase
        .from('group_games')
        .select('group_id')
        .in('game_id', gameIdsToCheck)
        .in('group_id', currentGroups.map(g => g.id));

      if (activeErr || !activeGroupGames || activeGroupGames.length === 0) {
        if (overrideText) {
          await triggerHapticError();
          showErrorNotification(parsed.gameName, t('dashboard.errors.noGroupsWithGame', "You don't have any group with this minigame."));
        }
        return;
      }

      // Mark this clipboard text as processed immediately to prevent duplicate requests
      sessionStorage.setItem('puzzlr_last_ignored_clip', text);

      // Submit score automatically
      const isFirstSubmissionToday = currentScores.length === 0;
      const res = await currentSubmitScore(parsed.gameId, text, parsed.score, parsed.maxScore);

      if (res.success) {
        await triggerHapticSuccess();

        const points = res.pointsEarned || 0;
        const newStreak = res.newStreakCount || (currentProfile?.streak_count || 0) + 1;

        // Display beautiful 3D retro notification toast
        setNotification({
          visible: true,
          gameName: parsed.gameName,
          scoreText: `${parsed.score}/${parsed.maxScore}`,
          points,
          streak: newStreak
        });

        // Trigger dashboard updates in parent
        currentOnSuccess(parsed.gameId, points, isFirstSubmissionToday, newStreak);

        // Auto hide notification
        if (notifTimeout) clearTimeout(notifTimeout);
        const timer = setTimeout(() => {
          setNotification(prev => prev ? { ...prev, visible: false } : null);
        }, 4500);
        setNotifTimeout(timer);
      } else {
        await triggerHapticError();
        showErrorNotification(parsed.gameName, res.message || "Failed to submit score");
      }
    };

    // Run clipboard check after load delay
    const loadTimer = setTimeout(() => {
      checkAndSubmit();
    }, 1200);

    // Listen for focus and paste events
    const handleFocus = () => checkAndSubmit();
    const handlePaste = async (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text') || '';
      if (text) {
        await checkAndSubmit(text);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('paste', handlePaste);

    return () => {
      clearTimeout(loadTimer);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('paste', handlePaste);
    };
  }, [profile?.id, notifTimeout]);

  if (!notification) return null;

  return (
    <div
      className={`fixed top-20 md:top-24 left-4 right-4 md:left-auto md:right-6 md:max-w-xs ${
        notification.isError ? 'bg-rose-50' : 'bg-emerald-50'
      } text-slate-800 border-2 border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0px_#0f172a] z-[100] transition-all duration-500 ease-out transform ${
        notification.visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-6 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <button
        onClick={async () => {
          await triggerHapticClick();
          setNotification(prev => prev ? { ...prev, visible: false } : null);
        }}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-800 transition-colors p-1"
      >
        <X className="w-4 h-4 stroke-[2.5]" />
      </button>

      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-xl ${
          notification.isError ? 'bg-rose-400' : 'bg-emerald-400'
        } border-2 border-slate-900 flex items-center justify-center shadow-[1.5px_1.5px_0px_#0f172a] shrink-0`}>
          {notification.isError ? (
            <AlertTriangle className="w-5 h-5 text-slate-900 stroke-[2.5]" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-slate-900 stroke-[2.5]" />
          )}
        </div>

        <div className="space-y-1 pr-4">
          <span className={`font-outfit font-black text-[10px] uppercase tracking-wider ${
            notification.isError ? 'text-rose-800' : 'text-emerald-800'
          }`}>
            {notification.isError 
              ? t('dashboard.clipboardModal.autoSubmitError', 'Error Detected ⚠️') 
              : t('dashboard.clipboardModal.autoSubmitTitle', 'Score Auto-Submitted! 🚀')
            }
          </span>
          <h4 className="font-outfit font-black text-sm text-slate-900 leading-tight">
            {notification.gameName}
          </h4>
          
          {notification.isError ? (
            <p className="font-outfit text-xs text-rose-700 font-semibold leading-normal pt-0.5">
              {notification.errorText}
            </p>
          ) : (
            <>
              <p className="font-outfit text-xs text-slate-500 font-semibold">
                Result: <span className="text-slate-800 font-black">{notification.scoreText}</span>
              </p>

              <div className="flex gap-2 pt-1">
                <span className="flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-lg border border-amber-300 shadow-sm">
                  <Award className="w-3 h-3 stroke-[2.5]" />
                  +{notification.points} pts
                </span>
                <span className="flex items-center gap-1 bg-sky-100 text-sky-800 text-[10px] font-black px-2 py-0.5 rounded-lg border border-sky-300 shadow-sm">
                  <Zap className="w-3 h-3 stroke-[2.5]" />
                  {notification.streak} Days
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
