// Seeded deterministic puzzle generation utilities for Daily Skill Arena
// Ensures all players worldwide on the same date get the exact same puzzles for fair leaderboard competition!

export function getTodayDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayNumber(dateStr: string): number {
  const d = new Date(dateStr);
  const startOfYear = new Date(d.getFullYear(), 0, 0);
  const diff = d.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Seeded pseudorandom number generator (LCG)
export function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function getSeedFromDate(dateStr: string, salt: string = ""): number {
  let hash = 0;
  const str = dateStr + salt;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// ==========================================
// 1. SUDOKU GENERATOR & SOLVER
// ==========================================
export type SudokuGrid = (number | null)[][];

const BASE_BOARDS: number[][][] = [
  [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ],
  [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [4, 5, 6, 7, 8, 9, 1, 2, 3],
    [7, 8, 9, 1, 2, 3, 4, 5, 6],
    [2, 3, 1, 5, 6, 4, 8, 9, 7],
    [5, 6, 4, 8, 9, 7, 2, 3, 1],
    [8, 9, 7, 2, 3, 1, 5, 6, 4],
    [3, 1, 2, 6, 4, 5, 9, 7, 8],
    [6, 4, 5, 9, 7, 8, 3, 1, 2],
    [9, 7, 8, 3, 1, 2, 6, 4, 5],
  ],
  [
    [8, 2, 7, 1, 5, 4, 3, 9, 6],
    [9, 6, 5, 3, 2, 7, 1, 4, 8],
    [3, 4, 1, 6, 8, 9, 7, 5, 2],
    [5, 9, 3, 4, 6, 8, 2, 7, 1],
    [4, 7, 2, 5, 1, 3, 6, 8, 9],
    [6, 1, 8, 9, 7, 2, 4, 3, 5],
    [7, 8, 6, 2, 3, 5, 9, 1, 4],
    [1, 5, 4, 7, 9, 6, 8, 2, 3],
    [2, 3, 9, 8, 4, 1, 5, 6, 7],
  ],
];

export interface DailySudokuPuzzle {
  dayDate: string;
  level: number;
  initialGrid: SudokuGrid;
  solutionGrid: number[][];
  cluesCount: number;
}

export function generateDailySudoku(dateStr: string): DailySudokuPuzzle {
  const seed = getSeedFromDate(dateStr, "sudoku");
  const rand = seededRandom(seed);
  const dayNum = getDayNumber(dateStr);
  
  // Level increases with day of week / day progression (Level 1 to 7)
  const dayOfWeek = new Date(dateStr).getDay(); // 0 is Sun, 1 is Mon...
  const level = ((dayOfWeek + 6) % 7) + 1; // 1 = Monday (Easy), 7 = Sunday (Master)
  
  // Clues count: Level 1 has ~45 clues, Level 7 has ~30 clues
  const cluesCount = Math.max(30, 48 - (level * 2.5) | 0);

  // Pick a base board
  const baseIndex = Math.floor(rand() * BASE_BOARDS.length);
  const base = BASE_BOARDS[baseIndex];

  // Permute digits with random map
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  const digitMap: Record<number, number> = {};
  for (let i = 0; i < 9; i++) {
    digitMap[i + 1] = digits[i];
  }

  // Create solution grid
  const solution: number[][] = Array(9)
    .fill(0)
    .map((_, r) =>
      Array(9)
        .fill(0)
        .map((_, c) => digitMap[base[r][c]])
    );

  // Create puzzle by hiding cells
  const initial: SudokuGrid = solution.map(row => [...row]);
  const cellsToRemove = 81 - cluesCount;

  // List all 81 coordinates
  const coords: [number, number][] = [];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      coords.push([r, c]);
    }
  }

  // Shuffle coords
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }

  for (let i = 0; i < cellsToRemove; i++) {
    const [r, c] = coords[i];
    initial[r][c] = null;
  }

  return {
    dayDate: dateStr,
    level,
    initialGrid: initial,
    solutionGrid: solution,
    cluesCount,
  };
}

// ==========================================
// 2. WORD MATRIX / LEXICROSS PUZZLE
// ==========================================
export interface WordMatrixQuestion {
  targetWord: string;
  scrambled: string[];
  clue: string;
  category: string;
  points: number;
}

export interface DailyWordMatrixPuzzle {
  dayDate: string;
  level: number;
  questions: WordMatrixQuestion[];
  totalQuestions: number;
}

const APTITUDE_WORDS: { word: string; clue: string; category: string; minLevel: number }[] = [
  { word: "LEADER", clue: "A person who guides or inspires an organization or team", category: "Management", minLevel: 1 },
  { word: "GROWTH", clue: "The process of developing and expanding in performance", category: "Business", minLevel: 1 },
  { word: "IMPACT", clue: "The measurable effect or influence produced by an action", category: "Career", minLevel: 1 },
  { word: "VISION", clue: "The ability to plan the future with wisdom or strategic imagination", category: "Strategy", minLevel: 1 },
  { word: "METRIC", clue: "A standard of quantitative measurement used for tracking KPIs", category: "Analytics", minLevel: 2 },
  { word: "PYTHON", clue: "Popular versatile programming language known for readable syntax", category: "Engineering", minLevel: 2 },
  { word: "DOMAIN", clue: "A specified sphere of knowledge, territory, or online identity", category: "Technology", minLevel: 2 },
  { word: "MATRIX", clue: "A rectangular array of elements or an environment in which something develops", category: "Logic", minLevel: 2 },
  { word: "TALENT", clue: "Natural aptitude or skill in a specialized field", category: "HR", minLevel: 2 },
  { word: "SYNERGY", clue: "Combined interaction producing greater total effect than separate sum", category: "Collaboration", minLevel: 3 },
  { word: "INNOVATE", clue: "Introduce new methods, ideas, or products into a market", category: "Leadership", minLevel: 3 },
  { word: "DYNAMIC", clue: "Characterized by constant change, activity, or high energy", category: "Aptitude", minLevel: 3 },
  { word: "OPTIMAL", clue: "Best or most favorable point, degree, or condition", category: "Engineering", minLevel: 3 },
  { word: "STRATEGY", clue: "A plan of action designed to achieve a major long-term overall aim", category: "Executive", minLevel: 4 },
  { word: "ALGORITHM", clue: "Step-by-step procedure for solving a problem or computing tasks", category: "Computer Science", minLevel: 4 },
  { word: "RESILIENCE", clue: "The capacity to recover quickly from difficulties or setbacks", category: "Soft Skills", minLevel: 5 },
  { word: "COGNITIVE", clue: "Relating to the mental action of acquiring knowledge through thought", category: "Intelligence", minLevel: 5 },
  { word: "EXCELLENCE", clue: "The quality of being outstanding or extremely high in merit", category: "Performance", minLevel: 6 },
  { word: "BENCHMARK", clue: "A standard point of reference against which things can be evaluated", category: "Analytics", minLevel: 6 },
  { word: "INQUISITIVE", clue: "Curious and eager for knowledge, probing for deeper truth", category: "Mindset", minLevel: 7 },
];

export function generateDailyWordMatrix(dateStr: string): DailyWordMatrixPuzzle {
  const seed = getSeedFromDate(dateStr, "word");
  const rand = seededRandom(seed);
  const dayOfWeek = new Date(dateStr).getDay();
  const level = ((dayOfWeek + 6) % 7) + 1; // 1 to 7

  // Filter pool matching level constraint
  const pool = APTITUDE_WORDS.filter(w => w.minLevel <= Math.max(2, level));
  
  // Pick 4 words for daily challenge
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, 4);
  const questions: WordMatrixQuestion[] = selected.map((item) => {
    const letters = item.word.split("");
    // Scramble letters
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    // Make sure not identical to word
    if (letters.join("") === item.word && letters.length > 2) {
      [letters[0], letters[1]] = [letters[1], letters[0]];
    }
    return {
      targetWord: item.word,
      scrambled: letters,
      clue: item.clue,
      category: item.category,
      points: item.word.length * 100 * level,
    };
  });

  return {
    dayDate: dateStr,
    level,
    questions,
    totalQuestions: questions.length,
  };
}

// ==========================================
// 3. MATH CRUNCH / TARGET MATRIX PUZZLE
// ==========================================
export interface MathCrunchProblem {
  id: string;
  numbers: number[];
  target: number;
  cluePrompt: string;
  level: number;
  points: number;
}

export interface DailyMathCrunchPuzzle {
  dayDate: string;
  level: number;
  problems: MathCrunchProblem[];
}

const MATH_TEMPLATES: { numbers: number[]; target: number; prompt: string; level: number }[] = [
  { numbers: [3, 8, 3, 8], target: 24, prompt: "Reach 24 using: 8 / (1 - 2/3) or arithmetic combinations", level: 1 },
  { numbers: [4, 6, 8, 2], target: 24, prompt: "Reach 24: e.g. (8 - 2) * 4 = 24 or (4 + 8) * 2", level: 1 },
  { numbers: [5, 5, 5, 1], target: 24, prompt: "Reach 24: e.g. 5 * (5 - 1/5) = 24", level: 2 },
  { numbers: [1, 2, 3, 4], target: 24, prompt: "Reach 24: e.g. 1 * 2 * 3 * 4 = 24", level: 2 },
  { numbers: [3, 3, 8, 8], target: 24, prompt: "Classic 24: 8 / (3 - 8/3) = 24", level: 3 },
  { numbers: [7, 3, 4, 6], target: 50, prompt: "Reach target sum: 50 using (+, -, *, /)", level: 3 },
  { numbers: [9, 6, 4, 2], target: 36, prompt: "Reach target: 36 using all 4 digits", level: 4 },
  { numbers: [12, 4, 3, 2], target: 48, prompt: "Reach target: 48 using all numbers", level: 4 },
  { numbers: [15, 5, 8, 2], target: 56, prompt: "Reach target: 56 with order of operations", level: 5 },
  { numbers: [16, 4, 9, 3], target: 75, prompt: "Reach target: 75 using multi-step arithmetic", level: 6 },
  { numbers: [25, 5, 4, 2], target: 100, prompt: "Master Crunch: Reach 100 using all 4 numbers", level: 7 },
];

export function generateDailyMathCrunch(dateStr: string): DailyMathCrunchPuzzle {
  const seed = getSeedFromDate(dateStr, "math");
  const rand = seededRandom(seed);
  const dayOfWeek = new Date(dateStr).getDay();
  const level = ((dayOfWeek + 6) % 7) + 1; // 1 to 7

  const pool = MATH_TEMPLATES.filter(p => p.level <= Math.max(2, level));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, 3);
  const problems: MathCrunchProblem[] = selected.map((p, idx) => ({
    id: `math_${dateStr}_${idx}`,
    numbers: p.numbers,
    target: p.target,
    cluePrompt: p.prompt,
    level,
    points: 250 * level,
  }));

  return {
    dayDate: dateStr,
    level,
    problems,
  };
}
