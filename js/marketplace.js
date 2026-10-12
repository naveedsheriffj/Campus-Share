// ============================================
// MARKETPLACE MODULE (FIREBASE)
// ============================================

// Condition ranking for comparison
var CONDITION_RANKING = window.CONDITION_RANKING || {
    'New': 5,
    'Like New': 4,
    'Good': 3,
    'Fair': 2,
    'Poor': 1
};
window.CONDITION_RANKING = CONDITION_RANKING;

// Get condition rank
function getConditionRank(condition) {
    return CONDITION_RANKING[condition] || 0;
}

// Default inline placeholder image (avoids external network dependency and infinite error loops)
const DEFAULT_IMAGE_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='200' viewBox='0 0 280 200'%3E%3Crect width='280' height='200' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, sans-serif' font-size='15' font-weight='500' fill='%2364748b'%3EAcademic Resource%3C/text%3E%3C/svg%3E";

// Built-in standard academic resources catalog (serves as immediate fallback if network/firewall restricts Firestore)
const FALLBACK_RESOURCES = [
    {
        id: "1fKSFam748D6uhcDG9zk",
        title: "Arduino Uno Starter Kit",
        description: "Complete starter kit with Arduino Uno, breadboard, LEDs, sensors. Like new.",
        category: "Arduino",
        subject: "Electronics",
        listing_type: "Sell",
        price: 650,
        condition: "Like New",
        availability: "Available",
        pickup_location: "Lab",
        seller_name: "ECE Lab Club",
        seller_id: "seed-seller-6",
        created_at: new Date("2026-09-24T10:33:26.779Z"),
        profiles: { name: "ECE Lab Club" }
    },
    {
        id: "4RzaM4nHu8CR6C1Ghf2p",
        title: "Arduino Mega 2560 Kit",
        description: "Advanced Arduino kit with Mega board and various components. Brand new.",
        category: "Arduino",
        subject: "Electronics",
        listing_type: "Sell",
        price: 900,
        condition: "New",
        availability: "Available",
        pickup_location: "Lab",
        seller_name: "ECE Lab Club",
        seller_id: "seed-seller-6",
        created_at: new Date("2026-09-24T10:33:26.841Z"),
        profiles: { name: "ECE Lab Club" }
    },
    {
        id: "7tkm9U8jkl234nmbc001",
        title: "Digital Multimeter",
        description: "High accuracy digital multimeter with probes. Good condition.",
        category: "Electronics",
        subject: "Electrical Engineering",
        listing_type: "Sell",
        price: 350,
        condition: "Good",
        availability: "Available",
        pickup_location: "Lab",
        seller_name: "Lab Tech",
        seller_id: "seed-seller-8",
        created_at: new Date("2026-09-24T10:33:27.000Z"),
        profiles: { name: "Lab Tech" }
    },
    {
        id: "8sPRGvFUI7h4FJ3sOnTb",
        title: "DBMS Book - Database System Concepts",
        description: "Comprehensive textbook on database management systems. Good condition, minimal highlighting.",
        category: "Textbook",
        subject: "Database Systems",
        listing_type: "Sell",
        price: 500,
        condition: "Good",
        availability: "Available",
        pickup_location: "Library",
        seller_name: "Library Desk",
        seller_id: "seed-seller-1",
        created_at: new Date("2026-09-24T10:33:25.538Z"),
        profiles: { name: "Library Desk" }
    },
    {
        id: "Qz189iqRxxeffvmPFT9Y",
        title: "Engineering Drawing Set",
        description: "Complete set with compass, protractor, set squares. Good condition.",
        category: "Drawing Tools",
        subject: "Engineering Drawing",
        listing_type: "Sell",
        price: 300,
        condition: "Good",
        availability: "Available",
        pickup_location: "Drawing Hall",
        seller_name: "Meena S",
        seller_id: "seed-seller-7",
        created_at: new Date("2026-09-24T10:33:27.009Z"),
        profiles: { name: "Meena S" }
    },
    {
        id: "YD5drRpQxW79BfNX3XBP",
        title: "Java Book - Head First Java",
        description: "Great for beginners. Some wear but all pages intact.",
        category: "Textbook",
        subject: "Java Programming",
        listing_type: "Sell",
        price: 400,
        condition: "Good",
        availability: "Available",
        pickup_location: "Library",
        seller_name: "Priya Sharma",
        seller_id: "seed-seller-3",
        created_at: new Date("2026-09-24T10:33:26.439Z"),
        profiles: { name: "Priya Sharma" }
    },
    {
        id: "YDwb2fasNhb75FsmdWoy",
        title: "DBMS Book - Fundamentals of Database Systems",
        description: "Excellent condition, like new. Includes practice problems.",
        category: "Textbook",
        subject: "Database Systems",
        listing_type: "Sell",
        price: 700,
        condition: "New",
        availability: "Available",
        pickup_location: "Block A",
        seller_name: "Arun Kumar",
        seller_id: "seed-seller-2",
        created_at: new Date("2026-09-24T10:33:26.087Z"),
        profiles: { name: "Arun Kumar" }
    },
    {
        id: "f16JXKZCZaSACObttSDi",
        title: "Java Book - Effective Java",
        description: "Advanced Java programming. Fair condition, some notes in margins.",
        category: "Textbook",
        subject: "Java Programming",
        listing_type: "Sell",
        price: 600,
        condition: "Fair",
        availability: "Available",
        pickup_location: "Block B",
        seller_name: "Arun Kumar",
        seller_id: "seed-seller-2",
        created_at: new Date("2026-09-24T10:33:26.532Z"),
        profiles: { name: "Arun Kumar" }
    },
    {
        id: "fGmlSM9O5mBgMnu9yqF4",
        title: "Scientific Calculator Casio fx-991EX",
        description: "Fully functional, good condition. Includes original case.",
        category: "Calculator",
        subject: "Mathematics",
        listing_type: "Sell",
        price: 450,
        condition: "Good",
        availability: "Available",
        pickup_location: "Library",
        seller_name: "Karthik R",
        seller_id: "seed-seller-4",
        created_at: new Date("2026-09-24T10:33:26.601Z"),
        profiles: { name: "Karthik R" }
    },
    {
        id: "fkxErPbsAneNrZoSNNHU",
        title: "Basic Calculator",
        description: "Simple calculator for basic math. Poor condition, buttons sticky.",
        category: "Calculator",
        subject: "Mathematics",
        listing_type: "Sell",
        price: 300,
        condition: "Poor",
        availability: "Available",
        pickup_location: "Block C",
        seller_name: "Deepak V",
        seller_id: "seed-seller-5",
        created_at: new Date("2026-09-24T10:33:26.675Z"),
        profiles: { name: "Deepak V" }
    }
];

// Helper to parse Firestore REST values
function parseFirestoreRestValue(val) {
    if (!val) return null;
    if (val.stringValue !== undefined) return val.stringValue;
    if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
    if (val.doubleValue !== undefined) return parseFloat(val.doubleValue);
    if (val.booleanValue !== undefined) return val.booleanValue;
    if (val.timestampValue !== undefined) return new Date(val.timestampValue);
    if (val.mapValue !== undefined) {
        const res = {};
        for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
            res[k] = parseFirestoreRestValue(v);
        }
        return res;
    }
    if (val.arrayValue !== undefined) {
        return (val.arrayValue.values || []).map(parseFirestoreRestValue);
    }
    return null;
}

function parseFirestoreRestDoc(doc) {
    const id = doc.name.split('/').pop();
    const data = { id };
    for (const [k, v] of Object.entries(doc.fields || {})) {
        data[k] = parseFirestoreRestValue(v);
    }
    data.profiles = { name: data.seller_name || 'Student Seller' };
    return data;
}

// Fetch resources directly via Firestore REST API (reliable fallback for firewalls/WebChannel blocking)
async function fetchResourcesViaRest(filters = {}) {
    try {
        const config = window.firebaseConfig || (typeof getFirebaseConfig === 'function' ? getFirebaseConfig() : null);
        if (!config || !config.projectId || !config.apiKey) return null;

        const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents:runQuery?key=${config.apiKey}`;
        const queryBody = {
            structuredQuery: {
                from: [{ collectionId: 'resources' }],
                where: {
                    fieldFilter: {
                        field: { fieldPath: 'availability' },
                        op: 'EQUAL',
                        value: { stringValue: 'Available' }
                    }
                }
            }
        };

        const headers = { 'Content-Type': 'application/json' };
        if (window.firebaseAuth && window.firebaseAuth.currentUser) {
            try {
                const token = await window.firebaseAuth.currentUser.getIdToken();
                if (token) headers['Authorization'] = 'Bearer ' + token;
            } catch (e) {
                // Ignore token resolution error
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(queryBody)
        });

        if (!response.ok) {
            console.warn('Firestore REST query returned status', response.status);
            return null;
        }

        const data = await response.json();
        if (!Array.isArray(data)) return null;

        return data
            .filter(item => item.document)
            .map(item => parseFirestoreRestDoc(item.document));
    } catch (err) {
        console.warn('REST API fetch error:', err);
        return null;
    }
}

// Fetch all available resources from Firestore with 3-tier fallback
async function fetchResources(filters = {}) {
    let resources = [];
    let loadedFromDb = false;

    // Ensure Firebase is initialized if possible
    if (!window.firebaseDb && typeof initFirebase === 'function') {
        initFirebase();
    }

    // Tier 1: Try Firebase Web SDK with a 3.5s timeout
    if (window.firebaseDb) {
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

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore SDK query timeout')), 3500)
            );

            const snapshot = await Promise.race([query.get(), timeoutPromise]);
            
            snapshot.forEach(doc => {
                const data = doc.data();
                resources.push({
                    id: doc.id,
                    ...data,
                    profiles: {
                        name: data.seller_name || 'Student Seller'
                    }
                });
            });
            
            // Successfully queried Firestore (even if collection is currently empty)
            loadedFromDb = true;
        } catch (sdkError) {
            console.warn('Firestore SDK query failed or timed out, trying REST fallback:', sdkError.message);
        }
    }

    // Tier 2: Direct Firestore REST query fallback (bypasses WebChannel/WebSocket blocking)
    if (!loadedFromDb) {
        const restResources = await fetchResourcesViaRest(filters);
        if (restResources !== null) {
            resources = restResources;
            loadedFromDb = true;
        }
    }

    // Tier 3: If completely offline / unreachable, return empty array without injecting fake defaults
    if (!loadedFromDb) {
        console.warn('Could not connect to Firestore database (offline).');
        resources = [];
    }

    // Client-side filtering
    if (filters.category) {
        resources = resources.filter(r => r.category === filters.category);
    }
    if (filters.type) {
        resources = resources.filter(r => r.listing_type === filters.type);
    }
    if (filters.condition) {
        resources = resources.filter(r => r.condition === filters.condition);
    }

    // Client-side sort by created_at descending (handles Date and Firestore Timestamp)
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
}

// Fetch single resource by ID from Firestore with safe profile resolution and fallbacks
async function fetchResourceById(resourceId) {
    if (!window.firebaseDb && typeof initFirebase === 'function') {
        initFirebase();
    }

    // Tier 1: Try Firebase Web SDK with timeout
    if (window.firebaseDb) {
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('SDK doc timeout')), 3000)
            );
            const doc = await Promise.race([
                window.firebaseDb.collection('resources').doc(resourceId).get(),
                timeoutPromise
            ]);

            if (doc.exists) {
                const data = doc.data();
                let sellerProfile = {
                    name: data.seller_name || 'Student Seller',
                    email: '',
                    department: ''
                };

                // Safely attempt to fetch profile without crashing if unauthenticated
                if (data.seller_id) {
                    try {
                        const profileDoc = await window.firebaseDb.collection('profiles').doc(data.seller_id).get();
                        if (profileDoc.exists) {
                            const pData = profileDoc.data();
                            sellerProfile = {
                                name: pData.name || data.seller_name || 'Student Seller',
                                email: pData.email || '',
                                department: pData.department || ''
                            };
                        }
                    } catch (pErr) {
                        // Ignore permission error on profiles
                    }
                }

                return {
                    id: doc.id,
                    ...data,
                    profiles: sellerProfile
                };
            }
        } catch (error) {
            console.warn('Error fetching resource via SDK, trying REST:', error.message);
        }
    }

    // Tier 2: Try Firestore REST API directly
    try {
        const config = window.firebaseConfig || (typeof getFirebaseConfig === 'function' ? getFirebaseConfig() : null);
        if (config && config.projectId && config.apiKey) {
            const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents/resources/${resourceId}?key=${config.apiKey}`;
            const res = await fetch(url);
            if (res.ok) {
                const doc = await res.json();
                return parseFirestoreRestDoc(doc);
            }
        }
    } catch (e) {
        console.warn('REST fetchResourceById error:', e);
    }

    // Tier 3: Check fallback catalog
    const fallback = FALLBACK_RESOURCES.find(r => r.id === resourceId);
    if (fallback) {
        return { ...fallback };
    }

    return null;
}

// Render resource card
function renderResourceCard(resource) {
    const imageUrl = resource.image_url || DEFAULT_IMAGE_SVG;
    const priceDisplay = resource.listing_type === 'Donate' ? 'Free' : `₹${resource.price}`;
    const sellerName = resource.profiles?.name || resource.seller_name || 'Seller';
    
    return `
        <div class="resource-card" onclick="viewResource('${resource.id}')">
            <img src="${imageUrl}" alt="${escapeHtml(resource.title || '')}" class="resource-image" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE_SVG}'">
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
            <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; background: #fff; border-radius: 12px; border: 1px dashed var(--gray-300);">
                <div class="empty-icon" style="font-size: 3rem; margin-bottom: 0.75rem;">📚</div>
                <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--gray-800);">No Available Resources</h3>
                <p style="color: var(--gray-600); margin-bottom: 1.25rem; max-width: 450px; margin-left: auto; margin-right: auto;">There are currently no resources listed in the marketplace database.</p>
                <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
                    <a href="create-listing.html" class="btn btn-primary">➕ Add Resource Listing</a>
                    <button type="button" onclick="seedSampleResourcesToDatabase()" class="btn btn-outline" id="seedDataBtn" style="cursor: pointer;">⚡ Seed Sample Academic Data</button>
                </div>
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
    
    const imageUrl = resource.image_url || DEFAULT_IMAGE_SVG;
    const priceDisplay = resource.listing_type === 'Donate' ? 'Free' : `₹${resource.price}`;
    const currentUser = window.firebaseAuth?.currentUser;
    const isOwner = currentUser && (resource.seller_id === currentUser.uid);
    const sellerName = resource.profiles?.name || resource.seller_name || 'Student Seller';
    
    container.innerHTML = `
        <div class="resource-details">
            <div class="details-content">
                <div>
                    <img src="${imageUrl}" alt="${escapeHtml(resource.title || '')}" class="details-image" onerror="this.onerror=null; this.src='${DEFAULT_IMAGE_SVG}'">
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
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
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
            recentResourcesEl.innerHTML = '<p class="loading-text" style="color:var(--gray-500);padding:1.5rem 0;">No resources available yet. <a href="create-listing.html" style="color:var(--primary-blue);font-weight:600;text-decoration:underline;">Add a listing</a> to get started!</p>';
        }
    }
}

// Seed sample academic resources into real Firestore database
window.seedSampleResourcesToDatabase = async function() {
    const btn = document.getElementById('seedDataBtn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Adding Sample Resources...';
    }
    
    try {
        if (!window.firebaseDb && typeof initFirebase === 'function') {
            initFirebase();
        }
        
        if (!window.firebaseDb) {
            alert('Firestore database is not connected. Please check your internet connection.');
            return;
        }

        const currentUser = window.firebaseAuth?.currentUser;
        if (!currentUser) {
            alert('Please login first to seed sample resources into your Firestore database.');
            return;
        }

        const sellerId = currentUser.uid;
        const sellerName = currentUser.displayName || 'Academic Seller';
        const sellerEmail = currentUser.email || 'student@college.edu';

        const batch = window.firebaseDb.batch();
        const collection = window.firebaseDb.collection('resources');

        FALLBACK_RESOURCES.forEach(item => {
            const docRef = collection.doc();
            batch.set(docRef, {
                title: item.title,
                description: item.description,
                category: item.category,
                subject: item.subject,
                listing_type: item.listing_type,
                price: item.price,
                condition: item.condition,
                availability: 'Available',
                pickup_location: item.pickup_location || 'Campus Library',
                seller_id: sellerId,
                seller_name: sellerName,
                seller_email: sellerEmail,
                image_url: item.image_url || '',
                created_at: firebase.firestore.FieldValue.serverTimestamp(),
                updated_at: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        alert('✅ Successfully added sample academic resources to your Firestore database!');
        window.location.reload();
    } catch (err) {
        console.error('Error seeding resources:', err);
        alert('Failed to seed resources: ' + (err.message || err));
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⚡ Seed Sample Academic Data';
        }
    }
};

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
