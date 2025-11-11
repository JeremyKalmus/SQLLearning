import React from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

export default function SummarySection({ content }) {
  if (!content) return null;

  return (
    <div className="summary-section">
      {(content.keyTakeaways || content.nextSteps) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {content.keyTakeaways && content.keyTakeaways.length > 0 && (
            <div className="key-takeaways">
              <h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1rem' }}>Key Takeaways</h4>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                {content.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{takeaway}</li>
                ))}
              </ul>
            </div>
          )}

          {content.nextSteps && content.nextSteps.length > 0 && (
            <div className="next-steps">
              <h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1rem' }}>Next Steps</h4>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                {content.nextSteps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{step}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {content.relatedTutorials && content.relatedTutorials.length > 0 && (
        <div className="related-tutorials">
          <h4 style={{ fontWeight: '600', marginBottom: '1rem', fontSize: '1rem' }}>Related Tutorials</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {content.relatedTutorials.map((slug, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem' }}>
                <Link
                  to={`/learn/${slug}`}
                  style={{ color: 'var(--primary-color)', textDecoration: 'none' }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  → {slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

SummarySection.propTypes = {
  content: PropTypes.object.isRequired
};

