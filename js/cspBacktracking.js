// ============================================
// CSP + INFERENCE & SEARCH ALGORITHMS (UNIT-III)
// Features:
// 1. Simple Backtracking (Baseline Standard)
// 2. Backtracking with Forward Checking (Constraint Propagation)
// 3. Backtracking with FC + MRV (Fail-First) + LCV (Least Constraining Value)
// 4. Side-by-Side Algorithm Comparison Benchmarker
// 5. Node Consistency (Unary Constraint Pre-filtering)
// ============================================

// Condition ranking for comparison
var CONDITION_RANKING = window.CONDITION_RANKING || {
    'New': 5,
    'Like New': 4,
    'Good': 3,
    'Fair': 2,
    'Poor': 1
};
window.CONDITION_RANKING = CONDITION_RANKING;

function getConditionRank(condition) {
    return CONDITION_RANKING[condition] || 0;
}

function meetsConditionRequirement(resourceCondition, minimumCondition) {
    return getConditionRank(resourceCondition) >= getConditionRank(minimumCondition);
}

function calculateTotalCost(assignment) {
    let total = 0;
    for (const value of Object.values(assignment)) {
        total += (value.price || 0);
    }
    return total;
}

function calculateRemainingBudget(assignment, budget) {
    return budget - calculateTotalCost(assignment);
}

// Deep clone domains
function cloneDomains(domains) {
    const clone = {};
    for (const [key, list] of Object.entries(domains)) {
        clone[key] = [...list];
    }
    return clone;
}

// Check validity of assigning variable = value given current assignment and constraints
function isValidAssignment(currentAssignment, variable, value, budget, minimumCondition) {
    // Budget Constraint
    const cost = calculateTotalCost(currentAssignment) + (value.price || 0);
    if (cost > budget) {
        return { valid: false, reason: `Budget exceeded: ₹${cost} > ₹${budget}` };
    }
    // Condition Constraint
    if (!meetsConditionRequirement(value.condition, minimumCondition)) {
        return { valid: false, reason: `Condition failed: ${value.condition} < ${minimumCondition}` };
    }
    // Availability Constraint
    if (value.availability !== 'Available') {
        return { valid: false, reason: `Resource status: ${value.availability}` };
    }
    // Uniqueness / AllDifferent Constraint (no duplicate resources)
    for (const assigned of Object.values(currentAssignment)) {
        if (assigned.id === value.id) {
            return { valid: false, reason: `Duplicate resource: ${value.title}` };
        }
    }
    return { valid: true };
}

// ============================================
// NODE CONSISTENCY (UNARY CONSTRAINT PRE-FILTERING)
// ============================================

function applyNodeConsistency(domains, budget, minimumCondition) {
    const filtered = {};
    let prunedCount = 0;
    for (const [variable, list] of Object.entries(domains)) {
        filtered[variable] = [];
        for (const item of list) {
            const conditionOk = meetsConditionRequirement(item.condition, minimumCondition);
            const availabilityOk = (item.availability === 'Available');
            const priceOk = (item.price || 0) <= budget;

            if (conditionOk && availabilityOk && priceOk) {
                filtered[variable].push(item);
            } else {
                prunedCount++;
            }
        }
    }
    return { filteredDomains: filtered, prunedCount };
}

// ============================================
// 1. SIMPLE BACKTRACKING (BASELINE)
// ============================================

function solveSimpleBacktracking(variables, initialDomains, budget, minimumCondition) {
    const startTime = performance.now();
    const steps = [];
    const assignment = {};
    let nodesExplored = 0;
    let backtracks = 0;

    function search() {
        if (Object.keys(assignment).length === variables.length) {
            return true;
        }

        // Static variable ordering (first unassigned)
        const unassignedVar = variables.find(v => !(v in assignment));
        const domain = initialDomains[unassignedVar] || [];

        steps.push({
            type: 'select_variable',
            algorithm: 'Simple Backtracking',
            variable: unassignedVar,
            message: `[Simple BT] Selected variable: ${unassignedVar} (Static Order)`
        });

        for (const value of domain) {
            nodesExplored++;
            steps.push({
                type: 'try_value',
                variable: unassignedVar,
                value: value.title,
                message: `Trying ${unassignedVar} = ${value.title} (₹${value.price}, ${value.condition})`
            });

            const check = isValidAssignment(assignment, unassignedVar, value, budget, minimumCondition);
            if (check.valid) {
                assignment[unassignedVar] = value;
                steps.push({
                    type: 'valid',
                    variable: unassignedVar,
                    value: value.title,
                    message: `✓ Valid assignment: ${unassignedVar} = ${value.title}`,
                    currentTotal: calculateTotalCost(assignment)
                });

                if (search()) {
                    return true;
                }

                // Backtrack
                backtracks++;
                steps.push({
                    type: 'backtrack',
                    variable: unassignedVar,
                    value: value.title,
                    message: `↩ Backtracking: Removing ${unassignedVar} = ${value.title}`
                });
                delete assignment[unassignedVar];
            } else {
                steps.push({
                    type: 'invalid',
                    variable: unassignedVar,
                    value: value.title,
                    reason: check.reason,
                    message: `✗ Invalid: ${check.reason}`
                });
            }
        }

        return false;
    }

    const success = search();
    const duration = performance.now() - startTime;

    return {
        algorithmName: 'Simple Backtracking (Standard)',
        success,
        solution: success ? { ...assignment } : null,
        steps,
        nodesExplored,
        backtracks,
        prunings: 0,
        executionTimeMs: Math.max(0.1, Number(duration.toFixed(2))),
        totalCost: calculateTotalCost(assignment),
        remainingBudget: calculateRemainingBudget(assignment, budget)
    };
}

// ============================================
// 2. BACKTRACKING WITH FORWARD CHECKING (INFERENCE)
// ============================================

function solveForwardChecking(variables, initialDomains, budget, minimumCondition) {
    const startTime = performance.now();
    const steps = [];
    const assignment = {};
    let nodesExplored = 0;
    let backtracks = 0;
    let prunings = 0;
    const currentDomains = cloneDomains(initialDomains);

    function forwardCheck(varJustAssigned, valJustAssigned) {
        const remainingBudget = budget - calculateTotalCost(assignment);
        const pruned = {};

        for (const otherVar of variables) {
            if (!(otherVar in assignment)) {
                pruned[otherVar] = [];
                const newDomain = [];

                for (const item of currentDomains[otherVar]) {
                    const exceedsBudget = (item.price || 0) > remainingBudget;
                    const isDuplicate = item.id === valJustAssigned.id;
                    const conditionFails = !meetsConditionRequirement(item.condition, minimumCondition);

                    if (exceedsBudget || isDuplicate || conditionFails) {
                        pruned[otherVar].push(item);
                        prunings++;
                    } else {
                        newDomain.push(item);
                    }
                }

                currentDomains[otherVar] = newDomain;

                if (pruned[otherVar].length > 0) {
                    steps.push({
                        type: 'pruning',
                        variable: otherVar,
                        prunedCount: pruned[otherVar].length,
                        message: `🔍 [FC Inference] Pruned ${pruned[otherVar].length} invalid item(s) from domain of '${otherVar}' (Remaining Budget: ₹${remainingBudget})`
                    });
                }

                // If domain wiped out, fail immediately
                if (currentDomains[otherVar].length === 0) {
                    steps.push({
                        type: 'fc_wipeout',
                        variable: otherVar,
                        message: `⚠️ [FC Dead-End Detected] Domain of '${otherVar}' became empty! Immediate backtrack triggered.`
                    });
                    return { ok: false, pruned };
                }
            }
        }

        return { ok: true, pruned };
    }

    function restorePruned(pruned) {
        for (const [varName, removedItems] of Object.entries(pruned)) {
            currentDomains[varName].push(...removedItems);
        }
    }

    function search() {
        if (Object.keys(assignment).length === variables.length) {
            return true;
        }

        const unassignedVar = variables.find(v => !(v in assignment));
        const domain = [...currentDomains[unassignedVar]];

        steps.push({
            type: 'select_variable',
            algorithm: 'Forward Checking',
            variable: unassignedVar,
            message: `[FC] Selected variable: ${unassignedVar} (Domain size: ${domain.length})`
        });

        for (const value of domain) {
            nodesExplored++;
            steps.push({
                type: 'try_value',
                variable: unassignedVar,
                value: value.title,
                message: `Trying ${unassignedVar} = ${value.title} (₹${value.price})`
            });

            // Validate assignment
            const check = isValidAssignment(assignment, unassignedVar, value, budget, minimumCondition);
            if (!check.valid) {
                steps.push({
                    type: 'invalid',
                    variable: unassignedVar,
                    value: value.title,
                    reason: check.reason,
                    message: `✗ Invalid: ${check.reason}`
                });
                continue;
            }

            assignment[unassignedVar] = value;
            steps.push({
                type: 'valid',
                variable: unassignedVar,
                value: value.title,
                message: `✓ [FC] Assigned ${unassignedVar} = ${value.title} (Subtotal: ₹${calculateTotalCost(assignment)})`,
                currentTotal: calculateTotalCost(assignment)
            });

            // Perform Forward Checking inference on remaining variables
            const fcResult = forwardCheck(unassignedVar, value);

            if (fcResult.ok) {
                if (search()) {
                    return true;
                }
            }

            // Restore domains on backtrack
            restorePruned(fcResult.pruned);
            backtracks++;
            steps.push({
                type: 'backtrack',
                variable: unassignedVar,
                value: value.title,
                message: `↩ [FC Backtrack] Undoing ${unassignedVar} = ${value.title} and restoring pruned options`
            });
            delete assignment[unassignedVar];
        }

        return false;
    }

    const success = search();
    const duration = performance.now() - startTime;

    return {
        algorithmName: 'Backtracking + Forward Checking',
        success,
        solution: success ? { ...assignment } : null,
        steps,
        nodesExplored,
        backtracks,
        prunings,
        executionTimeMs: Math.max(0.1, Number(duration.toFixed(2))),
        totalCost: calculateTotalCost(assignment),
        remainingBudget: calculateRemainingBudget(assignment, budget)
    };
}

// ============================================
// 3. BACKTRACKING + FORWARD CHECKING + MRV + LCV
// ============================================

function solveForwardCheckingMRVLCV(variables, initialDomains, budget, minimumCondition) {
    const startTime = performance.now();
    const steps = [];
    const assignment = {};
    let nodesExplored = 0;
    let backtracks = 0;
    let prunings = 0;
    const currentDomains = cloneDomains(initialDomains);

    // MRV (Minimum Remaining Values): Pick unassigned variable with smallest domain
    function selectMRVVariable() {
        let bestVar = null;
        let minDomainSize = Infinity;

        for (const v of variables) {
            if (!(v in assignment)) {
                const domainSize = currentDomains[v].length;
                if (domainSize < minDomainSize) {
                    minDomainSize = domainSize;
                    bestVar = v;
                }
            }
        }
        return { variable: bestVar, size: minDomainSize };
    }

    // LCV (Least Constraining Value): Sort values by lowest price (preserves maximum remaining budget for peers)
    function orderValuesLCV(domain) {
        return [...domain].sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    function forwardCheck(varJustAssigned, valJustAssigned) {
        const remainingBudget = budget - calculateTotalCost(assignment);
        const pruned = {};

        for (const otherVar of variables) {
            if (!(otherVar in assignment)) {
                pruned[otherVar] = [];
                const newDomain = [];

                for (const item of currentDomains[otherVar]) {
                    const exceedsBudget = (item.price || 0) > remainingBudget;
                    const isDuplicate = item.id === valJustAssigned.id;
                    const conditionFails = !meetsConditionRequirement(item.condition, minimumCondition);

                    if (exceedsBudget || isDuplicate || conditionFails) {
                        pruned[otherVar].push(item);
                        prunings++;
                    } else {
                        newDomain.push(item);
                    }
                }

                currentDomains[otherVar] = newDomain;

                if (pruned[otherVar].length > 0) {
                    steps.push({
                        type: 'pruning',
                        variable: otherVar,
                        prunedCount: pruned[otherVar].length,
                        message: `⚡ [MRV+FC] Pruned ${pruned[otherVar].length} item(s) from '${otherVar}' (Remaining: ${newDomain.length})`
                    });
                }

                if (currentDomains[otherVar].length === 0) {
                    steps.push({
                        type: 'fc_wipeout',
                        variable: otherVar,
                        message: `⛔ [Fail-First Pruning] Domain of '${otherVar}' depleted! Pruning branch immediately.`
                    });
                    return { ok: false, pruned };
                }
            }
        }

        return { ok: true, pruned };
    }

    function restorePruned(pruned) {
        for (const [varName, removedItems] of Object.entries(pruned)) {
            currentDomains[varName].push(...removedItems);
        }
    }

    function search() {
        if (Object.keys(assignment).length === variables.length) {
            return true;
        }

        // Apply MRV Heuristic
        const { variable: mrvVar, size } = selectMRVVariable();
        if (!mrvVar || size === 0) return false;

        steps.push({
            type: 'select_variable',
            algorithm: 'MRV + LCV + FC',
            variable: mrvVar,
            message: `🎯 [MRV Heuristic] Selected variable '${mrvVar}' with fewest remaining values (${size} options left)`
        });

        // Apply LCV Heuristic (least constraining values first)
        const orderedDomain = orderValuesLCV(currentDomains[mrvVar]);

        for (const value of orderedDomain) {
            nodesExplored++;
            steps.push({
                type: 'try_value',
                variable: mrvVar,
                value: value.title,
                message: `[LCV Choice] Trying ${mrvVar} = ${value.title} (Price: ₹${value.price})`
            });

            // Validate assignment
            const check = isValidAssignment(assignment, mrvVar, value, budget, minimumCondition);
            if (!check.valid) {
                steps.push({
                    type: 'invalid',
                    variable: mrvVar,
                    value: value.title,
                    reason: check.reason,
                    message: `✗ Invalid: ${check.reason}`
                });
                continue;
            }

            assignment[mrvVar] = value;
            steps.push({
                type: 'valid',
                variable: mrvVar,
                value: value.title,
                message: `✓ [Assigned] ${mrvVar} = ${value.title} (Subtotal: ₹${calculateTotalCost(assignment)})`,
                currentTotal: calculateTotalCost(assignment)
            });

            const fcResult = forwardCheck(mrvVar, value);

            if (fcResult.ok) {
                if (search()) {
                    return true;
                }
            }

            restorePruned(fcResult.pruned);
            backtracks++;
            steps.push({
                type: 'backtrack',
                variable: mrvVar,
                value: value.title,
                message: `↩ [Backtrack] Undoing ${mrvVar} = ${value.title}`
            });
            delete assignment[mrvVar];
        }

        return false;
    }

    const success = search();
    const duration = performance.now() - startTime;

    return {
        algorithmName: 'FC + MRV (Fail-First) + LCV',
        success,
        solution: success ? { ...assignment } : null,
        steps,
        nodesExplored,
        backtracks,
        prunings,
        executionTimeMs: Math.max(0.1, Number(duration.toFixed(2))),
        totalCost: calculateTotalCost(assignment),
        remainingBudget: calculateRemainingBudget(assignment, budget)
    };
}

// ============================================
// 4. BENCHMARK & COMPARISON ENGINE
// ============================================

function runAllAlgorithmsBenchmark(variables, domains, budget, minimumCondition) {
    const baseline = solveSimpleBacktracking(variables, domains, budget, minimumCondition);
    const forwardChecking = solveForwardChecking(variables, domains, budget, minimumCondition);
    const mrvLcvFC = solveForwardCheckingMRVLCV(variables, domains, budget, minimumCondition);

    return {
        baseline,
        forwardChecking,
        mrvLcvFC,
        summary: [
            {
                name: 'Simple Backtracking (Standard)',
                nodes: baseline.nodesExplored,
                backtracks: baseline.backtracks,
                prunings: baseline.prunings,
                time: baseline.executionTimeMs,
                cost: baseline.totalCost,
                success: baseline.success
            },
            {
                name: 'Backtracking + Forward Checking',
                nodes: forwardChecking.nodesExplored,
                backtracks: forwardChecking.backtracks,
                prunings: forwardChecking.prunings,
                time: forwardChecking.executionTimeMs,
                cost: forwardChecking.totalCost,
                success: forwardChecking.success
            },
            {
                name: 'FC + MRV (Fail-First) + LCV',
                nodes: mrvLcvFC.nodesExplored,
                backtracks: mrvLcvFC.backtracks,
                prunings: mrvLcvFC.prunings,
                time: mrvLcvFC.executionTimeMs,
                cost: mrvLcvFC.totalCost,
                success: mrvLcvFC.success
            }
        ]
    };
}

// ============================================
// DOMAIN GENERATION
// ============================================

const ACRONYM_MAP = {
    'dbms': ['database', 'dbms'],
    'database': ['dbms', 'database'],
    'calc': ['calculator', 'calc'],
    'calculator': ['calculator', 'calc'],
    'os': ['operating system', 'os'],
    'cn': ['computer network', 'computer networks', 'cn'],
    'ai': ['artificial intelligence', 'ai'],
    'foai': ['foundations of artificial intelligence', 'foai', 'ai'],
    'dsa': ['data structures', 'algorithms', 'dsa']
};

function generateDomains(requiredResources, availableResources) {
    const stopWords = new Set(['a', 'an', 'the', 'in', 'on', 'for', 'of', 'and', 'or', 'with', 'to', 'at', 'is', 'item', 'items']);
    const domains = {};
    
    for (const requiredResource of requiredResources) {
        const trimmedReq = requiredResource.trim();
        const lowerReq = trimmedReq.toLowerCase();
        const reqWords = lowerReq.split(/\s+/).filter(w => w.length > 0 && !stopWords.has(w));
        
        const matchingResources = availableResources.filter(resource => {
            const title = (resource.title || '').toLowerCase();
            const subject = (resource.subject || '').toLowerCase();
            const category = (resource.category || '').toLowerCase();
            const desc = (resource.description || '').toLowerCase();
            const fullText = `${title} ${subject} ${category} ${desc}`;
            
            // 1. Direct full-phrase substring match
            if (fullText.includes(lowerReq)) return true;
            
            // 2. All significant words match (allowing acronym expansion)
            if (reqWords.length > 0) {
                const allWordsMatch = reqWords.every(word => {
                    const variants = ACRONYM_MAP[word] || [word];
                    return variants.some(v => fullText.includes(v));
                });
                if (allWordsMatch) return true;
            }
            
            return false;
        });
        
        domains[trimmedReq] = matchingResources;
    }
    
    return domains;
}

// ============================================
// MAIN UNIFIED SOLVER
// ============================================

function solveResourcePlanningProblem(requiredResources, budget, minimumCondition, availableResources, mode = 'mrv') {
    const normalizedRequirements = requiredResources
        .map(r => r.trim())
        .filter(r => r.length > 0);
    
    if (normalizedRequirements.length === 0) {
        return { success: false, error: 'No required resources specified' };
    }
    
    if (availableResources.length === 0) {
        return { success: false, error: 'No available resources in marketplace' };
    }
    
    const rawDomains = generateDomains(normalizedRequirements, availableResources);
    
    // Check if any variable has 0 matching resources in the database
    for (const variable of normalizedRequirements) {
        if (!rawDomains[variable] || rawDomains[variable].length === 0) {
            return {
                success: false,
                error: `No matching resources found in marketplace for: "${variable}"`,
                variables: normalizedRequirements,
                domains: rawDomains,
                budget,
                minimumCondition
            };
        }
    }

    // Apply Node Consistency (Unary Constraints pre-filtering)
    const { filteredDomains, prunedCount } = applyNodeConsistency(rawDomains, budget, minimumCondition);

    // Check if any variable had its domain wiped out by unary constraints
    for (const variable of normalizedRequirements) {
        if (filteredDomains[variable].length === 0) {
            let benchmark = null;
            if (mode === 'benchmark') {
                benchmark = runAllAlgorithmsBenchmark(normalizedRequirements, rawDomains, budget, minimumCondition);
            }
            return {
                success: false,
                error: `No items matching "${variable}" satisfy the minimum condition (≥ ${minimumCondition}) and budget limit (≤ ₹${budget}).`,
                variables: normalizedRequirements,
                domains: rawDomains,
                budget,
                minimumCondition,
                benchmark
            };
        }
    }
    
    // Run all algorithms to compare and select optimal result with benchmark data
    const benchmark = runAllAlgorithmsBenchmark(normalizedRequirements, filteredDomains, budget, minimumCondition);
    let result;
    if (mode === 'simple') {
        result = { ...benchmark.baseline };
    } else if (mode === 'fc') {
        result = { ...benchmark.forwardChecking };
    } else {
        // Default: MRV + LCV + Forward Checking (Unit-III Most Efficient Algorithm)
        result = benchmark.mrvLcvFC.success 
            ? { ...benchmark.mrvLcvFC } 
            : (benchmark.forwardChecking.success ? { ...benchmark.forwardChecking } : { ...benchmark.baseline });
    }
    result.benchmark = benchmark;
    if (!result.success) {
        result.error = `Could not find a valid combination within your budget of ₹${budget}. Total minimum cost exceeds your budget or required conditions cannot be met.`;
    }
    
    return {
        ...result,
        budget,
        minimumCondition,
        variables: normalizedRequirements,
        domains: filteredDomains
    };
}

// Global Export
window.CSPSolver = {
    solveResourcePlanningProblem,
    solveSimpleBacktracking,
    solveForwardChecking,
    solveForwardCheckingMRVLCV,
    runAllAlgorithmsBenchmark,
    generateDomains,
    applyNodeConsistency,
    getConditionRank,
    meetsConditionRequirement
};
