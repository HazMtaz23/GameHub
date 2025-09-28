// Login/Register functionality for GameHub
document.addEventListener('DOMContentLoaded', function() {
    // Get form elements
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmPasswordField = document.getElementById('confirm-password-field');
    const toggleFormBtn = document.getElementById('toggle-form');
    const submitBtn = document.getElementById('submit-btn');
    const submitText = document.getElementById('submit-text');
    const submitIcon = document.getElementById('submit-icon');
    const formSubtitle = document.getElementById('form-subtitle');
    const toggleText = document.getElementById('toggle-text');
    const loginExtras = document.getElementById('login-extras');
    const successModal = document.getElementById('success-modal');
    const modalOkBtn = document.getElementById('modal-ok');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const togglePasswordBtn = document.getElementById('toggle-password');

    // State management
    let isLoginMode = true;
    let users = JSON.parse(localStorage.getItem('gameHubUsers')) || {};

    // Mobile menu functionality
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
            this.style.transform = mobileMenu.classList.contains('hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    }

    // Password visibility toggle
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.textContent = type === 'password' ? '🔒' : '👁️';
    });

    // Toggle between login and register forms
    toggleFormBtn.addEventListener('click', function() {
        isLoginMode = !isLoginMode;
        updateFormUI();
        clearErrors();
        clearForm();
    });

    // Update form UI based on mode
    function updateFormUI() {
        if (isLoginMode) {
            // Login mode
            confirmPasswordField.classList.add('hidden');
            confirmPasswordInput.removeAttribute('required');
            loginExtras.classList.remove('hidden');
            submitText.textContent = 'Sign In';
            submitIcon.textContent = '🚀';
            formSubtitle.textContent = 'Sign in to your account or create a new one';
            toggleText.textContent = "Don't have an account?";
            toggleFormBtn.textContent = 'Create one';
            submitBtn.className = submitBtn.className.replace('from-neon-pink via-neon-purple to-neon-blue', 'from-neon-blue via-game-primary to-neon-purple');
        } else {
            // Register mode
            confirmPasswordField.classList.remove('hidden');
            confirmPasswordInput.setAttribute('required', 'required');
            loginExtras.classList.add('hidden');
            submitText.textContent = 'Create Account';
            submitIcon.textContent = '✨';
            formSubtitle.textContent = 'Create your new GameHub account';
            toggleText.textContent = 'Already have an account?';
            toggleFormBtn.textContent = 'Sign in';
            submitBtn.className = submitBtn.className.replace('from-neon-blue via-game-primary to-neon-purple', 'from-neon-pink via-neon-purple to-neon-blue');
        }
    }

    // Clear form inputs
    function clearForm() {
        usernameInput.value = '';
        passwordInput.value = '';
        confirmPasswordInput.value = '';
        document.getElementById('remember-me').checked = false;
    }

    // Clear all error messages
    function clearErrors() {
        const errorElements = document.querySelectorAll('[id$="-error"]');
        errorElements.forEach(element => {
            element.classList.add('hidden');
            element.textContent = '';
        });
        
        // Remove error styling from inputs
        const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
        inputs.forEach(input => {
            input.classList.remove('border-red-400', 'animate-shake');
        });
    }

    // Show error for specific field
    function showError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + '-error');
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            inputElement.classList.add('border-red-400', 'animate-shake');
            
            // Remove shake animation after it completes
            setTimeout(() => {
                inputElement.classList.remove('animate-shake');
            }, 500);
        }
    }

    // Validate username
    function validateUsername(username) {
        if (!username) {
            return 'Username is required';
        }
        if (username.length < 3) {
            return 'Username must be at least 3 characters long';
        }
        if (username.length > 20) {
            return 'Username must be less than 20 characters';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return 'Username can only contain letters, numbers, and underscores';
        }
        return null;
    }

    // Validate password
    function validatePassword(password) {
        if (!password) {
            return 'Password is required';
        }
        if (password.length < 6) {
            return 'Password must be at least 6 characters long';
        }
        if (password.length > 50) {
            return 'Password must be less than 50 characters';
        }
        return null;
    }

    // Validate password confirmation
    function validateConfirmPassword(password, confirmPassword) {
        if (!confirmPassword) {
            return 'Please confirm your password';
        }
        if (password !== confirmPassword) {
            return 'Passwords do not match';
        }
        return null;
    }

    // Hash password (simple hash for demo - in production use proper hashing)
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    // Handle user registration
    function registerUser(username, password) {
        const hashedPassword = hashPassword(password);
        users[username] = {
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            gamesPlayed: 0,
            highScores: {}
        };
        
        localStorage.setItem('gameHubUsers', JSON.stringify(users));
        localStorage.setItem('gameHubCurrentUser', username);
        
        showSuccessModal('Account Created!', `Welcome to GameHub, ${username}! Your account has been created successfully.`);
    }

    // Handle user login
    function loginUser(username, password) {
        const hashedPassword = hashPassword(password);
        
        if (!users[username]) {
            showError('username', 'User not found. Please check your username or create an account.');
            return false;
        }
        
        if (users[username].password !== hashedPassword) {
            showError('password', 'Incorrect password. Please try again.');
            return false;
        }
        
        localStorage.setItem('gameHubCurrentUser', username);
        showSuccessModal('Welcome Back!', `Hello ${username}! You have successfully signed in.`);
        return true;
    }

    // Show success modal
    function showSuccessModal(title, message) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        successModal.classList.remove('hidden');
        
        // Add entrance animation
        const modalContent = successModal.querySelector('.inline-block');
        modalContent.style.transform = 'scale(0.95) translateY(4px)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            modalContent.style.transform = 'scale(1) translateY(0)';
            modalContent.style.opacity = '1';
            modalContent.style.transition = 'all 0.3s ease-out';
        }, 10);
    }

    // Hide success modal and redirect
    function hideSuccessModal() {
        const modalContent = successModal.querySelector('.inline-block');
        modalContent.style.transform = 'scale(0.95) translateY(4px)';
        modalContent.style.opacity = '0';
        
        setTimeout(() => {
            successModal.classList.add('hidden');
            window.location.href = 'index.html';
        }, 300);
    }

    // Modal OK button click handler
    modalOkBtn.addEventListener('click', hideSuccessModal);

    // Close modal when clicking outside
    successModal.addEventListener('click', function(e) {
        if (e.target === successModal) {
            hideSuccessModal();
        }
    });

    // Add button loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
            submitIcon.textContent = '⏳';
            submitText.textContent = isLoginMode ? 'Signing In...' : 'Creating Account...';
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            submitIcon.textContent = isLoginMode ? '🚀' : '✨';
            submitText.textContent = isLoginMode ? 'Sign In' : 'Create Account';
        }
    }

    // Form submission handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Clear previous errors
        clearErrors();
        
        // Get form values
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        let isValid = true;
        
        // Validate username
        const usernameError = validateUsername(username);
        if (usernameError) {
            showError('username', usernameError);
            isValid = false;
        }
        
        // Validate password
        const passwordError = validatePassword(password);
        if (passwordError) {
            showError('password', passwordError);
            isValid = false;
        }
        
        // Validate confirm password (only in register mode)
        if (!isLoginMode) {
            const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
            if (confirmPasswordError) {
                showError('confirmPassword', confirmPasswordError);
                isValid = false;
            }
            
            // Check if username already exists
            if (users[username]) {
                showError('username', 'Username already exists. Please choose a different one or sign in instead.');
                isValid = false;
            }
        }
        
        // If validation passes, proceed with login/register
        if (isValid) {
            setLoadingState(true);
            
            // Simulate API call delay
            setTimeout(() => {
                if (isLoginMode) {
                    loginUser(username, password);
                } else {
                    registerUser(username, password);
                }
                setLoadingState(false);
            }, 1000);
        }
    });

    // Input field enhancements
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(input => {
        // Clear errors when user starts typing
        input.addEventListener('input', function() {
            const fieldId = this.id;
            const errorElement = document.getElementById(fieldId + '-error');
            if (errorElement && !errorElement.classList.contains('hidden')) {
                errorElement.classList.add('hidden');
                this.classList.remove('border-red-400');
            }
        });

        // Add focus effects
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('scale-105');
        });

        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('scale-105');
        });
    });

    // Check if user is already logged in
    const currentUser = localStorage.getItem('gameHubCurrentUser');
    if (currentUser) {
        // User is already logged in, show welcome message
        showSuccessModal('Already Signed In', `Welcome back, ${currentUser}! You are already signed in.`);
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt + L to toggle between login/register
        if (e.altKey && e.key === 'l') {
            e.preventDefault();
            toggleFormBtn.click();
        }
        
        // Escape to close modal
        if (e.key === 'Escape' && !successModal.classList.contains('hidden')) {
            hideSuccessModal();
        }
    });

    // Add some visual feedback effects
    const interactiveElements = document.querySelectorAll('button, input, a');
    interactiveElements.forEach(element => {
        element.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('div');
            ripple.className = 'absolute rounded-full bg-white/30 pointer-events-none animate-ping';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.left = (e.clientX - this.getBoundingClientRect().left - 10) + 'px';
            ripple.style.top = (e.clientY - this.getBoundingClientRect().top - 10) + 'px';
            
            this.style.position = 'relative';
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    console.log('🎮 GameHub Login System Initialized');
    console.log('💡 Tip: Press Alt + L to toggle between login and register modes');
});
