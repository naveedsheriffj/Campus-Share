// ============================================
// CSP + BACKTRACKING SEARCH ALGORITHM
// ============================================

// Condition ranking for comparison
const CONDITION_RANKING = {
    'New': 5,
    'Like New': 4,
    'Good': 3,
    'Fair': 2,
    'Poor': 1
};

// Get condition rank
function getConditionRank(condition) {
    return CONDITION_RANKING[condition] || 0;
}

// Check if condition meets minimum requirement
function meetsConditionRequirement(resourceCondition, minimumCondition) {
    return getConditionRank(resourceCondition) >= getConditionRank(minimumCondition);
}

// ============================================
// CSP REPRESENTATION
// ============================================

class CSP {
    constructor(variables, domains, constraints) {
        this.variables = variables; // Array of variable names
        this.domains = domains; // Object mapping variable -> array of possible values
        this.constraints = constraints; // Constraint function
        this.assignment = {}; // Current assignment
        this.steps = []; // Algorithm steps for visualization
    }
}

// ============================================
// CONSTRAINT FUNCTIONS
// ============================================

function createConstraints(budget, minimumCondition) {
    return function(assignment, variable, value, allResources) {
        // Constraint 1: Budget constraint
        let totalCost = 0;
        for (const [varName, assignedValue] of Object.entries(assignment)) {
            totalCost += assignedValue.price;
        }
        totalCost += value.price;
        
        if (totalCost > budget) {
            return { valid: false, reason: `Budget exceeded: ₹${totalCost} > ₹${budget}` };
        }
        
        // Constraint 2: Condition constraint
        if (!meetsConditionRequirement(value.condition, minimumCondition)) {
            return { 
                valid: false, 
                reason: `Condition constraint failed: ${value.condition} < ${minimumCondition}` 
            };
        }
        
        // Constraint 3: Availability constraint
        if (value.availability !== 'Available') {
            return { valid: false, reason: `Resource not available: ${value.availability}` };
        }
        
        // Constraint 4: No duplicate resources
        for (const [varName, assignedValue] of Object.entries(assignment)) {
            if (assignedValue.id === value.id) {
                return { valid: false, reason: `Duplicate resource: ${value.title}` };
            }
        }
        
        return { valid: true };
    };
}

// ============================================
// BACKTRACKING SEARCH ALGORITHM
// ============================================

function solveCSP(variables, domains, constraints, allResources) {
    const csp = new CSP(variables, domains, constraints);
    csp.steps = [];
    
    const result = backtrack(csp, allResources);
    
    return {
        solution: result.assignment,
        steps: csp.steps,
        success: result.success,
        totalCost: calculateTotalCost(result.assignment),
        remainingBudget: calculateRemainingBudget(result.assignment, constraints.budget)
    };
}

function backtrack(csp, allResources) {
    // Check if assignment is complete
    if (isAssignmentComplete(csp)) {
        return { assignment: csp.assignment, success: true };
    }
    
    // Select unassigned variable
    const variable = selectUnassignedVariable(csp);
    csp.steps.push({
        type: 'select_variable',
        variable: variable,
        message: `Selected unassigned variable: ${variable}`
    });
    
    // Get domain for this variable
    const domain = csp.domains[variable] || [];
    
    // Try each value in the domain
    for (const value of domain) {
        csp.steps.push({
            type: 'try_value',
            variable: variable,
            value: value.title,
            price: value.price,
            condition: value.condition,
            message: `Trying ${variable} = ${value.title} (₹${value.price}, ${value.condition})`
        });
        
        // Check if assignment is valid
        const constraintResult = csp.constraints(
            csp.assignment, 
            variable, 
            value, 
            allResources
        );
        
        if (constraintResult.valid) {
            csp.steps.push({
                type: 'valid',
                variable: variable,
                value: value.title,
                message: `✓ Valid: ${variable} = ${value.title}`,
                currentTotal: calculateTotalCost({...csp.assignment, [variable]: value})
            });
            
            // Make assignment
            csp.assignment[variable] = value;
            
            // Recursively solve
            const result = backtrack(csp, allResources);
            
            if (result.success) {
                return result;
            }
            
            // Backtrack
            csp.steps.push({
                type: 'backtrack',
                variable: variable,
                value: value.title,
                message: `↩ Backtracking from ${variable} = ${value.title}`
            });
            
            delete csp.assignment[variable];
        } else {
            csp.steps.push({
                type: 'invalid',
                variable: variable,
                value: value.title,
                reason: constraintResult.reason,
                message: `✗ Invalid: ${constraintResult.reason}`
            });
        }
    }
    
    // No value worked, return failure
    csp.steps.push({
        type: 'failure',
        variable: variable,
        message: `No valid value found for ${variable}`
    });
    
    return { assignment: csp.assignment, success: false };
}

// ============================================
// CSP HELPER FUNCTIONS
// ============================================

function isAssignmentComplete(csp) {
    return csp.variables.every(variable => variable in csp.assignment);
}

function selectUnassignedVariable(csp) {
    // Simple heuristic: select first unassigned variable
    for (const variable of csp.variables) {
        if (!(variable in csp.assignment)) {
            return variable;
        }
    }
    return null;
}

function calculateTotalCost(assignment) {
    let total = 0;
    for (const value of Object.values(assignment)) {
        total += value.price;
    }
    return total;
}

function calculateRemainingBudget(assignment, budget) {
    return budget - calculateTotalCost(assignment);
}

// ============================================
// DOMAIN GENERATION
// ============================================

function generateDomains(requiredResources, availableResources) {
    const domains = {};
    
    for (const requiredResource of requiredResources) {
        // Find resources that match the required resource
        const matchingResources = availableResources.filter(resource => {
            const resourceTitle = resource.title.toLowerCase();
            const requiredTitle = requiredResource.toLowerCase();
            
            // Check if resource title contains required resource name
            return resourceTitle.includes(requiredTitle) || 
                   requiredTitle.includes(resourceTitle) ||
                   resourceTitle.includes(requiredTitle.split(' ')[0]);
        });
        
        domains[requiredResource] = matchingResources;
    }
    
    return domains;
}

// ============================================
// SOLUTION RANKING
// ============================================

function rankSolutions(solutions, budget) {
    if (solutions.length === 0) return null;
    
    // Sort solutions by:
    // 1. Lowest total cost
    // 2. Better condition (sum of condition ranks)
    // 3. Fewer sellers
    
    return solutions.sort((a, b) => {
        const costA = calculateTotalCost(a);
        const costB = calculateTotalCost(b);
        
        // Prefer lower cost
        if (costA !== costB) {
            return costA - costB;
        }
        
        // If costs are equal, prefer better condition
        const conditionA = Object.values(a).reduce((sum, r) => sum + getConditionRank(r.condition), 0);
        const conditionB = Object.values(b).reduce((sum, r) => sum + getConditionRank(r.condition), 0);
        
        if (conditionA !== conditionB) {
            return conditionB - conditionA;
        }
        
        // If conditions are equal, prefer fewer sellers
        const sellersA = new Set(Object.values(a).map(r => r.seller_id)).size;
        const sellersB = new Set(Object.values(b).map(r => r.seller_id)).size;
        
        return sellersA - sellersB;
    })[0];
}

// ============================================
// MULTIPLE SOLUTIONS (for demonstration)
// ============================================

function findAllSolutions(variables, domains, constraints, allResources, maxSolutions = 10) {
    const solutions = [];
    
    function backtrackAll(csp, allResources) {
        if (solutions.length >= maxSolutions) {
            return;
        }
        
        if (isAssignmentComplete(csp)) {
            solutions.push({...csp.assignment});
            return;
        }
        
        const variable = selectUnassignedVariable(csp);
        const domain = csp.domains[variable] || [];
        
        for (const value of domain) {
            const constraintResult = csp.constraints(
                csp.assignment, 
                variable, 
                value, 
                allResources
            );
            
            if (constraintResult.valid) {
                csp.assignment[variable] = value;
                backtrackAll(csp, allResources);
                delete csp.assignment[variable];
            }
        }
    }
    
    const csp = new CSP(variables, domains, constraints);
    backtrackAll(csp, allResources);
    
    return solutions;
}

// ============================================
// MAIN SOLVER FUNCTION
// ============================================

function solveResourcePlanningProblem(requiredResources, budget, minimumCondition, availableResources) {
    // Normalize required resources
    const normalizedRequirements = requiredResources
        .map(r => r.trim())
        .filter(r => r.length > 0);
    
    if (normalizedRequirements.length === 0) {
        return {
            success: false,
            error: 'No required resources specified'
        };
    }
    
    if (availableResources.length === 0) {
        return {
            success: false,
            error: 'No available resources'
        };
    }
    
    // Generate domains
    const domains = generateDomains(normalizedRequirements, availableResources);
    
    // Check if all variables have non-empty domains
    for (const variable of normalizedRequirements) {
        if (!domains[variable] || domains[variable].length === 0) {
            return {
                success: false,
                error: `No matching resources found for: ${variable}`
            };
        }
    }
    
    // Create constraints
    const constraints = createConstraints(budget, minimumCondition);
    constraints.budget = budget;
    
    // Solve CSP
    const result = solveCSP(normalizedRequirements, domains, constraints, availableResources);
    
    return {
        success: result.success,
        solution: result.solution,
        steps: result.steps,
        totalCost: result.totalCost,
        remainingBudget: result.remainingBudget,
        budget: budget,
        minimumCondition: minimumCondition,
        variables: normalizedRequirements,
        domains: domains
    };
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.CSPSolver = {
    solveResourcePlanningProblem,
    solveCSP,
    generateDomains,
    createConstraints,
    getConditionRank,
    meetsConditionRequirement
};
