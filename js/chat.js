// ============================================
// CHAT MODULE (FIREBASE REALTIME)
// ============================================

let currentRequestId = null;
let realtimeUnsubscribe = null;
let currentUserId = null;
let currentUserName = 'Student';

// Initialize chat
async function initChat() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    currentUserId = user.uid;
    const profile = await getUserProfile(user.uid);
    currentUserName = profile?.name || user.displayName || 'Student';

    const urlParams = new URLSearchParams(window.location.search);
    currentRequestId = urlParams.get('request_id');

    if (!currentRequestId) {
        showNotification('Invalid request ID', 'error');
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const reqDoc = await window.firebaseDb.collection('purchase_requests').doc(currentRequestId).get();
        if (!reqDoc.exists) {
            showNotification('Request not found', 'error');
            window.location.href = 'dashboard.html';
            return;
        }

        const request = reqDoc.data();

        // Check if user is participant
        if (request.buyer_id !== currentUserId && request.seller_id !== currentUserId) {
            showNotification('You do not have access to this chat', 'error');
            window.location.href = 'dashboard.html';
            return;
        }

        // Check if request is accepted or completed
        if (request.status !== 'ACCEPTED' && request.status !== 'COMPLETED') {
            showNotification('Chat is only available after request is accepted', 'error');
            window.location.href = 'dashboard.html';
            return;
        }

        updateChatHeader(request);
        setupRealtimeMessages();
        setupMessageInput();

    } catch (error) {
        console.error('Error initializing chat:', error);
        showNotification('Failed to load chat', 'error');
    }
}

// Update chat header
function updateChatHeader(request) {
    const header = document.getElementById('chatHeader');
    if (!header) return;

    const otherPartyName = request.buyer_id === currentUserId ? (request.seller_name || 'Seller') : (request.buyer_name || 'Buyer');
    header.innerHTML = `
        <h2>Chat: ${escapeHtml(request.resource_title || 'Item')}</h2>
        <p class="chat-subtitle">Talking with: ${escapeHtml(otherPartyName)}</p>
    `;
}

// Setup real-time listener for messages using Firestore onSnapshot
function setupRealtimeMessages() {
    if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
    }

    realtimeUnsubscribe = window.firebaseDb.collection('messages')
        .where('request_id', '==', currentRequestId)
        .onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // Sort ascending by time
            messages.sort((a, b) => {
                const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : (new Date(a.created_at || 0).getTime());
                const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : (new Date(b.created_at || 0).getTime());
                return timeA - timeB;
            });

            renderMessages(messages);
        }, (error) => {
            console.error('Messages real-time snapshot error:', error);
            showNotification('Chat sync error', 'error');
        });
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
        const senderLabel = isOwnMessage ? 'You' : (msg.sender_name || 'Partner');
        return `
            <div class="message ${isOwnMessage ? 'message-own' : 'message-other'}">
                <div class="message-sender">${escapeHtml(senderLabel)}</div>
                <div class="message-content">${escapeHtml(msg.message || '')}</div>
                <div class="message-time">${formatMessageTime(msg.created_at)}</div>
            </div>
        `;
    }).join('');

    container.scrollTop = container.scrollHeight;
}

// Setup message input
function setupMessageInput() {
    const form = document.getElementById('messageForm');
    const sendBtn = document.getElementById('sendBtn');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await sendMessage();
    });

    if (sendBtn) {
        sendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await sendMessage();
        });
    }
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input?.value?.trim();

    if (!message) return;

    try {
        await window.firebaseDb.collection('messages').add({
            request_id: currentRequestId,
            sender_id: currentUserId,
            sender_name: currentUserName,
            message: message,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        if (input) input.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('Failed to send message', 'error');
    }
}

// Format message time
function formatMessageTime(timestamp) {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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

// Escape HTML
function escapeHtml(text) {
    if (typeof text !== 'string') return text || '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cleanup listener on page leave
window.addEventListener('beforeunload', () => {
    if (realtimeUnsubscribe) {
        realtimeUnsubscribe();
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
} else {
    initChat();
}
