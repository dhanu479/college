// Features page interactivity
document.addEventListener('DOMContentLoaded', function() {
    // Feature category filtering
    const filterButtons = document.querySelectorAll('[data-category]');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const category = this.dataset.category;
            const features = document.querySelectorAll('.feature-card');

            features.forEach(feature => {
                if (category === 'all' || feature.dataset.category === category) {
                    feature.style.display = 'block';
                    feature.classList.add('animate__animated', 'animate__fadeIn');
                } else {
                    feature.style.display = 'none';
                }
            });
        });
    });

    // Interactive statistics
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
        const target = parseInt(stat.dataset.target);
        let current = 0;
        const increment = target / 100;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                current = target;
            }
            stat.textContent = Math.round(current);
        }, 20);
    });

    // Feature card interaction
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        // Add hover effect
        card.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.feature-icon i');
            if (icon) {
                icon.classList.add('fa-bounce');
            }
        });

        card.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.feature-icon i');
            if (icon) {
                icon.classList.remove('fa-bounce');
            }
        });

        // Add click effect
        card.addEventListener('click', function() {
            const content = this.querySelector('.feature-content');
            if (content) {
                content.classList.toggle('expanded');
            }
        });
    });

    // Progress indicators
    const features = document.querySelectorAll('.progress-feature');
    features.forEach(feature => {
        const progress = feature.querySelector('.progress-bar');
        const target = progress.getAttribute('aria-valuenow');
        progress.style.width = '0%';
        
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                progress.style.width = target + '%';
                observer.disconnect();
            }
        });
        
        observer.observe(feature);
    });

    // Tooltip initialization for feature details
    const tooltipTriggers = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggers.forEach(trigger => {
        new bootstrap.Tooltip(trigger);
    });

    // Feature comparison toggle
    const comparisonToggle = document.getElementById('comparisonToggle');
    if (comparisonToggle) {
        comparisonToggle.addEventListener('change', function() {
            const comparisons = document.querySelectorAll('.feature-comparison');
            comparisons.forEach(comparison => {
                comparison.classList.toggle('show-advanced');
            });
        });
    }

    // Feature search functionality
    const searchInput = document.getElementById('featureSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const features = document.querySelectorAll('.feature-card');
            
            features.forEach(feature => {
                const text = feature.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    feature.style.display = 'block';
                    feature.classList.add('animate__animated', 'animate__fadeIn');
                } else {
                    feature.style.display = 'none';
                }
            });
        });
    }
});
