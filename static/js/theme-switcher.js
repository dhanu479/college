// Theme Management
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initThemeToggle();
});

function initTheme() {
    // Get saved theme or use default
    const savedTheme = localStorage.getItem('securevote-theme') || 'dark';
    applyTheme(savedTheme);
}

function initThemeToggle() {
    const themeButtons = document.querySelectorAll('.theme-toggle-btn');
    
    themeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const theme = button.getAttribute('data-theme');
            applyTheme(theme);
            
            // Update active state of buttons
            themeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Play theme switch sound
            playThemeSwitchSound();
        });
    });
}

function applyTheme(theme) {
    // Save theme preference
    localStorage.setItem('securevote-theme', theme);
    
    // Apply theme to body
    document.body.setAttribute('data-theme', theme);
    
    // Update active button
    const buttons = document.querySelectorAll('.theme-toggle-btn');
    buttons.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });
    
    // Adjust background elements based on theme
    adjustBackgroundForTheme(theme);
}

function adjustBackgroundForTheme(theme) {
    const aiBackground = document.getElementById('ai-background');
    const digitalRain = document.getElementById('digital-rain');
    
    switch(theme) {
        case 'light':
            if(aiBackground) aiBackground.style.opacity = '0.3';
            if(digitalRain) digitalRain.style.opacity = '0.1';
            break;
        case 'dark':
            if(aiBackground) aiBackground.style.opacity = '0.7';
            if(digitalRain) digitalRain.style.opacity = '0.3';
            break;
        case 'cyberpunk':
            if(aiBackground) aiBackground.style.opacity = '0.9';
            if(digitalRain) digitalRain.style.opacity = '0.5';
            break;
    }
}

function playThemeSwitchSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Enhance page load animation
window.addEventListener('load', function() {
    document.body.classList.add('content-loaded');
    
    // Animate all AI cards on load
    const cards = document.querySelectorAll('.ai-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate__animated', 'animate__fadeInUp');
        }, index * 100);
    });
});
