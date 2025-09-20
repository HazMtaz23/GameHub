// Enhanced JavaScript functionality for GameHub

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle with enhanced animation
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            // Add rotation animation to menu button
            this.style.transform = mobileMenu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    }

    // Enhanced smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Add ripple effect to clicked link
                createRippleEffect(this, e);
                
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Close mobile menu if open
                if (!mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuButton.style.transform = 'rotate(0deg)';
                }
            }
        });
    });

    // Enhanced game card click handlers with sound effects (visual feedback)
    const gameCards = document.querySelectorAll('.game-card-enhanced');
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const gameTitle = this.querySelector('h3').textContent;
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Create floating notification
            createFloatingNotification(`${gameTitle} - Coming soon! 🚀`);
        });

        // Add hover sound effect simulation (visual pulse)
        card.addEventListener('mouseenter', function() {
            this.style.filter = 'brightness(1.1) saturate(1.2)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.filter = '';
        });
    });

    // Enhanced interactive effects for buttons
    const interactiveButtons = document.querySelectorAll('.interactive-button');
    interactiveButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05) translateY(-2px)';
            this.style.boxShadow = '0 10px 30px rgba(99, 102, 241, 0.4)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) translateY(0)';
            this.style.boxShadow = '';
        });

        button.addEventListener('click', function(e) {
            createRippleEffect(this, e);
        });
    });

    // Enhanced parallax effect for hero section with multiple layers
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('main');
        const particles = document.querySelectorAll('.particle');
        
        if (heroSection && scrolled < window.innerHeight) {
            heroSection.style.transform = `translateY(${scrolled * 0.3}px)`;
        }

        // Parallax effect for particles
        particles.forEach((particle, index) => {
            const speed = 0.1 + (index * 0.05);
            particle.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
        });

        // Update navigation bar opacity based on scroll
        const nav = document.querySelector('nav');
        if (nav) {
            const opacity = Math.min(scrolled / 100, 1);
            nav.style.background = `rgba(0, 0, 0, ${0.3 + opacity * 0.4})`;
        }
    });

    // Enhanced loading animation for game cards with staggered timing
    const cards = document.querySelectorAll('.game-card-enhanced');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px) scale(0.9)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
        }, index * 150 + 300);
    });

    // Add dynamic background color changes based on time
    setInterval(updateDynamicBackground, 10000);

    // Initialize cursor trail effect
    initializeCursorTrail();

    // Add keyboard navigation
    initializeKeyboardNavigation();

    // Performance monitoring
    monitorPerformance();
});

// Create ripple effect function
function createRippleEffect(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
        z-index: 1000;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    // Add CSS animation
    if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Create floating notification
function createFloatingNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white px-6 py-3 rounded-lg shadow-2xl z-50 transform translate-x-full transition-transform duration-300';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(full)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Dynamic background color updates
function updateDynamicBackground() {
    const colors = [
        'from-gray-900 via-purple-900 to-violet-900',
        'from-gray-900 via-blue-900 to-indigo-900',
        'from-gray-900 via-pink-900 to-rose-900',
        'from-gray-900 via-green-900 to-emerald-900'
    ];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    document.body.className = document.body.className.replace(/from-\S+ via-\S+ to-\S+/, randomColor);
}

// Cursor trail effect
function initializeCursorTrail() {
    const trail = [];
    const trailLength = 5;

    for (let i = 0; i < trailLength; i++) {
        const dot = document.createElement('div');
        dot.className = 'fixed w-2 h-2 bg-white rounded-full pointer-events-none z-50 opacity-0';
        document.body.appendChild(dot);
        trail.push(dot);
    }

    let mouseX = 0, mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    function updateTrail() {
        trail.forEach((dot, index) => {
            setTimeout(() => {
                dot.style.left = mouseX + 'px';
                dot.style.top = mouseY + 'px';
                dot.style.opacity = (trailLength - index) / trailLength * 0.5;
                dot.style.transform = `scale(${(trailLength - index) / trailLength})`;
            }, index * 50);
        });
        requestAnimationFrame(updateTrail);
    }

    updateTrail();
}

// Keyboard navigation
function initializeKeyboardNavigation() {
    let focusableElements = [];
    let currentFocusIndex = -1;

    function updateFocusableElements() {
        focusableElements = Array.from(document.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'));
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            updateFocusableElements();
        }
        
        // Add custom keyboard shortcuts
        if (e.key === 'g' && e.ctrlKey) {
            e.preventDefault();
            document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
        }
    });

    updateFocusableElements();
}

// Performance monitoring
function monitorPerformance() {
    // Monitor frame rate
    let lastTime = performance.now();
    let frameCount = 0;
    
    function measureFPS() {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - lastTime >= 1000) {
            const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
            
            if (fps < 30) {
                // Reduce animations for better performance
                document.body.classList.add('low-performance');
            }
            
            frameCount = 0;
            lastTime = currentTime;
        }
        
        requestAnimationFrame(measureFPS);
    }
    
    measureFPS();
}

// Enhanced utility functions for future game integration
const GameHub = {
    // Function to add new games dynamically with enhanced effects
    addGame: function(gameData) {
        const gamesGrid = document.querySelector('#games .grid');
        const gameCard = this.createGameCard(gameData);
        
        // Add entrance animation
        gameCard.style.opacity = '0';
        gameCard.style.transform = 'scale(0.8) translateY(20px)';
        
        gamesGrid.appendChild(gameCard);
        
        setTimeout(() => {
            gameCard.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            gameCard.style.opacity = '1';
            gameCard.style.transform = 'scale(1) translateY(0)';
        }, 100);
    },

    // Create an enhanced game card element
    createGameCard: function(gameData) {
        const card = document.createElement('div');
        card.className = 'game-card-enhanced relative group cursor-pointer';
        
        card.innerHTML = `
            <div class="absolute -inset-0.5 bg-gradient-to-r ${gameData.glowColors || 'from-neon-blue to-neon-purple'} rounded-xl blur opacity-30 group-hover:opacity-100 group-hover:duration-200 transition-opacity"></div>
            <div class="relative bg-black/40 backdrop-blur-xl rounded-xl p-6 border border-white/20 group-hover:border-white/50 transition-all duration-300">
                <div class="flex items-center justify-center h-32 bg-gradient-to-br ${gameData.gradientColors} rounded-lg mb-4 group-hover:${gameData.hoverGradient} transition-all duration-500 relative overflow-hidden">
                    <span class="text-4xl animate-bounce-subtle">${gameData.icon}</span>
                    <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 class="text-lg font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-neon-blue group-hover:to-neon-purple transition-all duration-300">${gameData.title}</h3>
                <p class="text-gray-300 text-sm mb-4 group-hover:text-gray-200 transition-colors duration-300">${gameData.description}</p>
                <button class="w-full bg-gradient-to-r ${gameData.buttonColors} text-white py-2 px-4 rounded-lg hover:${gameData.buttonHover} transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-current/50 ${gameData.available ? '' : 'opacity-60 cursor-not-allowed'}">
                    ${gameData.available ? '🎮 Play Now' : '🔮 Coming Soon'}
                </button>
            </div>
        `;

        // Add enhanced click handler
        card.addEventListener('click', function() {
            if (gameData.available && gameData.onClick) {
                gameData.onClick();
            } else {
                createFloatingNotification(`${gameData.title} - Coming soon! 🚀`);
            }
        });

        return card;
    },

    // Navigate to a specific game with transition effect
    navigateToGame: function(gameId) {
        // Create transition overlay
        const overlay = document.createElement('div');
        overlay.className = 'fixed inset-0 bg-gradient-to-br from-neon-blue to-neon-purple opacity-0 z-50 flex items-center justify-center';
        overlay.innerHTML = '<div class="text-white text-2xl font-bold animate-pulse">Loading Game... 🎮</div>';
        
        document.body.appendChild(overlay);
        
        // Animate overlay in
        setTimeout(() => {
            overlay.style.transition = 'opacity 0.5s';
            overlay.style.opacity = '1';
        }, 10);
        
        // Navigate after animation
        setTimeout(() => {
            window.location.href = `games/${gameId}/index.html`;
        }, 1000);
    },

    // Add special effects
    createParticleExplosion: function(x, y) {
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'fixed w-2 h-2 bg-neon-blue rounded-full pointer-events-none z-50';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            const angle = (Math.PI * 2 * i) / 20;
            const velocity = 2 + Math.random() * 4;
            
            document.body.appendChild(particle);
            
            let posX = x;
            let posY = y;
            let opacity = 1;
            
            function animateParticle() {
                posX += Math.cos(angle) * velocity;
                posY += Math.sin(angle) * velocity;
                opacity -= 0.02;
                
                particle.style.left = posX + 'px';
                particle.style.top = posY + 'px';
                particle.style.opacity = opacity;
                
                if (opacity > 0) {
                    requestAnimationFrame(animateParticle);
                } else {
                    particle.remove();
                }
            }
            
            animateParticle();
        }
    }
};

// Export for use in other scripts
window.GameHub = GameHub;
