import { useState, useEffect } from 'react';

/**
 * Hook for managing progress overlay with animation
 */
export function useProgress() {
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [showProgress, setShowProgress] = useState(false);

  // Progress animation effect
  useEffect(() => {
    let interval;
    if (showProgress && progress < 90) {
      interval = setInterval(() => {
        setProgress(prev => {
          const increment = Math.max(1, (90 - prev) / 10);
          return Math.min(90, prev + increment);
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [showProgress, progress]);

  const startProgress = (message) => {
    setProgressMessage(message);
    setProgress(0);
    setShowProgress(true);
  };

  const completeProgress = () => {
    setProgress(100);
    setTimeout(() => {
      setShowProgress(false);
      setProgress(0);
    }, 500);
  };

  return {
    progress,
    progressMessage,
    showProgress,
    startProgress,
    completeProgress,
    setShowProgress
  };
}

