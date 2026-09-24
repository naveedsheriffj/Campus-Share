// ============================================
// PROFILE MANAGEMENT MODULE (FIREBASE)
// ============================================

// Load user profile into form
async function loadProfile() {
    const user = await checkAuth();
    if (!user) return;
    
    const profile = await getUserProfile(user.uid);
    if (!profile) return;
    
    const nameEl = document.getElementById('profileName');
    const emailEl = document.getElementById('profileEmail');
    const studentIdEl = document.getElementById('profileStudentId');
    const departmentEl = document.getElementById('profileDepartment');
    const yearEl = document.getElementById('profileYear');
    
    if (nameEl) nameEl.value = profile.name || user.displayName || '';
    if (emailEl) emailEl.value = profile.email || user.email || '';
    if (studentIdEl) studentIdEl.value = profile.student_id || '';
    if (departmentEl) departmentEl.value = profile.department || '';
    if (yearEl) yearEl.value = profile.year || 1;
}

// Handle profile form submission
async function handleProfileSubmit(event) {
    event.preventDefault();
    
    const user = await checkAuth();
    if (!user) {
        alert('You must be logged in to update your profile.');
        return;
    }
    
    const profileData = {
        name: document.getElementById('profileName').value.trim(),
        studentId: document.getElementById('profileStudentId').value.trim(),
        department: document.getElementById('profileDepartment').value,
        year: parseInt(document.getElementById('profileYear').value, 10) || 1
    };
    
    const errorDiv = document.getElementById('profileError');
    const successDiv = document.getElementById('profileSuccess');
    
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.className = 'error-message';
    }
    if (successDiv) {
        successDiv.textContent = '';
        successDiv.className = 'success-message';
    }
    
    try {
        const result = await updateUserProfile(user.uid, profileData);
        
        if (result.success) {
            if (successDiv) {
                successDiv.textContent = 'Profile updated successfully!';
                setTimeout(() => {
                    successDiv.textContent = '';
                }, 3000);
            }
        } else {
            if (errorDiv) errorDiv.textContent = result.error?.message || 'Failed to update profile.';
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        if (errorDiv) errorDiv.textContent = 'Failed to update profile. Please try again.';
    }
}

// Initialize profile page
async function initProfile() {
    await loadProfile();
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Load user's listings
    if (typeof initProfileListings === 'function') {
        await initProfileListings();
    }
}

// Initialize on page load
function initProfileModule() {
    if (document.getElementById('profileForm')) {
        initProfile();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileModule);
} else {
    initProfileModule();
}
