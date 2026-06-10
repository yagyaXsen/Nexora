import React, { useState, useEffect } from 'react';
import './App.css';
import {
  Search,
  LayoutDashboard,
  ListTree,
  Calendar,
  DollarSign,
  MapPin,
  Globe,
  Pin,
  Send,
  Trophy,
  Clock,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Save,
  Layers,
  User,
  GraduationCap,
  Building,
  Plus,
  X,
  Briefcase,
  Users,
  Rocket
} from 'lucide-react';

import OpportunityDetails from './components/features/OpportunityDetails';
import ProfileSettings from './components/features/ProfileSettings';
import ScraperConsole from './components/features/ScraperConsole';
import LandingPage from './components/features/LandingPage';



const PRESET_THEMES = [
  {
    id: 'nexora',
    name: 'Nexora Premium Light',
    background: '#f5f7fb',
    bgSidebar: 'rgba(248, 250, 252, 0.9)',
    bgCard: '#ffffff',
    bgInput: '#eef2f6',
    bgActive: 'rgba(204, 92, 109, 0.08)',
    borderPrimary: 'rgba(0, 0, 0, 0.06)',
    borderSecondary: 'rgba(0, 0, 0, 0.12)',
    textPrimary: '#1e293b',
    textSecondary: '#475569',
    textMuted: '#64748b',
    primaryAccent: '#cc5c6d',
    secondaryAccent: '#cc5c6d',
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
  const [showLanding, setShowLanding] = useState(true);

  const handleLaunchApp = (query) => {
    setShowLanding(false);
    setActiveTab('discovery');
    if (query && query.trim()) {
      setSearchQuery(query);
      triggerDirectSearch(query);
    }
  };
  
  // Theme States
  const [activeTheme, setActiveTheme] = useState('nexora');
  const [customPrimaryColor, setCustomPrimaryColor] = useState('#9333ea');
  const [customSecondaryColor, setCustomSecondaryColor] = useState('#06b6d4');
  const [customBackgroundColor, setCustomBackgroundColor] = useState('#0b1326');
  
  // Data States
  const [opportunities, setOpportunities] = useState([]);
  const [applications, setApplications] = useState([]);
  const [scraperSources, setScraperSources] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
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

  // Advanced Filter States
  const [minMatchScore, setMinMatchScore] = useState(0);
  const [filterAppStatus, setFilterAppStatus] = useState('All');
  const [filterDuration, setFilterDuration] = useState('All');
  const [filterComplexity, setFilterComplexity] = useState('All');

  // Voice Search State
  const [voiceActive, setVoiceActive] = useState(false);

  // Search History State
  const [searchHistory, setSearchHistory] = useState(['AI research fellowships', 'fully funded PhD Europe', 'Y Combinator winter batch']);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  // AI Copilot Sidebar State
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState([
    { sender: 'ai', text: 'Hi! I am your Nexora Copilot. How can I help you find fellowships, grants or scholarships today?' }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [copilotSending, setCopilotSending] = useState(false);

  // Deadline banner & Daily digest dismissals
  const [hideDeadlineBanner, setHideDeadlineBanner] = useState(false);
  const [hideDigest, setHideDigest] = useState(false);

  // Modal / Detail States
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [activeApplication, setActiveApplication] = useState(null);

  // Scraper Progress States
  const [scraperLogs, setScraperLogs] = useState([]);
  const [scraperRunning, setScraperRunning] = useState(false);

  // Profile & Recommendation States
  const [profile, setProfile] = useState(null);
  const [discoveryMode, setDiscoveryMode] = useState('all'); // 'all' or 'matched'
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const getProfileCompleteness = (prof) => {
    if (!prof) return 40;
    let score = 40;
    if (prof.field_of_study) score += 10;
    if (prof.academic_status) score += 10;
    if (prof.relocation_preference) score += 10;
    if (prof.research_interests && prof.research_interests.length > 0) score += 15;
    if (prof.gpa) score += 15;
    return Math.min(100, score);
  };
  const profileCompleteness = getProfileCompleteness(profile);

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

      // 3. Fetch applications
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

      // 5. Fetch Upcoming Reminders
      const remindersRes = await fetch(`${API_BASE}/reminders/upcoming`);
      if (remindersRes.ok) {
        const remindersData = await remindersRes.json();
        setUpcomingReminders(remindersData);
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



  const triggerDirectSearch = async (query) => {
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE}/opportunities/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query })
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

  // Execute NLP/AI Search
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      fetchData();
      return;
    }
    setSearchHistory(prev => {
      const filtered = prev.filter(h => h !== searchQuery.trim());
      return [searchQuery.trim(), ...filtered].slice(0, 5);
    });
    await triggerDirectSearch(searchQuery);
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      setVoiceActive(true);
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setSearchHistory(prev => {
        const filtered = prev.filter(h => h !== transcript);
        return [transcript, ...filtered].slice(0, 5);
      });
      triggerDirectSearch(transcript);
      setVoiceActive(false);
    };
    recognition.onerror = () => {
      setVoiceActive(false);
    };
    recognition.onend = () => {
      setVoiceActive(false);
    };
    recognition.start();
  };

  const handleCopilotSend = async (e) => {
    if (e) e.preventDefault();
    if (!copilotInput.trim()) return;
    const userMsg = copilotInput.trim();
    setCopilotMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setCopilotInput('');
    setCopilotSending(true);
    
    try {
      const res = await fetch(`${API_BASE}/opportunities/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg })
      });
      if (res.ok) {
        const data = await res.json();
        const resultsText = data.length > 0 
          ? `I found ${data.length} matches for you. Here are the top ones:\n` + data.slice(0, 3).map(o => `• **${o.title}** (${o.funding || 'Fully Funded'}, ${o.country})`).join('\n')
          : "I searched global portals but couldn't find any direct matches. Try adjusting your research interests or search terms.";
        setCopilotMessages(prev => [...prev, { sender: 'ai', text: resultsText }]);
      } else {
        setCopilotMessages(prev => [...prev, { sender: 'ai', text: "Sorry, I ran into a connection issue. Let me try again." }]);
      }
    } catch (err) {
      setCopilotMessages(prev => [...prev, { sender: 'ai', text: "Error searching databases. Please try again." }]);
    } finally {
      setCopilotSending(false);
    }
  };

  const getFilteredOpps = (list) => {
    return list.filter(opp => {
      // 1. Match score filter
      const score = opp.match_score || getDeterministicMatch(opp.title);
      if (minMatchScore > 0 && score < minMatchScore) return false;
      
      // 2. Application status filter
      const isPinned = applications.some(app => app.opportunity_id === opp.id);
      const appRecord = applications.find(app => app.opportunity_id === opp.id);
      if (filterAppStatus === 'Not Applied' && isPinned) return false;
      if (filterAppStatus === 'Saved' && (!isPinned || appRecord?.status !== 'Saved')) return false;
      if (filterAppStatus === 'Applied' && (!isPinned || appRecord?.status !== 'Applied')) return false;
      if (filterAppStatus === 'Interview' && (!isPinned || appRecord?.status !== 'Interview')) return false;
      if (filterAppStatus === 'Accepted' && (!isPinned || appRecord?.status !== 'Accepted')) return false;

      // 3. Duration filter
      if (filterDuration !== 'All') {
        const desc = (opp.description || '').toLowerCase();
        if (filterDuration === '1-3 months' && !desc.includes('1-3') && !desc.includes('month') && !desc.includes('weeks')) return false;
        if (filterDuration === '3-6 months' && !desc.includes('3-6') && !desc.includes('6 month') && !desc.includes('semester')) return false;
        if (filterDuration === '6-12 months' && !desc.includes('6-12') && !desc.includes('year') && !desc.includes('annual')) return false;
      }

      // 4. Complexity filter
      if (filterComplexity !== 'All') {
        const title = (opp.title || '').toLowerCase();
        const isEasy = title.includes('hackathon') || title.includes('competition');
        const isCompetitive = title.includes('fellowship') || title.includes('schmidt') || title.includes('gates');
        const estComplexity = isEasy ? 'Easy' : isCompetitive ? 'Competitive' : 'Medium';
        if (filterComplexity !== estComplexity) return false;
      }
      
      return true;
    });
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




  if (showLanding) {
    return (
      <LandingPage 
        opportunities={opportunities}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchSubmit={handleSearchSubmit}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        totalCount={totalCount}
        setActiveTab={setActiveTab}
        onLaunchApp={handleLaunchApp} 
      />
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-nav-container">
          <div className="brand-section" onClick={() => setShowLanding(true)}>
            <div className="brand-logo-box">
              <span>✦</span>
            </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
            <span className="system-dot"></span>
            <span>System Active</span>
          </div>
          <button 
            type="button"
            onClick={() => {
              // Sign out flow
              setProfile(null);
              setApplications([]);
              setSelectedOpportunity(null);
              setIsLoggedIn(false);
            }} 
            style={{
              background: 'transparent',
              border: 'none',
              color: '#cc5c6d',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '0.25rem'
            }}
          >
            <i className="ti ti-logout"></i> Sign Out / Exit
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT CANVAS */}
      <main className="main-canvas">
        {selectedOpportunity ? (
          <OpportunityDetails
            opportunity={selectedOpportunity}
            profile={profile}
            applications={applications}
            getDaysLeft={getDaysLeft}
            getDeterministicMatch={getDeterministicMatch}
            formatDeadline={formatDeadline}
            handleSaveToTracker={handleSaveToTracker}
            onBack={() => setSelectedOpportunity(null)}
          />
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
          <div className="discovery-container" style={{ position: 'relative' }}>
            {/* Scrollable feed section */}
            <div className="discovery-feed-scroll">
              {/* Authenticated Welcome Card */}
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '2rem',
                marginBottom: '1.5rem',
                border: '1px solid #d0d0cc',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0, right: 0,
                  width: '200px',
                  height: '100%',
                  background: 'linear-gradient(135deg, transparent, rgba(204, 92, 109, 0.04))',
                  pointerEvents: 'none'
                }}></div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.4rem', fontFamily: 'Instrument Sans, sans-serif', color: '#111111', letterSpacing: '-0.03em' }}>
                  Welcome back, {profile?.full_name || 'Aarav'}
                </h1>
                <p style={{ fontSize: '0.9rem', color: '#475569', maxWidth: '560px', fontWeight: '400', fontFamily: 'Be Vietnam Pro, sans-serif' }}>
                  Your daily opportunity digest and AI-matched recommendations.
                </p>
              </div>

              {/* Quick Stats Strip */}
              <div className="glass-card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 2rem',
                borderRadius: '16px',
                marginBottom: '1.5rem',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', fontSize: '0.85rem', fontWeight: '600' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-bookmark" style={{ color: 'var(--text-muted)' }}></i> Saved: <strong style={{ color: '#cc5c6d' }}>{stats.saved_applications}</strong></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-mail" style={{ color: 'var(--text-muted)' }}></i> Applied: <strong style={{ color: '#cc5c6d' }}>{stats.applied_applications}</strong></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-calendar" style={{ color: 'var(--text-muted)' }}></i> Interviews: <strong style={{ color: '#cc5c6d' }}>{stats.pipeline_stages?.Interview || 1}</strong></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-trophy" style={{ color: 'var(--text-muted)' }}></i> Accepted: <strong style={{ color: '#cc5c6d' }}>{stats.accepted_applications}</strong></span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#cc5c6d', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ti ti-flame"></i> 7-Day Streak!
                </div>
              </div>

              {/* Deadline Alert Strip */}
              {!hideDeadlineBanner && applications.filter(app => app.opportunity.deadline && getDaysLeft(app.opportunity.deadline) >= 0 && getDaysLeft(app.opportunity.deadline) <= 7).length > 0 && (
                <div className="glass-card" style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.08) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '16px',
                  padding: '1rem 1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.25rem', color: '#f59e0b', display: 'flex', alignItems: 'center' }}><i className="ti ti-alert-triangle"></i></span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      You have <strong>{applications.filter(app => app.opportunity.deadline && getDaysLeft(app.opportunity.deadline) >= 0 && getDaysLeft(app.opportunity.deadline) <= 7).length} saved opportunities</strong> closing in the next 7 days!
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '10px' }} onClick={() => setActiveTab('calendar')}>
                      Open Calendar
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderRadius: '10px' }} onClick={() => setHideDeadlineBanner(true)}>
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Daily Digest Card */}
              {!hideDigest && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', position: 'relative' }}>
                  <button 
                    style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
                    onClick={() => setHideDigest(true)}
                  >
                    ×
                  </button>
                  <h3 className="chart-header" style={{ marginBottom: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ti ti-sparkles" style={{ color: '#cc5c6d' }}></i> Today's Top Matches For You
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="no-bar">
                    {opportunities
                      .sort((a, b) => (b.match_score || getDeterministicMatch(b.title)) - (a.match_score || getDeterministicMatch(a.title)))
                      .slice(0, 4)
                      .map(opp => {
                        const match = opp.match_score || getDeterministicMatch(opp.title);
                        return (
                          <div 
                            key={opp.id} 
                            className="glass-card" 
                            style={{ minWidth: '240px', padding: '1rem', flexShrink: 0, cursor: 'pointer', border: '1px solid rgba(204, 92, 109, 0.15)' }}
                            onClick={() => setSelectedOpportunity(opp)}
                          >
                            <span className="font-mono" style={{ fontSize: '0.65rem', color: '#cc5c6d', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <i className="ti ti-bolt"></i> {match}% MATCH
                            </span>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: '700', margin: '4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.title}</h4>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.organization}</p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

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

              {/* Advanced filter select tools */}
              <div className="chat-filters-panel" style={{ marginBottom: '2.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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

                <select
                  className="chat-filter-select"
                  value={minMatchScore}
                  onChange={(e) => setMinMatchScore(Number(e.target.value))}
                >
                  <option value={0}>All Match Scores</option>
                  <option value={90}>90%+ Match</option>
                  <option value={80}>80%+ Match</option>
                  <option value={70}>70%+ Match</option>
                </select>

                <select
                  className="chat-filter-select"
                  value={filterAppStatus}
                  onChange={(e) => setFilterAppStatus(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Not Applied">Not Applied Yet</option>
                  <option value="Saved">Saved in Tracker</option>
                  <option value="Applied">Applied Stage</option>
                  <option value="Interview">Interview Scheduled</option>
                  <option value="Accepted">Accepted Offer</option>
                </select>

                <select
                  className="chat-filter-select"
                  value={filterDuration}
                  onChange={(e) => setFilterDuration(e.target.value)}
                >
                  <option value="All">Any Duration</option>
                  <option value="1-3 months">Short (1-3 mos)</option>
                  <option value="3-6 months">Medium (3-6 mos)</option>
                  <option value="6-12 months">Long (6-12 mos)</option>
                </select>

                <select
                  className="chat-filter-select"
                  value={filterComplexity}
                  onChange={(e) => setFilterComplexity(e.target.value)}
                >
                  <option value="All">Any Complexity</option>
                  <option value="Easy">Easy (1-step)</option>
                  <option value="Medium">Medium</option>
                  <option value="Competitive">Competitive</option>
                </select>

                {(selectedCategory !== 'All' || selectedCountry !== 'All' || searchQuery || minMatchScore > 0 || filterAppStatus !== 'All' || filterDuration !== 'All' || filterComplexity !== 'All') && (
                  <button 
                    className="chat-filter-select" 
                    style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    onClick={() => { 
                      setSelectedCategory('All'); 
                      setSelectedCountry('All'); 
                      setSearchQuery(''); 
                      setMinMatchScore(0);
                      setFilterAppStatus('All');
                      setFilterDuration('All');
                      setFilterComplexity('All');
                      setCurrentPage(1); 
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {discoveryMode === 'matched' && (
                /* Matched For You Info banner */
                <div className="glass-card recommendation-banner" style={{ marginBottom: '2rem', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #cc5c6d' }}>
                  <Globe size={24} style={{ color: '#cc5c6d' }} className="animate-pulse" />
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
              ) : getFilteredOpps(discoveryMode === 'all' ? opportunities : recommendations).length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', borderStyle: 'dashed' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No opportunities found matching these criteria. Try adjusting filters or search query.
                  </p>
                </div>
              ) : (
                <>
                  <div className="opportunity-feed">
                    {getFilteredOpps(discoveryMode === 'all' ? opportunities : recommendations).map(opp => {
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
                                <span className="match-score-pct" style={{ color: '#cc5c6d' }}>{matchScore}%</span>
                                <span className="match-score-text">Match Score</span>
                              </div>
                              <div className="match-bar-track">
                                <div className="match-bar-fill" style={{ width: `${matchScore}%`, backgroundColor: '#cc5c6d' }}></div>
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
                                <MapPin size={14} style={{ marginRight: '2px', color: '#cc5c6d', verticalAlign: 'middle' }} />
                                <strong>{opp.country || 'Global'}</strong>
                              </span>
                            </div>
                            <div className="card-action-bar">
                              <button className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={() => setSelectedOpportunity(opp)}>
                                Details
                              </button>
                              <button 
                                className="btn" 
                                style={{ flexGrow: 1, background: isPinned ? 'rgba(204, 92, 109, 0.08)' : '#cc5c6d', border: isPinned ? '1px solid rgba(204, 92, 109, 0.2)' : 'none', color: isPinned ? '#cc5c6d' : '#fff' }} 
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

                  {/* Profile Completion Nudge inside Feed */}
                  {profileCompleteness < 90 && (
                    <div className="glass-card" style={{
                      background: 'linear-gradient(135deg, rgba(204, 92, 109, 0.05) 0%, rgba(13, 13, 16, 0.05) 100%)',
                      border: '1px solid rgba(204, 92, 109, 0.2)',
                      borderRadius: '24px',
                      padding: '2rem',
                      marginTop: '2rem',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-40px',
                        left: '-40px',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'rgba(204, 92, 109, 0.1)',
                        filter: 'blur(30px)'
                      }}></div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem', fontFamily: 'Sora, sans-serif' }}>
                        Complete your profile to increase your match accuracy
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem auto', lineHeight: '1.6' }}>
                        Adding your research interests, academic level, and location will boost match precision by up to 40% and unlock personalized AI recommendation streams.
                      </p>
                      
                      <div style={{ maxWidth: '300px', margin: '0 auto 1.5rem auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                          <span>Profile Completion</span>
                          <span style={{ color: '#cc5c6d' }}>{profileCompleteness}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${profileCompleteness}%`, height: '100%', background: '#cc5c6d', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                      
                      <button 
                        className="btn btn-save-profile-glow" 
                        onClick={() => setActiveTab('profile')} 
                        style={{ border: 'none', color: '#fff', padding: '0.65rem 2rem', borderRadius: '100px', fontSize: '0.85rem', fontWeight: '600' }}
                      >
                        Complete Profile Now &rarr;
                      </button>
                    </div>
                  )}

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
              
              {/* Recent Search History Dropdown */}
              {showHistoryDropdown && searchHistory.length > 0 && (
                <div className="search-history-dropdown glass-card">
                  <div className="history-header">Recent Searches</div>
                  {searchHistory.map((h, i) => (
                    <div 
                      key={i} 
                      className="history-item"
                      onMouseDown={() => {
                        setSearchQuery(h);
                        triggerDirectSearch(h);
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <i className="ti ti-history" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}></i> {h}
                    </div>
                  ))}
                </div>
              )}

              <div className="chat-input-wrapper">
                <form onSubmit={handleSearchSubmit}>
                  <div className="chat-search-icon">
                    <Search size={18} style={{ color: '#cc5c6d' }} />
                  </div>
                  <input 
                    type="text" 
                    className="chat-input-field" 
                    placeholder="Search Nexora... (e.g. 'fully funded AI fellowships for Indian students')"
                    value={searchQuery}
                    onFocus={() => setShowHistoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowHistoryDropdown(false), 200)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div style={{ position: 'absolute', right: '3.5rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={handleVoiceSearch}
                      className={`voice-search-btn ${voiceActive ? 'active' : ''}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: voiceActive ? '#cc5c6d' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title="Search with your voice"
                    >
                      <span className={voiceActive ? 'animate-ping' : ''} style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>
                        <i className="ti ti-microphone"></i>
                      </span>
                    </button>
                  </div>
                  <button type="submit" className="chat-submit-btn" disabled={searching}>
                    {searching ? 'Searching…' : 'Search'}
                  </button>
                </form>
              </div>
              <span className="chat-footnote">AI Search System</span>
            </div>

            {/* Ask Copilot Floating Toggle */}
            <button 
              className="floating-copilot-btn" 
              onClick={() => setShowCopilot(prev => !prev)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="ti ti-robot"></i> Ask Copilot
            </button>
          </div>
        )}

        {/* 2. RICH GAMIFIED ANALYTICS DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-view" style={{ animation: 'fade-in 0.3s ease-out' }}>
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

            {/* Split Visual Bento Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginTop: '2rem' }}>
              
              {/* Outer grid columns */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                
                {/* COLUMN 1: Profile & Gamification */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* P1. Profile Health Score */}
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 className="chart-header" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ti ti-user"></i> Your Profile Health
                      </h3>
                      <span className="font-mono text-xs font-bold text-[#cc5c6d] bg-[#cc5c6d]/10 px-2 py-0.5 rounded">
                        {profileCompleteness}% Complete
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                      <div style={{ width: `${profileCompleteness}%`, height: '100%', background: '#cc5c6d', borderRadius: '4px' }}></div>
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '1.25rem' }}>
                      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="ti ti-target" style={{ color: '#cc5c6d' }}></i> Match Accuracy:</strong> {profileCompleteness >= 75 ? 'HIGH' : profileCompleteness >= 50 ? 'MEDIUM' : 'LOW'} ({profileCompleteness}%)<br />
                      Complete profile to 90% to unlock 3x more accurate recommendations.
                    </div>
                    
                    {/* Missing checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid #d0d0cc', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', tracking: '0.05em', marginBottom: '0.25rem' }}>Missing Fields:</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: '#ef4444' }}>●</span> Research Interests <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>(High Impact: +18%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: '#eab308' }}>●</span> Academic Transcripts <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>(Medium: +12%)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                        <span style={{ color: '#eab308' }}>●</span> Skills & Technologies <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>(Medium: +10%)</span>
                      </div>
                    </div>
                    
                    <button className="btn btn-save-profile-glow" onClick={() => setActiveTab('profile')} style={{ width: '100%', marginTop: '1.5rem', border: 'none', color: '#fff', padding: '0.65rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: '600' }}>
                      Complete Profile &rarr;
                    </button>
                  </div>

                  {/* P5. XP Points & Level System */}
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 className="chart-header" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="ti ti-rocket" style={{ color: '#cc5c6d' }}></i> System Level & XP
                      </h3>
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        Lvl 3 Discoverer
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      <span>350 / 700 XP</span>
                      <span>50% to Level 4 Trailblazer</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: '50%', height: '100%', background: '#cc5c6d', borderRadius: '3px' }}></div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                      Earn 350 more XP by saving, applying and logging deadlines!
                    </div>
                  </div>

                  {/* P2. Onboarding Checklist */}
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 className="chart-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-list-check" style={{ color: '#cc5c6d' }}></i> Onboarding Checklist
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <i className="ti ti-circle-check" style={{ color: '#22c55e' }}></i> Create your account
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <i className="ti ti-circle-check" style={{ color: '#22c55e' }}></i> Set study field & country
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <i className="ti ti-circle-check" style={{ color: '#22c55e' }}></i> Save your first opportunity
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-primary)' }}>☐ Try AI Copilot Chat</span>
                        <button className="btn btn-secondary" onClick={() => onLaunchApp('AI')} style={{ padding: '0.25rem 0.65rem', fontSize: '0.65rem', borderRadius: '10px' }}>Try &rarr;</button>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--text-primary)' }}>☐ Add 3+ research interests</span>
                        <button className="btn btn-secondary" onClick={() => setActiveTab('profile')} style={{ padding: '0.25rem 0.65rem', fontSize: '0.65rem', borderRadius: '10px' }}>Add &rarr;</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: Telemetry, Benchmarking, Badges */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  
                  {/* P7. Streak Tracker */}
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 className="chart-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-flame" style={{ color: '#cc5c6d' }}></i> Daily Streak Tracker
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className="font-mono text-base font-bold text-[#cc5c6d]">
                        7-Day Active Streak!
                      </span>
                      <span className="text-xl" style={{ display: 'inline-flex', alignItems: 'center' }}><i className="ti ti-shield" style={{ color: '#cc5c6d' }}></i></span>
                    </div>
                    
                    {/* Day tracker ticks */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.35rem', textAlign: 'center' }}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                        <div key={idx} style={{ padding: '0.5rem 0', borderRadius: '8px', background: idx < 6 ? '#cc5c6d' : 'rgba(0,0,0,0.04)', color: idx < 6 ? '#fff' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: '700' }}>
                          {day}<br />
                          <span style={{ fontSize: '0.55rem' }}>{idx < 6 ? '✓' : '☐'}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.75rem', textAlign: 'center' }}>
                      Login tomorrow to keep your streak and earn a <strong>Streak Shield</strong>
                    </div>
                  </div>

                  {/* P8. Weekly Profile Report Card */}
                  <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(204, 92, 109, 0.02) 0%, rgba(15, 23, 42, 0.02) 100%)' }}>
                    <h3 className="chart-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-chart-bar" style={{ color: '#cc5c6d' }}></i> Weekly report card
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Opportunities Explored:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>24 (+8)</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Saves & Pins:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{stats.saved_applications}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Applications Filed:</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{stats.applied_applications}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #d0d0cc', paddingTop: '0.5rem', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Top Match This Week:</span>
                        <strong style={{ color: '#cc5c6d' }}>Google PhD Fellowship (98%)</strong>
                      </div>
                    </div>
                  </div>

                  {/* P10. Peer Comparison */}
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 className="chart-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-users" style={{ color: '#cc5c6d' }}></i> Peer Benchmarking
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Profile Health:</span>
                        <span>You: <strong>{profileCompleteness}%</strong> | Avg: 68% <span style={{ color: profileCompleteness >= 68 ? '#22c55e' : '#ef4444' }}>{profileCompleteness >= 68 ? '▲' : '▼'}</span></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Opportunities Saved:</span>
                        <span>You: <strong>{stats.saved_applications}</strong> | Avg: 8 <span style={{ color: '#22c55e' }}>▲</span></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Applications Sent:</span>
                        <span>You: <strong>{stats.applied_applications}</strong> | Avg: 4 <span style={{ color: '#ef4444' }}>▼</span></span>
                      </div>
                    </div>
                  </div>

                  {/* P6. Achievement Badges */}
                  <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 className="chart-header" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="ti ti-trophy" style={{ color: '#cc5c6d' }}></i> Earned Achievements
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem', display: 'inline-flex', alignItems: 'center', height: '2.25rem' }}><i className="ti ti-rocket" style={{ color: '#cc5c6d' }}></i></span>
                        <span style={{ fontSize: '0.55rem', fontWeight: '700', marginTop: '0.2rem' }}>Pioneer</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem', display: 'inline-flex', alignItems: 'center', height: '2.25rem' }}><i className="ti ti-certificate" style={{ color: '#cc5c6d' }}></i></span>
                        <span style={{ fontSize: '0.55rem', fontWeight: '700', marginTop: '0.2rem' }}>100% Info</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '1.5rem', display: 'inline-flex', alignItems: 'center', height: '2.25rem' }}><i className="ti ti-flame" style={{ color: '#cc5c6d' }}></i></span>
                        <span style={{ fontSize: '0.55rem', fontWeight: '700', marginTop: '0.2rem' }}>Active</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', filter: 'grayscale(1)', opacity: 0.5 }}>
                        <span style={{ fontSize: '1.5rem', display: 'inline-flex', alignItems: 'center', height: '2.25rem' }}><i className="ti ti-award" style={{ color: 'var(--text-muted)' }}></i></span>
                        <span style={{ fontSize: '0.55rem', fontWeight: '700', marginTop: '0.2rem' }}>Accepted</span>
                      </div>
                    </div>
                  </div>
                </div>

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
                              style={{ padding: '0.1rem 0.2rem', fontSize: '0.6rem', border: '1px solid #d0d0cc', background: '#f4f4f2', cursor: 'pointer', borderRadius: '4px' }}
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

        {activeTab === 'scraper' && (
          <ScraperConsole
            scraperSources={scraperSources}
            handleTriggerScraper={handleTriggerScraper}
            scraperRunning={scraperRunning}
            scraperLogs={scraperLogs}
          />
        )}

        {activeTab === 'profile' && profile && (
          <ProfileSettings
            profile={profile}
            setProfile={setProfile}
            saveUserProfile={saveUserProfile}
          />
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
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.7rem', background: activeApplication.status === phase ? 'var(--text-primary)' : '#ffffff', borderColor: activeApplication.status === phase ? 'var(--text-primary)' : '#d0d0cc', color: activeApplication.status === phase ? '#F7F7F7' : 'var(--text-primary)' }}
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
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
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

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #d0d0cc', paddingTop: '1rem', marginTop: '0.5rem' }}>
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

      {/* AI COPILOT SIDEBAR DRAWER */}
      {showCopilot && (
        <aside className="copilot-sidebar">
          <div className="copilot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}><i className="ti ti-robot"></i></span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, fontFamily: 'Sora, sans-serif' }}>Nexora Copilot</h3>
            </div>
            <button className="copilot-close-btn" onClick={() => setShowCopilot(false)}>×</button>
          </div>
          
          <div className="copilot-messages">
            {copilotMessages.map((m, idx) => (
              <div key={idx} className={`copilot-message ${m.sender}`}>
                <p style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-line' }}>{m.text}</p>
              </div>
            ))}
            {copilotSending && (
              <div className="copilot-message ai">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Thinking...</span>
              </div>
            )}
          </div>
          
          <form className="copilot-input-form" onSubmit={handleCopilotSend}>
            <input 
              type="text" 
              className="chat-input-field" 
              style={{ padding: '0.55rem 1rem', fontSize: '0.85rem', border: '1px solid #d0d0cc', borderRadius: '20px', width: '82%', height: '38px' }} 
              placeholder="Ask Copilot..." 
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
            />
            <button type="submit" className="copilot-send-btn" style={{ background: '#cc5c6d', width: '38px', height: '38px', display: 'grid', placeItems: 'center' }}>➔</button>
          </form>
        </aside>
      )}
    </div>
  );
}
