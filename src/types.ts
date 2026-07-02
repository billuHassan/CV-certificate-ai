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
  sectionsOrder: string[]; // e.g., ['summary', 'experience', 'education', 'projects', 'skills', 'languages', 'certifications', 'references']
  templateId: string;
  colorTheme: string; // primary hex
  fontFamily: string; // font class/family name
  spacing: 'compact' | 'comfortable' | 'spacious';
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

export interface UserSession {
  uid?: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  creationsCount?: number;
  adViews?: number;
  profilePhoto?: string;
}
