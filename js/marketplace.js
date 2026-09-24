// ============================================
// MARKETPLACE MODULE (FIREBASE)
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

// Fetch all available resources from Firestore
async function fetchResources(filters = {}) {
    if (!window.firebaseDb) {
        console.error('Firestore not initialized');
        return [];
    }

    try {
        let query = window.firebaseDb.collection('resources')
            .where('availability', '==', 'Available');

        if (filters.category) {
            query = query.where('category', '==', filters.category);
        }
        if (filters.type) {
            query = query.where('listing_type', '==', filters.type);
        }
        if (filters.condition) {
            query = query.where('condition', '==', filters.condition);
        }

        const snapshot = await query.get();
        let resources = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            resources.push({
                id: doc.id,
                ...data,
                // Normalize profiles relation format for compatibility
                profiles: {
                    name: data.seller_name || 'Student Seller'
                }
            });
        });

        // Client-side sort by created_at descending (handles timestamp objects)
        resources.sort((a, b) => {
            const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : (new Date(a.created_at || 0).getTime());
            const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : (new Date(b.created_at || 0).getTime());
            return timeB - timeA;
        });

        // Search query filter (client-side substring match)
        if (filters.search && filters.search.trim()) {
            const q = filters.search.toLowerCase().trim();
            resources = resources.filter(r => {
                const title = (r.title || '').toLowerCase();
                const desc = (r.description || '').toLowerCase();
                const subject = (r.subject || '').toLowerCase();
                const category = (r.category || '').toLowerCase();
                return title.includes(q) || desc.includes(q) || subject.includes(q) || category.includes(q);
            });
        }

        return resources;
    } catch (error) {
        console.error('Error fetching resources:', error);
        return [];
    }
}

// Fetch single resource by ID from Firestore
async function fetchResourceById(resourceId) {
    if (!window.firebaseDb) return null;

    try {
        const doc = await window.firebaseDb.collection('resources').doc(resourceId).get();
        if (!doc.exists) {
            return null;
        }

        const data = doc.data();
        let sellerProfile = {
            name: data.seller_name || 'Student Seller',
            email: '',
            department: ''
        };

        if (data.seller_id) {
            const profileDoc = await window.firebaseDb.collection('profiles').doc(data.seller_id).get();
            if (profileDoc.exists) {
                const pData = profileDoc.data();
                sellerProfile = {
                    name: pData.name || data.seller_name || 'Student Seller',
                    email: pData.email || '',
                    department: pData.department || ''
                };
            }
        }

        return {
            id: doc.id,
            ...data,
            profiles: sellerProfile
        };
    } catch (error) {
        console.error('Error fetching resource by ID:', error);
        return null;
    }
}

// Render resource card
function renderResourceCard(resource) {
    const imageUrl = resource.image_url || 'https://via.placeholder.com/280x200?text=No+Image';
    const priceDisplay = resource.listing_type === 'Donate' ? 'Free' : `₹${resource.price}`;
    const sellerName = resource.profiles?.name || resource.seller_name || 'Seller';
    
    return `
        <div class="resource-card" onclick="viewResource('${resource.id}')">
            <img src="${imageUrl}" alt="${escapeHtml(resource.title || '')}" class="resource-image" onerror="this.src='https://via.placeholder.com/280x200?text=No+Image'">
            <div class="resource-content">
                <h3 class="resource-title">${escapeHtml(resource.title || '')}</h3>
                <p class="resource-category">${escapeHtml(resource.category || '')}</p>
                <p class="resource-price">${priceDisplay}</p>
                <div class="resource-meta">
                    <span class="resource-badge">${escapeHtml(resource.listing_type || '')}</span>
                    <span class="resource-badge">${escapeHtml(resource.condition || '')}</span>
                </div>
                <p class="resource-seller">Seller: ${escapeHtml(sellerName)}</p>
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
    const currentUser = window.firebaseAuth?.currentUser;
    const isOwner = currentUser && (resource.seller_id === currentUser.uid);
    const sellerName = resource.profiles?.name || resource.seller_name || 'Student Seller';
    
    container.innerHTML = `
        <div class="resource-details">
            <div class="details-content">
                <div>
                    <img src="${imageUrl}" alt="${escapeHtml(resource.title || '')}" class="details-image" onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
                </div>
                <div class="details-info">
                    <h2>${escapeHtml(resource.title || '')}</h2>
                    <p class="details-price">${priceDisplay}</p>
                    <p class="details-description">${escapeHtml(resource.description || '')}</p>
                    
                    <div class="details-meta">
                        <div class="meta-item">
                            <span class="meta-label">Category</span>
                            <span class="meta-value">${escapeHtml(resource.category || '')}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Subject</span>
                            <span class="meta-value">${escapeHtml(resource.subject || 'N/A')}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Type</span>
                            <span class="meta-value">${escapeHtml(resource.listing_type || '')}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Condition</span>
                            <span class="meta-value">${escapeHtml(resource.condition || '')}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Seller</span>
                            <span class="meta-value">${escapeHtml(sellerName)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Pickup Location</span>
                            <span class="meta-value">${escapeHtml(resource.pickup_location || '')}</span>
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

// Helper to escape HTML characters
function escapeHtml(text) {
    if (typeof text !== 'string') return text || '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    
    const titles = {
        'Sell': 'Request to Buy',
        'Rent': 'Request to Rent',
        'Exchange': 'Request to Exchange',
        'Donate': 'Request to Donate'
    };
    modalTitle.textContent = titles[listingType] || 'Send Request';
    
    requestForm.dataset.resourceId = resourceId;
    modal.style.display = 'flex';
    
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
};

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
        await window.firebaseDb.collection('resources').doc(resourceId).delete();
        alert('Listing deleted successfully!');
        window.location.href = 'marketplace.html';
    } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Failed to delete listing. Please try again.');
    }
}

// Initialize marketplace page
async function initMarketplace() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const typeFilter = document.getElementById('typeFilter');
    const conditionFilter = document.getElementById('conditionFilter');
    const filterBtn = document.getElementById('filterBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    const resources = await fetchResources();
    renderResourceGrid(resources);
    
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
    
    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }
    if (filterBtn) filterBtn.addEventListener('click', handleSearch);
    
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (typeFilter) typeFilter.value = '';
            if (conditionFilter) conditionFilter.value = '';
            
            const freshResources = await fetchResources();
            renderResourceGrid(freshResources);
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
            const container = document.getElementById('resourceDetails');
            if (container) {
                container.innerHTML = `
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
}

// Initialize dashboard page
async function initDashboard() {
    const user = await checkAuth();
    if (!user) return;
    
    const profile = await getUserProfile(user.uid);
    if (profile) {
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome, ${profile.name || 'Student'}!`;
        }
    }
    
    const allResources = await fetchResources();
    const myListings = allResources.filter(r => r.seller_id === user.uid);
    
    const totalResourcesEl = document.getElementById('totalResources');
    const myListingsEl = document.getElementById('myListings');
    const myPlansEl = document.getElementById('myPlans');
    
    if (totalResourcesEl) totalResourcesEl.textContent = allResources.length;
    if (myListingsEl) myListingsEl.textContent = myListings.length;
    
    // Load saved plans count from Firestore
    try {
        const plansSnapshot = await window.firebaseDb.collection('planner_history')
            .where('user_id', '==', user.uid)
            .get();
        if (myPlansEl) myPlansEl.textContent = plansSnapshot.size;
    } catch (e) {
        console.log('Error counting plans:', e);
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

// Initialize marketplace module on page load
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
