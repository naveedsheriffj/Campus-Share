// ============================================
// PLANNER HISTORY MODULE (FIREBASE)
// ============================================

// Fetch planner history for current user from Firestore
async function fetchPlannerHistory() {
    const user = await checkAuth();
    if (!user) {
        return [];
    }
    
    try {
        const snapshot = await window.firebaseDb.collection('planner_history')
            .where('user_id', '==', user.uid)
            .get();
        
        const historyList = [];
        snapshot.forEach(doc => {
            historyList.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        historyList.sort((a, b) => {
            const timeA = a.created_at?.toMillis ? a.created_at.toMillis() : (new Date(a.created_at || 0).getTime());
            const timeB = b.created_at?.toMillis ? b.created_at.toMillis() : (new Date(b.created_at || 0).getTime());
            return timeB - timeA;
        });
        
        return historyList;
    } catch (error) {
        console.error('Error fetching planner history:', error);
        return [];
    }
}

// Render history item
function renderHistoryItem(history) {
    const date = history.created_at?.toDate ? history.created_at.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'Recent Plan';
    
    let resourcesHTML = '';
    const items = history.items || history.planner_history_items || [];
    for (const item of items) {
        const priceDisplay = item.price === 0 ? 'Free' : `₹${item.price}`;
        resourcesHTML += `
            <div class="history-resource">
                <span>${escapeHtml(item.resource_title || item.title || '')}</span>
                <span>${priceDisplay} (${escapeHtml(item.condition || '')})</span>
            </div>
        `;
    }
    
    return `
        <div class="history-item">
            <div class="history-header-item">
                <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <h3>Saved Plan</h3>
                    ${history.algorithm_used ? `<span class="badge-optimal" style="font-size: 0.75rem;">${escapeHtml(history.algorithm_used)}</span>` : ''}
                </div>
                <span class="history-date">${date}</span>
            </div>
            <div class="history-resources">
                ${resourcesHTML}
            </div>
            <div class="history-summary">
                <div>
                    <span class="summary-label">Budget:</span>
                    <span class="summary-value">₹${history.budget}</span>
                </div>
                <div>
                    <span class="summary-label">Total Cost:</span>
                    <span class="summary-value">₹${history.total_cost}</span>
                </div>
                <div>
                    <span class="summary-label">Remaining:</span>
                    <span class="summary-value ${history.remaining_budget >= 0 ? 'success' : ''}">₹${history.remaining_budget}</span>
                </div>
            </div>
            <div class="history-actions">
                <button onclick="deleteHistory('${history.id}')" class="btn btn-outline" style="border-color: #ef4444; color: #ef4444;">Delete</button>
            </div>
        </div>
    `;
}

// Render history list
function renderHistoryList(history) {
    const historyList = document.getElementById('historyList');
    const emptyHistory = document.getElementById('emptyHistory');
    
    if (!historyList) return;
    
    if (history.length === 0) {
        historyList.style.display = 'none';
        if (emptyHistory) emptyHistory.style.display = 'block';
        return;
    }
    
    historyList.style.display = 'grid';
    if (emptyHistory) emptyHistory.style.display = 'none';
    
    historyList.innerHTML = history.map(renderHistoryItem).join('');
}

// Delete history item from Firestore
async function deleteHistory(historyId) {
    if (!confirm('Are you sure you want to delete this saved plan?')) {
        return;
    }
    
    try {
        await window.firebaseDb.collection('planner_history').doc(historyId).delete();
        alert('Plan deleted successfully!');
        
        const history = await fetchPlannerHistory();
        renderHistoryList(history);
        
    } catch (error) {
        console.error('Error deleting history:', error);
        alert('Failed to delete plan. Please try again.');
    }
}

// Initialize history page
async function initHistory() {
    const history = await fetchPlannerHistory();
    renderHistoryList(history);
}

// Initialize on page load
function initHistoryModule() {
    if (document.getElementById('historyList')) {
        initHistory();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHistoryModule);
} else {
    initHistoryModule();
}
