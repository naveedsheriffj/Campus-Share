// ============================================
// PURCHASE REQUESTS MODULE
// ============================================

// Create a purchase request
async function createPurchaseRequest(resourceId, message, pickupLocation) {
    const user = await checkAuth();
    if (!user) {
        showNotification('Please login to send a request', 'error');
        return null;
    }

    try {
        // Get resource details to check seller
        const { data: resource, error: resourceError } = await window.supabaseClient
            .from('resources')
            .select('seller_id, title, listing_type')
            .eq('id', resourceId)
            .single();

        if (resourceError) throw resourceError;
        
        // Prevent requesting own listings
        if (resource.seller_id === user.id) {
            showNotification('You cannot request your own listing', 'error');
            return null;
        }

        // Check for existing active request
        const { data: existingRequest, error: checkError } = await window.supabaseClient
            .from('purchase_requests')
            .select('id')
            .eq('resource_id', resourceId)
            .eq('buyer_id', user.id)
            .in('status', ['PENDING', 'ACCEPTED'])
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') throw checkError;
        
        if (existingRequest) {
            showNotification('You already have an active request for this item', 'error');
            return null;
        }

        // Determine action text based on listing type
        const actionText = resource.listing_type === 'Rent' ? 'rent' : 
                          resource.listing_type === 'Exchange' ? 'exchange' : 
                          resource.listing_type === 'Donate' ? 'request' : 'buy';

        // Create the request
        const { data, error } = await window.supabaseClient
            .from('purchase_requests')
            .insert({
                resource_id: resourceId,
                buyer_id: user.id,
                seller_id: resource.seller_id,
                message: message,
                pickup_location: pickupLocation,
                status: 'PENDING'
            })
            .select()
            .single();

        if (error) throw error;

        showNotification(`Request to ${actionText} "${resource.title}" sent successfully!`, 'success');
        return data;
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
        const { data, error } = await window.supabaseClient
            .from('purchase_requests')
            .select(`
                *,
                resources:resource_id (title, image_url, price, listing_type),
                seller:seller_id (name, email)
            `)
            .eq('buyer_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
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
        const { data, error } = await window.supabaseClient
            .from('purchase_requests')
            .select(`
                *,
                resources:resource_id (title, image_url, price, listing_type),
                buyer:buyer_id (name, email, department)
            `)
            .eq('seller_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
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
        const { data: request, error: fetchError } = await window.supabaseClient
            .from('purchase_requests')
            .select('*, resources:resource_id (id)')
            .eq('id', requestId)
            .single();

        if (fetchError) throw fetchError;

        // Verify user is seller
        if (request.seller_id !== user.id) {
            showNotification('You can only update requests for your listings', 'error');
            return false;
        }

        // Update request status
        const { error } = await window.supabaseClient
            .from('purchase_requests')
            .update({ status: newStatus })
            .eq('id', requestId);

        if (error) throw error;

        // If completing or accepting, update resource availability
        if (newStatus === 'COMPLETED' || newStatus === 'ACCEPTED') {
            const availability = newStatus === 'COMPLETED' ? 'Sold' : 'Reserved';
            await window.supabaseClient
                .from('resources')
                .update({ availability: availability })
                .eq('id', request.resource_id);
        }

        // If rejecting, make resource available again
        if (newStatus === 'REJECTED') {
            await window.supabaseClient
                .from('resources')
                .update({ availability: 'Available' })
                .eq('id', request.resource_id);
        }

        const statusMessages = {
            'ACCEPTED': 'Request accepted!',
            'REJECTED': 'Request rejected',
            'COMPLETED': 'Transaction marked as completed!'
        };

        showNotification(statusMessages[newStatus], newStatus === 'REJECTED' ? 'error' : 'success');
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

    return `
        <div class="request-card">
            <img src="${imageUrl}" alt="${request.resources?.title}" class="request-image" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
            <div class="request-content">
                <h3>${request.resources?.title}</h3>
                <p class="request-price">${priceDisplay}</p>
                <p class="request-type">${actionText} Request</p>
                <div class="request-status">${getStatusBadge(request.status)}</div>
                <p class="request-message"><strong>Your message:</strong> ${request.message}</p>
                <p class="request-pickup"><strong>Pickup:</strong> ${request.pickup_location}</p>
                <p class="request-date">Requested: ${new Date(request.created_at).toLocaleDateString()}</p>
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

    return `
        <div class="request-card">
            <img src="${imageUrl}" alt="${request.resources?.title}" class="request-image" onerror="this.src='https://via.placeholder.com/100x100?text=No+Image'">
            <div class="request-content">
                <h3>${request.resources?.title}</h3>
                <p class="request-price">${priceDisplay}</p>
                <p class="request-buyer"><strong>Buyer:</strong> ${request.buyer?.name}</p>
                <p class="request-buyer-email">${request.buyer?.email}</p>
                <div class="request-status">${getStatusBadge(request.status)}</div>
                <p class="request-message"><strong>Message:</strong> ${request.message}</p>
                <p class="request-pickup"><strong>Pickup Location:</strong> ${request.pickup_location}</p>
                <p class="request-date">Requested: ${new Date(request.created_at).toLocaleDateString()}</p>
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
