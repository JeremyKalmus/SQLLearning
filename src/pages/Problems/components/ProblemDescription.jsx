import PropTypes from 'prop-types';

export default function ProblemDescription({ problem }) {
  if (!problem) return null;

  return (
    <div className="problem-description">
      <div className="problem-header">
        <h3>{problem.title || 'Untitled Problem'}</h3>
        <span className={`difficulty-badge difficulty-${problem.difficulty || 'basic'}`}>
          {problem.difficulty || 'basic'}
        </span>
      </div>
      <p>{problem.description || 'No description available'}</p>
      {problem.topic && (
        <div className="problem-topic">
          <strong>Topic:</strong> <span>{problem.topic}</span>
        </div>
      )}
    </div>
  );
}

ProblemDescription.propTypes = {
  problem: PropTypes.object
};

