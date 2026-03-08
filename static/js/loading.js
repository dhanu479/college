// Loading Overlay Manager
class LoadingManager {
    constructor() {
        this.overlay = document.getElementById('loading-overlay');
        this.statusText = this.overlay.querySelector('.loader-subtext');
        this.loadingStates = [
            'Initializing secure connection...',
            'Analyzing credentials...',
            'Verifying identity...',
            'Processing request...',
            'Almost done...'
        ];
        this.currentState = 0;
        this.intervalId = null;
    }

    show() {
        this.overlay.classList.remove('d-none');
        this.startStatusRotation();
    }

    hide() {
        this.overlay.classList.add('d-none');
        this.stopStatusRotation();
    }

    startStatusRotation() {
        this.currentState = 0;
        this.updateStatus();
        this.intervalId = setInterval(() => {
            this.currentState = (this.currentState + 1) % this.loadingStates.length;
            this.updateStatus();
        }, 2000);
    }

    stopStatusRotation() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    updateStatus() {
        if (this.statusText) {
            this.statusText.textContent = this.loadingStates[this.currentState];
        }
    }
}

// Initialize loading manager
const loadingManager = new LoadingManager();

// Hide neural loader on page load
document.addEventListener('DOMContentLoaded', function() {
    // New loader initial state is handled by CSS display: none usually, 
    // but the manager controls visibility.


    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            loadingManager.show();
        });
    });

    // Show loading on navigation links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !this.hasAttribute('download')) {
                loadingManager.show();
            }
        });
    });
});

// Hide loading on page show (e.g., when navigating back)
window.addEventListener('pageshow', function() {
    loadingManager.hide();
});
