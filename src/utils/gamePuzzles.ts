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

// ==========================================
// 4. CODING QUIZ & TECHNICAL TRIVIA (SLIDE 4 SPEC)
// ==========================================
export interface CodingQuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  category: "Frontend" | "System Design" | "Algorithms" | "Cloud & DevOps" | "Executive Tech";
  options: string[];
  correctIndex: number;
  explanation: string;
  xpPoints: number;
}

export interface DailyCodingQuizPuzzle {
  dayDate: string;
  level: number;
  questions: CodingQuizQuestion[];
}

const CODING_QUIZ_POOL: Omit<CodingQuizQuestion, "id">[] = [
  {
    category: "Frontend",
    question: "In React 18/19, what is the primary benefit of automatic batching with createRoot?",
    codeSnippet: `// Inside setTimeout:\nsetCount(c => c + 1);\nsetFlag(f => !f);\n// How many re-renders happen?`,
    options: [
      "Updates inside timeouts, promises & event handlers are batched into a single re-render",
      "Components never re-render unless explicitly triggered by useSyncExternalStore",
      "Batching only applies to synchronous React event handlers",
      "State mutations become completely synchronous and bypass the virtual DOM"
    ],
    correctIndex: 0,
    explanation: "React 18 automatic batching groups multiple state updates (even inside promises, timeouts, and native event handlers) into a single re-render for superior rendering performance.",
    xpPoints: 100,
  },
  {
    category: "System Design",
    question: "When designing high-throughput distributed caching, what algorithm best balances cache servers when adding or removing nodes?",
    options: [
      "Consistent Hashing with virtual v-nodes",
      "Modulo-N simple hashing (hash(key) % N)",
      "Round-Robin deterministic dispatch",
      "Two-Phase Commit distributed consensus"
    ],
    correctIndex: 0,
    explanation: "Consistent Hashing with virtual nodes ensures that when nodes scale up or down, only k/N keys need remapping rather than the entire cluster, avoiding cache thundering herds.",
    xpPoints: 125,
  },
  {
    category: "Algorithms",
    question: "What is the average and worst-case time complexity of quickselect for finding the k-th smallest element?",
    options: [
      "Average O(N), Worst-case O(N²)",
      "Average O(N log N), Worst-case O(N log N)",
      "Average O(log N), Worst-case O(N)",
      "Average O(1), Worst-case O(N)"
    ],
    correctIndex: 0,
    explanation: "Quickselect halves the problem size on each partition on average: N + N/2 + N/4 + ... = O(2N) = O(N). If pivot selection is consistently adversarial, it degrades to O(N²).",
    xpPoints: 150,
  },
  {
    category: "Cloud & DevOps",
    question: "In Kubernetes container lifecycle, which probe determines if traffic should be routed to a pod without restarting it?",
    options: [
      "Readiness Probe",
      "Liveness Probe",
      "Startup Probe",
      "Eviction Probe"
    ],
    correctIndex: 0,
    explanation: "Readiness probes detect when a pod is temporarily unable to serve traffic. If it fails, Kubernetes removes the pod's IP from Service endpoints without killing the container.",
    xpPoints: 100,
  },
  {
    category: "Executive Tech",
    question: "What metric in the DORA DevOps framework measures the elapsed time from code committed to code successfully running in production?",
    options: [
      "Lead Time for Changes",
      "Deployment Frequency",
      "Mean Time to Recovery (MTTR)",
      "Change Failure Rate"
    ],
    correctIndex: 0,
    explanation: "Lead Time for Changes is the canonical DORA metric quantifying engineering velocity from git commit to verified live production release.",
    xpPoints: 125,
  },
  {
    category: "Frontend",
    question: "What does the CSS property 'content-visibility: auto' achieve for long web pages?",
    options: [
      "Skips rendering & layout work for off-screen DOM nodes until they approach the viewport",
      "Hides all images when the user switches browser tabs",
      "Forces hardware acceleration via GPU rasterization on all text elements",
      "Automatically applies dark mode contrast filters to overflowing containers"
    ],
    correctIndex: 0,
    explanation: "content-visibility: auto tells the browser rendering engine to skip layout and painting for elements that are offscreen, drastically accelerating initial page load and TBT.",
    xpPoints: 100,
  },
  {
    category: "System Design",
    question: "In event-driven architectures, what pattern prevents dual-write anomalies between database updates and message broker publishes?",
    options: [
      "Transactional Outbox Pattern",
      "Write-Through Cache Pattern",
      "Compensating Transaction Saga",
      "Optimistic Locking with eTag"
    ],
    correctIndex: 0,
    explanation: "The Transactional Outbox pattern writes domain entities and outgoing event records into the same ACID database transaction, ensuring guaranteed publish semantics via CDC or polling.",
    xpPoints: 150,
  },
];

export function generateDailyCodingQuiz(dateStr: string): DailyCodingQuizPuzzle {
  const seed = getSeedFromDate(dateStr, "quiz");
  const rand = seededRandom(seed);
  const dayOfWeek = new Date(dateStr).getDay();
  const level = ((dayOfWeek + 6) % 7) + 1;

  const shuffled = [...CODING_QUIZ_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, 4);
  const questions: CodingQuizQuestion[] = selected.map((q, idx) => ({
    ...q,
    id: `quiz_${dateStr}_${idx}`,
  }));

  return {
    dayDate: dateStr,
    level,
    questions,
  };
}

// ==========================================
// 5. DAILY LEXICON WORDLE (SLIDE 4 SPEC)
// ==========================================
export interface DailyWordlePuzzle {
  dayDate: string;
  level: number;
  targetWord: string; // 5-letter word
  categoryHint: string;
  definition: string;
}

const WORDLE_CAREER_LEXICON: { word: string; category: string; definition: string }[] = [
  { word: "REACT", category: "Frontend Framework", definition: "Declarative component-driven UI library created by Meta." },
  { word: "CLOUD", category: "Infrastructure", definition: "Elastic on-demand computing resources, storage, and serverless runtimes." },
  { word: "AGILE", category: "Project Methodology", definition: "Iterative sprint delivery emphasizing rapid feedback and continuous integration." },
  { word: "STACK", category: "Computer Science", definition: "LIFO data structure fundamental to call stacks, memory, and DFS algorithms." },
  { word: "BUILD", category: "CI/CD & DevOps", definition: "Compiling, bundling, and validating source code into production deployables." },
  { word: "LOGIC", category: "Cognitive Aptitude", definition: "Systematic principles of valid reasoning, Boolean algebra, and algorithms." },
  { word: "CACHE", category: "Performance Engineering", definition: "High-speed data storage layer storing copies of transient computational results." },
  { word: "SCALE", category: "System Architecture", definition: "The ability of a distributed system to handle exponential user workload growth." },
  { word: "QUERY", category: "Database Engineering", definition: "Formal question or extraction request sent to a SQL or NoSQL database." },
  { word: "MERGE", category: "Version Control", definition: "Integrating branch commit histories together in Git without merge conflict." },
  { word: "ASYNC", category: "Concurrent Computing", definition: "Non-blocking execution pattern permitting concurrent I/O operations." },
  { word: "TOKEN", category: "Security & AI", definition: "Atomic unit of authentication (JWT) or sub-word unit processed by LLMs." },
];

export function generateDailyWordle(dateStr: string): DailyWordlePuzzle {
  const seed = getSeedFromDate(dateStr, "wordle");
  const rand = seededRandom(seed);
  const index = Math.floor(rand() * WORDLE_CAREER_LEXICON.length);
  const item = WORDLE_CAREER_LEXICON[index];

  return {
    dayDate: dateStr,
    level: 1,
    targetWord: item.word,
    categoryHint: item.category,
    definition: item.definition,
  };
}

