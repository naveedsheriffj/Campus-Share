// ============================================
// SMART RESOURCE PLANNER MODULE (FIREBASE)
// With Unit-III CSP Inference & Benchmark Visualizer
// ============================================

let currentPlanResult = null;
let currentPlanRequirements = null;

// Handle planner form submission
async function handlePlannerSubmit(event) {
    event.preventDefault();
    
    const requiredResourcesText = document.getElementById('requiredResources').value;
    const budget = parseFloat(document.getElementById('budget').value);
    const minimumCondition = document.getElementById('minimumCondition').value;
    const mode = document.getElementById('algorithmMode')?.value || 'benchmark';
    
    const requiredResources = requiredResourcesText
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    
    if (requiredResources.length === 0) {
        alert('Please enter at least one required resource.');
        return;
    }
    
    currentPlanRequirements = {
        requiredResources,
        budget,
        minimumCondition,
        mode
    };
    
    // Fetch available resources from Firestore
    const availableResources = await fetchResources();
    
    if (availableResources.length === 0) {
        alert('No resources available in the marketplace.');
        return;
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
}

// Display planner results and comparison table
function displayPlannerResults(result) {
    const resultsSection = document.getElementById('plannerResults');
    const solutionDisplay = document.getElementById('solutionDisplay');
    const benchmarkContainer = document.getElementById('benchmarkDisplay');
    
    if (!result.success) {
        resultsSection.style.display = 'block';
        solutionDisplay.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 2rem;">
                <h3>No Solution Found</h3>
                <p>${result.error || 'Could not find a valid combination within your constraints.'}</p>
                <p>Try increasing your budget or lowering your minimum condition requirement.</p>
            </div>
        `;
        if (benchmarkContainer) benchmarkContainer.style.display = 'none';
        return;
    }
    
    resultsSection.style.display = 'block';
    
    // Render Benchmark Comparison Table if available
    if (result.benchmark && benchmarkContainer) {
        renderBenchmarkTable(result.benchmark, benchmarkContainer);
    } else if (benchmarkContainer) {
        benchmarkContainer.style.display = 'none';
    }
    
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
    
    if (!result.success) {
        aiExplanation.style.display = 'none';
        return;
    }
    
    aiExplanation.style.display = 'block';
    
    document.getElementById('variablesExplanation').textContent = 
        `Variables (${result.variables.length}): ${result.variables.join(', ')}`;
    
    let domainsText = '';
    for (const [variable, resources] of Object.entries(result.domains)) {
        domainsText += `${variable}: ${resources.length} item(s) | `;
    }
    document.getElementById('domainsExplanation').textContent = domainsText.replace(/\|\s*$/, '');
    
    const constraintsList = document.getElementById('constraintsExplanation');
    constraintsList.innerHTML = `
        <li><strong>Budget Constraint:</strong> Total cost $\\le$ ₹${result.budget}</li>
        <li><strong>Condition Constraint:</strong> Grade $\\ge$ ${result.minimumCondition}</li>
        <li><strong>Availability Constraint:</strong> Item status == 'Available'</li>
        <li><strong>Uniqueness Constraint:</strong> $Resource_i \\neq Resource_j$ (No duplicate purchases)</li>
    `;
    
    document.getElementById('backtrackingExplanation').textContent = 
        `${result.algorithmName} traversed ${result.nodesExplored} search node(s) with ${result.backtracks} backtrack(s) and pruned ${result.prunings || 0} dead-end domain value(s).`;
    
    document.getElementById('solutionExplanation').textContent = 
        `Valid optimal combination found in ${result.executionTimeMs} ms with total cost ₹${result.totalCost} (Savings: ₹${result.remainingBudget}).`;
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
