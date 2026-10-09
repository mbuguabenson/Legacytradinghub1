import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import { api_base } from '@/external/bot-skeleton/services/api/api-base';
import { subscribeTicks } from '@/utils/websocket-handler';
import { ALL_DERIV_MARKETS } from '@/constants/markets';
import {
    TSignalStatus,
    TMarketStability,
    TDirection,
    TContractDirection,
    TTickItem,
    TDigitFrequency,
    TConditionCheck,
    TRollingStats,
    TEntryDigitIntelligence,
    TMarketScanSummary,
    TMegastreakConfig,
    TSignalLogItem,
    TViewMode,
} from './types';

export class MegastreakEngine {
    // ── Observable State ────────────────────────────────────────────────────────
    @observable accessor selected_symbol: string = 'R_100';
    @observable accessor display_name: string = 'Volatility 100 Index';
    @observable accessor pip_size: number = 2;
    @observable accessor is_loading_ticks: boolean = false;
    @observable accessor is_connected: boolean = true;
    @observable accessor current_price: number = 0;
    @observable accessor latest_digit: number | null = null;
    @observable accessor ticks: TTickItem[] = [];
    @observable accessor last_tick_timestamp: number = 0;

    // Active markets list
    @observable accessor available_symbols: { symbol: string; display_name: string; pip_size: number }[] = [];

    // Configuration
    @observable accessor config: TMegastreakConfig = {
        underThresholdPct: 55,
        overThresholdPct: 55,
        last7ConfirmMin: 5,
        last10FavouredMin: 6,
        stabilityFilterEnabled: true,
    };

    // Selected analysis tab for entry checklist
    @observable accessor selected_direction_tab: TContractDirection = 'UNDER 6';

    // Signal state tracking
    @observable accessor signal_status: TSignalStatus = 'DATA INSUFFICIENT';
    @observable accessor stop_reason: string = '';
    @observable accessor fresh_confirmation_count: number = 0;
    @observable accessor previous_signal_met: boolean = false;

    // Multi-market scanner state
    @observable accessor is_scanning_all: boolean = false;
    @observable accessor scan_progress: number = 0;
    @observable accessor all_markets_stats: TMarketScanSummary[] = [];
    @observable accessor is_best_market_expanded: boolean = false;

    // Activity Log
    @observable accessor signal_logs: TSignalLogItem[] = [];

    // User Interface Mode: Beginner vs Pro
    @observable accessor view_mode: TViewMode = 'beginner';
    @observable accessor is_guide_open: boolean = false;

    // Private subscriptions
    private tickSubscription: { unsubscribe: () => void } | null = null;
    private staleCheckInterval: ReturnType<typeof setInterval> | null = null;
    private isDestroyed = false;

    constructor() {
        makeObservable(this);
        this.init();
    }

    // ── Initialization & Lifecycle ──────────────────────────────────────────────
    private async init() {
        await this.loadAvailableSymbols();
        await this.selectSymbol(this.selected_symbol);
        this.startStaleTickWatchdog();
    }

    public destroy() {
        this.isDestroyed = true;
        if (this.tickSubscription) {
            this.tickSubscription.unsubscribe();
            this.tickSubscription = null;
        }
        if (this.staleCheckInterval) {
            clearInterval(this.staleCheckInterval);
            this.staleCheckInterval = null;
        }
    }

    // ── Symbol Discovery ────────────────────────────────────────────────────────
    @action
    public async loadAvailableSymbols() {
        try {
            let rawList: any[] = [];
            if (typeof api_base.getActiveSymbols === 'function') {
                rawList = await api_base.getActiveSymbols();
            } else if (api_base.api) {
                const res: any = await (api_base.api as any).send({
                    active_symbols: 'brief',
                    product_type: 'basic',
                });
                rawList = res?.active_symbols || [];
            }

            const synthetics = (rawList || [])
                .filter((s: any) => {
                    const isSynthetic =
                        s.market === 'synthetic_index' ||
                        s.submarket === 'random_index' ||
                        s.submarket === 'continuous_index' ||
                        s.submarket === 'random_daily' ||
                        s.submarket === 'crash_index';
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
                    this.available_symbols = synthetics;
                } else {
                    // Fallback to core ALL_DERIV_MARKETS
                    this.available_symbols = ALL_DERIV_MARKETS.filter(
                        m => m.market === 'synthetic_index' || m.group === 'Continuous Indices'
                    ).map(m => ({
                        symbol: m.value,
                        display_name: m.label,
                        pip_size: 2,
                    }));
                }

                // Match pip_size of current symbol if available
                const current = this.available_symbols.find(s => s.symbol === this.selected_symbol);
                if (current) {
                    this.pip_size = current.pip_size;
                    this.display_name = current.display_name;
                }
            });
        } catch (e) {
            console.warn('[MegastreakEngine] Symbol discovery fallback:', e);
            runInAction(() => {
                this.available_symbols = ALL_DERIV_MARKETS.filter(
                    m => m.market === 'synthetic_index' || m.group === 'Continuous Indices'
                ).map(m => ({
                    symbol: m.value,
                    display_name: m.label,
                    pip_size: 2,
                }));
            });
        }
    }

    // ── Symbol Selection & Tick Stream ──────────────────────────────────────────
    @action
    public async selectSymbol(symbol: string) {
        if (!symbol) return;

        // Cleanup old subscription
        if (this.tickSubscription) {
            this.tickSubscription.unsubscribe();
            this.tickSubscription = null;
        }

        const symObj = this.available_symbols.find(s => s.symbol === symbol);
        const resolvedPip = symObj ? symObj.pip_size : this.pip_size;
        const resolvedName = symObj ? symObj.display_name : symbol;

        runInAction(() => {
            this.selected_symbol = symbol;
            this.display_name = resolvedName;
            this.pip_size = resolvedPip;
            this.ticks = [];
            this.is_loading_ticks = true;
            this.signal_status = 'DATA INSUFFICIENT';
            this.previous_signal_met = false;
            this.fresh_confirmation_count = 0;
            this.stop_reason = '';
        });

        // 1. Fetch historical 50 ticks for warm-up
        try {
            if (api_base.api) {
                const histRes: any = await (api_base.api as any).send({
                    ticks_history: symbol,
                    count: 50,
                    end: 'latest',
                    style: 'ticks',
                });

                if (this.selected_symbol !== symbol) return;

                const history = histRes?.history || histRes?.ticks_history;
                if (history?.prices && Array.isArray(history.prices) && history.prices.length > 0) {
                    const times = history.times || [];
                    const loadedTicks: TTickItem[] = history.prices.map((p: any, idx: number) => {
                        const quote = Number(p);
                        const digit = this.extractLastDigit(quote, resolvedPip);
                        const epoch = times[idx] ? Number(times[idx]) : Date.now() / 1000;
                        return { quote, digit, epoch };
                    });

                    runInAction(() => {
                        this.ticks = loadedTicks.slice(-50);
                        if (this.ticks.length > 0) {
                            const last = this.ticks[this.ticks.length - 1];
                            this.current_price = last.quote;
                            this.latest_digit = last.digit;
                            this.last_tick_timestamp = Date.now();
                        }
                    });
                }
            }
        } catch (err) {
            console.warn(`[MegastreakEngine] Failed history for ${symbol}:`, err);
        }

        if (this.selected_symbol !== symbol || this.isDestroyed) return;

        runInAction(() => {
            this.is_loading_ticks = false;
            this.recalculateSignals();
        });

        // 2. Subscribe to live ticks via centralized derivTickManager
        this.tickSubscription = subscribeTicks(symbol, (tickRes: any) => {
            if (this.isDestroyed || this.selected_symbol !== symbol) return;

            const t = tickRes?.tick;
            if (t && t.symbol === symbol && t.quote !== undefined) {
                const quote = Number(t.quote);
                const pip = typeof t.pip_size === 'number' ? t.pip_size : resolvedPip;
                const digit = this.extractLastDigit(quote, pip);
                const epoch = t.epoch || Date.now() / 1000;

                this.onNewTick({ quote, digit, epoch });
            }
        });
    }

    // ── Tick Processing ─────────────────────────────────────────────────────────
    @action
    private onNewTick(tick: TTickItem) {
        this.current_price = tick.quote;
        this.latest_digit = tick.digit;
        this.last_tick_timestamp = Date.now();
        this.is_connected = true;

        // Maintain strictly 50 rolling ticks
        const nextTicks = [...this.ticks, tick];
        if (nextTicks.length > 50) {
            this.ticks = nextTicks.slice(-50);
        } else {
            this.ticks = nextTicks;
        }

        this.recalculateSignals();
    }

    // ── Digit Extraction Helper ─────────────────────────────────────────────────
    public extractLastDigit(price: number | string, pip: number): number {
        const p = Number(price);
        if (isNaN(p)) return 0;
        const fixed = p.toFixed(Math.max(0, pip));
        const lastChar = fixed[fixed.length - 1];
        const d = parseInt(lastChar, 10);
        return isNaN(d) ? 0 : d;
    }

    // ── Stale Tick Watchdog ──────────────────────────────────────────────────────
    private startStaleTickWatchdog() {
        if (this.staleCheckInterval) clearInterval(this.staleCheckInterval);
        this.staleCheckInterval = setInterval(() => {
            if (this.ticks.length >= 50 && this.last_tick_timestamp > 0) {
                const elapsedMs = Date.now() - this.last_tick_timestamp;
                if (elapsedMs > 6500) {
                    // Stale tick stream detected
                    runInAction(() => {
                        this.is_connected = false;
                        if (
                            this.signal_status === 'UNDER CONDITIONS MET' ||
                            this.signal_status === 'OVER CONDITIONS MET' ||
                            this.signal_status === 'UNDER FORMING' ||
                            this.signal_status === 'OVER FORMING'
                        ) {
                            this.setSignalStatus('STOP — SIGNAL INVALIDATED', 'Tick stream stale (>6s) or disconnected');
                        }
                    });
                }
            }
        }, 2000);
    }

    // ── Signal Recalculation Engine ─────────────────────────────────────────────
    @action
    private recalculateSignals() {
        if (this.ticks.length < 50) {
            this.signal_status = 'DATA INSUFFICIENT';
            this.stop_reason = `Warming up (${this.ticks.length}/50 ticks)`;
            return;
        }

        const stability = this.market_stability;
        if (this.config.stabilityFilterEnabled && stability === 'UNSTABLE') {
            this.setSignalStatus('MARKET UNSTABLE', 'Market stability is UNSTABLE (excessive chop/flip-flop)');
            return;
        }

        const reversal = this.reversal_status;
        if (reversal.isReversal) {
            this.setSignalStatus('REVERSAL DETECTED', reversal.reason);
            return;
        }

        // Check UNDER 6 conditions
        const underConditions = this.under_conditions_check;
        const allUnderMet = underConditions.every(c => c.passed);
        const underMetCount = underConditions.filter(c => c.passed).length;

        // Check OVER 3 conditions
        const overConditions = this.over_conditions_check;
        const allOverMet = overConditions.every(c => c.passed);
        const overMetCount = overConditions.filter(c => c.passed).length;

        // Evaluate state transitions
        if (allUnderMet) {
            if (this.previous_signal_met && this.signal_status === 'STOP — SIGNAL INVALIDATED') {
                // Fresh confirmation requirement: count confirmations
                this.fresh_confirmation_count += 1;
                if (this.fresh_confirmation_count >= 3) {
                    this.setSignalStatus('UNDER CONDITIONS MET', 'All 6 UNDER conditions verified with fresh confirmation');
                } else {
                    this.setSignalStatus('UNDER FORMING', `Confirming signal after stop (${this.fresh_confirmation_count}/3 ticks)`);
                }
            } else {
                this.setSignalStatus('UNDER CONDITIONS MET', 'All 6 conditions met for UNDER 6');
                this.fresh_confirmation_count = 3;
            }
            return;
        }

        if (allOverMet) {
            if (this.previous_signal_met && this.signal_status === 'STOP — SIGNAL INVALIDATED') {
                this.fresh_confirmation_count += 1;
                if (this.fresh_confirmation_count >= 3) {
                    this.setSignalStatus('OVER CONDITIONS MET', 'All 6 OVER conditions verified with fresh confirmation');
                } else {
                    this.setSignalStatus('OVER FORMING', `Confirming signal after stop (${this.fresh_confirmation_count}/3 ticks)`);
                }
            } else {
                this.setSignalStatus('OVER CONDITIONS MET', 'All 6 conditions met for OVER 3');
                this.fresh_confirmation_count = 3;
            }
            return;
        }

        // Check if previously CONDITIONS MET, but now broke
        if (this.previous_signal_met && (this.signal_status === 'UNDER CONDITIONS MET' || this.signal_status === 'OVER CONDITIONS MET')) {
            const brokenReason = this.getStopTriggerReason();
            this.setSignalStatus('STOP — SIGNAL INVALIDATED', brokenReason);
            this.fresh_confirmation_count = 0;
            return;
        }

        // Forming states
        if (underMetCount >= 4) {
            this.setSignalStatus('UNDER FORMING', `${underMetCount}/6 conditions met for UNDER 6`);
            return;
        }

        if (overMetCount >= 4) {
            this.setSignalStatus('OVER FORMING', `${overMetCount}/6 conditions met for OVER 3`);
            return;
        }

        // Default neutral
        if (this.signal_status !== 'STOP — SIGNAL INVALIDATED') {
            this.setSignalStatus('WAIT — CONDITIONS NOT MET', 'Directional bias below entry threshold');
        }
    }

    @action
    private setSignalStatus(status: TSignalStatus, reason: string) {
        if (this.signal_status !== status) {
            const previous = this.signal_status;
            this.signal_status = status;
            this.stop_reason = reason;

            if (status === 'UNDER CONDITIONS MET' || status === 'OVER CONDITIONS MET') {
                this.previous_signal_met = true;
            } else if (status === 'STOP — SIGNAL INVALIDATED') {
                this.previous_signal_met = true;
            } else if (status === 'WAIT — CONDITIONS NOT MET' || status === 'OBSERVING') {
                this.previous_signal_met = false;
            }

            // Append to Activity Log
            const direction =
                status.includes('UNDER') ? ('UNDER 6' as TContractDirection) :
                status.includes('OVER') ? ('OVER 3' as TContractDirection) : undefined;

            this.signal_logs.unshift({
                id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                timestamp: Date.now(),
                symbol: this.selected_symbol,
                status,
                direction,
                reason,
                digit: this.latest_digit ?? undefined,
                price: this.current_price,
            });

            // Keep log compact (latest 50 entries)
            if (this.signal_logs.length > 50) {
                this.signal_logs = this.signal_logs.slice(0, 50);
            }
        } else {
            this.stop_reason = reason;
        }
    }

    private getStopTriggerReason(): string {
        const last7 = this.rolling_stats_7;
        const last10 = this.rolling_stats_10;
        const dist = this.primary_distribution;

        if (this.selected_direction_tab === 'UNDER 6') {
            if (last7.under05Count < this.config.last7ConfirmMin) {
                return `Last 7 ticks no longer meet directional threshold (${last7.under05Count}/7 Under)`;
            }
            if (last10.under05Count < this.config.last10FavouredMin) {
                return `Last 10 ticks reversed direction (${last10.under05Count}/10 Under)`;
            }
            if (dist.under04Pct < this.config.underThresholdPct) {
                return `Under 0-4 distribution dropped to ${dist.under04Pct.toFixed(1)}% (requires >= ${this.config.underThresholdPct}%)`;
            }
            if (last7.over49Pct > 60) {
                return 'Opposite direction (Over 4-9) became dominant';
            }
        } else {
            if (last7.over49Count < this.config.last7ConfirmMin) {
                return `Last 7 ticks no longer meet directional threshold (${last7.over49Count}/7 Over)`;
            }
            if (last10.over49Count < this.config.last10FavouredMin) {
                return `Last 10 ticks reversed direction (${last10.over49Count}/10 Over)`;
            }
            if (dist.over59Pct < this.config.overThresholdPct) {
                return `Over 5-9 distribution dropped to ${dist.over59Pct.toFixed(1)}% (requires >= ${this.config.overThresholdPct}%)`;
            }
            if (last7.under05Pct > 60) {
                return 'Opposite direction (Under 0-5) became dominant';
            }
        }
        return 'Signal invalidated — conditions deteriorated';
    }

    // ── Computed: Digit Distribution 0-9 (50 Ticks) ─────────────────────────────
    @computed
    public get digit_frequencies(): TDigitFrequency[] {
        const total = this.ticks.length;
        const counts = new Array(10).fill(0);

        for (const t of this.ticks) {
            if (t.digit >= 0 && t.digit <= 9) {
                counts[t.digit]++;
            }
        }

        let maxCount = -1;
        let topDigit = -1;
        for (let d = 0; d < 10; d++) {
            if (counts[d] > maxCount) {
                maxCount = counts[d];
                topDigit = d;
            }
        }

        return counts.map((count, digit) => {
            const percentage = total > 0 ? (count / total) * 100 : 0;
            // Scale intensity from 0.1 to 1 based on deviation from 10%
            const intensity = Math.min(1, Math.max(0.15, percentage / 20));
            return {
                digit,
                count,
                percentage,
                isTop: digit === topDigit && count > 0,
                intensity,
            };
        });
    }

    // ── Computed: Card A Primary Distribution (0-4 vs 5-9) ───────────────────────
    @computed
    public get primary_distribution() {
        const total = this.ticks.length;
        let under04Count = 0;
        let over59Count = 0;

        for (const t of this.ticks) {
            if (t.digit <= 4) under04Count++;
            else over59Count++;
        }

        return {
            total,
            under04Count,
            over59Count,
            under04Pct: total > 0 ? (under04Count / total) * 100 : 0,
            over59Pct: total > 0 ? (over59Count / total) * 100 : 0,
        };
    }

    // ── Computed: Card B Contract Analysis (0-5 vs 4-9) ─────────────────────────
    // Groups overlap at digits 4 and 5, so they must not be forced to 100%
    @computed
    public get contract_analysis() {
        const total = this.ticks.length;
        let under05Count = 0;
        let over49Count = 0;

        for (const t of this.ticks) {
            if (t.digit <= 5) under05Count++;
            if (t.digit >= 4) over49Count++;
        }

        return {
            total,
            under05Count,
            over49Count,
            under05Pct: total > 0 ? (under05Count / total) * 100 : 0,
            over49Pct: total > 0 ? (over49Count / total) * 100 : 0,
        };
    }

    // ── Helper: Rolling Window Stats ────────────────────────────────────────────
    private getWindowStats(windowSize: number): TRollingStats {
        const slice = this.ticks.slice(-windowSize);
        const total = slice.length;

        let under04 = 0;
        let over59 = 0;
        let under05 = 0;
        let over49 = 0;

        for (const t of slice) {
            if (t.digit <= 4) under04++;
            else over59++;

            if (t.digit <= 5) under05++;
            if (t.digit >= 4) over49++;
        }

        const under04Pct = total > 0 ? (under04 / total) * 100 : 0;
        const over59Pct = total > 0 ? (over59 / total) * 100 : 0;
        const under05Pct = total > 0 ? (under05 / total) * 100 : 0;
        const over49Pct = total > 0 ? (over49 / total) * 100 : 0;

        let dominant: TDirection = 'NEUTRAL';
        if (under04Pct > 52) dominant = 'UNDER';
        else if (over59Pct > 52) dominant = 'OVER';

        return {
            windowSize,
            under04Count: under04,
            over59Count: over59,
            under04Pct,
            over59Pct,
            under05Count: under05,
            over49Count: over49,
            under05Pct,
            over49Pct,
            dominantDirection: dominant,
            momentum: 'STEADY',
        };
    }

    @computed public get rolling_stats_25(): TRollingStats {
        return this.getWindowStats(25);
    }

    @computed public get rolling_stats_10(): TRollingStats {
        return this.getWindowStats(10);
    }

    @computed public get rolling_stats_7(): TRollingStats {
        return this.getWindowStats(7);
    }

    // ── Computed: Momentum Analysis ─────────────────────────────────────────────
    @computed
    public get momentum_analysis() {
        const s25 = this.rolling_stats_25;
        const s10 = this.rolling_stats_10;
        const s7 = this.rolling_stats_7;

        // Under 0-4 momentum progression
        const underMomentum =
            s7.under04Pct > s10.under04Pct && s10.under04Pct >= s25.under04Pct
                ? 'STRENGTHENING'
                : s7.under04Pct < s10.under04Pct && s10.under04Pct < s25.under04Pct
                ? 'WEAKENING'
                : 'STEADY';

        // Over 5-9 momentum progression
        const overMomentum =
            s7.over59Pct > s10.over59Pct && s10.over59Pct >= s25.over59Pct
                ? 'STRENGTHENING'
                : s7.over59Pct < s10.over59Pct && s10.over59Pct < s25.over59Pct
                ? 'WEAKENING'
                : 'STEADY';

        return {
            under: underMomentum,
            over: overMomentum,
        };
    }

    // ── Computed: Market Stability ──────────────────────────────────────────────
    @computed
    public get market_stability(): TMarketStability {
        const last20 = this.ticks.slice(-20);
        if (last20.length < 10) return 'MODERATE';

        // Count zone alternations (from 0-4 to 5-9 or 5-9 to 0-4)
        let flipFlops = 0;
        for (let i = 1; i < last20.length; i++) {
            const prevZone = last20[i - 1].digit <= 4 ? 0 : 1;
            const currZone = last20[i].digit <= 4 ? 0 : 1;
            if (prevZone !== currZone) {
                flipFlops++;
            }
        }

        const alternationRate = flipFlops / (last20.length - 1);
        if (alternationRate <= 0.35) return 'STABLE';
        if (alternationRate <= 0.55) return 'MODERATE';
        if (alternationRate <= 0.70) return 'CHOPPY';
        return 'UNSTABLE';
    }

    // ── Computed: Reversal Detection ────────────────────────────────────────────
    @computed
    public get reversal_status(): { isReversal: boolean; reason: string } {
        const last5 = this.ticks.slice(-5);
        if (last5.length < 5) return { isReversal: false, reason: '' };

        const dist = this.primary_distribution;

        // If Under was forming/dominant (>=55%), but last 3 ticks are consecutive Over (5..9)
        if (dist.under04Pct >= this.config.underThresholdPct) {
            const last3 = last5.slice(-3);
            const consecutiveOver = last3.every(t => t.digit >= 5);
            if (consecutiveOver) {
                return {
                    isReversal: true,
                    reason: `Reversal detected: 3 consecutive Over digits (${last3.map(t => t.digit).join(', ')}) during Under trend`,
                };
            }
        }

        // If Over was forming/dominant (>=55%), but last 3 ticks are consecutive Under (0..4)
        if (dist.over59Pct >= this.config.overThresholdPct) {
            const last3 = last5.slice(-3);
            const consecutiveUnder = last3.every(t => t.digit <= 4);
            if (consecutiveUnder) {
                return {
                    isReversal: true,
                    reason: `Reversal detected: 3 consecutive Under digits (${last3.map(t => t.digit).join(', ')}) during Over trend`,
                };
            }
        }

        return { isReversal: false, reason: '' };
    }

    // ── Recency-Weighted Entry Digit Calculation ────────────────────────────────
    public calculateRecencyWeightedDigit(candidateDigits: number[]): {
        digit: number;
        score: number;
        freq50: number;
        freq25: number;
        freq10: number;
        freq7: number;
    } {
        const t50 = this.ticks.slice(-50);
        const t25 = this.ticks.slice(-25);
        const t10 = this.ticks.slice(-10);
        const t7 = this.ticks.slice(-7);

        const getFreq = (arr: TTickItem[], d: number) =>
            arr.length > 0 ? (arr.filter(t => t.digit === d).length / arr.length) * 100 : 0;

        let bestDigit = candidateDigits[0] ?? 0;
        let highestScore = -1;
        let bestFreqs = { freq50: 0, freq25: 0, freq10: 0, freq7: 0 };

        for (const d of candidateDigits) {
            const f50 = getFreq(t50, d);
            const f25 = getFreq(t25, d);
            const f10 = getFreq(t10, d);
            const f7 = getFreq(t7, d);

            // Weights: 15% 50-tick, 25% 25-tick, 30% 10-tick, 30% 7-tick
            const score = 0.15 * f50 + 0.25 * f25 + 0.30 * f10 + 0.30 * f7;

            if (score > highestScore) {
                highestScore = score;
                bestDigit = d;
                bestFreqs = { freq50: f50, freq25: f25, freq10: f10, freq7: f7 };
            }
        }

        return {
            digit: bestDigit,
            score: highestScore,
            ...bestFreqs,
        };
    }

    // ── Computed: Entry Digit Intelligence ──────────────────────────────────────
    @computed
    public get entry_digit_intelligence(): TEntryDigitIntelligence {
        const preferredDirection: TContractDirection =
            this.selected_direction_tab === 'UNDER 6' ? 'UNDER 6' : 'OVER 3';

        const candidateDigits =
            preferredDirection === 'UNDER 6' ? [0, 1, 2, 3, 4, 5] : [4, 5, 6, 7, 8, 9];

        const weighted = this.calculateRecencyWeightedDigit(candidateDigits);

        const conditions =
            preferredDirection === 'UNDER 6' ? this.under_conditions_check : this.over_conditions_check;

        const metCount = conditions.filter(c => c.passed).length;
        const missing = conditions.filter(c => !c.passed).map(c => c.label);

        const mom = this.momentum_analysis;
        const targetMom = preferredDirection === 'UNDER 6' ? mom.under : mom.over;
        const momentumRating: 'STRONG' | 'MODERATE' | 'WEAK' =
            targetMom === 'STRENGTHENING' ? 'STRONG' : targetMom === 'STEADY' ? 'MODERATE' : 'WEAK';

        return {
            preferredDirection,
            strongestDigit: weighted.digit,
            strongestScore: Math.round(weighted.score * 10) / 10,
            recentFreq50: Math.round(weighted.freq50 * 10) / 10,
            recentFreq25: Math.round(weighted.freq25 * 10) / 10,
            recentFreq10: Math.round(weighted.freq10 * 10) / 10,
            recentFreq7: Math.round(weighted.freq7 * 10) / 10,
            momentumRating,
            conditionsMetCount: metCount,
            totalConditions: conditions.length,
            missingConditions: missing,
        };
    }

    // ── Computed: Entry Conditions Checklist (UNDER 6) ──────────────────────────
    @computed
    public get under_conditions_check(): TConditionCheck[] {
        const dist = this.primary_distribution;
        const s10 = this.rolling_stats_10;
        const s7 = this.rolling_stats_7;
        const mom = this.momentum_analysis.under;
        const stability = this.market_stability;
        const rev = this.reversal_status;
        const weighted = this.calculateRecencyWeightedDigit([0, 1, 2, 3, 4, 5]);

        return [
            {
                id: 'c1',
                label: 'Under 0–4 Distribution >= 55%',
                description: 'Primary 50-tick Under distribution meets required threshold',
                passed: dist.under04Pct >= this.config.underThresholdPct,
                currentValue: `${dist.under04Pct.toFixed(1)}%`,
                targetValue: `>= ${this.config.underThresholdPct}%`,
            },
            {
                id: 'c2',
                label: 'Under Momentum Strengthening/Strong',
                description: 'Recent momentum trend confirms strengthening or steady Under flow',
                passed: mom === 'STRENGTHENING' || mom === 'STEADY',
                currentValue: mom,
                targetValue: 'STRENGTHENING / STEADY',
            },
            {
                id: 'c3',
                label: 'Last 10 Ticks Favour Under',
                description: `At least ${this.config.last10FavouredMin} of the last 10 ticks are Under digits (0–5)`,
                passed: s10.under05Count >= this.config.last10FavouredMin,
                currentValue: `${s10.under05Count}/10 Ticks`,
                targetValue: `>= ${this.config.last10FavouredMin}/10`,
            },
            {
                id: 'c4',
                label: `Last 7 Ticks Confirmation (>= ${this.config.last7ConfirmMin}/7)`,
                description: `At least ${this.config.last7ConfirmMin} of the last 7 ticks confirm Under digits (0–5)`,
                passed: s7.under05Count >= this.config.last7ConfirmMin,
                currentValue: `${s7.under05Count}/7 Ticks`,
                targetValue: `>= ${this.config.last7ConfirmMin}/7`,
            },
            {
                id: 'c5',
                label: 'Entry Digit Distribution Supports Under',
                description: 'Recency-weighted entry digit candidate is between 0 and 5',
                passed: weighted.digit <= 5 && weighted.score >= 12,
                currentValue: `Digit ${weighted.digit} (${weighted.score.toFixed(1)} pts)`,
                targetValue: 'Digits 0–5 (>= 12 pts)',
            },
            {
                id: 'c6',
                label: 'No Reversal or Market Instability',
                description: 'Market is stable/moderate with no immediate reversal burst',
                passed: !rev.isReversal && (!this.config.stabilityFilterEnabled || stability !== 'UNSTABLE'),
                currentValue: rev.isReversal ? 'REVERSAL' : stability,
                targetValue: 'STABLE / MODERATE',
            },
        ];
    }

    // ── Computed: Entry Conditions Checklist (OVER 3) ───────────────────────────
    @computed
    public get over_conditions_check(): TConditionCheck[] {
        const dist = this.primary_distribution;
        const s10 = this.rolling_stats_10;
        const s7 = this.rolling_stats_7;
        const mom = this.momentum_analysis.over;
        const stability = this.market_stability;
        const rev = this.reversal_status;
        const weighted = this.calculateRecencyWeightedDigit([4, 5, 6, 7, 8, 9]);

        return [
            {
                id: 'c1',
                label: 'Over 5–9 Distribution >= 55%',
                description: 'Primary 50-tick Over distribution meets required threshold',
                passed: dist.over59Pct >= this.config.overThresholdPct,
                currentValue: `${dist.over59Pct.toFixed(1)}%`,
                targetValue: `>= ${this.config.overThresholdPct}%`,
            },
            {
                id: 'c2',
                label: 'Over Momentum Strengthening/Strong',
                description: 'Recent momentum trend confirms strengthening or steady Over flow',
                passed: mom === 'STRENGTHENING' || mom === 'STEADY',
                currentValue: mom,
                targetValue: 'STRENGTHENING / STEADY',
            },
            {
                id: 'c3',
                label: 'Last 10 Ticks Favour Over',
                description: `At least ${this.config.last10FavouredMin} of the last 10 ticks are Over digits (4–9)`,
                passed: s10.over49Count >= this.config.last10FavouredMin,
                currentValue: `${s10.over49Count}/10 Ticks`,
                targetValue: `>= ${this.config.last10FavouredMin}/10`,
            },
            {
                id: 'c4',
                label: `Last 7 Ticks Confirmation (>= ${this.config.last7ConfirmMin}/7)`,
                description: `At least ${this.config.last7ConfirmMin} of the last 7 ticks confirm Over digits (4–9)`,
                passed: s7.over49Count >= this.config.last7ConfirmMin,
                currentValue: `${s7.over49Count}/7 Ticks`,
                targetValue: `>= ${this.config.last7ConfirmMin}/7`,
            },
            {
                id: 'c5',
                label: 'Entry Digit Distribution Supports Over',
                description: 'Recency-weighted entry digit candidate is between 4 and 9',
                passed: weighted.digit >= 4 && weighted.score >= 12,
                currentValue: `Digit ${weighted.digit} (${weighted.score.toFixed(1)} pts)`,
                targetValue: 'Digits 4–9 (>= 12 pts)',
            },
            {
                id: 'c6',
                label: 'No Reversal or Market Instability',
                description: 'Market is stable/moderate with no immediate reversal burst',
                passed: !rev.isReversal && (!this.config.stabilityFilterEnabled || stability !== 'UNSTABLE'),
                currentValue: rev.isReversal ? 'REVERSAL' : stability,
                targetValue: 'STABLE / MODERATE',
            },
        ];
    }

    // ── All-Markets Scanner Engine ──────────────────────────────────────────────
    @action
    public async scanAllMarkets() {
        if (this.is_scanning_all || !api_base.api) return;

        this.is_scanning_all = true;
        this.scan_progress = 0;

        const targetMarkets = this.available_symbols.length > 0
            ? this.available_symbols
            : ALL_DERIV_MARKETS.slice(0, 15).map(m => ({ symbol: m.value, display_name: m.label, pip_size: 2 }));

        const results: TMarketScanSummary[] = [];
        const total = targetMarkets.length;

        try {
            for (let i = 0; i < total; i++) {
                if (this.isDestroyed) break;
                const m = targetMarkets[i];

                try {
                    const res: any = await (api_base.api as any).send({
                        ticks_history: m.symbol,
                        count: 50,
                        end: 'latest',
                        style: 'ticks',
                    });

                    const hist = res?.history || res?.ticks_history;
                    if (hist?.prices && Array.isArray(hist.prices) && hist.prices.length >= 25) {
                        const prices: number[] = hist.prices.map(Number);
                        const digits = prices.map(p => this.extractLastDigit(p, m.pip_size));
                        const currentPrice = prices[prices.length - 1];
                        const latestDigit = digits[digits.length - 1];

                        // Under 0-4 vs Over 5-9
                        const u04 = digits.filter(d => d <= 4).length;
                        const o59 = digits.filter(d => d >= 5).length;
                        const u04Pct = (u04 / digits.length) * 100;
                        const o59Pct = (o59 / digits.length) * 100;

                        // Under 0-5 vs Over 4-9
                        const u05 = digits.filter(d => d <= 5).length;
                        const o49 = digits.filter(d => d >= 4).length;
                        const u05Pct = (u05 / digits.length) * 100;
                        const o49Pct = (o49 / digits.length) * 100;

                        // Last 10
                        const last10 = digits.slice(-10);
                        const u10 = last10.filter(d => d <= 5).length;
                        const o10 = last10.filter(d => d >= 4).length;
                        const last10Mom: TDirection = u10 >= 6 ? 'UNDER' : o10 >= 6 ? 'OVER' : 'NEUTRAL';

                        // Last 7
                        const last7 = digits.slice(-7);
                        const u7 = last7.filter(d => d <= 5).length;
                        const o7 = last7.filter(d => d >= 4).length;

                        // Stability (alternation check)
                        let flipFlops = 0;
                        for (let k = 1; k < last10.length; k++) {
                            if ((last10[k - 1] <= 4 ? 0 : 1) !== (last10[k] <= 4 ? 0 : 1)) flipFlops++;
                        }
                        const stability: TMarketStability =
                            flipFlops <= 3 ? 'STABLE' : flipFlops <= 6 ? 'MODERATE' : 'CHOPPY';

                        // Frequencies for top digit
                        const freqMap: Record<number, number> = {};
                        digits.forEach(d => (freqMap[d] = (freqMap[d] || 0) + 1));
                        let topD = digits[digits.length - 1];
                        let maxF = 0;
                        Object.entries(freqMap).forEach(([d, f]) => {
                            if (f > maxF) {
                                maxF = f;
                                topD = Number(d);
                            }
                        });

                        // Direction candidate
                        const prefDir: TContractDirection = u04Pct >= o59Pct ? 'UNDER 6' : 'OVER 3';
                        const dirBias = Math.max(u04Pct, o59Pct);

                        // Signal status
                        let status: TSignalStatus = 'WAIT — CONDITIONS NOT MET';
                        if (prefDir === 'UNDER 6') {
                            if (u04Pct >= 55 && u7 >= 5 && u10 >= 6 && stability !== 'CHOPPY') {
                                status = 'UNDER CONDITIONS MET';
                            } else if (u04Pct >= 52 || u7 >= 4) {
                                status = 'UNDER FORMING';
                            }
                        } else {
                            if (o59Pct >= 55 && o7 >= 5 && o10 >= 6 && stability !== 'CHOPPY') {
                                status = 'OVER CONDITIONS MET';
                            } else if (o59Pct >= 52 || o7 >= 4) {
                                status = 'OVER FORMING';
                            }
                        }

                        // Score 0 to 100
                        const biasPts = Math.min(35, Math.max(0, (dirBias - 50) * 2.5));
                        const l7Pts = Math.min(25, (prefDir === 'UNDER 6' ? u7 : o7) * 3.5);
                        const momPts = last10Mom === (prefDir === 'UNDER 6' ? 'UNDER' : 'OVER') ? 15 : 5;
                        const stabPts = stability === 'STABLE' ? 15 : stability === 'MODERATE' ? 10 : 3;
                        const digitPts = (maxF / digits.length) >= 0.16 ? 10 : 5;
                        const score = Math.round(biasPts + l7Pts + momPts + stabPts + digitPts);

                        results.push({
                            symbol: m.symbol,
                            displayName: m.display_name,
                            currentPrice,
                            latestDigit,
                            pipSize: m.pip_size,
                            under04Pct: Math.round(u04Pct * 10) / 10,
                            over59Pct: Math.round(o59Pct * 10) / 10,
                            under05Pct: Math.round(u05Pct * 10) / 10,
                            over49Pct: Math.round(o49Pct * 10) / 10,
                            last10Momentum: last10Mom,
                            last7ConfirmUnder: u7,
                            last7ConfirmOver: o7,
                            strongestDigit: topD,
                            stability,
                            signalStatus: status,
                            score,
                            preferredDirection: prefDir,
                            lastUpdated: Date.now(),
                        });
                    }
                } catch (e) {
                    // Ignore single symbol failure and proceed with scan
                }

                runInAction(() => {
                    this.scan_progress = Math.round(((i + 1) / total) * 100);
                });

                // 80ms delay between API calls to prevent WebSocket flooding
                await new Promise(r => setTimeout(r, 80));
            }

            // Sort results by score descending
            results.sort((a, b) => b.score - a.score);

            runInAction(() => {
                this.all_markets_stats = results;
                this.is_scanning_all = false;
            });
        } catch (scanErr) {
            console.error('[MegastreakEngine] Scan all markets error:', scanErr);
            runInAction(() => {
                this.is_scanning_all = false;
            });
        }
    }

    // ── Computed: Best Market Intelligence ("MEGASTREAK PICK") ──────────────────
    @computed
    public get megastreak_pick(): TMarketScanSummary | null {
        if (this.all_markets_stats.length === 0) return null;

        // Highest ranked candidate that meets conditions or forming with score >= 70
        const pick = this.all_markets_stats[0];
        if (pick && pick.score >= 65 && pick.signalStatus !== 'WAIT — CONDITIONS NOT MET') {
            return pick;
        }

        // If highest score has strong conditions met
        const metPick = this.all_markets_stats.find(
            m => m.signalStatus === 'UNDER CONDITIONS MET' || m.signalStatus === 'OVER CONDITIONS MET'
        );
        if (metPick) return metPick;

        return null;
    }

    // ── Action: Config Modifiers ────────────────────────────────────────────────
    @action
    public updateConfig(newConfig: Partial<TMegastreakConfig>) {
        this.config = { ...this.config, ...newConfig };
        this.recalculateSignals();
    }

    @action
    public setDirectionTab(tab: TContractDirection) {
        this.selected_direction_tab = tab;
    }

    @action
    public toggleBestMarketExpanded() {
        this.is_best_market_expanded = !this.is_best_market_expanded;
    }

    @action
    public clearLog() {
        this.signal_logs = [];
    }

    @action
    public setViewMode(mode: TViewMode) {
        this.view_mode = mode;
    }

    @action
    public toggleGuide() {
        this.is_guide_open = !this.is_guide_open;
    }
}
