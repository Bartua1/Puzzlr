export interface ParsedScore {
  gameId: string;
  gameName: string;
  score: number;
  maxScore: number;
  puzzleNumber: string;
}

export function parseShareText(text: string): ParsedScore | null {
  const cleanText = text.trim();

  // 1. Daily Word Grid (Wordle-like)
  // Format: Wordle 1,234 4/6 or Wordle 1234 X/6
  const wordleRegex = /(?:Wordle|Daily\s+Word\s+Grid)\s*([\d,]+)\s+([1-6xX])\/6/i;
  const wordleMatch = cleanText.match(wordleRegex);
  if (wordleMatch) {
    const puzzleNumber = wordleMatch[1].replace(/,/g, '');
    const scoreChar = wordleMatch[2].toUpperCase();
    const score = scoreChar === 'X' ? 0 : parseInt(scoreChar, 10);
    return {
      gameId: 'word_grid',
      gameName: 'Daily Word Grid',
      score: score === 0 ? 0 : 7 - score, // 6 attempts left = 6 pts, 1 attempt left = 1 pt, failed = 0 pts
      maxScore: 6,
      puzzleNumber,
    };
  }

  // 2. Group Categorization Game (Connections-like)
  // Format: Connections Puzzle #123 (or similar)
  const connectionsRegex = /(?:Connections|Group\s+Categorization\s+Game)\s*(?:Puzzle\s*)?#?([\d,]+)/i;
  const connectionsMatch = cleanText.match(connectionsRegex);
  if (connectionsMatch) {
    const puzzleNumber = connectionsMatch[1].replace(/,/g, '');
    // Count how many categories were correctly solved.
    // In Connections, each successful category has a row of 4 of the same colored square emoji.
    // Colors: 🟨 (yellow), 🟩 (green), 🟦 (blue), 🟪 (purple)
    const lines = cleanText.split('\n');
    let correctGroups = 0;
    
    // Check for 4 of the same emoji in a line
    const colorEmojis = ['🟨', '🟩', '🟦', '🟪'];
    for (const line of lines) {
      for (const emoji of colorEmojis) {
        const regex = new RegExp(`${emoji}{4}`, 'u');
        if (regex.test(line.replace(/\s+/g, ''))) {
          correctGroups++;
          break;
        }
      }
    }
    
    // Fallback if no emojis matched but text was recognized
    if (correctGroups === 0) {
      // If we couldn't count emojis, maybe they solved some? Let's check emojis count.
      const emojiMatch = cleanText.match(/[🟨🟩🟦🟪]/gu);
      if (emojiMatch && emojiMatch.length > 0) {
        correctGroups = Math.min(4, Math.floor(emojiMatch.length / 4));
      } else {
        correctGroups = 4; // Fallback default
      }
    }

    return {
      gameId: 'word_group',
      gameName: 'Group Categorization Game',
      score: correctGroups,
      maxScore: 4,
      puzzleNumber,
    };
  }

  // 3. Queen's Grid (Queens-like)
  // Format: Queens #45 (solved in 1:23) or Queens #45
  const queensRegex = /(?:Queens|Queen's\s+Grid|Queens\s+Grid|Chess\s+Puzzle)\s*#?([\d,]+)(?:\s*-\s*(\d+):(\d+))?/i;
  const queensMatch = cleanText.match(queensRegex);
  if (queensMatch) {
    const puzzleNumber = queensMatch[1].replace(/,/g, '');
    let score = 10; // Default solve score
    
    // If time is parsed (min:sec), let's calculate a score where faster is better
    if (queensMatch[2] && queensMatch[3]) {
      const minutes = parseInt(queensMatch[2], 10);
      const seconds = parseInt(queensMatch[3], 10);
      const totalSeconds = minutes * 60 + seconds;
      // Let's say max score is 100, and we subtract seconds (minimum score 10)
      score = Math.max(10, 100 - Math.floor(totalSeconds / 10));
    }

    return {
      gameId: 'chess_grid',
      gameName: "Queen's Grid",
      score,
      maxScore: 100,
      puzzleNumber,
    };
  }

  return null;
}
