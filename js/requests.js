// ============================================
// PURCHASE REQUESTS MODULE (FIREBASE)
// ============================================

// Create a purchase request
async function createPurchaseRequest(resourceId, message, pickupLocation) {
    const user = await checkAuth();
    if (!user) {
        showNotification('Please login to send a request', 'error');
        return null;
    }

    try {
        const resourceDoc = await window.firebaseDb.collection('resources').doc(resourceId).get();
        if (!resourceDoc.exists) {
            showNotification('Resource not found', 'error');
            return null;
        }

        const resource = resourceDoc.data();
        
        // Prevent requesting own listings
        if (resource.seller_id === user.uid) {
            showNotification('You cannot request your own listing', 'error');
            return null;
        }

        // Check for existing active request
        const existingSnapshot = await window.firebaseDb.collection('purchase_requests')
            .where('resource_id', '==', resourceId)
            .where('buyer_id', '==', user.uid)
            .get();

        let hasActive = false;
        existingSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'PENDING' || data.status === 'ACCEPTED') {
                hasActive = true;
            }
        });

        if (hasActive) {
            showNotification('You already have an active request for this item', 'error');
            return null;
        }

        const buyerProfile = await getUserProfile(user.uid);

        const actionText = resource.listing_type === 'Rent' ? 'rent' : 
                          resource.listing_type === 'Exchange' ? 'exchange' : 
                          resource.listing_type === 'Donate' ? 'request' : 'buy';

        const requestData = {
            resource_id: resourceId,
            resource_title: resource.title,
            resource_image_url: resource.image_url || '',
            resource_price: resource.price ?? 0,
            resource_listing_type: resource.listing_type || 'Sell',
            buyer_id: user.uid,
            buyer_name: buyerProfile?.name || user.displayName || 'Student Buyer',
            buyer_email: user.email || '',
            buyer_department: buyerProfile?.department || '',
            seller_id: resource.seller_id,
            seller_name: resource.seller_name || 'Seller',
            seller_email: resource.seller_email || '',
            message: message,
            pickup_location: pickupLocation,
            status: 'PENDING',
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await window.firebaseDb.collection('purchase_requests').add(requestData);
        showNotification(`Request to ${actionText} "${resource.title}" sent successfully!`, 'success');
        return { id: docRef.id, ...requestData };

    } catch (error) {
        console.error('Error creating purchase request:', error);
        showNotification('Failed to send request. Please try again.', 'error');
        return null;
    }
}

// Get requests for current user (as buyer)
async function getMyRequests() {
    const user = await checkAuth();
    if (!user) return [];

    try {
        const snapshot = await window.firebaseDb.collection('purchase_requests')
            .where('buyer_id', '==', user.uid)
            .get();

        const requests = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            requests.push({
                id: doc.id,
                ...data,
                // Normalized object structure for template compatibility
                resources: {
                    title: data.resource_title,
                    image_url: data.resource_image_url,
                    price: data.resource_price,
                    listing_type: data.resource_listing_type
                },
                seller: {
                    name: data.seller_name,
                    email: data.seller_email
                }
            });
        });

        // Sort descending by date
        requests.sort((a, b) => {
            const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : (new Date(a.created_at || 0).getTime());
            const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : (new Date(b.created_at || 0).getTime());
            return timeB - timeA;
        });

        return requests;
    } catch (error) {
        console.error('Error fetching my requests:', error);
        return [];
    }
}

// Get requests for seller's resources
async function getSellerRequests() {
    const user = await checkAuth();
    if (!user) return [];

    try {
        const snapshot = await window.firebaseDb.collection('purchase_requests')
            .where('seller_id', '==', user.uid)
            .get();

        const requests = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            requests.push({
                id: doc.id,
                ...data,
                resources: {
                    title: data.resource_title,
                    image_url: data.resource_image_url,
                    price: data.resource_price,
                    listing_type: data.resource_listing_type
                },
                buyer: {
                    name: data.buyer_name,
                    email: data.buyer_email,
                    department: data.buyer_department
                }
            });
        });

        requests.sort((a, b) => {
            const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : (new Date(a.created_at || 0).getTime());
            const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : (new Date(b.created_at || 0).getTime());
            return timeB - timeA;
        });

        return requests;
    } catch (error) {
        console.error('Error fetching seller requests:', error);
        return [];
    }
}

// Update request status (accept/reject/complete)
async function updateRequestStatus(requestId, newStatus) {
    const user = await checkAuth();
    if (!user) return false;

    try {
        const reqRef = window.firebaseDb.collection('purchase_requests').doc(requestId);
        const reqDoc = await reqRef.get();

        if (!reqDoc.exists) {
            showNotification('Request not found', 'error');
            return false;
        }

        const request = reqDoc.data();

        // Verify current user is seller
        if (request.seller_id !== user.uid) {
            showNotification('You can only update requests for your listings', 'error');
            return false;
        }

        // Update request status
        await reqRef.update({
            status: newStatus,
            updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update resource availability
        if (request.resource_id) {
            const resourceRef = window.firebaseDb.collection('resources').doc(request.resource_id);
            if (newStatus === 'COMPLETED') {
                await resourceRef.update({ availability: 'Sold', updated_at: firebase.firestore.FieldValue.serverTimestamp() });
            } else if (newStatus === 'ACCEPTED') {
                await resourceRef.update({ availability: 'Reserved', updated_at: firebase.firestore.FieldValue.serverTimestamp() });
            } else if (newStatus === 'REJECTED') {
                await resourceRef.update({ availability: 'Available', updated_at: firebase.firestore.FieldValue.serverTimestamp() });
            }
        }

        const statusMessages = {
            'ACCEPTED': 'Request accepted!',
            'REJECTED': 'Request rejected',
            'COMPLETED': 'Transaction marked as completed!'
        };

        showNotification(statusMessages[newStatus] || 'Status updated', newStatus === 'REJECTED' ? 'error' : 'success');
        
        // Refresh page requests view
        if (document.getElementById('sellerRequestsPage')) {
            initSellerRequests();
        }
        return true;
    } catch (error) {
        console.error('Error updating request status:', error);
        showNotification('Failed to update request status', 'error');
        return false;
    }
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        'PENDING': '<span class="status-badge status-pending">Pending</span>',
        'ACCEPTED': '<span class="status-badge status-accepted">Accepted</span>',
        'REJECTED': '<span class="status-badge status-rejected">Rejected</span>',
        'COMPLETED': '<span class="status-badge status-completed">Completed</span>'
    };
    return badges[status] || '<span class="status-badge">Unknown</span>';
}

// Render request card for buyer
function renderBuyerRequestCard(request) {
    const imageUrl = request.resources?.image_url || 'https://via.placeholder.com/100x100?text=No+Image';
    const priceDisplay = request.resources?.listing_type === 'Donate' ? 'Free' : `₹${request.resources?.price}`;
    const actionText = request.resources?.listing_type === 'Rent' ? 'Rent' : 
                      request.resources?.listing_type === 'Exchange' ? 'Exchange' : 
                      request.resources?.listing_type === 'Donate' ? 'Request' : 'Buy';

    const reqDate = request.created_at?.toDate ? request.created_at.toDate().toLocaleDateString() : 'Recent';

    return `
        <div class="request-card">
            <img src="${imageUrl}" alt="${escapeHtml(request.resources?.title || '')}" class="request-image" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
            <div class="request-content">
                <h3>${escapeHtml(request.resources?.title || '')}</h3>
                <p class="request-price">${priceDisplay}</p>
                <p class="request-type">${actionText} Request</p>
                <div class="request-status">${getStatusBadge(request.status)}</div>
                <p class="request-message"><strong>Your message:</strong> ${escapeHtml(request.message || '')}</p>
                <p class="request-pickup"><strong>Pickup:</strong> ${escapeHtml(request.pickup_location || '')}</p>
                <p class="request-date">Requested: ${reqDate}</p>
                ${request.status === 'ACCEPTED' ? `
                    <button onclick="openChat('${request.id}')" class="btn btn-primary btn-sm">Open Chat</button>
                ` : ''}
            </div>
        </div>
    `;
}

// Render request card for seller
function renderSellerRequestCard(request) {
    const imageUrl = request.resources?.image_url || 'https://via.placeholder.com/100x100?text=No+Image';
    const priceDisplay = request.resources?.listing_type === 'Donate' ? 'Free' : `₹${request.resources?.price}`;
    const reqDate = request.created_at?.toDate ? request.created_at.toDate().toLocaleDateString() : 'Recent';

    return `
        <div class="request-card">
            <img src="${imageUrl}" alt="${escapeHtml(request.resources?.title || '')}" class="request-image" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
            <div class="request-content">
                <h3>${escapeHtml(request.resources?.title || '')}</h3>
                <p class="request-price">${priceDisplay}</p>
                <p class="request-buyer"><strong>Buyer:</strong> ${escapeHtml(request.buyer?.name || '')}</p>
                <p class="request-buyer-email">${escapeHtml(request.buyer?.email || '')}</p>
                <div class="request-status">${getStatusBadge(request.status)}</div>
                <p class="request-message"><strong>Message:</strong> ${escapeHtml(request.message || '')}</p>
                <p class="request-pickup"><strong>Pickup Location:</strong> ${escapeHtml(request.pickup_location || '')}</p>
                <p class="request-date">Requested: ${reqDate}</p>
                ${request.status === 'PENDING' ? `
                    <div class="request-actions">
                        <button onclick="updateRequestStatus('${request.id}', 'ACCEPTED')" class="btn btn-primary btn-sm">Accept</button>
                        <button onclick="updateRequestStatus('${request.id}', 'REJECTED')" class="btn btn-outline btn-sm" style="border-color: #ef4444; color: #ef4444;">Reject</button>
                    </div>
                ` : ''}
                ${request.status === 'ACCEPTED' ? `
                    <div class="request-actions">
                        <button onclick="openChat('${request.id}')" class="btn btn-primary btn-sm">Open Chat</button>
                        <button onclick="updateRequestStatus('${request.id}', 'COMPLETED')" class="btn btn-success btn-sm">Mark Completed</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// Render requests grid
function renderRequestsGrid(requests, containerId, renderFunction) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No Requests Found</h3>
                <p>You don't have any requests yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = requests.map(renderFunction).join('');
}

// Initialize buyer requests page
async function initBuyerRequests() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const requests = await getMyRequests();
    renderRequestsGrid(requests, 'requestsGrid', renderBuyerRequestCard);
}

// Initialize seller requests page
async function initSellerRequests() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const requests = await getSellerRequests();
    renderRequestsGrid(requests, 'requestsGrid', renderSellerRequestCard);
}

// Open chat for a request
function openChat(requestId) {
    window.location.href = `chat.html?request_id=${requestId}`;
}

// Initialize on page load
function initRequestsModule() {
    if (document.getElementById('buyerRequestsPage')) {
        initBuyerRequests();
    }
    
    if (document.getElementById('sellerRequestsPage')) {
        initSellerRequests();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRequestsModule);
} else {
    initRequestsModule();
}
