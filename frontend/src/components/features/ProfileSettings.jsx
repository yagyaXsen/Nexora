import React, { useState } from 'react';
import { 
  User, 
  GraduationCap, 
  Building, 
  CheckCircle2, 
  Briefcase, 
  X, 
  Plus, 
  Globe, 
  Save 
} from 'lucide-react';

export default function ProfileSettings({
  profile,
  setProfile,
  saveUserProfile
}) {
  const [newInterestInput, setNewInterestInput] = useState('');
  const [newRegionInput, setNewRegionInput] = useState('');

  if (!profile) return null;

  const calculateCompleteness = () => {
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

  const completeness = calculateCompleteness();

  const handleAddInterest = () => {
    if (newInterestInput.trim()) {
      const updated = [...(profile.research_interests || []), newInterestInput.trim()];
      setProfile({ ...profile, research_interests: updated });
      setNewInterestInput('');
    }
  };

  const handleAddRegion = () => {
    if (newRegionInput.trim()) {
      const updated = [...(profile.preferred_regions || []), newRegionInput.trim()];
      setProfile({ ...profile, preferred_regions: updated });
      setNewRegionInput('');
    }
  };

  return (
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
              <span className="completeness-pct">{completeness}%</span>
            </div>
            <div className="completeness-bar-track">
              <div className="completeness-bar-fill" style={{ width: `${completeness}%` }}></div>
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
                  handleAddInterest();
                }
              }}
            />
            <button 
              type="button" 
              className="btn btn-secondary tag-add-btn"
              onClick={handleAddInterest}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Box 4: Geographic Reach & Relocation (Bento Col 6) */}
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
                    handleAddRegion();
                  }
                }}
              />
              <button 
                type="button" 
                className="btn btn-secondary tag-add-btn"
                onClick={handleAddRegion}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Glowing save button */}
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
  );
}
