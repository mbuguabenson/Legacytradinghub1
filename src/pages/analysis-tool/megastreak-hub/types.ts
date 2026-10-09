export type TSignalStatus =
    | 'OBSERVING'
    | 'UNDER FORMING'
    | 'UNDER CONDITIONS MET'
    | 'OVER FORMING'
    | 'OVER CONDITIONS MET'
    | 'WAIT — CONDITIONS NOT MET'
    | 'STOP — SIGNAL INVALIDATED'
    | 'REVERSAL DETECTED'
    | 'MARKET UNSTABLE'
    | 'DATA INSUFFICIENT';

export type TMarketStability = 'STABLE' | 'MODERATE' | 'CHOPPY' | 'UNSTABLE';
export type TDirection = 'UNDER' | 'OVER' | 'NEUTRAL';
export type TContractDirection = 'UNDER 6' | 'OVER 3';
export type TViewMode = 'beginner' | 'pro';

export interface TTickItem {
    quote: number;
    digit: number;
    epoch: number;
}

export interface TDigitFrequency {
    digit: number;
    count: number;
    percentage: number;
    isTop: boolean;
    intensity: number; // 0 to 1 based on frequency relative to average
}

export interface TConditionCheck {
    id: string;
    label: string;
    description: string;
    passed: boolean;
    currentValue: string;
    targetValue: string;
}

export interface TRollingStats {
    windowSize: number;
    under04Count: number;
    over59Count: number;
    under04Pct: number;
    over59Pct: number;
    under05Count: number;
    over49Count: number;
    under05Pct: number;
    over49Pct: number;
    dominantDirection: TDirection;
    momentum: 'STRENGTHENING' | 'WEAKENING' | 'STEADY';
}

export interface TEntryDigitIntelligence {
    preferredDirection: TContractDirection;
    strongestDigit: number;
    strongestScore: number;
    recentFreq50: number; // % in 50 ticks
    recentFreq25: number; // % in 25 ticks
    recentFreq10: number; // % in 10 ticks
    recentFreq7: number; // % in 7 ticks
    momentumRating: 'STRONG' | 'MODERATE' | 'WEAK';
    conditionsMetCount: number;
    totalConditions: number;
    missingConditions: string[];
}

export interface TMarketScanSummary {
    symbol: string;
    displayName: string;
    currentPrice: number;
    latestDigit: number;
    pipSize: number;
    under04Pct: number;
    over59Pct: number;
    under05Pct: number;
    over49Pct: number;
    last10Momentum: TDirection;
    last7ConfirmUnder: number; // out of 7 ticks in 0-5
    last7ConfirmOver: number; // out of 7 ticks in 4-9
    strongestDigit: number;
    stability: TMarketStability;
    signalStatus: TSignalStatus;
    score: number; // 0 - 100
    preferredDirection: TContractDirection;
    lastUpdated: number;
}

export interface TMegastreakConfig {
    underThresholdPct: number; // default 55%
    overThresholdPct: number; // default 55%
    last7ConfirmMin: number; // default 5 of 7
    last10FavouredMin: number; // default 6 of 10
    stabilityFilterEnabled: boolean;
}

export interface TSignalLogItem {
    id: string;
    timestamp: number;
    symbol: string;
    status: TSignalStatus;
    direction?: TContractDirection;
    reason: string;
    digit?: number;
    price?: number;
}
