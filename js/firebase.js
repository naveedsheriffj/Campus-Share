// ============================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyCmvDw6-dTiOzk-XKwrQ5CnGYtiTtweNYg",
    authDomain: "foai-53b5b.firebaseapp.com",
    projectId: "foai-53b5b",
    messagingSenderId: "879973347230",
    appId: "1:879973347230:web:43f2756913e7c3bc72f08f"
};

// College email domain configuration
const COLLEGE_EMAIL_DOMAIN = 'rajalakshmi.edu.in'; // Change this to your college domain

// Global references
window.firebaseApp = null;
window.firebaseAuth = null;
window.firebaseDb = null;
window.COLLEGE_EMAIL_DOMAIN = COLLEGE_EMAIL_DOMAIN;

// Global XSS sanitization helper
window.escapeHtml = function(text) {
    if (typeof text !== 'string') return text || '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

window.firebaseConfig = firebaseConfig;
window.getFirebaseConfig = function() { return firebaseConfig; };

function initFirebase() {
    if (window.firebaseDb) return; // Already initialized
    if (typeof firebase !== 'undefined') {
        try {
            if (!firebase.apps.length) {
                window.firebaseApp = firebase.initializeApp(firebaseConfig);
            } else {
                window.firebaseApp = firebase.app();
            }
            window.firebaseAuth = firebase.auth();
            window.firebaseDb = firebase.firestore();
            console.log('Firebase initialized successfully for project:', firebaseConfig.projectId);
        } catch (err) {
            console.error('Error initializing Firebase:', err);
        }
    } else {
        console.warn('Firebase SDK not yet loaded. Waiting for script tags.');
    }
}

// Initialize immediately if Firebase SDK is present in window
if (typeof firebase !== 'undefined') {
    initFirebase();
}

// Initialize when DOM is ready as fallback
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}

