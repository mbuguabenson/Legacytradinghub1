import {
    TApexDirection,
    TApexRegime,
    TDigitFrequency,
    TEntryDigitInfo,
    TMomentumDirection,
    TOverlappingDistribution,
    TScoreClassification,
    TStabilityClassification,
    TWindowDistribution,
} from './types';

/**
 * Normalizes quote and accurately extracts visible meaningful last digit.
 * Trims trailing zeros only after decimal point:
 * Example: 123.4500 -> 5
 * Example: 123.456  -> 6
 * Example: 123.00   -> 3
 */
export function extractMeaningfulLastDigit(
    quote: number | string,
    pipSize?: number
): { lastDigit: number; formattedPrice: string } {
    let rawStr = typeof quote === 'number' ? quote.toString() : String(quote || '0').trim();

    if (pipSize !== undefined && pipSize >= 0) {
        const num = Number(quote);
        if (!isNaN(num)) {
            rawStr = num.toFixed(pipSize);
        }
    }

    let processed = rawStr;
    if (processed.includes('.')) {
        processed = processed.replace(/0+$/, '');
        if (processed.endsWith('.')) {
            processed = processed.slice(0, -1);
        }
    }

    const cleanDigits = processed.replace(/[^0-9]/g, '');
    const lastChar = cleanDigits.slice(-1);
    const lastDigit = lastChar ? parseInt(lastChar, 10) : 0;

    const formattedPrice =
        typeof quote === 'number'
            ? pipSize !== undefined
                ? quote.toFixed(pipSize)
                : quote.toString()
            : String(quote);

    return {
        lastDigit: isNaN(lastDigit) ? 0 : lastDigit,
        formattedPrice,
    };
}

/**
 * Calculates Window A distribution (Under 0-4 vs Over 5-9)
 */
export function calculateWindowDistribution(digits: number[]): TWindowDistribution {
    const total = digits.length;
    if (total === 0) {
        return { underCount: 0, overCount: 0, underPct: 0, overPct: 0, total: 0 };
    }

    let underCount = 0;
    let overCount = 0;

    for (const d of digits) {
        if (d >= 0 && d <= 4) underCount++;
        else if (d >= 5 && d <= 9) overCount++;
    }

    return {
        underCount,
        overCount,
        underPct: Number(((underCount / total) * 100).toFixed(1)),
        overPct: Number(((overCount / total) * 100).toFixed(1)),
        total,
    };
}

/**
 * Calculates Window B execution distribution (Under 0-5 vs Over 4-9)
 * Note: Digit 4 is intentionally included in BOTH groups and does NOT total 100%.
 */
export function calculateOverlappingDistribution(digits: number[]): TOverlappingDistribution {
    const total = digits.length;
    if (total === 0) {
        return { under05Count: 0, under05Pct: 0, over49Count: 0, over49Pct: 0, total: 0 };
    }

    let under05Count = 0;
    let over49Count = 0;

    for (const d of digits) {
        if (d >= 0 && d <= 5) under05Count++;
        if (d >= 4 && d <= 9) over49Count++;
    }

    return {
        under05Count,
        under05Pct: Number(((under05Count / total) * 100).toFixed(1)),
        over49Count,
        over49Pct: Number(((over49Count / total) * 100).toFixed(1)),
        total,
    };
}

/**
 * Frequency counts for each individual digit 0-9
 */
export function calculateDigitFrequencies(digits: number[]): TDigitFrequency[] {
    const counts = Array(10).fill(0);
    const total = Math.max(digits.length, 1);

    for (const d of digits) {
        if (d >= 0 && d <= 9) {
            counts[d]++;
        }
    }

    return counts.map((count, digit) => ({
        digit,
        count,
        percentage: Number(((count / total) * 100).toFixed(1)),
    }));
}

/**
 * Recency weighted entry digit intelligence
 * Under eligible: [0, 1, 2, 3, 4, 5]
 * Over eligible:  [4, 5, 6, 7, 8, 9]
 * Weighting: 50 ticks = 20%, 25 ticks = 20%, 10 ticks = 30%, 7 ticks = 30%
 */
export function calculateWeightedEntryDigit(
    digits: number[],
    side: 'UNDER' | 'OVER'
): TEntryDigitInfo {
    const eligibleDigits = side === 'UNDER' ? [0, 1, 2, 3, 4, 5] : [4, 5, 6, 7, 8, 9];

    const ticks50 = digits.slice(-50);
    const ticks25 = digits.slice(-25);
    const ticks10 = digits.slice(-10);
    const ticks7 = digits.slice(-7);

    let bestDigit = eligibleDigits[0];
    let maxWeightedScore = -1;
    let bestFreq50 = 0;
    let bestFreqRecent = 0;
    let bestMomentum: 'RISING' | 'STABLE' | 'FALLING' = 'STABLE';

    for (const candidate of eligibleDigits) {
        const c50 = ticks50.filter(d => d === candidate).length;
        const c25 = ticks25.filter(d => d === candidate).length;
        const c10 = ticks10.filter(d => d === candidate).length;
        const c7 = ticks7.filter(d => d === candidate).length;

        const p50 = ticks50.length > 0 ? c50 / ticks50.length : 0;
        const p25 = ticks25.length > 0 ? c25 / ticks25.length : 0;
        const p10 = ticks10.length > 0 ? c10 / ticks10.length : 0;
        const p7 = ticks7.length > 0 ? c7 / ticks7.length : 0;

        // Formula: 20% * p50 + 20% * p25 + 30% * p10 + 30% * p7
        const weightedScore = 0.2 * p50 + 0.2 * p25 + 0.3 * p10 + 0.3 * p7;

        if (weightedScore > maxWeightedScore) {
            maxWeightedScore = weightedScore;
            bestDigit = candidate;
            bestFreq50 = c50;
            bestFreqRecent = c7;

            // Momentum of the digit: compare recent (p7 & p10) vs older (p50)
            const recentAvg = (p7 + p10) / 2;
            if (recentAvg > p50 + 0.05) bestMomentum = 'RISING';
            else if (recentAvg < p50 - 0.05) bestMomentum = 'FALLING';
            else bestMomentum = 'STABLE';
        }
    }

    // Confidence scaling: 0-100 based on weighted score compared to baseline expected (10%)
    const confidence = Math.min(
        100,
        Math.max(20, Math.round((maxWeightedScore / 0.25) * 100))
    );

    return {
        digit: bestDigit,
        frequency50: bestFreq50,
        recentFrequency: bestFreqRecent,
        momentum: bestMomentum,
        confidence,
        eligibleSide: side,
    };
}

/**
 * Calculates Trend Direction comparing 50, 25, 20, 10, 7 tick states
 */
export function determineTrendDirection(
    dist50: TWindowDistribution,
    dist25: TWindowDistribution,
    dist10: TWindowDistribution,
    dist7: TWindowDistribution
): TApexDirection {
    const u50 = dist50.underPct;
    const u25 = dist25.underPct;
    const u10 = dist10.underPct;
    const u7 = dist7.underPct;

    // Strong Under regime
    if (u50 >= 60 && u25 >= 58 && u10 >= 60 && u7 >= 60) {
        return 'STRONG UNDER';
    }
    // Moderate Under
    if (u50 >= 54 && u25 >= 52 && (u10 >= 50 || u7 >= 55)) {
        return 'UNDER';
    }

    const o50 = dist50.overPct;
    const o25 = dist25.overPct;
    const o10 = dist10.overPct;
    const o7 = dist7.overPct;

    // Strong Over regime
    if (o50 >= 60 && o25 >= 58 && o10 >= 60 && o7 >= 60) {
        return 'STRONG OVER';
    }
    // Moderate Over
    if (o50 >= 54 && o25 >= 52 && (o10 >= 50 || o7 >= 55)) {
        return 'OVER';
    }

    return 'NEUTRAL';
}

/**
 * Calculates Momentum Direction (Increasing, Stable, Weakening, Reversing)
 */
export function determineMomentumDirection(
    dominantSide: 'UNDER' | 'OVER' | 'NEUTRAL',
    dist50: TWindowDistribution,
    dist25: TWindowDistribution,
    dist10: TWindowDistribution,
    dist7: TWindowDistribution
): TMomentumDirection {
    if (dominantSide === 'NEUTRAL') return 'STABLE';

    const p50 = dominantSide === 'UNDER' ? dist50.underPct : dist50.overPct;
    const p25 = dominantSide === 'UNDER' ? dist25.underPct : dist25.overPct;
    const p10 = dominantSide === 'UNDER' ? dist10.underPct : dist10.overPct;
    const p7 = dominantSide === 'UNDER' ? dist7.underPct : dist7.overPct;

    // Check Reversal: 50 ticks favoured this side, but 10 & 7 have sharply collapsed below 45%
    if (p50 >= 55 && p10 < 45 && p7 < 40) {
        return 'REVERSING';
    }

    // Increasing momentum: recent windows strengthening
    if (p7 >= p10 && p10 >= p25 && p7 > p50 + 2) {
        return 'INCREASING';
    }

    // Weakening momentum: recent windows dropping
    if (p7 < p10 && p10 < p25 && p7 < p50 - 4) {
        return 'WEAKENING';
    }

    return 'STABLE';
}

/**
 * Classifies Market Regime
 */
export function determineRegime(
    totalTicks: number,
    dominantSide: 'UNDER' | 'OVER' | 'NEUTRAL',
    trend: TApexDirection,
    momentum: TMomentumDirection,
    dist7: TWindowDistribution,
    stabilityScore: number
): TApexRegime {
    if (totalTicks < 20) return 'OBSERVING';

    if (stabilityScore < 35) return 'UNSTABLE';

    if (momentum === 'REVERSING') {
        return dominantSide === 'UNDER' ? 'UNDER REVERSING' : 'OVER REVERSING';
    }

    if (dominantSide === 'UNDER') {
        if (trend === 'STRONG UNDER' && dist7.underPct >= 70) return 'UNDER STRONG';
        if (momentum === 'INCREASING' || (dist7.underPct >= 65 && dist7.total >= 7))
            return 'UNDER CONFIRMED';
        if (momentum === 'WEAKENING') return 'UNDER WEAKENING';
        if (dist7.underPct >= 55) return 'UNDER FORMING';
        return 'NO SIGNAL';
    }

    if (dominantSide === 'OVER') {
        if (trend === 'STRONG OVER' && dist7.overPct >= 70) return 'OVER STRONG';
        if (momentum === 'INCREASING' || (dist7.overPct >= 65 && dist7.total >= 7))
            return 'OVER CONFIRMED';
        if (momentum === 'WEAKENING') return 'OVER WEAKENING';
        if (dist7.overPct >= 55) return 'OVER FORMING';
        return 'NO SIGNAL';
    }

    return 'NO SIGNAL';
}

/**
 * Calculates Market Stability Score (0-100)
 */
export function calculateStabilityScore(params: {
    dist50: TWindowDistribution;
    dist25: TWindowDistribution;
    dist10: TWindowDistribution;
    dist7: TWindowDistribution;
    momentum: TMomentumDirection;
    regimeDurationSeconds: number;
    reversalCount: number;
    entryDigitConfidence: number;
}): { score: number; classification: TStabilityClassification } {
    const {
        dist50,
        dist25,
        dist10,
        dist7,
        momentum,
        regimeDurationSeconds,
        reversalCount,
        entryDigitConfidence,
    } = params;

    // 1. Direction Consistency (30 pts max)
    // Measures variance across windows
    const side = dist50.underPct >= dist50.overPct ? 'UNDER' : 'OVER';
    const p50 = side === 'UNDER' ? dist50.underPct : dist50.overPct;
    const p25 = side === 'UNDER' ? dist25.underPct : dist25.overPct;
    const p10 = side === 'UNDER' ? dist10.underPct : dist10.overPct;
    const p7 = side === 'UNDER' ? dist7.underPct : dist7.overPct;

    const allAgree = (p50 >= 50 && p25 >= 50 && p10 >= 50 && p7 >= 50);
    const dirConsistencyPts = allAgree ? 30 : Math.max(10, 30 - Math.abs(p50 - p7) * 0.5);

    // 2. Momentum Stability (20 pts max)
    let momentumPts = 15;
    if (momentum === 'STABLE' || momentum === 'INCREASING') momentumPts = 20;
    else if (momentum === 'WEAKENING') momentumPts = 10;
    else if (momentum === 'REVERSING') momentumPts = 0;

    // 3. Regime Duration (20 pts max)
    // Longer steady regime (e.g. > 120s) earns higher stability
    let durationPts = Math.min(20, Math.round((regimeDurationSeconds / 180) * 20));
    if (regimeDurationSeconds < 15) durationPts = 5;

    // 4. Reversal Frequency Penalty (15 pts max)
    const reversalPts = Math.max(0, 15 - reversalCount * 3);

    // 5. Entry Digit Confidence (15 pts max)
    const entryDigitPts = Math.round((entryDigitConfidence / 100) * 15);

    const totalScore = Math.min(
        100,
        Math.max(0, Math.round(dirConsistencyPts + momentumPts + durationPts + reversalPts + entryDigitPts))
    );

    let classification: TStabilityClassification = 'UNSTABLE';
    if (totalScore >= 80) classification = 'VERY STABLE';
    else if (totalScore >= 65) classification = 'STABLE';
    else if (totalScore >= 50) classification = 'MODERATE';
    else if (totalScore >= 35) classification = 'UNSTABLE';
    else classification = 'HIGHLY UNSTABLE';

    return { score: totalScore, classification };
}

/**
 * Calculates Apex Market Score (0-100)
 * Weighted model:
 * LONG-TERM DISTRIBUTION = 20%
 * 50-TICK DISTRIBUTION   = 15%
 * 25-TICK MOMENTUM       = 15%
 * 10-TICK MOMENTUM       = 20%
 * 7-TICK CONFIRMATION    = 15%
 * ENTRY DIGIT STRENGTH   = 10%
 * STABILITY              = 5%
 * Total                  = 100
 */
export function calculateApexScore(params: {
    overlapping: TOverlappingDistribution;
    dist50: TWindowDistribution;
    dist25: TWindowDistribution;
    dist10: TWindowDistribution;
    dist7: TWindowDistribution;
    entryDigit: TEntryDigitInfo;
    stabilityScore: number;
    dominantSide: 'UNDER' | 'OVER' | 'NEUTRAL';
}): { score: number; classification: TScoreClassification } {
    const {
        overlapping,
        dist50,
        dist25,
        dist10,
        dist7,
        entryDigit,
        stabilityScore,
        dominantSide,
    } = params;

    if (dominantSide === 'NEUTRAL') {
        return { score: 45, classification: 'NO TRADE' };
    }

    const isUnder = dominantSide === 'UNDER';

    // 1. Long-Term Distribution (Window B: 0-5 vs 4-9) - 20 pts
    const longTermPct = isUnder ? overlapping.under05Pct : overlapping.over49Pct;
    // Baseline expected for 6 digits is 60%. Range 50% to 75% -> 0 to 20 pts
    const longTermPts = Math.min(20, Math.max(0, ((longTermPct - 50) / 25) * 20));

    // 2. 50-Tick Distribution (Window A: 0-4 vs 5-9) - 15 pts
    const dist50Pct = isUnder ? dist50.underPct : dist50.overPct;
    // Baseline expected for 5 digits is 50%. Range 45% to 70% -> 0 to 15 pts
    const dist50Pts = Math.min(15, Math.max(0, ((dist50Pct - 45) / 25) * 15));

    // 3. 25-Tick Momentum - 15 pts
    const dist25Pct = isUnder ? dist25.underPct : dist25.overPct;
    const dist25Pts = Math.min(15, Math.max(0, ((dist25Pct - 45) / 25) * 15));

    // 4. 10-Tick Momentum - 20 pts
    const dist10Pct = isUnder ? dist10.underPct : dist10.overPct;
    const dist10Pts = Math.min(20, Math.max(0, ((dist10Pct - 40) / 35) * 20));

    // 5. 7-Tick Confirmation - 15 pts
    const dist7Pct = isUnder ? dist7.underPct : dist7.overPct;
    const dist7Pts = Math.min(15, Math.max(0, ((dist7Pct - 40) / 40) * 15));

    // 6. Entry Digit Strength - 10 pts
    const entryPts = Math.min(10, Math.max(0, (entryDigit.confidence / 100) * 10));

    // 7. Stability - 5 pts
    const stabilityPts = Math.min(5, Math.max(0, (stabilityScore / 100) * 5));

    const total = Math.min(
        100,
        Math.max(0, Math.round(longTermPts + dist50Pts + dist25Pts + dist10Pts + dist7Pts + entryPts + stabilityPts))
    );

    let classification: TScoreClassification = 'NO TRADE';
    if (total >= 90) classification = 'APEX PRIME';
    else if (total >= 80) classification = 'EXCELLENT';
    else if (total >= 70) classification = 'GOOD';
    else if (total >= 60) classification = 'WATCH';
    else if (total >= 50) classification = 'WEAK';
    else classification = 'NO TRADE';

    return { score: total, classification };
}

/**
 * Evaluates Under Signal Gates (Section 15)
 * DIGITUNDER 6 (barrier 6, wins on 0,1,2,3,4,5)
 */
export function evaluateUnderSignal(params: {
    dist50: TWindowDistribution;
    dist25: TWindowDistribution;
    dist10: TWindowDistribution;
    dist7: TWindowDistribution;
    overlapping: TOverlappingDistribution;
    momentum: TMomentumDirection;
    entryDigit: TEntryDigitInfo;
    stabilityScore: number;
    reversalDetected: boolean;
    hasActiveTrade: boolean;
    currentRuns: number;
    maxRuns: number;
    minScoreThreshold?: number;
    minStabilityThreshold?: number;
    min7ConfirmationThreshold?: number;
}): { passes: boolean; reason: string; failedGate?: string } {
    const {
        dist50,
        dist10,
        dist7,
        overlapping,
        momentum,
        entryDigit,
        stabilityScore,
        reversalDetected,
        hasActiveTrade,
        currentRuns,
        maxRuns,
        minStabilityThreshold = 65,
        min7ConfirmationThreshold = 5,
    } = params;

    // Gate 1: Under 0-4 must be >= 55%
    if (dist50.underPct < 55) {
        return {
            passes: false,
            reason: `Under 0-4 is ${dist50.underPct}%, below the required 55% threshold.`,
            failedGate: 'UNDER_0_4_DISTRIBUTION',
        };
    }

    // Gate 2: Momentum increasing or stable
    if (momentum === 'WEAKENING' || momentum === 'REVERSING') {
        return {
            passes: false,
            reason: `Under momentum is ${momentum}, requiring Increasing or Stable regime.`,
            failedGate: 'MOMENTUM_DIRECTION',
        };
    }

    // Gate 3: 50-tick structure shows Under dominance (Under 0-5 > Over 4-9)
    if (overlapping.under05Count <= overlapping.over49Count) {
        return {
            passes: false,
            reason: `50-tick structure Under 0-5 (${overlapping.under05Count}) does not exceed Over 4-9 (${overlapping.over49Count}).`,
            failedGate: 'STRUCTURE_DOMINANCE',
        };
    }

    // Gate 4: LAST 10 confirms Under (at least 6 of 10)
    if (dist10.underCount < 6) {
        return {
            passes: false,
            reason: `Last 10 ticks (${dist10.underCount}/10 Under) failed directional confirmation.`,
            failedGate: 'LAST_10_CONFIRMATION',
        };
    }

    // Gate 5: LAST 7 favours Under (minimum threshold, default 5 of 7)
    if (dist7.underCount < min7ConfirmationThreshold) {
        return {
            passes: false,
            reason: `Last 7 ticks (${dist7.underCount}/7 Under) does not meet minimum ${min7ConfirmationThreshold}/7 gate.`,
            failedGate: 'LAST_7_CONFIRMATION',
        };
    }

    // Gate 6: Entry digit is strong
    if (entryDigit.confidence < 50) {
        return {
            passes: false,
            reason: `Under Entry Digit [${entryDigit.digit}] confidence (${entryDigit.confidence}%) is below 50%.`,
            failedGate: 'ENTRY_DIGIT_CONFIDENCE',
        };
    }

    // Gate 7: Market is stable
    if (stabilityScore < minStabilityThreshold) {
        return {
            passes: false,
            reason: `Market stability (${stabilityScore}/100) is below safe threshold (${minStabilityThreshold}).`,
            failedGate: 'STABILITY_SCORE',
        };
    }

    // Gate 8: No active reversal
    if (reversalDetected) {
        return {
            passes: false,
            reason: 'Active directional reversal detected in short-term windows.',
            failedGate: 'REVERSAL_DETECTED',
        };
    }

    // Gate 9: No active trade
    if (hasActiveTrade) {
        return {
            passes: false,
            reason: 'Active contract currently open and monitoring.',
            failedGate: 'ACTIVE_TRADE',
        };
    }

    // Gate 10: Maximum run limit
    if (currentRuns >= maxRuns) {
        return {
            passes: false,
            reason: `Maximum run limit reached (${currentRuns}/${maxRuns} trades). Reanalysis required.`,
            failedGate: 'RUN_LIMIT_REACHED',
        };
    }

    return {
        passes: true,
        reason: `Under 0-4 = ${dist50.underPct}%. Last 10 = ${dist10.underCount}U/${dist10.overCount}O. Last 7 = ${dist7.underCount}U/${dist7.overCount}O. Stability = ${stabilityScore}. Entry Digit = ${entryDigit.digit}. All 10 gates confirmed for DIGITUNDER 6.`,
    };
}

/**
 * Evaluates Over Signal Gates (Section 16)
 * DIGITOVER 3 (barrier 3, wins on 4,5,6,7,8,9)
 */
export function evaluateOverSignal(params: {
    dist50: TWindowDistribution;
    dist25: TWindowDistribution;
    dist10: TWindowDistribution;
    dist7: TWindowDistribution;
    overlapping: TOverlappingDistribution;
    momentum: TMomentumDirection;
    entryDigit: TEntryDigitInfo;
    stabilityScore: number;
    reversalDetected: boolean;
    hasActiveTrade: boolean;
    currentRuns: number;
    maxRuns: number;
    minScoreThreshold?: number;
    minStabilityThreshold?: number;
    min7ConfirmationThreshold?: number;
}): { passes: boolean; reason: string; failedGate?: string } {
    const {
        dist50,
        dist10,
        dist7,
        overlapping,
        momentum,
        entryDigit,
        stabilityScore,
        reversalDetected,
        hasActiveTrade,
        currentRuns,
        maxRuns,
        minStabilityThreshold = 65,
        min7ConfirmationThreshold = 5,
    } = params;

    // Gate 1: Over structure exceeds threshold
    if (dist50.overPct < 55) {
        return {
            passes: false,
            reason: `Over 5-9 is ${dist50.overPct}%, below the required 55% threshold.`,
            failedGate: 'OVER_5_9_DISTRIBUTION',
        };
    }

    // Gate 2: Momentum increasing or stable
    if (momentum === 'WEAKENING' || momentum === 'REVERSING') {
        return {
            passes: false,
            reason: `Over momentum is ${momentum}, requiring Increasing or Stable regime.`,
            failedGate: 'MOMENTUM_DIRECTION',
        };
    }

    // Gate 3: 50-tick structure shows Over dominance (Over 4-9 > Under 0-5)
    if (overlapping.over49Count <= overlapping.under05Count) {
        return {
            passes: false,
            reason: `50-tick structure Over 4-9 (${overlapping.over49Count}) does not exceed Under 0-5 (${overlapping.under05Count}).`,
            failedGate: 'STRUCTURE_DOMINANCE',
        };
    }

    // Gate 4: LAST 10 confirms Over
    if (dist10.overCount < 6) {
        return {
            passes: false,
            reason: `Last 10 ticks (${dist10.overCount}/10 Over) failed directional confirmation.`,
            failedGate: 'LAST_10_CONFIRMATION',
        };
    }

    // Gate 5: LAST 7 favours Over
    if (dist7.overCount < min7ConfirmationThreshold) {
        return {
            passes: false,
            reason: `Last 7 ticks (${dist7.overCount}/7 Over) does not meet minimum ${min7ConfirmationThreshold}/7 gate.`,
            failedGate: 'LAST_7_CONFIRMATION',
        };
    }

    // Gate 6: Entry digit is strong
    if (entryDigit.confidence < 50) {
        return {
            passes: false,
            reason: `Over Entry Digit [${entryDigit.digit}] confidence (${entryDigit.confidence}%) is below 50%.`,
            failedGate: 'ENTRY_DIGIT_CONFIDENCE',
        };
    }

    // Gate 7: Market is stable
    if (stabilityScore < minStabilityThreshold) {
        return {
            passes: false,
            reason: `Market stability (${stabilityScore}/100) is below safe threshold (${minStabilityThreshold}).`,
            failedGate: 'STABILITY_SCORE',
        };
    }

    // Gate 8: No active reversal
    if (reversalDetected) {
        return {
            passes: false,
            reason: 'Active directional reversal detected in short-term windows.',
            failedGate: 'REVERSAL_DETECTED',
        };
    }

    // Gate 9: No active trade
    if (hasActiveTrade) {
        return {
            passes: false,
            reason: 'Active contract currently open and monitoring.',
            failedGate: 'ACTIVE_TRADE',
        };
    }

    // Gate 10: Maximum run limit
    if (currentRuns >= maxRuns) {
        return {
            passes: false,
            reason: `Maximum run limit reached (${currentRuns}/${maxRuns} trades). Reanalysis required.`,
            failedGate: 'RUN_LIMIT_REACHED',
        };
    }

    return {
        passes: true,
        reason: `Over 5-9 = ${dist50.overPct}%. Last 10 = ${dist10.overCount}O/${dist10.underCount}U. Last 7 = ${dist7.overCount}O/${dist7.underCount}U. Stability = ${stabilityScore}. Entry Digit = ${entryDigit.digit}. All 10 gates confirmed for DIGITOVER 3.`,
    };
}
