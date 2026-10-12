// ============================================
// SMART RESOURCE PLANNER MODULE (FIREBASE)
// With Unit-III CSP Inference & Benchmark Visualizer
// ============================================

let currentPlanResult = null;
let currentPlanRequirements = null;

// Handle planner form submission
async function handlePlannerSubmit(event) {
    if (event && event.preventDefault) {
        event.preventDefault();
    }
    
    const requiredResourcesText = (document.getElementById('requiredResources')?.value || '').trim();
    const budgetRaw = document.getElementById('budget')?.value;
    const budget = parseFloat(budgetRaw);
    const minimumCondition = document.getElementById('minimumCondition')?.value;
    const mode = 'mrv'; // Unit-III Best Algorithm: Forward Checking with MRV & LCV

    // Flexible parsing: handles newlines, commas, bullet points (- , * , 1. )
    const requiredResources = requiredResourcesText
        .split(/[\n,]+/)
        .map(r => r.replace(/^[-*•\d.)\s]+/, '').trim())
        .filter(r => r.length > 0);
    
    if (requiredResources.length === 0) {
        alert('Please enter at least one required resource (e.g., DBMS Book, Java Book, Calculator).');
        document.getElementById('requiredResources')?.focus();
        return;
    }

    if (isNaN(budget) || budget <= 0) {
        alert('Please enter a valid budget amount in ₹ (e.g., 1500).');
        document.getElementById('budget')?.focus();
        return;
    }

    if (!minimumCondition) {
        alert('Please select a minimum acceptable condition.');
        document.getElementById('minimumCondition')?.focus();
        return;
    }
    
    currentPlanRequirements = {
        requiredResources,
        budget,
        minimumCondition,
        mode
    };

    const submitBtn = document.querySelector('#plannerForm button[type="submit"]');
    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Find Best Combination';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⚡ Finding Best Combination (Running AI Engine)...';
    }
    
    try {
        // Fetch available resources from Firestore (with automatic REST & offline fallback)
        const availableResources = await fetchResources();
        
        if (!availableResources || availableResources.length === 0) {
            const shouldSeed = confirm('There are currently 0 available resources in the database.\n\nWould you like to seed sample academic resources (DBMS Book, Java Book, Calculator, Drawing Set, etc.) into your Firestore database now to run the planner?');
            if (shouldSeed && typeof window.seedSampleResourcesToDatabase === 'function') {
                await window.seedSampleResourcesToDatabase();
            }
            return;
        }
        
        if (!window.CSPSolver || typeof window.CSPSolver.solveResourcePlanningProblem !== 'function') {
            throw new Error('AI CSP Solver engine not loaded. Please refresh the page.');
        }

        // Solve CSP using our custom algorithm / benchmark
        const result = window.CSPSolver.solveResourcePlanningProblem(
            requiredResources,
            budget,
            minimumCondition,
            availableResources,
            mode
        );
        
        currentPlanResult = result;
        
        displayPlannerResults(result);
        displayAIExplanation(result);

        // Smoothly scroll down to results section so the user immediately sees the output
        const resultsSection = document.getElementById('plannerResults');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (err) {
        console.error('Error in handlePlannerSubmit:', err);
        alert('Error finding combination: ' + (err.message || 'Unknown error occurred.'));
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
}

// Helper: Add resource chip to the requirements textarea
window.addPlannerChip = function(resourceName) {
    const textarea = document.getElementById('requiredResources');
    if (!textarea) return;
    const current = textarea.value.trim();
    const lines = current ? current.split('\n').map(l => l.trim()).filter(Boolean) : [];
    if (!lines.includes(resourceName)) {
        lines.push(resourceName);
        textarea.value = lines.join('\n');
    }
    textarea.focus();
};

// Helper: Quick-fill sample requirements for fast one-click testing
window.fillSamplePlan = function() {
    const textarea = document.getElementById('requiredResources');
    const budgetInput = document.getElementById('budget');
    const conditionSelect = document.getElementById('minimumCondition');

    if (textarea) textarea.value = "DBMS Book\nJava Book\nCalculator";
    if (budgetInput) budgetInput.value = "1500";
    if (conditionSelect) conditionSelect.value = "Good";

    // Auto submit form
    const form = document.getElementById('plannerForm');
    if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true }));
    }
};

function escapeHtml(text) {
    if (typeof text !== 'string') return text || '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Display planner results and comparison table
function displayPlannerResults(result) {
    const resultsSection = document.getElementById('plannerResults');
    const solutionDisplay = document.getElementById('solutionDisplay');
    const benchmarkContainer = document.getElementById('benchmarkDisplay');
    const savePlanBtn = document.getElementById('savePlanBtn');
    const viewStepsBtn = document.getElementById('viewStepsBtn');
    
    resultsSection.style.display = 'block';
    
    // Render Benchmark Comparison Table whenever benchmark data exists
    if (result.benchmark && benchmarkContainer) {
        renderBenchmarkTable(result.benchmark, benchmarkContainer);
    } else if (benchmarkContainer) {
        benchmarkContainer.style.display = 'none';
    }
    
    if (!result.success) {
        solutionDisplay.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 2rem; border-radius: 8px; background: #fff5f5; border: 1px solid #fed7d7;">
                <h3 style="color: #c53030; margin-bottom: 0.5rem;">⚠️ No Valid Combination Found</h3>
                <p style="color: #4a5568; margin-bottom: 0.5rem;"><strong>${escapeHtml(result.error || 'Could not find a valid combination within your constraints.')}</strong></p>
                <p style="color: #718096; font-size: 0.9rem;">Recommendation: Try increasing your budget (current: ₹${result.budget || 0}) or lowering your minimum condition requirement (current: ${escapeHtml(result.minimumCondition || 'Any')}).</p>
            </div>
        `;
        if (savePlanBtn) savePlanBtn.style.display = 'none';
        if (viewStepsBtn) {
            viewStepsBtn.style.display = (result.steps && result.steps.length > 0) ? 'inline-flex' : 'none';
        }
        return;
    }
    
    if (savePlanBtn) savePlanBtn.style.display = 'inline-flex';
    if (viewStepsBtn) viewStepsBtn.style.display = 'inline-flex';
    
    // Render Selected Solution
    let solutionHTML = '<div class="solution-items">';
    
    for (const [variable, resource] of Object.entries(result.solution)) {
        const priceDisplay = resource.listing_type === 'Donate' ? 'Free' : `₹${resource.price}`;
        const sellerName = resource.profiles?.name || resource.seller_name || 'Seller';
        
        solutionHTML += `
            <div class="solution-item">
                <div class="solution-resource">
                    <h4>${escapeHtml(variable)}</h4>
                    <p>${escapeHtml(resource.title)}</p>
                    <p style="font-size: 0.875rem; color: #6b7280;">Condition: ${escapeHtml(resource.condition)} | Seller: ${escapeHtml(sellerName)}</p>
                </div>
                <div class="solution-price">${priceDisplay}</div>
            </div>
        `;
    }
    
    solutionHTML += '</div>';
    
    solutionHTML += `
        <div class="solution-summary">
            <div class="summary-row">
                <span class="summary-label">Total Cost:</span>
                <span class="summary-value">₹${result.totalCost}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Budget:</span>
                <span class="summary-value">₹${result.budget}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Remaining:</span>
                <span class="summary-value ${result.remainingBudget >= 0 ? 'success' : ''}">₹${result.remainingBudget}</span>
            </div>
            <div class="summary-row">
                <span class="summary-label">Minimum Condition:</span>
                <span class="summary-value">${escapeHtml(result.minimumCondition)}</span>
            </div>
        </div>
    `;
    
    solutionDisplay.innerHTML = solutionHTML;
}

// Render side-by-side benchmark table
function renderBenchmarkTable(benchmark, container) {
    container.style.display = 'block';
    
    const rowsHTML = benchmark.summary.map((row, idx) => {
        const isBest = idx === 2; // FC + MRV
        return `
            <tr class="${isBest ? 'benchmark-row-best' : ''}">
                <td>
                    <strong>${row.name}</strong>
                    ${isBest ? ' <span class="badge-optimal">★ Most Efficient</span>' : ''}
                </td>
                <td><span class="metric-pill">${row.nodes}</span></td>
                <td><span class="metric-pill ${row.backtracks === 0 ? 'metric-zero' : ''}">${row.backtracks}</span></td>
                <td><span class="metric-pill metric-pruned">${row.prunings}</span></td>
                <td>${row.time} ms</td>
                <td><span class="status-badge ${row.success ? 'status-accepted' : 'status-rejected'}">${row.success ? 'Solved (₹' + row.cost + ')' : 'Failed'}</span></td>
            </tr>
        `;
    }).join('');

    const savedBacktracks = benchmark.summary[0].backtracks - benchmark.summary[2].backtracks;
    const efficiencyPercent = benchmark.summary[0].nodes > 0 
        ? Math.round(((benchmark.summary[0].nodes - benchmark.summary[2].nodes) / benchmark.summary[0].nodes) * 100)
        : 0;

    container.innerHTML = `
        <div class="benchmark-card">
            <div class="benchmark-header">
                <div>
                    <h4>🔬 Unit-III Algorithm Comparison & Evaluation</h4>
                    <p class="benchmark-subtitle">Constraint Propagation (Forward Checking) vs Heuristics (MRV/LCV) vs Standard Backtracking</p>
                </div>
                <span class="algorithm-badge">FOAI Benchmark</span>
            </div>
            
            <div class="benchmark-table-wrapper">
                <table class="benchmark-table">
                    <thead>
                        <tr>
                            <th>Algorithm</th>
                            <th>Nodes Explored</th>
                            <th>Backtracks</th>
                            <th>Domains Pruned (FC)</th>
                            <th>Exec Time</th>
                            <th>Result</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>

            <div class="benchmark-insight-box">
                <div class="insight-icon">💡</div>
                <div class="insight-text">
                    <strong>Viva / Exam Insight:</strong> 
                    Forward Checking (Constraint Propagation) prunes invalid domain values ahead of time. 
                    Adding the <strong>Minimum Remaining Values (MRV)</strong> heuristic applies the <em>fail-first principle</em>, 
                    reducing search space by <strong>${Math.max(0, efficiencyPercent)}%</strong> and eliminating 
                    <strong>${Math.max(0, savedBacktracks)} backtrack(s)</strong> compared to standard backtracking!
                </div>
            </div>
        </div>
    `;
}

// Display AI explanation
function displayAIExplanation(result) {
    const aiExplanation = document.getElementById('aiExplanation');
    if (!aiExplanation) return;
    
    if (!result.variables || !result.domains) {
        aiExplanation.style.display = 'none';
        return;
    }
    
    aiExplanation.style.display = 'block';
    
    document.getElementById('variablesExplanation').textContent = 
        `Variables (${result.variables.length}): ${result.variables.join(', ')}`;
    
    let domainsText = '';
    for (const [variable, resources] of Object.entries(result.domains)) {
        domainsText += `${variable}: ${resources.length} valid item(s) | `;
    }
    document.getElementById('domainsExplanation').textContent = domainsText.replace(/\|\s*$/, '');
    
    const constraintsList = document.getElementById('constraintsExplanation');
    constraintsList.innerHTML = `
        <li><strong>Budget Constraint:</strong> Total cost $\\le$ ₹${result.budget}</li>
        <li><strong>Condition Constraint:</strong> Grade $\\ge$ ${result.minimumCondition}</li>
        <li><strong>Availability Constraint:</strong> Item status == 'Available'</li>
        <li><strong>Uniqueness Constraint:</strong> $Resource_i \\neq Resource_j$ (No duplicate purchases)</li>
    `;
    
    if (result.success) {
        document.getElementById('backtrackingExplanation').textContent = 
            `${result.algorithmName} traversed ${result.nodesExplored} search node(s) with ${result.backtracks} backtrack(s) and pruned ${result.prunings || 0} dead-end domain value(s).`;
        
        document.getElementById('solutionExplanation').textContent = 
            `Valid optimal combination found in ${result.executionTimeMs} ms with total cost ₹${result.totalCost} (Savings: ₹${result.remainingBudget}).`;
    } else {
        document.getElementById('backtrackingExplanation').textContent = 
            `Search space exhausted: The solver traversed ${result.nodesExplored || 0} node(s) and performed ${result.backtracks || 0} backtrack(s) with ${result.prunings || 0} domain pruning(s).`;
        
        document.getElementById('solutionExplanation').textContent = 
            `No valid assignment satisfied all constraints simultaneously within budget ₹${result.budget} and condition ${result.minimumCondition}.`;
    }
}

// Display algorithm steps
function displayAlgorithmSteps() {
    const stepsSection = document.getElementById('algorithmSteps');
    const stepsDisplay = document.getElementById('stepsDisplay');
    
    if (!currentPlanResult || !currentPlanResult.steps) {
        alert('No algorithm steps to display. Please run the planner first.');
        return;
    }
    
    stepsSection.style.display = 'block';
    
    let stepsHTML = '';
    
    for (const step of currentPlanResult.steps) {
        let stepClass = '';
        let prefixBadge = '';
        
        switch (step.type) {
            case 'valid':
                stepClass = 'success';
                prefixBadge = '<span class="step-badge badge-valid">VALID</span>';
                break;
            case 'invalid':
                stepClass = 'error';
                prefixBadge = '<span class="step-badge badge-invalid">FAIL</span>';
                break;
            case 'backtrack':
                stepClass = 'backtrack';
                prefixBadge = '<span class="step-badge badge-backtrack">BACKTRACK</span>';
                break;
            case 'pruning':
                stepClass = 'prune';
                prefixBadge = '<span class="step-badge badge-prune">FC PRUNE</span>';
                break;
            case 'fc_wipeout':
                stepClass = 'error';
                prefixBadge = '<span class="step-badge badge-wipeout">DEAD-END</span>';
                break;
            case 'select_variable':
                prefixBadge = '<span class="step-badge badge-select">SELECT</span>';
                break;
            default:
                prefixBadge = '<span class="step-badge">STEP</span>';
        }
        
        stepsHTML += `
            <div class="step-entry ${stepClass}">
                ${prefixBadge} ${escapeHtml(step.message)}
                ${step.currentTotal ? `<br><small style="color: #4b5563;">Current Subtotal: ₹${step.currentTotal}</small>` : ''}
            </div>
        `;
    }
    
    stepsDisplay.innerHTML = stepsHTML;
}

// Save current plan to Firestore
async function savePlan() {
    if (!currentPlanResult || !currentPlanResult.success) {
        alert('No valid plan to save. Please run the planner first.');
        return;
    }
    
    const user = await checkAuth();
    if (!user) {
        alert('You must be logged in to save plans.');
        return;
    }
    
    try {
        const items = [];
        for (const [variable, resource] of Object.entries(currentPlanResult.solution)) {
            items.push({
                variable: variable,
                resource_id: resource.id,
                resource_title: resource.title,
                price: resource.price,
                condition: resource.condition
            });
        }

        await window.firebaseDb.collection('planner_history').add({
            user_id: user.uid,
            algorithm_used: currentPlanResult.algorithmName,
            budget: currentPlanResult.budget,
            minimum_condition: currentPlanResult.minimumCondition,
            total_cost: currentPlanResult.totalCost,
            remaining_budget: currentPlanResult.remainingBudget,
            items: items,
            created_at: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Plan saved successfully!');
        
    } catch (error) {
        console.error('Error saving plan:', error);
        alert('Failed to save plan. Please try again.');
    }
}

// Initialize planner
function initPlanner() {
    const plannerForm = document.getElementById('plannerForm');
    if (plannerForm) {
        plannerForm.addEventListener('submit', handlePlannerSubmit);
    }
    
    const savePlanBtn = document.getElementById('savePlanBtn');
    if (savePlanBtn) {
        savePlanBtn.addEventListener('click', savePlan);
    }
    
    const viewStepsBtn = document.getElementById('viewStepsBtn');
    if (viewStepsBtn) {
        viewStepsBtn.addEventListener('click', displayAlgorithmSteps);
    }
    
    const closeStepsBtn = document.getElementById('closeStepsBtn');
    if (closeStepsBtn) {
        closeStepsBtn.addEventListener('click', () => {
            document.getElementById('algorithmSteps').style.display = 'none';
        });
    }
}

// Initialize on page load
function initPlannerModule() {
    if (document.getElementById('plannerForm')) {
        initPlanner();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlannerModule);
} else {
    initPlannerModule();
}
