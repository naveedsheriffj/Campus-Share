// ============================================
// PLANNER HISTORY MODULE
// ============================================

// Fetch planner history for current user
async function fetchPlannerHistory() {
    const user = await checkAuth();
    if (!user) {
        return [];
    }
    
    const { data, error } = await window.supabaseClient
        .from('planner_history')
        .select(`
            *,
            planner_history_items (
                resource_id,
                resource_title,
                price,
                condition
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching planner history:', error);
        return [];
    }
    
    return data;
}

// Render history item
function renderHistoryItem(history) {
    const date = new Date(history.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    let resourcesHTML = '';
    for (const item of history.planner_history_items) {
        const priceDisplay = item.price === 0 ? 'Free' : `₹${item.price}`;
        resourcesHTML += `
            <div class="history-resource">
                <span>${item.resource_title}</span>
                <span>${priceDisplay} (${item.condition})</span>
            </div>
        `;
    }
    
    return `
        <div class="history-item">
            <div class="history-header-item">
                <h3>Saved Plan</h3>
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

// Delete history item
async function deleteHistory(historyId) {
    if (!confirm('Are you sure you want to delete this saved plan?')) {
        return;
    }
    
    try {
        // Delete history items first (foreign key constraint)
        const { error: itemsError } = await window.supabaseClient
            .from('planner_history_items')
            .delete()
            .eq('history_id', historyId);
        
        if (itemsError) throw itemsError;
        
        // Delete history entry
        const { error: historyError } = await window.supabaseClient
            .from('planner_history')
            .delete()
            .eq('id', historyId);
        
        if (historyError) throw historyError;
        
        alert('Plan deleted successfully!');
        
        // Reload history
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
