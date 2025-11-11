import React from 'react';
import IntroductionSection from './sections/IntroductionSection';
import ExampleSection from './sections/ExampleSection';
import ExplanationSection from './sections/ExplanationSection';
import InteractiveSection from './sections/InteractiveSection';
import ChallengeSection from './sections/ChallengeSection';
import SummarySection from './sections/SummarySection';
import PropTypes from 'prop-types';

export default function TutorialSection({ section, tutorialId, onComplete }) {
  if (!section) {
    return <div>Section not found</div>;
  }

  const renderSection = () => {
    switch (section.type) {
      case 'introduction':
        return <IntroductionSection content={section.content} />;
      case 'example':
        return <ExampleSection content={section.content} />;
      case 'explanation':
        return <ExplanationSection content={section.content} />;
      case 'interactive':
        return <InteractiveSection content={section.content} />;
      case 'challenge':
        return (
          <ChallengeSection
            content={section.content}
            tutorialId={tutorialId}
            onComplete={onComplete}
          />
        );
      case 'summary':
        return <SummarySection content={section.content} />;
      default:
        return <div>Unknown section type: {section.type}</div>;
    }
  };

  return (
    <div className="tutorial-section">
      <h3 className="section-title">{section.title}</h3>
      {renderSection()}
    </div>
  );
}

TutorialSection.propTypes = {
  section: PropTypes.object.isRequired,
  tutorialId: PropTypes.number.isRequired,
  onComplete: PropTypes.func
};

