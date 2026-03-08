// Interactive features for all pages
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    AOS.init({
        duration: 1000,
        once: false,
        mirror: true
    });

    // Card hover effects
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
            this.style.boxShadow = '0 15px 30px rgba(0,0,0,0.3)';
            const icon = this.querySelector('.feature-icon i');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(5deg)';
            }
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = 'none';
            const icon = this.querySelector('.feature-icon i');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0)';
            }
        });
    });

    // Timeline animation
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
        item.addEventListener('mouseenter', function() {
            const number = this.querySelector('.timeline-number');
            if (number) {
                number.style.transform = 'translateX(-50%) scale(1.2)';
                number.style.backgroundColor = '#ffffff';
                number.style.color = '#000033';
            }
        });

        item.addEventListener('mouseleave', function() {
            const number = this.querySelector('.timeline-number');
            if (number) {
                number.style.transform = 'translateX(-50%) scale(1)';
                number.style.backgroundColor = '#ffc107';
                number.style.color = '#000033';
            }
        });
    });

    // FAQ Accordion animation
    const accordionItems = document.querySelectorAll('.accordion-item');
    accordionItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
            const button = this.querySelector('.accordion-button');
            if (button && !button.classList.contains('collapsed')) {
                // button.style.backgroundColor = 'rgba(0, 0, 51, 0.9)'; // Stripped transparency
            }
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
            const button = this.querySelector('.accordion-button');
            if (button) {
                // button.style.backgroundColor = 'rgba(0, 0, 51, 0.7)'; // Stripped transparency
            }
        });
    });

    // Privacy and Terms sections hover effects
    const sections = document.querySelectorAll('.privacy-section, .terms-section');
    sections.forEach(section => {
        section.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.02)';
            // this.style.backgroundColor = 'rgba(0, 0, 51, 0.6)'; // Stripped transparency
            // this.style.borderColor = 'rgba(255, 193, 7, 0.4)'; // Stripped transparency
        });

        section.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            // this.style.backgroundColor = 'rgba(0, 0, 51, 0.5)'; // Stripped transparency
            // this.style.borderColor = 'rgba(255, 193, 7, 0.1)'; // Stripped transparency
        });
    });

    // Feature list items animation
    const featureItems = document.querySelectorAll('.feature-list li');
    featureItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(10px)';
            this.style.color = '#ffc107';
        });

        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
            this.style.color = '#ffffff';
        });
    });

    // Support contact cards interaction
    const supportCards = document.querySelectorAll('.support-contact');
    supportCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1.2) rotate(5deg)';
            }
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            const icon = this.querySelector('i');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0)';
            }
        });
    });

    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
});

// Function to animate numbers
function animateNumbers() {
    const numbers = document.querySelectorAll('.animate-number');
    numbers.forEach(num => {
        const target = parseInt(num.getAttribute('data-target'));
        const duration = 2000; // 2 seconds
        const step = target / (duration / 16); // 60fps
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                clearInterval(timer);
                current = target;
            }
            num.textContent = Math.floor(current);
        }, 16);
    });
}
