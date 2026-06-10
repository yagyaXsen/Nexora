import React, { useState, useEffect, useRef } from 'react';

// Beautiful inline vector avatars for offline reliability
const AVATAR_STYLES = {
  'Priya Sharma': { hair: 'long-fringe', skin: '#f1c27d', hairColor: '#1a1105', bg: ['#cc5c6d', '#ff8e9e'], cloth: '#1e3a8a', glasses: true },
  'James Kariuki': { hair: 'short-curly', skin: '#8d5524', hairColor: '#111111', bg: ['#10b981', '#34d399'], cloth: '#0f172a', beard: true },
  'Elena Novak': { hair: 'long-straight', skin: '#ffdbac', hairColor: '#e5c158', bg: ['#6366f1', '#818cf8'], cloth: '#dc2626' },
  'Tomás Rivera': { hair: 'short-curly', skin: '#c68642', hairColor: '#111111', bg: ['#ec4899', '#f472b6'], cloth: '#475569', mustache: true },
  'Aisha Al-Farsi': { hijab: true, skin: '#ffdbac', bg: ['#f59e0b', '#fbbf24'], cloth: '#047857' },
  'Anjali Mehta': { hair: 'bun', skin: '#f1c27d', hairColor: '#111111', bg: ['#3b82f6', '#60a5fa'], cloth: '#1e3a8a' },
  'Omar Hassan': { hair: 'short', skin: '#e0ac69', hairColor: '#111111', bg: ['#06b6d4', '#22d3ee'], cloth: '#2563eb', beard: true },
  'Mei Lin': { hair: 'bob', skin: '#ffdbac', hairColor: '#111111', bg: ['#ec4899', '#f472b6'], cloth: '#059669' },
  'David Osei': { hair: 'dreads', skin: '#5c3818', hairColor: '#111111', bg: ['#8b5cf6', '#a78bfa'], cloth: '#b91c1c' },
  'Yuna Park': { hair: 'bob-bangs', skin: '#ffdbac', hairColor: '#1a1105', bg: ['#f97316', '#fb923c'], cloth: '#3b82f6' },
  'Carlos Mendez': { hair: 'short-curly', skin: '#c68642', hairColor: '#111111', bg: ['#3b82f6', '#60a5fa'], cloth: '#475569', mustache: true },
};

function Avatar({ name }) {
  const config = AVATAR_STYLES[name] || (() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash);
    const skins = ['#ffdbac', '#f1c27d', '#e0ac69', '#c68642', '#8d5524'];
    const hairColors = ['#111111', '#2d1a10', '#4a3728', '#e5c158'];
    const bgs = [
      ['#cc5c6d', '#ff8e9e'],
      ['#3b82f6', '#60a5fa'],
      ['#10b981', '#34d399'],
      ['#8b5cf6', '#a78bfa'],
      ['#f59e0b', '#fbbf24']
    ];
    return {
      hair: idx % 2 === 0 ? 'short' : 'long-straight',
      skin: skins[idx % skins.length],
      hairColor: hairColors[idx % hairColors.length],
      bg: bgs[idx % bgs.length],
      cloth: '#475569'
    };
  })();

  const idSafeName = name.replace(/\s+/g, '');

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-${idSafeName}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={config.bg[0]} />
          <stop offset="100%" stopColor={config.bg[1]} />
        </linearGradient>
      </defs>
      
      {/* Background */}
      <circle cx="50" cy="50" r="50" fill={`url(#bg-${idSafeName})`} />
      
      {/* Hijab wrap back */}
      {config.hijab && (
        <path d="M25,50 C25,22 36,15 50,15 C64,15 75,22 75,50 C75,70 70,80 62,84 C50,88 38,84 38,84 Z" fill={config.cloth} />
      )}

      {/* Neck */}
      <rect x="44" y="62" width="12" height="15" rx="3" fill={config.skin} opacity="0.9" />
      
      {/* Shirt/Shoulders */}
      <path d="M22,86 C22,76 34,70 50,70 C66,70 78,76 78,86 C78,92 78,100 78,100 L22,100 Z" fill={config.cloth} />
      
      {/* Collar/Neckline */}
      <path d="M42,70 C42,75 58,75 58,70" fill="none" stroke={config.skin} strokeWidth="3" strokeLinecap="round" />
      
      {/* Head */}
      <circle cx="50" cy="45" r="19" fill={config.skin} />
      
      {/* Eyes */}
      <circle cx="43" cy="44" r="2.2" fill="#111111" />
      <circle cx="57" cy="44" r="2.2" fill="#111111" />
      
      {/* Mouth */}
      <path d="M46,53 Q50,56 54,53" fill="none" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      
      {/* Hijab wrap front overlay */}
      {config.hijab && (
        <>
          {/* Inner bonnet */}
          <path d="M36,34 C39,29 44,27 50,27 C56,27 61,29 64,34 Z" fill="#ffffff" opacity="0.9" />
          {/* Hijab front wrap around face */}
          <path d="M30,42 C30,28 38,24 50,24 C62,24 70,28 70,42 C70,55 68,72 63,76 C58,80 50,81 42,77 C37,73 30,55 30,42 Z" fill={config.cloth} opacity="0.15" />
          {/* Hijab outline opening */}
          <path d="M35,44 C35,33 40,30 50,30 C60,30 65,33 65,44 C65,58 60,65 50,65 C40,65 35,58 35,44 Z" fill="none" stroke={config.cloth} strokeWidth="10" />
          {/* Face overlay to show face inside the hijab opening */}
          <ellipse cx="50" cy="46" rx="14" ry="16" fill={config.skin} />
          {/* Re-draw features */}
          <circle cx="43" cy="44" r="2.2" fill="#111111" />
          <circle cx="57" cy="44" r="2.2" fill="#111111" />
          <path d="M46,53 Q50,56 54,53" fill="none" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </>
      )}

      {/* Hair Styles */}
      {!config.hijab && config.hair === 'long-fringe' && (
        <>
          <path d="M29,42 C29,22 38,18 50,18 C62,18 71,22 71,42 C71,55 72,68 68,72 C67,70 66,55 66,45 C66,30 59,25 50,25 C41,25 34,30 34,45 C34,55 33,70 32,72 C28,68 29,55 29,42 Z" fill={config.hairColor} />
          <path d="M32,29 C37,24 45,24 50,26 C55,24 63,24 68,29" fill={config.hairColor} />
        </>
      )}

      {!config.hijab && config.hair === 'short-curly' && (
        <path d="M31,34 C31,22 40,16 50,16 C60,16 69,22 69,34 C71,32 70,26 66,22 C62,18 57,17 50,17 C43,17 38,18 34,22 C30,26 29,32 31,34 Z" fill={config.hairColor} />
      )}

      {!config.hijab && config.hair === 'long-straight' && (
        <path d="M30,40 C30,20 40,18 50,18 C60,18 70,20 70,40 C70,55 68,72 68,72 L65,72 C65,72 65,50 64,42 C62,32 58,26 50,26 C42,26 38,32 36,42 C35,50 35,72 35,72 L32,72 C32,72 30,55 30,40 Z" fill={config.hairColor} />
      )}

      {!config.hijab && config.hair === 'bun' && (
        <>
          <circle cx="50" cy="18" r="9" fill={config.hairColor} />
          <path d="M30,40 C30,24 40,22 50,22 C60,22 70,24 70,40 C70,42 66,32 64,30 C60,26 56,26 50,26 C44,26 40,26 36,30 C34,32 30,42 30,40 Z" fill={config.hairColor} />
        </>
      )}

      {!config.hijab && config.hair === 'short' && (
        <path d="M30,36 C30,22 40,18 50,18 C60,18 70,22 70,36 C70,36 71,32 67,28 C63,24 57,22 50,22 C43,22 37,24 33,28 C29,32 30,36 30,36 Z" fill={config.hairColor} />
      )}

      {!config.hijab && config.hair === 'bob' && (
        <path d="M29,40 C29,20 40,18 50,18 C60,18 71,20 71,40 C71,50 69,54 69,54 C69,54 67,36 65,34 C63,32 58,26 50,26 C42,26 37,32 35,34 C33,36 31,54 31,54 C31,54 29,50 29,40 Z" fill={config.hairColor} />
      )}

      {!config.hijab && config.hair === 'bob-bangs' && (
        <>
          <path d="M29,40 C29,20 40,18 50,18 C60,18 71,20 71,40 C71,50 69,54 69,54 C69,54 67,36 65,34 C63,32 58,26 50,26 C42,26 37,32 35,34 C33,36 31,54 31,54 C31,54 29,50 29,40 Z" fill={config.hairColor} />
          <path d="M33,32 C38,28 44,28 50,28 C56,28 62,28 67,32" fill={config.hairColor} stroke={config.hairColor} strokeWidth="3" />
        </>
      )}

      {!config.hijab && config.hair === 'dreads' && (
        <path d="M28,38 C28,34 32,32 34,32 C33,28 37,27 40,27 C39,23 44,22 47,23 C48,19 53,19 55,22 C57,20 62,21 63,25 C65,24 68,26 68,29 C70,30 71,34 69,38 C72,36 71,31 67,27 C63,23 57,21 50,21 C43,21 37,23 33,27 C29,31 28,36 29,38 Z" fill={config.hairColor} />
      )}

      {/* Mustache / Beard */}
      {!config.hijab && config.beard && (
        <>
          <path d="M31,48 C31,58 40,66 50,66 C60,66 69,58 69,48 C69,52 65,60 58,62 C55,63 45,63 42,62 C35,60 31,52 31,48 Z" fill={config.hairColor} />
          <path d="M40,52 Q50,55 60,52 C56,50 44,50 40,52 Z" fill={config.hairColor} />
        </>
      )}

      {!config.hijab && config.mustache && (
        <path d="M40,53 Q50,56 60,53 C56,51 44,51 40,53 Z" fill={config.hairColor} />
      )}

      {/* Glasses */}
      {!config.hijab && config.glasses && (
        <>
          <circle cx="43" cy="44" r="6" fill="none" stroke="#111111" strokeWidth="1.5" />
          <circle cx="57" cy="44" r="6" fill="none" stroke="#111111" strokeWidth="1.5" />
          <line x1="49" y1="44" x2="51" y2="44" stroke="#111111" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}

export default function LandingPage({
  searchQuery = '',
  setSearchQuery,
  setSelectedCategory,
  setSelectedCountry,
  setActiveTab,
  onLaunchApp,
  opportunities = [],
  handleSearchSubmit
}) {
  const [allOpportunities, setAllOpportunities] = useState([]);

  useEffect(() => {
    if (opportunities.length > 0 && allOpportunities.length === 0) {
      setAllOpportunities(opportunities);
    }
  }, [opportunities, allOpportunities.length]);

  const handleLocalSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onLaunchApp(searchQuery);
  };

  const handleTrendingClick = (e, query) => {
    e.preventDefault();
    setSearchQuery(query);
    onLaunchApp(query);
  };

  const handleQuickCategoryClick = (category) => {
    setSelectedCategory(category);
    onLaunchApp();
  };

  const handleQuickCountryClick = (country) => {
    setSelectedCountry(country);
    onLaunchApp();
  };

  const handleNavigateTab = (tab) => {
    setActiveTab(tab);
    onLaunchApp();
  };

  // --- Social Proof Data ---
  const testimonials = [
    { name: 'Priya Sharma', role: 'CS Undergrad', country: 'India', quote: 'I found my Google Research Fellowship through Nexora. I would never have discovered it on my own — the platform matched me within minutes of signing up.', opportunity: 'Google Research Fellowship', score: 96, avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Priya&backgroundColor=b6e3f4&top=longHairStraight&accessories=prescription01&clothingColor=navy&eyebrows=default&facialHairType=blank&hairColor=BrownDark' },
    { name: 'James Kariuki', role: "Master's Student", country: 'Kenya', quote: 'I applied to 3 opportunities I found on Nexora and got accepted to Schwarzman Scholars. The match scores were incredibly accurate to my background.', opportunity: 'Schwarzman Scholars', score: 94, avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=James&backgroundColor=d1f4cc&top=shortHairShortFlat&accessories=blank&clothingColor=blue&eyebrows=default&facialHairType=beardMajestic&hairColor=Black' },
    { name: 'Elena Novak', role: 'PhD Candidate', country: 'Germany', quote: 'Nexora replaced hours of weekly searching. The deadline alerts alone saved me from missing a $50k research grant I had been chasing for months.', opportunity: 'DAAD Research Grant', score: 92, avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Elena&backgroundColor=ffd5dc&top=longHairStraight2&accessories=blank&clothingColor=red&eyebrows=default&facialHairType=blank&hairColor=Blonde' },
    { name: 'Tomás Rivera', role: 'Startup Founder', country: 'Mexico', quote: 'My startup got into Y Combinator after Nexora flagged the application window. The platform feels like having a personal advisor available 24/7.', opportunity: 'Y Combinator S24', score: 98, avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Tomas&backgroundColor=c0aede&top=shortHairShortCurly&accessories=blank&clothingColor=gray&facialHairType=moustacheFancy&hairColor=Black' },
    { name: 'Aisha Al-Farsi', role: 'MBA Student', country: 'UAE', quote: 'The copilot feature understood my goals better than a human advisor would. I found opportunities in markets I did not even know were accessible to me.', opportunity: 'Oxford Pershing Square Scholarship', score: 91, avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Aisha&backgroundColor=ffdfbf&top=hijab&accessories=blank&clothingColor=green&eyebrows=default&facialHairType=blank' },
  ];

  const successStories = [
    { name: 'Anjali Mehta', background: 'AI & Machine Learning, IIT Delhi', outcome: 'Google DeepMind Residency', story: 'Anjali was unsure she qualified. Nexora matched her with a 94% score and helped her track the application to completion in under two weeks.', category: 'Research', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Anjali&backgroundColor=b6e3f4&top=longHairBun&accessories=blank&clothingColor=navy&eyebrows=default&facialHairType=blank&hairColor=Black' },
    { name: 'Omar Hassan', background: 'Fintech Founder, Cairo', outcome: 'Techstars Cairo Accelerator', story: "Omar's startup was gaining traction but lacked funding. Nexora surfaced Techstars 3 days before the application closed. He got in.", category: 'Accelerator', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Omar&backgroundColor=d1f4cc&top=shortHairShortFlat&accessories=blank&clothingColor=blue&eyebrows=default&facialHairType=beardLight&hairColor=Black' },
    { name: 'Mei Lin', background: 'Environmental Science, Singapore', outcome: 'UNESCO Green Futures Grant', story: 'Mei Lin was searching manually for climate grants every Sunday. After joining Nexora, her first recommended match was the grant that funded her project.', category: 'Grant', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Meilin&backgroundColor=ffd5dc&top=longHairStraight&accessories=blank&clothingColor=green&eyebrows=default&facialHairType=blank&hairColor=Black' },
    { name: 'David Osei', background: 'Undergraduate, Ghana', outcome: 'Mastercard Foundation Scholar', story: 'David thought international scholarships were out of reach. Nexora proved otherwise — his first match was a full scholarship to study in Canada.', category: 'Scholarship', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=David&backgroundColor=c0aede&top=shortHairDreads01&accessories=blank&clothingColor=red&eyebrows=default&facialHairType=blank&hairColor=Black' },
    { name: 'Yuna Park', background: 'Product Designer, Seoul', outcome: 'Adobe Design Circle Fellowship', story: 'Yuna was focused only on tech opportunities. Nexora expanded her horizon and matched her with a creative fellowship she never would have found on her own.', category: 'Fellowship', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Yuna&backgroundColor=ffdfbf&top=longHairBob&accessories=blank&clothingColor=pastelBlue&eyebrows=default&facialHairType=blank&hairColor=Black' },
    { name: 'Carlos Mendez', background: 'AgriTech Entrepreneur, Colombia', outcome: 'World Bank Innovation Grant', story: 'Carlos needed institutional backing. Nexora found a World Bank grant specifically for emerging-market agritech and surfaced it three weeks before deadline.', category: 'Grant', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Carlos&backgroundColor=b6e3f4&top=shortHairShortCurly&accessories=blank&clothingColor=gray&facialHairType=moustacheFancy&hairColor=Black' },
  ];

  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeStory, setActiveStory] = useState(null);
  const [counts, setCounts] = useState({ users: 0, opportunities: 0, countries: 0, matches: 0 });
  const countersStarted = useRef(false);
  const countersRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !countersStarted.current) {
          countersStarted.current = true;
          const targets = { users: 100000, opportunities: 500000, countries: 190, matches: 10000000 };
          const duration = 2000;
          const steps = 60;
          const stepTime = duration / steps;
          let step = 0;
          const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);
            setCounts({
              users: Math.round(targets.users * eased),
              opportunities: Math.round(targets.opportunities * eased),
              countries: Math.round(targets.countries * eased),
              matches: Math.round(targets.matches * eased),
            });
            if (step >= steps) clearInterval(timer);
          }, stepTime);
        }
      },
      { threshold: 0.3 }
    );
    if (countersRef.current) observer.observe(countersRef.current);
    return () => observer.disconnect();
  }, []);

  const formatCount = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K+';
    return n + '+';
  };

  return (
<div className="min-h-screen text-[#0d0d14] font-['Be_Vietnam_Pro']" style={{ background: '#EDEDF5' }}>
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
    @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont/tabler-icons.min.css');

    .lp-font-heading, .font-heading { font-family: 'Instrument Sans', sans-serif; }
    .lp-font-body, .font-body { font-family: 'Be Vietnam Pro', sans-serif; }

    .lp-nav {
      background: rgba(237, 237, 245, 0.85);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
    }

    .lp-border {
      border: 1px solid #D0D0DE;
    }

    @keyframes lp-float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    .lp-float { animation: lp-float 6s ease-in-out infinite; }

    .lp-nav-link-active {
      color: #0d0d14;
      font-weight: 700;
      position: relative;
    }
    .lp-nav-link-active::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      right: 0;
      height: 2px;
      background: #cc5c6d;
      border-radius: 1px;
    }
  `}</style>

  {/* ── NAVBAR ── */}
  <nav className="sticky top-0 z-[100] lp-nav border-b border-[#D0D0DE]/60 py-2.5 px-8">
    <div className="max-w-7xl mx-auto flex items-center justify-between">

      {/* Left: Logo */}
      <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onLaunchApp()}>
        <div className="w-9 h-9 bg-[#0a0a20] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg lp-font-heading leading-none">✦</span>
        </div>
        <span className="text-[#0d0d14] font-bold text-xl lp-font-heading tracking-tight">Nexora</span>
      </div>

      {/* Center: Nav links */}
      <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-[#4a4a6a]">
        <a href="#" onClick={(e) => { e.preventDefault(); handleQuickCategoryClick('All'); }}
          className="lp-nav-link-active">Opportunities</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }}
          className="hover:text-[#0d0d14] transition-colors">About Us</a>
        <a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }}
          className="hover:text-[#0d0d14] transition-colors">Contact</a>
      </div>

      {/* Right: Login + Get Started */}
      <div className="flex items-center gap-4">
        <button className="text-sm font-semibold text-[#4a4a6a] hover:text-[#0d0d14] transition-colors px-3 py-2" onClick={() => onLaunchApp()}>Login</button>
        <button
          className="bg-[#0a0a20] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#050514] transition-all"
          onClick={() => onLaunchApp()}>
          Get Started
        </button>
      </div>
    </div>
  </nav>

  {/* ── HERO SECTION ── */}
  <section className="relative pt-28 pb-12 px-8 bg-[#EDEDF5] overflow-hidden">
    <div className="max-w-5xl mx-auto text-center relative">

      {/* Big headline — all black, no gradient */}
      <h1 className="text-6xl md:text-8xl lp-font-heading font-bold text-[#0d0d14] tracking-tight leading-[0.92] mb-8">
        The World's<br />
        Opportunity<br />
        Intelligence Network
      </h1>

      <p className="text-lg md:text-xl text-[#6060a0] max-w-2xl mx-auto mb-14 leading-relaxed font-normal">
        Discover scholarships, fellowships, grants, accelerators,
        competitions, research programs, and career opportunities from
        around the world—all personalized for you.
      </p>

      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <form onSubmit={handleLocalSearchSubmit} className="relative flex items-center p-1.5 bg-white lp-border rounded-2xl shadow-lg shadow-[#0a0a20]/5 focus-within:border-[#0a0a20]/40 transition-all w-full">
          <i className="ti ti-search text-[#9090b0] ml-4 text-lg flex-shrink-0"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="I'm a Computer Science student from India looking for research opportunities..."
            className="w-full bg-transparent border-none outline-none px-4 py-3.5 text-sm text-[#0d0d14] placeholder:text-[#9090b0]"
          />
          <button
            type="submit"
            className="hidden md:block bg-[#0a0a20] text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-[#050514] transition-all flex-shrink-0">
            Discover
          </button>
        </form>

        {/* Trending */}
        <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 mt-5">
          <span className="text-[10px] font-black text-[#9090b0] uppercase tracking-widest">TRENDING:</span>
          <a href="#" onClick={(e) => handleTrendingClick(e, 'Research')}
            className="text-[12px] font-semibold text-[#4a4a6a] hover:text-[#0a0a20] transition-colors">Research Programs</a>
          <a href="#" onClick={(e) => handleTrendingClick(e, 'Scholarship')}
            className="text-[12px] font-semibold text-[#4a4a6a] hover:text-[#0a0a20] transition-colors">Scholarships</a>
          <a href="#" onClick={(e) => handleTrendingClick(e, 'Grant')}
            className="text-[12px] font-semibold text-[#4a4a6a] hover:text-[#0a0a20] transition-colors">Startup Grants</a>
          <a href="#" onClick={(e) => handleTrendingClick(e, 'Accelerator')}
            className="text-[12px] font-semibold text-[#4a4a6a] hover:text-[#0a0a20] transition-colors">Accelerators</a>
        </div>
      </div>
    </div>
  </section>

  {/* ── PERMANENT EXPLORE OPPORTUNITIES (ALL CATEGORIES) ── */}
  <section className="pt-12 pb-32 bg-white">
    <div className="max-w-7xl mx-auto px-8 mb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc5c6d]/10 text-[#cc5c6d] text-[10px] font-black mb-4 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#cc5c6d] animate-pulse"></span>
            Featured Feed
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-4 tracking-tight">Explore Active Opportunities</h2>
          <p className="text-lg text-slate-500 font-light max-w-xl">Real-time indexed programs across all sectors, fully verified and structured for your discovery.</p>
        </div>
        <button 
          onClick={() => onLaunchApp()}
          className="self-start md:self-end bg-[#0a0a20] text-white px-7 py-3.5 rounded-full font-bold text-xs hover:bg-[#cc5c6d] transition-all flex items-center gap-2 shadow-lg shadow-[#0a0a20]/10"
        >
          View Dashboard Feed <i className="ti ti-arrow-right"></i>
        </button>
      </div>
    </div>

    {allOpportunities.length === 0 ? (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#cc5c6d] border-t-transparent rounded-full animate-spin"></div>
      </div>
    ) : (
      <>
        <style>{`
          .explore-scroll::-webkit-scrollbar { display: none; }
          .explore-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <div className="explore-scroll overflow-x-auto cursor-grab active:cursor-grabbing" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-6 px-8 pb-4" style={{ width: 'max-content' }}>
            {allOpportunities.map((opp, i) => {
              const matchScore = opp.match_score || (50 + (opp.title.length * 3) % 46);
              return (
                <div
                  key={opp.id || i}
                  className="bg-white rounded-[32px] p-8 border border-slate-100 hover:border-[#cc5c6d]/40 shadow-xl shadow-[#0a0a20]/2 hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all cursor-pointer flex flex-col justify-between flex-shrink-0"
                  style={{ width: '380px', minHeight: '300px' }}
                >
                  <div>
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <span className="inline-flex items-center px-3 py-1 bg-[#cc5c6d]/10 text-[#cc5c6d] text-[10px] font-black uppercase tracking-widest rounded-full">{opp.category}</span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
                        <i className="ti ti-bolt animate-pulse"></i> {matchScore}% MATCH
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-[#111111] text-base mb-1.5 leading-snug line-clamp-2" title={opp.title}>
                      {opp.title}
                    </h3>
                    <p className="text-slate-400 text-xs font-medium mb-4">{opp.organization}</p>
                    
                    <p className="text-slate-500 text-xs leading-relaxed font-light line-clamp-3 mb-6">
                      {opp.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-4 mb-5">
                      <span className="text-[11px] text-slate-500 font-light flex items-center gap-1">
                        <i className="ti ti-currency-dollar text-emerald-500 text-sm"></i>
                        <strong>{opp.funding || 'Unspecified'}</strong>
                      </span>
                      <span className="text-[11px] text-slate-500 font-light flex items-center gap-1">
                        <i className="ti ti-map-pin text-[#cc5c6d] text-sm"></i>
                        <strong>{opp.country || 'Global'}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => onLaunchApp(opp.title)}
                      className="w-full bg-[#0a0a20] text-white py-3.5 rounded-xl font-bold text-xs hover:bg-[#cc5c6d] transition-all text-center block shadow-lg shadow-[#0a0a20]/10 hover:shadow-xl hover:shadow-[#cc5c6d]/10"
                    >
                      Apply via Nexora &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="flex justify-center mt-6">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            <i className="ti ti-arrows-horizontal text-[#cc5c6d]"></i>
            Scroll to explore {allOpportunities.length} opportunities
          </p>
        </div>
      </>
    )}
  </section>

  {/* ── IMPACT NUMBERS TICKER ── */}
  <section className="py-20 bg-white border-b border-[#d0d0cc]/30" ref={countersRef}>
    <div className="max-w-7xl mx-auto px-8">
      <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-14">Nexora by the numbers</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
        <div className="text-center group">
          <p className="text-4xl md:text-6xl font-heading font-bold text-[#0a0a20] mb-3 tracking-tighter transition-all">{formatCount(counts.users)}</p>
          <div className="w-8 h-0.5 bg-[#cc5c6d] mx-auto mb-3 rounded-full"></div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Users</p>
        </div>
        <div className="text-center">
          <p className="text-4xl md:text-6xl font-heading font-bold text-[#0a0a20] mb-3 tracking-tighter">{formatCount(counts.opportunities)}</p>
          <div className="w-8 h-0.5 bg-[#cc5c6d] mx-auto mb-3 rounded-full"></div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Opportunities Indexed</p>
        </div>
        <div className="text-center">
          <p className="text-4xl md:text-6xl font-heading font-bold text-[#0a0a20] mb-3 tracking-tighter">{formatCount(counts.countries)}</p>
          <div className="w-8 h-0.5 bg-[#cc5c6d] mx-auto mb-3 rounded-full"></div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Countries Covered</p>
        </div>
        <div className="text-center">
          <p className="text-4xl md:text-6xl font-heading font-bold text-[#0a0a20] mb-3 tracking-tighter">{formatCount(counts.matches)}</p>
          <div className="w-8 h-0.5 bg-[#cc5c6d] mx-auto mb-3 rounded-full"></div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Matches Connected</p>
        </div>
      </div>
    </div>
  </section>


  {/* ── FEATURED IN MEDIA STRIP ── */}
  <section className="py-16 bg-white border-b border-[#d0d0cc]/30 overflow-hidden">
    <style>{`
      @keyframes scroll-left {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      .media-scroll-track {
        animation: scroll-left 28s linear infinite;
        display: flex;
        width: max-content;
      }
      .media-scroll-track:hover { animation-play-state: paused; }
    `}</style>
    <div className="max-w-7xl mx-auto px-8 mb-10">
      <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">As featured in</p>
    </div>
    <div className="overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
      <div className="media-scroll-track gap-16 items-center px-8">
        {[
          { name: 'TechCrunch', abbr: 'TC' },
          { name: 'Forbes', abbr: 'F' },
          { name: 'Product Hunt', abbr: 'PH' },
          { name: 'Y Combinator', abbr: 'YC' },
          { name: 'MIT Review', abbr: 'MTR' },
          { name: 'Wired', abbr: 'W' },
          { name: 'The Guardian', abbr: 'TG' },
          { name: 'Bloomberg', abbr: 'BB' },
          { name: 'TechCrunch', abbr: 'TC' },
          { name: 'Forbes', abbr: 'F' },
          { name: 'Product Hunt', abbr: 'PH' },
          { name: 'Y Combinator', abbr: 'YC' },
          { name: 'MIT Review', abbr: 'MTR' },
          { name: 'Wired', abbr: 'W' },
          { name: 'The Guardian', abbr: 'TG' },
          { name: 'Bloomberg', abbr: 'BB' },
        ].map((pub, i) => (
          <div key={i} className="flex-shrink-0 flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-[#0a0a20] group-hover:text-white transition-all">{pub.abbr}</div>
            <span className="text-slate-300 font-bold text-base tracking-tight group-hover:text-slate-500 transition-colors whitespace-nowrap">{pub.name}</span>
          </div>
        ))}
      </div>
    </div>
  </section>


  {/* ── TESTIMONIALS CAROUSEL ── */}
  <section className="py-32 px-8 bg-white">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc5c6d]/10 text-[#cc5c6d] text-[10px] font-black mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#cc5c6d] animate-pulse"></span>
          Real Stories
        </div>
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-5 tracking-tight">Life-Changing Matches</h2>
        <p className="text-slate-500 font-light text-lg">Over 100,000 students and founders discovered their breakthrough opportunity through Nexora.</p>
      </div>

      <div className="relative">
        {testimonials.map((t, i) => (
          <div
            key={i}
            className="transition-all duration-700"
            style={{
              opacity: i === activeTestimonial ? 1 : 0,
              position: i === activeTestimonial ? 'relative' : 'absolute',
              top: 0, left: 0, right: 0,
              pointerEvents: i === activeTestimonial ? 'auto' : 'none'
            }}
          >
            <div className="bg-[#0a0a20] rounded-[40px] p-10 md:p-14 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#cc5c6d]/8 blur-[100px] rounded-full"></div>
              <div className="absolute left-10 bottom-0 w-40 h-40 bg-[#cc5c6d]/5 blur-[80px] rounded-full"></div>
              <div className="relative z-10">
                {/* Large quote mark */}
                <div className="text-[80px] leading-none font-black text-[#cc5c6d]/20 lp-font-heading mb-2 select-none">&ldquo;</div>
                <p className="text-white/90 text-xl font-light leading-relaxed italic mb-10">{t.quote}</p>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#cc5c6d]/30 flex items-center justify-center bg-slate-100">
                    <Avatar name={t.name} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-base">{t.name}</p>
                    <p className="text-slate-400 text-sm">{t.role} &middot; {t.country}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{t.score}% Match</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium mt-1.5">{t.opportunity}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3 mt-10">
        {testimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveTestimonial(i)}
            className={`transition-all duration-300 rounded-full ${
              i === activeTestimonial
                ? 'w-8 h-2 bg-[#cc5c6d]'
                : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>
    </div>
  </section>


  {/* ── SUCCESS STORIES WALL — Horizontal Scroll ── */}
  <section className="py-32 bg-[#EDEDF5]">
    <div className="max-w-7xl mx-auto px-8">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc5c6d]/10 text-[#cc5c6d] text-[10px] font-black mb-6 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#cc5c6d] animate-pulse"></span>
          Success Stories
        </div>
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-5 tracking-tight">People Who Changed Their Trajectory</h2>
        <p className="text-slate-500 font-light text-lg max-w-xl mx-auto">Real stories from real people who found their breakthrough using Nexora's personalized discovery platform.</p>
      </div>
    </div>

    {/* Horizontal scroll container — full bleed */}
    <style>{`
      .stories-scroll::-webkit-scrollbar { display: none; }
      .stories-scroll { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
    <div className="stories-scroll overflow-x-auto cursor-grab active:cursor-grabbing" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="flex gap-6 px-8 pb-4" style={{ width: 'max-content' }}>
        {successStories.map((story, i) => (
          <div
            key={i}
            className="bg-white rounded-[28px] p-8 hairline-border hover:border-[#cc5c6d]/40 hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all cursor-pointer group relative overflow-hidden flex-shrink-0"
            style={{ width: '340px' }}
            onClick={() => setActiveStory(activeStory === i ? null : i)}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-slate-100 flex items-center justify-center bg-slate-100">
                <Avatar name={story.name} />
              </div>
              <div>
                <p className="font-bold text-[#111111] text-sm">{story.name}</p>
                <p className="text-slate-400 text-xs mt-0.5">{story.background}</p>
              </div>
            </div>

            <div className="inline-flex items-center px-3 py-1 bg-[#cc5c6d]/10 text-[#cc5c6d] text-[10px] font-black uppercase tracking-widest rounded-full mb-4">{story.category}</div>

            <p className="font-bold text-[#111111] mb-4 text-sm leading-snug">Accepted to &mdash; {story.outcome}</p>

            <div
              className="overflow-hidden transition-all duration-500"
              style={{ maxHeight: activeStory === i ? '200px' : '0px', opacity: activeStory === i ? 1 : 0 }}
            >
              <p className="text-slate-500 text-sm leading-relaxed font-light pb-2">{story.story}</p>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <span className="text-[11px] text-[#cc5c6d] font-bold group-hover:underline">
                {activeStory === i ? 'Hide story' : 'Read story'} &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Scroll hint */}
    <div className="flex justify-center mt-6">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
        <i className="ti ti-arrows-horizontal text-[#cc5c6d]"></i>
        Scroll to explore
      </p>
    </div>
  </section>

  <section className="py-20 border-y border-[#d0d0cc]/50 bg-white">
    <div className="max-w-7xl mx-auto px-8">
      <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-12">Trusted by ambitious talent worldwide</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
        <div className="text-center">
          <p className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-2 tracking-tighter">100K+</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Users</p>
        </div>
        <div className="text-center">
          <p className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-2 tracking-tighter">500K+</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Opportunities Indexed</p>
        </div>
        <div className="text-center">
          <p className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-2 tracking-tighter">190+</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Countries</p>
        </div>
        <div className="text-center">
          <p className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-2 tracking-tighter">10M+</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Matches Connected</p>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 px-8 bg-[#EDEDF5]">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-6 tracking-tight">Why Great Opportunities Go Unnoticed</h2>
        <p className="text-lg text-slate-500 max-w-xl mx-auto font-light">The traditional discovery process is outdated, fragmented, and broken. We built the engine to fix it.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-10 rounded-[32px] hairline-border hover:border-[#cc5c6d] hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all group">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#cc5c6d]/10 transition-colors">
            <i className="ti ti-binary text-[#cc5c6d] text-xl"></i>
          </div>
          <h3 className="font-heading font-bold text-xl mb-4 text-[#111111]">Fragmented Info</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-light">Opportunities exist across thousands of isolated websites, government portals, and hidden databases.</p>
        </div>

        <div className="bg-white p-10 rounded-[32px] hairline-border hover:border-[#cc5c6d] hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all group">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#cc5c6d]/10 transition-colors">
            <i className="ti ti-hourglass-low text-[#cc5c6d] text-xl"></i>
          </div>
          <h3 className="font-heading font-bold text-xl mb-4 text-[#111111]">Missed Deadlines</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-light">Important programs often close their applications before the right candidates even discover they exist.</p>
        </div>

        <div className="bg-white p-10 rounded-[32px] hairline-border hover:border-[#cc5c6d] hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all group">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#cc5c6d]/10 transition-colors">
            <i className="ti ti-search text-[#cc5c6d] text-xl"></i>
          </div>
          <h3 className="font-heading font-bold text-xl mb-4 text-[#111111]">Poor Search</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-light">Traditional search engines don't understand your personal context, goals, or eligibility requirements.</p>
        </div>

        <div className="bg-white p-10 rounded-[32px] hairline-border hover:border-[#cc5c6d] hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all group">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#cc5c6d]/10 transition-colors">
            <i className="ti ti-layers-intersect text-[#cc5c6d] text-xl"></i>
          </div>
          <h3 className="font-heading font-bold text-xl mb-4 text-[#111111]">Application Chaos</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-light">Managing life-changing opportunities shouldn't happen in messy spreadsheets and browser tabs.</p>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 bg-white px-8">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-6 tracking-tight">How Nexora Works</h2>
        <p className="text-lg text-slate-500 max-w-xl mx-auto font-light">The machinery behind global opportunity intelligence, simplified into six steps.</p>
      </div>

      <div className="relative">
        <div className="absolute top-[45px] left-0 w-full h-px bg-slate-100 hidden lg:block -z-10"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 relative z-10">
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">01</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] mb-3">Smart Discovery</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Scans universities, governments, NGOs, and grant sites.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">02</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] mb-3">Data Intel</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Extracts deadlines, eligibility, funding and requirements.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">03</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] mb-3">Opp Graph</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Transforms raw web data into structured opportunities.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">04</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] mb-3">Semantic Search</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Natural language engine for context-aware discovery.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">05</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] mb-3">Smart Matching</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Precision matching based on your unique profile.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">06</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] mb-3">Tracking</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Manage every application from one intelligent dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 px-8 bg-[#EDEDF5]">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-4 tracking-tight">Opportunity Categories</h2>
          <p className="text-lg text-slate-500 font-light max-w-xl">Explore thousands of verified opportunities across various sectors.</p>
        </div>
        <button className="text-[#cc5c6d] font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform cursor-pointer" onClick={() => onLaunchApp()}>
          View all 40+ categories <i className="ti ti-arrow-right"></i>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Scholarship"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-school text-[#cc5c6d]"></i></div>
          <h3 className="font-heading font-bold text-lg text-[#111111] mb-1">Scholarships</h3>
          <p className="text-xs text-slate-400 font-medium">12,400+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Accelerator"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-rocket text-[#cc5c6d]"></i></div>
          <h3 className="font-heading font-bold text-lg text-[#111111] mb-1">Accelerators</h3>
          <p className="text-xs text-slate-400 font-medium">1,200+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Grant"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-coin text-[#cc5c6d]"></i></div>
          <h3 className="font-heading font-bold text-lg text-[#111111] mb-1">Grants</h3>
          <p className="text-xs text-slate-400 font-medium">8,900+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Competition"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-trophy text-[#cc5c6d]"></i></div>
          <h3 className="font-heading font-bold text-lg text-[#111111] mb-1">Competitions</h3>
          <p className="text-xs text-slate-400 font-medium">450+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Research Programs"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-flask text-[#cc5c6d]"></i></div>
          <h3 className="font-heading font-bold text-lg text-[#111111] mb-1">Research Programs</h3>
          <p className="text-xs text-slate-400 font-medium">3,100+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Exchange"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-world text-[#cc5c6d]"></i></div>
          <h3 className="font-heading font-bold text-lg text-[#111111] mb-1">Exchange Programs</h3>
          <p className="text-xs text-slate-400 font-medium">600+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Conference"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-microphone text-[#cc5c6d]"></i></div>
          <h3 className="font-heading font-bold text-lg text-[#111111] mb-1">Conferences</h3>
          <p className="text-xs text-slate-400 font-medium">2,300+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Fellowship"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-users text-[#cc5c6d]"></i></div>
          <h3 className="font-heading font-bold text-lg text-[#111111] mb-1">Fellowships</h3>
          <p className="text-xs text-slate-400 font-medium">1,500+ Active</p>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 px-8 bg-[#EDEDF5]">
    <div className="max-w-6xl mx-auto rounded-[48px] p-12 lg:p-20 overflow-hidden relative border border-white/10 shadow-2xl" style={{ backgroundColor: '#0a0a20' }}>
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#cc5c6d] text-[10px] font-black mb-8 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#cc5c6d] animate-pulse"></span>
            Personalized Intelligence
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-8 tracking-tight leading-tight">Your Personal Opportunity Copilot</h2>
          <p className="text-lg text-slate-400 mb-12 font-light leading-relaxed">Stop searching, start discovering. Nexora continuously monitors the global landscape and delivers precision matches based on your specific background and goals.</p>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-12">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Because you're:</p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-[#cc5c6d]/20 text-[#cc5c6d] rounded-xl text-xs font-bold border border-[#cc5c6d]/30">CS Student</span>
              <span className="px-4 py-2 bg-[#cc5c6d]/20 text-[#cc5c6d] rounded-xl text-xs font-bold border border-[#cc5c6d]/30">India</span>
              <span className="px-4 py-2 bg-[#cc5c6d]/20 text-[#cc5c6d] rounded-xl text-xs font-bold border border-[#cc5c6d]/30">Undergraduate</span>
            </div>
          </div>

          <button className="bg-white text-[#0a0a20] px-10 py-4 rounded-full font-bold text-base hover:bg-slate-200 transition-all flex items-center gap-3" onClick={() => handleNavigateTab("profile")}>
            Setup Your Profile
            <i className="ti ti-arrow-right"></i>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl transform rotate-1">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-[#cc5c6d] uppercase tracking-widest">Recommended</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase">95% Match</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] text-lg mb-1">Google Research Fellowship</h4>
            <p className="text-xs text-slate-500 mb-5">$10,000 Stipend • Menlo Park, CA</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-[95%] h-full bg-[#cc5c6d] rounded-full"></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl -rotate-1">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-[#cc5c6d] uppercase tracking-widest">Recommended</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase">92% Match</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] text-lg mb-1">Microsoft Imagine Cup</h4>
            <p className="text-xs text-slate-500 mb-5">$100,000 Prize Pool • Global</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-[92%] h-full bg-[#cc5c6d] rounded-full"></div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-2xl rotate-1">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black text-[#cc5c6d] uppercase tracking-widest">Recommended</span>
              <span className="text-[10px] font-black text-emerald-600 uppercase">89% Match</span>
            </div>
            <h4 className="font-heading font-bold text-[#111111] text-lg mb-1">ETH Zurich Summer Research</h4>
            <p className="text-xs text-slate-500 mb-5">Fully Funded • Zurich, Switzerland</p>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="w-[89%] h-full bg-[#cc5c6d] rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      
      <div className="absolute -right-40 -top-40 w-96 h-96 bg-[#cc5c6d]/20 blur-[120px] rounded-full"></div>
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#cc5c6d]/10 blur-[100px] rounded-full"></div>
    </div>
  </section>

  
  <section className="py-32 bg-white px-8">
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-6 tracking-tight">The Opportunity Command Center</h2>
        <p className="text-lg text-slate-500 max-w-xl mx-auto font-light">Stop losing track. Move from discovery to acceptance with our unified Kanban tracker.</p>
      </div>

      <div className="overflow-x-auto pb-8">
        <div className="flex gap-6 min-w-[1200px]">
          
          <div className="flex-1 bg-slate-50/50 rounded-3xl p-4 border border-slate-100 kanban-col">
            <div className="flex items-center justify-between mb-6 px-4">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Saved</h5>
              <span className="w-6 h-6 bg-slate-200 rounded-full text-[10px] font-bold flex items-center justify-center text-slate-500">8</span>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl hairline-border shadow-sm hover:shadow-md transition-shadow">
                <h6 className="font-heading font-bold text-xs text-[#111111] mb-2">Gates Cambridge Scholarship</h6>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold">University of Cambridge</span>
                  <span className="text-[#cc5c6d]">Oct 12</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl hairline-border shadow-sm hover:shadow-md transition-shadow">
                <h6 className="font-heading font-bold text-xs text-[#111111] mb-2">MIT Bio-Innovation Grant</h6>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold">MIT Research</span>
                  <span className="text-[#cc5c6d]">Oct 24</span>
                </div>
              </div>
            </div>
          </div>

          
          <div className="flex-1 bg-slate-50/50 rounded-3xl p-4 border border-slate-100 kanban-col">
            <div className="flex items-center justify-between mb-6 px-4">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Planning</h5>
              <span className="w-6 h-6 bg-slate-200 rounded-full text-[10px] font-bold flex items-center justify-center text-slate-500">3</span>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl hairline-border shadow-sm">
                <h6 className="font-heading font-bold text-xs text-[#111111] mb-2">Rhodes Scholarship 2026</h6>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold">Oxford University</span>
                  <span className="text-slate-500">In Draft</span>
                </div>
              </div>
            </div>
          </div>

          
          <div className="flex-1 bg-slate-50/50 rounded-3xl p-4 border border-slate-100 kanban-col">
            <div className="flex items-center justify-between mb-6 px-4">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Applied</h5>
              <span className="w-6 h-6 bg-[#cc5c6d]/20 rounded-full text-[10px] font-bold flex items-center justify-center text-[#cc5c6d]">12</span>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border-l-4 border-l-[#cc5c6d] hairline-border shadow-sm">
                <h6 className="font-heading font-bold text-xs text-[#111111] mb-2">Google Research Fellowship</h6>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold text-[#cc5c6d]">Applied 2d ago</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border-l-4 border-l-[#cc5c6d] hairline-border shadow-sm">
                <h6 className="font-heading font-bold text-xs text-[#111111] mb-2">Schwarzman Scholars</h6>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold text-[#cc5c6d]">Applied 1w ago</span>
                </div>
              </div>
            </div>
          </div>

          
          <div className="flex-1 bg-slate-50/50 rounded-3xl p-4 border border-slate-100 kanban-col">
            <div className="flex items-center justify-between mb-6 px-4">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Interview</h5>
              <span className="w-6 h-6 bg-[#cc5c6d]/20 rounded-full text-[10px] font-bold flex items-center justify-center text-[#cc5c6d]">1</span>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl hairline-border shadow-xl border-l-4 border-l-[#cc5c6d]">
                <h6 className="font-heading font-bold text-xs text-[#111111] mb-2">Knight-Hennessy Scholars</h6>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold text-[#cc5c6d]">Interview scheduled</span>
                  <span className="text-slate-900 font-bold">Tomorrow</span>
                </div>
              </div>
            </div>
          </div>

          
          <div className="flex-1 bg-slate-50/50 rounded-3xl p-4 border border-slate-100 kanban-col">
            <div className="flex items-center justify-between mb-6 px-4">
              <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">Accepted</h5>
              <span className="w-6 h-6 bg-emerald-100 rounded-full text-[10px] font-bold flex items-center justify-center text-emerald-600">4</span>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl hairline-border shadow-sm border-l-4 border-l-emerald-500">
                <h6 className="font-heading font-bold text-xs text-[#111111] mb-2">Erasmus Mundus Joint Master</h6>
                <div className="flex justify-between items-center text-[10px] text-emerald-600">
                  <span className="font-bold">OFFER RECEIVED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 px-8 bg-[#EDEDF5]">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-20">
        <div className="md:w-1/2">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-[#111111] mb-8 tracking-tight leading-tight">A Borderless Network of Opportunity</h2>
          <p className="text-lg text-slate-500 mb-10 font-light leading-relaxed">Nexora indexes 190+ countries in real-time. Whether it's a deep-tech lab in Zurich or a sustainability grant in Nairobi, our engine finds it before the crowd does.</p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-[#cc5c6d]/10 rounded-full flex items-center justify-center mt-1">
                <i className="ti ti-check text-[#cc5c6d] text-sm"></i>
              </div>
              <p className="text-sm font-bold text-[#111111]">Real-time global indexing</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-[#cc5c6d]/10 rounded-full flex items-center justify-center mt-1">
                <i className="ti ti-check text-[#cc5c6d] text-sm"></i>
              </div>
              <p className="text-sm font-bold text-[#111111]">Multi-language translation engine</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-6 h-6 bg-[#cc5c6d]/10 rounded-full flex items-center justify-center mt-1">
                <i className="ti ti-check text-[#cc5c6d] text-sm"></i>
              </div>
              <p className="text-sm font-bold text-[#111111]">Direct verified provider links</p>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 relative">
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg" className="w-full h-auto opacity-20 grayscale" alt="World Map" decoding="async" loading="lazy" />
          
          
          <div className="absolute top-[35%] left-[20%] group">
            <div className="w-3 h-3 bg-[#cc5c6d] rounded-full animate-ping absolute"></div>
            <div className="w-3 h-3 bg-[#cc5c6d] rounded-full relative"></div>
          </div>
          <div className="absolute top-[25%] left-[45%] group">
            <div className="w-3 h-3 bg-[#cc5c6d] rounded-full animate-ping absolute" style={{ animationDelay: "1s" }}></div>
            <div className="w-3 h-3 bg-[#cc5c6d] rounded-full relative"></div>
          </div>
          <div className="absolute top-[45%] left-[65%] group">
            <div className="w-3 h-3 bg-[#cc5c6d] rounded-full animate-ping absolute" style={{ animationDelay: "2s" }}></div>
            <div className="w-3 h-3 bg-[#cc5c6d] rounded-full relative"></div>
          </div>
          <div className="absolute top-[60%] left-[80%] group">
            <div className="w-3 h-3 bg-[#cc5c6d] rounded-full animate-ping absolute" style={{ animationDelay: "1.5s" }}></div>
            <div className="w-3 h-3 bg-[#cc5c6d] rounded-full relative"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 px-8 bg-white border-t border-slate-100">
    <div className="max-w-6xl mx-auto">
      <div className="rounded-[48px] p-12 lg:p-20 flex flex-col md:flex-row gap-12 items-center shadow-2xl relative overflow-hidden" style={{ backgroundColor: '#0a0a20' }}>
        
        {/* Glow circles matching the copilot section */}
        <div className="absolute -right-40 -top-40 w-96 h-96 bg-[#cc5c6d]/10 blur-[120px] rounded-full"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#cc5c6d]/5 blur-[100px] rounded-full"></div>

        <div className="md:w-1/2 relative z-10">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6 tracking-tight">For Universities, Accelerators & Organizations</h2>
          <p className="text-lg text-slate-300 mb-10 leading-relaxed font-light">List your programs on the world's most intelligent discovery network and reach qualified, ambitious talent exactly when they're looking.</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-10">
            <div className="space-y-2">
              <p className="font-heading font-bold text-white text-sm">Publish opportunities</p>
              <p className="text-xs text-slate-400">Instant global reach.</p>
            </div>
            <div className="space-y-2">
              <p className="font-heading font-bold text-white text-sm">Reach global talent</p>
              <p className="text-xs text-slate-400">100k+ active seekers.</p>
            </div>
            <div className="space-y-2">
              <p className="font-heading font-bold text-white text-sm">Personalized matching</p>
              <p className="text-xs text-[#cc5c6d] font-bold">High intent applications.</p>
            </div>
            <div className="space-y-2">
              <p className="font-heading font-bold text-white text-sm">Analytics dashboard</p>
              <p className="text-xs text-slate-400">Track your visibility.</p>
            </div>
          </div>
          <button className="bg-white text-[#0a0a20] px-8 py-4 rounded-full font-bold text-sm hover:bg-slate-100 transition-all" onClick={() => onLaunchApp()}>
            Post an Opportunity
          </button>
        </div>
        <div className="md:w-1/2 relative z-10">
          <div className="bg-white p-8 rounded-3xl hairline-border shadow-2xl shadow-black/20">
             <div className="flex items-center justify-between mb-8">
               <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Partner Dashboard</h6>
               <div className="flex gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
               </div>
             </div>
             <div className="h-32 flex items-end gap-2 mb-8">
               <div className="flex-1 bg-slate-100 rounded-lg" style={{ height: "40%" }}></div>
               <div className="flex-1 bg-slate-100 rounded-lg" style={{ height: "60%" }}></div>
               <div className="flex-1 bg-slate-100 rounded-lg" style={{ height: "45%" }}></div>
               <div className="flex-1 bg-[#cc5c6d] rounded-lg" style={{ height: "90%" }}></div>
               <div className="flex-1 bg-slate-100 rounded-lg" style={{ height: "70%" }}></div>
             </div>
             <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               <span>Reach Growth</span>
               <span className="text-emerald-600">+124% This Month</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-24 px-8 bg-[#EDEDF5]">
    <div className="max-w-6xl mx-auto">
      <div className="rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-[#cc5c6d]/10" style={{ backgroundColor: '#0a0a20' }}>
        <div className="absolute inset-0 opacity-10 -z-10 dot-pattern"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-7xl font-heading font-bold text-white mb-8 tracking-tighter leading-tight">
            Never Miss Another Life-Changing Opportunity
          </h2>
          <p className="text-white/80 text-xl mb-12 font-light leading-relaxed">
            Let Nexora discover, personalize, and track your path to success. Join 100k+ believers today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="w-full sm:w-auto bg-[#cc5c6d] text-white px-12 py-5 rounded-full font-bold text-lg hover:bg-[#b84c5c] transition-all shadow-xl shadow-black/10" onClick={() => onLaunchApp()}>
              Get Started Free
            </button>
            <button className="w-full sm:w-auto bg-white/10 text-white border border-white/20 px-12 py-5 rounded-full font-bold text-lg hover:bg-white/20 transition-all backdrop-blur-sm" onClick={() => onLaunchApp()}>
              Explore Opportunities
            </button>
          </div>
        </div>
        
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[#cc5c6d]/10 blur-[100px] rounded-full"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-[#cc5c6d]/10 blur-[100px] rounded-full"></div>
      </div>
    </div>
  </section>

  
  <footer className="pt-32 pb-16 px-8 bg-white border-t border-[#d0d0cc]">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-24">
        <div className="col-span-2">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 bg-[#0a0a20] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-base lp-font-heading leading-none">✦</span>
            </div>
            <span className="text-[#0d0d14] font-bold text-xl lp-font-heading tracking-tight">Nexora</span>
          </div>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-8 font-light">
            The infrastructure layer for global opportunity discovery and personalized intelligence. Built for the world's most ambitious talent.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-[#cc5c6d] transition-colors hairline-border"><i className="ti ti-brand-twitter"></i></a>
            <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-[#cc5c6d] transition-colors hairline-border"><i className="ti ti-brand-linkedin"></i></a>
            <a href="#" className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-[#cc5c6d] transition-colors hairline-border"><i className="ti ti-brand-github"></i></a>
          </div>
        </div>
        
        <div>
          <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Product</h6>
          <ul className="space-y-4">
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Search</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Recommendations</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Tracker</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Alerts</a></li>
          </ul>
        </div>

        <div>
          <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Resources</h6>
          <ul className="space-y-4">
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Blog</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Guides</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Help Center</a></li>
          </ul>
        </div>

        <div>
          <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Company</h6>
          <ul className="space-y-4">
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">About</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Careers</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Legal</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onLaunchApp(); }} className="text-sm text-slate-500 hover:text-[#cc5c6d] transition-colors cursor-pointer">Privacy</a></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-slate-100 gap-8">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">&copy; 2026 NEXORA INTELLIGENCE SYSTEMS. ALL RIGHTS RESERVED.</p>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  </footer>

</div>
  );
}
