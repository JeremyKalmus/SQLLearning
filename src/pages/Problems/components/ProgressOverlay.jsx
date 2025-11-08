import PropTypes from 'prop-types';

export default function ProgressOverlay({ showProgress, progress, progressMessage }) {
  if (!showProgress) return null;

  return (
    <div className="progress-overlay">
      <div className="progress-content">
        <div className="loading-spinner"></div>
        <p className="progress-message">{progressMessage}</p>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-text">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
}

ProgressOverlay.propTypes = {
  showProgress: PropTypes.bool.isRequired,
  progress: PropTypes.number.isRequired,
  progressMessage: PropTypes.string.isRequired
};

