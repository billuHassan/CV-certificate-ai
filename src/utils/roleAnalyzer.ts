export interface RoleDomainInfo {
  domainName: string;
  industry: string;
  coreSkills: string[];
  recommendedRoles: Array<{
    title: string;
    fitScore: number;
    rationale: string;
    expectedSalaryRange: string;
    skillsToAcquire: string[];
    topCompanies: string[];
    skillsToUpgrade: Array<{ skillName: string; whyItStandsOut: string }>;
  }>;
  recommendedCompanies: Array<{
    companyName: string;
    fitRationale: string;
    positionsToWatch: string[];
    interviewTips: string;
  }>;
  sampleSummary: string;
  certifications: string[];
}

export function getRoleDomainInfo(jobTitleInput?: string): RoleDomainInfo {
  const title = (jobTitleInput || "").trim().toLowerCase();

  // 1. Culinary, Food Service & Hospitality
  if (/cook|chef|kitchen|culinary|food|baker|pastry|sous|grill|line cook|caterer|barista|butcher|restaurant|dining|hospitality|catering|server|waiter|waitress|bartender/.test(title)) {
    const roleTitle = jobTitleInput || "Cook / Chef";
    return {
      domainName: "Culinary & Food Service",
      industry: "Hospitality & Culinary Arts",
      coreSkills: [
        "Food Safety & Sanitation (HACCP)",
        "Knife Skills & Precision Cutting",
        "Recipe Preparation & Standardization",
        "Station Management & Prep Work",
        "Kitchen Line Operations",
        "Menu Planning & Costing",
        "Inventory & Stock Management",
        "Food Quality & Plating Control",
        "Kitchen Team Coordination",
        "Time & Order Prioritization"
      ],
      recommendedRoles: [
        {
          title: `Head Chef / Kitchen Lead (${roleTitle})`,
          fitScore: 95,
          rationale: `Builds directly on your practical culinary and kitchen line experience in food preparation, knife skills, and station management.`,
          expectedSalaryRange: "$55,000 - $75,000",
          skillsToAcquire: ["Food Cost Control", "Menu Engineering & Design", "Kitchen Team Leadership", "Inventory Optimization"],
          topCompanies: ["Marriott International", "Hilton Hotels & Resorts", "Darden Restaurants", "Compass Group", "Wolfgang Puck Catering"],
          skillsToUpgrade: [
            { skillName: "Advanced Food Safety (ServSafe Manager)", whyItStandsOut: "Demonstrates complete regulatory compliance and kitchen leadership capability." },
            { skillName: "Menu Costing & Yield Management", whyItStandsOut: "Proves ability to maximize kitchen profitability without sacrificing food quality." }
          ]
        },
        {
          title: "Sous Chef / Culinary Operations Supervisor",
          fitScore: 90,
          rationale: `Positions you to oversee daily station execution, quality control, and inventory flow across busy service hours.`,
          expectedSalaryRange: "$48,000 - $65,000",
          skillsToAcquire: ["Staff Scheduling", "Station Efficiency Optimization", "Supplier Relations", "Recipe Development"],
          topCompanies: ["Hyatt Hotels", "Aramark", "Sodexo", "Landmark Hospitality", "Local Fine Dining Establishments"],
          skillsToUpgrade: [
            { skillName: "Culinary Station Efficiency", whyItStandsOut: "Ensures high dish output and consistency during peak dinner service hours." }
          ]
        },
        {
          title: "Food & Beverage Operations Manager",
          fitScore: 84,
          rationale: `Bridges kitchen operations with front-of-house coordination, supplier negotiation, and menu profitability.`,
          expectedSalaryRange: "$60,000 - $85,000",
          skillsToAcquire: ["F&B Labor Cost Analytics", "Vendor Contract Negotiation", "Dining Room & Kitchen Synchronization"],
          topCompanies: ["Four Seasons Hotels", "Vail Resorts", "Carnival Cruise Line", "Brinker International"],
          skillsToUpgrade: [
            { skillName: "Hospitality Cost Control", whyItStandsOut: "Essential for managing operational margins in large-scale food service businesses." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Global Hospitality Groups (Marriott, Hilton, Hyatt)",
          fitRationale: "High-volume hotel kitchens offer structured culinary progression, comprehensive benefits, and international transfer routes.",
          positionsToWatch: ["Lead Line Cook", "Sous Chef", "Kitchen Supervisor", "Culinary Specialist"],
          interviewTips: "Be prepared for a practical cooking assessment or kitchen demonstration. Highlight food safety standards, knife precision, and speed under service pressure."
        },
        {
          companyName: "Premier Dining & Catering Organizations (Compass, Sodexo)",
          fitRationale: "Corporate catering and upscale event spaces value consistency, recipe adherence, and hygiene compliance.",
          positionsToWatch: ["Event Chef", "Catering Lead", "Executive Dining Specialist"],
          interviewTips: "Emphasize order prioritization, multi-station coordination, and waste reduction metrics."
        }
      ],
      sampleSummary: `Dedicated and quality-driven ${roleTitle} with a proven track record of delivering exceptional culinary dishes in high-volume food service environments. Expert in food safety protocols (HACCP), knife techniques, and station prep work. Strong team player committed to maintaining high kitchen standards, ingredient freshness, and customer dining satisfaction.`,
      certifications: ["ServSafe Food Handler / Manager", "HACCP Food Safety Specialist", "Certified Culinarian (ACF)", "Allergen Awareness Certification"]
    };
  }

  // 2. Healthcare & Nursing
  if (/nurse|nursing|medical|doctor|clinical|physician|paramedic|emt|caregiver|health|therapist|pharmacist|dentist|patient|hospital|clinic/.test(title)) {
    const roleTitle = jobTitleInput || "Healthcare Professional / Nurse";
    return {
      domainName: "Healthcare & Medicine",
      industry: "Healthcare & Clinical Services",
      coreSkills: [
        "Patient Assessment & Triage",
        "Vital Signs Monitoring",
        "Medication Administration",
        "Electronic Health Records (EHR / Epic)",
        "Compassionate Patient Care",
        "Infection Control & Safety Protocols",
        "Clinical Documentation",
        "Emergency First Aid & CPR/BLS",
        "Patient & Family Education",
        "Interdisciplinary Team Care"
      ],
      recommendedRoles: [
        {
          title: `Nurse Unit Supervisor / Clinical Coordinator (${roleTitle})`,
          fitScore: 94,
          rationale: `Leverages your hands-on clinical care and patient assessment experience to guide nursing staff and patient flow.`,
          expectedSalaryRange: "$75,000 - $105,000",
          skillsToAcquire: ["Clinical Staff Scheduling", "Patient Flow Optimization", "Advanced Cardiac Life Support (ACLS)", "Quality Improvement"],
          topCompanies: ["Mayo Clinic", "Cleveland Clinic", "Kaiser Permanente", "Johns Hopkins Medicine", "HCA Healthcare"],
          skillsToUpgrade: [
            { skillName: "Advanced Life Support (ACLS)", whyItStandsOut: "Critical for handling complex clinical emergencies and unit leadership." },
            { skillName: "Healthcare Quality Assurance", whyItStandsOut: "Ensures full compliance with medical regulations and patient safety benchmarks." }
          ]
        },
        {
          title: "Healthcare Case Manager / Patient Advocate",
          fitScore: 88,
          rationale: `Combines patient advocacy, care plan development, and discharge planning using your deep medical understanding.`,
          expectedSalaryRange: "$70,000 - $95,000",
          skillsToAcquire: ["Care Plan Coordination", "Insurance Utilization Review", "Community Health Resource Mapping"],
          topCompanies: ["UnitedHealth Group", "Anthem", "Humana", "Elevance Health", "Regional Medical Centers"],
          skillsToUpgrade: [
            { skillName: "Care Management Analytics", whyItStandsOut: "Optimizes patient recovery outcomes and reduces hospital readmission rates." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Premier Medical Centers (Mayo, Cleveland Clinic, Kaiser)",
          fitRationale: "World-class health systems value evidence-based clinical practices, empathetic patient care, and strict safety compliance.",
          positionsToWatch: ["Registered Nurse (RN)", "Clinical Care Coordinator", "Specialty Staff Nurse"],
          interviewTips: "Focus on patient safety scenarios, emergency response examples, and collaborative care experiences."
        }
      ],
      sampleSummary: `Compassionate and highly skilled ${roleTitle} with extensive background in patient assessment, care plan execution, and vital monitoring. Proven ability to thrive under pressure in fast-paced clinical environments while strictly adhering to safety and infection control protocols.`,
      certifications: ["Registered Nurse (RN)", "BLS / CPR Certification", "Advanced Cardiac Life Support (ACLS)", "Certified Case Manager (CCM)"]
    };
  }

  // 3. Transportation, Logistics & Driving
  if (/driver|truck|delivery|chauffeur|courier|transport|logistics|warehouse|fleet|pilot|freight|dispatch/.test(title)) {
    const roleTitle = jobTitleInput || "Driver / Logistics Specialist";
    return {
      domainName: "Transportation & Logistics",
      industry: "Supply Chain & Freight Logistics",
      coreSkills: [
        "Safe Vehicle Operation (CDL)",
        "Route Optimization & GPS Navigation",
        "Defensive Driving Techniques",
        "Vehicle Inspection & Pre-trip Safety",
        "Cargo Handling & Load Distribution",
        "Delivery Schedule & Time Management",
        "Customer Service & Manifest Verification",
        "DOT Safety Compliance & Regulations",
        "Fleet Communication & Dispatching",
        "Maintenance Logging & Reporting"
      ],
      recommendedRoles: [
        {
          title: `Fleet Operations Supervisor (${roleTitle})`,
          fitScore: 93,
          rationale: `Capitalizes on your hands-on driving, route safety, and vehicle inspection expertise to manage vehicle fleets.`,
          expectedSalaryRange: "$60,000 - $85,000",
          skillsToAcquire: ["Fleet Management Software (Telematics)", "Driver Safety Training", "DOT Regulatory Auditing", "Route Planning"],
          topCompanies: ["FedEx", "UPS", "DHL Express", "Amazon Logistics", "JB Hunt Transport"],
          skillsToUpgrade: [
            { skillName: "Fleet Telematics & Route Optimization", whyItStandsOut: "Reduces fuel costs and boosts delivery timeliness across fleet operations." }
          ]
        },
        {
          title: "Logistics Coordinator & Freight Dispatcher",
          fitScore: 87,
          rationale: `Bridges road experience with warehouse coordination, shipment tracking, and carrier scheduling.`,
          expectedSalaryRange: "$52,000 - $72,000",
          skillsToAcquire: ["Warehouse Management Systems (WMS)", "Freight Rate Negotiation", "Shipment Tracking & Tracing"],
          topCompanies: ["XPO Logistics", "C.H. Robinson", "Schneider National", "Old Dominion Freight Line"],
          skillsToUpgrade: [
            { skillName: "Dispatch Operations Software", whyItStandsOut: "Streamlines driver assignment and load matching efficiency." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Global Delivery & Express Carriers (FedEx, UPS, DHL, Amazon)",
          fitRationale: "Leading carriers offer clear career ladders from vehicle operations to station and fleet management.",
          positionsToWatch: ["Commercial Driver", "Fleet Supervisor", "Dispatch Specialist", "Route Coordinator"],
          interviewTips: "Highlight clean driving records, accident prevention records, route efficiency metrics, and customer service delivery."
        }
      ],
      sampleSummary: `Reliable and safety-focused ${roleTitle} with a proven track record of punctual deliveries, error-free route execution, and strict adherence to transportation safety regulations. Skilled in vehicle inspection, cargo securing, and GPS navigation.`,
      certifications: ["Commercial Driver's License (CDL Class A/B)", "HazMat Endorsement", "OSHA Warehouse Safety", "DOT Safety Compliance Certificate"]
    };
  }

  // 4. Education & Teaching
  if (/teacher|educator|instructor|tutor|professor|academic|lecturer|school|curriculum|teaching/.test(title)) {
    const roleTitle = jobTitleInput || "Educator / Teacher";
    return {
      domainName: "Education & Academics",
      industry: "Education & Academic Services",
      coreSkills: [
        "Lesson Planning & Curriculum Design",
        "Classroom Management & Engagement",
        "Student Progress Assessment",
        "Differentiated Learning Strategies",
        "Educational Technology Integration",
        "Parent & Student Communication",
        "Standardized Test Preparation",
        "Subject Matter Mastery",
        "Student Mentorship & Guidance",
        "Academic Program Evaluation"
      ],
      recommendedRoles: [
        {
          title: `Department Head / Lead Educator (${roleTitle})`,
          fitScore: 95,
          rationale: `Builds on your direct classroom instructional success and curriculum mastery to guide teaching teams.`,
          expectedSalaryRange: "$65,000 - $90,000",
          skillsToAcquire: ["Curriculum Mapping", "Teacher Mentorship", "Academic Performance Analytics", "School Budgeting"],
          topCompanies: ["Public School Districts", "Private Educational Academies", "Higher Education Institutions", "K12 Inc."],
          skillsToUpgrade: [
            { skillName: "Curriculum Alignment & Standards", whyItStandsOut: "Demonstrates ability to elevate school-wide test scores and learning outcomes." }
          ]
        },
        {
          title: "Instructional Designer / EdTech Specialist",
          fitScore: 89,
          rationale: `Translates teaching strategies into digital learning modules, online courses, and interactive educational content.`,
          expectedSalaryRange: "$70,000 - $95,000",
          skillsToAcquire: ["E-Learning Tools (Articulate/Canvas)", "Interactive Course Design", "LMS Administration"],
          topCompanies: ["Coursera", "Khan Academy", "Pearson Education", "EdX", "Duolingo"],
          skillsToUpgrade: [
            { skillName: "Digital Curriculum Authoring", whyItStandsOut: "Key requirement for high-growth online learning and corporate training." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Leading Educational Networks & EdTech Organizations",
          fitRationale: "Modern educational employers seek innovative educators adept with digital platforms and student engagement.",
          positionsToWatch: ["Lead Teacher", "Curriculum Specialist", "Academic Coordinator", "E-Learning Author"],
          interviewTips: "Share specific student growth metrics, innovative lesson plans, and classroom engagement strategies."
        }
      ],
      sampleSummary: `Dedicated and engaging ${roleTitle} with a passion for fostering student growth, academic excellence, and inclusive learning environments. Expert in curriculum design, classroom management, and integrating interactive educational technology.`,
      certifications: ["State Teaching License", "Master of Education (M.Ed.)", "Google Certified Educator", "National Board Certification"]
    };
  }

  // 5. Creative, Design & Media
  if (/designer|graphic|ui|ux|artist|illustrator|photographer|video|animator|writer|copywriter|creative|art/.test(title)) {
    const roleTitle = jobTitleInput || "Graphic Designer / Creative";
    return {
      domainName: "Design & Creative Media",
      industry: "Design & Brand Media",
      coreSkills: [
        "Visual Design & Layout Composition",
        "Typography & Color Theory",
        "Adobe Creative Suite (Photoshop, Illustrator, InDesign)",
        "UI/UX Prototyping (Figma / Sketch)",
        "Brand Identity & Style Guidelines",
        "Client Design Brief Interpretation",
        "Creative Concepting & Storyboarding",
        "Digital & Print Media Production",
        "Portfolio Curation & Presentation",
        "Cross-Functional Design Strategy"
      ],
      recommendedRoles: [
        {
          title: `Art Director / Senior Designer (${roleTitle})`,
          fitScore: 94,
          rationale: `Capitalizes on your visual execution and design composition background to direct creative team campaigns.`,
          expectedSalaryRange: "$80,000 - $115,000",
          skillsToAcquire: ["Creative Direction", "Brand Architecture", "Campaign Visual Leadership", "Design Systems"],
          topCompanies: ["Pentagram", "Adobe", "Canva", "Ogilvy", "Publicis Groupe"],
          skillsToUpgrade: [
            { skillName: "Comprehensive Brand System Architecture", whyItStandsOut: "Positions you to lead major global rebrands and multi-channel creative visual direction." }
          ]
        },
        {
          title: "Product Visual & UX Designer",
          fitScore: 90,
          rationale: `Translates graphic composition skills into digital user interface flows, interactive app screens, and design tokens.`,
          expectedSalaryRange: "$85,000 - $125,000",
          skillsToAcquire: ["User Flow Wireframing", "Interactive Prototyping", "Design System Components (Figma)"],
          topCompanies: ["Figma", "Canva", "Airbnb", "Spotify", "Apple"],
          skillsToUpgrade: [
            { skillName: "Design System Architecture", whyItStandsOut: "Critical skill for maintaining visual polish across large software products." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Creative Agencies & Digital Product Studios",
          fitRationale: "Visual agencies value distinctive artistic craft, typography precision, and compelling portfolio work.",
          positionsToWatch: ["Senior Visual Designer", "Art Director", "Brand Strategist", "UX/UI Lead"],
          interviewTips: "Present a clean portfolio showcasing complete design thinking from concept sketching to final polished client deliverables."
        }
      ],
      sampleSummary: `Creative and detail-oriented ${roleTitle} with strong expertise in visual composition, brand identity design, and digital media production. Proficient in Adobe Creative Suite and modern design tools, with a proven history of delivering compelling visual solutions.`,
      certifications: ["Adobe Certified Professional", "Certified UX/UI Designer", "Design Systems Certification"]
    };
  }

  // 6. Sales, Retail & Customer Service
  if (/sales|cashier|retail|customer|account executive|store|clerk|receptionist|teller|merchandiser|associate/.test(title)) {
    const roleTitle = jobTitleInput || "Sales & Retail Associate";
    return {
      domainName: "Retail, Sales & Customer Care",
      industry: "Retail & Commercial Services",
      coreSkills: [
        "Customer Engagement & Service",
        "Point of Sale (POS) Systems Operation",
        "Product Knowledge & Presentation",
        "Sales Negotiation & Closing Techniques",
        "Problem De-escalation & Resolution",
        "Inventory Restocking & Merchandising",
        "Customer Relationship Management (CRM)",
        "Upselling & Order Maximization",
        "Cash Handling & Drawer Balancing",
        "Active Listening & Communication"
      ],
      recommendedRoles: [
        {
          title: `Store Manager / Retail Operations Supervisor (${roleTitle})`,
          fitScore: 95,
          rationale: `Leverages your customer engagement, POS handling, and store floor experience into team management and sales target setting.`,
          expectedSalaryRange: "$50,000 - $72,000",
          skillsToAcquire: ["Store Staff Scheduling", "Sales Revenue Target Tracking", "Inventory Loss Prevention", "Floor Merchandising"],
          topCompanies: ["Apple Retail", "Target", "Nordstrom", "Lululemon", "Nike"],
          skillsToUpgrade: [
            { skillName: "Retail Floor Operations & Performance Tracking", whyItStandsOut: "Proves capability to drive store revenue targets and manage team metrics." }
          ]
        },
        {
          title: "Customer Success / Key Account Manager",
          fitScore: 88,
          rationale: `Transitions direct customer communication into long-term account management, retention, and client satisfaction.`,
          expectedSalaryRange: "$65,000 - $90,000",
          skillsToAcquire: ["CRM System Mastery (Salesforce)", "Account Onboarding", "Client Retention Strategies"],
          topCompanies: ["Salesforce", "HubSpot", "Zendesk", "Toast POS", "Square"],
          skillsToUpgrade: [
            { skillName: "Client Relationship Management", whyItStandsOut: "Key metric for minimizing churn and boosting lifetime customer value." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Leading Retail Brands & Commercial Services",
          fitRationale: "Top consumer brands focus on customer satisfaction, visual merchandising, and floor team leadership.",
          positionsToWatch: ["Store Supervisor", "Sales Lead", "Customer Success Specialist"],
          interviewTips: "Highlight customer satisfaction ratings, sales conversion achievements, and team collaboration examples."
        }
      ],
      sampleSummary: `Customer-focused and results-driven ${roleTitle} with extensive experience in client engagement, POS operations, and product merchandising. Adept at active listening, de-escalating issues, and driving sales growth while delivering outstanding customer satisfaction.`,
      certifications: ["Certified Retail Management Professional (CRMP)", "Salesforce Certified Sales Specialist", "Customer Service Management Certificate"]
    };
  }

  // 7. Skilled Trades & Construction
  if (/electrician|plumber|mechanic|carpenter|welder|technician|maintenance|janitor|cleaner|hvac|mason|contractor|trade/.test(title)) {
    const roleTitle = jobTitleInput || "Skilled Trades Technician";
    return {
      domainName: "Skilled Trades & Construction",
      industry: "Skilled Trades & Facilities Operations",
      coreSkills: [
        "Equipment Inspection & Diagnostics",
        "Blueprint & Schematic Reading",
        "Technical Repair & Maintenance",
        "OSHA Safety Protocols & Compliance",
        "Hand & Power Tool Safety",
        "System Troubleshooting",
        "Jobsite Cleanup & Hazard Mitigation",
        "Preventative Maintenance Scheduling",
        "Material Estimating & Inventory",
        "Quality Workmanship & Standards"
      ],
      recommendedRoles: [
        {
          title: `Lead Master Technician / Jobsite Foreman (${roleTitle})`,
          fitScore: 94,
          rationale: `Capitalizes on your hands-on trade proficiency, equipment diagnostics, and jobsite safety execution.`,
          expectedSalaryRange: "$65,000 - $95,000",
          skillsToAcquire: ["Jobsite Leadership", "Cost & Material Estimating", "Advanced Trade Code Compliance", "Contractor Coordination"],
          topCompanies: ["Turner Construction", "Bechtel", "Fluor Corporation", "Skanska", "Specialty Trade Contractors"],
          skillsToUpgrade: [
            { skillName: "OSHA 30-Hour Safety Certification", whyItStandsOut: "Demonstrates complete jobsite safety oversight capability." }
          ]
        },
        {
          title: "Facilities Maintenance Operations Supervisor",
          fitScore: 89,
          rationale: `Bridges field repairs with commercial building operations, preventative maintenance schedules, and vendor supervision.`,
          expectedSalaryRange: "$60,000 - $88,000",
          skillsToAcquire: ["Computerized Maintenance Management (CMMS)", "HVAC & Electrical Building Systems", "Vendor Contract Oversight"],
          topCompanies: ["CBRE", "JLL (Jones Lang LaSalle)", "Cushman & Wakefield", "Compass Facility Management"],
          skillsToUpgrade: [
            { skillName: "Building Facilities Management", whyItStandsOut: "Highly sought after for managing large commercial properties." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Major Commercial Construction & Facilities Groups",
          fitRationale: "Commercial contractors value safety adherence, code compliance, and reliable technical execution.",
          positionsToWatch: ["Lead Journeyman", "Jobsite Foreman", "Maintenance Supervisor"],
          interviewTips: "Focus on safety records, blueprint reading proficiency, troubleshooting examples, and project completions."
        }
      ],
      sampleSummary: `Reliable and safety-certified ${roleTitle} with a proven track record of diagnosing, repairing, and maintaining technical equipment and systems. Skilled in blueprint reading, system troubleshooting, and strict compliance with OSHA safety standards.`,
      certifications: ["Master Trades License", "OSHA 30-Hour Construction Safety", "EPA Universal Certification (HVAC)", "First Aid / CPR"]
    };
  }

  // 8. Finance, Accounting & Business
  if (/accountant|auditor|finance|financial|banker|bookkeeper|tax|controller|treasury|payroll/.test(title)) {
    const roleTitle = jobTitleInput || "Finance & Accounting Specialist";
    return {
      domainName: "Finance & Accounting",
      industry: "Financial & Corporate Accounting",
      coreSkills: [
        "Financial Reporting & General Ledger",
        "GAAP / IFRS Accounting Standards",
        "Accounts Payable & Receivable (AP/AR)",
        "Budgeting & Financial Forecasting",
        "Tax Compliance & Preparation",
        "Excel Advanced Financial Modeling",
        "Account Reconciliation & Auditing",
        "ERP Systems (SAP / Oracle / QuickBooks)",
        "Internal Controls & Risk Assessment",
        "Financial Variance Analysis"
      ],
      recommendedRoles: [
        {
          title: `Accounting Manager / Controller (${roleTitle})`,
          fitScore: 95,
          rationale: `Directly builds upon your general ledger, financial reporting, and audit compliance background.`,
          expectedSalaryRange: "$90,000 - $130,000",
          skillsToAcquire: ["Corporate Tax Strategy", "Audit Management", "Financial Statement Synthesis", "ERP Administration"],
          topCompanies: ["Deloitte", "PwC", "EY", "KPMG", "JPMorgan Chase"],
          skillsToUpgrade: [
            { skillName: "Certified Public Accountant (CPA) Credential", whyItStandsOut: "The gold standard for accounting leadership and financial governance." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Big 4 Accounting & Financial Institutions",
          fitRationale: "Leading firms value rigorous numerical accuracy, compliance standards, and financial analysis.",
          positionsToWatch: ["Senior Accountant", "Audit Lead", "Financial Analyst", "Tax Specialist"],
          interviewTips: "Highlight accounting software proficiency, audit success rates, and budget variance modeling."
        }
      ],
      sampleSummary: `Detail-oriented ${roleTitle} with expertise in financial reporting, general ledger maintenance, and tax compliance. Proficient in advanced Excel and accounting ERP software, with a strong commitment to GAAP accuracy and numerical integrity.`,
      certifications: ["Certified Public Accountant (CPA)", "Chartered Financial Analyst (CFA)", "Certified Management Accountant (CMA)"]
    };
  }

  // 9. IT & Software Engineering
  if (/software|developer|programmer|full stack|frontend|backend|data engineer|devops|cloud|cybersecurity|code|coder|tech/.test(title)) {
    const roleTitle = jobTitleInput || "Software Engineer / Developer";
    return {
      domainName: "Software & Technology",
      industry: "Software & Cloud Systems",
      coreSkills: [
        "Software Architecture & Code Implementation",
        "Algorithmic Problem Solving",
        "Full-Stack Web Development",
        "Version Control & Code Review (Git)",
        "Database Architecture & SQL/NoSQL",
        "API Integration & Microservices",
        "Cloud Deployment (AWS / GCP / Azure)",
        "Automated Testing & CI/CD Pipelines",
        "System Optimization & Performance Tuning",
        "Technical Documentation & Clean Code"
      ],
      recommendedRoles: [
        {
          title: `Senior Software Engineer (${roleTitle})`,
          fitScore: 95,
          rationale: `Capitalizes directly on your programming, code architecture, and system building experience.`,
          expectedSalaryRange: "$120,000 - $165,000",
          skillsToAcquire: ["Distributed Systems Architecture", "System Design Patterns", "Technical Leadership & Code Mentorship"],
          topCompanies: ["Google", "Stripe", "Microsoft", "Amazon", "Meta"],
          skillsToUpgrade: [
            { skillName: "High-Scale Distributed Systems", whyItStandsOut: "Essential for engineering scalable enterprise cloud applications." }
          ]
        }
      ],
      recommendedCompanies: [
        {
          companyName: "Leading Cloud & Tech Companies (Google, Stripe, Microsoft)",
          fitRationale: "Premier software enterprises value clean code standards, system design proficiency, and problem-solving.",
          positionsToWatch: ["Senior Developer", "Staff Engineer", "Solutions Architect"],
          interviewTips: "Prepare for live coding assessments, system design interviews, and behavioral STAR stories."
        }
      ],
      sampleSummary: `Innovative and results-driven ${roleTitle} with a strong background in building scalable web applications and cloud architectures. Proficient in modern programming frameworks, clean code practices, and system optimization.`,
      certifications: ["AWS Certified Solutions Architect", "Google Cloud Professional Developer", "Certified Kubernetes Administrator (CKA)"]
    };
  }

  // 10. General Operations & Administrative Management (Default for any other role)
  const roleTitle = jobTitleInput || "Professional Specialist";
  return {
    domainName: "Operations & General Management",
    industry: "Business Operations & Professional Services",
    coreSkills: [
      "Task Prioritization & Scheduling",
      "Operational Workflow Optimization",
      "Quality Assurance & Standards Compliance",
      "Cross-Functional Communication",
      "Problem Solving & De-escalation",
      "Documentation & Record Keeping",
      "Vendor & Client Relations",
      "Team Coordination & Support",
      "Time & Resource Management",
      "Process Execution & Continuous Improvement"
    ],
    recommendedRoles: [
      {
        title: `Operations Lead / Team Supervisor (${roleTitle})`,
        fitScore: 92,
        rationale: `Leverages your operational execution, task coordination, and domain experience into team leadership.`,
        expectedSalaryRange: "$60,000 - $85,000",
        skillsToAcquire: ["Operational Workflow Analytics", "Team Performance Supervision", "Resource Allocation Strategy"],
        topCompanies: ["Fortune 500 Enterprises", "Commercial Services Hubs", "Regional Business Networks"],
        skillsToUpgrade: [
          { skillName: "Process Optimization & Efficiency Analytics", whyItStandsOut: "Proves capability to reduce operational bottlenecks and cut overhead." }
        ]
      }
    ],
    recommendedCompanies: [
      {
        companyName: "Corporate Operations & Commercial Organizations",
        fitRationale: "Commercial businesses seek adaptable team members with strong organization, communication, and process standards.",
        positionsToWatch: ["Operations Supervisor", "Team Lead", "Specialist Coordinator"],
        interviewTips: "Highlight workflow efficiency improvements, task organization, and reliability metrics."
      }
    ],
    sampleSummary: `Resourceful and results-oriented ${roleTitle} with a strong foundation in process execution, workflow optimization, and team collaboration. Dedicated to maintaining high quality standards, clear communication, and operational efficiency.`,
    certifications: ["Lean Six Sigma Green Belt", "Certified Associate in Project Management (CAPM)", "Professional Administrative Certification"]
  };
}
