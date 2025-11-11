import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import PropTypes from 'prop-types';

export default function TutorialFilter({
  selectedDifficulty,
  selectedTopic,
  onDifficultyChange,
  onTopicChange
}) {
  const [topics, setTopics] = useState([]);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const { data, error } = await supabase
        .from('sql_topics')
        .select('topic_name')
        .order('topic_name');

      if (error) throw error;
      setTopics(data?.map(t => t.topic_name) || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  return (
    <div className="tutorial-filter" style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
      <div className="filter-group" style={{ flex: '1', minWidth: '200px' }}>
        <label className="block text-sm font-medium mb-2" style={{ marginBottom: '0.5rem' }}>Difficulty</label>
        <select
          value={selectedDifficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="all">All Levels</option>
          <option value="basic">Basic</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
          <option value="expert">Expert</option>
        </select>
      </div>

      <div className="filter-group" style={{ flex: '1', minWidth: '200px' }}>
        <label className="block text-sm font-medium mb-2" style={{ marginBottom: '0.5rem' }}>Topic</label>
        <select
          value={selectedTopic}
          onChange={(e) => onTopicChange(e.target.value)}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '0.5rem' }}
        >
          <option value="all">All Topics</option>
          {topics.map(topic => (
            <option key={topic} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

TutorialFilter.propTypes = {
  selectedDifficulty: PropTypes.string.isRequired,
  selectedTopic: PropTypes.string.isRequired,
  onDifficultyChange: PropTypes.func.isRequired,
  onTopicChange: PropTypes.func.isRequired
};

