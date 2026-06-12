import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { triggerHapticClick } from '../utils/haptics';
import { ArrowLeft, ChevronDown, Check } from 'lucide-react';
import { DisclaimerFooter } from '../components/DisclaimerFooter';

interface Game {
  id: string;
  display_name: string;
  reset_time_utc: string;
  base_points: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon definitions — purely geometric SVGs, no trademarked logos
// ─────────────────────────────────────────────────────────────────────────────

const NYTIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#1a1a1a" />
    <text x="24" y="32" textAnchor="middle" fontSize="22" fontWeight="800"
      fontFamily="Georgia,serif" fill="white">T</text>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#0A66C2" />
    <rect x="12" y="19" width="6" height="18" rx="1" fill="white" />
    <circle cx="15" cy="14" r="3.5" fill="white" />
    <path d="M22 25c0-3.3 2.2-6 6-6s6 2.7 6 6v12h-6V26a2 2 0 0 0-4 0v11h-2V25Z" fill="white" />
  </svg>
);


const OtherIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="48" height="48" rx="12" fill="#7c3aed" />
    <circle cx="24" cy="24" r="10" stroke="white" strokeWidth="2.5" fill="none" />
    <circle cx="24" cy="24" r="4" fill="white" />
    <line x1="24" y1="10" x2="24" y2="14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="24" y1="34" x2="24" y2="38" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="10" y1="24" x2="14" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="34" y1="24" x2="38" y2="24" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Per-game icons
const WordGridIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#22c55e" />
    {[0, 1, 2, 3, 4].map(col => (
      <rect key={col} x={5 + col * 6} y="10" width="4" height="4" rx="1"
        fill={col === 2 ? 'white' : 'rgba(255,255,255,0.4)'} />
    ))}
    {[0, 1, 2, 3, 4].map(col => (
      <rect key={col} x={5 + col * 6} y="16" width="4" height="4" rx="1"
        fill={col === 0 || col === 3 ? 'white' : 'rgba(255,255,255,0.3)'} />
    ))}
    {[0, 1, 2, 3, 4].map(col => (
      <rect key={col} x={5 + col * 6} y="22" width="4" height="4" rx="1"
        fill={col === 1 || col === 4 ? 'white' : 'rgba(255,255,255,0.3)'} />
    ))}
  </svg>
);

const QueensGridIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Light slate background acting as the grid frame */}
    <rect width="36" height="36" rx="8" fill="#f1f5f9" />

    {/* Row 0 */}
    <rect x="5" y="5" width="6" height="6" rx="1.5" fill="#14b8a6" /> {/* Teal */}
    <rect x="12" y="5" width="6" height="6" rx="1.5" fill="#14b8a6" />
    <rect x="19" y="5" width="6" height="6" rx="1.5" fill="#f59e0b" /> {/* Amber */}
    <rect x="26" y="5" width="6" height="6" rx="1.5" fill="#f59e0b" />

    {/* Row 1 */}
    <rect x="5" y="12" width="6" height="6" rx="1.5" fill="#14b8a6" /> {/* Teal */}
    <rect x="12" y="12" width="6" height="6" rx="1.5" fill="#f43f5e" /> {/* Rose */}
    <rect x="19" y="12" width="6" height="6" rx="1.5" fill="#f43f5e" />
    <rect x="26" y="12" width="6" height="6" rx="1.5" fill="#f59e0b" /> {/* Amber */}

    {/* Row 2 */}
    <rect x="5" y="19" width="6" height="6" rx="1.5" fill="#8b5cf6" /> {/* Violet */}
    <rect x="12" y="19" width="6" height="6" rx="1.5" fill="#f43f5e" /> {/* Rose */}
    <rect x="19" y="19" width="6" height="6" rx="1.5" fill="#f43f5e" />
    <rect x="26" y="19" width="6" height="6" rx="1.5" fill="#f59e0b" /> {/* Amber */}

    {/* Row 3 */}
    <rect x="5" y="26" width="6" height="6" rx="1.5" fill="#8b5cf6" /> {/* Violet */}
    <rect x="12" y="26" width="6" height="6" rx="1.5" fill="#8b5cf6" />
    <rect x="19" y="26" width="6" height="6" rx="1.5" fill="#8b5cf6" />
    <rect x="26" y="26" width="6" height="6" rx="1.5" fill="#8b5cf6" />
  </svg>
);

const ConnectionsIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#6366f1" />
    {/* 2×2 colored tiles */}
    <rect x="6" y="6" width="10" height="10" rx="3" fill="#fde68a" />
    <rect x="20" y="6" width="10" height="10" rx="3" fill="#86efac" />
    <rect x="6" y="20" width="10" height="10" rx="3" fill="#93c5fd" />
    <rect x="20" y="20" width="10" height="10" rx="3" fill="#f9a8d4" />
  </svg>
);

const CrosswordIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#0f172a" />
    {/* Black & white crossword grid */}
    {[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => {
      const black = (r === 0 && c === 2) || (r === 2 && c === 0) || (r === 2 && c === 4) || (r === 4 && c === 2) || (r === 1 && c === 1) || (r === 3 && c === 3);
      return <rect key={`${r}-${c}`} x={5 + c * 6} y={5 + r * 6} width="5" height="5" rx="0.5"
        fill={black ? '#0f172a' : 'white'} stroke="#1e293b" strokeWidth="0.5" />;
    }))}
  </svg>
);

const SpellingBeeIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#fbbf24" />
    {/* Hexagonal honeycomb hint */}
    <polygon points="18,7 24,11 24,19 18,23 12,19 12,11" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1.5" />
    <polygon points="18,13 21,15 21,19 18,21 15,19 15,15" fill="#f59e0b" />
    <text x="18" y="20" textAnchor="middle" fontSize="6" fontWeight="900"
      fontFamily="Arial,sans-serif" fill="white">B</text>
    <text x="18" y="30" textAnchor="middle" fontSize="7" fontWeight="900"
      fontFamily="Arial,sans-serif" fill="#78350f">BEE</text>
  </svg>
);

const MiniIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#0891b2" />
    {/* Tiny crossword 3x3 */}
    {[0, 1, 2].map(r => [0, 1, 2].map(c => (
      <rect key={`${r}-${c}`} x={8 + c * 7} y={8 + r * 7} width="6" height="6" rx="0.5"
        fill="white" stroke="#0e7490" strokeWidth="0.5" />
    )))}
    <rect x="8" y="22" width="6" height="6" rx="0.5" fill="#0e7490" />
    <rect x="22" y="8" width="6" height="6" rx="0.5" fill="#0e7490" />
  </svg>
);

const StrandsIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#10b981" />
    {/* Word-search dots grid */}
    {[0, 1, 2, 3, 4].map(r => [0, 1, 2, 3, 4].map(c => (
      <circle key={`${r}-${c}`} cx={8 + c * 5} cy={8 + r * 5} r="1.5"
        fill="white" opacity={(r + c) % 3 === 0 ? '1' : '0.4'} />
    )))}
    {/* Highlighted path */}
    <polyline points="8,8 13,13 18,18 23,13 28,8" stroke="white" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
  </svg>
);

const LinkedInQuesIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#0A66C2" />
    {/* Colored regions like Queens puzzle */}
    <rect x="6" y="6" width="11" height="11" rx="2" fill="#fde68a" opacity="0.9" />
    <rect x="19" y="6" width="11" height="11" rx="2" fill="#86efac" opacity="0.9" />
    <rect x="6" y="19" width="11" height="11" rx="2" fill="#f9a8d4" opacity="0.9" />
    <rect x="19" y="19" width="11" height="11" rx="2" fill="#c4b5fd" opacity="0.9" />
    {/* Crown on top-right */}
    <text x="24" y="16" textAnchor="middle" fontSize="8">♛</text>
  </svg>
);

const PinpointIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#1d4ed8" />
    <circle cx="18" cy="16" r="7" stroke="white" strokeWidth="2" fill="none" />
    <circle cx="18" cy="16" r="2.5" fill="white" />
    <line x1="18" y1="23" x2="18" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="30" x2="24" y2="30" stroke="white" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const TangoIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#7c3aed" />
    {/* Sun & Moon yin-yang hint */}
    <circle cx="18" cy="18" r="10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
    <path d="M18 8 A10 10 0 0 1 18 28 A5 5 0 0 1 18 18 A5 5 0 0 0 18 8Z" fill="white" opacity="0.85" />
    <circle cx="18" cy="13" r="2" fill="#7c3aed" />
    <circle cx="18" cy="23" r="2" fill="white" opacity="0.85" />
    <text x="18" y="35" textAnchor="middle" fontSize="5" fontWeight="900"
      fontFamily="Arial,sans-serif" fill="rgba(255,255,255,0.7)">☯</text>
  </svg>
);

const ZipIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#059669" />
    {/* Zigzag path like Zip puzzle */}
    <polyline points="8,8 28,8 8,28 28,28" stroke="white" strokeWidth="3"
      strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="8" cy="8" r="3" fill="white" />
    <circle cx="28" cy="28" r="3" fill="#34d399" />
  </svg>
);

const WordleEsIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* White background with a subtle border */}
    <rect width="36" height="36" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
    {[0, 1, 2, 3, 4].map(col => {
      let color = '#cbd5e1';
      if (col === 1) color = '#f39c12';
      if (col === 3) color = '#2ecc71';
      return (
        <rect key={col} x={5 + col * 6} y="10" width="4" height="4" rx="1" fill={color} />
      );
    })}
    {[0, 1, 2, 3, 4].map(col => {
      let color = '#cbd5e1';
      if (col === 0) color = '#2ecc71';
      if (col === 2) color = '#f39c12';
      return (
        <rect key={col} x={5 + col * 6} y="16" width="4" height="4" rx="1" fill={color} />
      );
    })}
    {[0, 1, 2, 3, 4].map(col => (
      <rect key={col} x={5 + col * 6} y="22" width="4" height="4" rx="1" fill="#cbd5e1" />
    ))}
    {/* ES flag stripe (red-yellow-red) */}
    <rect x="5" y="28" width="26" height="4" rx="1" fill="#c0392b" />
    <rect x="5" y="29" width="26" height="2" fill="#f39c12" />
  </svg>
);

const GenericGameIcon = () => (
  <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <rect width="36" height="36" rx="8" fill="#6b7280" />
    <rect x="8" y="14" width="20" height="10" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
    <circle cx="13" cy="19" r="2" fill="white" opacity="0.6" />
    <circle cx="23" cy="19" r="2" fill="white" opacity="0.6" />
    <circle cx="18" cy="19" r="2.5" fill="white" />
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// Game metadata map — maps game ID → { icon, origin }
// "origin" is one of: 'nyt' | 'linkedin' | 'lapalabra' | 'other'
// ─────────────────────────────────────────────────────────────────────────────
const GAME_META: Record<string, { icon: React.FC; origin: string; genericName: string }> = {
  word_grid: { icon: WordGridIcon, origin: 'nyt', genericName: 'Daily Word Grid' },
  chess_grid: { icon: QueensGridIcon, origin: 'linkedin', genericName: "Queen's Grid" },
  word_group: { icon: ConnectionsIcon, origin: 'nyt', genericName: 'Group Categorization' },
  crossword: { icon: CrosswordIcon, origin: 'nyt', genericName: 'Daily Crossword' },
  mini: { icon: MiniIcon, origin: 'nyt', genericName: 'Mini Grid' },
  spelling_bee: { icon: SpellingBeeIcon, origin: 'nyt', genericName: 'Word Hive' },
  strands: { icon: StrandsIcon, origin: 'nyt', genericName: 'Word Strands' },
  linkedin_ques: { icon: LinkedInQuesIcon, origin: 'linkedin', genericName: "Queen's Grid Pro" },
  pinpoint: { icon: PinpointIcon, origin: 'linkedin', genericName: 'Pinpoint Clues' },
  tango: { icon: TangoIcon, origin: 'linkedin', genericName: 'Balance Puzzle' },
  zip: { icon: ZipIcon, origin: 'linkedin', genericName: 'Path Puzzle' },
  wordle_es: { icon: WordleEsIcon, origin: 'lapalabra', genericName: 'La Palabra del Día' },
};

export const getMeta = (gameId: string) =>
  GAME_META[gameId] ?? { icon: GenericGameIcon, origin: 'other', genericName: '' };

// ─────────────────────────────────────────────────────────────────────────────
// Origin groups config
// ─────────────────────────────────────────────────────────────────────────────
const ORIGIN_GROUPS = [
  {
    key: 'nyt',
    label: 'The New York Times',
    labelShort: 'NYT',
    color: 'from-slate-800 to-slate-900',
    accent: 'bg-slate-800',
    textAccent: 'text-slate-900',
    bgLight: 'bg-slate-50',
    borderColor: 'border-slate-200',
    iconBg: 'bg-slate-100',
    icon: NYTIcon,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    labelShort: 'LinkedIn',
    color: 'from-sky-600 to-blue-700',
    accent: 'bg-sky-600',
    textAccent: 'text-sky-700',
    bgLight: 'bg-sky-50',
    borderColor: 'border-sky-100',
    iconBg: 'bg-sky-50',
    icon: LinkedInIcon,
  },
  {
    key: 'lapalabra',
    label: 'La Palabra del Día',
    labelShort: 'La Palabra',
    color: 'from-red-600 to-orange-700',
    accent: 'bg-red-600',
    textAccent: 'text-red-700',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-100',
    iconBg: 'bg-red-50',
    icon: WordleEsIcon,
  },
  {
    key: 'other',
    label: 'Others',
    labelShort: 'Others',
    color: 'from-violet-600 to-purple-700',
    accent: 'bg-violet-600',
    textAccent: 'text-violet-700',
    bgLight: 'bg-violet-50',
    borderColor: 'border-violet-100',
    iconBg: 'bg-violet-50',
    icon: OtherIcon,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export const ManageGames = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [allGames, setAllGames] = useState<Game[]>([]);
  const [activeGameIds, setActiveGameIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // gameId being toggled
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [group, setGroup] = useState<any>(null);


  useEffect(() => {
    const load = async () => {
      const [{ data: gamesData }, { data: activeData }, { data: groupData }] = await Promise.all([
        supabase.from('games').select('*').order('display_name'),
        supabase.from('group_games').select('game_id').eq('group_id', groupId),
        supabase.from('groups').select('*').eq('id', groupId).single(),
      ]);
      if (gamesData) setAllGames(gamesData);
      if (activeData) setActiveGameIds(activeData.map((ag: any) => ag.game_id));
      if (groupData) setGroup(groupData);
      setLoading(false);
    };
    load();
  }, [groupId]);

  const handleToggle = async (gameId: string) => {
    await triggerHapticClick();
    setSaving(gameId);
    const isActive = activeGameIds.includes(gameId);

    if (isActive) {
      const { error } = await supabase
        .from('group_games')
        .delete()
        .eq('group_id', groupId)
        .eq('game_id', gameId);
      if (!error) setActiveGameIds(prev => prev.filter(id => id !== gameId));
    } else {
      const { error } = await supabase
        .from('group_games')
        .insert({ group_id: groupId, game_id: gameId });
      if (!error) setActiveGameIds(prev => [...prev, gameId]);
    }
    setSaving(null);
  };

  // Group games by origin
  const gamesByOrigin = (originKey: string) =>
    allGames.filter(g => getMeta(g.id).origin === originKey);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/40 text-slate-800 font-sans pt-safe">

      {/* ── Modern Clean Header ── */}
      <header className="relative z-20 max-w-lg mx-auto px-4 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={async () => { await triggerHapticClick(); navigate(-1); }}
            className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/40 transition-all active:scale-95 flex-shrink-0"
            aria-label={t('groupDetails.backBtn')}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          {!loading && group && (
            <h1 className="text-lg font-black text-slate-900 tracking-tight truncate">
              {group.name}
            </h1>
          )}
        </div>


      </header>

      {/* ── Body ── */}
      <main className="max-w-lg mx-auto px-4 py-4 pb-60 space-y-6">

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        )}


        {!loading && ORIGIN_GROUPS.map(group => {
          const games = gamesByOrigin(group.key);
          if (games.length === 0) return null;

          const OriginIcon = group.icon;
          const activeInGroup = games.filter(g => activeGameIds.includes(g.id)).length;
          const isExpanded = !!expandedGroups[group.key];

          return (
            <section key={group.key} className="space-y-3 bg-white/40 border border-slate-100 rounded-3xl p-3 transition-all">
              {/* ── Section header (Collapsible toggle) ── */}
              <button
                type="button"
                onClick={async () => {
                  await triggerHapticClick();
                  setExpandedGroups(prev => ({
                    ...prev,
                    [group.key]: !prev[group.key]
                  }));
                }}
                className="w-full flex items-center gap-3 px-1 py-1.5 text-left cursor-pointer group/hdr hover:bg-slate-100/60 rounded-2xl transition-all focus:outline-none"
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                  <OriginIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm font-black text-slate-900 leading-tight">
                    {group.label}
                  </h2>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${group.textAccent}`}>
                    {activeInGroup}/{games.length} active
                  </p>
                </div>
                {/* Chevron Down indicator */}
                <ChevronDown
                  className={`w-4 h-4 text-slate-450 transition-transform duration-250 mr-1 ${
                    isExpanded ? 'rotate-180 text-slate-800' : ''
                  }`}
                />
              </button>

              {/* ── Game cards (Rendered when expanded) ── */}
              {isExpanded && (
                <div className="space-y-2 animate-fade-in pt-1">
                  {games.map(game => {
                    const meta = getMeta(game.id);
                    const GameIcon = meta.icon;
                    const isActive = activeGameIds.includes(game.id);
                    const isSaving = saving === game.id;
                    const displayName = meta.genericName || game.display_name;

                    return (
                      <button
                        key={game.id}
                        onClick={() => handleToggle(game.id)}
                        disabled={isSaving}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 text-left group active:scale-[0.98] ${isActive
                          ? `${group.bgLight} ${group.borderColor} shadow-sm`
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                          } ${isSaving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
                      >
                        {/* Game icon */}
                        <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-sm">
                          <GameIcon />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900 leading-tight truncate">
                              {displayName}
                            </span>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? group.textAccent : 'text-slate-400'
                            }`}>
                            {game.base_points} base pts · {group.labelShort}
                          </span>
                        </div>

                        {/* Toggle indicator */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${isActive
                          ? `${group.accent} border-transparent`
                          : 'border-slate-300 bg-white group-hover:border-slate-400'
                          }`}>
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          )}
                          {isSaving && (
                            <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {/* No games at all */}
        {!loading && allGames.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <span className="text-4xl">🎮</span>
            <p className="text-sm text-slate-500 font-bold">No games configured yet.</p>
            <p className="text-xs text-slate-400">Add games in your Supabase games table to get started.</p>
          </div>
        )}

      </main>

      {/* ── Save/Done button pinned to bottom ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="h-8 bg-gradient-to-t from-slate-50 to-transparent" />
        <div className="bg-slate-50/90 backdrop-blur-md px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 pointer-events-auto">
          <div className="max-w-lg mx-auto space-y-2">
            <button
              onClick={async () => { await triggerHapticClick(); navigate(-1); }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all text-sm active:scale-[0.98] shadow-lg"
            >
              {t('groupDetails.manageGamesDone', 'Done — Save Selection')}
            </button>
            <DisclaimerFooter />
          </div>
        </div>
      </div>
    </div>
  );
};