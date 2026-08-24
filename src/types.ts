export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  profilePhoto: string; // base64 or URL
}

export interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  description: string; // bullet points or paragraph
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  gpa: string;
}

export interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  url: string;
  description: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface Language {
  id: string;
  name: string;
  proficiency: string; // e.g. Native, Fluent, Conversational
}

export interface Reference {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
}

export interface CustomSectionItem {
  id: string;
  heading?: string;
  subheading?: string;
  date?: string;
  location?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}

export interface ResumeData {
  id: string;
  title: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  projects: Project[];
  skills: string[];
  languages: Language[];
  certifications: Certification[];
  references: Reference[];
  customSections?: CustomSection[];
  sectionsOrder: string[]; // e.g., ['summary', 'experience', 'education', 'projects', 'skills', 'languages', 'certifications', 'references']
  templateId: string;
  colorTheme: string; // primary hex
  fontFamily: string; // font class/family name
  spacing: 'compact' | 'comfortable' | 'spacious';
  layoutMode?: 'auto' | 'single' | 'split';
  createdAt?: string;
  updatedAt: string;
}

export interface CoverLetterData {
  id: string;
  title: string;
  recipientName: string;
  recipientCompany: string;
  recipientAddress?: string;
  jobTitle: string;
  jobDescription?: string;
  content: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
  senderInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
}

export interface ScoreReport {
  overallScore: number;
  atsScore: number;
  sectionsAnalysis: {
    section: string;
    score: number;
    feedback: string;
    status: 'success' | 'warning' | 'error';
  }[];
  grammarCheck: {
    issue: string;
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  kwScore: number;
  suggestions: string[];
}

export interface UserSettings {
  theme?: string;
  font?: string;
  lang?: string;
  region?: string;
  currency?: string;
  notifs?: {
    email?: boolean;
    ats?: boolean;
    views?: boolean;
    updates?: boolean;
  };
  customZoom?: number;
}

export interface UserSession {
  uid?: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  isGuest?: boolean;
  creationsCount?: number;
  adViews?: number;
  profilePhoto?: string;
  settings?: UserSettings;
}

export interface CareerRecommendation {
  id: string;
  resumeId: string;
  resumeTitle: string;
  overallFitSummary: string;
  recommendedRoles: {
    title: string;
    fitScore: number;
    rationale: string;
    expectedSalaryRange: string;
    skillsToAcquire: string[];
    topCompanies?: string[];
    skillsToUpgrade?: {
      skillName: string;
      whyItStandsOut: string;
    }[];
  }[];
  recommendedCompanies: {
    companyName: string;
    fitRationale: string;
    positionsToWatch: string[];
    interviewTips: string;
  }[];
  recommendedCountries?: {
    country: string;
    rationale: string;
    topCities: string[];
    averageSalaryLevel: string;
  }[];
  careerStrategy: string[];
  createdAt: string;
}

export interface DirectMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  recipientId: string;
  recipientEmail: string;
  recipientName: string;
  message: string;
  mediaUrl?: string;
  mediaType?: string; // "image" | "video" | "none"
  createdAt: string;
  read: boolean;
}

export type GameType = "sudoku" | "word_matrix" | "math_crunch";

export interface GameScore {
  id: string;
  gameType: GameType;
  userId: string;
  userName: string;
  userEmail?: string;
  profilePhoto?: string;
  timeSeconds: number;
  score: number;
  level: number;
  dayDate: string; // "YYYY-MM-DD"
  completedAt: string;
}

export interface UserGameProfile {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string; // "YYYY-MM-DD"
  totalGamesSolved: number;
  bestSudokuTime?: number;
  bestWordTime?: number;
  bestMathTime?: number;
  updatedAt?: string;
}

