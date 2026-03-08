// AI Theme Interactive Features
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AI UI elements
    initAIElements();
    initAIInteractions();
    initAIAnimations();
});

function initAIElements() {
    // Convert regular buttons to AI buttons
    document.querySelectorAll('.btn-primary, .btn-warning').forEach(button => {
        if (!button.classList.contains('ai-button')) {
            button.classList.add('ai-button');
        }
    });

    // Convert cards to AI cards
    document.querySelectorAll('.card').forEach(card => {
        if (!card.classList.contains('ai-card')) {
            card.classList.add('ai-card');
        }
    });

    // Convert nav links to AI nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        if (!link.classList.contains('ai-nav-link')) {
            link.classList.add('ai-nav-link');
        }
    });

    // Add AI glow effect to important elements
    document.querySelectorAll('h1, h2, .important').forEach(element => {
        if (!element.classList.contains('ai-glow')) {
            element.classList.add('ai-glow');
        }
    });
}

function initAIInteractions() {
    // Add hover sound effect
    document.querySelectorAll('.ai-button, .ai-nav-link').forEach(element => {
        element.addEventListener('mouseenter', () => {
            playHoverSound();
        });
    });

    // Add click effects
    document.querySelectorAll('.ai-button').forEach(button => {
        button.addEventListener('click', createRippleEffect);
    });

    // Add scroll animations
    window.addEventListener('scroll', () => {
        animateOnScroll();
    });
}

function initAIAnimations() {
    // Animate stats on visibility
    const stats = document.querySelectorAll('.ai-stat-value');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
            }
        });
    });

    stats.forEach(stat => observer.observe(stat));

    // Initialize progress bars
    document.querySelectorAll('.ai-progress-bar').forEach(bar => {
        const targetWidth = bar.getAttribute('data-width') || '0';
        setTimeout(() => {
            bar.style.width = targetWidth + '%';
        }, 200);
    });
}

function createRippleEffect(event) {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size/2;
    const y = event.clientY - rect.top - size/2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        top: ${y}px;
        left: ${x}px;
        background: rgba(255, 215, 0, 0.2);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

function animateNumber(element) {
    const target = parseInt(element.getAttribute('data-target'));
    const duration = 2000;
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const updateNumber = () => {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = target;
        }
    };

    updateNumber();
}

function animateOnScroll() {
    const elements = document.querySelectorAll('.ai-animate-on-scroll');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        const isVisible = elementTop < window.innerHeight && elementBottom >= 0;
        
        if (isVisible) {
            element.classList.add('ai-animated');
        }
    });
}

function playHoverSound() {
    // Create a subtle hover sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Add dynamic loading indicators
document.addEventListener('click', function(e) {
    if (e.target.tagName === 'BUTTON' && !e.target.classList.contains('no-loader')) {
        const originalContent = e.target.innerHTML;
        e.target.innerHTML = `
            <div class="neural-loader" style="height: 2px; width: 50px; margin: 0 auto;">
                <div class="neural-loader-bar"></div>
            </div>
        `;
        setTimeout(() => {
            e.target.innerHTML = originalContent;
        }, 1000);
    }
});
