import PropTypes from 'prop-types';

function TopicBadge({ topic }) {
  return (
    <span className="topic-badge">
      {topic}
    </span>
  );
}

TopicBadge.propTypes = {
  topic: PropTypes.string.isRequired
};

export default function ProblemDescription({ problem }) {
  if (!problem) return null;

  const showTopicBadges = problem.primary_topic || (problem.concept_tags && problem.concept_tags.length > 0);

  return (
    <div className="problem-description">
      <div className="problem-header">
        <h3>{problem.title || 'Untitled Problem'}</h3>
        <div className="problem-metadata">
          <span className={`difficulty-badge difficulty-${problem.difficulty || 'basic'}`}>
            {problem.sub_difficulty || problem.display_difficulty || problem.difficulty || 'basic'}
          </span>
        </div>
      </div>
      <p>{problem.description || 'No description available'}</p>
      {showTopicBadges && (
        <div className="problem-topics">
          {problem.primary_topic && <TopicBadge topic={problem.primary_topic} />}
          {problem.concept_tags?.filter(tag => tag !== problem.primary_topic).map((tag, i) => (
            <TopicBadge key={i} topic={tag} />
          ))}
        </div>
      )}
      {problem.topic && !showTopicBadges && (
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

