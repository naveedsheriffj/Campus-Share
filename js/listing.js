// ============================================
// LISTING CRUD MODULE
// ============================================

// Upload image to Supabase Storage
async function uploadImage(file, userId) {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await window.supabaseClient
        .storage
        .from('resource-images')
        .upload(fileName, file);
    
    if (error) {
        console.error('Error uploading image:', error);
        return null;
    }
    
    // Get public URL
    const { data: { publicUrl } } = window.supabaseClient
        .storage
        .from('resource-images')
        .getPublicUrl(fileName);
    
    return publicUrl;
}

// Create new listing
async function createListing(listingData, imageFile) {
    const user = await checkAuth();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    // Upload image if provided
    let imageUrl = null;
    if (imageFile) {
        imageUrl = await uploadImage(imageFile, user.id);
    }
    
    const { data, error } = await window.supabaseClient
        .from('resources')
        .insert([{
            seller_id: user.id,
            title: listingData.title,
            description: listingData.description,
            category: listingData.category,
            subject: listingData.subject,
            listing_type: listingData.listingType,
            price: listingData.price,
            condition: listingData.condition,
            availability: listingData.availability,
            pickup_location: listingData.pickupLocation,
            image_url: imageUrl
        }]);
    
    if (error) {
        console.error('Error creating listing:', error);
        throw error;
    }
    
    return { success: true, data };
}

// Update existing listing
async function updateListing(resourceId, listingData, imageFile) {
    const user = await checkAuth();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    // Check ownership
    const { data: existingResource, error: fetchError } = await window.supabaseClient
        .from('resources')
        .select('seller_id, image_url')
        .eq('id', resourceId)
        .single();
    
    if (fetchError || !existingResource) {
        throw new Error('Resource not found');
    }
    
    if (existingResource.seller_id !== user.id) {
        throw new Error('You can only edit your own listings');
    }
    
    // Upload new image if provided
    let imageUrl = existingResource.image_url;
    if (imageFile) {
        imageUrl = await uploadImage(imageFile, user.id);
    }
    
    const { data, error } = await window.supabaseClient
        .from('resources')
        .update({
            title: listingData.title,
            description: listingData.description,
            category: listingData.category,
            subject: listingData.subject,
            listing_type: listingData.listingType,
            price: listingData.price,
            condition: listingData.condition,
            availability: listingData.availability,
            pickup_location: listingData.pickupLocation,
            image_url: imageUrl,
            updated_at: new Date().toISOString()
        })
        .eq('id', resourceId);
    
    if (error) {
        console.error('Error updating listing:', error);
        throw error;
    }
    
    return { success: true, data };
}

// Fetch listing for editing
async function fetchListingForEdit(resourceId) {
    const user = await checkAuth();
    if (!user) {
        throw new Error('User not authenticated');
    }
    
    const { data, error } = await window.supabaseClient
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single();
    
    if (error) {
        console.error('Error fetching listing:', error);
        throw error;
    }
    
    // Check ownership
    if (data.seller_id !== user.id) {
        throw new Error('You can only edit your own listings');
    }
    
    return data;
}

// Populate form with listing data
function populateForm(listingData) {
    document.getElementById('listingId').value = listingData.id;
    document.getElementById('title').value = listingData.title;
    document.getElementById('description').value = listingData.description;
    document.getElementById('category').value = listingData.category;
    document.getElementById('subject').value = listingData.subject || '';
    document.getElementById('listingType').value = listingData.listing_type;
    document.getElementById('price').value = listingData.price;
    document.getElementById('condition').value = listingData.condition;
    document.getElementById('availability').value = listingData.availability;
    document.getElementById('pickupLocation').value = listingData.pickup_location;
    
    // Update form title and button
    document.getElementById('formTitle').textContent = 'Edit Listing';
    document.getElementById('submitBtn').textContent = 'Update Listing';
}

// Handle listing form submission
async function handleListingSubmit(event) {
    event.preventDefault();
    
    const listingId = document.getElementById('listingId').value;
    const imageInput = document.getElementById('image');
    const imageFile = imageInput.files[0];
    const errorDiv = document.getElementById('listingError');
    
    errorDiv.textContent = '';
    errorDiv.className = 'error-message';
    
    const listingData = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        subject: document.getElementById('subject').value,
        listingType: document.getElementById('listingType').value,
        price: parseFloat(document.getElementById('price').value),
        condition: document.getElementById('condition').value,
        availability: document.getElementById('availability').value,
        pickupLocation: document.getElementById('pickupLocation').value
    };
    
    try {
        if (listingId) {
            // Update existing listing
            const result = await updateListing(listingId, listingData, imageFile);
            if (result.success) {
                alert('Listing updated successfully!');
                window.location.href = 'marketplace.html';
            }
        } else {
            // Create new listing
            const result = await createListing(listingData, imageFile);
            if (result.success) {
                alert('Listing created successfully!');
                window.location.href = 'marketplace.html';
            }
        }
    } catch (error) {
        errorDiv.textContent = error.message || 'Failed to save listing. Please try again.';
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
    
    // If editing, load existing data
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
        const { data: listings, error } = await window.supabaseClient
            .from('resources')
            .select('*')
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (listings.length === 0) {
            myListingsEl.style.display = 'none';
            if (noListingsEl) noListingsEl.style.display = 'block';
        } else {
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
