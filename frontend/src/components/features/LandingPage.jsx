import React, { useState } from 'react';

export default function LandingPage({
  searchQuery = '',
  setSearchQuery,
  setSelectedCategory,
  setSelectedCountry,
  setActiveTab,
  onLaunchApp
}) {
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onLaunchApp(searchQuery);
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

  return (
<div className="min-h-screen text-[#0d0d14] font-['Be_Vietnam_Pro']" style={{ background: '#EDEDF5' }}>
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..700&family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
    @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont/tabler-icons.min.css');

    .lp-font-heading { font-family: 'Instrument Sans', sans-serif; }
    .lp-font-body { font-family: 'Be Vietnam Pro', sans-serif; }

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
  <section className="relative pt-28 pb-32 px-8 overflow-hidden">
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
        around the world—all personalized by AI.
      </p>

      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-10">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center p-1.5 bg-white lp-border rounded-2xl shadow-lg shadow-[#0a0a20]/5 focus-within:border-[#0a0a20]/40 transition-all w-full">
          <i className="ti ti-search text-[#9090b0] ml-4 text-lg flex-shrink-0"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="I'm a Computer Science student from India looking for AI research op..."
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
          <a href="#" onClick={(e) => { e.preventDefault(); setSearchQuery('AI Research'); onLaunchApp('AI Research'); }}
            className="text-[12px] font-semibold text-[#4a4a6a] hover:text-[#0a0a20] transition-colors">AI Research</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleQuickCategoryClick('Scholarship'); }}
            className="text-[12px] font-semibold text-[#4a4a6a] hover:text-[#0a0a20] transition-colors">Scholarships</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleQuickCategoryClick('Grant'); }}
            className="text-[12px] font-semibold text-[#4a4a6a] hover:text-[#0a0a20] transition-colors">Startup Grants</a>
          <a href="#" onClick={(e) => { e.preventDefault(); handleQuickCategoryClick('Accelerator'); }}
            className="text-[12px] font-semibold text-[#4a4a6a] hover:text-[#0a0a20] transition-colors">Accelerators</a>
        </div>
      </div>
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
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">AI Matches</p>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 px-8">
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
          <h3 className="font-bold text-xl mb-4 text-[#111111]">Fragmented Info</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-light">Opportunities exist across thousands of isolated websites, government portals, and hidden databases.</p>
        </div>

        <div className="bg-white p-10 rounded-[32px] hairline-border hover:border-[#cc5c6d] hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all group">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#cc5c6d]/10 transition-colors">
            <i className="ti ti-hourglass-low text-[#cc5c6d] text-xl"></i>
          </div>
          <h3 className="font-bold text-xl mb-4 text-[#111111]">Missed Deadlines</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-light">Important programs often close their applications before the right candidates even discover they exist.</p>
        </div>

        <div className="bg-white p-10 rounded-[32px] hairline-border hover:border-[#cc5c6d] hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all group">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#cc5c6d]/10 transition-colors">
            <i className="ti ti-search text-[#cc5c6d] text-xl"></i>
          </div>
          <h3 className="font-bold text-xl mb-4 text-[#111111]">Poor Search</h3>
          <p className="text-sm text-slate-500 leading-relaxed font-light">Traditional search engines don't understand your personal context, goals, or eligibility requirements.</p>
        </div>

        <div className="bg-white p-10 rounded-[32px] hairline-border hover:border-[#cc5c6d] hover:shadow-2xl hover:shadow-[#cc5c6d]/5 transition-all group">
          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-[#cc5c6d]/10 transition-colors">
            <i className="ti ti-layers-intersect text-[#cc5c6d] text-xl"></i>
          </div>
          <h3 className="font-bold text-xl mb-4 text-[#111111]">Application Chaos</h3>
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
            <h4 className="font-bold text-[#111111] mb-3">AI Discovery</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Scans universities, governments, NGOs, and grant sites.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">02</span>
            </div>
            <h4 className="font-bold text-[#111111] mb-3">Data Intel</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Extracts deadlines, eligibility, funding and requirements.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">03</span>
            </div>
            <h4 className="font-bold text-[#111111] mb-3">Opp Graph</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Transforms raw web data into structured opportunities.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">04</span>
            </div>
            <h4 className="font-bold text-[#111111] mb-3">Semantic Search</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Natural language engine for context-aware discovery.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">05</span>
            </div>
            <h4 className="font-bold text-[#111111] mb-3">AI Matching</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Precision matching based on your unique profile.</p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-white border-2 border-[#cc5c6d] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-[#cc5c6d]/10 transition-transform group-hover:scale-110">
              <span className="text-2xl font-bold text-[#cc5c6d]">06</span>
            </div>
            <h4 className="font-bold text-[#111111] mb-3">Tracking</h4>
            <p className="text-xs text-slate-500 leading-relaxed px-4">Manage every application from one intelligent dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 px-8">
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <h2 className="text-4xl font-heading font-bold text-[#111111] mb-4 tracking-tight">Opportunity Categories</h2>
          <p className="text-lg text-slate-500 font-light">Explore thousands of verified opportunities across various sectors.</p>
        </div>
        <button className="text-[#cc5c6d] font-bold text-sm flex items-center gap-2 hover:translate-x-1 transition-transform cursor-pointer" onClick={() => onLaunchApp()}>
          View all 40+ categories <i className="ti ti-arrow-right"></i>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Scholarship"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-school text-[#cc5c6d]"></i></div>
          <h3 className="font-bold text-[#111111] mb-1">Scholarships</h3>
          <p className="text-xs text-slate-400 font-medium">12,400+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Accelerator"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-rocket text-[#cc5c6d]"></i></div>
          <h3 className="font-bold text-[#111111] mb-1">Accelerators</h3>
          <p className="text-xs text-slate-400 font-medium">1,200+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Grant"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-coin text-[#cc5c6d]"></i></div>
          <h3 className="font-bold text-[#111111] mb-1">Grants</h3>
          <p className="text-xs text-slate-400 font-medium">8,900+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Competition"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-trophy text-[#cc5c6d]"></i></div>
          <h3 className="font-bold text-[#111111] mb-1">Competitions</h3>
          <p className="text-xs text-slate-400 font-medium">450+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Research Programs"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-flask text-[#cc5c6d]"></i></div>
          <h3 className="font-bold text-[#111111] mb-1">Research Programs</h3>
          <p className="text-xs text-slate-400 font-medium">3,100+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Exchange"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-world text-[#cc5c6d]"></i></div>
          <h3 className="font-bold text-[#111111] mb-1">Exchange Programs</h3>
          <p className="text-xs text-slate-400 font-medium">600+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Conference"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-microphone text-[#cc5c6d]"></i></div>
          <h3 className="font-bold text-[#111111] mb-1">Conferences</h3>
          <p className="text-xs text-slate-400 font-medium">2,300+ Active</p>
        </div>
        <div onClick={(e) => { e.preventDefault(); handleQuickCategoryClick("Fellowship"); } } className="bg-white p-8 rounded-3xl hairline-border hover:border-[#cc5c6d] hover:shadow-xl transition-all group cursor-pointer">
          <div className="text-4xl mb-6 transform group-hover:scale-110 transition-transform duration-300"><i className="ti ti-users text-[#cc5c6d]"></i></div>
          <h3 className="font-bold text-[#111111] mb-1">Fellowships</h3>
          <p className="text-xs text-slate-400 font-medium">1,500+ Active</p>
        </div>
      </div>
    </div>
  </section>

  
  <section className="py-32 px-8">
    <div className="max-w-6xl mx-auto rounded-[48px] p-12 lg:p-20 overflow-hidden relative border border-white/10 shadow-2xl" style={{ backgroundColor: '#0a0a20' }}>
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#cc5c6d] text-[10px] font-black mb-8 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#cc5c6d] animate-pulse"></span>
            Personalized Intelligence
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-8 tracking-tight leading-tight">Your AI Opportunity Copilot</h2>
          <p className="text-lg text-slate-400 mb-12 font-light leading-relaxed">Stop searching, start discovering. Nexora continuously monitors the global landscape and delivers precision matches based on your specific background and goals.</p>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-12">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Because you're:</p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-[#cc5c6d]/20 text-[#cc5c6d] rounded-xl text-xs font-bold border border-[#cc5c6d]/30">AI Student</span>
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
            <h4 className="font-bold text-[#111111] text-lg mb-1">Google Research Fellowship</h4>
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
            <h4 className="font-bold text-[#111111] text-lg mb-1">Microsoft Imagine Cup</h4>
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
            <h4 className="font-bold text-[#111111] text-lg mb-1">ETH Zurich Summer Research</h4>
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
                <h6 className="font-bold text-xs text-[#111111] mb-2">Gates Cambridge Scholarship</h6>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold">University of Cambridge</span>
                  <span className="text-[#cc5c6d]">Oct 12</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl hairline-border shadow-sm hover:shadow-md transition-shadow">
                <h6 className="font-bold text-xs text-[#111111] mb-2">MIT Bio-Innovation Grant</h6>
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
                <h6 className="font-bold text-xs text-[#111111] mb-2">Rhodes Scholarship 2026</h6>
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
                <h6 className="font-bold text-xs text-[#111111] mb-2">Google Research Fellowship</h6>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span className="font-bold text-[#cc5c6d]">Applied 2d ago</span>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border-l-4 border-l-[#cc5c6d] hairline-border shadow-sm">
                <h6 className="font-bold text-xs text-[#111111] mb-2">Schwarzman Scholars</h6>
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
                <h6 className="font-bold text-xs text-[#111111] mb-2">Knight-Hennessy Scholars</h6>
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
                <h6 className="font-bold text-xs text-[#111111] mb-2">Erasmus Mundus AI Program</h6>
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

  
  <section className="py-32 px-8 bg-[#F7F7F7]">
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
          <p className="text-slate-300 mb-10 leading-relaxed font-light">List your programs on the world's most intelligent discovery network and reach qualified, ambitious talent exactly when they're looking.</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mb-10">
            <div className="space-y-2">
              <p className="font-bold text-white text-sm">Publish opportunities</p>
              <p className="text-xs text-slate-400">Instant global reach.</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-white text-sm">Reach global talent</p>
              <p className="text-xs text-slate-400">100k+ active seekers.</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-white text-sm">AI-powered matching</p>
              <p className="text-xs text-[#cc5c6d] font-bold">High intent applications.</p>
            </div>
            <div className="space-y-2">
              <p className="font-bold text-white text-sm">Analytics dashboard</p>
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

  
  <section className="py-24 px-8">
    <div className="max-w-6xl mx-auto">
      <div className="rounded-[48px] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-[#cc5c6d]/10" style={{ backgroundColor: '#0a0a20' }}>
        <div className="absolute inset-0 opacity-10 -z-10 dot-pattern"></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-7xl font-heading font-bold text-white mb-8 tracking-tighter leading-tight">
            Never Miss Another Life-Changing Opportunity
          </h2>
          <p className="text-white/80 text-xl mb-12 font-light leading-relaxed">
            Let Nexora's AI discover, personalize, and track your path to success. Join 100k+ believers today.
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
