// ============================================
// MARKETPLACE MODULE
// ============================================

// Condition ranking for comparison
const CONDITION_RANKING = {
    'New': 5,
    'Like New': 4,
    'Good': 3,
    'Fair': 2,
    'Poor': 1
};

// Get condition rank
function getConditionRank(condition) {
    return CONDITION_RANKING[condition] || 0;
}

// Fetch all resources
async function fetchResources(filters = {}) {
    let query = window.supabaseClient
        .from('resources')
        .select(`
            *,
            profiles:seller_id (name)
        `)
        .eq('availability', 'Available');
    
    // Apply filters
    if (filters.category) {
        query = query.eq('category', filters.category);
    }
    if (filters.type) {
        query = query.eq('listing_type', filters.type);
    }
    if (filters.condition) {
        query = query.eq('condition', filters.condition);
    }
    if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    if (error) {
        console.error('Error fetching resources:', error);
        return [];
    }
    
    return data;
}

// Fetch single resource by ID
async function fetchResourceById(resourceId) {
    const { data, error } = await window.supabaseClient
        .from('resources')
        .select(`
            *,
            profiles:seller_id (name, email, department)
        `)
        .eq('id', resourceId)
        .single();
    
    if (error) {
        console.error('Error fetching resource:', error);
        return null;
    }
    
    return data;
}

// Render resource card
function renderResourceCard(resource) {
    const imageUrl = resource.image_url || 'https://via.placeholder.com/280x200?text=No+Image';
    const priceDisplay = resource.listing_type === 'Donate' ? 'Free' : `₹${resource.price}`;
    
    return `
        <div class="resource-card" onclick="viewResource('${resource.id}')">
            <img src="${imageUrl}" alt="${resource.title}" class="resource-image" onerror="this.src='https://via.placeholder.com/280x200?text=No+Image'">
            <div class="resource-content">
                <h3 class="resource-title">${resource.title}</h3>
                <p class="resource-category">${resource.category}</p>
                <p class="resource-price">${priceDisplay}</p>
                <div class="resource-meta">
                    <span class="resource-badge">${resource.listing_type}</span>
                    <span class="resource-badge">${resource.condition}</span>
                </div>
                <p class="resource-seller">Seller: ${resource.profiles?.name || 'Unknown'}</p>
            </div>
        </div>
    `;
}

// Render resource grid
function renderResourceGrid(resources) {
    const grid = document.getElementById('resourceGrid');
    if (!grid) return;
    
    if (resources.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>No Resources Found</h3>
                <p>Try adjusting your filters or search terms.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = resources.map(renderResourceCard).join('');
}

// View resource details
function viewResource(resourceId) {
    window.location.href = `resource-details.html?id=${resourceId}`;
}

// Render resource details
function renderResourceDetails(resource) {
    const container = document.getElementById('resourceDetails');
    if (!container) return;
    
    const imageUrl = resource.image_url || 'https://via.placeholder.com/400x400?text=No+Image';
    const priceDisplay = resource.listing_type === 'Donate' ? 'Free' : `₹${resource.price}`;
    const currentUser = window.supabaseClient.auth.getUser();
    
    const isOwner = resource.seller_id === (currentUser?.data?.user?.id);
    
    container.innerHTML = `
        <div class="resource-details">
            <div class="details-content">
                <div>
                    <img src="${imageUrl}" alt="${resource.title}" class="details-image" onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
                </div>
                <div class="details-info">
                    <h2>${resource.title}</h2>
                    <p class="details-price">${priceDisplay}</p>
                    <p class="details-description">${resource.description}</p>
                    
                    <div class="details-meta">
                        <div class="meta-item">
                            <span class="meta-label">Category</span>
                            <span class="meta-value">${resource.category}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Subject</span>
                            <span class="meta-value">${resource.subject || 'N/A'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Type</span>
                            <span class="meta-value">${resource.listing_type}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Condition</span>
                            <span class="meta-value">${resource.condition}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Seller</span>
                            <span class="meta-value">${resource.profiles?.name || 'Unknown'}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Pickup Location</span>
                            <span class="meta-value">${resource.pickup_location}</span>
                        </div>
                    </div>
                    
                    <div class="details-actions">
                        ${isOwner ? `
                            <button onclick="editResource('${resource.id}')" class="btn btn-primary">Edit Listing</button>
                            <button onclick="deleteResource('${resource.id}')" class="btn btn-outline" style="border-color: #ef4444; color: #ef4444;">Delete Listing</button>
                        ` : `
                            <button onclick="openRequestModal('${resource.id}', '${resource.listing_type}')" class="btn btn-primary">${getRequestButtonText(resource.listing_type)}</button>
                        `}
                        <a href="marketplace.html" class="btn btn-outline">Back to Marketplace</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Get request button text based on listing type
function getRequestButtonText(listingType) {
    const buttonLabels = {
        'Sell': 'Request to Buy',
        'Rent': 'Request to Rent',
        'Exchange': 'Request to Exchange',
        'Donate': 'Request to Donate'
    };
    return buttonLabels[listingType] || 'Request';
}

// Open request modal
function openRequestModal(resourceId, listingType) {
    const modal = document.getElementById('requestModal');
    const modalTitle = document.getElementById('modalTitle');
    const requestForm = document.getElementById('requestForm');
    
    if (!modal || !modalTitle || !requestForm) return;
    
    // Set modal title based on listing type
    const titles = {
        'Sell': 'Request to Buy',
        'Rent': 'Request to Rent',
        'Exchange': 'Request to Exchange',
        'Donate': 'Request to Donate'
    };
    modalTitle.textContent = titles[listingType] || 'Send Request';
    
    // Store resource ID on the form
    requestForm.dataset.resourceId = resourceId;
    
    // Show modal
    modal.style.display = 'flex';
    
    // Setup form submission
    requestForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const message = document.getElementById('requestMessage').value.trim();
        const pickupLocation = document.getElementById('requestPickup').value.trim();
        
        if (!message || !pickupLocation) {
            showNotification('Please fill in all fields', 'error');
            return;
        }
        
        const result = await createPurchaseRequest(resourceId, message, pickupLocation);
        
        if (result) {
            closeRequestModal();
            // Clear form
            document.getElementById('requestMessage').value = '';
            document.getElementById('requestPickup').value = '';
        }
    };
}

// Close request modal
function closeRequestModal() {
    const modal = document.getElementById('requestModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('requestModal');
    if (event.target === modal) {
        closeRequestModal();
    }
}

// Edit resource
function editResource(resourceId) {
    window.location.href = `create-listing.html?id=${resourceId}`;
}

// Delete resource
async function deleteResource(resourceId) {
    if (!confirm('Are you sure you want to delete this listing?')) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('resources')
            .delete()
            .eq('id', resourceId);
        
        if (error) throw error;
        
        alert('Listing deleted successfully!');
        window.location.href = 'marketplace.html';
    } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Failed to delete listing. Please try again.');
    }
}

// Initialize marketplace
async function initMarketplace() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const conditionFilter = document.getElementById('conditionFilter');
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Load initial resources
    const resources = await fetchResources();
    renderResourceGrid(resources);
    
    // Search handler
    const handleSearch = async () => {
        const filters = {
            search: searchInput?.value || '',
            category: categoryFilter?.value || '',
            type: typeFilter?.value || '',
            condition: conditionFilter?.value || ''
        };
        
        const filteredResources = await fetchResources(filters);
        renderResourceGrid(filteredResources);
    };
    
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    
    if (filterBtn) {
        filterBtn.addEventListener('click', handleSearch);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (typeFilter) typeFilter.value = '';
            if (conditionFilter) conditionFilter.value = '';
            
            const resources = await fetchResources();
            renderResourceGrid(resources);
        });
    }
}

// Initialize resource details page
async function initResourceDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const resourceId = urlParams.get('id');
    
    if (resourceId) {
        const resource = await fetchResourceById(resourceId);
        if (resource) {
            renderResourceDetails(resource);
        } else {
            document.getElementById('resourceDetails').innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">❌</div>
                    <h3>Resource Not Found</h3>
                    <p>The resource you're looking for doesn't exist.</p>
                    <a href="marketplace.html" class="btn btn-primary">Back to Marketplace</a>
                </div>
            `;
        }
    }
}

// Initialize dashboard
async function initDashboard() {
    const user = await checkAuth();
    if (!user) return;
    
    // Update welcome message
    const profile = await getUserProfile(user.id);
    if (profile) {
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome, ${profile.name}!`;
        }
    }
    
    // Load stats
    const allResources = await fetchResources();
    const myListings = allResources.filter(r => r.seller_id === user.id);
    
    const totalResourcesEl = document.getElementById('totalResources');
    const myListingsEl = document.getElementById('myListings');
    const myPlansEl = document.getElementById('myPlans');
    
    if (totalResourcesEl) totalResourcesEl.textContent = allResources.length;
    if (myListingsEl) myListingsEl.textContent = myListings.length;
    
    // Load plans count
    const { data: plans, error: plansError } = await window.supabaseClient
        .from('planner_history')
        .select('id')
        .eq('user_id', user.id);
    
    if (!plansError && myPlansEl) {
        myPlansEl.textContent = plans.length;
    }
    
    // Load recent resources
    const recentResourcesEl = document.getElementById('recentResources');
    if (recentResourcesEl) {
        const recentResources = allResources.slice(0, 4);
        if (recentResources.length > 0) {
            recentResourcesEl.innerHTML = recentResources.map(renderResourceCard).join('');
        } else {
            recentResourcesEl.innerHTML = '<p class="loading-text">No resources available yet.</p>';
        }
    }
}

// Initialize on page load
function initMarketplaceModule() {
    if (document.getElementById('resourceGrid') || document.getElementById('marketplace-controls')) {
        initMarketplace();
    }
    
    if (document.getElementById('resourceDetails')) {
        initResourceDetails();
    }
    
    if (document.getElementById('welcomeMessage')) {
        initDashboard();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarketplaceModule);
} else {
    initMarketplaceModule();
}
