// ============================================
// FIREBASE CONFIGURATION & INITIALIZATION
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyCmvDw6-dTiOzk-XKwrQ5CnGYtiTtweNYg",
    authDomain: "foai-53b5b.firebaseapp.com",
    projectId: "foai-53b5b",
    storageBucket: "foai-53b5b.firebasestorage.app",
    messagingSenderId: "879973347230",
    appId: "1:879973347230:web:43f2756913e7c3bc72f08f"
};

// College email domain configuration
const COLLEGE_EMAIL_DOMAIN = 'rajalakshmi.edu.in'; // Change this to your college domain

// Global references
window.firebaseApp = null;
window.firebaseAuth = null;
window.firebaseDb = null;
window.firebaseStorage = null;
window.COLLEGE_EMAIL_DOMAIN = COLLEGE_EMAIL_DOMAIN;

function initFirebase() {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            window.firebaseApp = firebase.initializeApp(firebaseConfig);
        } else {
            window.firebaseApp = firebase.app();
        }
        window.firebaseAuth = firebase.auth();
        window.firebaseDb = firebase.firestore();
        window.firebaseStorage = firebase.storage();
        console.log('Firebase initialized successfully for project:', firebaseConfig.projectId);
    } else {
        console.error('Firebase SDK not loaded. Please verify the CDN script tags.');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
} else {
    initFirebase();
}
