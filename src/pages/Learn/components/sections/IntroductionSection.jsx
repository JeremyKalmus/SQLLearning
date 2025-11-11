import React from 'react';
import PropTypes from 'prop-types';

export default function IntroductionSection({ content }) {
  if (!content) return null;

  return (
    <div className="introduction-section">
      <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>{content.text}</p>

      {(content.keyPoints || content.useCases) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
          {content.keyPoints && content.keyPoints.length > 0 && (
            <div className="key-points">
              <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>Key Points:</h4>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                {content.keyPoints.map((point, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {content.useCases && content.useCases.length > 0 && (
            <div className="use-cases">
              <h4 style={{ fontWeight: '600', marginBottom: '0.75rem', fontSize: '1rem' }}>Use Cases:</h4>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                {content.useCases.map((useCase, idx) => (
                  <li key={idx} style={{ marginBottom: '0.5rem' }}>{useCase}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

IntroductionSection.propTypes = {
  content: PropTypes.object.isRequired
};

