import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx';
import { api_base, observer as globalObserver } from '@/external/bot-skeleton';
import { subscribeTicks } from '@/utils/websocket-handler';
import RootStore from './root-store';
import {
    TApexDirection,
    TApexRegime,
    TContractType,
    TEngineState,
    TEntryDigitInfo,
    TMarketSnapshot,
    TMomentumDirection,
    TRiskSettings,
    TScoreClassification,
    TSimulationStats,
    TStabilityClassification,
    TTickItem,
    TTradeJournalItem,
    TWindowDistribution,
} from '../pages/apex-3/types';
import {
    calculateApexScore,
    calculateDigitFrequencies,
    calculateOverlappingDistribution,
    calculateStabilityScore,
    calculateWeightedEntryDigit,
    calculateWindowDistribution,
    determineMomentumDirection,
    determineRegime,
    determineTrendDirection,
    evaluateOverSignal,
    evaluateUnderSignal,
    extractMeaningfulLastDigit,
} from '../pages/apex-3/apex-engine';

const APEX_RISK_SETTINGS_KEY = 'apex_3_risk_settings';
const APEX_JOURNAL_KEY = 'apex_3_trade_journal';

export default class ApexStore {
    root_store: RootStore;

    // --- CONNECTION & MARKET STATE ---
    @observable accessor is_connected = false;
    @observable accessor is_discovering_markets = false;
    @observable accessor active_symbols: { symbol: string; display_name: string; pip_size: number }[] = [];
    @observable accessor selected_symbol = '1HZ100V';
    @observable accessor is_all_markets_mode = false;
    @observable accessor is_scanner_expanded = true;

    // --- CURRENT MARKET LIVE TICKS & BUFFER ---
    @observable accessor current_price = '0.00';
    @observable accessor last_digit = 0;
    @observable accessor ticks_buffer: TTickItem[] = []; // Rolling 50 ticks
    @observable accessor pip_size = 2;

    // --- MULTI-MARKET SCANNER SNAPSHOTS ---
    @observable accessor market_snapshots: Map<string, TMarketSnapshot> = new Map();
    private active_tick_listeners: Map<string, { unsubscribe: () => void }> = new Map();

    // --- ENGINE STATE MACHINE ---
    @observable accessor engine_state: TEngineState = 'INITIALIZING';
    @observable accessor state_reason = 'Engine booting up';

    // --- AUTOTRADING & MODE CONTROLS ---
    @observable accessor is_autotrading_enabled = false;
    @observable accessor trade_mode: 'LIVE' | 'SIMULATION' = 'SIMULATION';
    @observable accessor sequence_runs = 0; // Current count in the 5-run sequence
    @observable accessor is_paused = false;
    @observable accessor pause_reason = '';
    @observable accessor active_contract_id: string | null = null;
    @observable accessor is_trade_in_progress = false;
    @observable accessor cooldown_seconds_remaining = 0;

    // Confirmation Modal State
    @observable accessor is_confirm_modal_open = false;
    @observable accessor is_risk_modal_open = false;

    // --- 30-MINUTE HUMAN OBSERVATION MODE ---
    @observable accessor is_observation_mode_active = false;
    @observable accessor observation_elapsed_seconds = 0;
    @observable accessor target_observation_seconds = 1800; // 30 minutes
    private observation_timer_id: ReturnType<typeof setInterval> | null = null;

    // Regime Duration Tracking
    @observable accessor current_regime: TApexRegime = 'OBSERVING';
    @observable accessor regime_started_epoch: number = Date.now();
    @observable accessor regime_duration_seconds: number = 0;
    @observable accessor reversal_count: number = 0;
    @observable accessor regime_durations_history: { regime: TApexRegime; duration: number }[] = [];

    // --- RISK SETTINGS ---
    @observable accessor risk_settings: TRiskSettings = {
        maxRunsPerSequence: 5,
        maxConsecutiveLosses: 2,
        maxDailyLoss: 50,
        takeProfitTarget: 30,
        stake: 0.35,
        cooldownSeconds: 5,
        minApexScore: 75,
        minStabilityScore: 70,
        minLast7Confirmation: 5,
        autoSwitchMarket: true,
        autoResumeAfterPause: false,
    };

    // --- JOURNAL & SIMULATION STATS ---
    @observable accessor trade_journal: TTradeJournalItem[] = [];
    @observable accessor simulation_stats: TSimulationStats = {
        totalSignals: 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        simulatedPL: 0,
        skippedSignals: 0,
        falseSignals: 0,
        missedEntries: 0,
        avgScore: 0,
        avgStability: 0,
    };

    @observable accessor consecutive_losses = 0;
    @observable accessor daily_session_pl = 0;
    @observable accessor selected_journal_item: TTradeJournalItem | null = null;

    // Pending simulated entry monitoring
    private pending_simulation: {
        id: string;
        contractType: TContractType;
        entryDigit: number;
        stake: number;
        entryTime: number;
        market: string;
    } | null = null;

    private cooldown_timer_id: ReturnType<typeof setInterval> | null = null;
    private regime_clock_timer_id: ReturnType<typeof setInterval> | null = null;

    constructor(root_store: RootStore) {
        makeObservable(this);
        this.root_store = root_store;

        this.loadSettingsAndJournal();
        this.initEventListeners();
        this.startRegimeClock();
    }

    private loadSettingsAndJournal() {
        if (typeof window === 'undefined') return;
        try {
            const rawSettings = localStorage.getItem(APEX_RISK_SETTINGS_KEY);
            if (rawSettings) {
                const parsed = JSON.parse(rawSettings);
                this.risk_settings = { ...this.risk_settings, ...parsed };
            }

            const rawJournal = localStorage.getItem(APEX_JOURNAL_KEY);
            if (rawJournal) {
                this.trade_journal = JSON.parse(rawJournal).slice(0, 100);
            }
        } catch (e) {
            console.warn('[ApexStore] Error loading storage:', e);
        }
    }

    private saveSettings() {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(APEX_RISK_SETTINGS_KEY, JSON.stringify(this.risk_settings));
        } catch (e) {
            console.warn('[ApexStore] Error saving settings:', e);
        }
    }

    private saveJournal() {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(APEX_JOURNAL_KEY, JSON.stringify(this.trade_journal.slice(0, 100)));
        } catch (e) {
            console.warn('[ApexStore] Error saving journal:', e);
        }
    }

    private initEventListeners() {
        reaction(
            () => this.root_store.common?.is_socket_opened,
            is_opened => {
                runInAction(() => {
                    this.is_connected = !!is_opened;
                });
                if (is_opened) {
                    this.discoverSyntheticMarkets();
                }
            }
        );

        if (typeof window !== 'undefined') {
            window.addEventListener('account_switched', () => {
                runInAction(() => {
                    this.active_contract_id = null;
                    this.is_trade_in_progress = false;
                    if (this.is_autotrading_enabled) {
                        this.pauseAutotrading('Account switched during active session');
                    }
                });
            });
        }
    }

    private startRegimeClock() {
        this.regime_clock_timer_id = setInterval(() => {
            runInAction(() => {
                if (this.regime_started_epoch > 0) {
                    this.regime_duration_seconds = Math.max(
                        0,
                        Math.floor((Date.now() - this.regime_started_epoch) / 1000)
                    );
                }
            });
        }, 1000);
    }

    // --- DYNAMIC MARKET DISCOVERY ---
    @action
    discoverSyntheticMarkets = async () => {
        if (!api_base.api || this.is_discovering_markets) return;
        this.is_discovering_markets = true;

        try {
            let symbolsRes: any = null;
            if (typeof api_base.getActiveSymbols === 'function') {
                symbolsRes = await api_base.getActiveSymbols();
            } else {
                symbolsRes = await (api_base.api as any).send({
                    active_symbols: 'brief',
                    product_type: 'basic',
                });
            }

            const rawList: any[] = Array.isArray(symbolsRes)
                ? symbolsRes
                : symbolsRes?.active_symbols || [];

            // FILTER: DERIV SYNTHETIC INDICES ONLY
            const synthetics = rawList
                .filter((s: any) => {
                    const isSynthetic =
                        s.market === 'synthetic_index' ||
                        s.submarket === 'random_index' ||
                        s.submarket === 'random_daily';
                    const isOpen = !s.is_trading_suspended;
                    return isSynthetic && isOpen;
                })
                .map((s: any) => {
                    let pipSize = 2;
                    if (typeof s.pip === 'number' && s.pip > 0) {
                        pipSize = Math.max(0, Math.round(Math.abs(Math.log10(s.pip))));
                    } else if (typeof s.pip_size === 'number') {
                        pipSize = s.pip_size;
                    }
                    return {
                        symbol: s.symbol,
                        display_name: s.display_name || s.symbol,
                        pip_size: pipSize,
                    };
                });

            runInAction(() => {
                if (synthetics.length > 0) {
                    this.active_symbols = synthetics;
                    // If selected symbol is not in discovered synthetics, select the first one
                    if (!synthetics.some(s => s.symbol === this.selected_symbol)) {
                        this.selected_symbol = synthetics[0].symbol;
                        this.pip_size = synthetics[0].pip_size;
                    } else {
                        const current = synthetics.find(s => s.symbol === this.selected_symbol);
                        if (current) this.pip_size = current.pip_size;
                    }
                } else {
                    // Fallback to core continuous synthetic indices
                    this.active_symbols = [
                        { symbol: '1HZ100V', display_name: 'Volatility 100 (1s) Index', pip_size: 2 },
                        { symbol: '1HZ75V', display_name: 'Volatility 75 (1s) Index', pip_size: 2 },
                        { symbol: '1HZ50V', display_name: 'Volatility 50 (1s) Index', pip_size: 2 },
                        { symbol: '1HZ25V', display_name: 'Volatility 25 (1s) Index', pip_size: 2 },
                        { symbol: '1HZ10V', display_name: 'Volatility 10 (1s) Index', pip_size: 2 },
                        { symbol: 'R_100', display_name: 'Volatility 100 Index', pip_size: 2 },
                        { symbol: 'R_75', display_name: 'Volatility 75 Index', pip_size: 2 },
                        { symbol: 'R_50', display_name: 'Volatility 50 Index', pip_size: 2 },
                        { symbol: 'R_25', display_name: 'Volatility 25 Index', pip_size: 2 },
                        { symbol: 'R_10', display_name: 'Volatility 10 Index', pip_size: 2 },
                    ];
                }

                this.is_discovering_markets = false;
            });

            // Start subscription to current market
            this.switchMarket(this.selected_symbol);

            // If ALL MARKETS mode, subscribe to scanning pool
            if (this.is_all_markets_mode) {
                this.subscribeAllMarkets();
            }
        } catch (e) {
            console.warn('[ApexStore] Error discovering active symbols:', e);
            runInAction(() => {
                this.is_discovering_markets = false;
            });
        }
    };

    // --- MARKET SWITCHING & TICK WARMUP ---
    @action
    switchMarket = async (newSymbol: string) => {
        if (!newSymbol) return;

        runInAction(() => {
            this.selected_symbol = newSymbol;
            const symObj = this.active_symbols.find(s => s.symbol === newSymbol);
            if (symObj) this.pip_size = symObj.pip_size;
            this.ticks_buffer = [];
            this.engine_state = 'WARMING_UP';
            this.state_reason = `Warming up 50 ticks for ${newSymbol}`;
        });

        // Warm up with historical ticks
        try {
            if (api_base.api && api_base.api.connection?.readyState === 1) {
                const historyRes = await (api_base.api as any).send({
                    ticks_history: newSymbol,
                    count: 50,
                    end: 'latest',
                    style: 'ticks',
                });

                if (historyRes?.history?.prices && Array.isArray(historyRes.history.prices)) {
                    const prices = historyRes.history.prices;
                    const times = historyRes.history.times || [];
                    const items: TTickItem[] = [];

                    prices.forEach((price: number, idx: number) => {
                        const { lastDigit, formattedPrice } = extractMeaningfulLastDigit(
                            price,
                            this.pip_size
                        );
                        items.push({
                            quote: price,
                            digit: lastDigit,
                            epoch: times[idx] || Math.floor(Date.now() / 1000) - (prices.length - idx),
                            formattedPrice,
                        });
                    });

                    runInAction(() => {
                        this.ticks_buffer = items.slice(-50);
                        if (items.length > 0) {
                            const latest = items[items.length - 1];
                            this.current_price = latest.formattedPrice;
                            this.last_digit = latest.digit;
                        }
                    });

                    this.recalculateCurrentMarket();
                }
            }
        } catch (e) {
            console.warn('[ApexStore] Error fetching tick history:', e);
        }

        // Subscribe to live tick stream
        this.subscribeSymbolTicks(newSymbol);
    };

    private subscribeSymbolTicks(symbol: string) {
        if (this.active_tick_listeners.has(symbol)) return;

        const sub = subscribeTicks(symbol, (tickData: any) => {
            if (tickData?.tick && tickData.tick.symbol === symbol) {
                this.handleLiveTick(symbol, tickData.tick);
            }
        });

        this.active_tick_listeners.set(symbol, sub);
    }

    @action
    toggleAllMarketsMode = () => {
        this.is_all_markets_mode = !this.is_all_markets_mode;
        if (this.is_all_markets_mode) {
            this.subscribeAllMarkets();
        }
    };

    @action
    subscribeAllMarkets = () => {
        // Subscribe to all discovered synthetic markets in the background
        this.active_symbols.forEach(symObj => {
            this.subscribeSymbolTicks(symObj.symbol);
        });
    };

    // --- LIVE TICK HANDLER ---
    @action
    handleLiveTick = (symbol: string, tick: { quote: number | string; epoch?: number }) => {
        const symObj = this.active_symbols.find(s => s.symbol === symbol);
        const pip = symObj ? symObj.pip_size : this.pip_size;
        const { lastDigit, formattedPrice } = extractMeaningfulLastDigit(tick.quote, pip);
        const epoch = tick.epoch || Math.floor(Date.now() / 1000);
        const quoteNum = Number(tick.quote);

        const newTickItem: TTickItem = {
            quote: quoteNum,
            digit: lastDigit,
            epoch,
            formattedPrice,
        };

        // If this is the active selected market:
        if (symbol === this.selected_symbol) {
            this.current_price = formattedPrice;
            this.last_digit = lastDigit;

            const updatedBuffer = [...this.ticks_buffer, newTickItem];
            if (updatedBuffer.length > 50) updatedBuffer.shift();
            this.ticks_buffer = updatedBuffer;

            // Recalculate metrics for active market
            this.recalculateCurrentMarket();

            // Handle pending simulation trade resolution if any
            if (this.pending_simulation && this.pending_simulation.market === symbol) {
                this.resolveSimulatedTrade(lastDigit, formattedPrice);
            }

            // Autotrading State Machine evaluation on new tick
            if (this.is_autotrading_enabled && !this.is_paused) {
                this.evaluateAutotradeOnTick();
            }
        }

        // Also update multi-market snapshot in memory
        this.updateMarketSnapshot(symbol, newTickItem, symObj?.display_name || symbol, pip);
    };

    // --- CALCULATION ENGINE: CURRENT MARKET ---
    @action
    private recalculateCurrentMarket = () => {
        const digits = this.ticks_buffer.map(t => t.digit);
        const totalTicks = digits.length;

        if (totalTicks < 15) {
            this.engine_state = 'OBSERVING';
            this.state_reason = `Gathering ticks (${totalTicks}/50)`;
            return;
        }

        const dist50 = calculateWindowDistribution(digits);
        const dist25 = calculateWindowDistribution(digits.slice(-25));
        const dist20 = calculateWindowDistribution(digits.slice(-20));
        const dist10 = calculateWindowDistribution(digits.slice(-10));
        const dist7 = calculateWindowDistribution(digits.slice(-7));
        const dist5 = calculateWindowDistribution(digits.slice(-5));
        const dist3 = calculateWindowDistribution(digits.slice(-3));
        const overlapping = calculateOverlappingDistribution(digits);

        const dominantSide: 'UNDER' | 'OVER' | 'NEUTRAL' =
            dist50.underPct > dist50.overPct + 4
                ? 'UNDER'
                : dist50.overPct > dist50.underPct + 4
                ? 'OVER'
                : 'NEUTRAL';

        const trend = determineTrendDirection(dist50, dist25, dist10, dist7);
        const momentum = determineMomentumDirection(dominantSide, dist50, dist25, dist10, dist7);

        const underEntry = calculateWeightedEntryDigit(digits, 'UNDER');
        const overEntry = calculateWeightedEntryDigit(digits, 'OVER');
        const activeEntry = dominantSide === 'UNDER' ? underEntry : overEntry;

        const stabilityResult = calculateStabilityScore({
            dist50,
            dist25,
            dist10,
            dist7,
            momentum,
            regimeDurationSeconds: this.regime_duration_seconds,
            reversalCount: this.reversal_count,
            entryDigitConfidence: activeEntry.confidence,
        });

        const newRegime = determineRegime(
            totalTicks,
            dominantSide,
            trend,
            momentum,
            dist7,
            stabilityResult.score
        );

        // Check if regime changed
        if (newRegime !== this.current_regime) {
            if (this.current_regime !== 'OBSERVING') {
                this.regime_durations_history.push({
                    regime: this.current_regime,
                    duration: this.regime_duration_seconds,
                });
                if (newRegime.includes('REVERSING')) {
                    this.reversal_count++;
                }
            }
            this.current_regime = newRegime;
            this.regime_started_epoch = Date.now();
            this.regime_duration_seconds = 0;
        }

        const apexResult = calculateApexScore({
            overlapping,
            dist50,
            dist25,
            dist10,
            dist7,
            entryDigit: activeEntry,
            stabilityScore: stabilityResult.score,
            dominantSide,
        });

        // Determine Signal Status
        const underEval = evaluateUnderSignal({
            dist50,
            dist25,
            dist10,
            dist7,
            overlapping,
            momentum,
            entryDigit: underEntry,
            stabilityScore: stabilityResult.score,
            reversalDetected: momentum === 'REVERSING',
            hasActiveTrade: this.is_trade_in_progress,
            currentRuns: this.sequence_runs,
            maxRuns: this.risk_settings.maxRunsPerSequence,
            minStabilityThreshold: this.risk_settings.minStabilityScore,
            min7ConfirmationThreshold: this.risk_settings.minLast7Confirmation,
        });

        const overEval = evaluateOverSignal({
            dist50,
            dist25,
            dist10,
            dist7,
            overlapping,
            momentum,
            entryDigit: overEntry,
            stabilityScore: stabilityResult.score,
            reversalDetected: momentum === 'REVERSING',
            hasActiveTrade: this.is_trade_in_progress,
            currentRuns: this.sequence_runs,
            maxRuns: this.risk_settings.maxRunsPerSequence,
            minStabilityThreshold: this.risk_settings.minStabilityScore,
            min7ConfirmationThreshold: this.risk_settings.minLast7Confirmation,
        });

        let signal: 'UNDER' | 'OVER' | 'NONE' = 'NONE';
        let signalStatus: 'READY' | 'FORMING' | 'WATCH' | 'NO TRADE' = 'NO TRADE';

        if (underEval.passes) {
            signal = 'UNDER';
            signalStatus = 'READY';
            this.engine_state = 'ENTRY_READY';
            this.state_reason = underEval.reason;
        } else if (overEval.passes) {
            signal = 'OVER';
            signalStatus = 'READY';
            this.engine_state = 'ENTRY_READY';
            this.state_reason = overEval.reason;
        } else if (dist50.underPct >= 52 || dist50.overPct >= 52) {
            signalStatus = 'FORMING';
            this.engine_state = 'SIGNAL_FORMING';
            this.state_reason = dominantSide === 'UNDER' ? underEval.reason : overEval.reason;
        } else {
            signalStatus = 'WATCH';
            this.engine_state = 'ANALYZING';
            this.state_reason = 'Evaluating market distribution';
        }

        // Update active market snapshot
        const symObj = this.active_symbols.find(s => s.symbol === this.selected_symbol);
        const snapshot: TMarketSnapshot = {
            symbol: this.selected_symbol,
            displayName: symObj?.display_name || this.selected_symbol,
            pipSize: this.pip_size,
            currentPrice: this.current_price,
            lastDigit: this.last_digit,
            ticks50: this.ticks_buffer,
            under04Pct: dist50.underPct,
            over59Pct: dist50.overPct,
            under04Count: dist50.underCount,
            over59Count: dist50.overCount,
            under05Pct: overlapping.under05Pct,
            over49Pct: overlapping.over49Pct,
            under05Count: overlapping.under05Count,
            over49Count: overlapping.over49Count,
            last20: dist20,
            last10: dist10,
            last7: dist7,
            last5: dist5,
            last3: dist3,
            digitFrequencies: calculateDigitFrequencies(digits),
            direction: trend,
            momentum,
            dominantSide,
            underEntryDigit: underEntry,
            overEntryDigit: overEntry,
            activeEntryDigit: activeEntry,
            apexScore: apexResult.score,
            scoreClass: apexResult.classification,
            stabilityScore: stabilityResult.score,
            stabilityClass: stabilityResult.classification,
            reversalRisk: momentum === 'REVERSING' ? 'HIGH' : momentum === 'WEAKENING' ? 'MEDIUM' : 'LOW',
            regime: newRegime,
            regimeDurationSeconds: this.regime_duration_seconds,
            regimeStartedAt: this.regime_started_epoch,
            signal,
            signalStatus,
            lastUpdated: Date.now(),
        };

        this.market_snapshots.set(this.selected_symbol, snapshot);
    };

    // --- SCANNER SNAPSHOT UPDATER FOR MULTI-MARKET ---
    private updateMarketSnapshot(
        symbol: string,
        newTick: TTickItem,
        displayName: string,
        pipSize: number
    ) {
        let existing = this.market_snapshots.get(symbol);
        let ticks: TTickItem[] = [];

        if (existing) {
            ticks = [...existing.ticks50, newTick];
            if (ticks.length > 50) ticks.shift();
        } else {
            ticks = [newTick];
        }

        const digits = ticks.map(t => t.digit);
        const dist50 = calculateWindowDistribution(digits);
        const dist25 = calculateWindowDistribution(digits.slice(-25));
        const dist20 = calculateWindowDistribution(digits.slice(-20));
        const dist10 = calculateWindowDistribution(digits.slice(-10));
        const dist7 = calculateWindowDistribution(digits.slice(-7));
        const dist5 = calculateWindowDistribution(digits.slice(-5));
        const dist3 = calculateWindowDistribution(digits.slice(-3));
        const overlapping = calculateOverlappingDistribution(digits);

        const dominantSide: 'UNDER' | 'OVER' | 'NEUTRAL' =
            dist50.underPct > dist50.overPct + 4
                ? 'UNDER'
                : dist50.overPct > dist50.underPct + 4
                ? 'OVER'
                : 'NEUTRAL';

        const trend = determineTrendDirection(dist50, dist25, dist10, dist7);
        const momentum = determineMomentumDirection(dominantSide, dist50, dist25, dist10, dist7);
        const underEntry = calculateWeightedEntryDigit(digits, 'UNDER');
        const overEntry = calculateWeightedEntryDigit(digits, 'OVER');
        const activeEntry = dominantSide === 'UNDER' ? underEntry : overEntry;

        const stabilityResult = calculateStabilityScore({
            dist50,
            dist25,
            dist10,
            dist7,
            momentum,
            regimeDurationSeconds: existing?.regimeDurationSeconds || 30,
            reversalCount: 0,
            entryDigitConfidence: activeEntry.confidence,
        });

        const apexResult = calculateApexScore({
            overlapping,
            dist50,
            dist25,
            dist10,
            dist7,
            entryDigit: activeEntry,
            stabilityScore: stabilityResult.score,
            dominantSide,
        });

        const regime = determineRegime(
            digits.length,
            dominantSide,
            trend,
            momentum,
            dist7,
            stabilityResult.score
        );

        let signal: 'UNDER' | 'OVER' | 'NONE' = 'NONE';
        let signalStatus: 'READY' | 'FORMING' | 'WATCH' | 'NO TRADE' = 'NO TRADE';
        if (dist50.underPct >= 55 && dist7.underPct >= 70 && stabilityResult.score >= 65) {
            signal = 'UNDER';
            signalStatus = 'READY';
        } else if (dist50.overPct >= 55 && dist7.overPct >= 70 && stabilityResult.score >= 65) {
            signal = 'OVER';
            signalStatus = 'READY';
        } else if (dist50.underPct >= 52 || dist50.overPct >= 52) {
            signalStatus = 'FORMING';
        }

        const snapshot: TMarketSnapshot = {
            symbol,
            displayName,
            pipSize,
            currentPrice: newTick.formattedPrice,
            lastDigit: newTick.digit,
            ticks50: ticks,
            under04Pct: dist50.underPct,
            over59Pct: dist50.overPct,
            under04Count: dist50.underCount,
            over59Count: dist50.overCount,
            under05Pct: overlapping.under05Pct,
            over49Pct: overlapping.over49Pct,
            under05Count: overlapping.under05Count,
            over49Count: overlapping.over49Count,
            last20: dist20,
            last10: dist10,
            last7: dist7,
            last5: dist5,
            last3: dist3,
            digitFrequencies: calculateDigitFrequencies(digits),
            direction: trend,
            momentum,
            dominantSide,
            underEntryDigit: underEntry,
            overEntryDigit: overEntry,
            activeEntryDigit: activeEntry,
            apexScore: apexResult.score,
            scoreClass: apexResult.classification,
            stabilityScore: stabilityResult.score,
            stabilityClass: stabilityResult.classification,
            reversalRisk: momentum === 'REVERSING' ? 'HIGH' : momentum === 'WEAKENING' ? 'MEDIUM' : 'LOW',
            regime,
            regimeDurationSeconds: existing ? existing.regimeDurationSeconds + 1 : 1,
            regimeStartedAt: existing?.regimeStartedAt || Date.now(),
            signal,
            signalStatus,
            lastUpdated: Date.now(),
        };

        this.market_snapshots.set(symbol, snapshot);
    }

    // --- COMPUTED: CURRENT ACTIVE SNAPSHOT ---
    @computed
    get current_snapshot(): TMarketSnapshot | null {
        return this.market_snapshots.get(this.selected_symbol) || null;
    }

    // --- COMPUTED: BEST MARKET RANKER ---
    @computed
    get ranked_markets(): TMarketSnapshot[] {
        const list = Array.from(this.market_snapshots.values());
        return list.sort((a, b) => b.apexScore - a.apexScore);
    }

    @computed
    get best_market(): TMarketSnapshot | null {
        return this.ranked_markets.length > 0 ? this.ranked_markets[0] : null;
    }

    @action
    activateBestMarket = () => {
        const best = this.best_market;
        if (best && best.symbol !== this.selected_symbol) {
            this.switchMarket(best.symbol);
        }
    };

    // --- AUTOTRADING CONTROL & SAFETY GATES ---
    @action
    openConfirmModal = () => {
        this.is_confirm_modal_open = true;
    };

    @action
    closeConfirmModal = () => {
        this.is_confirm_modal_open = false;
    };

    @action
    startAutotrading = () => {
        this.is_confirm_modal_open = false;
        this.is_autotrading_enabled = true;
        this.is_paused = false;
        this.pause_reason = '';
        this.engine_state = 'ANALYZING';
        this.state_reason = 'Autotrading active. Waiting for confirmed entry signal';
    };

    @action
    pauseAutotrading = (reason: string) => {
        this.is_paused = true;
        this.pause_reason = reason;
        this.engine_state = 'PAUSED';
        this.state_reason = `Auto Paused: ${reason}`;
    };

    @action
    resumeAutotrading = () => {
        this.is_paused = false;
        this.pause_reason = '';
        this.engine_state = 'REANALYZING';
        this.state_reason = 'Reanalyzing market conditions for fresh confirmation';
    };

    @action
    stopAutotrading = () => {
        this.is_autotrading_enabled = false;
        this.is_paused = false;
        this.pause_reason = '';
        this.engine_state = 'STOPPED';
        this.state_reason = 'Autotrading stopped by user';
    };

    @action
    resetSequenceRuns = () => {
        this.sequence_runs = 0;
        if (this.is_autotrading_enabled && this.is_paused && this.pause_reason.includes('5 RUN LIMIT')) {
            this.resumeAutotrading();
        }
    };

    // --- AUTOTRADE TICK EVALUATION & 17-STEP VERIFICATION ---
    @action
    private evaluateAutotradeOnTick = () => {
        if (!this.is_autotrading_enabled || this.is_paused || this.is_trade_in_progress) {
            return;
        }

        if (this.cooldown_seconds_remaining > 0) {
            return;
        }

        const snapshot = this.current_snapshot;
        if (!snapshot || snapshot.ticks50.length < 30) {
            return;
        }

        // Maximum 5-run sequence check (Section 22)
        if (this.sequence_runs >= this.risk_settings.maxRunsPerSequence) {
            this.pauseAutotrading(
                `Maximum ${this.risk_settings.maxRunsPerSequence}-run sequence limit reached. Reanalysis required.`
            );
            return;
        }

        // Consecutive losses risk check (Section 40)
        if (this.consecutive_losses >= this.risk_settings.maxConsecutiveLosses) {
            this.pauseAutotrading(
                `Max consecutive losses limit reached (${this.consecutive_losses} losses). Risk lock activated.`
            );
            return;
        }

        // Daily loss limit check
        if (this.daily_session_pl <= -Math.abs(this.risk_settings.maxDailyLoss)) {
            this.pauseAutotrading(
                `Daily loss limit reached ($${this.daily_session_pl.toFixed(2)}). Session halted.`
            );
            return;
        }

        // Signal Gate Evaluation
        const isUnderSignal = snapshot.signal === 'UNDER' && snapshot.signalStatus === 'READY';
        const isOverSignal = snapshot.signal === 'OVER' && snapshot.signalStatus === 'READY';

        if (!isUnderSignal && !isOverSignal) {
            return;
        }

        const direction: 'UNDER' | 'OVER' = isUnderSignal ? 'UNDER' : 'OVER';
        const contractType: TContractType = direction === 'UNDER' ? 'DIGITUNDER' : 'DIGITOVER';
        const barrier = direction === 'UNDER' ? 6 : 3;

        // Gate 18: Last 7 Tick Gate re-checked immediately before trade
        const last7 = snapshot.last7;
        const required7Confirmation = this.risk_settings.minLast7Confirmation;
        const current7Count = direction === 'UNDER' ? last7.underCount : last7.overCount;

        if (current7Count < required7Confirmation) {
            this.pauseAutotrading(
                `Last 7 ticks (${current7Count}/7 ${direction}) failed immediate entry confirmation gate.`
            );
            return;
        }

        // Apex Score threshold check
        if (snapshot.apexScore < this.risk_settings.minApexScore) {
            this.pauseAutotrading(
                `Apex Market Score (${snapshot.apexScore}) dropped below minimum ${this.risk_settings.minApexScore}.`
            );
            return;
        }

        // Stability Score threshold check
        if (snapshot.stabilityScore < this.risk_settings.minStabilityScore) {
            this.pauseAutotrading(
                `Market stability (${snapshot.stabilityScore}) dropped below minimum ${this.risk_settings.minStabilityScore}.`
            );
            return;
        }

        // Automatic Market Switching Candidate Check (Section 13)
        if (this.risk_settings.autoSwitchMarket && this.best_market) {
            const best = this.best_market;
            if (best.symbol !== this.selected_symbol && best.apexScore > snapshot.apexScore + 10) {
                // Better market exists, switch candidate
                this.state_reason = `Switch candidate found: ${best.displayName} (Score ${best.apexScore}). Switching market safely...`;
                this.switchMarket(best.symbol);
                return;
            }
        }

        // All checks passed! Proceed to execution
        this.executeTrade(direction, contractType, barrier, snapshot);
    };

    // --- TRADE EXECUTION (LIVE OR SIMULATION) ---
    @action
    private executeTrade = async (
        direction: 'UNDER' | 'OVER',
        contractType: TContractType,
        barrier: number,
        snapshot: TMarketSnapshot
    ) => {
        this.is_trade_in_progress = true;
        this.engine_state = 'EXECUTING';

        const entryReason =
            `${direction} 0-4 = ${direction === 'UNDER' ? snapshot.under04Pct : snapshot.over59Pct}%. ` +
            `Last 10 = ${snapshot.last10.underCount}U / ${snapshot.last10.overCount}O. ` +
            `Last 7 = ${snapshot.last7.underCount}U / ${snapshot.last7.overCount}O. ` +
            `Apex Quality = ${snapshot.apexScore}/100. Stability = ${snapshot.stabilityScore}/100. ` +
            `Entry digit = ${snapshot.activeEntryDigit?.digit}. ` +
            `No reversal detected. Confirmed ${contractType} ${barrier} entry.`;

        const journalItem: TTradeJournalItem = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            timestamp: Date.now(),
            market: snapshot.symbol,
            displayName: snapshot.displayName,
            direction,
            contractType,
            barrier,
            entryDigit: snapshot.lastDigit,
            entryPrice: snapshot.currentPrice,
            stake: this.risk_settings.stake,
            apexScore: snapshot.apexScore,
            stabilityScore: snapshot.stabilityScore,
            under04: snapshot.under04Pct,
            over59: snapshot.over59Pct,
            under05: snapshot.under05Pct,
            over49: snapshot.over49Pct,
            last10: `${snapshot.last10.underCount}U / ${snapshot.last10.overCount}O`,
            last7: `${snapshot.last7.underCount}U / ${snapshot.last7.overCount}O`,
            signalStrength: snapshot.scoreClass,
            regime: snapshot.regime,
            entryReason,
            isSimulated: this.trade_mode === 'SIMULATION',
        };

        if (this.trade_mode === 'SIMULATION') {
            // Paper Trading Mode
            this.pending_simulation = {
                id: journalItem.id,
                contractType,
                entryDigit: snapshot.lastDigit,
                stake: this.risk_settings.stake,
                entryTime: Date.now(),
                market: snapshot.symbol,
            };

            runInAction(() => {
                this.sequence_runs++;
                this.simulation_stats.totalSignals++;
                this.simulation_stats.totalTrades++;
                this.trade_journal.unshift(journalItem);
                this.saveJournal();
                this.engine_state = 'TRADE_ACTIVE';
                this.state_reason = `Simulated ${contractType} open. Waiting for next tick...`;
            });
        } else {
            // Live Authenticated Deriv Execution
            await this.executeLiveContract(journalItem, contractType, barrier, snapshot);
        }
    };

    // --- SIMULATION TICK RESOLUTION ---
    @action
    private resolveSimulatedTrade = (nextDigit: number, nextPrice: string) => {
        if (!this.pending_simulation) return;

        const sim = this.pending_simulation;
        this.pending_simulation = null;

        let won = false;
        if (sim.contractType === 'DIGITUNDER') {
            // DIGITUNDER 6 wins on digits 0, 1, 2, 3, 4, 5
            won = nextDigit <= 5;
        } else {
            // DIGITOVER 3 wins on digits 4, 5, 6, 7, 8, 9
            won = nextDigit >= 4;
        }

        // Standard Deriv payout for 6 winning digits out of 10 is ~1.40x to 1.45x return (~40% net profit)
        const profit = won
            ? Number((sim.stake * 0.41).toFixed(2))
            : -Number(sim.stake.toFixed(2));

        runInAction(() => {
            if (won) {
                this.simulation_stats.wins++;
                this.consecutive_losses = 0;
            } else {
                this.simulation_stats.losses++;
                this.consecutive_losses++;
            }
            this.simulation_stats.simulatedPL = Number(
                (this.simulation_stats.simulatedPL + profit).toFixed(2)
            );
            const total = this.simulation_stats.wins + this.simulation_stats.losses;
            this.simulation_stats.winRate = total > 0 ? Number(((this.simulation_stats.wins / total) * 100).toFixed(1)) : 0;
            this.daily_session_pl = Number((this.daily_session_pl + profit).toFixed(2));

            // Update matching journal item
            const found = this.trade_journal.find(j => j.id === sim.id);
            if (found) {
                found.exitResult = won ? 'WIN' : 'LOSS';
                found.profit = profit;
                found.exitPrice = nextPrice;
                found.exitDigit = nextDigit;
                found.durationSeconds = Math.max(1, Math.floor((Date.now() - sim.entryTime) / 1000));
            }
            this.saveJournal();

            this.is_trade_in_progress = false;
            this.startCooldown();
        });
    };

    // --- LIVE DERIV CONTRACT EXECUTION ---
    private executeLiveContract = async (
        journalItem: TTradeJournalItem,
        contractType: TContractType,
        barrier: number,
        snapshot: TMarketSnapshot
    ) => {
        // Step 1: Verify authenticated account
        const client = this.root_store.client;
        if (!client?.is_logged_in) {
            runInAction(() => {
                this.pauseAutotrading('Trading blocked: No authenticated Deriv account.');
                this.is_trade_in_progress = false;
            });
            return;
        }

        // Step 2: Verify balance
        const balance = Number(client.balance || 0);
        if (balance < this.risk_settings.stake) {
            runInAction(() => {
                this.pauseAutotrading('Trading blocked: Insufficient balance.');
                this.is_trade_in_progress = false;
            });
            return;
        }

        try {
            // Step 3: Request fresh Proposal
            const currency = client.currency || 'USD';
            const proposalReq: Record<string, any> = {
                proposal: 1,
                amount: this.risk_settings.stake,
                basis: 'stake',
                contract_type: contractType,
                currency,
                duration: 1,
                duration_unit: 't',
                symbol: snapshot.symbol,
                barrier: String(barrier),
            };

            const proposalRes = await (api_base.api as any).send(proposalReq);
            if (proposalRes?.error || !proposalRes?.proposal?.id) {
                const errMsg = proposalRes?.error?.message || 'Proposal unavailable';
                runInAction(() => {
                    this.pauseAutotrading(`Proposal request rejected: ${errMsg}`);
                    this.is_trade_in_progress = false;
                });
                return;
            }

            const proposalId = proposalRes.proposal.id;
            const askPrice = Number(proposalRes.proposal.ask_price || this.risk_settings.stake);
            journalItem.proposalId = proposalId;

            // Step 4: Buy contract
            const buyRes = await (api_base.api as any).send({
                buy: proposalId,
                price: askPrice,
            });

            if (buyRes?.error || !buyRes?.buy?.contract_id) {
                const errMsg = buyRes?.error?.message || 'Purchase execution failed';
                runInAction(() => {
                    this.pauseAutotrading(`Buy execution rejected: ${errMsg}`);
                    this.is_trade_in_progress = false;
                });
                return;
            }

            const contractId = String(buyRes.buy.contract_id);
            journalItem.contractId = contractId;

            runInAction(() => {
                this.active_contract_id = contractId;
                this.sequence_runs++;
                this.trade_journal.unshift(journalItem);
                this.saveJournal();
                this.engine_state = 'TRADE_ACTIVE';
                this.state_reason = `Live ${contractType} active (ID: ${contractId}). Monitoring...`;
            });

            // Step 5: Subscribe & Monitor Open Contract
            this.monitorLiveContract(contractId, journalItem);
        } catch (e: any) {
            console.error('[ApexStore] Live trade execution error:', e);
            runInAction(() => {
                this.pauseAutotrading(`Execution error: ${e?.message || 'Network exception'}`);
                this.is_trade_in_progress = false;
            });
        }
    };

    private monitorLiveContract = (contractId: string, journalItem: TTradeJournalItem) => {
        let isDone = false;
        const sub = (api_base.api as any).send({
            proposal_open_contract: 1,
            contract_id: contractId,
            subscribe: 1,
        });

        const handleContractUpdate = (data: any) => {
            const poc = data?.proposal_open_contract;
            if (!poc || String(poc.contract_id) !== contractId || isDone) return;

            if (poc.is_sold === 1) {
                isDone = true;
                const profit = Number(poc.profit || 0);
                const won = profit > 0;

                runInAction(() => {
                    this.active_contract_id = null;
                    this.is_trade_in_progress = false;

                    if (won) {
                        this.consecutive_losses = 0;
                    } else {
                        this.consecutive_losses++;
                    }
                    this.daily_session_pl = Number((this.daily_session_pl + profit).toFixed(2));

                    journalItem.exitResult = won ? 'WIN' : 'LOSS';
                    journalItem.profit = profit;
                    journalItem.exitPrice = String(poc.exit_tick || poc.current_spot || '');
                    journalItem.durationSeconds = Math.max(1, poc.date_expiry - poc.date_start);
                    this.saveJournal();

                    this.startCooldown();
                });
            }
        };

        // Listen via Deriv message stream
        const msgSub = (api_base.api as any).onMessage().subscribe((res: any) => {
            if (res?.msg_type === 'proposal_open_contract') {
                handleContractUpdate(res);
                if (isDone && msgSub?.unsubscribe) {
                    msgSub.unsubscribe();
                }
            }
        });
    };

    // --- COOLDOWN SYSTEM ---
    private startCooldown = () => {
        this.cooldown_seconds_remaining = this.risk_settings.cooldownSeconds;
        this.engine_state = 'COOLDOWN';
        this.state_reason = `Trade completed. In cooldown (${this.cooldown_seconds_remaining}s)...`;

        if (this.cooldown_timer_id) clearInterval(this.cooldown_timer_id);

        this.cooldown_timer_id = setInterval(() => {
            runInAction(() => {
                this.cooldown_seconds_remaining--;
                if (this.cooldown_seconds_remaining <= 0) {
                    if (this.cooldown_timer_id) clearInterval(this.cooldown_timer_id);
                    this.cooldown_timer_id = null;
                    this.engine_state = 'REANALYZING';
                    this.state_reason = 'Cooldown complete. Reanalyzing market structure';
                }
            });
        }, 1000);
    };

    // --- 30-MINUTE OBSERVATION MODE STOPWATCH ---
    @action
    toggleObservationMode = () => {
        this.is_observation_mode_active = !this.is_observation_mode_active;
        if (this.is_observation_mode_active) {
            this.observation_elapsed_seconds = 0;
            if (this.observation_timer_id) clearInterval(this.observation_timer_id);
            this.observation_timer_id = setInterval(() => {
                runInAction(() => {
                    this.observation_elapsed_seconds++;
                });
            }, 1000);
        } else {
            if (this.observation_timer_id) clearInterval(this.observation_timer_id);
            this.observation_timer_id = null;
        }
    };

    @action
    updateRiskSettings = (newSettings: Partial<TRiskSettings>) => {
        this.risk_settings = { ...this.risk_settings, ...newSettings };
        this.saveSettings();
    };

    @action
    setTradeMode = (mode: 'LIVE' | 'SIMULATION') => {
        this.trade_mode = mode;
    };

    @action
    setSelectedJournalItem = (item: TTradeJournalItem | null) => {
        this.selected_journal_item = item;
    };

    @action
    clearJournal = () => {
        this.trade_journal = [];
        this.saveJournal();
    };

    dispose = () => {
        this.active_tick_listeners.forEach(sub => sub.unsubscribe());
        this.active_tick_listeners.clear();
        if (this.cooldown_timer_id) clearInterval(this.cooldown_timer_id);
        if (this.regime_clock_timer_id) clearInterval(this.regime_clock_timer_id);
        if (this.observation_timer_id) clearInterval(this.observation_timer_id);
    };
}
