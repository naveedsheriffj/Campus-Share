// ============================================
// PROFILE MANAGEMENT MODULE
// ============================================

// Load user profile into form
async function loadProfile() {
    const user = await checkAuth();
    if (!user) return;
    
    const profile = await getUserProfile(user.id);
    if (!profile) return;
    
    // Populate form
    document.getElementById('profileName').value = profile.name;
    document.getElementById('profileEmail').value = profile.email;
    document.getElementById('profileStudentId').value = profile.student_id;
    document.getElementById('profileDepartment').value = profile.department;
    document.getElementById('profileYear').value = profile.year;
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
        name: document.getElementById('profileName').value,
        studentId: document.getElementById('profileStudentId').value,
        department: document.getElementById('profileDepartment').value,
        year: document.getElementById('profileYear').value
    };
    
    const errorDiv = document.getElementById('profileError');
    const successDiv = document.getElementById('profileSuccess');
    
    errorDiv.textContent = '';
    errorDiv.className = 'error-message';
    successDiv.textContent = '';
    successDiv.className = 'success-message';
    
    try {
        const result = await updateUserProfile(user.id, profileData);
        
        if (result.success) {
            successDiv.textContent = 'Profile updated successfully!';
            setTimeout(() => {
                successDiv.textContent = '';
            }, 3000);
        } else {
            errorDiv.textContent = result.error?.message || 'Failed to update profile.';
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        errorDiv.textContent = 'Failed to update profile. Please try again.';
    }
}

// Initialize profile page
async function initProfile() {
    await loadProfile();
    
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Load user's listings (handled by listing.js)
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
