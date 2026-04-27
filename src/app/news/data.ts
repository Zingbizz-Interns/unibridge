export type Category =
  | 'admissions'
  | 'policy'
  | 'rankings'
  | 'scholarships'
  | 'career'
  | 'study-tips'

export const categories = [
  'All',
  'Admissions',
  'Policy',
  'Rankings',
  'Scholarships',
  'Career',
  'Study Tips',
] as const

export type CategoryFilter = (typeof categories)[number]

export interface Article {
  slug: string
  title: string
  excerpt: string
  category: Category
  publishedAt: string
  readTime: string
  source?: string
  externalUrl?: string
  content?: string[]
  featured: boolean
  tags: string[]
}

export const articles: Article[] = [
  {
    slug: 'nirf-rankings-2024',
    title: 'NIRF Rankings 2024: IIT Madras tops overall list for sixth year running',
    excerpt:
      'The Ministry of Education released NIRF 2024 on August 12. IIT Madras retained the top spot in the Overall category for the sixth consecutive year, with IISc leading Universities and Research.',
    category: 'rankings',
    publishedAt: '2024-08-12',
    readTime: '5 min read',
    featured: true,
    tags: ['NIRF', 'IIT Madras', 'Rankings', '2024'],
    content: [
      'The Ministry of Education released the National Institutional Ranking Framework (NIRF) Rankings 2024 on August 12, 2024. IIT Madras retained its position as the top institution in the Overall category for the sixth consecutive year, continuing its dominance in Indian higher education.',
      'In the University category, the Indian Institute of Science (IISc) Bengaluru secured the first rank, followed by JNU and Jadavpur University. IISc also topped the Research category, underscoring its position as India\'s premier research institution.',
      'AIIMS New Delhi maintained its position as the top medical institution in the Medical category. In Management, IIM Ahmedabad retained its first rank, with IIM Bombay and IIM Kozhikode following closely. NLU Bengaluru (National Law School of India University) topped the Law category.',
      'The NIRF 2024 rankings covered 13 categories including Overall, Universities, Colleges, Research, Engineering, Management, Pharmacy, Medical, Law, Architecture, Agriculture, Innovation, and Open Universities. Over 10,000 institutions participated in the ranking process this year.',
      'Among notable movers, Amrita Vishwa Vidyapeetham improved its overall rank significantly, entering the top 10 Overall for the first time. VIT Vellore continued to hold strong positions in Engineering and Overall categories.',
      'Rankings are based on five broad parameters: Teaching, Learning & Resources (30%), Research and Professional Practice (30%), Graduation Outcomes (20%), Outreach and Inclusivity (10%), and Peer Perception (10%).',
    ],
  },
  {
    slug: 'jee-main-2025-session1-results',
    title: 'JEE Main 2025 Session 1: 14 students score 100 percentile',
    excerpt:
      'NTA announced JEE Main 2025 Session 1 results in February 2025. Fourteen candidates achieved a perfect 100 NTA score in Paper 1, with Rajasthan and Telangana producing the most toppers.',
    category: 'admissions',
    publishedAt: '2025-02-12',
    readTime: '4 min read',
    featured: false,
    tags: ['JEE Main', 'NTA', '2025', 'Results'],
    content: [
      'The National Testing Agency (NTA) declared the results for JEE Main 2025 Session 1 in February 2025. The exam was conducted from January 22 to 31, 2025, in Computer Based Test (CBT) mode across hundreds of centres in India and abroad.',
      'Fourteen candidates achieved a perfect 100 NTA percentile score in Paper 1 (B.E./B.Tech), the highest possible score. Rajasthan and Telangana were among the states with the most 100 percentile scorers, continuing a trend from previous years.',
      'Approximately 13.09 lakh candidates registered for Session 1, of which around 12.3 lakh appeared for the examination. Paper 1 tests candidates in Physics, Chemistry, and Mathematics across 90 questions (75 to be attempted) for a total of 300 marks.',
      'JEE Main 2025 Session 2 was scheduled for April 2025. The better of the two session NTA scores is used for merit list preparation. The top 2,50,000 qualifiers from JEE Main become eligible to appear for JEE Advanced 2025.',
      'Candidates can download their scorecards from the official NTA JEE Main portal at jeemain.nta.ac.in. The NTA score is normalised across multiple shifts using the percentile method to ensure fairness.',
    ],
  },
  {
    slug: 'cuet-ug-2025-schedule',
    title: 'CUET UG 2025: NTA announces schedule and pattern changes',
    excerpt:
      'NTA has announced the schedule for CUET UG 2025. The Common University Entrance Test is mandatory for admissions to all 45 Central Universities and over 260 participating universities across India.',
    category: 'admissions',
    publishedAt: '2025-01-20',
    readTime: '4 min read',
    featured: false,
    tags: ['CUET', 'NTA', '2025', 'Central Universities'],
    content: [
      'The National Testing Agency (NTA) announced the schedule and updated pattern for the Common University Entrance Test Undergraduate (CUET UG) 2025. CUET is the mandatory gateway for admissions to all 45 Central Universities in India, in addition to over 260 participating State, Deemed, and Private Universities.',
      'CUET UG 2025 is structured into three sections: Section 1A covers 13 languages (compulsory for Central University applicants), Section 1B covers 20 additional languages, and Section 2 covers 27 domain-specific subjects. Section 3 is the General Test for programmes not requiring domain subjects.',
      'The examination is conducted in Computer Based Test (CBT) mode. Candidates can choose up to six domain subjects and one language in a single sitting. The duration of each test is 45 minutes with 50 questions (40 to be attempted).',
      'CUET 2025 was scheduled to be held between May and June 2025. The registration window typically opens in February. Results are expected within a few weeks of the last examination date.',
      'Over 15 lakh candidates appeared for CUET UG in 2024, making it one of the largest entrance examinations in India by registration volume. The scores are accepted for BA, B.Sc., B.Com., BBA, and integrated programmes.',
    ],
  },
  {
    slug: 'nta-reforms-2024',
    title: 'NTA Reforms: Government overhauls testing agency after 2024 controversy',
    excerpt:
      'Following the NEET UG 2024 paper leak controversy, the Government of India announced sweeping reforms to the National Testing Agency, including a new Director General and a High-Level Committee review.',
    category: 'policy',
    publishedAt: '2024-07-25',
    readTime: '6 min read',
    featured: false,
    tags: ['NTA', 'NEET', 'Reform', 'Policy', '2024'],
    content: [
      'The National Testing Agency (NTA) faced its most significant crisis in mid-2024 following widespread allegations of a paper leak in the NEET UG 2024 examination, which was held on May 5, 2024. The controversy led to nationwide student protests, petitions in the Supreme Court, and intense parliamentary debate.',
      'The Government of India responded by announcing a series of structural reforms. K. Sanjay Murthy, a senior IAS officer, was appointed as the new Director General of NTA, replacing Subodh Kumar Singh who was removed from the post. The Ministry of Education also announced a comprehensive review of NTA\'s examination processes.',
      'A High-Level Committee was constituted under Dr. K. Radhakrishnan, former Chairman of ISRO and former Chairperson of the Board of Governors of IIT Kanpur, to recommend reforms in the examination process, data security protocols, and the overall functioning of NTA.',
      'The CBI was handed over the investigation of the alleged paper leak. Multiple arrests were made in connection with the leak of question papers. The Supreme Court of India heard several petitions but declined to order a fresh NEET UG 2024 examination, citing that the evidence did not point to a systemic, nationwide breach.',
      'The High-Level Committee submitted its report recommending stricter protocols for paper printing and distribution, decentralised question paper delivery via encrypted digital means, enhanced CCTV surveillance at examination centres, and a complete overhaul of NTA\'s internal audit mechanisms.',
      'NEET UG 2025 is being conducted under the revised framework with tightened security measures, including biometric verification at all centres and tamper-proof seals for question paper packets.',
    ],
  },
  {
    slug: 'nep-2020-four-year-ug',
    title: 'NEP 2020 Four-Year UG Programs: What students need to know',
    excerpt:
      'The National Education Policy 2020 introduced a flexible four-year undergraduate programme with multiple entry and exit options. Here is a complete guide to how the new framework works.',
    category: 'policy',
    publishedAt: '2024-09-10',
    readTime: '7 min read',
    featured: false,
    tags: ['NEP 2020', 'UG Programs', 'Academic Bank of Credits', 'UGC'],
    content: [
      'The National Education Policy (NEP) 2020, approved by the Union Cabinet on July 29, 2020, brought the most comprehensive overhaul to India\'s higher education structure since the Kothari Commission of 1964-66. One of its most significant changes is the introduction of a flexible four-year undergraduate (UG) programme.',
      'Under the new framework, students who join a four-year UG programme can exit after completing one year and receive a Certificate, after two years and receive a Diploma, or after three years and receive a Bachelor\'s degree. Students who complete all four years receive a Bachelor\'s degree with Honours or a Bachelor\'s degree with Research if they complete a research dissertation in the fourth year.',
      'The Academic Bank of Credits (ABC) is the technological backbone of this flexibility. Launched by UGC, the ABC allows students to store credits earned from any registered Higher Education Institution (HEI) in a digital repository linked to their DigiLocker account. As of 2024, over 900 HEIs are registered on the ABC platform.',
      'Most Central Universities including Delhi University, Hyderabad University, and Jawaharlal Nehru University implemented the four-year UG structure from the 2022-23 academic session. Several State Universities began implementation from 2023-24.',
      'For students, the key implication is that the multiple exit option provides a safety net. A student who exits after year 2 with a Diploma can re-enter the same or a different institution to complete the remaining years, with credits transferred seamlessly through ABC.',
      'UGC has also mandated a multidisciplinary approach in the new UG structure. Students are required to take courses outside their major discipline — including vocational courses, community engagement, and environmental education — as part of their degree requirements.',
    ],
  },
  {
    slug: 'neet-ug-2025-dates',
    title: 'NEET UG 2025: Key dates, eligibility and what changed',
    excerpt:
      'NEET UG 2025 is the single gateway for admission to MBBS, BDS, BAMS, BHMS, BVSc and other medical programmes across India. Here are the key dates, eligibility criteria, and changes for 2025.',
    category: 'admissions',
    publishedAt: '2025-01-15',
    readTime: '5 min read',
    featured: false,
    tags: ['NEET', 'Medical', 'NTA', '2025', 'MBBS'],
    content: [
      'NEET UG (National Eligibility cum Entrance Test Undergraduate) 2025 is the single window entrance examination for admission to MBBS, BDS, BAMS, BUMS, BHMS, BVSc & AH, and other medical programmes across all government and private medical colleges in India.',
      'The examination is conducted by the National Testing Agency (NTA) in pen-and-paper (OMR) mode. NEET UG 2025 was scheduled for May 2025. Approximately 24 lakh candidates appear for NEET UG each year, making it one of the most competitive entrance examinations in the world.',
      'Eligibility: Candidates must have passed Class 12 or equivalent with Physics, Chemistry, and Biology/Biotechnology as core subjects. The minimum aggregate in PCB is 50% for General/EWS category (40% for SC/ST/OBC). The minimum age requirement is 17 years as of December 31 of the admission year. There is no upper age limit as per the Supreme Court\'s 2022 ruling.',
      'The question paper consists of 200 questions (180 to be attempted) from Physics (50Q), Chemistry (50Q), and Biology — Zoology & Botany (100Q). Each correct answer carries 4 marks and each incorrect answer results in a deduction of 1 mark. Maximum marks: 720.',
      'Changes for 2025: NTA implemented stricter examination security protocols including biometric attendance, CCTV recording, tamper-proof question paper sealing, and enhanced observer deployment following the 2024 controversy.',
      'Results are announced approximately 20 days after the examination. Counselling is conducted by the Medical Counselling Committee (MCC) for All India Quota seats and by respective state counselling authorities for state quota seats.',
    ],
  },
  {
    slug: 'cat-2024-results',
    title: 'CAT 2024 Results: IIM Calcutta releases percentile scores',
    excerpt:
      'CAT 2024 was conducted by IIM Calcutta on November 24, 2024. Around 3.28 lakh candidates appeared. Results were declared in January 2025 and are used for admissions to all 21 IIMs and over 1,200 B-schools.',
    category: 'admissions',
    publishedAt: '2025-01-06',
    readTime: '3 min read',
    featured: false,
    source: 'IIM Calcutta',
    externalUrl: 'https://iimcat.ac.in',
    tags: ['CAT', 'IIM', 'MBA', '2024', 'Results'],
  },
  {
    slug: 'qs-rankings-2025',
    title: 'QS World Rankings 2025: IIT Bombay leads Indian universities at 118th',
    excerpt:
      'The QS World University Rankings 2025, released in April 2024, placed IIT Bombay at 118th globally — the highest rank among all Indian institutions. India had 46 universities in the list, its highest ever count.',
    category: 'rankings',
    publishedAt: '2024-04-25',
    readTime: '4 min read',
    featured: false,
    tags: ['QS Rankings', 'IIT Bombay', 'World Rankings', '2025'],
    content: [
      'Quacquarelli Symonds (QS) released the QS World University Rankings 2025 in April 2024. IIT Bombay emerged as the highest-ranked Indian institution at 118th globally, a significant improvement from its 149th position in the QS 2024 rankings.',
      'IIT Delhi secured the second spot among Indian universities at 150th globally, followed by IISc Bengaluru at 211th. IIT Kharagpur (222nd), IIT Madras (227th), and IIT Kanpur (263rd) also featured prominently in the top 300.',
      'India had 46 universities in the QS 2025 rankings — the highest ever count for the country, up from 45 in the previous edition. MIT (Massachusetts Institute of Technology) retained the top position globally for the 13th consecutive year.',
      'QS rankings are evaluated on six parameters: Academic Reputation (40%), Employer Reputation (10%), Faculty-Student Ratio (20%), Citations per Faculty (20%), International Faculty Ratio (5%), and International Student Ratio (5%). Indian institutions have historically scored lower on internationalisation metrics.',
      'The improvement in IIT Bombay\'s ranking is attributed to enhanced research output and improved employer reputation scores. For the first time, QS 2025 also included sustainability indicators, where IIT Bombay and IISc featured in the top 300 of the QS Sustainability Rankings.',
    ],
  },
  {
    slug: 'top-engineering-branches-2025',
    title: 'Top engineering branches to pick in 2025: AI, Data Science and beyond',
    excerpt:
      'With rapid technological change reshaping the job market, choosing the right engineering specialisation matters more than ever. A guide to the most in-demand branches for students entering college in 2025.',
    category: 'career',
    publishedAt: '2025-02-01',
    readTime: '6 min read',
    featured: false,
    tags: ['Engineering', 'Career', 'AI', 'Data Science', '2025'],
    content: [
      'For students appearing in JEE Main and JEE Advanced 2025, branch selection is one of the most consequential decisions they will make. While Computer Science has dominated preferences for over a decade, the landscape is shifting with specialised programmes gaining significant ground.',
      'Computer Science Engineering (CSE) with specialisations in Artificial Intelligence and Machine Learning remains the most sought-after branch across IITs, NITs, and private institutions. The Indian government\'s National AI Strategy and increasing AI adoption ensure robust placement opportunities. Average packages at top IITs for CSE/AI roles have crossed ₹30 LPA.',
      'Data Science and Engineering (DSE) is an emerging branch offered by IIT Madras, IIT Palakkad, BITS Pilani, and several NITs. The branch combines statistics, programming, and domain knowledge. Data roles — data scientist, ML engineer, data analyst — are among the fastest growing in India.',
      'Electronics and Computer Engineering bridges hardware and software. With the semiconductor push under India Semiconductor Mission and the establishment of new chip fabs (Tata Electronics in Dholera, CG Power-Renesas in Sanand), VLSI and embedded systems roles are seeing a strong revival.',
      'Aerospace Engineering from IITs (Bombay, Madras, Kanpur, Kharagpur) and IIST Thiruvananthapuram feeds India\'s growing aerospace industry — ISRO, HAL, private space startups like AgniKul Cosmos and Skyroot Aerospace, and global MRO firms establishing India operations.',
      'Biomedical Engineering is a niche but high-potential branch combining engineering with life sciences. Graduates find roles in medical device companies, hospital biomedical departments, and research institutions. IIT Bombay, IIT Madras, and IIT Hyderabad offer strong programmes.',
      'The key advice for 2025 aspirants: choose a branch based on interest and aptitude, not just placement records. A motivated student in a less-hyped branch will outperform a disengaged student in CSE. Consider the college\'s industry connections, lab infrastructure, and alumni network alongside the branch name.',
    ],
  },
  {
    slug: 'pm-yasasvi-scholarship-2024',
    title: 'PM YASASVI Scholarship 2024: Eligibility, amount and how to apply',
    excerpt:
      'The PM Young Achievers Scholarship Award Scheme for Vibrant India (YASASVI) provides ₹75,000–₹1,25,000 per year to students from OBC, EBC, and DNT categories. Selection is through the NTA-conducted YET.',
    category: 'scholarships',
    publishedAt: '2024-08-05',
    readTime: '5 min read',
    featured: false,
    tags: ['Scholarship', 'YASASVI', 'OBC', 'NTA', 'Government'],
    content: [
      'The PM YASASVI (Young Achievers Scholarship Award Scheme for Vibrant India) is a Government of India scholarship administered by the Ministry of Social Justice and Empowerment and implemented through the National Testing Agency (NTA). It targets students from Other Backward Classes (OBC), Economically Backward Classes (EBC), and De-notified, Nomadic and Semi-Nomadic Tribes (DNT) categories.',
      'Scholarship Amount: Students in Class 9 and 10 receive ₹75,000 per year, while students in Class 11 and 12 receive ₹1,25,000 per year. The scholarship covers tuition fees, hostel charges (if applicable), and other educational expenses.',
      'Eligibility: Candidates must belong to OBC, EBC, or DNT category. The annual family income must not exceed ₹2.5 lakh. Candidates must be studying in Class 9 or Class 11 in schools recognised under the Right to Education Act.',
      'Selection Process: Selection is based on the YASASVI Entrance Test (YET), a 2.5-hour computer-based examination conducted by NTA. The test covers Mathematics, Science, and Social Science for Class 9 applicants, and Physics, Chemistry, Mathematics/Biology for Class 11 applicants.',
      'How to Apply: Applications are submitted through the National Scholarship Portal (scholarships.gov.in). Register, fill in academic and personal details, upload required documents (caste certificate, income certificate, Aadhaar, mark sheet), and fill the examination form on the NTA YASASVI portal.',
      'The scheme aims to ensure that economic constraints do not become a barrier to quality education for meritorious students from backward communities. Scholarship holders must maintain satisfactory academic progress as reported by their institutions annually.',
    ],
  },
  {
    slug: 'ugc-academic-bank-of-credits',
    title: "UGC's Academic Bank of Credits (ABC): Everything students need to know",
    excerpt:
      'The Academic Bank of Credits (ABC), launched by UGC under NEP 2020, allows students to store and transfer credits across registered Higher Education Institutions via DigiLocker. Over 900 HEIs are now registered.',
    category: 'policy',
    publishedAt: '2024-10-01',
    readTime: '5 min read',
    featured: false,
    tags: ['UGC', 'ABC', 'NEP 2020', 'Credits', 'Higher Education'],
    content: [
      'The Academic Bank of Credits (ABC) is a national-level digital repository established by the University Grants Commission (UGC) as a core component of the National Education Policy (NEP) 2020 implementation. It enables students to accumulate, store, and transfer academic credits earned from registered Higher Education Institutions (HEIs) across India.',
      'How it works: When a student completes a course at any ABC-registered institution, the institution uploads the credits and grade details to the student\'s ABC account. The account is linked to the student\'s DigiLocker profile via Aadhaar-based authentication. Students can view and share their credit history from the ABC portal (abc.gov.in).',
      'Key benefits: The ABC enables the multiple entry and exit framework of NEP 2020. A student who exits a UG programme after Year 1 retains their credits in the bank and can re-enter after a gap without repeating completed courses. Students can also earn credits from multiple institutions simultaneously and count them toward their degree.',
      'As of 2024, over 900 HEIs are registered on the ABC platform, including all Central Universities, most IITs, NITs, and a growing number of State Universities and private institutions.',
      'Limitations: Not all courses at all institutions are automatically credit-banked — the institution must actively upload credits. The transfer of credits is subject to the receiving institution\'s credit recognition policy, which can vary significantly. The ABC is most effective within a network of institutions that have formal credit transfer agreements.',
      'UGC has mandated that all universities transitioning to the four-year UG structure under NEP 2020 must integrate with the ABC platform. The goal is to make ABC the default credit management system for all Indian HEIs by 2025-26.',
    ],
  },
  {
    slug: 'clat-2025-schedule',
    title: 'CLAT 2025: Consortium of NLUs releases official schedule',
    excerpt:
      'CLAT 2025 was conducted by the Consortium of National Law Universities in December 2024. It is the gateway to 24 National Law Universities for BA LLB and LLM programmes.',
    category: 'admissions',
    publishedAt: '2024-09-15',
    readTime: '3 min read',
    featured: false,
    source: 'Consortium of NLUs',
    externalUrl: 'https://consortiumofnlus.ac.in',
    tags: ['CLAT', 'Law', 'NLU', '2025', 'Admissions'],
  },
  {
    slug: 'cuet-2025-preparation-guide',
    title: 'How to prepare for CUET 2025: Strategy, syllabus and free resources',
    excerpt:
      'CUET UG 2025 is the gateway to over 260 universities. This preparation guide covers the exam pattern, subject-wise strategy, and the best free resources to help you score high across all three sections.',
    category: 'study-tips',
    publishedAt: '2025-01-25',
    readTime: '8 min read',
    featured: false,
    tags: ['CUET', 'Study Tips', 'Preparation', '2025'],
    content: [
      'The Common University Entrance Test (CUET UG) 2025 is the single admission gateway to all 45 Central Universities and over 260 other participating universities. With over 15 lakh candidates appearing annually, a structured preparation strategy is essential to stand out.',
      'Understanding the paper structure is the first step. CUET has three sections: Section 1A (languages — 13 available, attempt 1-3), Section 1B (additional languages — 20 available, optional), Section 2 (domain subjects — 27 available, attempt up to 6), and Section 3 (General Test — for programmes not requiring domain subjects). Each test is 45 minutes with 50 questions (40 to be attempted). Marking: +5 for correct, -1 for incorrect.',
      'For Language tests (Section 1A/1B), focus on reading comprehension, vocabulary, and grammar based on the NCERT English and language textbooks. For domain subjects (Section 2), the CUET syllabus is aligned with Class 12 NCERT books. Your board exam preparation is directly transferable to CUET if you studied NCERT thoroughly.',
      'The General Test (Section 3) covers General Knowledge, Current Affairs, General Mental Ability, Numerical Ability, Quantitative Reasoning, and Logical and Analytical Reasoning. Current affairs from the past 6 months before the exam are typically tested. Reading one newspaper daily and solving one mock paper per week is a practical approach.',
      'Free resources: The NTA official website (nta.ac.in) provides sample papers and previous year question papers. DIKSHA platform (diksha.gov.in) by NCERT has free e-content for all Class 12 subjects. NCERT textbooks are freely downloadable in PDF at ncert.nic.in.',
      'Time management tip: In the last two weeks before the exam, focus entirely on timed mock tests — aim to complete each 45-minute section in 40 minutes to leave buffer for review. The CUET score is used for merit lists separately by each university — check the programme-specific requirements of each university you are applying to.',
    ],
  },
  {
    slug: 'mba-vs-pgdm-2025',
    title: 'MBA vs PGDM: Which is better for your career in 2025?',
    excerpt:
      'MBA and PGDM are both management qualifications but differ in structure and regulatory recognition. Understanding the difference helps you choose the right institution and qualification for your career goals.',
    category: 'career',
    publishedAt: '2025-03-01',
    readTime: '6 min read',
    featured: false,
    tags: ['MBA', 'PGDM', 'Management', 'Career', 'IIM'],
    content: [
      'The MBA (Master of Business Administration) and PGDM (Post Graduate Diploma in Management) are the two primary postgraduate management qualifications in India. The confusion between them is one of the most common questions among management aspirants. The difference is structural and regulatory — not necessarily one of quality.',
      'MBA is a degree programme awarded by universities that are recognised by the University Grants Commission (UGC). Any college affiliated to a university and approved by AICTE can offer an MBA. The curriculum is largely standardised according to the affiliating university\'s syllabus, and the degree is directly equivalent to a Master\'s degree for government job purposes.',
      'PGDM is a diploma awarded by autonomous business schools approved by AICTE but not affiliated to any university. All IIMs award PGDM, not MBA (with the exception of IIM Ahmedabad\'s Fellow Programme in Management). XLRI Jamshedpur, SP Jain, MDI Gurgaon, and NMIMS also award PGDM. These institutions design their own curricula, which are updated more frequently to match industry needs.',
      'Is PGDM equivalent to MBA? Yes — for all practical purposes in the private sector, a PGDM from an AICTE-approved institution is considered equivalent to an MBA. AICTE has issued equivalency certificates for PGDM programmes. For government jobs that require an MBA degree specifically, always check individual job notifications.',
      'Which is better in 2025? The institution matters far more than the degree type. A PGDM from IIM Ahmedabad or XLRI carries significantly more value than an MBA from a low-ranked affiliated college. Selection criteria, curriculum rigour, faculty quality, and placement record are the real determinants.',
      'Admission routes: Top PGDM programmes (IIMs, XLRI, MDI, IIFT) accept CAT/XAT/GMAT scores. MBA programmes at universities typically accept MAT, CMAT, or state-level tests. Shortlisting is followed by Written Ability Test (WAT) and Personal Interview (PI) rounds at most top institutions.',
    ],
  },
  {
    slug: 'national-scholarship-portal-2024',
    title: 'National Scholarship Portal 2024-25: All schemes you can apply to',
    excerpt:
      'The National Scholarship Portal (scholarships.gov.in) is the single-window platform for all Government of India scholarship schemes. Here is a complete list of central schemes open for 2024-25 and how to apply.',
    category: 'scholarships',
    publishedAt: '2024-10-15',
    readTime: '6 min read',
    featured: false,
    tags: ['NSP', 'Scholarship', 'Government', '2024', 'National Scholarship Portal'],
    content: [
      'The National Scholarship Portal (NSP), available at scholarships.gov.in, is the Government of India\'s unified digital platform for scholarship application, processing, and disbursal. It hosts scholarships from multiple ministries and is the mandatory channel for all central government scholarship schemes.',
      'Central Sector Scheme of Scholarships for College and University Students (CSSS): Administered by the Ministry of Education, it offers ₹10,000 per year for undergraduates and ₹20,000 for postgraduate students. Eligibility: top 20 percentile in Class 12 board exams, family income below ₹8 lakh per year. Approximately 82,000 new scholarships are awarded annually.',
      'National Means-cum-Merit Scholarship (NMMS): For Class 8 students in government schools. ₹12,000 per year (₹1,000 per month) for continuation through Class 12. Selection is through a state-level entrance examination. Over 1 lakh scholarships are awarded annually across India.',
      'PM Scholarship Scheme for CAPF and RPF Personnel: Provides scholarships to dependent wards of Central Armed Police Forces and Railway Protection Force personnel. ₹3,000 per month for boys and ₹3,500 per month for girls for professional degree programmes.',
      'Top Class Education Scheme for SC Students: For students from Scheduled Caste backgrounds pursuing professional programmes at top-ranked institutions (IITs, IIMs, NITs, AIIMS, Law Schools, etc.). Full fee reimbursement plus ₹2,220 per month living allowance. Administered by the Ministry of Social Justice and Empowerment.',
      'How to apply: Register on scholarships.gov.in using your Aadhaar number. Select your scheme, fill the application, and upload required documents — mark sheets, income certificate, caste certificate (if applicable), and bank account details seeded with Aadhaar. Disbursement is directly to the beneficiary\'s bank account via Direct Benefit Transfer (DBT).',
    ],
  },
  {
    slug: 'gate-2025-iit-roorkee',
    title: 'GATE 2025: IIT Roorkee conducts exam across four days in February',
    excerpt:
      'GATE 2025 was organised by IIT Roorkee and conducted on February 1, 2, 15, and 16, 2025. The exam covered 30 papers and is the gateway to M.Tech/PhD admissions at IITs and NITs, and PSU recruitment.',
    category: 'admissions',
    publishedAt: '2025-02-18',
    readTime: '4 min read',
    featured: false,
    tags: ['GATE', 'IIT Roorkee', '2025', 'M.Tech', 'PSU'],
    content: [
      'The Graduate Aptitude Test in Engineering (GATE) 2025 was organised by IIT Roorkee on behalf of the National Coordination Board (NCB) – GATE, Department of Higher Education, Ministry of Education. The examination was conducted on February 1, 2, 15, and 16, 2025.',
      'GATE 2025 covered 30 test papers spanning engineering disciplines (CE, CS, EC, EE, ME, CH, IN, etc.), science subjects (CY, MA, PH, ST, XL), humanities and social sciences (XH), and the Data Science and Artificial Intelligence (DA) paper introduced in recent years.',
      'Approximately 8.5 lakh candidates registered for GATE 2025. The examination is in Computer Based Test (CBT) mode. Each paper is 3 hours long with 65 questions for a total of 100 marks. Questions include Multiple Choice Questions (MCQ), Multiple Select Questions (MSQ), and Numerical Answer Type (NAT) questions.',
      'GATE scores are valid for three years from the year of qualification. They are used for admission to M.Tech/ME/M.S./PhD programmes at IITs, NITs, IISc, and other centrally funded institutions. Several PSUs including BHEL, IOCL, NTPC, PGCIL, BARC, and GAIL use GATE scores for recruiting engineering graduates into officer-grade posts.',
      'GATE 2025 results were announced in March 2025. Qualified candidates can apply to M.Tech programmes through COAP (Common Offer Acceptance Portal) used by IITs for coordinated admissions. Candidates who qualify are also eligible for the MHRD Scholarship of ₹12,400 per month during their M.Tech programme at government institutions.',
    ],
  },
  {
    slug: 'top-private-engineering-colleges',
    title: "India's top 10 private engineering colleges after the IITs",
    excerpt:
      'For students who miss the IIT cut-off, several private and deemed engineering institutions offer excellent education and placements. Here are the top 10 ranked by NIRF 2024 and placement outcomes.',
    category: 'rankings',
    publishedAt: '2024-09-01',
    readTime: '5 min read',
    featured: false,
    tags: ['Rankings', 'Private Colleges', 'Engineering', 'NIRF', 'Placements'],
    content: [
      'The IITs are the pinnacle of engineering education in India, but with approximately 17,000 seats across all 23 IITs and over 13 lakh JEE Main aspirants, the vast majority of engineering students attend other institutions. Several private and autonomous institutions offer education and placement outcomes that rival many lower-ranked IITs.',
      'BITS Pilani: Consistently ranked in the top engineering institutions (NIRF 2024 Overall rank: 18, Engineering rank: 5). Known for its Practice School programme that places students in industry for extended internships. Admissions via BITSAT. Strong alumni network across global tech companies.',
      'VIT Vellore: NIRF 2024 Engineering rank: 11. One of India\'s largest private engineering universities with strong industry collaboration. Admissions via VITEEE. Average package for CSE graduates from VIT has been in the ₹8-10 LPA range, with top recruiters including Infosys, Wipro, and tech startups.',
      'Manipal Institute of Technology (MIT Manipal): Part of Manipal Academy of Higher Education. Strong in ECE, CSE, and Mechanical Engineering. Known for industry-integrated programmes and placement record. Admissions via MET (Manipal Entrance Test) and JEE Main scores.',
      'SRM Institute of Science and Technology: Multiple campuses (Kattankulathur, Ramapuram, Vadapalani, Delhi NCR). Large intake with diverse specialisations. Admissions via SRMJEEE.',
      'Thapar Institute of Engineering and Technology, Patiala: A deemed university known for research output and placements. Strong in CSE, Mechanical, and Chemical Engineering. Accepts JEE Main scores for admission.',
      'Other institutions worth considering: PSG College of Technology (Coimbatore), RV College of Engineering (Bengaluru), Amrita Vishwa Vidyapeetham, KIIT Bhubaneswar, and PES University (Bengaluru). Each has distinct strengths — research output, location, industry access, or specific branch excellence. Always check NIRF rankings, NBA accreditation, and recent placement statistics before deciding.',
    ],
  },
  {
    slug: 'inspire-scholarship-science',
    title: 'INSPIRE Scholarship: Win ₹80,000/year for pursuing science at undergraduate level',
    excerpt:
      'The DST-INSPIRE Scholarship for Higher Education (SHE) awards ₹80,000 annually to students in the top 1% of their Class 12 board exam who pursue Natural and Basic Sciences at the undergraduate level.',
    category: 'scholarships',
    publishedAt: '2024-11-01',
    readTime: '5 min read',
    featured: false,
    tags: ['INSPIRE', 'DST', 'Science', 'Scholarship', 'B.Sc'],
    content: [
      'The INSPIRE (Innovation in Science Pursuit for Inspired Research) Scholarship for Higher Education (SHE) is a flagship scholarship programme of the Department of Science and Technology (DST), Government of India. It is designed to attract bright students to pursue undergraduate studies in Natural and Basic Sciences.',
      'Scholarship value: ₹80,000 per year, comprising ₹60,000 per year as scholarship and ₹20,000 per year as a summer attachment fee to support research immersion activities. The scholarship is renewable each year subject to satisfactory academic progress.',
      'Eligibility — Board exam criterion: Candidates must be in the top 1% of successful candidates in their Class 12 board examination from any recognised board (CBSE, ISC, state boards). This means if your board had 10 lakh successful candidates, you need to be in the top 10,000.',
      'Eligibility — Programme criterion: The candidate must be pursuing a B.Sc. / B.S. / Int. M.Sc. / Int. M.S. programme in Natural Sciences (Physics, Chemistry, Mathematics, Biology, Statistics, Geology, Astrophysics, Astronomy, Electronics, Botany, Zoology, Biochemistry, Microbiology, etc.). Engineering, Medicine, and Technology programmes are not eligible.',
      'Eligibility — Admission criterion: Candidates selected through JEE Main, NEET, NTSE, or International Olympiad programmes are directly eligible. Students admitted through a national or state-level competitive examination to BSc or integrated MSc programmes at recognised institutions also qualify.',
      'How to apply: Apply on the official INSPIRE portal (online.dst.gov.in/inspire) after securing admission. Upload Class 12 marksheet, admit card, merit certificate from the board, and admission letter. Applications are typically accepted between July and October for the incoming academic year. Scholarship is disbursed directly to the student\'s bank account.',
    ],
  },
  {
    slug: 'jee-advanced-2025-iit-kanpur',
    title: 'JEE Advanced 2025: IIT Kanpur is the organising institute',
    excerpt:
      'IIT Kanpur is the organising institute for JEE Advanced 2025 — the sole gateway to all 23 IITs. Only the top 2,50,000 JEE Main qualifiers are eligible to register for this highly competitive examination.',
    category: 'admissions',
    publishedAt: '2025-02-25',
    readTime: '4 min read',
    featured: false,
    tags: ['JEE Advanced', 'IIT Kanpur', 'IIT', '2025', 'Admissions'],
    content: [
      'IIT Kanpur was designated as the organising institute for JEE Advanced 2025. The Joint Entrance Examination (Advanced) is the second stage of the IIT admission process and the sole gateway for admission to undergraduate programmes (B.Tech, B.S., Dual Degree, Integrated M.Tech, Integrated M.Sc.) at all 23 Indian Institutes of Technology and IISc Bengaluru (for B.S. programme).',
      'Eligibility: Only candidates who qualify in JEE Main 2025 (Paper 1) and rank within the top 2,50,000 (including all categories) are eligible to register. Candidates must have been born on or after October 1, 2000 (5-year relaxation for SC/ST/PwD). Candidates who have previously been admitted to an IIT are not eligible under most conditions.',
      'Exam structure: JEE Advanced consists of two papers — Paper 1 and Paper 2 — each of 3 hours duration. Both papers are mandatory. Each paper covers Physics, Chemistry, and Mathematics. Question types include single-correct MCQs, multiple-correct MCQs, numerical answer type, and matching-type questions, with varying marking schemes including negative marking.',
      'JEE Advanced 2025 was scheduled to be held in May 2025, approximately 2-3 weeks after the JEE Main Session 2 results. The Computer Based Test format, introduced in 2018, continues for JEE Advanced 2025.',
      'Results and counselling: JEE Advanced 2025 results were expected in June 2025. The Joint Seat Allocation Authority (JoSAA) conducts counselling for IITs using JEE Advanced ranks, and for NITs, IIITs, and GFTIs using JEE Main ranks across multiple rounds of choice filling and seat allocation.',
      'With approximately 17,385 undergraduate seats across all 23 IITs in 2024, and around 1.8 lakh candidates appearing for JEE Advanced each year, the effective acceptance rate is approximately 10%, making it one of the most selective undergraduate engineering examinations globally.',
    ],
  },
  {
    slug: 'board-exam-entrance-balance',
    title: 'How to balance board exams and entrance prep without burning out',
    excerpt:
      'Class 12 students face the dual challenge of scoring well in board exams while simultaneously preparing for JEE, NEET, and CUET. Here is a practical strategy to manage both without sacrificing either.',
    category: 'study-tips',
    publishedAt: '2025-01-10',
    readTime: '7 min read',
    featured: false,
    tags: ['Study Tips', 'Board Exams', 'JEE', 'NEET', 'CUET', 'Time Management'],
    content: [
      'One of the most common sources of anxiety for Class 12 students is the apparent conflict between two preparation tracks: board exams (CBSE, ISC, or state boards) and competitive entrance exams (JEE, NEET, CUET). With the right strategy, these tracks are largely complementary, not conflicting.',
      'Understand the overlap: The syllabus for CBSE Class 12 Physics, Chemistry, Mathematics, and Biology is the foundation for JEE Main, NEET UG, and CUET domain subjects. If you master NCERT thoroughly, you are simultaneously preparing for boards and the first level of every major entrance exam. JEE Advanced and NEET require deeper problem-solving skills, but the conceptual base is identical.',
      'Build a unified study schedule: Rather than having separate "board prep time" and "entrance prep time," build a unified subject-wise schedule. Spend the first pass of each topic mastering NCERT — this covers board requirements. Then spend a second pass on problem sets and previous year entrance questions for the same topic. This avoids repetition and is more time-efficient.',
      'Board exams are not optional effort: For CUET, minimum eligibility is typically 50% in Class 12 (varies by university and programme). For IIT/NIT admission, candidates need 75% in Class 12 (65% for SC/ST). A poor board result can close doors to CUET-based admissions even if your entrance score is high.',
      'Calendar awareness: CBSE and ISC board examinations typically run from February to April. JEE Main Session 1 is in January, Session 2 in April. NEET UG is typically in May. CUET UG is in May-June. January to March is peak simultaneous preparation time. Plan for this crunch period well in advance.',
      'Managing burnout: Study for 6-8 focused hours per day rather than 12+ unfocused hours. Take one half-day off per week completely. Physical exercise for 30 minutes daily measurably improves cognitive function and retention. Sleep 7-8 hours — sleep consolidates memory. Cutting sleep to "get more hours" is counterproductive after a few days.',
      'Use mock tests strategically: In the last 6 weeks before any examination, shift from learning new content to full-length mock tests under timed conditions. Analyse every mistake. The pattern of errors reveals gaps more precisely than any syllabus review. Do not attempt new mock tests the night before an exam — revise your own error log instead.',
    ],
  },
]
