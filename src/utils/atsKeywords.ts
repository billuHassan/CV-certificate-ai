import { ResumeData } from "../types";
import { getRoleDomainInfo } from "./roleAnalyzer";

export interface AtsKeyword {
  keyword: string;
  category: "Hard Skill" | "Framework & Tool" | "Methodology" | "Leadership & Impact" | "Industry Standard";
  importance: "Critical" | "High" | "Recommended";
  relevanceScore: number;
  rationale: string;
  exampleUsage: string;
}

export interface AtsKeywordResult {
  targetJobTitle: string;
  screeningTier: string;
  atsParserInsights: string;
  keywords: AtsKeyword[];
}

export interface KeywordMatchReport {
  matchedKeywords: string[];
  missingKeywords: AtsKeyword[];
  matchedCount: number;
  totalCount: number;
  matchPercentage: number;
  atsStatus: "ATS Guaranteed Pass" | "Review Margin" | "Parser Filter Risk";
  tierColor: string;
}

/**
 * Curated high-impact ATS keyword bank for popular job title clusters
 */
const ROLE_KEYWORD_DATABASE: Record<string, AtsKeyword[]> = {
  software_engineer: [
    {
      keyword: "System Architecture",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 99,
      rationale: "Top Taleo screener filter for mid and senior engineering roles.",
      exampleUsage: "Designed scalable distributed system architecture serving 1.2M daily active users."
    },
    {
      keyword: "RESTful APIs & GraphQL",
      category: "Framework & Tool",
      importance: "Critical",
      relevanceScore: 98,
      rationale: "Essential backend communication standard scanned by Greenhouse parser.",
      exampleUsage: "Engineered high-throughput RESTful APIs and GraphQL endpoints with sub-50ms latency."
    },
    {
      keyword: "Microservices Architecture",
      category: "Methodology",
      importance: "Critical",
      relevanceScore: 96,
      rationale: "Evaluated by ATS to distinguish monolithic legacy developers from modern cloud engineers.",
      exampleUsage: "Decoupled monolithic services into containerized microservices, reducing deployment downtime by 85%."
    },
    {
      keyword: "CI/CD Pipeline Automation",
      category: "Framework & Tool",
      importance: "High",
      relevanceScore: 95,
      rationale: "Ranked as core competency across all DevOps-aligned engineering positions.",
      exampleUsage: "Automated GitHub Actions CI/CD pipelines, decreasing release cycle lead time from 4 days to 45 minutes."
    },
    {
      keyword: "Unit & Integration Testing",
      category: "Methodology",
      importance: "High",
      relevanceScore: 94,
      rationale: "ATS keyword filter for software reliability, code quality, and test coverage standards.",
      exampleUsage: "Maintained 94% test coverage utilizing Jest, Vitest, and Cypress end-to-end test suites."
    },
    {
      keyword: "Docker & Kubernetes",
      category: "Framework & Tool",
      importance: "High",
      relevanceScore: 93,
      rationale: "Primary containerization keywords parsed by Workday applicant screening.",
      exampleUsage: "Orchestrated multi-cluster Kubernetes deployments with automated horizontal pod autoscaling."
    },
    {
      keyword: "SQL & NoSQL Database Optimization",
      category: "Hard Skill",
      importance: "High",
      relevanceScore: 92,
      rationale: "Data indexing and query tuning keywords prioritized by technical screeners.",
      exampleUsage: "Optimized complex PostgreSQL query execution plans, slashing database read contention by 40%."
    },
    {
      keyword: "Agile / Scrum Delivery",
      category: "Methodology",
      importance: "Recommended",
      relevanceScore: 89,
      rationale: "Standard team collaboration requirement in tech screener algorithms.",
      exampleUsage: "Spearheaded 2-week sprint planning and retrospectives across a 12-member engineering squad."
    },
    {
      keyword: "Cloud Infrastructure (AWS/GCP/Azure)",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 97,
      rationale: "High-priority screener requirement for cloud-native software roles.",
      exampleUsage: "Provisioned resilient AWS cloud infrastructure using Terraform Infrastructure as Code (IaC)."
    },
    {
      keyword: "Cross-Functional Collaboration",
      category: "Leadership & Impact",
      importance: "Recommended",
      relevanceScore: 88,
      rationale: "High-scoring phrase for applicant interpersonal and organizational influence.",
      exampleUsage: "Partnered with product managers and UX designers to ship customer-facing enterprise roadmap features."
    },
    {
      keyword: "Code Review & Technical Mentorship",
      category: "Leadership & Impact",
      importance: "High",
      relevanceScore: 91,
      rationale: "Crucial metric for senior engineering grading in Workday parser rankings.",
      exampleUsage: "Conducted peer code reviews and mentored 4 junior developers in clean code practices."
    },
    {
      keyword: "Security & OWASP Compliance",
      category: "Industry Standard",
      importance: "High",
      relevanceScore: 93,
      rationale: "Modern ATS screening filter for defensive programming and vulnerability management.",
      exampleUsage: "Remediated OWASP Top 10 vulnerabilities and enforced TLS 1.3 encryption across all public ingress routes."
    }
  ],
  product_manager: [
    {
      keyword: "Product Roadmap Strategy",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 99,
      rationale: "Primary match term evaluated for candidate strategic alignment in Taleo.",
      exampleUsage: "Defined and executed multi-quarter product roadmap that accelerated annual recurring revenue (ARR) by $4.2M."
    },
    {
      keyword: "Key Performance Indicators (KPIs)",
      category: "Methodology",
      importance: "Critical",
      relevanceScore: 98,
      rationale: "Must-have ATS keyword demonstrating metric-driven product leadership.",
      exampleUsage: "Established customer adoption KPIs, boosting 30-day retention from 42% to 68%."
    },
    {
      keyword: "User Research & Discovery",
      category: "Methodology",
      importance: "High",
      relevanceScore: 95,
      rationale: "Scored by recruiters to verify customer-centric design validation skills.",
      exampleUsage: "Conducted 60+ customer interviews and usability sessions to synthesize critical pain points."
    },
    {
      keyword: "Go-to-Market (GTM) Execution",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 97,
      rationale: "High-frequency keyword in Workday commercial product manager filters.",
      exampleUsage: "Orchestrated global GTM release alongside sales and marketing, acquiring 25,000 signups in week one."
    },
    {
      keyword: "Data-Driven Decision Making",
      category: "Leadership & Impact",
      importance: "High",
      relevanceScore: 94,
      rationale: "Core behavioral phrase scanned by hiring algorithms across modern tech firms.",
      exampleUsage: "Leveraged SQL, Mixpanel, and amplitude behavioral cohort data to prioritize backlog items."
    },
    {
      keyword: "A/B Testing & Funnel Optimization",
      category: "Framework & Tool",
      importance: "High",
      relevanceScore: 93,
      rationale: "Quantitative validation keyword that triggers high relevancy scores.",
      exampleUsage: "Designed multivariate A/B checkout tests that increased conversion checkout rate by 18.4%."
    },
    {
      keyword: "Cross-Functional Stakeholder Alignment",
      category: "Leadership & Impact",
      importance: "High",
      relevanceScore: 92,
      rationale: "Key management keyword for cross-departmental coordination.",
      exampleUsage: "Aligned engineering, legal, executive, and customer support stakeholders across sprint milestones."
    },
    {
      keyword: "Agile / Scrum Backlog Grooming",
      category: "Framework & Tool",
      importance: "Recommended",
      relevanceScore: 89,
      rationale: "Standard technical workflow keyword parsed in resume skill blocks.",
      exampleUsage: "Authored comprehensive PRDs and user stories, leading weekly backlog grooming sessions in Jira."
    }
  ],
  data_scientist: [
    {
      keyword: "Machine Learning (ML) Models",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 99,
      rationale: "Foundational ATS filter for artificial intelligence and data science roles.",
      exampleUsage: "Trained and deployed predictive machine learning models delivering 92% classification accuracy."
    },
    {
      keyword: "Python & R Data Pipelines",
      category: "Framework & Tool",
      importance: "Critical",
      relevanceScore: 98,
      rationale: "Core programming syntax parsed in initial technical keyword screens.",
      exampleUsage: "Architected automated Python data pipelines processing 80M+ daily event records using Pandas and PySpark."
    },
    {
      keyword: "Statistical Analysis & Hypothesis Testing",
      category: "Methodology",
      importance: "Critical",
      relevanceScore: 96,
      rationale: "Evaluated by algorithms to verify solid mathematical foundations.",
      exampleUsage: "Formulated rigorous A/B hypothesis tests to validate pricing model elasticity."
    },
    {
      keyword: "Deep Learning (PyTorch / TensorFlow)",
      category: "Framework & Tool",
      importance: "High",
      relevanceScore: 95,
      rationale: "Essential high-tier ATS keyword for neural network specializations.",
      exampleUsage: "Developed transformer NLP models with PyTorch and Hugging Face for automated document indexing."
    },
    {
      keyword: "Data Visualization (Tableau / PowerBI)",
      category: "Framework & Tool",
      importance: "High",
      relevanceScore: 92,
      rationale: "Recruiter-scanned keyword indicating executive storytelling capability.",
      exampleUsage: "Constructed executive Tableau dashboards providing real-time churn and LTV insights."
    },
    {
      keyword: "Feature Engineering & Dimensionality Reduction",
      category: "Methodology",
      importance: "High",
      relevanceScore: 91,
      rationale: "Advanced data preprocessing phrase heavily favored in AI scoring filters.",
      exampleUsage: "Applied PCA and feature selection techniques, reducing model inference latency by 35%."
    },
    {
      keyword: "SQL & BigQuery / Snowflake",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 97,
      rationale: "Universal data querying requirement in corporate screening engines.",
      exampleUsage: "Authored optimized SQL queries querying multi-terabyte data warehouses in Snowflake."
    }
  ],
  ui_ux_designer: [
    {
      keyword: "User Experience (UX) Design",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 99,
      rationale: "Top-ranking search term for digital design and interaction roles.",
      exampleUsage: "Crafted intuitive end-to-end UX user journeys for a global fintech mobile application."
    },
    {
      keyword: "Figma & Design Systems",
      category: "Framework & Tool",
      importance: "Critical",
      relevanceScore: 98,
      rationale: "Standardized industry software keyword parsed across all recruiter searches.",
      exampleUsage: "Built and maintained comprehensive Figma component library and tokenized design system."
    },
    {
      keyword: "Wireframing & Interactive Prototyping",
      category: "Methodology",
      importance: "Critical",
      relevanceScore: 96,
      rationale: "Essential deliverable terminology required by applicant screening bots.",
      exampleUsage: "Produced high-fidelity clickable prototypes to validate user flows prior to engineering kickoff."
    },
    {
      keyword: "Usability Testing & User Research",
      category: "Methodology",
      importance: "High",
      relevanceScore: 94,
      rationale: "Demonstrates evidence-backed design validation vs subjective styling.",
      exampleUsage: "Moderated remote usability testing sessions with 30 participants, identifying critical drop-off points."
    },
    {
      keyword: "Accessibility (WCAG 2.1 AA Compliance)",
      category: "Industry Standard",
      importance: "High",
      relevanceScore: 93,
      rationale: "Legal and accessibility requirement heavily weighted in enterprise candidate ranking.",
      exampleUsage: "Audited UI components for WCAG 2.1 AA contrast ratios and screen-reader keyboard navigability."
    },
    {
      keyword: "Information Architecture & User Flows",
      category: "Methodology",
      importance: "High",
      relevanceScore: 92,
      rationale: "Structural design keyword distinguishing seasoned product designers.",
      exampleUsage: "Re-architected complex SaaS navigation hierarchy, decreasing onboarding time by 42%."
    }
  ],
  cybersecurity_analyst: [
    {
      keyword: "Threat Detection & Incident Response",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 99,
      rationale: "Primary SOC operational capability scanned by cybersecurity hiring parsers.",
      exampleUsage: "Led 24/7 security incident response investigations, cutting mean time to detect (MTTD) to 14 minutes."
    },
    {
      keyword: "SIEM & Log Analysis (Splunk / Sentinel)",
      category: "Framework & Tool",
      importance: "Critical",
      relevanceScore: 98,
      rationale: "Core tooling keyword required by enterprise and defense contractors.",
      exampleUsage: "Engineered Splunk correlation rules that flagged zero-day unauthorized privilege escalations."
    },
    {
      keyword: "Vulnerability Assessment & Pen Testing",
      category: "Methodology",
      importance: "High",
      relevanceScore: 96,
      rationale: "Offensive and defensive security keyword pairing scanned in technical screens.",
      exampleUsage: "Conducted automated and manual vulnerability scans utilizing Nessus and Burp Suite."
    },
    {
      keyword: "NIST Cybersecurity Framework / ISO 27001",
      category: "Industry Standard",
      importance: "Critical",
      relevanceScore: 97,
      rationale: "Regulatory and governance compliance standards triggering top candidate tiers.",
      exampleUsage: "Mapped security controls to NIST CSF and ISO 27001 requirements for annual SOC 2 Type II audit."
    },
    {
      keyword: "Network Security & Firewalls",
      category: "Hard Skill",
      importance: "High",
      relevanceScore: 92,
      rationale: "Foundational infrastructure defense keyword required across IT security roles.",
      exampleUsage: "Configured Palo Alto next-generation firewall policies and zero-trust microsegmentation."
    }
  ],
  financial_analyst: [
    {
      keyword: "Financial Modeling & Valuation (DCF / LBO)",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 99,
      rationale: "The #1 core financial skill scanned by corporate finance and banking ATS engines.",
      exampleUsage: "Constructed 3-statement dynamic financial models and discounted cash flow (DCF) valuations for $250M acquisitions."
    },
    {
      keyword: "Variance Analysis & Budget Forecasting",
      category: "Methodology",
      importance: "Critical",
      relevanceScore: 97,
      rationale: "Essential FP&A keyword demonstrating operational cost and revenue oversight.",
      exampleUsage: "Conducted monthly budget vs. actual variance analysis across 6 business divisions totaling $45M OPEX."
    },
    {
      keyword: "Advanced Microsoft Excel (VBA / PowerQuery)",
      category: "Framework & Tool",
      importance: "High",
      relevanceScore: 95,
      rationale: "Non-negotiable screening criterion in financial analyst filtering algorithms.",
      exampleUsage: "Automated consolidation of 14 subsidiary reports using Excel VBA macros, saving 18 work hours monthly."
    },
    {
      keyword: "ERP & Financial Systems (SAP / NetSuite)",
      category: "Framework & Tool",
      importance: "High",
      relevanceScore: 93,
      rationale: "Direct system familiarity keyword sought by Fortune 500 financial screeners.",
      exampleUsage: "Extracted and audited journal ledger entries directly from Oracle NetSuite ERP."
    },
    {
      keyword: "GAAP & IFRS Accounting Standards",
      category: "Industry Standard",
      importance: "High",
      relevanceScore: 94,
      rationale: "Standard compliance verification for financial reporting positions.",
      exampleUsage: "Ensured revenue recognition schedules complied strictly with ASC 606 / US GAAP guidelines."
    }
  ],
  registered_nurse: [
    {
      keyword: "Acute Patient Assessment & Triage",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 99,
      rationale: "Top clinical keyword scanned by hospital and clinic ATS parsers.",
      exampleUsage: "Conducted rapid clinical assessments and triage on 25+ emergent patients per shift in high-volume trauma center."
    },
    {
      keyword: "Electronic Health Records (Epic / Cerner)",
      category: "Framework & Tool",
      importance: "Critical",
      relevanceScore: 98,
      rationale: "System documentation filter required by healthcare talent acquisition screeners.",
      exampleUsage: "Maintained 100% HIPAA-compliant documentation and medication administration records within Epic EHR."
    },
    {
      keyword: "Medication Administration & IV Infusions",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 97,
      rationale: "Core clinical safety standard prioritized in nursing screening algorithms.",
      exampleUsage: "Administered prescribed intravenous medications, blood products, and titrated continuous vasoactive drips."
    },
    {
      keyword: "Patient & Family Health Education",
      category: "Leadership & Impact",
      importance: "High",
      relevanceScore: 92,
      rationale: "High-scoring phrase for holistic patient care and readmission reduction.",
      exampleUsage: "Delivered comprehensive discharge education, reducing 30-day post-op readmission rates by 18%."
    },
    {
      keyword: "Interdisciplinary Team Collaboration",
      category: "Leadership & Impact",
      importance: "High",
      relevanceScore: 91,
      rationale: "Crucial team communication phrase verified by nursing supervisors.",
      exampleUsage: "Collaborated closely with attending physicians, respiratory therapists, and physical therapists during rounds."
    },
    {
      keyword: "BLS / ACLS Certification",
      category: "Industry Standard",
      importance: "Critical",
      relevanceScore: 98,
      rationale: "Mandatory qualification filter in healthcare ATS systems.",
      exampleUsage: "Maintained active BLS (Basic Life Support) and ACLS (Advanced Cardiovascular Life Support) certifications."
    }
  ],
  digital_marketing: [
    {
      keyword: "Search Engine Optimization (SEO / SEM)",
      category: "Hard Skill",
      importance: "Critical",
      relevanceScore: 99,
      rationale: "Primary organic search match term in modern marketing parser engines.",
      exampleUsage: "Formulated content and technical SEO strategy that grew monthly non-brand organic search traffic by 180%."
    },
    {
      keyword: "Google Analytics 4 & Performance Tracking",
      category: "Framework & Tool",
      importance: "Critical",
      relevanceScore: 97,
      rationale: "Universal web tracking standard sought by marketing hiring screeners.",
      exampleUsage: "Configured custom event tagging in GA4 and Google Tag Manager to audit full-funnel conversion attribution."
    },
    {
      keyword: "Customer Acquisition Cost (CAC) & ROAS",
      category: "Methodology",
      importance: "Critical",
      relevanceScore: 96,
      rationale: "Direct financial impact metrics that rank candidate profiles in top 5% of screener.",
      exampleUsage: "Optimized paid advertising budget across Meta and LinkedIn, boosting ROAS from 2.2x to 4.1x while cutting CAC by 30%."
    },
    {
      keyword: "Email Marketing & Marketing Automation (HubSpot / Klaviyo)",
      category: "Framework & Tool",
      importance: "High",
      relevanceScore: 93,
      rationale: "Key retention channel expertise scanned in digital marketing resumes.",
      exampleUsage: "Automated multi-step nurture drip workflows in HubSpot, recovering $120,000 in abandoned funnel leads."
    },
    {
      keyword: "Content Strategy & Copywriting",
      category: "Hard Skill",
      importance: "High",
      relevanceScore: 92,
      rationale: "Qualitative content creation keyword sought by corporate brand recruiters.",
      exampleUsage: "Authored thought-leadership whitepapers and social campaigns that generated 4,500 qualified MQLs."
    }
  ]
};

/**
 * Resolves high-impact ATS keywords for any job title using heuristic matching and domain synthesis
 */
export function getAtsKeywordsForTitle(jobTitleInput?: string): AtsKeywordResult {
  const title = (jobTitleInput || "").trim().toLowerCase();
  const rawTitle = (jobTitleInput || "Professional Specialist").trim();

  // Check known curated clusters
  if (/software|developer|full stack|full-stack|frontend|front-end|backend|back-end|web developer|programmer|coder|sre|devops|engineer/.test(title)) {
    return {
      targetJobTitle: rawTitle,
      screeningTier: "Tier-1 Guaranteed Pass",
      atsParserInsights: "Taleo, Workday, and Greenhouse prioritize verified programming languages, distributed cloud architecture, container orchestration, and CI/CD automation keywords.",
      keywords: ROLE_KEYWORD_DATABASE.software_engineer,
    };
  }

  if (/product manager|product lead|head of product|group product|technical product|director of product|vp of product/.test(title)) {
    return {
      targetJobTitle: rawTitle,
      screeningTier: "Tier-1 Guaranteed Pass",
      atsParserInsights: "Executive product screeners filter for metrics-driven roadmap execution, KPI ownership, user discovery, and cross-functional engineering alignment.",
      keywords: ROLE_KEYWORD_DATABASE.product_manager,
    };
  }

  if (/data scientist|data science|machine learning|ml engineer|ai engineer|deep learning|data analyst|bi developer|data architect/.test(title)) {
    return {
      targetJobTitle: rawTitle,
      screeningTier: "Tier-1 Guaranteed Pass",
      atsParserInsights: "AI and analytics parsers strictly filter for Python data science libraries, model evaluation metrics, statistical experimentation, and SQL scale.",
      keywords: ROLE_KEYWORD_DATABASE.data_scientist,
    };
  }

  if (/ux|ui|designer|product designer|visual designer|interaction|graphic designer|creative director/.test(title)) {
    return {
      targetJobTitle: rawTitle,
      screeningTier: "Tier-1 Guaranteed Pass",
      atsParserInsights: "Design talent screeners evaluate tokenized design systems, user journey wireframing, WCAG accessibility compliance, and user research protocols.",
      keywords: ROLE_KEYWORD_DATABASE.ui_ux_designer,
    };
  }

  if (/security|cyber|soc|infosec|penetration|threat|ciso|vulnerability|firewall/.test(title)) {
    return {
      targetJobTitle: rawTitle,
      screeningTier: "Tier-1 Guaranteed Pass",
      atsParserInsights: "Defense and corporate security screeners scan for NIST/ISO regulatory frameworks, SIEM log correlation, threat triage, and incident containment metrics.",
      keywords: ROLE_KEYWORD_DATABASE.cybersecurity_analyst,
    };
  }

  if (/finance|financial|accountant|accounting|cfo|controller|fp&a|auditor|banking|investment/.test(title)) {
    return {
      targetJobTitle: rawTitle,
      screeningTier: "Tier-1 Guaranteed Pass",
      atsParserInsights: "Finance algorithms search for 3-statement financial modeling, variance budgeting, ERP familiarity, and GAAP regulatory compliance.",
      keywords: ROLE_KEYWORD_DATABASE.financial_analyst,
    };
  }

  if (/nurse|rn|nursing|healthcare|clinical|patient care|doctor|physician|hospital|medical/.test(title)) {
    return {
      targetJobTitle: rawTitle,
      screeningTier: "Tier-1 Guaranteed Pass",
      atsParserInsights: "Healthcare ATS screeners strictly require state licensing terminology, acute triage competence, Epic/Cerner documentation, and life support certifications.",
      keywords: ROLE_KEYWORD_DATABASE.registered_nurse,
    };
  }

  if (/marketing|seo|growth|content|social media|advertising|copywriter|brand|campaign/.test(title)) {
    return {
      targetJobTitle: rawTitle,
      screeningTier: "Tier-1 Guaranteed Pass",
      atsParserInsights: "Growth marketing algorithms evaluate customer acquisition efficiency (CAC/ROAS), GA4 conversion tracking, and multi-channel campaign automation.",
      keywords: ROLE_KEYWORD_DATABASE.digital_marketing,
    };
  }

  // Domain analyzer fallback for all other roles
  const domainInfo = getRoleDomainInfo(rawTitle);
  const coreSkills = domainInfo.coreSkills || [];

  const synthesizedKeywords: AtsKeyword[] = coreSkills.map((skill, index) => ({
    keyword: skill,
    category: index < 4 ? "Hard Skill" : index < 7 ? "Framework & Tool" : index < 10 ? "Methodology" : "Leadership & Impact",
    importance: index < 3 ? "Critical" : index < 6 ? "High" : "Recommended",
    relevanceScore: Math.max(84, 98 - index * 2),
    rationale: `Primary industry qualification benchmark evaluated by ATS engines for ${rawTitle} applicants in ${domainInfo.domainName}.`,
    exampleUsage: `Leveraged ${skill} to optimize process velocity, increase operational quality, and surpass benchmark objectives by 28%.`,
  }));

  // Ensure high quality baseline
  if (synthesizedKeywords.length < 8) {
    const defaultAdditions = [
      "Process Optimization & Standardization",
      "Cross-Functional Team Leadership",
      "Performance Metric Tracking",
      "Regulatory & Compliance Adherence",
      "Strategic Planning & Execution",
      "Stakeholder Communication"
    ];
    defaultAdditions.forEach((d, i) => {
      synthesizedKeywords.push({
        keyword: d,
        category: i % 2 === 0 ? "Methodology" : "Leadership & Impact",
        importance: "Recommended",
        relevanceScore: 88 - i,
        rationale: `High-value executive screener term indicating organizational maturity and reliable delivery.`,
        exampleUsage: `Executed ${d} to elevate operational standards and achieve targeted milestone deliverables.`
      });
    });
  }

  return {
    targetJobTitle: rawTitle,
    screeningTier: "Tier-1 Guaranteed Pass",
    atsParserInsights: `Taleo and Workday algorithms screen candidates for ${rawTitle} by matching exact domain keywords, process standardization, and quantified outcome indicators.`,
    keywords: synthesizedKeywords,
  };
}

/**
 * Analyzes how many suggested ATS keywords are currently present across the user's resume
 */
export function analyzeKeywordMatches(resume: ResumeData, keywords: AtsKeyword[]): KeywordMatchReport {
  if (!keywords || keywords.length === 0) {
    return {
      matchedKeywords: [],
      missingKeywords: [],
      matchedCount: 0,
      totalCount: 0,
      matchPercentage: 0,
      atsStatus: "Review Margin",
      tierColor: "text-amber-400"
    };
  }

  // Compile full text corpus of the resume for comprehensive keyword detection
  const corpusParts: string[] = [
    resume.personalInfo.jobTitle || "",
    resume.personalInfo.fullName || "",
    resume.summary || "",
    ...(resume.skills || []),
    ...(resume.certifications || []).map(c => typeof c === "string" ? c : (c as any).name || ""),
  ];

  (resume.experience || []).forEach(exp => {
    corpusParts.push(exp.position || "");
    corpusParts.push(exp.company || "");
    corpusParts.push(exp.description || "");
  });

  (resume.projects || []).forEach(proj => {
    corpusParts.push(proj.name || "");
    corpusParts.push(proj.role || "");
    corpusParts.push(proj.description || "");
  });

  const fullCorpusLower = corpusParts.join(" ").toLowerCase();

  const matchedKeywords: string[] = [];
  const missingKeywords: AtsKeyword[] = [];

  keywords.forEach(item => {
    const kw = item.keyword.toLowerCase().trim();
    // Clean punctuation for robust matching
    const cleanKw = kw.replace(/[/\\(),]/g, " ").replace(/\s+/g, " ").trim();
    
    // Check if directly in skills array
    const inSkills = (resume.skills || []).some(s => {
      const sLower = s.toLowerCase().trim();
      return sLower === kw || sLower.includes(kw) || kw.includes(sLower);
    });

    // Check if in full text corpus
    const inCorpus = fullCorpusLower.includes(kw) || (cleanKw.length > 3 && fullCorpusLower.includes(cleanKw));

    if (inSkills || inCorpus) {
      matchedKeywords.push(item.keyword);
    } else {
      missingKeywords.push(item);
    }
  });

  const matchedCount = matchedKeywords.length;
  const totalCount = keywords.length;
  const matchPercentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 0;

  let atsStatus: "ATS Guaranteed Pass" | "Review Margin" | "Parser Filter Risk" = "Review Margin";
  let tierColor = "text-amber-400";

  if (matchPercentage >= 70) {
    atsStatus = "ATS Guaranteed Pass";
    tierColor = "text-emerald-400";
  } else if (matchPercentage < 40) {
    atsStatus = "Parser Filter Risk";
    tierColor = "text-rose-400";
  }

  return {
    matchedKeywords,
    missingKeywords,
    matchedCount,
    totalCount,
    matchPercentage,
    atsStatus,
    tierColor
  };
}

/**
 * Calls backend AI service with client-side fallback
 */
export async function fetchAiAtsKeywords(jobTitle: string): Promise<AtsKeywordResult> {
  const fallback = getAtsKeywordsForTitle(jobTitle);

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return fallback;
  }

  try {
    const res = await fetch("/api/ai/suggest-ats-keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobTitle }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.keywords && Array.isArray(data.keywords) && data.keywords.length > 0) {
        return {
          targetJobTitle: data.targetJobTitle || jobTitle,
          screeningTier: data.screeningTier || "Tier-1 Guaranteed Pass",
          atsParserInsights: data.atsParserInsights || fallback.atsParserInsights,
          keywords: data.keywords,
        };
      }
    }
  } catch (err) {
    console.warn("AI suggest-ats-keywords failed, using domain keyword dictionary:", err);
  }

  return fallback;
}
