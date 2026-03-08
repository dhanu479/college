// Enhanced login page interactions
document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    const inputs = form.querySelectorAll('input');
    const securityIcons = document.querySelectorAll('.security-feature');
    
    // Add floating label animation with glow effect
    inputs.forEach(input => {
        const label = input.nextElementSibling;
        
        input.addEventListener('focus', () => {
            label.style.color = '#ffd700';
            label.style.transform = 'translateY(-1.5rem) scale(0.85)';
            input.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.2)';
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                label.style.color = '';
                label.style.transform = '';
            }
            input.style.boxShadow = '';
        });

        // Add typing effect
        input.addEventListener('input', () => {
            if (input.value) {
                input.style.borderColor = '#ffd700';
            } else {
                input.style.borderColor = '';
            }
        });
    });

    // Enhanced form validation with visual feedback
    form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
            
            // Shake effect on invalid fields
            inputs.forEach(input => {
                if (!input.validity.valid) {
                    input.classList.add('animate__animated', 'animate__shakeX');
                    setTimeout(() => {
                        input.classList.remove('animate__animated', 'animate__shakeX');
                    }, 1000);
                }
            });
        } else {
            // Success animation
            form.classList.add('animate__animated', 'animate__fadeOutUp');
        }
        form.classList.add('was-validated');
    });

    // Interactive security features
    securityIcons.forEach(icon => {
        icon.addEventListener('mouseenter', () => {
            icon.classList.add('animate__animated', 'animate__pulse');
            icon.style.transform = 'scale(1.1)';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.classList.remove('animate__animated', 'animate__pulse');
            icon.style.transform = 'scale(1)';
        });
    });

    // Password strength indicator
    const passwordInput = document.getElementById('password');
    const strengthIndicator = document.createElement('div');
    strengthIndicator.className = 'password-strength mt-2';
    passwordInput.parentElement.appendChild(strengthIndicator);

    passwordInput.addEventListener('input', () => {
        const strength = checkPasswordStrength(passwordInput.value);
        updateStrengthIndicator(strength);
    });

    function checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^A-Za-z0-9]/)) strength++;
        return strength;
    }

    function updateStrengthIndicator(strength) {
        const colors = ['#ff4444', '#ffbb33', '#00C851', '#33b5e5'];
        const messages = ['Weak', 'Fair', 'Good', 'Strong'];
        
        strengthIndicator.innerHTML = `
            <div class="progress" style="height: 5px;">
                <div class="progress-bar bg-${strength === 0 ? 'danger' : strength === 1 ? 'warning' : strength === 2 ? 'info' : 'success'}"
                     style="width: ${(strength / 4) * 100}%"></div>
            </div>
            <small class="text-${strength === 0 ? 'danger' : strength === 1 ? 'warning' : strength === 2 ? 'info' : 'success'} mt-1">
                ${messages[strength]}
            </small>
        `;
    }

    // Add loading animation on form submit
    form.addEventListener('submit', (e) => {
        if (form.checkValidity()) {
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.innerHTML = `
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Verifying...
            `;
        }
    });

    // Add interactive background pattern
    const patternContainer = document.createElement('div');
    patternContainer.className = 'login-pattern';
    document.querySelector('.card').appendChild(patternContainer);

    for (let i = 0; i < 50; i++) {
        const dot = document.createElement('div');
        dot.className = 'pattern-dot';
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.top = `${Math.random() * 100}%`;
        dot.style.animationDelay = `${Math.random() * 2}s`;
        patternContainer.appendChild(dot);
    }
});
