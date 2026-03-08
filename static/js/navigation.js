// Navigation map for different pages
const pageNavigation = {
    'index': ['features', 'register'],
    'features': ['how_it_works', 'register'],
    'how_it_works': ['features', 'register'],
    'about_securevote': ['our_team', 'features'],
    'our_team': ['about_securevote', 'features'],
    'help': ['features', 'register'],
    'privacy_policy': ['terms', 'register'],
    'terms': ['privacy_policy', 'register'],
    'register': ['login', 'features'],
    'login': ['register', 'features'],
    'face_verify': ['help'],
    'vote': ['help'],
    'result': ['help']
};

// Add navigation buttons when page loads
document.addEventListener('DOMContentLoaded', function() {
    const currentPath = window.location.pathname.split('/').pop() || 'index';
    const currentPage = currentPath.replace('.html', '');
    
    if (pageNavigation[currentPage]) {
        const container = document.querySelector('main.container');
        if (container) {
            const navSection = document.createElement('div');
            navSection.className = 'navigation-buttons mt-5 text-center';
        
        pageNavigation[currentPage].forEach((nextPage, index) => {
            const button = document.createElement('a');
            button.href = `/${nextPage.replace(/_/g, '-')}`;
            button.className = `btn btn-warning btn-lg mx-2`;
            button.innerHTML = `
                <i class="fas fa-arrow-right me-2"></i>
                ${getPageTitle(nextPage)}
            `;
            navSection.appendChild(button);
        });
        
        container.appendChild(navSection);
        }
    }
});

// Get user-friendly page titles
function getPageTitle(page) {
    const titles = {
        'features': 'Explore Features',
        'how_it_works': 'How It Works',
        'register': 'Register Now',
        'login': 'Login',
        'about_securevote': 'About Us',
        'our_team': 'Meet Our Team',
        'help': 'Get Help',
        'privacy_policy': 'Privacy Policy',
        'terms': 'Terms of Service'
    };
    return titles[page] || 'Next';
}

// Add hover effects to all clickable elements
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effect to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 4px 15px rgba(255, 193, 7, 0.3)';
        });
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

    // Add hover effect to cards if they are clickable
    document.querySelectorAll('.feature-card, .team-member-card').forEach(card => {
        if (card.closest('a') || card.querySelector('a')) {
            card.style.cursor = 'pointer';
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px)';
                this.style.boxShadow = '0 10px 20px rgba(255, 193, 7, 0.2)';
            });
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            });
        }
    });
});
