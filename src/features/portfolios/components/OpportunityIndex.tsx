import { PositionOpportunity } from '@/types/portfolio';
import { useState, useEffect } from 'react';

interface OpportunityIndexProps {
  opportunities: PositionOpportunity[];
  isLoading?: boolean;
}

// Helper function to get color based on opportunity score (-10 to 10)
const getScoreColor = (score: number): string => {
  if (score >= 7) return '#28a745'; // Strong buy - green
  if (score >= 4) return '#5cb85c'; // Good opportunity - light green
  if (score >= 1) return '#17a2b8'; // Slight positive - teal
  if (score > -1) return '#999'; // Neutral - gray
  if (score > -4) return '#ff9800'; // Caution - orange
  if (score > -7) return '#ff5722'; // Warning - red-orange
  return '#dc3545'; // Strong sell - red
};

// Helper function to get background gradient based on score
const getScoreGradient = (score: number): string => {
  const color = getScoreColor(score);
  return `linear-gradient(90deg, ${color}22 0%, ${color}44 ${((score + 10) / 20) * 100}%, transparent ${((score + 10) / 20) * 100}%)`;
};

// Helper function to get label based on score
const getScoreLabel = (score: number): string => {
  if (score >= 7) return 'Strong Opportunity';
  if (score >= 4) return 'Good Opportunity';
  if (score >= 1) return 'Slight Opportunity';
  if (score > -1) return 'Neutral';
  if (score > -4) return 'Watch';
  if (score > -7) return 'Consider Reducing';
  return 'Consider Exiting';
};

export const OpportunityIndex = ({ opportunities, isLoading }: OpportunityIndexProps) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [expandedTicker, setExpandedTicker] = useState<string | null>(null);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#333' }}>
          Opportunity Index
        </h3>
        <p style={{ color: '#666', fontSize: '0.875rem' }}>Loading analysis...</p>
      </div>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return null;
  }

  // Sort by opportunity score (best to worst)
  const sortedOpportunities = [...opportunities].sort((a, b) => b.opportunityScore - a.opportunityScore);

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', color: '#333' }}>
          Opportunity Index
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#666', margin: 0 }}>
          AI-powered position analysis (Best to Worst)
        </p>
      </div>

      {/* Desktop View - Condensed */}
      {!isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sortedOpportunities.map((opp) => (
            <div
              key={opp.ticker}
              style={{
                padding: '0.625rem 0.75rem',
                borderRadius: '6px',
                background: getScoreGradient(opp.opportunityScore),
                border: `1px solid ${getScoreColor(opp.opportunityScore)}33`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(3px)';
                e.currentTarget.style.boxShadow = `0 2px 6px ${getScoreColor(opp.opportunityScore)}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                {/* Ticker and Score Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '140px' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#333' }}>
                    {opp.ticker}
                  </span>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '3px',
                      backgroundColor: getScoreColor(opp.opportunityScore),
                      color: '#fff',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getScoreLabel(opp.opportunityScore)}
                  </span>
                </div>

                {/* Additional Metrics - Inline */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, fontSize: '0.75rem' }}>
                  {opp.weight_percent !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: '#999' }}>Wgt:</span>
                      <span style={{ fontWeight: '600', color: '#333' }}>
                        {opp.weight_percent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {opp.pl_percent !== undefined && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ color: '#999' }}>P/L:</span>
                      <span
                        style={{
                          fontWeight: '600',
                          color: opp.pl_percent >= 0 ? '#28a745' : '#dc3545',
                        }}
                      >
                        {opp.pl_percent >= 0 ? '+' : ''}{opp.pl_percent.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {opp.reasoning && (
                    <span style={{ color: '#666', fontSize: '0.75rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opp.reasoning}
                    </span>
                  )}
                </div>

                {/* Score Circle - Smaller */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: getScoreColor(opp.opportunityScore),
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: '0.875rem',
                    boxShadow: `0 1px 4px ${getScoreColor(opp.opportunityScore)}44`,
                    flexShrink: 0,
                  }}
                >
                  {opp.opportunityScore > 0 ? '+' : ''}{opp.opportunityScore}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile View - Condensed */}
      {isMobile && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {sortedOpportunities.map((opp) => (
            <div key={opp.ticker}>
              <div
                style={{
                  padding: '0.5rem 0.625rem',
                  borderRadius: '6px',
                  background: getScoreGradient(opp.opportunityScore),
                  border: `1px solid ${getScoreColor(opp.opportunityScore)}33`,
                  cursor: opp.reasoning ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (opp.reasoning) {
                    setExpandedTicker(expandedTicker === opp.ticker ? null : opp.ticker);
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333' }}>
                      {opp.ticker}
                    </span>
                    {opp.reasoning && (
                      <span style={{ fontSize: '0.65rem', color: '#666' }}>
                        {expandedTicker === opp.ticker ? '▼' : '▶'}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: getScoreColor(opp.opportunityScore),
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      boxShadow: `0 1px 4px ${getScoreColor(opp.opportunityScore)}44`,
                    }}
                  >
                    {opp.opportunityScore > 0 ? '+' : ''}{opp.opportunityScore}
                  </div>
                </div>

                {/* Expanded details on mobile */}
                {expandedTicker === opp.ticker && opp.reasoning && (
                  <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
                    <p style={{ fontSize: '0.8rem', color: '#555', margin: 0, lineHeight: '1.3' }}>
                      {opp.reasoning}
                    </p>
                    {(opp.weight_percent !== undefined || opp.pl_percent !== undefined) && (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                        {opp.weight_percent !== undefined && (
                          <div>
                            <span style={{ color: '#999' }}>Wgt: </span>
                            <span style={{ fontWeight: '600' }}>
                              {opp.weight_percent.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {opp.pl_percent !== undefined && (
                          <div>
                            <span style={{ color: '#999' }}>P/L: </span>
                            <span
                              style={{
                                fontWeight: '600',
                                color: opp.pl_percent >= 0 ? '#28a745' : '#dc3545',
                              }}
                            >
                              {opp.pl_percent >= 0 ? '+' : ''}{opp.pl_percent.toFixed(1)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Condensed Legend */}
      <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #e0e0e0' }}>
        <details style={{ fontSize: '0.7rem', color: '#999' }}>
          <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Score Range Guide</summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#28a745' }} />
              <span>+7 to +10</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#5cb85c' }} />
              <span>+4 to +6</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#17a2b8' }} />
              <span>+1 to +3</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#999' }} />
              <span>-1 to +1</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ff9800' }} />
              <span>-4 to -2</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ff5722' }} />
              <span>-7 to -5</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#dc3545' }} />
              <span>-10 to -8</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};
