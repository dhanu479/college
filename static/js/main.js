// Page loading animation
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = 0;
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = 1;
    }, 100);
});

// Smooth page transitions
window.addEventListener('beforeunload', () => {
    document.body.style.opacity = 0;
});

// Handle flash messages with AI-themed styling
function showFlashMessage(message, category) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${category === 'danger' ? 'warning' : category} alert-dismissible fade show glow`;
    alertDiv.innerHTML = `
        <i class="fas fa-robot me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('.flash-messages').appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}

// Add loading spinners to forms
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = `
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Processing...
                `;
                submitBtn.disabled = true;
            }
        });
    });

    // Add form validation
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('invalid', function(e) {
            e.preventDefault();
            input.classList.add('is-invalid');
        });
        input.addEventListener('input', function() {
            if (input.validity.valid) {
                input.classList.remove('is-invalid');
            }
        });
    });
});

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    const isDarkMode = document.body.classList.contains('light-mode');
    localStorage.setItem('darkMode', !isDarkMode);
}

// Initialize dark mode from localStorage
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('light-mode');
}

// Loading overlay management
const loadingOverlay = {
    show: () => {
        document.getElementById('loading-overlay').classList.remove('d-none');
    },
    hide: () => {
        document.getElementById('loading-overlay').classList.add('d-none');
    }
};

// Smooth scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add interactive hover effects to all cards
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const xPercent = (x / rect.width - 0.5) * 20;
        const yPercent = (y / rect.height - 0.5) * 20;

        card.style.transform = `
            perspective(1000px)
            rotateX(${-yPercent}deg)
            rotateY(${xPercent}deg)
            translateZ(10px)
        `;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'none';
    });
});

// Add glowing effect to buttons
document.querySelectorAll('.btn-warning').forEach(btn => {
    if (!btn.classList.contains('btn-floating')) {
        btn.classList.add('glow');
    }
});

// Show loading overlay on form submissions
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
        loadingOverlay.show();
    });
});

// Initialize tooltips
const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltips.map(tooltip => new bootstrap.Tooltip(tooltip));

// Add scroll indicator
const scrollIndicator = document.createElement('div');
scrollIndicator.className = 'scroll-progress';
document.body.appendChild(scrollIndicator);

window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    scrollIndicator.style.width = scrolled + '%';
});
