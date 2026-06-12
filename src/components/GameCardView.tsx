import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { triggerHapticClick } from '../utils/haptics';

interface GameCardViewProps {
  parsed: {
    type: string;
    gameId: string;
    guesses?: string;
    time?: string;
    score?: number;
    max?: number;
  };
  profileId: string;
  todayScores: any[];
}

export const GameCardView: React.FC<GameCardViewProps> = ({ parsed, profileId, todayScores }) => {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  const [showTomorrowModal, setShowTomorrowModal] = useState(false);

  // Find the score in todayScores to extract the emoji grid or raw_text details
  const matchingScore = todayScores.find(
    s => s.profile_id === profileId && (
      s.game_id === parsed.gameId || 
      (parsed.gameId === 'wordle_es' && s.game_id === 'la_palabra') || 
      (parsed.gameId === 'la_palabra' && s.game_id === 'wordle_es')
    )
  );

  // Calculate dynamic standing points (5 * (players - position + 1))
  const { tempPoints } = useMemo(() => {
    const isSameGameCategory = (scoreGameId: string, cardGameId: string) => {
      if (scoreGameId === cardGameId) return true;
      const wordleIds = ['word_grid', 'wordle_es', 'la_palabra'];
      if (wordleIds.includes(scoreGameId) && wordleIds.includes(cardGameId)) return true;
      return false;
    };

    const sameGameScores = todayScores.filter(s => isSameGameCategory(s.game_id, parsed.gameId));

    // De-duplicate by profile_id to get unique players' best scores
    const userBestScoresMap: Record<string, typeof sameGameScores[0]> = {};
    sameGameScores.forEach(s => {
      const existing = userBestScoresMap[s.profile_id];
      if (!existing || s.score > existing.score) {
        userBestScoresMap[s.profile_id] = s;
      }
    });

    const uniqueScores = Object.values(userBestScoresMap);
    const sortedScores = uniqueScores.sort((a, b) => b.score - a.score);
    const total = sortedScores.length;

    if (total === 0) {
      return { position: 1, totalPlayers: 1, tempPoints: 5 };
    }

    const scoreRow = userBestScoresMap[profileId];
    if (!scoreRow) {
      // Fallback for user who just submitted but scores list hasn't updated yet
      let parsedScore = 0;
      if (parsed.guesses && parsed.guesses !== 'X') {
        const guessesInt = parseInt(parsed.guesses, 10);
        parsedScore = 7 - guessesInt;
      } else if (parsed.score !== undefined) {
        parsedScore = parsed.score;
      }

      const tempScores = [...sortedScores, { profile_id: profileId, score: parsedScore }];
      const tempSorted = tempScores.sort((a, b) => b.score - a.score);
      const higherCount = tempSorted.filter(s => s.score > parsedScore).length;
      const pos = higherCount + 1;
      const tPlayers = tempSorted.length;
      return {
        position: pos,
        totalPlayers: tPlayers,
        tempPoints: 5 * (tPlayers - pos + 1)
      };
    }

    const userScore = scoreRow.score;
    const higherCount = sortedScores.filter(s => s.score > userScore).length;
    const pos = higherCount + 1;

    return {
      position: pos,
      totalPlayers: total,
      tempPoints: 5 * (total - pos + 1)
    };
  }, [todayScores, parsed.gameId, parsed.guesses, parsed.score, profileId]);

  const handleInfoClick = async () => {
    await triggerHapticClick();
    setShowTomorrowModal(true);
  };

  const handleCloseModal = async () => {
    await triggerHapticClick();
    setShowTomorrowModal(false);
  };

  const renderCard = () => {
    // 1. Daily Word Grid or Spanish Wordle (La Palabra del Día)
    if (
      parsed.type === 'completed_word_grid' || 
      parsed.gameId === 'word_grid' || 
      parsed.gameId === 'wordle_es' || 
      parsed.gameId === 'la_palabra'
    ) {
      const isEs = parsed.gameId === 'wordle_es' || parsed.gameId === 'la_palabra' || isSpanish;
      const displayName = isEs ? 'La Palabra del Día' : 'Daily Word Grid';
      const guesses = parsed.guesses || (matchingScore ? (matchingScore.score === 0 ? 'X' : String(7 - matchingScore.score)) : 'X');
      const badgeText = isEs ? `${guesses}/6 intentos` : `${guesses}/6 guesses`;
      const solvedAttemptsText = isEs ? `Resuelto en ${guesses} intentos` : `Solved in ${guesses} attempts`;
      const failedText = isEs ? 'No resuelto' : 'Not solved';
      const solvedText = guesses === 'X' ? failedText : solvedAttemptsText;

      // Parse the grid out of the raw text
      let gridRows: string[] = [];
      if (matchingScore && matchingScore.raw_text) {
        const lines = matchingScore.raw_text.split('\n');
        // Match lines that contain grid blocks
        gridRows = lines.filter((l: string) => /[🟩🟨⬛⬜🟫🟪🟦]/.test(l)).map((l: string) => l.trim());
      }

      return (
        <div className="p-4 w-60 rounded-2xl bg-white flex flex-col gap-3 transition-colors shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-[10px] tracking-wider text-slate-800 uppercase font-outfit">
              {displayName}
            </span>
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
              isEs ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              {badgeText}
            </span>
          </div>

          {gridRows.length > 0 ? (
            <div className="flex flex-col gap-1 my-0.5">
              {gridRows.map((row, rIdx) => {
                const emojis = Array.from(row);
                return (
                  <div key={rIdx} className="flex gap-1 justify-start">
                    {emojis.slice(0, 5).map((emoji, cIdx) => {
                      let bgColor = 'bg-slate-200';
                      if (emoji === '🟩') bgColor = 'bg-emerald-500';
                      else if (emoji === '🟨') bgColor = 'bg-amber-400';
                      else if (emoji === '⬛' || emoji === '⬜') bgColor = 'bg-slate-300';
                      return (
                        <div key={cIdx} className={`w-3.5 h-3.5 rounded-[3px] ${bgColor}`} />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            // Mini fallback visual representation
            <div className="flex flex-col gap-1 my-0.5">
              {Array.from({ length: 3 }).map((_, rIdx) => (
                <div key={rIdx} className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, cIdx) => (
                    <div key={cIdx} className="w-3.5 h-3.5 rounded-[3px] bg-slate-100" />
                  ))}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[9px] text-slate-500 font-bold">
            <span>{guesses === 'X' ? failedText : solvedText}</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-emerald-600 font-extrabold" title={isEs ? "Gemas instantáneas" : "Instant gems"}>
                +15
              </span>
              <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md text-[8px] font-black shadow-sm">
                <span>+{tempPoints}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick();
                  }}
                  className="p-0.5 hover:bg-amber-100/50 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Info size={9} className="stroke-[3]" />
                </button>
              </div>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">
                {isEs ? 'PTOS' : 'PTS'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 2. Group Categorization Game (Connections)
    if (parsed.type === 'completed_word_group' || parsed.gameId === 'word_group') {
      const displayName = isSpanish ? 'Categorización de Grupos' : 'Group Categorization Game';
      const scoreVal = parsed.score !== undefined ? parsed.score : (matchingScore ? matchingScore.score : 0);
      const maxVal = parsed.max !== undefined ? parsed.max : (matchingScore ? matchingScore.max_score : 4);
      
      const badgeText = isSpanish ? `Puntuación: ${scoreVal}/${maxVal}` : `Score: ${scoreVal}/${maxVal}`;
      const solvedText = isSpanish ? `Resuelto en ${scoreVal} grupos` : `Solved in ${scoreVal} groups`;

      // Try to parse categories from raw_text
      let parsedRows: string[] = [];
      if (matchingScore && matchingScore.raw_text) {
        const lines = matchingScore.raw_text.split('\n');
        const emojiRows = lines.filter((l: string) => /[🟨🟩🟦🟪]/.test(l)).map((l: string) => l.trim());
        
        emojiRows.forEach((row: string) => {
          const chars = Array.from(row);
          if (chars.length >= 4) {
            const first = chars[0];
            if (chars.slice(0, 4).every(c => c === first)) {
              parsedRows.push(first);
            }
          }
        });
      }

      if (parsedRows.length === 0) {
        const colors = ['🟨', '🟩', '🟦', '🟪'];
        for (let i = 0; i < scoreVal; i++) {
          parsedRows.push(colors[i % 4]);
        }
      }

      const groupColorsMap: Record<string, { bg: string, text: string, border: string }> = {
        '🟨': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
        '🟩': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
        '🟦': { bg: 'bg-sky-100', text: 'text-sky-850', border: 'border-sky-200' },
        '🟪': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' }
      };

      return (
        <div className="p-4 w-60 rounded-2xl bg-white flex flex-col gap-3 transition-colors shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-[10px] tracking-wider text-slate-800 uppercase font-outfit">
              {displayName}
            </span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {badgeText}
            </span>
          </div>

          <div className="flex flex-col gap-1 my-0.5">
            {parsedRows.map((color, idx) => {
              const style = groupColorsMap[color] || groupColorsMap['🟨'];
              return (
                <div
                  key={idx}
                  className={`h-5 rounded-lg border text-[8px] font-black flex items-center px-2 shadow-sm ${style.bg} ${style.text} ${style.border}`}
                >
                  {isSpanish ? `Grupo ${idx + 1} Resuelto` : `Group ${idx + 1} Solved`}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[9px] text-slate-500 font-bold">
            <span>{solvedText}</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-emerald-600 font-extrabold" title={isSpanish ? "Gemas instantáneas" : "Instant gems"}>
                +15
              </span>
              <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md text-[8px] font-black shadow-sm">
                <span>+{tempPoints}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick();
                  }}
                  className="p-0.5 hover:bg-amber-100/50 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Info size={9} className="stroke-[3]" />
                </button>
              </div>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">
                {isSpanish ? 'PTOS' : 'PTS'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // 3. Queen's Grid (Queens)
    if (
      parsed.type === 'completed_chess_grid' || 
      parsed.type === 'completed_chess_grid_no_time' || 
      parsed.gameId === 'chess_grid'
    ) {
      const displayName = isSpanish ? "Cuadrícula de la Reina" : "Queen's Grid";
      const timeVal = parsed.time || (matchingScore && matchingScore.raw_text ? matchingScore.raw_text.match(/\d+:\d+/)?.[0] : null);
      const badgeText = timeVal ? (isSpanish ? `Tiempo: ${timeVal}` : `Time: ${timeVal}`) : (isSpanish ? 'Resuelto' : 'Solved');
      const solvedText = isSpanish ? 'Cuadrícula Completada' : 'Chess Grid Completed';

      return (
        <div className="p-4 w-60 rounded-2xl bg-white flex flex-col gap-3 transition-colors shadow-sm">
          <div className="flex justify-between items-center">
            <span className="font-extrabold text-[10px] tracking-wider text-slate-800 uppercase font-outfit">
              {displayName}
            </span>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
              {badgeText}
            </span>
          </div>

          {/* 5x5 Grid representation with a Queen */}
          <div className="grid grid-cols-5 gap-0.5 w-24 h-24 my-0.5 border border-purple-100 rounded-lg overflow-hidden shadow-sm">
            {Array.from({ length: 5 }).map((_, rIdx) => {
              return Array.from({ length: 5 }).map((_, cIdx) => {
                const isDark = (rIdx + cIdx) % 2 === 1;
                const hasQueen = rIdx === 1 && cIdx === 3;
                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`flex items-center justify-center ${
                      isDark ? 'bg-purple-100' : 'bg-purple-50'
                    }`}
                  >
                    {hasQueen && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-purple-700">
                        <path d="M2 18h20v2H2zm2-2h16l-2-7-3 4-3-8-3 8-3-4z" />
                      </svg>
                    )}
                  </div>
                );
              });
            })}
          </div>

          <div className="flex justify-between items-center border-t border-slate-100 pt-2 text-[9px] text-slate-500 font-bold">
            <span>{solvedText}</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span className="text-emerald-600 font-extrabold" title={isSpanish ? "Gemas instantáneas" : "Instant gems"}>
                +15
              </span>
              <div className="flex items-center gap-0.5 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-md text-[8px] font-black shadow-sm">
                <span>+{tempPoints}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleInfoClick();
                  }}
                  className="p-0.5 hover:bg-amber-100/50 rounded-full transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Info size={9} className="stroke-[3]" />
                </button>
              </div>
              <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">
                {isSpanish ? 'PTOS' : 'PTS'}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Graceful fallback for unrecognized JSON structures
    return (
      <div className="p-3 rounded-2xl text-xs font-semibold shadow-sm bg-white text-slate-800">
        {JSON.stringify(parsed)}
      </div>
    );
  };

  return (
    <>
      {renderCard()}
      {showTomorrowModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-xl border border-slate-100 flex flex-col gap-4 text-center transform scale-100 transition-transform">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shadow-inner">
              <Info size={24} className="stroke-[2.5]" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-extrabold text-slate-800 text-sm tracking-wide uppercase font-outfit animate-pulse">
                {isSpanish ? 'Gemas Temporales' : 'Temporary Gems'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {isSpanish 
                  ? 'Estas son las gemas que se te entregarán mañana si terminas en esta posición.' 
                  : 'These are the gems that will be given to you tomorrow if you finish in this position.'}
              </p>
            </div>

            <button
              onClick={handleCloseModal}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs tracking-wider uppercase transition-all shadow-sm cursor-pointer"
            >
              {isSpanish ? 'Entendido' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
