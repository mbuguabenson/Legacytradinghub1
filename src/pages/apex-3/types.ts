export type TApexRegime =
    | 'OBSERVING'
    | 'UNDER FORMING'
    | 'UNDER CONFIRMED'
    | 'UNDER STRONG'
    | 'UNDER WEAKENING'
    | 'UNDER REVERSING'
    | 'OVER FORMING'
    | 'OVER CONFIRMED'
    | 'OVER STRONG'
    | 'OVER WEAKENING'
    | 'OVER REVERSING'
    | 'UNSTABLE'
    | 'NO SIGNAL'
    | 'DATA INSUFFICIENT';

export type TApexDirection = 'STRONG UNDER' | 'UNDER' | 'NEUTRAL' | 'OVER' | 'STRONG OVER';

export type TMomentumDirection = 'INCREASING' | 'STABLE' | 'WEAKENING' | 'REVERSING';

export type TStabilityClassification = 'VERY STABLE' | 'STABLE' | 'MODERATE' | 'UNSTABLE' | 'HIGHLY UNSTABLE';

export type TScoreClassification = 'APEX PRIME' | 'EXCELLENT' | 'GOOD' | 'WATCH' | 'WEAK' | 'NO TRADE';

export type TEngineState =
    | 'INITIALIZING'
    | 'LOADING_MARKET'
    | 'WARMING_UP'
    | 'OBSERVING'
    | 'ANALYZING'
    | 'NO_SIGNAL'
    | 'SIGNAL_FORMING'
    | 'SIGNAL_CONFIRMED'
    | 'ENTRY_READY'
    | 'EXECUTING'
    | 'TRADE_ACTIVE'
    | 'COOLDOWN'
    | 'REANALYZING'
    | 'PAUSED'
    | 'REVERSAL_DETECTED'
    | 'MARKET_UNSTABLE'
    | 'SEARCHING_BEST_MARKET'
    | 'SWITCHING_MARKET'
    | 'RISK_LOCK'
    | 'STOPPED';

export type TContractType = 'DIGITUNDER' | 'DIGITOVER';

export interface TTickItem {
    quote: number;
    digit: number;
    epoch: number;
    formattedPrice: string;
}

export interface TWindowDistribution {
    underCount: number;
    overCount: number;
    underPct: number;
    overPct: number;
    total: number;
}

export interface TOverlappingDistribution {
    under05Count: number;
    under05Pct: number;
    over49Count: number;
    over49Pct: number;
    total: number;
}

export interface TDigitFrequency {
    digit: number;
    count: number;
    percentage: number;
    underWeightedScore?: number;
    overWeightedScore?: number;
}

export interface TEntryDigitInfo {
    digit: number;
    frequency50: number;
    recentFrequency: number;
    momentum: 'RISING' | 'STABLE' | 'FALLING';
    confidence: number;
    eligibleSide: 'UNDER' | 'OVER';
}

export interface TMarketSnapshot {
    symbol: string;
    displayName: string;
    pipSize: number;
    currentPrice: string;
    lastDigit: number;
    ticks50: TTickItem[];
    // Window A (0-4 vs 5-9)
    under04Pct: number;
    over59Pct: number;
    under04Count: number;
    over59Count: number;
    // Window B (0-5 vs 4-9 overlapping)
    under05Pct: number;
    over49Pct: number;
    under05Count: number;
    over49Count: number;
    // Recency Windows
    last20: TWindowDistribution;
    last10: TWindowDistribution;
    last7: TWindowDistribution;
    last5: TWindowDistribution;
    last3: TWindowDistribution;
    // Frequencies
    digitFrequencies: TDigitFrequency[];
    // Direction & Momentum
    direction: TApexDirection;
    momentum: TMomentumDirection;
    dominantSide: 'UNDER' | 'OVER' | 'NEUTRAL';
    // Entry Digit
    underEntryDigit: TEntryDigitInfo;
    overEntryDigit: TEntryDigitInfo;
    activeEntryDigit: TEntryDigitInfo | null;
    // Scores
    apexScore: number;
    scoreClass: TScoreClassification;
    stabilityScore: number;
    stabilityClass: TStabilityClassification;
    reversalRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    // Regime
    regime: TApexRegime;
    regimeDurationSeconds: number;
    regimeStartedAt: number;
    // Signal
    signal: 'UNDER' | 'OVER' | 'NONE';
    signalStatus: 'READY' | 'FORMING' | 'WATCH' | 'NO TRADE';
    lastUpdated: number;
}

export interface TTradeJournalItem {
    id: string;
    timestamp: number;
    market: string;
    displayName: string;
    direction: 'UNDER' | 'OVER';
    contractType: TContractType;
    barrier: number; // 6 for UNDER, 3 for OVER
    entryDigit: number;
    entryPrice: string;
    stake: number;
    proposalId?: string;
    contractId?: string;
    apexScore: number;
    stabilityScore: number;
    under04: number;
    over59: number;
    under05: number;
    over49: number;
    last10: string; // e.g., "7U / 3O"
    last7: string;  // e.g., "6U / 1O"
    signalStrength: string;
    regime: TApexRegime;
    entryReason: string;
    exitResult?: 'WIN' | 'LOSS';
    profit?: number;
    exitPrice?: string;
    exitDigit?: number;
    durationSeconds?: number;
    isSimulated: boolean;
}

export interface TSimulationStats {
    totalSignals: number;
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
    simulatedPL: number;
    skippedSignals: number;
    falseSignals: number;
    missedEntries: number;
    avgScore: number;
    avgStability: number;
}

export interface TRiskSettings {
    maxRunsPerSequence: number; // Default 5
    maxConsecutiveLosses: number; // Default 2
    maxDailyLoss: number; // e.g. 50
    takeProfitTarget: number; // e.g. 25
    stake: number; // Default 0.35
    cooldownSeconds: number; // Default 5
    minApexScore: number; // Default 75
    minStabilityScore: number; // Default 70
    minLast7Confirmation: number; // Default 5 (out of 7)
    autoSwitchMarket: boolean; // Auto switch when current degrades
    autoResumeAfterPause: boolean; // Auto resume after fresh confirmed signal
}
