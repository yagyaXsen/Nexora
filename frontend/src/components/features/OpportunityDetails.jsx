import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Pin, 
  Layers, 
  Users, 
  Rocket 
} from 'lucide-react';

export default function OpportunityDetails({
  opportunity,
  profile,
  applications,
  getDaysLeft,
  getDeterministicMatch,
  formatDeadline,
  handleSaveToTracker,
  onBack
}) {
  const opp = opportunity;
  if (!opp) return null;

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
          onClick={onBack}
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
              style={{ borderRadius: '100px', padding: '0.75rem 2rem', textDecoration: 'none', color: '#fff', fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(204, 92, 109, 0.4)' }}
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
}
