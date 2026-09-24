// ============================================
// CSP + INFERENCE & SEARCH ALGORITHMS (UNIT-III)
// Features:
// 1. Simple Backtracking (Baseline)
// 2. Backtracking with Forward Checking (Constraint Propagation)
// 3. Backtracking with FC + MRV (Fail-First) + LCV (Least Constraining Value)
// 4. Side-by-Side Algorithm Comparison Benchmarker
// ============================================

// Condition ranking for comparison
const CONDITION_RANKING = {
    'New': 5,
    'Like New': 4,
    'Good': 3,
    'Fair': 2,
    'Poor': 1
};

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

// ============================================
// 1. SIMPLE BACKTRACKING (BASELINE)
// ============================================

function solveSimpleBacktracking(variables, initialDomains, budget, minimumCondition) {
    const startTime = performance.now();
    const steps = [];
    const assignment = {};
    let nodesExplored = 0;
    let backtracks = 0;

    function isValid(currentAssignment, variable, value) {
        // Budget
        let cost = calculateTotalCost(currentAssignment) + (value.price || 0);
        if (cost > budget) {
            return { valid: false, reason: `Budget exceeded: ₹${cost} > ₹${budget}` };
        }
        // Condition
        if (!meetsConditionRequirement(value.condition, minimumCondition)) {
            return { valid: false, reason: `Condition failed: ${value.condition} < ${minimumCondition}` };
        }
        // Availability
        if (value.availability !== 'Available') {
            return { valid: false, reason: `Resource status: ${value.availability}` };
        }
        // Duplicate resource
        for (const assigned of Object.values(currentAssignment)) {
            if (assigned.id === value.id) {
                return { valid: false, reason: `Duplicate resource: ${value.title}` };
            }
        }
        return { valid: true };
    }

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

            const check = isValid(assignment, unassignedVar, value);
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

    function forwardCheck(varJustAssigned, valJustAssigned, currentDomains) {
        const remainingBudget = budget - calculateTotalCost(assignment);
        const pruned = {};

        for (const otherVar of variables) {
            if (!(otherVar in assignment)) {
                pruned[otherVar] = [];
                const newDomain = [];

                for (const item of currentDomains[otherVar]) {
                    // Check if item exceeds remaining budget or has duplicate ID or fails condition
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

                // If domain wiped out, fail immediately!
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

    function restorePruned(currentDomains, pruned) {
        for (const [varName, removedItems] of Object.entries(pruned)) {
            currentDomains[varName].push(...removedItems);
        }
    }

    function search(domains) {
        if (Object.keys(assignment).length === variables.length) {
            return true;
        }

        const unassignedVar = variables.find(v => !(v in assignment));
        const domain = [...domains[unassignedVar]];

        steps.push({
            type: 'select_variable',
            algorithm: 'Forward Checking',
            variable: unassignedVar,
            message: `[FC] Selected variable: ${unassignedVar} (Domain size: ${domain.length})`
        });

        for (const value of domain) {
            nodesExplored++;
            assignment[unassignedVar] = value;

            steps.push({
                type: 'try_value',
                variable: unassignedVar,
                value: value.title,
                message: `[FC] Assigned ${unassignedVar} = ${value.title} (₹${value.price})`
            });

            // Perform Forward Checking inference on remaining variables
            const fcResult = forwardCheck(unassignedVar, value, domains);

            if (fcResult.ok) {
                if (search(domains)) {
                    return true;
                }
            }

            // Restore domains on backtrack
            restorePruned(domains, fcResult.pruned);
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

    const currentDomains = cloneDomains(initialDomains);
    const success = search(currentDomains);
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

    // MRV (Minimum Remaining Values): Pick unassigned variable with smallest domain
    function selectMRVVariable(domains) {
        let bestVar = null;
        let minDomainSize = Infinity;

        for (const v of variables) {
            if (!(v in assignment)) {
                const domainSize = domains[v].length;
                if (domainSize < minDomainSize) {
                    minDomainSize = domainSize;
                    bestVar = v;
                }
            }
        }
        return { variable: bestVar, size: minDomainSize };
    }

    // LCV (Least Constraining Value): Sort values by lowest price (preserves maximum remaining budget for peers)
    function orderValuesLCV(variable, domain) {
        return [...domain].sort((a, b) => (a.price || 0) - (b.price || 0));
    }

    function forwardCheck(varJustAssigned, valJustAssigned, currentDomains) {
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

    function restorePruned(currentDomains, pruned) {
        for (const [varName, removedItems] of Object.entries(pruned)) {
            currentDomains[varName].push(...removedItems);
        }
    }

    function search(domains) {
        if (Object.keys(assignment).length === variables.length) {
            return true;
        }

        // Apply MRV Heuristic
        const { variable: mrvVar, size } = selectMRVVariable(domains);
        if (!mrvVar) return true;

        steps.push({
            type: 'select_variable',
            algorithm: 'MRV + LCV + FC',
            variable: mrvVar,
            message: `🎯 [MRV Heuristic] Selected variable '${mrvVar}' with fewest remaining values (${size} options left)`
        });

        // Apply LCV Heuristic (least constraining values first)
        const orderedDomain = orderValuesLCV(mrvVar, domains[mrvVar]);

        for (const value of orderedDomain) {
            nodesExplored++;
            assignment[mrvVar] = value;

            steps.push({
                type: 'try_value',
                variable: mrvVar,
                value: value.title,
                message: `[LCV Choice] Trying ${mrvVar} = ${value.title} (Lowest Impact: ₹${value.price})`
            });

            const fcResult = forwardCheck(mrvVar, value, domains);

            if (fcResult.ok) {
                if (search(domains)) {
                    return true;
                }
            }

            restorePruned(domains, fcResult.pruned);
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

    const currentDomains = cloneDomains(initialDomains);
    const success = search(currentDomains);
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

function generateDomains(requiredResources, availableResources) {
    const domains = {};
    
    for (const requiredResource of requiredResources) {
        const requiredWords = requiredResource.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        
        const matchingResources = availableResources.filter(resource => {
            const title = (resource.title || '').toLowerCase();
            const subject = (resource.subject || '').toLowerCase();
            const category = (resource.category || '').toLowerCase();
            
            // Match whole title or any significant keyword
            return title.includes(requiredResource.toLowerCase()) ||
                   requiredWords.some(w => title.includes(w) || subject.includes(w) || category.includes(w));
        });
        
        domains[requiredResource] = matchingResources;
    }
    
    return domains;
}

// ============================================
// MAIN UNIFIED SOLVER
// ============================================

function solveResourcePlanningProblem(requiredResources, budget, minimumCondition, availableResources, mode = 'benchmark') {
    const normalizedRequirements = requiredResources
        .map(r => r.trim())
        .filter(r => r.length > 0);
    
    if (normalizedRequirements.length === 0) {
        return { success: false, error: 'No required resources specified' };
    }
    
    if (availableResources.length === 0) {
        return { success: false, error: 'No available resources in marketplace' };
    }
    
    const domains = generateDomains(normalizedRequirements, availableResources);
    
    for (const variable of normalizedRequirements) {
        if (!domains[variable] || domains[variable].length === 0) {
            return {
                success: false,
                error: `No matching resources found for: "${variable}"`
            };
        }
    }
    
    // Execute based on selected mode
    let result;
    if (mode === 'simple') {
        result = solveSimpleBacktracking(normalizedRequirements, domains, budget, minimumCondition);
    } else if (mode === 'fc') {
        result = solveForwardChecking(normalizedRequirements, domains, budget, minimumCondition);
    } else if (mode === 'mrv') {
        result = solveForwardCheckingMRVLCV(normalizedRequirements, domains, budget, minimumCondition);
    } else {
        // Benchmark mode (Runs all 3 and picks optimal)
        const benchmark = runAllAlgorithmsBenchmark(normalizedRequirements, domains, budget, minimumCondition);
        result = benchmark.mrvLcvFC.success ? benchmark.mrvLcvFC : (benchmark.forwardChecking.success ? benchmark.forwardChecking : benchmark.baseline);
        result.benchmark = benchmark;
    }
    
    return {
        ...result,
        budget,
        minimumCondition,
        variables: normalizedRequirements,
        domains
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
    getConditionRank,
    meetsConditionRequirement
};
