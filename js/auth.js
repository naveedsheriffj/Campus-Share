// ============================================
// AUTHENTICATION MODULE
// ============================================

// Show notification toast
function showNotification(message, type = 'info') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Check if user is authenticated
async function checkAuth() {
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized');
        return null;
    }
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    return user;
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
    const emailRegex = new RegExp(`^[a-zA-Z0-9._%+-]+@${domain.replace('.', '\\.')}$`);
    return emailRegex.test(email);
}

// Get user profile
async function getUserProfile(userId) {
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized');
        return null;
    }
    const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    
    return data;
}

// Create user profile
async function createUserProfile(userId, profileData) {
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized');
        return { success: false, error: 'Supabase client not initialized' };
    }
    const { data, error } = await window.supabaseClient
        .from('profiles')
        .insert([{
            id: userId,
            name: profileData.name,
            email: profileData.email,
            student_id: profileData.studentId,
            department: profileData.department,
            year: profileData.year
        }]);
    
    if (error) {
        console.error('Error creating profile:', error);
        return { success: false, error };
    }
    
    return { success: true, data };
}

// Update user profile
async function updateUserProfile(userId, profileData) {
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized');
        return { success: false, error: 'Supabase client not initialized' };
    }
    const { data, error } = await window.supabaseClient
        .from('profiles')
        .update({
            name: profileData.name,
            student_id: profileData.studentId,
            department: profileData.department,
            year: profileData.year
        })
        .eq('id', userId);
    
    if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error };
    }
    
    return { success: true, data };
}

// Login handler
async function handleLogin(event) {
    event.preventDefault();
    
    if (!window.supabaseClient) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = 'Supabase client not initialized. Please refresh the page.';
        return;
    }
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.textContent = '';
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        errorDiv.textContent = error.message || 'Login failed. Please try again.';
    }
}

// Register handler
async function handleRegister(event) {
    event.preventDefault();
    
    if (!window.supabaseClient) {
        const errorDiv = document.getElementById('registerError');
        errorDiv.textContent = 'Supabase client not initialized. Please refresh the page.';
        return;
    }
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const studentId = document.getElementById('studentId').value;
    const department = document.getElementById('department').value;
    const year = document.getElementById('year').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorDiv = document.getElementById('registerError');
    
    errorDiv.textContent = '';
    
    // Validate email domain
    if (!validateCollegeEmail(email)) {
        errorDiv.textContent = `Please use a valid ${window.COLLEGE_EMAIL_DOMAIN || 'rajalakshmi.edu.in'} email address.`;
        return;
    }
    
    // Validate password match
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match.';
        return;
    }
    
    try {
        // Create auth user
        const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/dashboard.html'
            }
        });
        
        if (authError) throw authError;
        
        // Create profile
        if (authData.user) {
            const profileResult = await createUserProfile(authData.user.id, {
                name,
                email,
                studentId,
                department,
                year
            });
            
            if (!profileResult.success) {
                throw profileResult.error;
            }
        }
        
        // Show success message
        errorDiv.className = 'success-message';
        errorDiv.textContent = 'Registration successful! Please check your email to verify your account.';
        
        // Clear form
        document.getElementById('registerForm').reset();
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        errorDiv.className = 'error-message';
        errorDiv.textContent = error.message || 'Registration failed. Please try again.';
    }
}

// Logout handler
async function handleLogout() {
    if (!window.supabaseClient) {
        console.error('Supabase client not initialized');
        window.location.href = 'index.html';
        return;
    }
    try {
        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

// Google Login handler
async function handleGoogleLogin() {
    if (!window.supabaseClient) {
        alert('Supabase client not initialized. Please refresh the page.');
        return;
    }
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/dashboard.html'
            }
        });
        
        if (error) throw error;
        
        // The user will be redirected to Google for authentication
    } catch (error) {
        console.error('Google login error:', error);
        alert('Google login failed. Please try again.');
    }
}

// Google Register handler (same as login for OAuth)
async function handleGoogleRegister() {
    if (!window.supabaseClient) {
        alert('Supabase client not initialized. Please refresh the page.');
        return;
    }
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/complete-profile.html'
            }
        });
        
        if (error) throw error;
        
        // The user will be redirected to Google for authentication
    } catch (error) {
        console.error('Google registration error:', error);
        alert('Google registration failed. Please try again.');
    }
}

// Initialize auth on page load
function initAuth() {
    // Wait for Supabase to be initialized
    if (!window.supabaseClient) {
        console.log('Waiting for Supabase client to initialize...');
        setTimeout(initAuth, 100);
        return;
    }
    
    console.log('Initializing auth module...');
    
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
    
    if (protectedPages.includes(window.location.pathname.split('/').pop())) {
        requireAuth();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}
