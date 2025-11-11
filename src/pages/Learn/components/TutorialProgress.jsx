import React from 'react';
import PropTypes from 'prop-types';

export default function TutorialProgress({ currentSection, totalSections, userProgress }) {
  const sectionProgress = totalSections > 0 ? Math.round(((currentSection + 1) / totalSections) * 100) : 0;

  return (
    <div className="tutorial-progress" style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Progress</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{sectionProgress}%</span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${sectionProgress}%` }}></div>
      </div>
      {userProgress?.status === 'completed' && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--success-color)', fontWeight: '500' }}>
          ✓ Tutorial Completed
        </div>
      )}
    </div>
  );
}

TutorialProgress.propTypes = {
  currentSection: PropTypes.number.isRequired,
  totalSections: PropTypes.number.isRequired,
  userProgress: PropTypes.object
};

