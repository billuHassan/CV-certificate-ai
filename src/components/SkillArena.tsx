import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Trophy, Flame, Clock, Award, Play, RotateCcw, CheckCircle, HelpCircle,
  Zap, Brain, Calendar, ChevronRight, ChevronLeft, ArrowRight, Star,
  Crown, Sparkles, Hash, BookOpen, Calculator, Volume2, VolumeX,
  Share2, ShieldCheck, RefreshCw, Layers, Check, X, Filter, BarChart3,
  Lightbulb, AlertTriangle, Users, Code, Send
} from "lucide-react";
import { UserSession, GameType, GameScore, UserGameProfile } from "../types";
import { ThemeDefinition } from "./Settings";
import { db, handleFirestoreError, OperationType, auth } from "../lib/firebase";
import {
  collection, doc, setDoc, getDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp
} from "firebase/firestore";
import {
  getTodayDateString, generateDailySudoku, generateDailyWordMatrix,
  generateDailyMathCrunch, generateDailyCodingQuiz, generateDailyWordle,
  DailySudokuPuzzle, DailyWordMatrixPuzzle, DailyMathCrunchPuzzle,
  DailyCodingQuizPuzzle, DailyWordlePuzzle, SudokuGrid
} from "../utils/gamePuzzles";

interface SkillArenaProps {
  user: UserSession;
  theme?: ThemeDefinition;
  onBackToDashboard?: () => void;
  onUpgrade?: () => void;
}

export default function SkillArena({ user, theme, onBackToDashboard }: SkillArenaProps) {
  const [activeTab, setActiveTab] = useState<"games" | "leaderboard" | "profile">("games");
  const [selectedGame, setSelectedGame] = useState<GameType>("sudoku");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  
  // Game running state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<any>(null);
  const [gameCompleted, setGameCompleted] = useState<boolean>(false);
  const [victoryModalOpen, setVictoryModalOpen] = useState<boolean>(false);
  const [lastWonScore, setLastWonScore] = useState<number>(0);
  const [lastWonTime, setLastWonTime] = useState<number>(0);

  // Global Leaderboard & User Profile
  const [leaderboardScores, setLeaderboardScores] = useState<GameScore[]>([]);
  const [leaderboardTab, setLeaderboardTab] = useState<"today" | "all-time">("today");
  const [leaderboardFilter, setLeaderboardFilter] = useState<"all" | GameType>("all");
  const [userProfile, setUserProfile] = useState<UserGameProfile>({
    userId: user.uid || "anon",
    currentStreak: 1,
    longestStreak: 1,
    lastPlayedDate: getTodayDateString(),
    totalGamesSolved: 0,
    bestSudokuTime: undefined,
    bestWordTime: undefined,
    bestMathTime: undefined,
  });
  const [isLoadingScores, setIsLoadingScores] = useState<boolean>(true);

  // ==========================================
  // 1. SUDOKU STATE
  // ==========================================
  const dailySudokuPuzzle = useMemo(() => generateDailySudoku(selectedDate), [selectedDate]);
  const [sudokuBoard, setSudokuBoard] = useState<SudokuGrid>(() => dailySudokuPuzzle.initialGrid.map(r => [...r]));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [notesMode, setNotesMode] = useState<boolean>(false);
  const [cellNotes, setCellNotes] = useState<Record<string, number[]>>({});
  const [sudokuMistakes, setSudokuMistakes] = useState<number>(0);
  const [sudokuHistory, setSudokuHistory] = useState<SudokuGrid[]>([]);

  // ==========================================
  // 2. WORD MATRIX STATE
  // ==========================================
  const dailyWordPuzzle = useMemo(() => generateDailyWordMatrix(selectedDate), [selectedDate]);
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0);
  const [assembledWord, setAssembledWord] = useState<string[]>([]);
  const [wordLettersAvailable, setWordLettersAvailable] = useState<string[]>([]);
  const [wordsCompletedCount, setWordsCompletedCount] = useState<number>(0);
  const [wordFeedback, setWordFeedback] = useState<"idle" | "success" | "error">("idle");

  // ==========================================
  // 3. MATH CRUNCH STATE
  // ==========================================
  const dailyMathPuzzle = useMemo(() => generateDailyMathCrunch(selectedDate), [selectedDate]);
  const [currentMathIdx, setCurrentMathIdx] = useState<number>(0);
  const [mathExpression, setMathExpression] = useState<string>("");
  const [mathUsedIndices, setMathUsedIndices] = useState<number[]>([]);
  const [mathProblemsCompleted, setMathProblemsCompleted] = useState<number>(0);
  const [mathFeedback, setMathFeedback] = useState<string | null>(null);

  // ==========================================
  // 4. CODING QUIZ STATE (SLIDESHOW DESIGNATED)
  // ==========================================
  const dailyCodingQuiz = useMemo(() => generateDailyCodingQuiz(selectedDate), [selectedDate]);
  const [currentQuizIdx, setCurrentQuizIdx] = useState<number>(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizAnswerSubmitted, setQuizAnswerSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCompletedQuestions, setQuizCompletedQuestions] = useState<number>(0);

  // ==========================================
  // 5. DAILY LEXICON WORDLE STATE (SLIDESHOW DESIGNATED)
  // ==========================================
  const dailyWordle = useMemo(() => generateDailyWordle(selectedDate), [selectedDate]);
  const [wordleGuesses, setWordleGuesses] = useState<string[]>([]);
  const [currentWordleInput, setCurrentWordleInput] = useState<string>("");
  const [wordleGameOver, setWordleGameOver] = useState<boolean>(false);
  const [wordleWon, setWordleWon] = useState<boolean>(false);
  const [wordleHintRevealed, setWordleHintRevealed] = useState<boolean>(false);

  // ==========================================
  // TIMER HOOK
  // ==========================================
  useEffect(() => {
    let interval: any = null;
    if (isPlaying && !gameCompleted) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, gameCompleted]);

  // Reset games when puzzle or selected date changes
  useEffect(() => {
    resetCurrentGame();
  }, [selectedDate, selectedGame]);

  const resetCurrentGame = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    setGameCompleted(false);

    if (selectedGame === "sudoku") {
      setSudokuBoard(dailySudokuPuzzle.initialGrid.map(r => [...r]));
      setSelectedCell(null);
      setCellNotes({});
      setSudokuMistakes(0);
      setSudokuHistory([]);
    } else if (selectedGame === "word_matrix") {
      setCurrentWordIdx(0);
      setWordsCompletedCount(0);
      setAssembledWord([]);
      setWordFeedback("idle");
      if (dailyWordPuzzle.questions[0]) {
        setWordLettersAvailable([...dailyWordPuzzle.questions[0].scrambled]);
      }
    } else if (selectedGame === "math_crunch") {
      setCurrentMathIdx(0);
      setMathProblemsCompleted(0);
      setMathExpression("");
      setMathUsedIndices([]);
      setMathFeedback(null);
    } else if (selectedGame === "coding_quiz") {
      setCurrentQuizIdx(0);
      setSelectedQuizOption(null);
      setQuizAnswerSubmitted(false);
      setQuizScore(0);
      setQuizCompletedQuestions(0);
    } else if (selectedGame === "daily_wordle") {
      setWordleGuesses([]);
      setCurrentWordleInput("");
      setWordleGameOver(false);
      setWordleWon(false);
      setWordleHintRevealed(false);
    }
  };

  // Sync available letters when word index changes
  useEffect(() => {
    if (dailyWordPuzzle.questions[currentWordIdx]) {
      setWordLettersAvailable([...dailyWordPuzzle.questions[currentWordIdx].scrambled]);
      setAssembledWord([]);
      setWordFeedback("idle");
    }
  }, [currentWordIdx, dailyWordPuzzle]);

  // ==========================================
  // FIRESTORE LEADERBOARD & PROFILE SYNC
  // ==========================================
  useEffect(() => {
    if (!user) return;
    setIsLoadingScores(true);

    // 1. Fetch user game profile & streaks
    const profileRef = doc(db, "users", user.uid || "anon", "game_profile", "default");
    getDoc(profileRef).then((snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data() as UserGameProfile);
      } else {
        // Load fallback from localStorage
        const local = localStorage.getItem(`cvcraft_game_profile_${user.uid}`);
        if (local) {
          try {
            setUserProfile(JSON.parse(local));
          } catch {}
        }
      }
    }).catch((err) => {
      console.warn("Could not fetch game profile:", err);
    });

    // 2. Real-time Leaderboard query
    const scoresCol = collection(db, "game_scores");
    const q = query(scoresCol, orderBy("score", "desc"), limit(100));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const scores: GameScore[] = [];
        snapshot.forEach((d) => {
          scores.push(d.data() as GameScore);
        });
        setLeaderboardScores(scores);
        setIsLoadingScores(false);
      },
      (error) => {
        console.warn("Real-time leaderboard listener:", error);
        // Fallback local simulated high scores
        setLeaderboardScores(getLocalSimulatedLeaderboard());
        setIsLoadingScores(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  function getLocalSimulatedLeaderboard(): GameScore[] {
    const today = getTodayDateString();
    return [
      { id: "s1", gameType: "sudoku", userId: "u1", userName: "Marcus Vance", profilePhoto: "", timeSeconds: 142, score: 9850, level: 3, dayDate: today, completedAt: new Date().toISOString() },
      { id: "s2", gameType: "word_matrix", userId: "u2", userName: "Elena Rostova", profilePhoto: "", timeSeconds: 85, score: 9400, level: 3, dayDate: today, completedAt: new Date().toISOString() },
      { id: "s3", gameType: "math_crunch", userId: "u3", userName: "David Chen", profilePhoto: "", timeSeconds: 110, score: 9150, level: 3, dayDate: today, completedAt: new Date().toISOString() },
      { id: "s4", gameType: "sudoku", userId: user.uid || "self", userName: user.displayName, profilePhoto: user.profilePhoto, timeSeconds: 210, score: 8600, level: 3, dayDate: today, completedAt: new Date().toISOString() },
      { id: "s5", gameType: "math_crunch", userId: "u4", userName: "Sarah Jenkins", profilePhoto: "", timeSeconds: 160, score: 8200, level: 3, dayDate: today, completedAt: new Date().toISOString() },
    ];
  }

  // ==========================================
  // GAME COMPLETION & SCORE RECORDING
  // ==========================================
  const handleGameVictory = async (calculatedScore: number) => {
    setIsPlaying(false);
    setGameCompleted(true);
    setLastWonScore(calculatedScore);
    setLastWonTime(elapsedSeconds);
    setVictoryModalOpen(true);

    const todayStr = getTodayDateString();
    const scoreId = `score_${user.uid || "anon"}_${selectedGame}_${selectedDate}_${Date.now()}`;

    const newScoreItem: GameScore = {
      id: scoreId,
      gameType: selectedGame,
      userId: user.uid || "anon",
      userName: user.displayName || "Master Solver",
      userEmail: user.email,
      profilePhoto: user.profilePhoto || "",
      timeSeconds: elapsedSeconds,
      score: calculatedScore,
      level: selectedGame === "sudoku" ? dailySudokuPuzzle.level : selectedGame === "word_matrix" ? dailyWordPuzzle.level : dailyMathPuzzle.level,
      dayDate: selectedDate,
      completedAt: new Date().toISOString(),
    };

    // Calculate updated streaks
    let newStreak = userProfile.currentStreak || 1;
    const lastDate = userProfile.lastPlayedDate;
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yestStr = getTodayDateString(yesterday);
      if (lastDate === yestStr) {
        newStreak += 1;
      } else if (lastDate === todayStr) {
        // same day play, keep streak
      } else {
        newStreak = 1;
      }
    }

    const updatedProfile: UserGameProfile = {
      userId: user.uid || "anon",
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, userProfile.longestStreak || 1),
      lastPlayedDate: todayStr,
      totalGamesSolved: (userProfile.totalGamesSolved || 0) + 1,
      bestSudokuTime: selectedGame === "sudoku" 
        ? Math.min(elapsedSeconds, userProfile.bestSudokuTime || 99999) 
        : userProfile.bestSudokuTime,
      bestWordTime: selectedGame === "word_matrix" 
        ? Math.min(elapsedSeconds, userProfile.bestWordTime || 99999) 
        : userProfile.bestWordTime,
      bestMathTime: selectedGame === "math_crunch" 
        ? Math.min(elapsedSeconds, userProfile.bestMathTime || 99999) 
        : userProfile.bestMathTime,
      updatedAt: new Date().toISOString(),
    };

    setUserProfile(updatedProfile);
    localStorage.setItem(`cvcraft_game_profile_${user.uid}`, JSON.stringify(updatedProfile));

    // Save to Firestore
    try {
      if (user.uid && auth.currentUser) {
        // 1. Save score
        await setDoc(doc(db, "game_scores", scoreId), newScoreItem);
        // 2. Save profile
        await setDoc(doc(db, "users", user.uid, "game_profile", "default"), updatedProfile);
      }
    } catch (e) {
      console.warn("Could not save score to Firestore, stored locally:", e);
    }
  };

  // ==========================================
  // SUDOKU LOGIC HANDLERS
  // ==========================================
  const handleSudokuCellClick = (r: number, c: number) => {
    if (!isPlaying && !gameCompleted) {
      setIsPlaying(true);
    }
    // Only select if not initial fixed clue
    if (dailySudokuPuzzle.initialGrid[r][c] === null) {
      setSelectedCell([r, c]);
    } else {
      setSelectedCell([r, c]);
    }
  };

  const handleSudokuInputNumber = (num: number) => {
    if (!selectedCell) return;
    if (!isPlaying) setIsPlaying(true);
    const [r, c] = selectedCell;
    if (dailySudokuPuzzle.initialGrid[r][c] !== null) return; // cannot overwrite fixed

    if (notesMode) {
      // Toggle note
      const key = `${r}_${c}`;
      const current = cellNotes[key] || [];
      const updated = current.includes(num) ? current.filter(x => x !== num) : [...current, num].sort();
      setCellNotes({ ...cellNotes, [key]: updated });
      return;
    }

    // Save history for undo
    setSudokuHistory(prev => [...prev, sudokuBoard.map(row => [...row])]);

    const newBoard = sudokuBoard.map(row => [...row]);
    newBoard[r][c] = num;
    setSudokuBoard(newBoard);

    // Check correctness
    if (num !== dailySudokuPuzzle.solutionGrid[r][c]) {
      setSudokuMistakes(prev => prev + 1);
    } else {
      // Check full victory condition
      let complete = true;
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (newBoard[i][j] !== dailySudokuPuzzle.solutionGrid[i][j]) {
            complete = false;
            break;
          }
        }
      }
      if (complete) {
        const baseScore = 10000;
        const timePenalty = Math.min(5000, elapsedSeconds * 10);
        const mistakePenalty = sudokuMistakes * 300;
        const levelBonus = dailySudokuPuzzle.level * 1000;
        const finalScore = Math.max(1000, baseScore + levelBonus - timePenalty - mistakePenalty);
        handleGameVictory(finalScore);
      }
    }
  };

  const handleSudokuErase = () => {
    if (!selectedCell) return;
    const [r, c] = selectedCell;
    if (dailySudokuPuzzle.initialGrid[r][c] !== null) return;
    setSudokuHistory(prev => [...prev, sudokuBoard.map(row => [...row])]);
    const newBoard = sudokuBoard.map(row => [...row]);
    newBoard[r][c] = null;
    setSudokuBoard(newBoard);
    const key = `${r}_${c}`;
    const nextNotes = { ...cellNotes };
    delete nextNotes[key];
    setCellNotes(nextNotes);
  };

  const handleSudokuUndo = () => {
    if (sudokuHistory.length === 0) return;
    const previous = sudokuHistory[sudokuHistory.length - 1];
    setSudokuBoard(previous);
    setSudokuHistory(prev => prev.slice(0, prev.length - 1));
  };

  const handleSudokuHint = () => {
    if (!isPlaying) setIsPlaying(true);
    // Find first empty or incorrect cell
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (sudokuBoard[r][c] !== dailySudokuPuzzle.solutionGrid[r][c]) {
          setSelectedCell([r, c]);
          const newBoard = sudokuBoard.map(row => [...row]);
          newBoard[r][c] = dailySudokuPuzzle.solutionGrid[r][c];
          setSudokuBoard(newBoard);
          setElapsedSeconds(prev => prev + 30); // 30s penalty
          return;
        }
      }
    }
  };

  // Keyboard controls for Sudoku
  useEffect(() => {
    if (selectedGame !== "sudoku") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell) return;
      const [r, c] = selectedCell;
      if (e.key >= "1" && e.key <= "9") {
        handleSudokuInputNumber(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleSudokuErase();
      } else if (e.key === "ArrowUp" && r > 0) {
        setSelectedCell([r - 1, c]);
      } else if (e.key === "ArrowDown" && r < 8) {
        setSelectedCell([r + 1, c]);
      } else if (e.key === "ArrowLeft" && c > 0) {
        setSelectedCell([r, c - 1]);
      } else if (e.key === "ArrowRight" && c < 8) {
        setSelectedCell([r, c + 1]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, selectedGame, notesMode, sudokuBoard, cellNotes, isPlaying]);

  // ==========================================
  // WORD MATRIX LOGIC HANDLERS
  // ==========================================
  const handleWordLetterClick = (letter: string, index: number) => {
    if (!isPlaying && !gameCompleted) setIsPlaying(true);
    setAssembledWord(prev => [...prev, letter]);
    const updated = [...wordLettersAvailable];
    updated.splice(index, 1);
    setWordLettersAvailable(updated);
  };

  const handleWordBackspace = () => {
    if (assembledWord.length === 0) return;
    const lastLetter = assembledWord[assembledWord.length - 1];
    setAssembledWord(prev => prev.slice(0, prev.length - 1));
    setWordLettersAvailable(prev => [...prev, lastLetter]);
  };

  const handleWordSubmit = () => {
    const currentQ = dailyWordPuzzle.questions[currentWordIdx];
    if (!currentQ) return;
    const attempt = assembledWord.join("");
    if (attempt.toUpperCase() === currentQ.targetWord.toUpperCase()) {
      setWordFeedback("success");
      const nextCompleted = wordsCompletedCount + 1;
      setWordsCompletedCount(nextCompleted);

      setTimeout(() => {
        if (currentWordIdx + 1 < dailyWordPuzzle.questions.length) {
          setCurrentWordIdx(prev => prev + 1);
        } else {
          // All words solved!
          const base = 8000;
          const timeBonus = Math.max(0, 4000 - elapsedSeconds * 20);
          const levelBonus = dailyWordPuzzle.level * 1200;
          handleGameVictory(base + timeBonus + levelBonus);
        }
      }, 800);
    } else {
      setWordFeedback("error");
      setElapsedSeconds(prev => prev + 15); // penalty
      setTimeout(() => {
        setWordFeedback("idle");
      }, 1000);
    }
  };

  // ==========================================
  // MATH CRUNCH LOGIC HANDLERS
  // ==========================================
  const handleMathNumberClick = (num: number, index: number) => {
    if (!isPlaying && !gameCompleted) setIsPlaying(true);
    if (mathUsedIndices.includes(index)) return;
    setMathExpression(prev => prev + num);
    setMathUsedIndices(prev => [...prev, index]);
  };

  const handleMathOperatorClick = (op: string) => {
    if (!isPlaying && !gameCompleted) setIsPlaying(true);
    setMathExpression(prev => prev + op);
  };

  const handleMathClear = () => {
    setMathExpression("");
    setMathUsedIndices([]);
    setMathFeedback(null);
  };

  const handleMathSubmit = () => {
    const currentProblem = dailyMathPuzzle.problems[currentMathIdx];
    if (!currentProblem) return;

    if (mathUsedIndices.length !== currentProblem.numbers.length) {
      setMathFeedback("Please use all 4 numbers in your calculation!");
      return;
    }

    try {
      // Safe arithmetic evaluator
      // Allow only digits, +, -, *, /, (, ), space
      if (!/^[0-9+\-*/().\s]+$/.test(mathExpression)) {
        setMathFeedback("Invalid arithmetic characters");
        return;
      }
      // eslint-disable-next-line no-eval
      const result = Function(`"use strict"; return (${mathExpression})`)();
      if (Math.abs(result - currentProblem.target) < 0.0001) {
        setMathFeedback("CORRECT! Target reached!");
        const nextSolved = mathProblemsCompleted + 1;
        setMathProblemsCompleted(nextSolved);

        setTimeout(() => {
          if (currentMathIdx + 1 < dailyMathPuzzle.problems.length) {
            setCurrentMathIdx(prev => prev + 1);
            setMathExpression("");
            setMathUsedIndices([]);
            setMathFeedback(null);
          } else {
            // All problems completed
            const base = 9000;
            const timeBonus = Math.max(0, 5000 - elapsedSeconds * 25);
            const levelBonus = dailyMathPuzzle.level * 1500;
            handleGameVictory(base + timeBonus + levelBonus);
          }
        }, 1000);
      } else {
        setMathFeedback(`Result = ${result}. Target is ${currentProblem.target}. Try another combination!`);
        setElapsedSeconds(prev => prev + 20);
      }
    } catch {
      setMathFeedback("Syntax error in calculation expression");
    }
  };

  // ==========================================
  // 4. CODING QUIZ LOGIC HANDLERS (SLIDE 4 SPEC)
  // ==========================================
  const handleSelectQuizOption = (idx: number) => {
    if (quizAnswerSubmitted) return;
    if (!isPlaying && !gameCompleted) setIsPlaying(true);
    setSelectedQuizOption(idx);
  };

  const handleSubmitQuizAnswer = () => {
    if (selectedQuizOption === null || quizAnswerSubmitted) return;
    setQuizAnswerSubmitted(true);
    const currentQ = dailyCodingQuiz.questions[currentQuizIdx];
    if (selectedQuizOption === currentQ.correctIndex) {
      setQuizScore(prev => prev + currentQ.xpPoints);
    } else {
      setElapsedSeconds(prev => prev + 10);
    }
  };

  const handleNextQuizQuestion = () => {
    if (currentQuizIdx < dailyCodingQuiz.questions.length - 1) {
      setCurrentQuizIdx(prev => prev + 1);
      setSelectedQuizOption(null);
      setQuizAnswerSubmitted(false);
    } else {
      // Quiz complete!
      const currentQ = dailyCodingQuiz.questions[currentQuizIdx];
      const finalEarned = quizScore + (selectedQuizOption === currentQ.correctIndex ? currentQ.xpPoints : 0);
      const timeBonus = Math.max(0, 3000 - elapsedSeconds * 15);
      handleGameVictory(finalEarned * 10 + timeBonus);
    }
  };

  // ==========================================
  // 5. DAILY LEXICON WORDLE LOGIC HANDLERS (SLIDE 4 SPEC)
  // ==========================================
  const handleWordleKeyPress = (key: string) => {
    if (wordleGameOver || gameCompleted) return;
    if (!isPlaying && !gameCompleted) setIsPlaying(true);

    if (key === "ENTER") {
      if (currentWordleInput.length !== 5) return;
      const guess = currentWordleInput.toUpperCase();
      const newGuesses = [...wordleGuesses, guess];
      setWordleGuesses(newGuesses);
      setCurrentWordleInput("");

      if (guess === dailyWordle.targetWord) {
        setWordleWon(true);
        setWordleGameOver(true);
        const base = 9000;
        const attemptsBonus = (6 - newGuesses.length) * 1200;
        const timeBonus = Math.max(0, 4000 - elapsedSeconds * 20);
        handleGameVictory(base + attemptsBonus + timeBonus);
      } else if (newGuesses.length >= 6) {
        setWordleGameOver(true);
      }
    } else if (key === "BACKSPACE" || key === "DEL") {
      setCurrentWordleInput(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/i.test(key) && currentWordleInput.length < 5) {
      setCurrentWordleInput(prev => (prev + key).toUpperCase());
    }
  };

  // Helper formatting for time mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Filtered Leaderboard computation
  const filteredLeaderboard = useMemo(() => {
    return leaderboardScores.filter((item) => {
      if (leaderboardTab === "today" && item.dayDate !== selectedDate) return false;
      if (leaderboardFilter !== "all" && item.gameType !== leaderboardFilter) return false;
      return true;
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeSeconds - b.timeSeconds;
    });
  }, [leaderboardScores, leaderboardTab, leaderboardFilter, selectedDate]);

  // Current user's rank in filtered leaderboard
  const userRankIndex = useMemo(() => {
    return filteredLeaderboard.findIndex(s => s.userId === (user.uid || "anon"));
  }, [filteredLeaderboard, user]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 text-slate-100 font-sans pb-16 no-print">

      {onBackToDashboard && (
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition bg-slate-900/90 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-800 cursor-pointer shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display flex items-center gap-2">
                  Daily Cognitive Skills Arena
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">
                    Live Rankings &amp; Streaks
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Sharpen your problem solving, logical deduction & quantitative reasoning for tech & executive careers.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Streaks & Stats Pill */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-950/80 border border-slate-800 p-2 sm:p-3 rounded-2xl shadow-inner">
            <div className="flex items-center gap-2 px-2 border-r border-slate-800">
              <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Daily Streak</span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {userProfile.currentStreak || 1} {userProfile.currentStreak === 1 ? "Day" : "Days"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-2">
              <Trophy className="h-5 w-5 text-indigo-400" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block font-bold">Solved</span>
                <span className="text-sm font-black text-white font-mono">{userProfile.totalGamesSolved || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-6 mt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab("games")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "games"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Play className="h-3.5 w-3.5" /> Skill Games Arena
          </button>
          
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "leaderboard"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Crown className="h-3.5 w-3.5 text-amber-400" /> Top Solvers Leaderboard
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Award className="h-3.5 w-3.5 text-emerald-400" /> Streaks & Records
          </button>

          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="ml-auto text-xs px-3 py-1.5 text-slate-400 hover:text-white transition flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Exit to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GAMES ARENA */}
      {/* ========================================================================= */}
      {activeTab === "games" && (
        <div className="space-y-6">
          
          {/* Designated Service Game Selection Cards (Matching Slide 4 Designation) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Game 1: Coding Quiz & Trivia (Slide 4 Designated) */}
            <button
              onClick={() => setSelectedGame("coding_quiz")}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden group shadow-lg cursor-pointer ${
                selectedGame === "coding_quiz"
                  ? "bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-500 ring-2 ring-indigo-500/30"
                  : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                  <Code className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                  +150 XP
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono tracking-widest text-indigo-400 font-bold uppercase">
                  SLIDESHOW SPEC
                </span>
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition font-display">
                Coding Quiz &amp; Trivia
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                System Design, React, Algorithms &amp; Executive Tech Trivia with explanations.
              </p>
            </button>

            {/* Game 2: Daily Lexicon Wordle (Slide 4 Designated) */}
            <button
              onClick={() => setSelectedGame("daily_wordle")}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden group shadow-lg cursor-pointer ${
                selectedGame === "daily_wordle"
                  ? "bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-500 ring-2 ring-emerald-500/30"
                  : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  +200 XP
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono tracking-widest text-emerald-400 font-bold uppercase">
                  SLIDESHOW SPEC
                </span>
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition font-display">
                Daily Lexicon Wordle
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                5-letter tech &amp; career terminology deduction with color-coded feedback tiles.
              </p>
            </button>

            {/* Game 3: Daily Sudoku Pro */}
            <button
              onClick={() => setSelectedGame("sudoku")}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden group shadow-lg cursor-pointer ${
                selectedGame === "sudoku"
                  ? "bg-gradient-to-br from-purple-950/80 to-slate-900 border-purple-500 ring-2 ring-purple-500/30"
                  : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl">
                  <Hash className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  Day Level {dailySudokuPuzzle.level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono tracking-widest text-purple-400 font-bold uppercase">
                  LOGIC MATRIX
                </span>
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-purple-400 transition font-display">
                Daily Sudoku Pro
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Classic 9x9 logic matrix with progressive daily clue reduction &amp; notes.
              </p>
            </button>

            {/* Game 4: Math Crunch 24 */}
            <button
              onClick={() => setSelectedGame("math_crunch")}
              className={`p-4 rounded-2xl border text-left transition relative overflow-hidden group shadow-lg cursor-pointer ${
                selectedGame === "math_crunch"
                  ? "bg-gradient-to-br from-amber-950/80 to-slate-900 border-amber-500 ring-2 ring-amber-500/30"
                  : "bg-slate-900/90 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                  <Calculator className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Day Level {dailyMathPuzzle.level}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                  TARGET ARITHMETIC
                </span>
              </div>
              <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition font-display">
                Math Crunch 24
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                Timed arithmetic logic to reach exact targets using 4 integers.
              </p>
            </button>

          </div>

          {/* Active Game Workspace */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-6 shadow-2xl">
            
            {/* Game Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                    Today's Challenge • {selectedDate}
                  </span>
                  <h2 className="text-lg font-bold text-white font-display">
                    {selectedGame === "coding_quiz" && "Coding Quiz & Technical Trivia"}
                    {selectedGame === "daily_wordle" && "Daily Lexicon Wordle"}
                    {selectedGame === "sudoku" && "Daily Sudoku Pro"}
                    {selectedGame === "word_matrix" && "Word Matrix Verbal Reasoning"}
                    {selectedGame === "math_crunch" && "Math Crunch 24 Target Logic"}
                  </h2>
                </div>
              </div>

              {/* Center Timer & Status */}
              <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 px-4 py-2 rounded-2xl shadow-inner">
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isPlaying ? "text-emerald-400 animate-spin" : "text-slate-400"}`} />
                  <span className="font-mono text-lg font-black text-white tracking-wider">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>

                <div className="h-4 w-[1px] bg-slate-800" />

                {selectedGame === "coding_quiz" && (
                  <span className="text-xs font-mono text-slate-400">
                    Question: <strong className="text-indigo-400">{currentQuizIdx + 1}/{dailyCodingQuiz.questions.length}</strong> &bull; Score: <strong className="text-emerald-400">{quizScore} XP</strong>
                  </span>
                )}

                {selectedGame === "daily_wordle" && (
                  <span className="text-xs font-mono text-slate-400">
                    Attempts: <strong className="text-emerald-400">{wordleGuesses.length}/6</strong>
                  </span>
                )}

                {selectedGame === "sudoku" && (
                  <span className="text-xs font-mono text-slate-400">
                    Mistakes: <strong className={sudokuMistakes > 2 ? "text-rose-400" : "text-slate-200"}>{sudokuMistakes}</strong>
                  </span>
                )}

                {selectedGame === "word_matrix" && (
                  <span className="text-xs font-mono text-slate-400">
                    Progress: <strong className="text-emerald-400">{wordsCompletedCount}/{dailyWordPuzzle.totalQuestions}</strong>
                  </span>
                )}

                {selectedGame === "math_crunch" && (
                  <span className="text-xs font-mono text-slate-400">
                    Target: <strong className="text-amber-400">{dailyMathPuzzle.problems[currentMathIdx]?.target}</strong>
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={resetCurrentGame}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="Restart Puzzle"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* SUB-GAME 1: INTERACTIVE SUDOKU 9x9 */}
            {/* ========================================================================= */}
            {selectedGame === "sudoku" && (
              <div className="flex flex-col lg:flex-row items-center justify-center gap-8 py-2">
                
                {/* 9x9 Grid */}
                <div className="select-none bg-slate-950 p-2 sm:p-3 rounded-2xl border-2 border-slate-700 shadow-2xl inline-block">
                  <div className="grid grid-cols-9 gap-[1px] bg-slate-700 border-2 border-slate-700">
                    {sudokuBoard.map((row, r) =>
                      row.map((cellValue, c) => {
                        const isFixed = dailySudokuPuzzle.initialGrid[r][c] !== null;
                        const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                        const sameRowOrCol = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
                        const isSameNumber = selectedCell && cellValue !== null && sudokuBoard[selectedCell[0]][selectedCell[1]] === cellValue;
                        const notesKey = `${r}_${c}`;
                        const notes = cellNotes[notesKey] || [];

                        // 3x3 block borders
                        const rightBorder = (c === 2 || c === 5) ? "border-r-2 border-r-indigo-500/50" : "";
                        const bottomBorder = (r === 2 || r === 5) ? "border-b-2 border-b-indigo-500/50" : "";

                        return (
                          <div
                            key={`${r}-${c}`}
                            onClick={() => handleSudokuCellClick(r, c)}
                            className={`w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center text-sm sm:text-base font-bold transition-all cursor-pointer relative ${rightBorder} ${bottomBorder} ${
                              isSelected
                                ? "bg-indigo-600 text-white ring-2 ring-indigo-400 z-10"
                                : isSameNumber
                                ? "bg-indigo-950/80 text-indigo-300 font-extrabold"
                                : sameRowOrCol
                                ? "bg-slate-900/90 text-slate-200"
                                : "bg-slate-950 text-slate-100 hover:bg-slate-900"
                            } ${isFixed ? "font-black text-indigo-300" : "font-normal"}`}
                          >
                            {cellValue !== null ? (
                              cellValue
                            ) : notes.length > 0 ? (
                              <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5 text-[8px] font-mono text-slate-400 leading-none items-center justify-items-center">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                                  <span key={n} className={notes.includes(n) ? "text-indigo-400 font-bold" : "opacity-0"}>
                                    {n}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Sudoku Controls & Pad */}
                <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                  {/* Action buttons (Notes, Undo, Erase, Hint) */}
                  <div className="grid grid-cols-4 gap-2 w-full">
                    <button
                      onClick={() => setNotesMode(!notesMode)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        notesMode
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      <Layers className="h-4 w-4" />
                      <span>{notesMode ? "Notes ON" : "Notes"}</span>
                    </button>

                    <button
                      onClick={handleSudokuUndo}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Undo</span>
                    </button>

                    <button
                      onClick={handleSudokuErase}
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex flex-col items-center gap-1 transition"
                    >
                      <X className="h-4 w-4 text-rose-400" />
                      <span>Erase</span>
                    </button>

                    <button
                      onClick={handleSudokuHint}
                      className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex flex-col items-center gap-1 transition"
                      title="Reveal a correct cell (+30s penalty)"
                    >
                      <Lightbulb className="h-4 w-4 text-amber-400" />
                      <span>Hint</span>
                    </button>
                  </div>

                  {/* 1-9 Number Numpad */}
                  <div className="grid grid-cols-3 gap-2 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                      <button
                        key={num}
                        onClick={() => handleSudokuInputNumber(num)}
                        className="py-3 rounded-xl bg-slate-800 hover:bg-indigo-600 hover:text-white text-white font-bold text-lg border border-slate-700 transition active:scale-95 shadow-md"
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    💡 Use keyboard numbers 1–9 or arrow keys to navigate on desktop/laptop.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-GAME 2: WORD MATRIX (VERBAL REASONING) */}
            {/* ========================================================================= */}
            {selectedGame === "word_matrix" && dailyWordPuzzle.questions[currentWordIdx] && (
              <div className="max-w-xl mx-auto space-y-6 py-4">
                {/* Clue Card */}
                <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-5 text-center space-y-2 shadow-xl">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Category: {dailyWordPuzzle.questions[currentWordIdx].category} • Word {currentWordIdx + 1} of {dailyWordPuzzle.totalQuestions}
                  </span>
                  <p className="text-sm font-medium text-slate-200 leading-relaxed italic">
                    "{dailyWordPuzzle.questions[currentWordIdx].clue}"
                  </p>
                </div>

                {/* Assembled Word Output Slots */}
                <div className="flex items-center justify-center gap-2 min-h-[60px]">
                  {Array.from({ length: dailyWordPuzzle.questions[currentWordIdx].targetWord.length }).map((_, idx) => {
                    const char = assembledWord[idx];
                    return (
                      <div
                        key={idx}
                        className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center font-mono text-2xl font-black transition-all ${
                          wordFeedback === "success"
                            ? "bg-emerald-600 border-emerald-400 text-white animate-bounce"
                            : wordFeedback === "error"
                            ? "bg-rose-950 border-rose-500 text-rose-300 animate-shake"
                            : char
                            ? "bg-slate-800 border-indigo-500 text-white shadow-lg scale-105"
                            : "bg-slate-950/80 border-slate-800 text-slate-600"
                        }`}
                      >
                        {char || ""}
                      </div>
                    );
                  })}
                </div>

                {/* Available Scrambled Letter Tray */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
                  {wordLettersAvailable.map((letter, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleWordLetterClick(letter, idx)}
                      className="w-12 h-14 rounded-xl bg-slate-800 hover:bg-emerald-600 text-white font-mono text-xl font-black border border-slate-700 transition active:scale-95 shadow-md shadow-slate-950 flex items-center justify-center"
                    >
                      {letter}
                    </button>
                  ))}
                </div>

                {/* Word Action controls */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleWordBackspace}
                    disabled={assembledWord.length === 0}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Backspace
                  </button>

                  <button
                    onClick={handleWordSubmit}
                    disabled={assembledWord.length !== dailyWordPuzzle.questions[currentWordIdx].targetWord.length}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" /> Check Word
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-GAME 3: MATH CRUNCH 24 */}
            {/* ========================================================================= */}
            {selectedGame === "math_crunch" && dailyMathPuzzle.problems[currentMathIdx] && (
              <div className="max-w-xl mx-auto space-y-6 py-4">
                {/* Target Number Display */}
                <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-6 text-center space-y-2 shadow-xl">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Challenge {currentMathIdx + 1} of {dailyMathPuzzle.problems.length}
                  </span>
                  <div className="text-3xl font-black text-white font-mono tracking-wider">
                    TARGET: <span className="text-amber-400">{dailyMathPuzzle.problems[currentMathIdx].target}</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Use all 4 numbers below once with (+, -, *, /) to reach the target.
                  </p>
                </div>

                {/* Number Tiles */}
                <div className="flex items-center justify-center gap-3">
                  {dailyMathPuzzle.problems[currentMathIdx].numbers.map((num, idx) => {
                    const isUsed = mathUsedIndices.includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleMathNumberClick(num, idx)}
                        disabled={isUsed}
                        className={`w-14 h-14 rounded-2xl font-mono text-xl font-black border transition active:scale-95 shadow-md flex items-center justify-center ${
                          isUsed
                            ? "bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed"
                            : "bg-slate-800 hover:bg-amber-600 border-slate-700 text-white"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Operator Buttons */}
                <div className="flex items-center justify-center gap-2">
                  {["+", "-", "*", "/", "(", ")"].map((op) => (
                    <button
                      key={op}
                      onClick={() => handleMathOperatorClick(op)}
                      className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white font-mono text-lg font-bold border border-slate-700 transition active:scale-95"
                    >
                      {op}
                    </button>
                  ))}
                </div>

                {/* Live Expression Bar */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center min-h-[52px] flex items-center justify-center">
                  <span className="font-mono text-lg font-bold text-white tracking-widest">
                    {mathExpression || "Click numbers and operators above..."}
                  </span>
                </div>

                {mathFeedback && (
                  <div className={`p-3 rounded-xl text-xs text-center font-medium border ${
                    mathFeedback.includes("CORRECT") 
                      ? "bg-emerald-950/70 border-emerald-500/40 text-emerald-200" 
                      : "bg-rose-950/70 border-rose-500/40 text-rose-200"
                  }`}>
                    {mathFeedback}
                  </div>
                )}

                {/* Submit & Clear */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleMathClear}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Clear Expression
                  </button>

                  <button
                    onClick={handleMathSubmit}
                    disabled={!mathExpression}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-amber-600/30 flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" /> Calculate & Verify
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-GAME 4: CODING QUIZ & TECHNICAL TRIVIA (SLIDE 4 DESIGNATED) */}
            {/* ========================================================================= */}
            {selectedGame === "coding_quiz" && dailyCodingQuiz.questions[currentQuizIdx] && (
              <div className="space-y-6 max-w-2xl mx-auto py-2">
                {/* Question Info Bar */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-1 rounded-full font-bold uppercase">
                    {dailyCodingQuiz.questions[currentQuizIdx].category}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Question {currentQuizIdx + 1} of {dailyCodingQuiz.questions.length} &bull; +{dailyCodingQuiz.questions[currentQuizIdx].xpPoints} XP
                  </span>
                </div>

                {/* Question Text */}
                <h3 className="text-base sm:text-lg font-bold text-white font-display leading-snug">
                  {dailyCodingQuiz.questions[currentQuizIdx].question}
                </h3>

                {/* Optional Code Snippet */}
                {dailyCodingQuiz.questions[currentQuizIdx].codeSnippet && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-indigo-200 overflow-x-auto shadow-inner leading-relaxed">
                    <pre>{dailyCodingQuiz.questions[currentQuizIdx].codeSnippet}</pre>
                  </div>
                )}

                {/* Options List */}
                <div className="space-y-2.5">
                  {dailyCodingQuiz.questions[currentQuizIdx].options.map((opt, oIdx) => {
                    const letters = ["A", "B", "C", "D"];
                    const isSelected = selectedQuizOption === oIdx;
                    const isCorrect = oIdx === dailyCodingQuiz.questions[currentQuizIdx].correctIndex;

                    let btnStyle = "bg-slate-950/80 border-slate-800 hover:border-indigo-500/60 text-slate-200";
                    if (quizAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/30";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/30";
                      } else {
                        btnStyle = "bg-slate-950/40 border-slate-900 text-slate-500";
                      }
                    } else if (isSelected) {
                      btnStyle = "bg-indigo-950/80 border-indigo-500 text-white ring-2 ring-indigo-500/40";
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectQuizOption(oIdx)}
                        disabled={quizAnswerSubmitted}
                        className={`w-full p-3.5 sm:p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition flex items-start gap-3 cursor-pointer ${btnStyle}`}
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold shrink-0 text-xs">
                          {letters[oIdx]}
                        </span>
                        <span className="flex-1 leading-relaxed">{opt}</span>
                        {quizAnswerSubmitted && isCorrect && (
                          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {quizAnswerSubmitted && isSelected && !isCorrect && (
                          <X className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Post-Submit Rationale & Explanation */}
                {quizAnswerSubmitted && (
                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-100 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-indigo-300">
                      <Lightbulb className="h-4 w-4 text-amber-400" />
                      <span>Technical Explanation:</span>
                    </div>
                    <p className="leading-relaxed pl-6 text-slate-300">
                      {dailyCodingQuiz.questions[currentQuizIdx].explanation}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {!quizAnswerSubmitted ? (
                    <button
                      onClick={handleSubmitQuizAnswer}
                      disabled={selectedQuizOption === null}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="h-4 w-4" /> Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuizQuestion}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {currentQuizIdx < dailyCodingQuiz.questions.length - 1
                          ? "Next Question"
                          : "Complete Quiz & Save Score"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SUB-GAME 5: DAILY LEXICON WORDLE (SLIDE 4 DESIGNATED) */}
            {/* ========================================================================= */}
            {selectedGame === "daily_wordle" && (
              <div className="space-y-6 max-w-lg mx-auto py-2">
                {/* Category Hint Toggle */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setWordleHintRevealed(!wordleHintRevealed)}
                    className="text-xs flex items-center gap-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    <span>{wordleHintRevealed ? `Hint: ${dailyWordle.categoryHint}` : "Reveal Category Hint"}</span>
                  </button>

                  <span className="text-xs font-mono text-slate-400">
                    Target: 5-Letter Career Term
                  </span>
                </div>

                {/* 6x5 Wordle Guess Grid */}
                <div className="flex flex-col items-center gap-2 select-none">
                  {Array.from({ length: 6 }).map((_, rowIdx) => {
                    const guess = wordleGuesses[rowIdx];
                    const isCurrent = rowIdx === wordleGuesses.length && !wordleGameOver;
                    const letters = isCurrent
                      ? currentWordleInput.padEnd(5, " ").split("")
                      : guess
                      ? guess.split("")
                      : [" ", " ", " ", " ", " "];

                    return (
                      <div key={rowIdx} className="flex gap-2">
                        {letters.map((char, colIdx) => {
                          const targetChar = dailyWordle.targetWord[colIdx];
                          let cellStyle = "bg-slate-950 border-slate-800 text-white";

                          if (guess) {
                            if (char === targetChar) {
                              cellStyle = "bg-emerald-600 border-emerald-500 text-white font-black shadow-md";
                            } else if (dailyWordle.targetWord.includes(char)) {
                              cellStyle = "bg-amber-600 border-amber-500 text-white font-black shadow-md";
                            } else {
                              cellStyle = "bg-slate-800 border-slate-700 text-slate-400";
                            }
                          } else if (isCurrent && char !== " ") {
                            cellStyle = "bg-slate-900 border-indigo-500 text-white ring-2 ring-indigo-500/30 scale-105";
                          }

                          return (
                            <div
                              key={colIdx}
                              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl font-bold font-mono uppercase transition-all duration-300 ${cellStyle}`}
                            >
                              {char !== " " ? char : ""}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Wordle Game Over / Win Banner */}
                {wordleGameOver && (
                  <div className={`p-4 rounded-2xl border text-center space-y-1 ${
                    wordleWon
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                      : "bg-slate-900 border-slate-800 text-slate-200"
                  }`}>
                    <h4 className="text-sm font-bold font-display">
                      {wordleWon ? "🎉 Word Decoded Successfully!" : `Word was: ${dailyWordle.targetWord}`}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                      {dailyWordle.definition}
                    </p>
                  </div>
                )}

                {/* On-Screen QWERTY Keyboard */}
                <div className="space-y-1.5 select-none pt-2">
                  {[
                    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
                    ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
                    ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
                  ].map((row, rIdx) => (
                    <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
                      {row.map((key) => {
                        // Determine key color based on all previous guesses
                        let keyBg = "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700";
                        if (key.length === 1) {
                          let isGreen = false;
                          let isAmber = false;
                          let isGray = false;

                          for (const g of wordleGuesses) {
                            for (let i = 0; i < 5; i++) {
                              if (g[i] === key) {
                                if (dailyWordle.targetWord[i] === key) isGreen = true;
                                else if (dailyWordle.targetWord.includes(key)) isAmber = true;
                                else isGray = true;
                              }
                            }
                          }

                          if (isGreen) keyBg = "bg-emerald-600 text-white border-emerald-500";
                          else if (isAmber) keyBg = "bg-amber-600 text-white border-amber-500";
                          else if (isGray) keyBg = "bg-slate-900 text-slate-600 border-slate-850 opacity-60";
                        }

                        const isWide = key === "ENTER" || key === "BACKSPACE";

                        return (
                          <button
                            key={key}
                            onClick={() => handleWordleKeyPress(key)}
                            disabled={wordleGameOver}
                            className={`h-11 sm:h-12 rounded-lg border font-mono font-bold transition active:scale-95 text-xs sm:text-sm flex items-center justify-center cursor-pointer ${keyBg} ${
                              isWide ? "px-2.5 sm:px-4 text-[10px] sm:text-xs tracking-wider" : "w-8 sm:w-10"
                            }`}
                          >
                            {key === "BACKSPACE" ? "DEL" : key}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TOP SOLVERS LEADERBOARD DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          {/* Controls & Filter bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLeaderboardTab("today")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  leaderboardTab === "today"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-850 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Today's Daily Challenge ({selectedDate})
              </button>

              <button
                onClick={() => setLeaderboardTab("all-time")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  leaderboardTab === "all-time"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-slate-850 text-slate-300 hover:bg-slate-800"
                }`}
              >
                All-Time Hall of Fame
              </button>
            </div>

            {/* Filter by Game Type */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 flex-wrap">
              <span className="text-[10px] font-mono text-slate-500 px-2 font-bold uppercase">Filter:</span>
              {[
                { label: "All Games", val: "all" },
                { label: "Coding Quiz", val: "coding_quiz" },
                { label: "Daily Wordle", val: "daily_wordle" },
                { label: "Sudoku", val: "sudoku" },
                { label: "Math Crunch", val: "math_crunch" },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => setLeaderboardFilter(f.val as any)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                    leaderboardFilter === f.val
                      ? "bg-slate-800 text-white shadow"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current User Standing Banner */}
          {userRankIndex !== -1 && (
            <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                  #{userRankIndex + 1}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold block">Your Ranking</span>
                  <h4 className="text-sm font-bold text-white">
                    You are ranked <strong>#{userRankIndex + 1}</strong> among all {filteredLeaderboard.length} solvers!
                  </h4>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-400 block">
                  {filteredLeaderboard[userRankIndex]?.score} Pts
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Time: {formatTimer(filteredLeaderboard[userRankIndex]?.timeSeconds || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Top 3 Podium Cards */}
          {filteredLeaderboard.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Rank 2 (Silver) */}
              <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 flex flex-col items-center text-center space-y-2 relative shadow-xl md:order-1">
                <div className="p-2 bg-slate-300/10 border border-slate-300/30 text-slate-200 rounded-full">
                  <Award className="h-6 w-6 text-slate-300" />
                </div>
                <span className="text-[10px] font-mono font-black text-slate-300 uppercase">2nd Place • Silver</span>
                <h4 className="font-bold text-white text-sm truncate max-w-full">{filteredLeaderboard[1].userName}</h4>
                <div className="text-xs font-mono text-emerald-400 font-bold">{filteredLeaderboard[1].score} Points</div>
                <div className="text-[10px] font-mono text-slate-400">Time: {formatTimer(filteredLeaderboard[1].timeSeconds)}</div>
              </div>

              {/* Rank 1 (Gold Champion) */}
              <div className="bg-gradient-to-b from-amber-950/40 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-5 flex flex-col items-center text-center space-y-2 relative shadow-2xl md:order-2 md:-translate-y-2">
                <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-full shadow-lg shadow-amber-500/20">
                  <Crown className="h-8 w-8 text-amber-400" />
                </div>
                <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider">
                  👑 Daily Champion • 1st Place
                </span>
                <h4 className="font-bold text-white text-base truncate max-w-full">{filteredLeaderboard[0].userName}</h4>
                <div className="text-sm font-mono text-amber-400 font-black">{filteredLeaderboard[0].score} Points</div>
                <div className="text-[11px] font-mono text-slate-300">Time: {formatTimer(filteredLeaderboard[0].timeSeconds)}</div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="bg-slate-900/90 border border-amber-800/40 rounded-2xl p-4 flex flex-col items-center text-center space-y-2 relative shadow-xl md:order-3">
                <div className="p-2 bg-amber-700/10 border border-amber-700/30 text-amber-600 rounded-full">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <span className="text-[10px] font-mono font-black text-amber-600 uppercase">3rd Place • Bronze</span>
                <h4 className="font-bold text-white text-sm truncate max-w-full">{filteredLeaderboard[2].userName}</h4>
                <div className="text-xs font-mono text-emerald-400 font-bold">{filteredLeaderboard[2].score} Points</div>
                <div className="text-[10px] font-mono text-slate-400">Time: {formatTimer(filteredLeaderboard[2].timeSeconds)}</div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-indigo-400" /> Complete Solver Rankings
              </h3>
              <span className="text-xs text-slate-500 font-mono">{filteredLeaderboard.length} Solvers Listed</span>
            </div>

            {filteredLeaderboard.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Trophy className="h-8 w-8 text-slate-600 mx-auto" />
                <p className="text-sm font-medium text-slate-400">No solvers recorded for this filter yet.</p>
                <p className="text-xs text-slate-500">Be the first to solve today's puzzle and claim the #1 spot!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Solver Name</th>
                      <th className="py-3 px-4">Game</th>
                      <th className="py-3 px-4">Day Level</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLeaderboard.map((item, idx) => {
                      const isCurrentUser = item.userId === (user.uid || "anon");
                      return (
                        <tr
                          key={item.id || idx}
                          className={`transition hover:bg-slate-800/40 ${
                            isCurrentUser ? "bg-indigo-950/40 font-bold" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono">
                            {idx === 0 ? "🥇 #1" : idx === 1 ? "🥈 #2" : idx === 2 ? "🥉 #3" : `#${idx + 1}`}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              {item.profilePhoto ? (
                                <img src={item.profilePhoto} alt="" className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px]">
                                  {item.userName?.charAt(0) || "U"}
                                </div>
                              )}
                              <span className="truncate max-w-[160px] text-white">
                                {item.userName} {isCurrentUser && "(You)"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono uppercase text-[10px] text-slate-300">
                            {item.gameType === "sudoku" && "Sudoku Pro"}
                            {item.gameType === "word_matrix" && "Word Matrix"}
                            {item.gameType === "math_crunch" && "Math Crunch"}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">Level {item.level}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">{formatTimer(item.timeSeconds)}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-right text-emerald-400">{item.score} Pts</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STREAKS & PERSONAL SOLVER STATS */}
      {/* ========================================================================= */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Streak card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Current Daily Streak</span>
                <Flame className="h-5 w-5 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {userProfile.currentStreak || 1} Days
              </div>
              <p className="text-[10px] text-slate-500">Play daily to build up consecutive streak multipliers.</p>
            </div>

            {/* Longest streak */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Longest Streak</span>
                <Trophy className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {userProfile.longestStreak || 1} Days
              </div>
              <p className="text-[10px] text-slate-500">Personal career best consistency record.</p>
            </div>

            {/* Total Solved */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Puzzles Solved</span>
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {userProfile.totalGamesSolved || 0}
              </div>
              <p className="text-[10px] text-slate-500">Combined completions across all 3 skill modes.</p>
            </div>

            {/* Best Sudoku Speed */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Best Sudoku Time</span>
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono">
                {userProfile.bestSudokuTime ? formatTimer(userProfile.bestSudokuTime) : "--:--"}
              </div>
              <p className="text-[10px] text-slate-500">Fastest recorded full grid deduction.</p>
            </div>
          </div>

          {/* Daily Streak Calendar Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-400" /> 7-Day Mind Gym Challenge Progression
            </h3>
            <p className="text-xs text-slate-400">
              Each day difficulty scales automatically. Mon (Level 1 Warmup) through Sun (Level 7 Master Challenge).
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 pt-2">
              {[
                { day: "Monday", level: 1, label: "Level 1: Foundation" },
                { day: "Tuesday", level: 2, label: "Level 2: Speed" },
                { day: "Wednesday", level: 3, label: "Level 3: Strategic" },
                { day: "Thursday", level: 4, label: "Level 4: Advanced" },
                { day: "Friday", level: 5, label: "Level 5: Senior" },
                { day: "Saturday", level: 6, label: "Level 6: Principal" },
                { day: "Sunday", level: 7, label: "Level 7: Master" },
              ].map((item) => (
                <div
                  key={item.day}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center space-y-1"
                >
                  <span className="text-[10px] font-mono text-slate-400 block uppercase font-bold">{item.day}</span>
                  <div className="text-xs font-black text-amber-400 font-mono">Lvl {item.level}</div>
                  <span className="text-[9px] text-slate-500 block truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VICTORY CELEBRATION MODAL */}
      {/* ========================================================================= */}
      {victoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-5 shadow-2xl">
            <div className="p-4 bg-amber-500/20 text-amber-400 rounded-2xl inline-block animate-bounce">
              <Trophy className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white font-display">Challenge Completed!</h2>
              <p className="text-xs text-slate-400">
                Outstanding deduction! Your performance has been synced to the live global leaderboard.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Solved Time</span>
                <span className="text-lg font-black text-white font-mono">{formatTimer(lastWonTime)}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Score Awarded</span>
                <span className="text-lg font-black text-emerald-400 font-mono">{lastWonScore} Pts</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setVictoryModalOpen(false);
                  setActiveTab("leaderboard");
                }}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5"
              >
                <Crown className="h-4 w-4" /> View My Ranking
              </button>

              <button
                onClick={() => setVictoryModalOpen(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
