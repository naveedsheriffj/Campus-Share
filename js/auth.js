// ============================================
// AUTHENTICATION MODULE (FIREBASE)
// ============================================

// Show notification toast
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Check if user is authenticated (resolves current user or null)
function checkAuth() {
    return new Promise((resolve) => {
        if (!window.firebaseAuth) {
            console.error('Firebase Auth not initialized yet');
            resolve(null);
            return;
        }
        const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user || null);
        }, (error) => {
            console.error('Auth state change error:', error);
            resolve(null);
        });
    });
}

// Redirect if not authenticated
async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return user;
}

// Redirect if already authenticated
async function requireGuest() {
    const user = await checkAuth();
    if (user) {
        window.location.href = 'dashboard.html';
        return false;
    }
    return true;
}

// Validate college email
function validateCollegeEmail(email) {
    const domain = window.COLLEGE_EMAIL_DOMAIN || 'rajalakshmi.edu.in';
    const emailRegex = new RegExp(`^[a-zA-Z0-9._%+-]+@${domain.replace('.', '\\.')}$`, 'i');
    return emailRegex.test(email);
}

// Get user profile from Firestore
async function getUserProfile(userId) {
    if (!window.firebaseDb) {
        console.error('Firebase Firestore not initialized');
        return null;
    }
    try {
        const doc = await window.firebaseDb.collection('profiles').doc(userId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
}

// Create user profile in Firestore
async function createUserProfile(userId, profileData) {
    if (!window.firebaseDb) {
        console.error('Firebase Firestore not initialized');
        return { success: false, error: new Error('Firestore not initialized') };
    }
    try {
        const data = {
            id: userId,
            name: profileData.name || '',
            email: profileData.email || '',
            student_id: profileData.studentId || '',
            department: profileData.department || '',
            year: parseInt(profileData.year, 10) || 1,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        await window.firebaseDb.collection('profiles').doc(userId).set(data);
        return { success: true, data };
    } catch (error) {
        console.error('Error creating profile:', error);
        return { success: false, error };
    }
}

// Update user profile in Firestore
async function updateUserProfile(userId, profileData) {
    if (!window.firebaseDb) {
        console.error('Firebase Firestore not initialized');
        return { success: false, error: new Error('Firestore not initialized') };
    }
    try {
        const updates = {
            name: profileData.name,
            student_id: profileData.studentId,
            department: profileData.department,
            year: parseInt(profileData.year, 10) || 1,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };
        await window.firebaseDb.collection('profiles').doc(userId).update(updates);
        return { success: true, data: updates };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error };
    }
}

// Login handler
async function handleLogin(event) {
    event.preventDefault();
    
    if (!window.firebaseAuth) {
        const errorDiv = document.getElementById('loginError');
        if (errorDiv) errorDiv.textContent = 'Firebase not initialized. Please refresh the page.';
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    if (errorDiv) errorDiv.textContent = '';
    
    try {
        await window.firebaseAuth.signInWithEmailAndPassword(email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        let msg = error.message;
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            msg = 'Invalid email or password.';
        }
        if (errorDiv) errorDiv.textContent = msg;
    }
}

// Register handler
async function handleRegister(event) {
    event.preventDefault();
    
    if (!window.firebaseAuth || !window.firebaseDb) {
        const errorDiv = document.getElementById('registerError');
        if (errorDiv) errorDiv.textContent = 'Firebase not initialized. Please refresh the page.';
        return;
    }
    
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const department = document.getElementById('department').value;
    const year = document.getElementById('year').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('registerError');
    
    if (errorDiv) {
        errorDiv.className = 'error-message';
        errorDiv.textContent = '';
    }
    
    // Validate email domain
    if (!validateCollegeEmail(email)) {
        if (errorDiv) errorDiv.textContent = `Please use a valid ${window.COLLEGE_EMAIL_DOMAIN || 'rajalakshmi.edu.in'} email address.`;
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        if (errorDiv) errorDiv.textContent = 'Passwords do not match.';
        return;
    }
    
    try {
        // Create auth user
        const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update displayName in auth
        await user.updateProfile({ displayName: name });
        
        // Create Firestore profile
        const profileResult = await createUserProfile(user.uid, {
            name,
            email,
            studentId,
            department,
            year
        });
        
        if (!profileResult.success) {
            throw profileResult.error;
        }

        // Send email verification
        try {
            await user.sendEmailVerification();
        } catch (e) {
            console.log('Verification email dispatch notice:', e);
        }
        
        // Show success message
        if (errorDiv) {
            errorDiv.className = 'success-message';
            errorDiv.textContent = 'Registration successful! Redirecting to your dashboard...';
        }
        
        // Clear form
        document.getElementById('registerForm').reset();
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') {
            msg = 'This email is already registered. Please login instead.';
        } else if (error.code === 'auth/weak-password') {
            msg = 'Password is too weak. Please use at least 6 characters.';
        }
        if (errorDiv) {
            errorDiv.className = 'error-message';
            errorDiv.textContent = msg;
        }
    }
}

// Logout handler
async function handleLogout() {
    if (!window.firebaseAuth) {
        window.location.href = 'index.html';
        return;
    }
    try {
        await window.firebaseAuth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

// Google Login handler
async function handleGoogleLogin() {
    if (!window.firebaseAuth) {
        alert('Firebase not initialized. Please refresh the page.');
        return;
    }
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const result = await window.firebaseAuth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if user already has a complete profile
        const profile = await getUserProfile(user.uid);
        if (!profile || !profile.student_id) {
            window.location.href = 'complete-profile.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Google login error:', error);
        if (error.code !== 'auth/popup-closed-by-user') {
            alert('Google login failed: ' + error.message);
        }
    }
}

// Google Register handler
async function handleGoogleRegister() {
    await handleGoogleLogin();
}

// Initialize auth on page load
function initAuth() {
    if (!window.firebaseAuth) {
        setTimeout(initAuth, 100);
        return;
    }
    
    console.log('Initializing auth module (Firebase)...');
    
    // Login page
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        requireGuest();
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Google Login button
    const googleLoginBtn = document.getElementById('googleLoginBtn');
    if (googleLoginBtn) {
        requireGuest();
        googleLoginBtn.addEventListener('click', handleGoogleLogin);
    }
    
    // Register page
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        requireGuest();
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Google Register button
    const googleRegisterBtn = document.getElementById('googleRegisterBtn');
    if (googleRegisterBtn) {
        requireGuest();
        googleRegisterBtn.addEventListener('click', handleGoogleRegister);
    }
    
    // Logout buttons
    const logoutBtns = document.querySelectorAll('#logoutBtn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
    
    // Protected pages
    const protectedPages = ['dashboard.html', 'marketplace.html', 'resource-details.html', 
                          'create-listing.html', 'planner.html', 'history.html', 'profile.html',
                          'seller-requests.html', 'my-requests.html', 'chat.html'];
    
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage)) {
        requireAuth();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
