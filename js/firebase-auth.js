// Firebase Authentication Module for GameHub
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signInAnonymously,
    updateProfile,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

class GameHubAuth {
    constructor() {
        this.auth = window.auth;
        this.db = window.db;
        this.currentUser = null;
        this.isLoginMode = true;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupAuthStateListener();
        this.showLoadingState(false);
        
        console.log('🔥 Firebase Auth initialized for GameHub');
    }

    initializeElements() {
        // Form elements
        this.authForm = document.getElementById('auth-form');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.confirmPasswordInput = document.getElementById('confirmPassword');
        this.displayNameInput = document.getElementById('displayName');
        
        // UI elements
        this.formTitle = document.getElementById('form-title');
        this.formSubtitle = document.getElementById('form-subtitle');
        this.submitBtn = document.getElementById('submit-btn');
        this.submitText = document.getElementById('submit-text');
        this.submitIcon = document.getElementById('submit-icon');
        this.toggleFormBtn = document.getElementById('toggle-form');
        this.toggleText = document.getElementById('toggle-text');
        this.registerFields = document.getElementById('register-fields');
        this.togglePasswordBtn = document.getElementById('toggle-password');
        this.loadingSpinner = document.getElementById('loading-spinner');
        
        // Message elements
        this.errorMessage = document.getElementById('error-message');
        this.errorText = document.getElementById('error-text');
        this.successMessage = document.getElementById('success-message');
        this.successText = document.getElementById('success-text');
        
        // Social login buttons
        this.googleSigninBtn = document.getElementById('google-signin');
        this.guestSigninBtn = document.getElementById('guest-signin');
    }

    setupEventListeners() {
        // Form submission
        this.authForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Toggle between login/register
        this.toggleFormBtn.addEventListener('click', () => this.toggleMode());
        
        // Password visibility toggle
        this.togglePasswordBtn.addEventListener('click', () => this.togglePasswordVisibility());
        
        // Social login
        this.googleSigninBtn.addEventListener('click', () => this.signInWithGoogle());
        this.guestSigninBtn.addEventListener('click', () => this.signInAsGuest());
        
        // Real-time input validation
        this.emailInput.addEventListener('input', () => this.clearFieldError('email'));
        this.passwordInput.addEventListener('input', () => this.clearFieldError('password'));
        this.confirmPasswordInput.addEventListener('input', () => this.clearFieldError('confirmPassword'));
        this.displayNameInput.addEventListener('input', () => this.clearFieldError('displayName'));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'l') {
                e.preventDefault();
                this.toggleMode();
            }
            if (e.key === 'Escape') {
                this.hideMessages();
            }
        });
    }

    setupAuthStateListener() {
        onAuthStateChanged(this.auth, async (user) => {
            if (user) {
                this.currentUser = user;
                console.log('🎮 User signed in:', user.displayName || user.email);
                
                // Create or update user profile in Firestore
                await this.createOrUpdateUserProfile(user);
                
                // Show success and redirect
                this.showSuccessMessage(`Welcome back, ${user.displayName || 'Gamer'}! 🎮`);
                setTimeout(() => {
                    this.redirectToHome();
                }, 2000);
            } else {
                this.currentUser = null;
                console.log('👋 User signed out');
            }
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const email = this.emailInput.value.trim();
        const password = this.passwordInput.value;
        const confirmPassword = this.confirmPasswordInput.value;
        const displayName = this.displayNameInput.value.trim();
        
        // Clear previous messages
        this.hideMessages();
        
        // Validate inputs
        if (!this.validateInputs(email, password, confirmPassword, displayName)) {
            return;
        }
        
        this.setLoadingState(true);
        
        try {
            if (this.isLoginMode) {
                await this.signInWithEmail(email, password);
            } else {
                await this.registerWithEmail(email, password, displayName);
            }
        } catch (error) {
            console.error('Auth error:', error);
            this.showErrorMessage(this.getErrorMessage(error.code));
            this.setLoadingState(false);
        }
    }

    async signInWithEmail(email, password) {
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        console.log('✅ Email sign-in successful');
        return userCredential.user;
    }

    async registerWithEmail(email, password, displayName) {
        const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
        const user = userCredential.user;
        
        // Update user profile with display name
        if (displayName) {
            await updateProfile(user, { displayName });
        }
        
        console.log('✅ Email registration successful');
        return user;
    }

    async signInWithGoogle() {
        this.setLoadingState(true);
        
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(this.auth, provider);
            console.log('✅ Google sign-in successful');
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.showErrorMessage(this.getErrorMessage(error.code));
            this.setLoadingState(false);
        }
    }

    async signInAsGuest() {
        this.setLoadingState(true);
        
        try {
            const result = await signInAnonymously(this.auth);
            console.log('✅ Anonymous sign-in successful');
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
            this.showErrorMessage(this.getErrorMessage(error.code));
            this.setLoadingState(false);
        }
    }

    async createOrUpdateUserProfile(user) {
        try {
            const userRef = doc(this.db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                // Create new user profile
                await setDoc(userRef, {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'Anonymous Gamer',
                    photoURL: user.photoURL || null,
                    createdAt: serverTimestamp(),
                    lastSignIn: serverTimestamp(),
                    gamesPlayed: 0,
                    totalScore: 0,
                    highScores: {},
                    achievements: [],
                    preferences: {
                        theme: 'neon',
                        soundEnabled: true,
                        notifications: true
                    }
                });
                console.log('📝 New user profile created');
            } else {
                // Update existing user profile
                await updateDoc(userRef, {
                    lastSignIn: serverTimestamp(),
                    email: user.email,
                    displayName: user.displayName || userDoc.data().displayName,
                    photoURL: user.photoURL || userDoc.data().photoURL
                });
                console.log('🔄 User profile updated');
            }
        } catch (error) {
            console.error('Error managing user profile:', error);
        }
    }

    validateInputs(email, password, confirmPassword, displayName) {
        let isValid = true;
        
        // Email validation
        if (!email) {
            this.showFieldError('email', 'Email is required');
            isValid = false;
        } else if (!this.isValidEmail(email)) {
            this.showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        // Password validation
        if (!password) {
            this.showFieldError('password', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showFieldError('password', 'Password must be at least 6 characters');
            isValid = false;
        }
        
        // Registration-specific validation
        if (!this.isLoginMode) {
            if (!displayName) {
                this.showFieldError('displayName', 'Display name is required');
                isValid = false;
            } else if (displayName.length < 2) {
                this.showFieldError('displayName', 'Display name must be at least 2 characters');
                isValid = false;
            }
            
            if (password !== confirmPassword) {
                this.showFieldError('confirmPassword', 'Passwords do not match');
                isValid = false;
            }
        }
        
        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    toggleMode() {
        this.isLoginMode = !this.isLoginMode;
        this.hideMessages();
        this.clearAllFieldErrors();
        
        if (this.isLoginMode) {
            // Switch to login mode
            this.formTitle.textContent = 'Welcome Back!';
            this.formSubtitle.textContent = 'Sign in to your account';
            this.registerFields.classList.add('hidden');
            this.submitText.textContent = 'Sign In';
            this.submitIcon.textContent = '🚀';
            this.toggleText.textContent = "Don't have an account?";
            this.toggleFormBtn.textContent = 'Create one';
            this.submitBtn.className = this.submitBtn.className.replace('from-neon-pink', 'from-neon-blue');
        } else {
            // Switch to register mode
            this.formTitle.textContent = 'Join GameHub!';
            this.formSubtitle.textContent = 'Create your gaming account';
            this.registerFields.classList.remove('hidden');
            this.submitText.textContent = 'Create Account';
            this.submitIcon.textContent = '✨';
            this.toggleText.textContent = 'Already have an account?';
            this.toggleFormBtn.textContent = 'Sign in';
            this.submitBtn.className = this.submitBtn.className.replace('from-neon-blue', 'from-neon-pink');
        }
        
        // Clear form
        this.authForm.reset();
    }

    togglePasswordVisibility() {
        const type = this.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        this.passwordInput.setAttribute('type', type);
        this.togglePasswordBtn.textContent = type === 'password' ? '🔒' : '👁️';
    }

    setLoadingState(isLoading) {
        this.submitBtn.disabled = isLoading;
        if (isLoading) {
            this.submitBtn.classList.add('opacity-75', 'cursor-not-allowed');
            this.submitIcon.textContent = '⏳';
            this.submitText.textContent = this.isLoginMode ? 'Signing In...' : 'Creating Account...';
            this.googleSigninBtn.disabled = true;
            this.guestSigninBtn.disabled = true;
        } else {
            this.submitBtn.classList.remove('opacity-75', 'cursor-not-allowed');
            this.submitIcon.textContent = this.isLoginMode ? '🚀' : '✨';
            this.submitText.textContent = this.isLoginMode ? 'Sign In' : 'Create Account';
            this.googleSigninBtn.disabled = false;
            this.guestSigninBtn.disabled = false;
        }
    }

    showLoadingState(show) {
        if (show) {
            this.loadingSpinner.classList.remove('hidden');
            this.authForm.classList.add('hidden');
        } else {
            this.loadingSpinner.classList.add('hidden');
            this.authForm.classList.remove('hidden');
        }
    }

    showErrorMessage(message) {
        this.successMessage.classList.add('hidden');
        this.errorText.textContent = message;
        this.errorMessage.classList.remove('hidden');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.errorMessage.classList.add('hidden');
        }, 5000);
    }

    showSuccessMessage(message) {
        this.errorMessage.classList.add('hidden');
        this.successText.textContent = message;
        this.successMessage.classList.remove('hidden');
    }

    hideMessages() {
        this.errorMessage.classList.add('hidden');
        this.successMessage.classList.add('hidden');
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement && inputElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            inputElement.classList.add('border-red-400', 'animate-shake');
            
            // Remove shake animation after completion
            setTimeout(() => {
                inputElement.classList.remove('animate-shake');
            }, 500);
        }
    }

    clearFieldError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        const inputElement = document.getElementById(fieldName);
        
        if (errorElement && inputElement) {
            errorElement.classList.add('hidden');
            inputElement.classList.remove('border-red-400');
        }
    }

    clearAllFieldErrors() {
        const errorElements = document.querySelectorAll('[id$="-error"]');
        errorElements.forEach(element => {
            element.classList.add('hidden');
        });
        
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.classList.remove('border-red-400', 'animate-shake');
        });
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
            'auth/cancelled-popup-request': 'Sign-in was cancelled.',
            'auth/popup-blocked': 'Popup blocked by browser. Please enable popups.',
            'default': 'An error occurred. Please try again.'
        };
        
        return errorMessages[errorCode] || errorMessages.default;
    }

    redirectToHome() {
        // Add transition effect
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease-out';
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
    }

    // Static methods for external use
    static async getCurrentUser() {
        return new Promise((resolve) => {
            onAuthStateChanged(window.auth, (user) => {
                resolve(user);
            });
        });
    }

    static async signOut() {
        try {
            await signOut(window.auth);
            console.log('👋 User signed out successfully');
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            return false;
        }
    }

    static async updateUserGameStats(gameType, score) {
        const user = window.auth.currentUser;
        if (!user) return;

        try {
            const userRef = doc(window.db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const currentHighScores = userDoc.data().highScores || {};
                const currentBestScore = currentHighScores[gameType] || 0;
                
                const updateData = {
                    gamesPlayed: increment(1),
                    totalScore: increment(score),
                    lastPlayed: serverTimestamp()
                };
                
                // Update high score if this is better
                if (score > currentBestScore) {
                    updateData[`highScores.${gameType}`] = score;
                }
                
                await updateDoc(userRef, updateData);
                console.log(`🏆 Game stats updated for ${gameType}: ${score}`);
            }
        } catch (error) {
            console.error('Error updating game stats:', error);
        }
    }
}

// Initialize auth when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be initialized
    setTimeout(() => {
        if (window.auth && window.db) {
            new GameHubAuth();
        } else {
            console.error('🚨 Firebase not properly initialized');
        }
    }, 100);
});

// Export for use in other modules
window.GameHubAuth = GameHubAuth;
