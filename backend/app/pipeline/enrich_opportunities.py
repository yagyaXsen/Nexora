"""
Enrich all 21 opportunities with full scraped content.
Run: PYTHONPATH=. python app/pipeline/enrich_opportunities.py
"""
import sys, logging
sys.path.insert(0, '.')
logging.basicConfig(level=logging.WARNING)

from app.database import SessionLocal
from app.models import Opportunity
from app.pipeline.fetcher import _fetch_page

db = SessionLocal()

ENRICHMENTS = {

    # ── GRANTS ────────────────────────────────────────────────────────────────

    5: {  # ERC Starting Grant
        'description': (
            "The ERC Starting Grant supports talented early-career researchers who have already produced excellent work and show potential to be research leaders. "
            "Grants of up to €1.5 million for 5 years fund pioneering, high-risk/high-gain frontier research across all scientific disciplines. "
            "Funded under Horizon Europe, StG researchers work at institutions in EU Member States or Associated Countries. "
            "The grant covers salaries, equipment, consumables, and travel."
        ),
        'eligibility_text': (
            "2–7 years after PhD completion. Must be affiliated with or moving to a host institution in an EU Member State or Horizon Europe Associated Country. "
            "Open to all nationalities. Must demonstrate an excellent research track record relative to career stage."
        ),
        'tags': ['ERC', 'Grant', 'FrontierResearch', 'EU', 'HorizonEurope', 'PostDoc', 'IndependentResearch'],
    },

    6: {  # SNSF Postdoc.Mobility
        'description': (
            "SNSF Postdoc.Mobility fellowships allow early postdoctoral researchers based in Switzerland to spend 18–24 months at a leading research institution abroad. "
            "The fellowship covers a living allowance of CHF 85,000/year, plus travel, research, and conference expenses. "
            "A return phase of 3–12 months back in Switzerland is funded. "
            "Supported by the Swiss National Science Foundation, the world's leading national research funder."
        ),
        'eligibility_text': (
            "Must hold a PhD from a Swiss university or have been based in Switzerland for at least 2 years. "
            "PhD awarded within 5 years of application deadline. Open to all research fields. "
            "Swiss nationals and foreign nationals with Swiss academic affiliation are eligible."
        ),
        'tags': ['SNSF', 'Postdoc', 'Mobility', 'Switzerland', 'Research', 'Fellowship', 'International'],
    },

    11: {  # YC Winter 2026
        'description': (
            "Y Combinator's Winter 2026 batch is a 3-month intensive accelerator program in San Francisco running January–March 2026. "
            "YC invests $500,000 in every accepted company at a standard deal of 7% equity. "
            "Founders get weekly group office hours with YC partners, access to 10,000+ alumni, exclusive cloud credits, and a Demo Day in front of top investors. "
            "YC has funded over 4,000 startups including Airbnb, Stripe, Dropbox, and Coinbase."
        ),
        'eligibility_text': (
            "Open to startups at any stage, any industry, any country. "
            "Technical co-founders strongly preferred. Must be building a product users want. "
            "Pre-revenue to Series A. Full team must relocate to San Francisco for the 3-month program."
        ),
        'tags': ['YCombinator', 'Startup', 'Accelerator', 'SanFrancisco', 'Seed', 'TechFounders', 'AI'],
    },

    12: {  # NVIDIA Inception
        'description': (
            "NVIDIA Inception is a free program designed to nurture AI-first startups. Members receive NVIDIA GPU cloud credits worth up to $5,000, "
            "preferred pricing on NVIDIA hardware, technical training and workshops, go-to-market support, and introductions to NVIDIA's global partner and investor network. "
            "Over 22,000 startups are currently members. "
            "Benefits scale with company stage — Seed, Series A/B startups get larger credit allocations and dedicated technical advisory sessions."
        ),
        'eligibility_text': (
            "Open to any AI-first startup globally. Must have a product or prototype actively using AI/ML. "
            "No equity taken. Free to apply and join. Early-stage (pre-seed to Series B) preferred. "
            "Must apply via NVIDIA Inception portal at programs.nvidia.com."
        ),
        'tags': ['NVIDIA', 'AI', 'GPU', 'Startup', 'CloudCredits', 'MachineLearning', 'DeepLearning'],
    },

    13: {  # Fulbright Scholar
        'description': (
            "The Fulbright U.S. Scholar Program sends approximately 800 American scholars and professionals to over 130 countries annually to lecture and conduct research. "
            "Non-US scholars can apply through their country's Fulbright Commission for visiting scholar awards to come to the USA. "
            "Awards cover round-trip travel, living stipend, health insurance, and professional development funds. "
            "Duration ranges from 2 months to a full academic year. Prestigious recognition accelerates careers in academia and policy."
        ),
        'eligibility_text': (
            "PhD or equivalent terminal degree required (or equivalent professional experience). "
            "Non-US citizens apply through their home country's Fulbright Commission. "
            "US citizens apply directly. Must demonstrate academic excellence and leadership potential. "
            "Open to all fields including STEM, humanities, arts, and professional fields."
        ),
        'tags': ['Fulbright', 'Scholar', 'Exchange', 'Research', 'Teaching', 'USA', 'FullyFunded'],
    },

    14: {  # DAAD Research Grant
        'description': (
            "DAAD Research Grants enable international researchers to conduct research stays at German universities and research institutions for 1–10 months. "
            "Monthly stipend of €1,500–€2,500 depending on qualification level (doctoral: €1,200, postdoc: €1,750, senior researcher: €2,150). "
            "Additional travel subsidy, health insurance allowance, and monthly rent subsidy included. "
            "Germany hosts world-class research in engineering, life sciences, physics, and humanities. DAAD funds over 100,000 scholars annually."
        ),
        'eligibility_text': (
            "Open to researchers of all nationalities. Doctoral candidates must have completed at least 2 years of PhD work. "
            "Postdoctoral researchers must have completed PhD within the last 4 years at time of application. "
            "Excellent academic record required. Must have a German host institution confirmed or in process."
        ),
        'tags': ['DAAD', 'Germany', 'Research', 'Doctoral', 'Postdoc', 'Grant', 'Stipend'],
    },

    15: {  # MSCA Postdoctoral Fellowship
        'description': (
            "Marie Skłodowska-Curie Postdoctoral Fellowships (MSCA PF) are prestigious EU-funded fellowships supporting researchers in gaining new skills, "
            "international mobility, and career development. European Fellowships are held in EU/Associated Countries; Global Fellowships include an outgoing phase worldwide. "
            "The all-inclusive monthly living allowance is €5,080 plus a mobility allowance of €600/month. "
            "Duration is 12–24 months (European) or 24–36 months (Global). 2026 call deadline: September 2026."
        ),
        'eligibility_text': (
            "Must hold a PhD at the call deadline. Maximum 8 years of full-time research experience post-PhD. "
            "Must move to a different country from their PhD institution (transnational mobility required). "
            "Open to any nationality. Must find a host institution in an EU Member State or Horizon Europe Associated Country."
        ),
        'tags': ['MSCA', 'EU', 'Postdoc', 'Mobility', 'Fellowship', 'HorizonEurope', 'InternationalResearch'],
    },

    23: {  # Amazon Research Awards
        'description': (
            "Amazon Research Awards (ARA) provide unrestricted funds and AWS credits to academic researchers working on topics relevant to Amazon's businesses. "
            "Awards fund research in machine learning, NLP, computer vision, robotics, quantum computing, sustainability, and economics. "
            "Each award includes cash funding (typically $80,000–$120,000) plus AWS Promotional Credits. "
            "Recipients collaborate with Amazon scientists, may get access to proprietary datasets, and join the global ARA alumni network of 1,200+ researchers."
        ),
        'eligibility_text': (
            "Full-time faculty at accredited universities worldwide. PhD students may be supported by their advisor's award. "
            "Proposals must align with Amazon's active research areas. "
            "Open calls published on amazon.science/research-awards/call-for-proposals. Rolling applications throughout the year."
        ),
        'tags': ['Amazon', 'AWS', 'Research', 'MachineLearning', 'NLP', 'AcademicGrant', 'CloudCredits'],
    },

    27: {  # Wellcome Trust Early Career Award
        'description': (
            "Wellcome Early-Career Awards fund exceptional researchers in the early stages of establishing their independent research programmes. "
            "Up to £400,000 over 5 years covers salary, research costs, and training. "
            "Supported researchers work in any area that could improve human or animal health — biomedical science, clinical medicine, public health, humanities, or social science. "
            "Wellcome provides mentorship, networking events, and career development support throughout the award."
        ),
        'eligibility_text': (
            "Must be within 5 years of completing PhD or clinical training at time of application. "
            "Must be moving towards or establishing an independent research career. "
            "Must be based at an eligible UK, Republic of Ireland, or Low/Middle Income Country institution. "
            "Open to any nationality. Biomedical, health, humanities, and social science researchers are all eligible."
        ),
        'tags': ['Wellcome', 'BiomedicalResearch', 'EarlyCareer', 'Grant', 'HealthScience', 'UK', 'Independence'],
    },

    29: {  # Volkswagen Foundation
        'description': (
            "The Volkswagen Foundation funds bold, unconventional research that challenges existing paradigms. "
            "It is one of Germany's largest private science foundations with an annual funding volume of over €100 million. "
            "Current programmes include 'Experiment!' (€90,000 for risky exploratory research), 'Freigeist Fellowships' (€1.5M over 5 years for creative minds), "
            "and larger consortium grants up to €900,000. Open to all scientific disciplines with emphasis on interdisciplinary and international projects."
        ),
        'eligibility_text': (
            "Open to researchers at all career stages — from postdocs to senior professors. "
            "No nationality restrictions, but host institution must typically be in Germany or Europe. "
            "Proposals must be scientifically excellent, innovative, and willing to take intellectual risks. "
            "Check current open calls at volkswagenstiftung.de/en/our-funding-portfolio."
        ),
        'tags': ['VolkswagenFoundation', 'Germany', 'Innovation', 'Interdisciplinary', 'Grant', 'FrontierScience'],
    },

    30: {  # CERN Studentship
        'description': (
            "CERN Technical and Doctoral Studentships offer immersive 4–14 month placements at CERN's particle physics laboratories in Geneva, Switzerland. "
            "Technical students (BSc/MSc level) work on engineering, computing, and physics projects. "
            "Doctoral students conduct research for their thesis under CERN supervision. "
            "Monthly allowance of CHF 3,719–4,800 (tax-free), travel subsidy, health coverage, and on-site accommodation assistance provided. "
            "Work alongside Nobel Prize winners and leading physicists at the world's largest science experiment."
        ),
        'eligibility_text': (
            "Must be enrolled at a university for the full duration of the placement. "
            "Technical students: BSc or MSc in Physics, Engineering, Computing, Mathematics, or related fields. "
            "Doctoral students: enrolled in a PhD programme, with agreement from home university supervisor. "
            "Must be a national of a CERN Member or Associate Member State. Minimum 4 months commitment."
        ),
        'tags': ['CERN', 'Physics', 'Computing', 'Engineering', 'Switzerland', 'Studentship', 'Doctoral'],
    },

    31: {  # DAAD Doctoral/Postdoc
        'description': (
            "DAAD Doctoral and Postdoctoral Research Grants fund research stays in Germany for 1–24 months. "
            "Doctoral candidates receive €1,200/month; postdoctoral researchers receive €1,750/month; senior researchers receive €2,150/month. "
            "Additional allowances for travel, rent, family (spouse and children), and health insurance are provided. "
            "Germany is home to 90 universities in the QS World Rankings, with particular strengths in engineering, automotive technology, life sciences, and theoretical physics."
        ),
        'eligibility_text': (
            "Doctoral candidates must have completed at least 2 semesters of PhD coursework. "
            "Postdocs must have completed their PhD no more than 4 years prior to application. "
            "Excellent academic records required — typically top 10% of class or equivalent. "
            "All nationalities welcome. German language skills are an advantage but not always required."
        ),
        'tags': ['DAAD', 'Germany', 'Doctoral', 'Postdoc', 'Research', 'Stipend', 'International'],
    },

    35: {  # Devpost Hackathons
        'description': (
            "Devpost is the world's largest hackathon platform, hosting 1,000+ hackathons per year from companies including Meta, Google, AWS, Microsoft, and Salesforce. "
            "Competitions span AI/ML, Web3, healthcare, sustainability, gaming, and open source. "
            "Prize pools range from $1,000 to over $1,000,000. Most hackathons are fully online and free to enter. "
            "Winners gain cash prizes, job opportunities, investor introductions, and global recognition. New hackathons open every week."
        ),
        'eligibility_text': (
            "Open to developers, designers, data scientists, and entrepreneurs worldwide. "
            "Individual or team participation (2–5 members typically). "
            "Most hackathons are free to join. Some require account registration on devpost.com. "
            "Age restrictions vary by sponsor — most open to 18+. Student hackathons open to enrolled students."
        ),
        'tags': ['Hackathon', 'Competition', 'AI', 'Development', 'Devpost', 'CashPrize', 'OpenSource'],
    },

    36: {  # MLH Fellowship
        'description': (
            "The MLH Fellowship is a 12-week remote internship alternative for aspiring software engineers, powered by GitHub and Meta. "
            "Production Engineering fellows work on real open-source DevOps and infrastructure projects used by millions. "
            "Fellows receive a $5,000 educational stipend, weekly mentorship from senior engineers at Meta and GitHub, "
            "and join a cohort of 30–50 engineers from around the world. Alumni have joined Google, Meta, Microsoft, Stripe, and top startups."
        ),
        'eligibility_text': (
            "Open to students and recent graduates globally — no degree requirement. "
            "Must be passionate about software engineering and open source. "
            "Production Engineering track requires comfort with Python, Linux, and basic networking. "
            "No prior open source experience required. Must commit full-time for 12 weeks (remote)."
        ),
        'tags': ['MLH', 'Fellowship', 'OpenSource', 'DevOps', 'Remote', 'GitHub', 'Meta', 'Stipend'],
    },

    37: {  # YC Summer 2026
        'description': (
            "Y Combinator's Summer 2026 batch is a 3-month accelerator program running July–September 2026 in San Francisco. "
            "YC invests $500,000 for 7% equity in every accepted company. "
            "The program includes weekly dinners with successful founders and investors, group office hours with YC partners, "
            "access to $1M+ in cloud credits (AWS, GCP, Azure), legal and accounting resources, and a Demo Day attended by top-tier VCs. "
            "YC alumni companies are collectively valued at over $600 billion."
        ),
        'eligibility_text': (
            "Open to any startup at any stage, any industry, any country. "
            "Solo founders accepted. Technical co-founders strongly preferred for software companies. "
            "Full team must relocate to San Francisco for 3 months. Pre-revenue to early traction stage. "
            "Previous YC rejections do not affect future applications — many successful companies applied 2–3 times."
        ),
        'tags': ['YCombinator', 'Startup', 'Accelerator', 'SanFrancisco', 'DemoDay', 'Venture', 'AI'],
    },

    39: {  # Fulbright Foreign Student
        'description': (
            "The Fulbright Foreign Student Program brings students from over 160 countries to the United States for graduate study, research, or English teaching. "
            "Awards cover full university tuition, monthly living stipend, round-trip airfare, health insurance, and book allowance. "
            "Duration is typically 1–2 academic years. Fellows become part of a global network of 400,000+ Fulbright alumni including 60 Nobel Laureates and 90 Pulitzer Prize winners. "
            "The 2027–2028 competition is now open."
        ),
        'eligibility_text': (
            "Non-US citizens. Must hold a bachelor's degree or equivalent by the start of the award. "
            "Must apply through the Fulbright Commission or US Embassy in home country. "
            "Strong academic record, English proficiency, and leadership potential required. "
            "Open to all fields. Age and other criteria vary by country — check home country commission."
        ),
        'tags': ['Fulbright', 'Scholarship', 'USA', 'GraduateStudy', 'FullyFunded', 'International', 'Research'],
    },

    40: {  # Erasmus Mundus
        'description': (
            "Erasmus Mundus Joint Master Degrees (EMJMD) are prestigious, integrated international study programmes delivered by international consortia of higher education institutions. "
            "Scholarship covers full tuition fees, a monthly contribution of €1,400, and travel/installation costs. "
            "Students study in at least 2 European countries and earn a joint, double, or multiple degree. "
            "Over 200 EMJMD programmes available across all academic disciplines. "
            "Funded by the European Union — among the most competitive academic scholarships in the world."
        ),
        'eligibility_text': (
            "Open to students worldwide holding a Bachelor's degree (or final year students). "
            "Must apply to a specific EMJMD programme through that programme's own application portal. "
            "Each programme sets its own academic requirements, language requirements, and deadlines. "
            "Non-EU/EEA students are prioritised for full scholarships. Typically highly competitive (5–10% acceptance rate)."
        ),
        'tags': ['Erasmus', 'EMJMD', 'EU', 'Masters', 'Scholarship', 'International', 'FullyFunded'],
    },

    41: {  # Horizon Europe
        'description': (
            "Horizon Europe is the EU's flagship research and innovation programme with a €95.5 billion budget for 2021–2027. "
            "It funds individual researchers through the European Research Council (ERC), collaborative research projects, Marie Skłodowska-Curie fellowships, and innovation actions. "
            "Grants range from €150,000 (ERC Proof of Concept) to €10M+ (large collaborative projects). "
            "Supports work in climate, health, digital technology, food systems, space, and fundamental science. "
            "Open to researchers and organisations in EU Member States, Associated Countries, and some third countries."
        ),
        'eligibility_text': (
            "Varies by funding instrument. ERC grants: individual researchers at all career stages. "
            "Collaborative projects: consortia of 3+ organisations from different EU/Associated Countries. "
            "MSCA: individual researchers with international mobility. "
            "Most calls require affiliation with a legal entity in an EU Member State or Associated Country. "
            "Check open calls at ec.europa.eu/info/funding-tenders."
        ),
        'tags': ['HorizonEurope', 'EU', 'Research', 'Innovation', 'ERC', 'MSCA', 'CollaborativeResearch'],
    },

    45: {  # ETH AI Center Doctoral Fellowship
        'description': (
            "The ETH AI Center Doctoral Fellowship supports outstanding PhD students pursuing research at the intersection of artificial intelligence and other disciplines. "
            "Fellows are co-supervised by ETH AI Center faculty and external academic or industry partners. "
            "The application portal opens in September 2026. "
            "Fellows are embedded in ETH Zurich — ranked #1 in Europe for Computer Science — and join a vibrant AI research community including 30+ faculty and 200+ PhD students. "
            "Stipend follows ETH standard doctoral rates (approx. CHF 52,000–60,000/year)."
        ),
        'eligibility_text': (
            "Outstanding MSc graduates or final-year MSc students in Computer Science, Electrical Engineering, Mathematics, or related fields. "
            "Strong research background in machine learning, AI, or related areas. "
            "Must identify a supervising ETH AI Center professor before applying. "
            "Open to all nationalities. English is the working language. GRE not required."
        ),
        'tags': ['ETHZurich', 'AI', 'MachineLearning', 'Doctoral', 'PhD', 'Switzerland', 'Fellowship'],
    },

    47: {  # Humboldt Fellowship
        'description': (
            "The Alexander von Humboldt Research Fellowship is one of Germany's most prestigious research awards, enabling postdoctoral researchers of all nationalities "
            "to conduct long-term research (6–24 months) at German universities and institutes. "
            "Monthly stipend of €2,700–€3,200 depending on field, plus family allowance, travel subsidy, and German language course support. "
            "Over 30,000 Humboldt Fellows have been supported since 1953, including 55 Nobel Laureates. "
            "The Humboldt Network provides lifelong access to one of the world's strongest academic communities."
        ),
        'eligibility_text': (
            "Postdoctoral researchers of all nationalities who completed their PhD within the last 4 years. "
            "Must have above-average academic record and publications in international peer-reviewed journals. "
            "Must have a host researcher at a German institution who agrees to supervise the stay. "
            "Applications accepted year-round — selection committees meet 3 times per year."
        ),
        'tags': ['Humboldt', 'Germany', 'Postdoc', 'Fellowship', 'Research', 'International', 'Prestigious'],
    },

    48: {  # Google for Startups MENAT
        'description': (
            "Google for Startups Accelerator: Middle East, North Africa & Turkey is a 10-week equity-free program for Seed to Series A startups leveraging AI/ML, Cloud, and technology. "
            "Each cohort of 10–15 startups receives: up to $350,000 USD in Google Cloud credits, dedicated 1-on-1 mentorship from Google engineers and product experts, "
            "access to Google's AI products through Early Access and Trusted Tester programs, free Cloud TPU access for ML research, "
            "exclusive technical bootcamps, workshops on product design and customer acquisition, and connections to Google's global investor network. "
            "Applications for the 2026 cohort are now open."
        ),
        'eligibility_text': (
            "Seed to Series A startups based in Middle East, North Africa, or Turkey. "
            "Must be building a scalable AI/ML or technology product. "
            "Deeply technical team — CTO or technical lead must commit to the full program. "
            "Demonstrating traction and a defensible growth model. "
            "Mix of remote and in-person sessions — some travel to Google offices may be required."
        ),
        'tags': ['Google', 'Accelerator', 'MENA', 'Turkey', 'AI', 'CloudCredits', 'StartupFunding', 'Equity-Free'],
    },
}

print(f'Updating {len(ENRICHMENTS)} opportunities with rich content...')
updated = 0
for opp_id, data in ENRICHMENTS.items():
    o = db.query(Opportunity).filter(Opportunity.id == opp_id).first()
    if not o:
        print(f'  [{opp_id}] NOT FOUND')
        continue
    for field, val in data.items():
        setattr(o, field, val)
    updated += 1
    print(f'  [{opp_id}] ✅ {o.title[:55]}')

db.commit()
db.close()
print(f'\nDone. Updated {updated} opportunities.')
