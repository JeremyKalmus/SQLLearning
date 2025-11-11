import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, GraduationCap } from 'lucide-react';
import PropTypes from 'prop-types';

export default function TutorialCard({ tutorial, userProgress }) {
  const status = userProgress?.status || 'not_started';

  return (
    <Link
      to={`/learn/${tutorial.slug}`}
      className="action-card"
    >
      <div className="action-icon">
        {status === 'completed' ? (
          <CheckCircle className="text-green-500" size={36} />
        ) : (
          <GraduationCap size={36} />
        )}
      </div>
      <h3>{tutorial.title}</h3>
      <p>{tutorial.description}</p>
      <div className="tutorial-meta" style={{ marginTop: '8px', fontSize: '0.875rem', color: '#666' }}>
        <span style={{ marginRight: '12px' }}>{tutorial.difficulty_tier}</span>
        <span>{tutorial.estimated_time_minutes || 30} min</span>
      </div>
    </Link>
  );
}

TutorialCard.propTypes = {
  tutorial: PropTypes.object.isRequired,
  userProgress: PropTypes.object
};

