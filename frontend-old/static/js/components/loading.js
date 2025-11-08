// Loading overlay component
const Loading = {
    progressInterval: null,
    currentProgress: 0,

    show(message = 'Loading...', showProgress = false) {
        const overlay = document.getElementById('loading-overlay');
        const messageEl = document.getElementById('loading-message');
        const progressContainer = document.getElementById('loading-progress-container');

        if (overlay) {
            if (messageEl) messageEl.textContent = message;
            overlay.style.display = 'flex';

            // Show or hide progress bar
            if (showProgress && progressContainer) {
                progressContainer.style.display = 'block';
                this.startProgress();
            } else if (progressContainer) {
                progressContainer.style.display = 'none';
                this.stopProgress();
            }
        }
    },

    hide() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            this.stopProgress();
        }
    },

    startProgress() {
        this.currentProgress = 0;
        this.updateProgress(0);

        // Simulate progress with a realistic animation
        this.progressInterval = setInterval(() => {
            if (this.currentProgress < 90) {
                // Slow down as we get closer to 90%
                const increment = Math.max(1, (90 - this.currentProgress) / 10);
                this.currentProgress = Math.min(90, this.currentProgress + increment);
                this.updateProgress(this.currentProgress);
            }
        }, 200);
    },

    stopProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        this.currentProgress = 0;
    },

    completeProgress() {
        // Complete the progress bar before hiding
        this.updateProgress(100);
        setTimeout(() => {
            this.hide();
        }, 500);
    },

    updateProgress(percent) {
        const progressBar = document.getElementById('loading-progress-bar');
        const progressText = document.getElementById('loading-progress-text');

        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
        if (progressText) {
            progressText.textContent = `${Math.round(percent)}%`;
        }
    }
};


