// ============================================
// LISTING CRUD MODULE (FIREBASE)
// ============================================

// Upload image to Firebase Cloud Storage
async function uploadImage(file, userId) {
    if (!file) return null;
    
    if (!window.firebaseStorage) {
        console.error('Firebase Storage not initialized');
        return null;
    }
    
    try {
        const fileExt = file.name.split('.').pop();
        const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const storageRef = window.firebaseStorage.ref().child(`resource-images/${userId}/${safeName}`);
        
        const snapshot = await storageRef.put(file);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        return downloadUrl;
    } catch (error) {
        console.error('Error uploading image to Firebase Storage:', error);
        // Fallback: If Firebase Storage is not yet enabled on the project, alert or return null
        return null;
    }
}

// Create new listing in Firestore
async function createListing(listingData, imageFile) {
    const user = await checkAuth();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    let imageUrl = null;
    if (imageFile) {
        imageUrl = await uploadImage(imageFile, user.uid);
    }
    
    const profile = await getUserProfile(user.uid);
    
    const docData = {
        seller_id: user.uid,
        seller_name: profile?.name || user.displayName || 'Student Seller',
        seller_email: user.email || '',
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        subject: listingData.subject || '',
        listing_type: listingData.listingType,
        price: Number(listingData.price) || 0,
        condition: listingData.condition,
        availability: listingData.availability || 'Available',
        pickup_location: listingData.pickupLocation,
        image_url: imageUrl,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await window.firebaseDb.collection('resources').add(docData);
    return { success: true, id: docRef.id, data: docData };
}

// Update existing listing in Firestore
async function updateListing(resourceId, listingData, imageFile) {
    const user = await checkAuth();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    const docRef = window.firebaseDb.collection('resources').doc(resourceId);
    const existingDoc = await docRef.get();
    
    if (!existingDoc.exists) {
        throw new Error('Resource not found');
    }
    
    const existingData = existingDoc.data();
    if (existingData.seller_id !== user.uid) {
        throw new Error('You can only edit your own listings');
    }
    
    let imageUrl = existingData.image_url;
    if (imageFile) {
        const newUrl = await uploadImage(imageFile, user.uid);
        if (newUrl) imageUrl = newUrl;
    }
    
    const updateData = {
        title: listingData.title,
        description: listingData.description,
        category: listingData.category,
        subject: listingData.subject || '',
        listing_type: listingData.listingType,
        price: Number(listingData.price) || 0,
        condition: listingData.condition,
        availability: listingData.availability,
        pickup_location: listingData.pickupLocation,
        image_url: imageUrl,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await docRef.update(updateData);
    return { success: true, data: updateData };
}

// Fetch listing for editing
async function fetchListingForEdit(resourceId) {
    const user = await checkAuth();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    const doc = await window.firebaseDb.collection('resources').doc(resourceId).get();
    if (!doc.exists) {
        throw new Error('Listing not found');
    }
    
    const data = doc.data();
    if (data.seller_id !== user.uid) {
        throw new Error('You can only edit your own listings');
    }
    
    return { id: doc.id, ...data };
}

// Populate form with listing data
function populateForm(listingData) {
    document.getElementById('listingId').value = listingData.id;
    document.getElementById('title').value = listingData.title || '';
    document.getElementById('description').value = listingData.description || '';
    document.getElementById('category').value = listingData.category || '';
    document.getElementById('subject').value = listingData.subject || '';
    document.getElementById('listingType').value = listingData.listing_type || 'Sell';
    document.getElementById('price').value = listingData.price ?? 0;
    document.getElementById('condition').value = listingData.condition || 'Good';
    document.getElementById('availability').value = listingData.availability || 'Available';
    document.getElementById('pickupLocation').value = listingData.pickup_location || '';
    
    document.getElementById('formTitle').textContent = 'Edit Listing';
    document.getElementById('submitBtn').textContent = 'Update Listing';
}

// Handle listing form submission
async function handleListingSubmit(event) {
    event.preventDefault();
    
    const listingId = document.getElementById('listingId').value;
    const imageInput = document.getElementById('image');
    const imageFile = imageInput ? imageInput.files[0] : null;
    const errorDiv = document.getElementById('listingError');
    
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.className = 'error-message';
    }
    
    const listingData = {
        title: document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        category: document.getElementById('category').value,
        subject: document.getElementById('subject').value.trim(),
        listingType: document.getElementById('listingType').value,
        price: parseFloat(document.getElementById('price').value) || 0,
        condition: document.getElementById('condition').value,
        availability: document.getElementById('availability').value,
        pickupLocation: document.getElementById('pickupLocation').value.trim()
    };
    
    try {
        if (listingId) {
            const result = await updateListing(listingId, listingData, imageFile);
            if (result.success) {
                alert('Listing updated successfully!');
                window.location.href = 'marketplace.html';
            }
        } else {
            const result = await createListing(listingData, imageFile);
            if (result.success) {
                alert('Listing created successfully!');
                window.location.href = 'marketplace.html';
            }
        }
    } catch (error) {
        console.error('Listing submit error:', error);
        if (errorDiv) errorDiv.textContent = error.message || 'Failed to save listing. Please try again.';
    }
}

// Initialize listing page
async function initListingPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const resourceId = urlParams.get('id');
    
    const listingForm = document.getElementById('listingForm');
    if (listingForm) {
        listingForm.addEventListener('submit', handleListingSubmit);
    }
    
    if (resourceId) {
        try {
            const listingData = await fetchListingForEdit(resourceId);
            populateForm(listingData);
        } catch (error) {
            console.error('Error loading listing:', error);
            alert(error.message);
            window.location.href = 'marketplace.html';
        }
    }
}

// Initialize profile listings
async function initProfileListings() {
    const user = await checkAuth();
    if (!user) return;
    
    const myListingsEl = document.getElementById('myListings');
    const noListingsEl = document.getElementById('noListings');
    
    if (!myListingsEl) return;
    
    try {
        const snapshot = await window.firebaseDb.collection('resources')
            .where('seller_id', '==', user.uid)
            .get();
        
        let listings = [];
        snapshot.forEach(doc => {
            listings.push({ id: doc.id, ...doc.data() });
        });
        
        if (listings.length === 0) {
            myListingsEl.style.display = 'none';
            if (noListingsEl) noListingsEl.style.display = 'block';
        } else {
            myListingsEl.style.display = 'grid';
            myListingsEl.innerHTML = listings.map(renderResourceCard).join('');
            if (noListingsEl) noListingsEl.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading listings:', error);
        myListingsEl.innerHTML = '<p class="loading-text">Error loading listings.</p>';
    }
}

// Initialize on page load
function initListingModule() {
    if (document.getElementById('listingForm')) {
        initListingPage();
    }
    
    if (document.getElementById('myListings')) {
        initProfileListings();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initListingModule);
} else {
    initListingModule();
}
