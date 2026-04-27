export interface ExamLink {
  label: string
  href: string
}

export interface Exam {
  id: string
  name: string
  fullForm: string
  streams: string[]
  conductingBody: string
  eligibility: string
  frequency: string
  examMonths: string
  officialSite: string
  mockTests: ExamLink[]
  resources: ExamLink[]
  featured: boolean
}

export const streams = [
  'All',
  'Engineering',
  'Medical',
  'Management',
  'Law',
  'Design',
  'Agriculture',
  'Commerce',
] as const

export type Stream = (typeof streams)[number]

export const exams: Exam[] = [
  // ── Engineering ──────────────────────────────────────────────────────────
  {
    id: 'jee-main',
    name: 'JEE Main',
    fullForm: 'Joint Entrance Examination (Main)',
    streams: ['engineering'],
    conductingBody: 'National Testing Agency (NTA)',
    eligibility: 'Class 12 with PCM, min. 75% (65% for SC/ST)',
    frequency: 'Twice a year',
    examMonths: 'January & April',
    officialSite: 'https://jeemain.nta.ac.in',
    mockTests: [
      { label: 'NTA Official Practice Papers', href: 'https://nta.ac.in/PracticePaper' },
      { label: 'Embibe Free JEE Mock Tests', href: 'https://www.embibe.com/exams/jee-main' },
      { label: 'Testbook JEE Main Mock Tests', href: 'https://testbook.com/jee-main' },
    ],
    resources: [
      { label: 'NCERT Books (Physics, Chemistry, Maths)', href: 'https://ncert.nic.in' },
      { label: 'JEE Main Official Information Bulletin', href: 'https://jeemain.nta.ac.in' },
      { label: 'Previous Year Question Papers', href: 'https://jeemain.nta.ac.in' },
    ],
    featured: true,
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    fullForm: 'Joint Entrance Examination (Advanced)',
    streams: ['engineering'],
    conductingBody: 'IIT (Rotational — IIT Madras in 2025)',
    eligibility: 'Top 2.5 lakh JEE Main qualifiers; max. 2 attempts',
    frequency: 'Annual',
    examMonths: 'May',
    officialSite: 'https://jeeadv.ac.in',
    mockTests: [
      { label: 'JEE Advanced Mock Test — IIT Portal', href: 'https://jeeadv.ac.in' },
      { label: 'Embibe JEE Advanced Practice', href: 'https://www.embibe.com/exams/jee-advanced' },
    ],
    resources: [
      { label: 'JEE Advanced Syllabus', href: 'https://jeeadv.ac.in' },
      { label: 'NCERT + HC Verma Concepts of Physics', href: 'https://ncert.nic.in' },
      { label: 'Allen Study Resources', href: 'https://www.allen.ac.in' },
    ],
    featured: true,
  },
  {
    id: 'bitsat',
    name: 'BITSAT',
    fullForm: 'BITS Admission Test',
    streams: ['engineering'],
    conductingBody: 'BITS Pilani',
    eligibility: 'Class 12 with PCM, min. 75% aggregate',
    frequency: 'Annual',
    examMonths: 'May – June',
    officialSite: 'https://www.bitsadmission.com',
    mockTests: [
      { label: 'BITS Official Practice Test Portal', href: 'https://www.bitsadmission.com' },
      { label: 'Testbook BITSAT Mock Tests', href: 'https://testbook.com/bitsat' },
    ],
    resources: [
      { label: 'BITSAT Official Syllabus', href: 'https://www.bitsadmission.com' },
      { label: 'NCERT Physics & Chemistry', href: 'https://ncert.nic.in' },
    ],
    featured: false,
  },
  {
    id: 'viteee',
    name: 'VITEEE',
    fullForm: 'Vellore Institute of Technology Engineering Entrance Exam',
    streams: ['engineering'],
    conductingBody: 'VIT University',
    eligibility: 'Class 12 with PCM/PCB, min. 60% aggregate',
    frequency: 'Annual',
    examMonths: 'April',
    officialSite: 'https://viteee.vit.ac.in',
    mockTests: [
      { label: 'VIT Official Mock Test', href: 'https://viteee.vit.ac.in' },
      { label: 'Embibe VITEEE Practice Tests', href: 'https://www.embibe.com/exams/viteee' },
    ],
    resources: [
      { label: 'VITEEE Syllabus & Pattern', href: 'https://viteee.vit.ac.in' },
    ],
    featured: false,
  },
  {
    id: 'srmjeee',
    name: 'SRMJEEE',
    fullForm: 'SRM Joint Engineering Entrance Exam',
    streams: ['engineering'],
    conductingBody: 'SRM Institute of Science and Technology',
    eligibility: 'Class 12 with PCM or PCB, min. 60%',
    frequency: 'Annual',
    examMonths: 'April',
    officialSite: 'https://www.srmist.edu.in',
    mockTests: [
      { label: 'SRM Official Practice Portal', href: 'https://www.srmist.edu.in' },
    ],
    resources: [
      { label: 'SRMJEEE Syllabus & Important Dates', href: 'https://www.srmist.edu.in' },
    ],
    featured: false,
  },
  // ── Medical ───────────────────────────────────────────────────────────────
  {
    id: 'neet-ug',
    name: 'NEET-UG',
    fullForm: 'National Eligibility cum Entrance Test (Undergraduate)',
    streams: ['medical'],
    conductingBody: 'National Testing Agency (NTA)',
    eligibility: 'Class 12 with PCB, min. 50% (40% for OBC/SC/ST)',
    frequency: 'Annual',
    examMonths: 'May',
    officialSite: 'https://neet.nta.nic.in',
    mockTests: [
      { label: 'NTA Official Practice Papers', href: 'https://nta.ac.in/PracticePaper' },
      { label: 'Embibe NEET Practice Tests', href: 'https://www.embibe.com/exams/neet' },
      { label: 'Testbook NEET Mock Tests', href: 'https://testbook.com/neet' },
    ],
    resources: [
      { label: 'NCERT Biology, Physics & Chemistry', href: 'https://ncert.nic.in' },
      { label: 'NEET Official Syllabus 2025', href: 'https://neet.nta.nic.in' },
      { label: 'NEET Previous Year Papers', href: 'https://neet.nta.nic.in' },
    ],
    featured: true,
  },
  {
    id: 'neet-pg',
    name: 'NEET-PG',
    fullForm: 'National Eligibility cum Entrance Test (Postgraduate)',
    streams: ['medical'],
    conductingBody: 'National Board of Examinations (NBE)',
    eligibility: 'MBBS degree from a recognised institution',
    frequency: 'Annual',
    examMonths: 'March',
    officialSite: 'https://natboard.edu.in',
    mockTests: [
      { label: 'Marrow NEET-PG Mock Tests', href: 'https://marrow.com' },
      { label: 'PrepLadder Practice Tests', href: 'https://www.prepladder.com' },
    ],
    resources: [
      { label: 'NEET-PG Official Syllabus', href: 'https://natboard.edu.in' },
      { label: 'Marrow Study Platform', href: 'https://marrow.com' },
    ],
    featured: false,
  },
  // ── Management ────────────────────────────────────────────────────────────
  {
    id: 'cat',
    name: 'CAT',
    fullForm: 'Common Admission Test',
    streams: ['management'],
    conductingBody: 'IIMs (Rotating — IIM Calcutta in 2024)',
    eligibility: "Bachelor's degree with min. 50% (45% for SC/ST/PwD)",
    frequency: 'Annual',
    examMonths: 'November',
    officialSite: 'https://iimcat.ac.in',
    mockTests: [
      { label: 'IIM Official Free Mock CAT', href: 'https://iimcat.ac.in' },
      { label: 'Testbook CAT Mock Tests', href: 'https://testbook.com/cat' },
      { label: 'Embibe CAT Practice Tests', href: 'https://www.embibe.com/exams/cat' },
    ],
    resources: [
      { label: 'CAT Official Syllabus & Pattern', href: 'https://iimcat.ac.in' },
      { label: 'CAT Previous Year Papers', href: 'https://iimcat.ac.in' },
    ],
    featured: true,
  },
  {
    id: 'xat',
    name: 'XAT',
    fullForm: 'Xavier Aptitude Test',
    streams: ['management'],
    conductingBody: 'XLRI, Jamshedpur',
    eligibility: "Bachelor's degree in any discipline",
    frequency: 'Annual',
    examMonths: 'January',
    officialSite: 'https://xatonline.in',
    mockTests: [
      { label: 'XAT Official Mock Test', href: 'https://xatonline.in' },
      { label: 'Testbook XAT Practice', href: 'https://testbook.com/xat' },
    ],
    resources: [
      { label: 'XAT Official Syllabus', href: 'https://xatonline.in' },
    ],
    featured: false,
  },
  {
    id: 'mat',
    name: 'MAT',
    fullForm: 'Management Aptitude Test',
    streams: ['management'],
    conductingBody: 'All India Management Association (AIMA)',
    eligibility: "Bachelor's degree in any discipline",
    frequency: 'Four times a year',
    examMonths: 'Feb, May, Sep & Dec',
    officialSite: 'https://mat.aima.in',
    mockTests: [
      { label: 'Embibe MAT Mock Tests', href: 'https://www.embibe.com/exams/mat' },
      { label: 'Testbook MAT Practice', href: 'https://testbook.com/mat' },
    ],
    resources: [
      { label: 'MAT Syllabus & Exam Pattern', href: 'https://mat.aima.in' },
    ],
    featured: false,
  },
  {
    id: 'snap',
    name: 'SNAP',
    fullForm: 'Symbiosis National Aptitude Test',
    streams: ['management'],
    conductingBody: 'Symbiosis International University',
    eligibility: "Bachelor's degree with min. 50%",
    frequency: 'Annual (3 test slots)',
    examMonths: 'December',
    officialSite: 'https://www.snaptest.org',
    mockTests: [
      { label: 'SNAP Official Mock Test', href: 'https://www.snaptest.org' },
    ],
    resources: [
      { label: 'SNAP Syllabus & Pattern', href: 'https://www.snaptest.org' },
    ],
    featured: false,
  },
  {
    id: 'nmat',
    name: 'NMAT',
    fullForm: 'NMIMS Management Aptitude Test',
    streams: ['management'],
    conductingBody: 'Graduate Management Admission Council (GMAC)',
    eligibility: "Bachelor's degree with min. 50%",
    frequency: '75-day window, up to 3 attempts',
    examMonths: 'October – December',
    officialSite: 'https://www.nmat.org.in',
    mockTests: [
      { label: 'NMAT Official Practice Test', href: 'https://www.nmat.org.in' },
    ],
    resources: [
      { label: 'NMAT Syllabus & Preparation Guide', href: 'https://www.nmat.org.in' },
    ],
    featured: false,
  },
  {
    id: 'iift',
    name: 'IIFT',
    fullForm: 'Indian Institute of Foreign Trade Entrance Exam',
    streams: ['management'],
    conductingBody: 'National Testing Agency (NTA) for IIFT',
    eligibility: "Bachelor's degree with min. 50%",
    frequency: 'Annual',
    examMonths: 'December',
    officialSite: 'https://iift.nta.nic.in',
    mockTests: [
      { label: 'NTA Official Practice Papers', href: 'https://nta.ac.in/PracticePaper' },
    ],
    resources: [
      { label: 'IIFT Official Syllabus', href: 'https://iift.nta.nic.in' },
    ],
    featured: false,
  },
  // ── Law ───────────────────────────────────────────────────────────────────
  {
    id: 'clat',
    name: 'CLAT',
    fullForm: 'Common Law Admission Test',
    streams: ['law'],
    conductingBody: 'Consortium of National Law Universities',
    eligibility: 'Class 12 with min. 45% (40% for SC/ST)',
    frequency: 'Annual',
    examMonths: 'December',
    officialSite: 'https://consortiumofnlus.ac.in',
    mockTests: [
      { label: 'Testbook CLAT Mock Tests', href: 'https://testbook.com/clat' },
      { label: 'Embibe CLAT Practice', href: 'https://www.embibe.com/exams/clat' },
    ],
    resources: [
      { label: 'CLAT Official Syllabus 2025', href: 'https://consortiumofnlus.ac.in' },
      { label: 'CLAT Previous Year Papers', href: 'https://consortiumofnlus.ac.in' },
    ],
    featured: true,
  },
  {
    id: 'ailet',
    name: 'AILET',
    fullForm: 'All India Law Entrance Test',
    streams: ['law'],
    conductingBody: 'National Law University, Delhi',
    eligibility: 'Class 12 with min. 50% (45% for SC/ST)',
    frequency: 'Annual',
    examMonths: 'December',
    officialSite: 'https://www.nludelhi.ac.in',
    mockTests: [
      { label: 'Testbook AILET Practice Tests', href: 'https://testbook.com/ailet' },
    ],
    resources: [
      { label: 'AILET Official Syllabus', href: 'https://www.nludelhi.ac.in' },
    ],
    featured: false,
  },
  {
    id: 'lsat-india',
    name: 'LSAT India',
    fullForm: 'Law School Admission Test – India',
    streams: ['law'],
    conductingBody: 'Law School Admission Council (LSAC)',
    eligibility: 'Class 12 (UG Law) or Graduation (PG Law)',
    frequency: 'Annual',
    examMonths: 'January',
    officialSite: 'https://discoverlaw.in',
    mockTests: [
      { label: 'LSAC Official Practice Questions', href: 'https://discoverlaw.in' },
    ],
    resources: [
      { label: 'LSAT India Preparation Guide', href: 'https://discoverlaw.in' },
    ],
    featured: false,
  },
  // ── Design ────────────────────────────────────────────────────────────────
  {
    id: 'nift',
    name: 'NIFT',
    fullForm: 'National Institute of Fashion Technology Entrance Test',
    streams: ['design'],
    conductingBody: 'National Institute of Fashion Technology',
    eligibility: 'Class 12 (UG) or Graduation (PG)',
    frequency: 'Annual',
    examMonths: 'January',
    officialSite: 'https://nift.ac.in',
    mockTests: [
      { label: 'NIFT CAT Official Practice Papers', href: 'https://nift.ac.in' },
      { label: 'Testbook NIFT Mock Tests', href: 'https://testbook.com/nift' },
    ],
    resources: [
      { label: 'NIFT Syllabus & Entrance Pattern', href: 'https://nift.ac.in' },
      { label: 'NIFT Portfolio Preparation Guide', href: 'https://nift.ac.in' },
    ],
    featured: true,
  },
  {
    id: 'nid-dat',
    name: 'NID DAT',
    fullForm: 'National Institute of Design — Design Aptitude Test',
    streams: ['design'],
    conductingBody: 'National Institute of Design',
    eligibility: 'Class 12 (BDes) or Graduation (MDes)',
    frequency: 'Annual',
    examMonths: 'January',
    officialSite: 'https://admissions.nid.edu',
    mockTests: [
      { label: 'NID Official Sample Papers', href: 'https://admissions.nid.edu' },
    ],
    resources: [
      { label: 'NID DAT Syllabus & Guidelines', href: 'https://admissions.nid.edu' },
    ],
    featured: false,
  },
  {
    id: 'uceed',
    name: 'UCEED',
    fullForm: 'Undergraduate Common Entrance Exam for Design',
    streams: ['design'],
    conductingBody: 'IIT Bombay',
    eligibility: 'Class 12 with min. 60%',
    frequency: 'Annual',
    examMonths: 'January',
    officialSite: 'https://www.uceed.iitb.ac.in',
    mockTests: [
      { label: 'UCEED Official Mock Test — IIT Bombay', href: 'https://www.uceed.iitb.ac.in' },
    ],
    resources: [
      { label: 'UCEED Syllabus & Sample Papers', href: 'https://www.uceed.iitb.ac.in' },
    ],
    featured: false,
  },
  {
    id: 'ceed',
    name: 'CEED',
    fullForm: 'Common Entrance Exam for Design (PG)',
    streams: ['design'],
    conductingBody: 'IIT Bombay',
    eligibility: "Bachelor's degree in any discipline",
    frequency: 'Annual',
    examMonths: 'January',
    officialSite: 'https://www.ceed.iitb.ac.in',
    mockTests: [
      { label: 'CEED Official Mock Test — IIT Bombay', href: 'https://www.ceed.iitb.ac.in' },
    ],
    resources: [
      { label: 'CEED Syllabus & Past Papers', href: 'https://www.ceed.iitb.ac.in' },
    ],
    featured: false,
  },
  // ── Agriculture ───────────────────────────────────────────────────────────
  {
    id: 'icar-aieea',
    name: 'ICAR AIEEA',
    fullForm: 'ICAR All India Entrance Examination for Admission',
    streams: ['agriculture'],
    conductingBody: 'National Testing Agency (NTA) for ICAR',
    eligibility: 'Class 12 with PCB/PCM/Agriculture, min. 50%',
    frequency: 'Annual',
    examMonths: 'June',
    officialSite: 'https://icar.nta.ac.in',
    mockTests: [
      { label: 'NTA Official Practice Papers', href: 'https://nta.ac.in/PracticePaper' },
      { label: 'Testbook ICAR AIEEA Practice', href: 'https://testbook.com/icar-aieea' },
    ],
    resources: [
      { label: 'ICAR AIEEA Official Syllabus', href: 'https://icar.nta.ac.in' },
      { label: 'NCERT Agriculture & Biology', href: 'https://ncert.nic.in' },
    ],
    featured: false,
  },
  // ── Commerce ──────────────────────────────────────────────────────────────
  {
    id: 'ca-foundation',
    name: 'CA Foundation',
    fullForm: 'Chartered Accountancy Foundation Examination',
    streams: ['commerce'],
    conductingBody: 'Institute of Chartered Accountants of India (ICAI)',
    eligibility: 'Class 12 passed (registration allowed after Class 10)',
    frequency: 'Twice a year',
    examMonths: 'May & November',
    officialSite: 'https://www.icai.org',
    mockTests: [
      { label: 'ICAI Official Mock Test Papers', href: 'https://www.icai.org' },
      { label: 'ICAI Practice Papers Portal', href: 'https://www.icai.org' },
    ],
    resources: [
      { label: 'ICAI Official Study Material', href: 'https://www.icai.org' },
      { label: 'CA Foundation Syllabus 2025', href: 'https://www.icai.org' },
    ],
    featured: false,
  },
]
