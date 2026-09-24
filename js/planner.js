// ============================================
// SMART RESOURCE PLANNER MODULE (FIREBASE)
// ============================================

// Current planner state
let currentPlanResult = null;
let currentPlanRequirements = null;

// Handle planner form submission
async function handlePlannerSubmit(event) {
    event.preventDefault();
    
    const requiredResourcesText = document.getElementById('requiredResources').value;
    const budget = parseFloat(document.getElementById('budget').value);
    const minimumCondition = document.getElementById('minimumCondition').value;
    
    // Parse required resources
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
        minimumCondition
    };
    
    // Fetch available resources from Firestore
    const availableResources = await fetchResources();
    
    if (availableResources.length === 0) {
        alert('No resources available in the marketplace.');
        return;
    }
    
    // Solve CSP using our custom algorithm
    const result = window.CSPSolver.solveResourcePlanningProblem(
        requiredResources,
        budget,
        minimumCondition,
        availableResources
    );
    
    currentPlanResult = result;
    
    displayPlannerResults(result);
    displayAIExplanation(result);
}

// Display planner results
function displayPlannerResults(result) {
    const resultsSection = document.getElementById('plannerResults');
    const solutionDisplay = document.getElementById('solutionDisplay');
    
    if (!result.success) {
        resultsSection.style.display = 'block';
        solutionDisplay.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 2rem;">
                <h3>No Solution Found</h3>
                <p>${result.error || 'Could not find a valid combination within your constraints.'}</p>
                <p>Try increasing your budget or lowering your minimum condition requirement.</p>
            </div>
        `;
        return;
    }
    
    resultsSection.style.display = 'block';
    
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

// Display AI explanation
function displayAIExplanation(result) {
    const aiExplanation = document.getElementById('aiExplanation');
    
    if (!result.success) {
        aiExplanation.style.display = 'none';
        return;
    }
    
    aiExplanation.style.display = 'block';
    
    document.getElementById('variablesExplanation').textContent = 
        `Variables: ${result.variables.join(', ')}`;
    
    let domainsText = '';
    for (const [variable, resources] of Object.entries(result.domains)) {
        domainsText += `${variable}: ${resources.length} option(s) | `;
    }
    document.getElementById('domainsExplanation').textContent = domainsText.replace(/\|\s*$/, '');
    
    const constraintsList = document.getElementById('constraintsExplanation');
    constraintsList.innerHTML = `
        <li>Total cost must be within budget (₹${result.budget})</li>
        <li>Resource condition must be at least ${result.minimumCondition}</li>
        <li>Resource must be available</li>
        <li>No duplicate resources</li>
    `;
    
    document.getElementById('backtrackingExplanation').textContent = 
        `Algorithm explored ${result.steps.length} steps using backtracking search to find valid assignments.`;
    
    document.getElementById('solutionExplanation').textContent = 
        `Found valid combination with total cost ₹${result.totalCost}, remaining budget ₹${result.remainingBudget}.`;
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
        
        switch (step.type) {
            case 'valid':
                stepClass = 'success';
                break;
            case 'invalid':
                stepClass = 'error';
                break;
            case 'backtrack':
                stepClass = 'backtrack';
                break;
        }
        
        stepsHTML += `
            <div class="step-entry ${stepClass}">
                ${escapeHtml(step.message)}
                ${step.currentTotal ? `<br>Current Total: ₹${step.currentTotal}` : ''}
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
