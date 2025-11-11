import React from 'react';
import PropTypes from 'prop-types';

export default function ExplanationSection({ content }) {
  if (!content) return null;

  return (
    <div className="explanation-section">
      <div className="prose max-w-none">
        <p className="text-gray-700 mb-4 whitespace-pre-line">{content.text}</p>

        {content.codeSnippets && content.codeSnippets.length > 0 && (
          <div className="code-snippets space-y-4">
            {content.codeSnippets.map((snippet, idx) => (
              <div key={idx} className="code-snippet">
                {snippet.caption && (
                  <p className="text-sm font-semibold mb-2">{snippet.caption}</p>
                )}
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                  <code className="text-sm">{snippet.code}</code>
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

ExplanationSection.propTypes = {
  content: PropTypes.object.isRequired
};

