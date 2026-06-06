import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { 
  Search, 
  LayoutDashboard, 
  ListTree, 
  Calendar, 
  Server, 
  DollarSign, 
  MapPin, 
  Globe, 
  Pin, 
  Send, 
  Trophy, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Filter, 
  Database, 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Save, 
  FileText, 
  ExternalLink, 
  RefreshCw, 
  Layers,
  User,
  GraduationCap,
  Building,
  Plus,
  X,
  Briefcase,
  Percent,
  Palette,
  Users,
  Rocket
} from 'lucide-react';



const PRESET_THEMES = [
  {
    id: 'nexora',
    name: 'Nexora Premium Light',
    background: '#f5f7fb',
    bgSidebar: 'rgba(248, 250, 252, 0.9)',
    bgCard: '#ffffff',
    bgInput: '#eef2f6',
    bgActive: 'rgba(37, 99, 235, 0.08)',
    borderPrimary: 'rgba(0, 0, 0, 0.06)',
    borderSecondary: 'rgba(0, 0, 0, 0.12)',
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#64748b',
    primaryAccent: '#2563eb',
    secondaryAccent: '#06b6d4',
    successAccent: '#10b981',
    borderRadius: '8px',
    fontHeadline: 'Plus Jakarta Sans',
    tagline: 'Premium light mode color template matching the Nexora design system.'
  },
  {
    id: 'arctic',
    name: 'Arctic Frost (Surgical Light)',
    background: '#f9f9f9',
    bgSidebar: 'rgba(243, 243, 244, 0.85)',
    bgCard: 'rgba(255, 255, 255, 0.95)',
    bgInput: 'rgba(238, 238, 238, 0.8)',
    bgActive: 'rgba(37, 99, 235, 0.1)',
    borderPrimary: 'rgba(0, 0, 0, 0.06)',
    borderSecondary: 'rgba(0, 0, 0, 0.12)',
    textPrimary: '#1a1c1c',
    textSecondary: '#434655',
    textMuted: '#737686',
    primaryAccent: '#2563eb',
    secondaryAccent: '#0d9488',
    successAccent: '#16a34a',
    borderRadius: '8px',
    fontHeadline: 'Plus Jakarta Sans',
    tagline: 'Surgical minimalist clinical layout optimized for low-friction reading.'
  },
  {
    id: 'obsidian',
    name: 'Obsidian Emerald (Clinical High-Tech)',
    background: '#020617',
    bgSidebar: 'rgba(15, 23, 42, 0.85)',
    bgCard: 'rgba(15, 23, 42, 0.65)',
    bgInput: 'rgba(7, 13, 31, 0.8)',
    bgActive: 'rgba(16, 185, 129, 0.15)',
    borderPrimary: 'rgba(255, 255, 255, 0.06)',
    borderSecondary: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#dce1fb',
    textSecondary: '#bbcabf',
    textMuted: '#86948a',
    primaryAccent: '#10b981',
    secondaryAccent: '#38bdf8',
    successAccent: '#10b981',
    borderRadius: '4px',
    fontHeadline: 'JetBrains Mono',
    tagline: 'OLED obsidian void optimized for power-user metrics and AI signals.'
  },
  {
    id: 'celestial',
    name: 'Celestial Slate (Quiet Space)',
    background: '#0f172a',
    bgSidebar: 'rgba(30, 41, 59, 0.85)',
    bgCard: 'rgba(30, 41, 59, 0.65)',
    bgInput: 'rgba(15, 23, 42, 0.8)',
    bgActive: 'rgba(100, 116, 139, 0.15)',
    borderPrimary: 'rgba(255, 255, 255, 0.06)',
    borderSecondary: 'rgba(255, 255, 255, 0.12)',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    primaryAccent: '#64748b',
    secondaryAccent: '#cbd5e1',
    successAccent: '#10b981',
    borderRadius: '6px',
    fontHeadline: 'Plus Jakarta Sans',
    tagline: 'Muted slate design for developers and systematic researchers.'
  }
];

// API Configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('discovery'); // Set AI Search as default home page
  
  // Theme States
  const [activeTheme, setActiveTheme] = useState('nexora');
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#9333ea');
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#06b6d4');
  const [customBackgroundColor, setCustomBackgroundColor] = useState('#0b1326');
  
  // Data States
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [scraperSources, setScraperSources] = useState([]);
  const [stats, setStats] = useState({
    total_opportunities: 0,
    saved_applications: 0,
    applied_applications: 0,
    accepted_applications: 0,
    upcoming_deadlines_count: 0,
    category_distribution: {},
    pipeline_stages: {}
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [searching, setSearching] = useState(false);

  // Modal / Detail States
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [activeApplication, setActiveApplication] = useState(null);

  // Scraper Progress States
  const [scraperLogs, setScraperLogs] = useState([]);
  const [scraperRunning, setScraperRunning] = useState(false);
  const logEndRef = useRef(null);

  // Profile & Recommendation States
  const [profile, setProfile] = useState(null);
  const [discoveryMode, setDiscoveryMode] = useState('all'); // 'all' or 'matched'
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [newRegionInput, setNewRegionInput] = useState('');

  const applyThemeById = (themeId) => {
    setActiveTheme(themeId);
    const selected = PRESET_THEMES.find(t => t.id === themeId);
    if (!selected) return;
    
    const root = document.documentElement;
    root.style.setProperty('--bg-darkest', selected.background);
    root.style.setProperty('--bg-sidebar', selected.bgSidebar);
    root.style.setProperty('--bg-card', selected.bgCard);
    root.style.setProperty('--bg-input', selected.bgInput);
    root.style.setProperty('--bg-active', selected.bgActive);
    
    root.style.setProperty('--border-primary', selected.borderPrimary);
    root.style.setProperty('--border-secondary', selected.borderSecondary);
    
    root.style.setProperty('--text-primary', selected.textPrimary);
    root.style.setProperty('--text-secondary', selected.textSecondary);
    root.style.setProperty('--text-muted', selected.textMuted);
    
    root.style.setProperty('--color-indigo', selected.primaryAccent);
    root.style.setProperty('--color-cyan', selected.secondaryAccent);
    root.style.setProperty('--color-success', selected.successAccent);
  };


  // Fetch all basic telemetry
  const fetchData = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch(`${API_BASE}/opportunities/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Opportunities
      const catParam = selectedCategory !== 'All' ? selectedCategory : 'All';
      const countryParam = selectedCountry !== 'All' ? selectedCountry : 'All';
      const oppsRes = await fetch(`${API_BASE}/opportunities/?category=${catParam}&country=${countryParam}&page=${currentPage}&limit=${itemsPerPage}`);
      if (oppsRes.ok) {
        const oppsData = await oppsRes.json();
        setOpportunities(oppsData.opportunities);
        setTotalCount(oppsData.total);
      }

      // 3. Fetch Applications
      const appsRes = await fetch(`${API_BASE}/applications/`);
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        setApplications(appsData);
      }

      // 4. Fetch Scraper Sources
      const srcRes = await fetch(`${API_BASE}/scraper/sources`);
      if (srcRes.ok) {
        const srcData = await srcRes.json();
        setScraperSources(srcData);
      }
    } catch (err) {
      console.error("Error loading Nexora API data:", err);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile/`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const saveUserProfile = async (updatedProfile) => {
    try {
      const res = await fetch(`${API_BASE}/profile/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (discoveryMode === 'matched') {
          fetchRecommendations();
        }
        alert("Profile settings saved and matches re-calculated!");
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await fetch(`${API_BASE}/opportunities/recommendations`);
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Run on mount and filter/pagination changes
  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedCountry, currentPage, itemsPerPage]);

  // Fetch profile on mount
  useEffect(() => {
    fetchUserProfile();
    applyThemeById('nexora');
  }, []);

  // Reactively fetch recommendations when mode switches to matched
  useEffect(() => {
    if (discoveryMode === 'matched') {
      fetchRecommendations();
    }
  }, [discoveryMode]);

  // Reset page when category or country changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedCountry]);

  // Scroll logging console to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scraperLogs]);

  // Execute NLP/AI Search
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/opportunities/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
        setTotalCount(data.length);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  // Save opportunity to tracker
  const handleSaveToTracker = async (oppId) => {
    try {
      const res = await fetch(`${API_BASE}/applications/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity_id: oppId,
          status: 'Saved',
          priority: 'Medium'
        })
      });
      if (res.ok) {
        fetchData();
        alert("Opportunity successfully pinned to tracker!");
      }
    } catch (err) {
      console.error("Failed to pin application:", err);
    }
  };

  // Move tracker application status
  const handleUpdateAppStatus = async (appId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Save custom application notes/details
  const handleSaveNotes = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/applications/${activeApplication.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: activeApplication.status,
          notes: activeApplication.notes,
          priority: activeApplication.priority,
          applied_date: activeApplication.applied_date || null
        })
      });
      if (res.ok) {
        fetchData();
        setActiveApplication(null);
      }
    } catch (err) {
      console.error("Failed to save application notes:", err);
    }
  };

  // Delete Application
  const handleDeleteApplication = async (appId) => {
    if (!confirm("Are you sure you want to remove this opportunity from your tracker?")) return;
    try {
      const res = await fetch(`${API_BASE}/applications/${appId}`, {
        method: 'DELETE'
      });
      if (res.status === 204) {
        fetchData();
        setActiveApplication(null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Trigger streaming scraping crawl
  const handleTriggerScraper = () => {
    if (scraperRunning) return;
    setScraperLogs([]);
    setScraperRunning(true);
    
    // Open EventSource streaming logging
    const sse = new EventSource(`${API_BASE}/scraper/run`);
    
    sse.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setScraperLogs((prev) => [...prev, log]);
      
      if (log.status === 'done') {
        sse.close();
        setScraperRunning(false);
        fetchData(); // Reload all newly crawled records
      }
    };

    sse.onerror = (err) => {
      console.error("SSE Connection failed:", err);
      setScraperLogs((prev) => [...prev, { status: 'error', message: 'SSE Connection to backend lost. Scraping stopped.' }]);
      sse.close();
      setScraperRunning(false);
    };
  };

  // Helpers for deadline format
  const formatDeadline = (dateStr) => {
    if (!dateStr) return "Rolling / Unspecified";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const deadline = new Date(dateStr);
    const today = new Date();
    deadline.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diff = deadline - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDeterministicMatch = (str) => {
    if (!str) return 85;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return 75 + (Math.abs(hash) % 25); // returns between 75% and 99%
  };

  const calculateCompleteness = () => {
    if (!profile) return 0;
    let score = 0;
    if (profile.name) score += 10;
    if (profile.email) score += 10;
    if (profile.bio && profile.bio.trim().length > 10) score += 15;
    if (profile.academic_status) score += 15;
    if (profile.university) score += 15;
    if (profile.verified_academic_id) score += 10;
    if (profile.research_interests && profile.research_interests.length > 0) score += 15;
    if (profile.preferred_regions && profile.preferred_regions.length > 0) score += 10;
    return score;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage <= 3) {
        pages.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages.map((p, idx) => (
      <button
        key={idx}
        className={`page-num-btn ${p === currentPage ? 'active' : ''} ${p === '...' ? 'disabled' : ''}`}
        disabled={p === '...'}
        onClick={() => typeof p === 'number' && setCurrentPage(p)}
      >
        {p}
      </button>
    ));
  };

  // Construct July 2026 Calendar Grid (Starts Wednesday, 31 days)
  const renderJuly2026Calendar = () => {
    const totalDays = 31;
    const startOffset = 3;
    const cells = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Muted offset days for June
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push(
        <div key={`offset-${i}`} className="calendar-cell muted">
          <div className="calendar-cell-num">{28 - i}</div>
        </div>
      );
    }

    // Active July days
    for (let day = 1; day <= totalDays; day++) {
      const isToday = day === 27;
      const cellDateStr = `2026-07-${day.toString().padStart(2, '0')}`;
      const dayEvents = applications.filter(app => app.opportunity.deadline === cellDateStr);

      cells.push(
        <div key={`day-${day}`} className={`calendar-cell ${isToday ? 'today' : ''}`}>
          <div className="calendar-cell-num">{day}</div>
          {dayEvents.map(evt => (
            <div 
              key={evt.id} 
              className="calendar-event"
              title={`${evt.opportunity.title} (${evt.status})`}
              onClick={() => setSelectedOpportunity(evt.opportunity)}
            >
              {evt.opportunity.title}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="calendar-view-container">
        <div className="calendar-header-bar">
          <div className="calendar-title-text">Deadlines &bull; July 2026</div>
          <div className="card-category-badge">{applications.length} Pinned Items</div>
        </div>
        <div className="calendar-grid-canvas">
          {weekdays.map(d => (
            <div key={d} className="calendar-day-header">{d}</div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  const renderFullPageOpportunityDetail = () => {
    const opp = selectedOpportunity;
    const daysLeft = getDaysLeft(opp.deadline);
    const isPinned = applications.some(app => app.opportunity_id === opp.id);
    const matchScore = opp.match_score || getDeterministicMatch(opp.title);

    const isGoogleFellowship = opp.title?.includes("Google AI Fellowship");
    const fundingVal = isGoogleFellowship ? "$50,000 USD stipend + tuition coverage" : (opp.funding || 'Full funding coverage');
    const deadlineVal = isGoogleFellowship ? "December 01, 2025 (11:59 PM PST)" : formatDeadline(opp.deadline);
    const eligibilityVal = isGoogleFellowship ? "Full-time Ph.D. students in Computer Science or related fields" : (opp.eligibility || 'Ph.D. candidates or graduate students doing machine learning research');
    const durationVal = isGoogleFellowship ? "Up to 3 years of funding" : (opp.duration || 'Up to 3 years of program support');
    const locationVal = isGoogleFellowship ? "Global (Affiliated with recognized universities)" : (opp.country || 'Global');
    const materialsVal = isGoogleFellowship ? "CV, 3 Recommendation Letters, Research Proposal" : 'CV, 3 Recommendation Letters, Research Statement';
    const descriptionVal = isGoogleFellowship 
      ? "The Google AI Fellowship Program recognizes outstanding graduate students doing exceptional and innovative research in areas relevant to computer science and related fields. Fellowships support promising Ph.D. candidates of all backgrounds who seek to influence the future of technology."
      : opp.description;

    const alignmentTags = opp.category === 'Fellowship' 
      ? ['Ph.D. Required', 'Deep Learning', 'Publication Track']
      : ['Student Eligible', 'Relocation Supported', 'Tech Track'];

    return (
      <div className="opportunity-full-detail-view" style={{ animation: 'fade-in 0.3s ease-out', paddingBottom: '3rem' }}>
        
        {/* Back navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => setSelectedOpportunity(null)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.5rem 1rem', borderRadius: '20px' }}
          >
            &larr; Back to Discoveries
          </button>
        </div>

        {/* 1. Opportunity Header card */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <span className="card-category-badge" style={{ display: 'inline-block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {opp.category === 'Fellowship' ? 'Education & Research' : opp.category}
              </span>
              <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: '1.2' }}>{opp.title}</h1>
              
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="academic-verified-badge" style={{ position: 'static', padding: '0.3rem 0.65rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center' }}>
                  <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
                  Verified Opportunity
                </span>
                {opp.deadline && (
                  <span className="card-deadline-countdown" style={{ padding: '0.3rem 0.65rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center' }}>
                    <Clock size={12} style={{ marginRight: '4px' }} />
                    {daysLeft > 0 ? `Closing in ${daysLeft} days` : daysLeft === 0 ? 'Closing today' : 'Closed'}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'center' }}>
              <button 
                type="button"
                className="btn btn-secondary" 
                style={{ borderRadius: '8px', padding: '0.65rem 1.25rem', background: isPinned ? 'var(--bg-active)' : 'var(--bg-card)', color: isPinned ? 'var(--text-secondary)' : 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => handleSaveToTracker(opp.id)}
                disabled={isPinned}
              >
                <Pin size={14} />
                {isPinned ? '✓ Saved' : 'Save for Later'}
              </button>
              <a 
                href={opp.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-save-profile-glow"
                style={{ borderRadius: '100px', padding: '0.75rem 2rem', textDecoration: 'none', color: '#fff', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(0, 77, 230, 0.4)' }}
              >
                Apply Now
              </a>
            </div>
          </div>
        </div>

        {/* 2. AI Personal Alignment Card */}
        <div className="glass-card" style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Radial progress meter */}
          <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
            <svg width="90" height="90" viewBox="0 0 36 36">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="2.5"
              />
              <path
                className="circle"
                strokeDasharray={`${matchScore}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
              />
            </svg>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {matchScore}%
            </div>
          </div>

          <div style={{ flexGrow: 1, minWidth: '250px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>AI Personal Alignment</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Based on your research history in {profile?.research_interests?.[0] || 'Neural Radiance Fields'} and your {profile?.academic_status || 'academic'} status, this opportunity is an elite match for your profile.
            </p>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignSelf: 'center' }}>
            {alignmentTags.map(tag => (
              <span key={tag} className="chat-filter-select" style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', border: '1px solid var(--border-primary)', borderRadius: '16px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 3. Main content body Bento Layout */}
        <div className="bento-grid" style={{ marginBottom: '1.5rem' }}>
          
          {/* Left column (Bento Col 4) */}
          <div className="bento-col-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Tracking Status */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Tracking Status</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                {/* Vertical line indicator */}
                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-primary)' }}></div>
                
                {/* Step 1 */}
                <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' }}>✓</div>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Application Discovered</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Identified by Nexora on Oct 12</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.7rem' }}>✓</div>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Profile Alignment Check</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{matchScore}% match verified</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-darkest)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="animate-pulse" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)' }}></span>
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>Preparation Phase</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Drafting research proposal</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{ display: 'flex', gap: '1rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--bg-darkest)', border: '2px solid var(--border-primary)' }}></div>
                  <div>
                    <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)' }}>Final Submission</h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Deadline: {isGoogleFellowship ? "Dec 01, 2025" : formatDeadline(opp.deadline)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Nexora Insights */}
            <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.03) 0%, rgba(6, 182, 212, 0.03) 100%)' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', color: 'var(--color-cyan)' }}>
                <Layers size={16} />
                <h4 style={{ fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nexora Insights</h4>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.6' }}>
                "Applicants who emphasize cross-disciplinary applications of AI in climate science have had a 15% higher acceptance rate in previous cohorts."
              </p>
            </div>
          </div>

          {/* Right column (Bento Col 8) */}
          <div className="bento-col-8" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Detailed Specifications Table */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>Detailed Specifications</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid var(--border-primary)' }}>
                  <div style={{ width: '150px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Funding Amount</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700' }}>{fundingVal}</div>
                </div>
                <div style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid var(--border-primary)' }}>
                  <div style={{ width: '150px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Application Deadline</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{deadlineVal}</div>
                </div>
                <div style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid var(--border-primary)' }}>
                  <div style={{ width: '150px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Eligibility</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{eligibilityVal}</div>
                </div>
                <div style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid var(--border-primary)' }}>
                  <div style={{ width: '150px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Duration</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{durationVal}</div>
                </div>
                <div style={{ display: 'flex', padding: '0.75rem 0', borderBottom: '1px solid var(--border-primary)' }}>
                  <div style={{ width: '150px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Location</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{locationVal}</div>
                </div>
                <div style={{ display: 'flex', padding: '0.75rem 0' }}>
                  <div style={{ width: '150px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Required Materials</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{materialsVal}</div>
                </div>
              </div>
            </div>

            {/* About the Fellowship */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem' }}>About the Fellowship</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                {descriptionVal}
              </p>

              {/* Two Column Feature Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem', color: 'var(--color-primary)' }}>
                    <Users size={14} />
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700' }}>Mentorship</h4>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Direct connection to a Google Research Mentor for the duration of the fellowship.
                  </p>
                </div>

                <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.35rem', color: 'var(--color-secondary)' }}>
                    <Rocket size={14} />
                    <h4 style={{ fontSize: '0.75rem', fontWeight: '700' }}>Industry Exposure</h4>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    Opportunity for paid internships at Google research hubs globally.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Interactive Google Maps Locator */}
        <div style={{ position: 'relative', width: '100%', borderRadius: '12px', overflow: 'hidden', height: '320px', boxShadow: 'var(--shadow-main)', border: '1px solid var(--border-primary)' }}>
          <iframe 
            title="Opportunity Location Map"
            width="100%" 
            height="100%" 
            style={{ border: 0, filter: 'grayscale(0.1) contrast(1.1)' }} 
            loading="lazy" 
            allowFullScreen 
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(`${opp.organization} ${opp.country || ''}`.trim())}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
          ></iframe>
          <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.7rem', color: '#fff', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }}>
            Google Maps Locator &mdash; {opp.organization} ({opp.country || 'Global'})
          </div>
        </div>

      </div>
    );
  };


  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-nav-container">
          <div className="brand-section">
            <span className="brand-name">Nexora</span>
          </div>

          <div>
            <div className="nav-section-title">Intelligence</div>
            <nav className="nav-links">
              <li className={`nav-item ${activeTab === 'discovery' ? 'active' : ''}`} onClick={() => setActiveTab('discovery')}>
  <Search className="nav-icon" />
  Search & Explore
</li>
<li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
  <LayoutDashboard className="nav-icon" />
  Dashboard
</li>
<li className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
  <User className="nav-icon" />
  Profile Settings
</li>
            </nav>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div className="nav-section-title">Applications</div>
            <nav className="nav-links">
              <li className={`nav-item ${activeTab === 'tracker' ? 'active' : ''}`} onClick={() => setActiveTab('tracker')}>
  <ListTree className="nav-icon" />
  Simple Tracker
</li>
              <li className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
  <Calendar className="nav-icon" />
  Timeline View
</li>
            </nav>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div className="nav-section-title">Workers</div>
            <nav className="nav-links">
              <li 
                className={`nav-item ${activeTab === 'scraper' ? 'active' : ''}`}
                onClick={() => setActiveTab('scraper')}
              >
                Monitored Scrapers
              </li>
            </nav>
          </div>
        </div>

        <div className="sidebar-footer">
          <span className="system-dot"></span>
          <span>System Active</span>
        </div>
      </aside>

      {/* MAIN CONTENT CANVAS */}
      <main className="main-canvas">
        {selectedOpportunity ? (
          renderFullPageOpportunityDetail()
        ) : (
          <>
            {/* HEADER BAR */}
            <header className="canvas-header">
          <div className="header-titles">
            <h1>{
              activeTab === 'dashboard' ? 'Dashboard Overview' :
              activeTab === 'discovery' ? 'AI Opportunity Discovery' :
              activeTab === 'profile' ? 'Profile Intelligence Hub' :
              activeTab === 'tracker' ? 'My Application Pipeline' :
              activeTab === 'calendar' ? 'Timeline Milestones' :
              'Scraper Workers & Controls'
            }</h1>
            <p>{
              activeTab === 'dashboard' ? 'Real-time telemetry and overview of tracking pipeline.' :
              activeTab === 'discovery' ? 'Search naturally and discover fully structured opportunities.' :
              activeTab === 'profile' ? 'Configure settings and verify credentials for real-time recommendation overlays.' :
              activeTab === 'tracker' ? 'Manage, prioritize, and track active application stages.' :
              activeTab === 'calendar' ? 'Calendar overview of saved fellowship and scholarship deadlines.' :
              'Trigger scraper daily workers and inspect live Gemini extraction logs.'
            }</p>
          </div>
        </header>


        {activeTab === 'discovery' && (
          <div className="discovery-container">
            {/* Scrollable feed section */}
            <div className="discovery-feed-scroll">
              {/* Hero Header */}
              <div style={{
                background: '#004de6',
                borderRadius: '12px',
                padding: '2.5rem 2rem',
                color: '#fff',
                marginBottom: '2rem',
                boxShadow: 'var(--shadow-main)'
              }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '700', marginBottom: '0.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Discover Your Next Big Opportunity</h1>
                <p style={{ fontSize: '1rem', opacity: '0.9', maxWidth: '600px' }}>Our AI-powered hybrid reasoning engine continuously monitors global portals to bring you the best fellowships, grants, and internships tailored to your profile.</p>
              </div>

              {/* Discovery Mode Switch Tabs */}
              <div className="mode-switch-tabs" style={{ marginBottom: '1.5rem' }}>
                <button 
                  className={`mode-switch-tab ${discoveryMode === 'all' ? 'active' : ''}`}
                  onClick={() => setDiscoveryMode('all')}
                >
                  <Search size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  All Discoveries
                </button>
                <button 
                  className={`mode-switch-tab ${discoveryMode === 'matched' ? 'active' : ''}`}
                  onClick={() => setDiscoveryMode('matched')}
                >
                  <Trophy size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Matched For You (Top 12)
                </button>
              </div>

              {discoveryMode === 'all' ? (
                /* Advanced filter select tools */
                <div className="chat-filters-panel" style={{ marginBottom: '2rem' }}>
                  <select 
                    className="chat-filter-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="All">All Categories</option>
                    <option value="Fellowship">Fellowships</option>
                    <option value="Scholarship">Scholarships</option>
                    <option value="Grant">Grants</option>
                    <option value="Accelerator">Accelerators</option>
                    <option value="Hackathon">Hackathons</option>
                  </select>

                  <select 
                    className="chat-filter-select"
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                  >
                    <option value="All">All Regions</option>
                    <option value="Global">Global</option>
                    <option value="India">India</option>
                    <option value="Europe">Europe</option>
                    <option value="USA">USA</option>
                  </select>

                  {(selectedCategory !== 'All' || selectedCountry !== 'All' || searchQuery) && (
                    <button 
                      className="chat-filter-select" 
                      onClick={() => { setSelectedCategory('All'); setSelectedCountry('All'); setSearchQuery(''); setCurrentPage(1); }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              ) : (
                /* Matched For You Info banner */
                <div className="glass-card recommendation-banner" style={{ marginBottom: '2rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--accent-cyan)' }}>
                  <Globe size={24} className="text-cyan animate-pulse" />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>Personalized Opportunities Match Feed</h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      These high-fidelity matches are dynamically scored and intersected using the academic credentials, relocation settings, and research interest tags in your <strong>Profile Settings</strong> tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Opportunities list */}
              {loadingRecommendations ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
                  <div className="spinner-glow"></div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '1rem' }}>Recalculating and intersecting opportunity vectors...</p>
                </div>
              ) : (discoveryMode === 'all' ? opportunities : recommendations).length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', borderStyle: 'dashed' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {discoveryMode === 'all' 
                      ? 'No opportunities found in this query. Seed the database using Monitored Scrapers.' 
                      : 'No recommendations found. Go to the Profile Settings tab to configure your academic status and research interest tags.'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="opportunity-feed">
                    {(discoveryMode === 'all' ? opportunities : recommendations).map(opp => {
                      const daysLeft = getDaysLeft(opp.deadline);
                      const isPinned = applications.some(app => app.opportunity_id === opp.id);
                      const matchScore = opp.match_score || getDeterministicMatch(opp.title);
                      
                      return (
                        <div className="glass-card opportunity-card" key={opp.id}>
                          <div>
                            <div className="card-top">
                              <span className="card-category-badge">{opp.category}</span>
                              {opp.deadline && (
                                <span className={`card-deadline-countdown ${daysLeft <= 14 ? 'critical' : ''}`}>
                                  <Clock size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                  {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Expired'}
                                </span>
                              )}
                            </div>
                            <h3 className="opp-title" title={opp.title}>{opp.title}</h3>
                            <div className="opp-org">{opp.organization}</div>
                            
                            {/* AI Match Score Progress Bar */}
                            <div className="match-score-row">
                              <div className="match-score-label">
                                <span className="match-score-pct">{matchScore}%</span>
                                <span className="match-score-text">Match Score</span>
                              </div>
                              <div className="match-bar-track">
                                <div className="match-bar-fill" style={{ width: `${matchScore}%` }}></div>
                              </div>
                            </div>

                            <p className="opp-desc-snippet">{opp.description}</p>
                          </div>

                          <div>
                            <div className="opp-meta-row">
                              <span className="opp-meta-item">
                                <DollarSign size={14} style={{ marginRight: '2px', color: 'var(--color-success)', verticalAlign: 'middle' }} />
                                <strong>{opp.funding || 'Unspecified'}</strong>
                              </span>
                              <span className="opp-meta-item">
                                <MapPin size={14} style={{ marginRight: '2px', color: 'var(--color-indigo)', verticalAlign: 'middle' }} />
                                <strong>{opp.country || 'Global'}</strong>
                              </span>
                            </div>
                            <div className="card-action-bar">
                              <button className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={() => setSelectedOpportunity(opp)}>
                                Details
                              </button>
                              <button 
                                className="btn" 
                                style={{ flexGrow: 1, background: isPinned ? 'var(--bg-active)' : 'var(--text-primary)', border: isPinned ? '1px solid var(--border-secondary)' : 'none', color: isPinned ? 'var(--text-secondary)' : 'var(--bg-darkest)' }} 
                                onClick={() => handleSaveToTracker(opp.id)}
                                disabled={isPinned}
                              >
                                {isPinned ? '✓ Pinned' : 'Pin Tracker'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* High-fidelity Pagination Toolbar */}
                  {!searchQuery.trim() && totalCount > itemsPerPage && (
                    <div className="pagination-toolbar glass-card" style={{ marginTop: '2.5rem', animation: 'fade-in-up 0.5s ease-out' }}>
                      <div className="pagination-info">
                        Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, totalCount)}</strong> of <strong>{totalCount}</strong> opportunities
                      </div>
                      <div className="pagination-controls">
                        <button 
                          className="btn btn-secondary btn-pagination" 
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                          &larr; Prev
                        </button>
                        
                        <div className="pagination-numbers">
                          {renderPageNumbers()}
                        </div>
                        
                        <button 
                          className="btn btn-secondary btn-pagination" 
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                          Next &rarr;
                        </button>
                      </div>
                      <div className="pagination-size">
                        <span>Show</span>
                        <select 
                          className="chat-filter-select" 
                          style={{ padding: '0.2rem 1.8rem 0.2rem 0.6rem', height: '32px', borderRadius: '16px', fontSize: '0.8rem' }}
                          value={itemsPerPage} 
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                        <span>per page</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sticky Floating Search Bar with Gradient Ambient Glow */}
            <div className="chat-input-container">
              <div className="chat-input-glow"></div>
              <div className="chat-input-wrapper">
                <form onSubmit={handleSearchSubmit}>
                  <div className="chat-search-icon">
                    <Search size={18} />
                  </div>
                  <input 
                    type="text" 
                    className="chat-input-field" 
                    placeholder="Search Nexora... (e.g. 'fully funded AI fellowships for Indian students')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="chat-submit-btn" disabled={searching}>
                    {searching ? '●' : <ArrowRight size={16} />}
                  </button>
                </form>
              </div>
              <span className="chat-footnote">AI Search System</span>
            </div>
          </div>
        )}

        {/* 2. ANALYTICS DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-view">
            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="glass-card stat-item">
                <div className="stat-label-row">
                  <span>Total Discoveries</span>
                  <span className="stat-icon-mini"><Globe size={16} /></span>
                </div>
                <div className="stat-val">{stats.total_opportunities}</div>
              </div>
              <div className="glass-card stat-item">
                <div className="stat-label-row">
                  <span>Pinned Items</span>
                  <span className="stat-icon-mini"><Pin size={16} /></span>
                </div>
                <div className="stat-val">{stats.saved_applications}</div>
              </div>
              <div className="glass-card stat-item">
                <div className="stat-label-row">
                  <span>Applied Stage</span>
                  <span className="stat-icon-mini"><Send size={16} /></span>
                </div>
                <div className="stat-val">{stats.applied_applications}</div>
              </div>
              <div className="glass-card stat-item">
                <div className="stat-label-row">
                  <span>Offers Accepted</span>
                  <span className="stat-icon-mini"><Trophy size={16} /></span>
                </div>
                <div className="stat-val">{stats.accepted_applications}</div>
              </div>
            </div>

            {/* Split Visual Section */}
            <div className="dashboard-grid">
              {/* Category distribution */}
              <div className="glass-card">
                <div className="chart-header">Category Distribution</div>
                <div className="distribution-list">
                  {Object.entries(stats.category_distribution).map(([cat, val]) => {
                    const pct = stats.total_opportunities ? (val / stats.total_opportunities) * 100 : 0;
                    return (
                      <div className="dist-row" key={cat}>
                        <div className="dist-label-row">
                          <span style={{ color: 'var(--text-secondary)' }}>{cat}</span>
                          <strong>{val} ({pct.toFixed(0)}%)</strong>
                        </div>
                        <div className="dist-track">
                          <div className="dist-bar" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deadline alert & tracker health */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="chart-header">Pipeline Alerts</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    You have <strong style={{ color: 'var(--text-primary)' }}>{stats.upcoming_deadlines_count} active deadlines</strong> for pinned applications within the next 14 days. Review these dates in your timeline calendar.
                  </p>
                </div>
                <button className="btn btn-secondary" onClick={() => setActiveTab('calendar')} style={{ width: '100%' }}>
                  Open Timeline Calendar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. APPLICATION TRACKER VIEW */}
        {activeTab === 'tracker' && (
          <div className="tracker-view">
            <div className="tracker-board">
              {['Saved', 'Planning', 'Applied', 'Interview', 'Accepted'].map(column => {
                const columnApps = applications.filter(app => app.status === column);
                return (
                  <div className={`tracker-column ${column.toLowerCase()}`} key={column}>
                    <div className="column-header">
                      <div className="column-title">
                        <span className={`column-dot ${columnApps.length > 0 ? 'active-stage' : ''}`}></span>
                        {column}
                      </div>
                      <span className="column-count">{columnApps.length}</span>
                    </div>

                    <div className="tracker-cards-wrapper">
                      {columnApps.map(app => (
                        <div 
                          className="tracker-card" 
                          key={app.id} 
                          onClick={() => setActiveApplication(app)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 className="tracker-card-title">{app.opportunity.title}</h4>
                            <select
                              className="chat-filter-select"
                              style={{ padding: '0.1rem 0.2rem', fontSize: '0.6rem', border: '1px solid var(--border-primary)', background: 'var(--bg-input)', cursor: 'pointer', borderRadius: '4px' }}
                              value={app.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleUpdateAppStatus(app.id, e.target.value);
                              }}
                            >
                              <option value="Saved">Saved</option>
                              <option value="Planning">Planning</option>
                              <option value="Applied">Applied</option>
                              <option value="Interview">Interview</option>
                              <option value="Accepted">Accepted</option>
                            </select>
                          </div>
                          <div className="tracker-card-org">{app.opportunity.organization}</div>
                          
                          <div className="tracker-card-meta">
                            <span className={`card-priority-badge ${app.priority.toLowerCase()}`}>{app.priority}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              {app.opportunity.deadline ? formatDeadline(app.opportunity.deadline) : 'Rolling'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. CALENDAR TIMELINE VIEW */}
        {activeTab === 'calendar' && (
          <div className="calendar-view">
            {renderJuly2026Calendar()}
          </div>
        )}

        {/* 5. SCRAPER PANEL CONTROL VIEW */}
        {activeTab === 'scraper' && (
          <div className="scraper-view">
            <div className="scraper-grid">
              {/* Monitored sources info */}
              <div className="glass-card">
                <div className="chart-header">Registered Crawlers</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Nexora monitors these web portals and indices continuously to isolate newly announced career fellowships.
                </p>
                <div className="sources-list" style={{ marginBottom: '1.5rem' }}>
                  {scraperSources.map(src => (
                    <div className="source-item" key={src.id}>
                      <div className="source-details">
                        <div className="src-name">{src.name}</div>
                        <div className="src-url">{src.url}</div>
                      </div>
                      <span className="card-category-badge" style={{ color: src.status === 'Success' ? 'var(--color-green)' : src.status === 'Failed' ? 'var(--color-red)' : 'var(--text-muted)' }}>
                        {src.status}
                      </span>
                    </div>
                  ))}
                </div>
                
                <button 
                  className="btn" 
                  onClick={handleTriggerScraper} 
                  disabled={scraperRunning}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {scraperRunning ? 'Scraping Workers Active...' : 'Trigger Daily Scrapes'}
                </button>
              </div>

              {/* Console log outputs terminal */}
              <div className="console-wrapper">
                <div className="console-header">
                  <span>CRAWLER SYSTEM PROCESS DIAGNOSTIC PANEL</span>
                  <span>{scraperRunning ? '● ACTIVE' : '○ STANDBY'}</span>
                </div>
                <div className="console-log-lines">
                  {scraperLogs.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem' }}>
                      Terminal standby. Trigger scrapers above to inspect live chromium page crawls, beautiful-soup markdown cleaning, and generative AI structuring processes.
                    </div>
                  ) : (
                    scraperLogs.map((log, idx) => (
                      <div className={`log-line ${log.status}`} key={idx}>
                        {`> [${new Date().toLocaleTimeString()}] ${log.message}`}
                      </div>
                    ))
                  )}
                  <div ref={logEndRef} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. USER PROFILE HUB BENTO GRID */}
        {activeTab === 'profile' && profile && (
          <div className="profile-view-container">
            {/* Bento Grid layout */}
            <div className="bento-grid">
              
              {/* Box 1: Identity & Bio (Bento Col 8) */}
              <div className="glass-card bento-col-8">
                <div className="bento-card-header">
                  <User size={18} className="bento-icon text-purple" />
                  <span>Identity & Personal Details</span>
                </div>
                
                {/* Profile completeness bar */}
                <div className="completeness-container">
                  <div className="completeness-info">
                    <span className="completeness-label">Profile Strength</span>
                    <span className="completeness-pct">{calculateCompleteness()}%</span>
                  </div>
                  <div className="completeness-bar-track">
                    <div className="completeness-bar-fill" style={{ width: `${calculateCompleteness()}%` }}></div>
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-input-label">Full Name</label>
                  <input 
                    type="text" 
                    className="profile-input-field" 
                    value={profile.name || ''} 
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="e.g. Dr. Julian Sterling"
                  />
                </div>

                <div className="profile-form-group" style={{ marginTop: '1rem' }}>
                  <label className="profile-input-label">Email Address</label>
                  <input 
                    type="email" 
                    className="profile-input-field" 
                    value={profile.email || ''} 
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="e.g. julian.sterling@ethz.ch"
                  />
                </div>

                <div className="profile-form-group" style={{ marginTop: '1rem' }}>
                  <label className="profile-input-label">Professional Biography</label>
                  <textarea 
                    className="profile-textarea-field" 
                    rows={4}
                    value={profile.bio || ''} 
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Brief summary of your academic or professional background, research directions, and scholarly focus..."
                  />
                </div>
              </div>

              {/* Box 2: Academic Matrix (Bento Col 4) */}
              <div className="glass-card bento-col-4">
                <div className="bento-card-header">
                  <GraduationCap size={18} className="bento-icon text-cyan" />
                  <span>Academic Credentials Matrix</span>
                </div>

                <div className="profile-form-group">
                  <label className="profile-input-label">Academic Status</label>
                  <select 
                    className="profile-select-field" 
                    value={profile.academic_status || ''} 
                    onChange={(e) => setProfile({ ...profile, academic_status: e.target.value })}
                  >
                    <option value="">Select status...</option>
                    <option value="Undergraduate Student">Undergraduate Student</option>
                    <option value="Graduate / Master Student">Graduate / Master Student</option>
                    <option value="PhD Candidate">PhD Candidate</option>
                    <option value="Postdoc / Researcher">Postdoc / Researcher</option>
                    <option value="Faculty / Professor">Faculty / Professor</option>
                    <option value="Independent Entrepreneur">Independent Entrepreneur</option>
                  </select>
                </div>

                <div className="profile-form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="profile-input-label">Affiliated Institution</label>
                  <div className="input-with-icon-wrapper">
                    <Building size={14} className="input-inner-icon text-muted" />
                    <input 
                      type="text" 
                      className="profile-input-field padding-left-icon" 
                      value={profile.university || ''} 
                      onChange={(e) => setProfile({ ...profile, university: e.target.value })}
                      placeholder="e.g. ETH Zürich"
                    />
                  </div>
                </div>

                <div className="profile-form-group" style={{ marginTop: '1.25rem' }}>
                  <label className="profile-input-label">Verified Academic ID</label>
                  <div className="input-with-verification">
                    <input 
                      type="text" 
                      className="profile-input-field" 
                      value={profile.verified_academic_id || ''} 
                      onChange={(e) => setProfile({ ...profile, verified_academic_id: e.target.value })}
                      placeholder="e.g. ETH-8849-STERLING"
                    />
                    {profile.verified_academic_id && (
                      <span className="academic-verified-badge" title="Academic ID Verified in Database">
                        <CheckCircle2 size={12} style={{ marginRight: '3px' }} />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Box 3: Skills & Research Interests Tags (Bento Col 6) */}
              <div className="glass-card bento-col-6">
                <div className="bento-card-header">
                  <Briefcase size={18} className="bento-icon text-indigo" />
                  <span>Research Interests & Skills</span>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Define scholarly interest tags used by the matching engine to run hybrid vector intersections.
                </p>

                <div className="profile-tags-wrapper">
                  {(profile.research_interests || []).map((interest, idx) => (
                    <span className="profile-tag-pill" key={idx}>
                      {interest}
                      <button 
                        type="button" 
                        className="profile-tag-close"
                        onClick={() => {
                          const updated = (profile.research_interests || []).filter((_, i) => i !== idx);
                          setProfile({ ...profile, research_interests: updated });
                        }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="profile-tag-adder" style={{ marginTop: '1rem' }}>
                  <input 
                    type="text" 
                    className="profile-input-field tag-input"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    placeholder="Add interest tag (e.g. Quantum Computing)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newInterestInput.trim()) {
                          const updated = [...(profile.research_interests || []), newInterestInput.trim()];
                          setProfile({ ...profile, research_interests: updated });
                          setNewInterestInput('');
                        }
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className="btn btn-secondary tag-add-btn"
                    onClick={() => {
                      if (newInterestInput.trim()) {
                        const updated = [...(profile.research_interests || []), newInterestInput.trim()];
                        setProfile({ ...profile, research_interests: updated });
                        setNewInterestInput('');
                      }
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Box 4: Geographic Reach & Relocation willing (Bento Col 6) */}
              <div className="glass-card bento-col-6">
                <div className="bento-card-header">
                  <Globe size={18} className="bento-icon text-cyan" />
                  <span>Geographic Reach & Relocation</span>
                </div>

                <div className="profile-form-group">
                  <label className="profile-input-label">Base City</label>
                  <input 
                    type="text" 
                    className="profile-input-field" 
                    value={profile.base_city || ''} 
                    onChange={(e) => setProfile({ ...profile, base_city: e.target.value })}
                    placeholder="e.g. Zürich"
                  />
                </div>

                <div className="profile-form-group" style={{ marginTop: '1rem' }}>
                  <label className="profile-input-label">Willing to Relocate?</label>
                  <div className="relocation-radio-group">
                    <label className="relocation-radio-label">
                      <input 
                        type="radio" 
                        name="willing_to_relocate" 
                        value="Yes"
                        checked={profile.willing_to_relocate === 'Yes'}
                        onChange={(e) => setProfile({ ...profile, willing_to_relocate: e.target.value })}
                      />
                      <span>Yes, globally willing</span>
                    </label>
                    <label className="relocation-radio-label" style={{ marginLeft: '1.5rem' }}>
                      <input 
                        type="radio" 
                        name="willing_to_relocate" 
                        value="No"
                        checked={profile.willing_to_relocate === 'No'}
                        onChange={(e) => setProfile({ ...profile, willing_to_relocate: e.target.value })}
                      />
                      <span>No, local opportunities only</span>
                    </label>
                  </div>
                </div>

                <div className="profile-form-group" style={{ marginTop: '1rem' }}>
                  <label className="profile-input-label">Preferred Countries / Regions</label>
                  
                  <div className="profile-tags-wrapper" style={{ marginTop: '0.5rem' }}>
                    {(profile.preferred_regions || []).map((region, idx) => (
                      <span className="profile-tag-pill region-pill" key={idx}>
                        {region}
                        <button 
                          type="button" 
                          className="profile-tag-close"
                          onClick={() => {
                            const updated = (profile.preferred_regions || []).filter((_, i) => i !== idx);
                            setProfile({ ...profile, preferred_regions: updated });
                          }}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="profile-tag-adder" style={{ marginTop: '1rem' }}>
                    <input 
                      type="text" 
                      className="profile-input-field tag-input"
                      value={newRegionInput}
                      onChange={(e) => setNewRegionInput(e.target.value)}
                      placeholder="Add region (e.g. Switzerland, Europe)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newRegionInput.trim()) {
                            const updated = [...(profile.preferred_regions || []), newRegionInput.trim()];
                            setProfile({ ...profile, preferred_regions: updated });
                            setNewRegionInput('');
                          }
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-secondary tag-add-btn"
                      onClick={() => {
                        if (newRegionInput.trim()) {
                          const updated = [...(profile.preferred_regions || []), newRegionInput.trim()];
                          setProfile({ ...profile, preferred_regions: updated });
                          setNewRegionInput('');
                        }
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Glowing Pulse save button */}
            <div className="profile-save-bar">
              <button 
                type="button" 
                className="btn btn-save-profile-glow"
                onClick={() => saveUserProfile(profile)}
              >
                <Save size={16} style={{ marginRight: '6px' }} />
                Save & Recalculate AI Match Scores
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      {/* APPLICATION TRACKER CARD MODAL (NOTES & PRIORITY) */}
      {activeApplication && (
        <div className="modal-overlay" onClick={() => setActiveApplication(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveApplication(null)}>×</button>
            <span className="card-category-badge" style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
              {activeApplication.opportunity.category}
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>{activeApplication.opportunity.title}</h2>
            <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '400', marginBottom: '1.5rem' }}>
              {activeApplication.opportunity.organization}
            </h3>

            <form onSubmit={handleSaveNotes} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Drag phase transitions */}
              <div>
                <label>Tracker Pipeline Phase</label>
                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                  {['Saved', 'Planning', 'Applied', 'Interview', 'Accepted'].map(phase => (
                    <button 
                      key={phase} 
                      type="button"
                      className="btn btn-secondary" 
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', background: activeApplication.status === phase ? 'var(--text-primary)' : 'var(--bg-card)', borderColor: activeApplication.status === phase ? 'var(--text-primary)' : 'var(--border-primary)', color: activeApplication.status === phase ? 'var(--bg-darkest)' : 'var(--text-primary)' }}
                      onClick={() => setActiveApplication({...activeApplication, status: phase})}
                    >
                      {phase}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority & Applied Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Priority</label>
                  <select 
                    className="chat-filter-select" 
                    style={{ width: '100%', height: '36px', borderRadius: '4px' }}
                    value={activeApplication.priority}
                    onChange={(e) => setActiveApplication({...activeApplication, priority: e.target.value})}
                  >
                    <option value="High">🔴 High Priority</option>
                    <option value="Medium">🟡 Medium Priority</option>
                    <option value="Low">🔵 Low Priority</option>
                  </select>
                </div>
                <div>
                  <label>Date Applied</label>
                  <input 
                    type="date" 
                    className="chat-filter-select"
                    style={{ width: '100%', height: '36px', padding: '0.4rem 0.5rem', borderRadius: '4px' }}
                    value={activeApplication.applied_date || ''}
                    onChange={(e) => setActiveApplication({...activeApplication, applied_date: e.target.value})}
                  />
                </div>
              </div>

              {/* Personal Notes */}
              <div>
                <label>Workspace Diary Notes</label>
                <textarea 
                  className="chat-input-field" 
                  style={{ width: '100%', height: '100px', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}
                  placeholder="Record task lists, link portfolio docs, or list PhD recommender details here..."
                  value={activeApplication.notes || ''}
                  onChange={(e) => setActiveApplication({...activeApplication, notes: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn" style={{ flexGrow: 1, borderRadius: '4px' }}>
                  Save Track Card
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--color-red)', color: 'var(--color-red)', borderRadius: '4px' }}
                  onClick={() => handleDeleteApplication(activeApplication.id)}
                >
                  Remove Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
