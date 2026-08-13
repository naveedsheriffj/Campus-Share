// ============================================
// CHAT MODULE
// ============================================

let currentRequestId = null;
let realtimeSubscription = null;
let currentUserId = null;

// Initialize chat
async function initChat() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUserId = user.id;

    const urlParams = new URLSearchParams(window.location.search);
    currentRequestId = urlParams.get('request_id');

    if (!currentRequestId) {
        showNotification('Invalid request ID', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    // Verify user has access to this request
    const { data: request, error } = await window.supabaseClient
        .from('purchase_requests')
        .select(`
            *,
            resources:resource_id (title),
            buyer:buyer_id (name),
            seller:seller_id (name)
        `)
        .eq('id', currentRequestId)
        .single();

    if (error || !request) {
        showNotification('Request not found', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    // Check if user is participant
    if (request.buyer_id !== currentUserId && request.seller_id !== currentUserId) {
        showNotification('You do not have access to this chat', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    // Check if request is accepted
    if (request.status !== 'ACCEPTED' && request.status !== 'COMPLETED') {
        showNotification('Chat is only available after request is accepted', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    // Update UI with request info
    updateChatHeader(request);

    // Load existing messages
    await loadMessages();

    // Setup realtime subscription
    setupRealtimeSubscription();

    // Setup message input
    setupMessageInput();
}

// Update chat header
function updateChatHeader(request) {
    const header = document.getElementById('chatHeader');
    if (!header) return;

    const otherPartyName = request.buyer_id === currentUserId ? request.seller?.name : request.buyer?.name;
    header.innerHTML = `
        <h2>Chat: ${request.resources?.title}</h2>
        <p class="chat-subtitle">Talking with: ${otherPartyName}</p>
    `;
}

// Load existing messages
async function loadMessages() {
    try {
        const { data, error } = await window.supabaseClient
            .from('messages')
            .select(`
                *,
                sender:sender_id (name)
            `)
            .eq('request_id', currentRequestId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        renderMessages(data || []);
    } catch (error) {
        console.error('Error loading messages:', error);
        showNotification('Failed to load messages', 'error');
    }
}

// Render messages
function renderMessages(messages) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isOwnMessage = msg.sender_id === currentUserId;
        return `
            <div class="message ${isOwnMessage ? 'message-own' : 'message-other'}">
                <div class="message-sender">${msg.sender?.name || 'Unknown'}</div>
                <div class="message-content">${escapeHtml(msg.message)}</div>
                <div class="message-time">${formatMessageTime(msg.created_at)}</div>
            </div>
        `;
    }).join('');

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Setup realtime subscription
function setupRealtimeSubscription() {
    if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
    }

    realtimeSubscription = window.supabaseClient
        .channel(`messages:${currentRequestId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `request_id=eq.${currentRequestId}`
        }, (payload) => {
            // New message received
            const newMessage = payload.new;
            const isOwnMessage = newMessage.sender_id === currentUserId;
            
            const container = document.getElementById('messagesContainer');
            if (container) {
                // Remove empty state if present
                const emptyState = container.querySelector('.chat-empty');
                if (emptyState) {
                    emptyState.remove();
                }

                const messageHtml = `
                    <div class="message ${isOwnMessage ? 'message-own' : 'message-other'}">
                        <div class="message-sender">${newMessage.sender_id === currentUserId ? 'You' : 'Other'}</div>
                        <div class="message-content">${escapeHtml(newMessage.message)}</div>
                        <div class="message-time">${formatMessageTime(newMessage.created_at)}</div>
                    </div>
                `;
                
                container.insertAdjacentHTML('beforeend', messageHtml);
                container.scrollTop = container.scrollHeight;
            }
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Realtime subscription active');
            } else if (status === 'CHANNEL_ERROR') {
                console.error('Realtime subscription error');
            }
        });
}

// Setup message input
function setupMessageInput() {
    const form = document.getElementById('messageForm');
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');

    if (!form || !input || !sendBtn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await sendMessage();
    });

    sendBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await sendMessage();
    });
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input?.value?.trim();

    if (!message) return;

    try {
        const { error } = await window.supabaseClient
            .from('messages')
            .insert({
                request_id: currentRequestId,
                sender_id: currentUserId,
                message: message
            });

        if (error) throw error;

        // Clear input
        if (input) input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
    }
}

// Format message time
function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (realtimeSubscription) {
        realtimeSubscription.unsubscribe();
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
} else {
    initChat();
}
