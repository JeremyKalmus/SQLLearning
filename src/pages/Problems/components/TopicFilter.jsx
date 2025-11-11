import React from 'react';

const TOPICS_BY_DIFFICULTY = {
  basic: [],
  intermediate: [
    { value: 'JOINs', label: 'JOINs (INNER/LEFT/RIGHT)' },
    { value: 'Aggregates', label: 'Aggregates (GROUP BY, HAVING)' },
    { value: 'Multiple Tables', label: 'Multiple Table Queries' }
  ],
  advanced: [
    { value: 'Window Functions', label: 'Window Functions' },
    { value: 'CTEs', label: 'Common Table Expressions (CTEs)' },
    { value: 'Subqueries', label: 'Subqueries' },
    { value: 'Self-Joins', label: 'Self-Joins' },
    { value: 'CASE Statements', label: 'CASE Statements' },
    { value: 'Date/Time Functions', label: 'Date/Time Functions' }
  ],
  expert: [
    { value: 'Recursive CTEs', label: 'Recursive CTEs' },
    { value: 'Advanced Analytics', label: 'Advanced Analytics' },
    { value: 'Query Optimization', label: 'Query Optimization' }
  ]
};

export default function TopicFilter({ difficulty, selectedTopic, onTopicChange }) {
  const availableTopics = TOPICS_BY_DIFFICULTY[difficulty] || [];

  if (availableTopics.length === 0) return null;

  return (
    <div className="option-group">
      <label htmlFor="topic-select">Filter by Topic (Optional):</label>
      <select
        id="topic-select"
        value={selectedTopic || ''}
        onChange={(e) => onTopicChange(e.target.value || null)}
      >
        <option value="">All Topics</option>
        {availableTopics.map(topic => (
          <option key={topic.value} value={topic.value}>
            {topic.label}
          </option>
        ))}
      </select>
    </div>
  );
}
