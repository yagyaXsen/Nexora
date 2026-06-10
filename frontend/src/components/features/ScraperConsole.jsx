import React, { useRef, useEffect } from 'react';

export default function ScraperConsole({
  scraperSources,
  handleTriggerScraper,
  scraperRunning,
  scraperLogs
}) {
  const logEndRef = useRef(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scraperLogs]);

  return (
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
  );
}
