import {
    calculateApexScore,
    calculateOverlappingDistribution,
    calculateWeightedEntryDigit,
    calculateWindowDistribution,
    determineMomentumDirection,
    determineTrendDirection,
    evaluateUnderSignal,
    extractMeaningfulLastDigit,
} from '../apex-engine';
import { TWindowDistribution } from '../types';

describe('APEX 3.0 Engine Pure Algorithms', () => {
    describe('extractMeaningfulLastDigit', () => {
        it('normalizes quotes and removes trailing zeros after decimal point correctly', () => {
            // Examples from specification:
            // 123.4500 -> last digit = 5
            // 123.456  -> last digit = 6
            expect(extractMeaningfulLastDigit(123.45, 4).lastDigit).toBe(5);
            expect(extractMeaningfulLastDigit('123.4500').lastDigit).toBe(5);
            expect(extractMeaningfulLastDigit('123.456').lastDigit).toBe(6);
            expect(extractMeaningfulLastDigit('1234.567').lastDigit).toBe(7);
            expect(extractMeaningfulLastDigit('100.00').lastDigit).toBe(0); // 100.00 -> 100 -> 0
            expect(extractMeaningfulLastDigit(123.4).lastDigit).toBe(4);
        });
    });

    describe('calculateWindowDistribution (Window A: 0-4 vs 5-9)', () => {
        it('calculates exact Under 0-4 and Over 5-9 counts and percentages', () => {
            // 10 digits: 0,1,2,3,4 (5 under) and 5,6,7,8,9 (5 over)
            const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
            const dist = calculateWindowDistribution(digits);

            expect(dist.underCount).toBe(5);
            expect(dist.overCount).toBe(5);
            expect(dist.underPct).toBe(50.0);
            expect(dist.overPct).toBe(50.0);
        });

        it('handles strong Under distribution', () => {
            // 7 Under, 3 Over
            const digits = [0, 2, 4, 1, 3, 2, 1, 8, 9, 7];
            const dist = calculateWindowDistribution(digits);

            expect(dist.underCount).toBe(7);
            expect(dist.overCount).toBe(3);
            expect(dist.underPct).toBe(70.0);
            expect(dist.overPct).toBe(30.0);
        });
    });

    describe('calculateOverlappingDistribution (Window B: Under 0-5 vs Over 4-9)', () => {
        it('correctly includes digit 4 in both Under 0-5 and Over 4-9 without forcing 100% total', () => {
            // Specification example:
            // Under 0-5 and Over 4-9 overlap at digit 4.
            const digits = [4, 4, 4, 4, 0, 1, 8, 9]; // length 8
            // 4 belongs to Under 0-5 (digits 0,1,2,3,4,5) -> 4,4,4,4,0,1 = 6/8 = 75%
            // 4 belongs to Over 4-9 (digits 4,5,6,7,8,9) -> 4,4,4,4,8,9 = 6/8 = 75%
            const overlap = calculateOverlappingDistribution(digits);

            expect(overlap.under05Count).toBe(6);
            expect(overlap.over49Count).toBe(6);
            expect(overlap.under05Pct).toBe(75.0);
            expect(overlap.over49Pct).toBe(75.0);
            // Sum is 150%, demonstrating intentional overlap!
            expect(overlap.under05Pct + overlap.over49Pct).toBeGreaterThan(100);
        });
    });

    describe('calculateWeightedEntryDigit', () => {
        it('assigns higher weight to recent windows (10-tick & 7-tick: 60% combined)', () => {
            // Historical 40 ticks has lots of digit 0
            const older = Array(40).fill(0);
            // Recent 10 ticks has concentrated digit 4
            const recent = Array(10).fill(4);
            const digits = [...older, ...recent];

            const underEntry = calculateWeightedEntryDigit(digits, 'UNDER');

            // Even though digit 0 has higher 50-tick frequency, recent 10 and 7 ticks heavily favor 4!
            expect(underEntry.digit).toBe(4);
            expect(underEntry.momentum).toBe('RISING');
            expect(underEntry.confidence).toBeGreaterThan(50);
        });
    });

    describe('determineTrendDirection & determineMomentumDirection', () => {
        it('identifies Strong Under and Increasing Momentum when recent ticks support the trend', () => {
            const dist50: TWindowDistribution = { underCount: 34, overCount: 16, underPct: 68, overPct: 32, total: 50 };
            const dist25: TWindowDistribution = { underCount: 16, overCount: 9, underPct: 64, overPct: 36, total: 25 };
            const dist10: TWindowDistribution = { underCount: 7, overCount: 3, underPct: 70, overPct: 30, total: 10 };
            const dist7: TWindowDistribution = { underCount: 5, overCount: 2, underPct: 71.4, overPct: 28.6, total: 7 };

            const trend = determineTrendDirection(dist50, dist25, dist10, dist7);
            const momentum = determineMomentumDirection('UNDER', dist50, dist25, dist10, dist7);

            expect(trend).toBe('STRONG UNDER');
            expect(momentum).toBe('INCREASING');
        });

        it('detects Reversal when short-term windows abruptly shift to opposite side', () => {
            const dist50: TWindowDistribution = { underCount: 35, overCount: 15, underPct: 70, overPct: 30, total: 50 };
            const dist25: TWindowDistribution = { underCount: 15, overCount: 10, underPct: 60, overPct: 40, total: 25 };
            const dist10: TWindowDistribution = { underCount: 4, overCount: 6, underPct: 40, overPct: 60, total: 10 };
            const dist7: TWindowDistribution = { underCount: 2, overCount: 5, underPct: 28.6, overPct: 71.4, total: 7 };

            const momentum = determineMomentumDirection('UNDER', dist50, dist25, dist10, dist7);
            expect(momentum).toBe('REVERSING');
        });
    });

    describe('calculateApexScore', () => {
        it('calculates score according to weighted distribution model and classifies correctly', () => {
            const result = calculateApexScore({
                overlapping: { under05Count: 35, under05Pct: 70, over49Count: 22, over49Pct: 44, total: 50 },
                dist50: { underCount: 34, overCount: 16, underPct: 68, overPct: 32, total: 50 },
                dist25: { underCount: 17, overCount: 8, underPct: 68, overPct: 32, total: 25 },
                dist10: { underCount: 7, overCount: 3, underPct: 70, overPct: 30, total: 10 },
                dist7: { underCount: 5, overCount: 2, underPct: 71.4, overPct: 28.6, total: 7 },
                entryDigit: {
                    digit: 4,
                    frequency50: 9,
                    recentFrequency: 3,
                    momentum: 'RISING',
                    confidence: 85,
                    eligibleSide: 'UNDER',
                },
                stabilityScore: 85,
                dominantSide: 'UNDER',
            });

            expect(result.score).toBeGreaterThanOrEqual(75);
            expect(['APEX PRIME', 'EXCELLENT', 'GOOD']).toContain(result.classification);
        });
    });

    describe('evaluateUnderSignal Gates', () => {
        const baseParams = {
            dist50: { underCount: 34, overCount: 16, underPct: 68, overPct: 32, total: 50 },
            dist25: { underCount: 16, overCount: 9, underPct: 64, overPct: 36, total: 25 },
            dist10: { underCount: 7, overCount: 3, underPct: 70, overPct: 30, total: 10 },
            dist7: { underCount: 6, overCount: 1, underPct: 85.7, overPct: 14.3, total: 7 },
            overlapping: { under05Count: 35, under05Pct: 70, over49Count: 24, over49Pct: 48, total: 50 },
            momentum: 'INCREASING' as const,
            entryDigit: {
                digit: 4,
                frequency50: 9,
                recentFrequency: 3,
                momentum: 'RISING' as const,
                confidence: 85,
                eligibleSide: 'UNDER' as const,
            },
            stabilityScore: 87,
            reversalDetected: false,
            hasActiveTrade: false,
            currentRuns: 0,
            maxRuns: 5,
        };

        it('passes all 10 gates when conditions align', () => {
            const evalResult = evaluateUnderSignal(baseParams);
            expect(evalResult.passes).toBe(true);
            expect(evalResult.reason).toContain('All 10 gates confirmed for DIGITUNDER 6');
        });

        it('blocks trade if Last 7 ticks fail confirmation (e.g. only 3 of 7)', () => {
            const failingParams = {
                ...baseParams,
                dist7: { underCount: 3, overCount: 4, underPct: 42.8, overPct: 57.2, total: 7 },
            };
            const evalResult = evaluateUnderSignal(failingParams);
            expect(evalResult.passes).toBe(false);
            expect(evalResult.failedGate).toBe('LAST_7_CONFIRMATION');
        });

        it('blocks trade if max runs limit (5) is reached', () => {
            const failingParams = {
                ...baseParams,
                currentRuns: 5,
            };
            const evalResult = evaluateUnderSignal(failingParams);
            expect(evalResult.passes).toBe(false);
            expect(evalResult.failedGate).toBe('RUN_LIMIT_REACHED');
        });
    });
});
