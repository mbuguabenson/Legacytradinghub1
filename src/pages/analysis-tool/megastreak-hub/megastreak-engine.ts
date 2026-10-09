import { makeObservable, observable, action, computed, runInAction } from 'mobx';
import { api_base, observer as globalObserver } from '@/external/bot-skeleton';
import { subscribeTicks } from '@/utils/websocket-handler';
import { getMarketPipSize, getLastDigitFromQuote } from '@/utils/market-data';
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
    TColoredDigitItem,
    TRealEntryPoint,
    TParityAnalysis,
    TStreakAnalysis,
} from './types';

export const DIGIT_COLOR_MAP: Record<number, { color: string; bgGlow: string; borderColor: string; label: string }> = {
    0: { color: '#00f5ff', bgGlow: 'rgba(0, 245, 255, 0.16)', borderColor: 'rgba(0, 245, 255, 0.75)', label: 'Cyan' },
    1: { color: '#a855f7', bgGlow: 'rgba(168, 85, 247, 0.16)', borderColor: 'rgba(168, 85, 247, 0.75)', label: 'Violet' },
    2: { color: '#10b981', bgGlow: 'rgba(16, 185, 129, 0.16)', borderColor: 'rgba(16, 185, 129, 0.75)', label: 'Emerald' },
    3: { color: '#f59e0b', bgGlow: 'rgba(245, 158, 11, 0.16)', borderColor: 'rgba(245, 158, 11, 0.75)', label: 'Amber' },
    4: { color: '#0ea5e9', bgGlow: 'rgba(14, 165, 233, 0.16)', borderColor: 'rgba(14, 165, 233, 0.75)', label: 'Sky' },
    5: { color: '#ec4899', bgGlow: 'rgba(236, 72, 153, 0.16)', borderColor: 'rgba(236, 72, 153, 0.75)', label: 'Magenta' },
    6: { color: '#f97316', bgGlow: 'rgba(249, 115, 22, 0.16)', borderColor: 'rgba(249, 115, 22, 0.75)', label: 'Orange' },
    7: { color: '#84cc16', bgGlow: 'rgba(132, 204, 22, 0.16)', borderColor: 'rgba(132, 204, 22, 0.75)', label: 'Lime' },
    8: { color: '#6366f1', bgGlow: 'rgba(99, 102, 241, 0.16)', borderColor: 'rgba(99, 102, 241, 0.75)', label: 'Indigo' },
    9: { color: '#ef4444', bgGlow: 'rgba(239, 68, 68, 0.16)', borderColor: 'rgba(239, 68, 68, 0.75)', label: 'Crimson' },
};

export const FALLBACK_VOL_AND_JUMP_MARKETS = [
    // Continuous Volatilities
    { symbol: 'R_10', display_name: 'Volatility 10 Index', pip_size: 3 },
    { symbol: 'R_25', display_name: 'Volatility 25 Index', pip_size: 3 },
    { symbol: 'R_50', display_name: 'Volatility 50 Index', pip_size: 4 },
    { symbol: 'R_75', display_name: 'Volatility 75 Index', pip_size: 4 },
    { symbol: 'R_100', display_name: 'Volatility 100 Index', pip_size: 2 },
    // 1-Second Volatilities
    { symbol: '1HZ10V', display_name: 'Volatility 10 (1s) Index', pip_size: 2 },
    { symbol: '1HZ15V', display_name: 'Volatility 15 (1s) Index', pip_size: 3 },
    { symbol: '1HZ25V', display_name: 'Volatility 25 (1s) Index', pip_size: 2 },
    { symbol: '1HZ30V', display_name: 'Volatility 30 (1s) Index', pip_size: 3 },
    { symbol: '1HZ50V', display_name: 'Volatility 50 (1s) Index', pip_size: 2 },
    { symbol: '1HZ75V', display_name: 'Volatility 75 (1s) Index', pip_size: 2 },
    { symbol: '1HZ90V', display_name: 'Volatility 90 (1s) Index', pip_size: 3 },
    { symbol: '1HZ100V', display_name: 'Volatility 100 (1s) Index', pip_size: 2 },
    // Jump Indices
    { symbol: 'JD10', display_name: 'Jump 10 Index', pip_size: 2 },
    { symbol: 'JD25', display_name: 'Jump 25 Index', pip_size: 2 },
    { symbol: 'JD50', display_name: 'Jump 50 Index', pip_size: 2 },
    { symbol: 'JD75', display_name: 'Jump 75 Index', pip_size: 2 },
    { symbol: 'JD100', display_name: 'Jump 100 Index', pip_size: 2 },
];

export const isVolOrJump = (s: any) => {
    const sym = String(s.symbol || s.value || '').toUpperCase();
    const sub = String(s.submarket || '').toLowerCase();
    const isVol = sym.startsWith('R_') || sym.includes('1HZ');
    const isJump = sym.startsWith('JD') || sym.includes('JUMP') || sub === 'jump_index';
    return (isVol || isJump) && !s.is_trading_suspended;
};

export class MegastreakEngine {
    // ── Observable State ────────────────────────────────────────────────────────
    @observable accessor selected_symbol: string = 'R_100';
    @observable accessor display_name: string = 'Volatility 100 Index';
    @observable accessor pip_size: number = 2;
    @observable accessor is_loading_ticks: boolean = false;
    @observable accessor is_connected: boolean = true;
    @observable accessor current_price: number = 0;
    @observable accessor previous_price: number = 0;
    @observable accessor tick_direction: 'up' | 'down' | 'neutral' = 'neutral';
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

    // Interactive UI controls
    @observable accessor selected_highlight_digit: number | null = null;
    @observable accessor last50_view_mode: 'tape' | 'grid' = 'tape';
    @observable accessor active_engine_tab: 'entry_points' | 'distribution' | 'parity_streak' | 'scanner' = 'entry_points';

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

    // Private subscriptions & request tracking
    private tickSubscription: { unsubscribe: () => void } | null = null;
    private staleCheckInterval: ReturnType<typeof setInterval> | null = null;
    private subscriptionId = 0;
    private isDestroyed = false;

    constructor() {
        makeObservable(this);
        this.init();

        // Auto-heal / reload active symbols and live stream on auth or socket reconnect
        try {
            globalObserver.register('api.authorize', () => {
                if (!this.isDestroyed) {
                    this.loadAvailableSymbols();
                    this.selectSymbol(this.selected_symbol);
                }
            });
            globalObserver.register('ws.opened', () => {
                if (!this.isDestroyed) {
                    this.loadAvailableSymbols();
                    this.selectSymbol(this.selected_symbol);
                }
            });
        } catch (_) {}
    }

    // ── Computed: Formatted Active Quote Price ──────────────────────────────────
    @computed
    public get formatted_price(): string {
        if (this.current_price === null || this.current_price === undefined || this.current_price === 0 || isNaN(this.current_price)) {
            return '---';
        }
        return Number(this.current_price).toFixed(this.pip_size);
    }

    // ── Initialization & Lifecycle ──────────────────────────────────────────────
    private async init() {
        await this.loadAvailableSymbols();
        await this.selectSymbol(this.selected_symbol);
        this.startStaleTickWatchdog();
        // Background scan so Best Market card is auto-populated
        setTimeout(() => {
            if (!this.isDestroyed && this.all_markets_stats.length === 0) {
                this.scanAllMarkets();
            }
        }, 1200);
    }

    public destroy() {
        this.isDestroyed = true;
        if (this.tickSubscription) {
            try {
                this.tickSubscription.unsubscribe();
            } catch (_) {}
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
            if (api_base.active_symbols && Array.isArray(api_base.active_symbols) && api_base.active_symbols.length > 0) {
                rawList = api_base.active_symbols;
            } else if (typeof api_base.getActiveSymbols === 'function') {
                rawList = await api_base.getActiveSymbols();
            } else if (api_base.api) {
                const res: any = await (api_base.api as any).send({
                    active_symbols: 'brief',
                    product_type: 'basic',
                });
                rawList = res?.active_symbols || [];
            }

            // Strictly filter for Volatilities and Jump indices only
            const isVolOrJump = (s: any) => {
                const sym = String(s.symbol || '').toUpperCase();
                const sub = String(s.submarket || '').toLowerCase();
                const isVol = sym.startsWith('R_') || sym.includes('1HZ');
                const isJump = sym.startsWith('JD') || sym.includes('JUMP') || sub === 'jump_index';
                return (isVol || isJump) && !s.is_trading_suspended;
            };

            const synthetics = (rawList || [])
                .filter(isVolOrJump)
                .map((s: any) => {
                    const fallbackPip = (() => {
                        const raw = s.pip_size ?? s.pip;
                        if (raw === undefined || raw === null) return 2;
                        const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
                        if (Number.isFinite(num) && num >= 0) {
                            if (num >= 1 && Number.isInteger(num)) return Math.min(num, 20);
                            if (num < 1 && num > 0) {
                                const str = num.toString();
                                const dec = str.split('.')[1];
                                return dec ? dec.length : 2;
                            }
                        }
                        return 2;
                    })();

                    const pipSize = getMarketPipSize(s.symbol, fallbackPip);

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
                    this.available_symbols = FALLBACK_VOL_AND_JUMP_MARKETS;
                }

                // Match pip_size of current symbol if available
                const current = this.available_symbols.find(s => s.symbol === this.selected_symbol);
                if (current) {
                    this.pip_size = getMarketPipSize(this.selected_symbol, current.pip_size);
                    this.display_name = current.display_name;
                }
            });
        } catch (e) {
            console.warn('[MegastreakEngine] Symbol discovery fallback:', e);
            runInAction(() => {
                this.available_symbols = FALLBACK_VOL_AND_JUMP_MARKETS;
            });
        }
    }

    // ── Symbol Selection & Tick Stream ──────────────────────────────────────────
    @action
    public async selectSymbol(symbol: string) {
        if (!symbol) return;

        const currentSubId = ++this.subscriptionId;

        // Cleanup old subscription
        if (this.tickSubscription) {
            try {
                this.tickSubscription.unsubscribe();
            } catch (_) {}
            this.tickSubscription = null;
        }

        const symObj = this.available_symbols.find(s => s.symbol === symbol);
        const resolvedPip = getMarketPipSize(symbol, symObj ? symObj.pip_size : 2);
        const resolvedName = symObj ? symObj.display_name : symbol;

        runInAction(() => {
            this.selected_symbol = symbol;
            this.display_name = resolvedName;
            this.pip_size = resolvedPip;
            this.ticks = [];
            this.current_price = 0;
            this.latest_digit = null;
            this.tick_direction = 'neutral';
            this.is_loading_ticks = true;
            this.signal_status = 'DATA INSUFFICIENT';
            this.previous_signal_met = false;
            this.fresh_confirmation_count = 0;
            this.stop_reason = '';
        });

        // 1. Fetch historical 50 ticks for warm-up
        try {
            if (!api_base.api || (api_base.api as any)?.connection?.readyState !== 1) {
                try {
                    await api_base.waitForConnection(3000);
                } catch {}
            }

            if (api_base.api) {
                const histRes: any = await (api_base.api as any).send({
                    ticks_history: symbol,
                    count: 50,
                    end: 'latest',
                    style: 'ticks',
                });

                if (this.selected_symbol !== symbol || currentSubId !== this.subscriptionId || this.isDestroyed) return;

                const history = histRes?.history || histRes?.ticks_history;
                if (history?.prices && Array.isArray(history.prices) && history.prices.length > 0) {
                    const historyPip =
                        typeof histRes?.pip_size === 'number'
                            ? histRes.pip_size
                            : getMarketPipSize(symbol, resolvedPip);

                    const times = history.times || [];
                    const loadedTicks: TTickItem[] = history.prices.map((p: any, idx: number) => {
                        const quote = Number(p);
                        const digit = getLastDigitFromQuote(quote, symbol, historyPip);
                        const epoch = times[idx] ? Number(times[idx]) : Date.now() / 1000;
                        return { quote, digit, epoch };
                    });

                    runInAction(() => {
                        this.pip_size = historyPip;
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

        if (this.selected_symbol !== symbol || currentSubId !== this.subscriptionId || this.isDestroyed) return;

        runInAction(() => {
            this.is_loading_ticks = false;
            this.recalculateSignals();
        });

        // 2. Subscribe to live ticks via centralized derivTickManager
        this.tickSubscription = subscribeTicks(symbol, (tickRes: any) => {
            if (this.isDestroyed || this.selected_symbol !== symbol || currentSubId !== this.subscriptionId) return;

            const t = tickRes?.tick;
            if (t && (t.symbol === symbol || !t.symbol) && t.quote !== undefined) {
                const quote = Number(t.quote);
                const pip = typeof t.pip_size === 'number' ? t.pip_size : this.pip_size;
                const digit = getLastDigitFromQuote(quote, symbol, pip);
                const epoch = t.epoch || Date.now() / 1000;

                this.onNewTick({ quote, digit, epoch }, pip);
            }
        });
    }

    // ── Tick Processing ─────────────────────────────────────────────────────────
    @action
    private onNewTick(tick: TTickItem, pip?: number) {
        if (typeof pip === 'number' && pip >= 0 && pip !== this.pip_size) {
            this.pip_size = pip;
        }
        if (this.current_price > 0) {
            if (tick.quote > this.current_price) this.tick_direction = 'up';
            else if (tick.quote < this.current_price) this.tick_direction = 'down';
            else this.tick_direction = 'neutral';
        }
        this.previous_price = this.current_price;
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
    public extractLastDigit(price: number | string, pip?: number): number {
        const p = Number(price);
        if (isNaN(p)) return 0;
        const resolvedPip = typeof pip === 'number' ? pip : this.pip_size;
        return getLastDigitFromQuote(p, this.selected_symbol, resolvedPip);
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
        if (this.is_scanning_all) return;

        this.is_scanning_all = true;
        this.scan_progress = 0;

        const targetMarkets = this.available_symbols.length > 0
            ? this.available_symbols
            : FALLBACK_VOL_AND_JUMP_MARKETS;

        const results: TMarketScanSummary[] = [];
        const total = targetMarkets.length;

        try {
            if (api_base.api) {
                const chunkSize = 3;
                for (let i = 0; i < total; i += chunkSize) {
                    if (this.isDestroyed) break;
                    const chunk = targetMarkets.slice(i, i + chunkSize);

                    await Promise.all(
                        chunk.map(async m => {
                            try {
                                const res: any = await (api_base.api as any).send({
                                    ticks_history: m.symbol,
                                    count: 50,
                                    end: 'latest',
                                    style: 'ticks',
                                });

                                const hist = res?.history || res?.ticks_history;
                                if (hist?.prices && Array.isArray(hist.prices) && hist.prices.length >= 20) {
                                    const pipSize =
                                        typeof res?.pip_size === 'number'
                                            ? res.pip_size
                                            : getMarketPipSize(m.symbol, m.pip_size);
                                    const prices: number[] = hist.prices.map(Number);
                                    const digits = prices.map(p => getLastDigitFromQuote(p, m.symbol, pipSize));
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
                                        pipSize,
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
                                // Ignore single symbol failure and continue
                            }
                        })
                    );

                    runInAction(() => {
                        this.scan_progress = Math.min(100, Math.round(((i + chunkSize) / total) * 100));
                    });

                    await new Promise(r => setTimeout(r, 60));
                }
            }

            // Fallback for current market if not in results
            if (results.length === 0 && this.ticks.length >= 20) {
                const primary = this.primary_distribution;
                const contract = this.contract_analysis;
                const s10 = this.rolling_stats_10;
                const s7 = this.rolling_stats_7;
                const prefDir: TContractDirection = primary.under04Pct >= primary.over59Pct ? 'UNDER 6' : 'OVER 3';
                results.push({
                    symbol: this.selected_symbol,
                    displayName: this.display_name,
                    currentPrice: this.current_price,
                    latestDigit: this.latest_digit ?? 0,
                    pipSize: this.pip_size,
                    under04Pct: Math.round(primary.under04Pct * 10) / 10,
                    over59Pct: Math.round(primary.over59Pct * 10) / 10,
                    under05Pct: Math.round(contract.under05Pct * 10) / 10,
                    over49Pct: Math.round(contract.over49Pct * 10) / 10,
                    last10Momentum: s10.dominantDirection,
                    last7ConfirmUnder: s7.under05Count,
                    last7ConfirmOver: s7.over49Count,
                    strongestDigit: this.latest_digit ?? 3,
                    stability: this.market_stability,
                    signalStatus: this.signal_status,
                    score: 78,
                    preferredDirection: prefDir,
                    lastUpdated: Date.now(),
                });
            }

            // Sort results by score descending
            results.sort((a, b) => b.score - a.score);

            runInAction(() => {
                this.all_markets_stats = results;
                this.is_scanning_all = false;
                this.scan_progress = 100;
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

    // ── Computed: Last 50 Digits with Distinct Color Palette ────────────────────
    @computed
    public get last_50_digits(): TColoredDigitItem[] {
        const total = this.ticks.length;
        if (total === 0) return [];

        // Return reversed: index 1 is newest tick, index 50 is oldest
        const reversed = [...this.ticks].reverse();
        return reversed.map((t, idx) => {
            const digit = t.digit;
            const style = DIGIT_COLOR_MAP[digit] || {
                color: '#38bdf8',
                bgGlow: 'rgba(56, 189, 248, 0.16)',
                borderColor: 'rgba(56, 189, 248, 0.75)',
                label: 'Default',
            };

            return {
                index: idx + 1,
                digit,
                quote: t.quote,
                priceFormatted: t.quote.toFixed(this.pip_size),
                epoch: t.epoch,
                color: style.color,
                bgGlow: style.bgGlow,
                borderColor: style.borderColor,
                isEven: digit % 2 === 0,
                isUnder6: digit <= 5,
                isOver3: digit >= 4,
                isLatest: idx === 0,
                isPrevious: idx === 1,
            };
        });
    }

    // ── Computed: Parity & Sequence Engine ──────────────────────────────────────
    @computed
    public get parity_analysis(): TParityAnalysis {
        const total = this.ticks.length;
        if (total === 0) {
            return {
                evenCount: 0,
                oddCount: 0,
                evenPct: 50,
                oddPct: 50,
                currentParity: 'EVEN',
                currentParityStreak: 0,
                longestParityStreak: 0,
                longestParityType: 'EVEN',
                streakDescription: 'Connecting to market tick feed...',
            };
        }

        let evenCount = 0;
        let oddCount = 0;
        for (const t of this.ticks) {
            if (t.digit % 2 === 0) evenCount++;
            else oddCount++;
        }

        const evenPct = Math.round((evenCount / total) * 100);
        const oddPct = Math.round((oddCount / total) * 100);

        // Current streak from newest backwards
        const lastT = this.ticks[this.ticks.length - 1];
        const currentParity: 'EVEN' | 'ODD' = lastT.digit % 2 === 0 ? 'EVEN' : 'ODD';
        let currentStreak = 0;
        for (let i = this.ticks.length - 1; i >= 0; i--) {
            const isMatch = (this.ticks[i].digit % 2 === 0) === (currentParity === 'EVEN');
            if (isMatch) currentStreak++;
            else break;
        }

        // Longest streak
        let maxEven = 0;
        let maxOdd = 0;
        let curE = 0;
        let curO = 0;
        for (const t of this.ticks) {
            if (t.digit % 2 === 0) {
                curE++;
                curO = 0;
                if (curE > maxEven) maxEven = curE;
            } else {
                curO++;
                curE = 0;
                if (curO > maxOdd) maxOdd = curO;
            }
        }

        const longestParityStreak = Math.max(maxEven, maxOdd);
        const longestParityType = maxEven >= maxOdd ? 'EVEN' : 'ODD';

        let desc = `${currentStreak} consecutive ${currentParity} digits recorded`;
        if (currentStreak >= 4) {
            desc = `🔥 Extended ${currentParity} streak (${currentStreak}x) — High statistical exhaustion favoring ${currentParity === 'EVEN' ? 'ODD' : 'EVEN'}!`;
        }

        return {
            evenCount,
            oddCount,
            evenPct,
            oddPct,
            currentParity,
            currentParityStreak: currentStreak,
            longestParityStreak,
            longestParityType,
            streakDescription: desc,
        };
    }

    // ── Computed: Streak & Sequence Analysis ────────────────────────────────────
    @computed
    public get streak_analysis(): TStreakAnalysis {
        const total = this.ticks.length;
        if (total === 0) {
            return {
                currentStreakType: 'NONE',
                currentStreakCount: 0,
                currentStreakLabel: 'Warming up',
                longestUnderStreak: 0,
                longestOverStreak: 0,
                repeatDigitCount: 0,
                lastRepeatDigit: null,
            };
        }

        // Current Under 0-5 vs Over 4-9 streak
        const lastT = this.ticks[this.ticks.length - 1];
        const isUnder = lastT.digit <= 5;
        let streakCount = 0;
        for (let i = this.ticks.length - 1; i >= 0; i--) {
            if ((this.ticks[i].digit <= 5) === isUnder) streakCount++;
            else break;
        }

        // Check for repeat consecutive digits
        let repeatDigitCount = 0;
        let lastRepeat: number | null = null;
        for (let i = 1; i < this.ticks.length; i++) {
            if (this.ticks[i].digit === this.ticks[i - 1].digit) {
                repeatDigitCount++;
                lastRepeat = this.ticks[i].digit;
            }
        }

        // Longest streaks
        let longestUnder = 0;
        let longestOver = 0;
        let cU = 0;
        let cO = 0;
        for (const t of this.ticks) {
            if (t.digit <= 5) {
                cU++;
                cO = 0;
                if (cU > longestUnder) longestUnder = cU;
            } else {
                cO++;
                cU = 0;
                if (cO > longestOver) longestOver = cO;
            }
        }

        const streakType = isUnder ? 'UNDER' : 'OVER';
        const label = `${streakCount}x Consecutive ${isUnder ? 'Low Digits (0–5)' : 'High Digits (4–9)'}`;

        return {
            currentStreakType: streakType,
            currentStreakCount: streakCount,
            currentStreakLabel: label,
            longestUnderStreak: longestUnder,
            longestOverStreak: longestOver,
            repeatDigitCount,
            lastRepeatDigit: lastRepeat,
        };
    }

    // ── Computed: Real Entry Points Engine ──────────────────────────────────────
    @computed
    public get real_entry_points(): TRealEntryPoint[] {
        const dist = this.primary_distribution;
        const contract = this.contract_analysis;
        const s7 = this.rolling_stats_7;
        const status = this.signal_status;
        const stability = this.market_stability;
        const parity = this.parity_analysis;
        const reversal = this.reversal_status;
        const freqs = this.digit_frequencies;

        let coldestDigit = 0;
        let lowestCount = 999;
        freqs.forEach(f => {
            if (f.count < lowestCount) {
                lowestCount = f.count;
                coldestDigit = f.digit;
            }
        });

        const isUnderMet = status === 'UNDER CONDITIONS MET';
        const isOverMet = status === 'OVER CONDITIONS MET';
        const isUnderForming = status === 'UNDER FORMING';
        const isOverForming = status === 'OVER FORMING';
        const isStopped = status === 'STOP — SIGNAL INVALIDATED' || reversal.isReversal || stability === 'UNSTABLE';

        // 1. UNDER 6 Entry Point
        const underWinRate = Math.min(88, Math.max(50, Math.round(contract.under05Pct * 0.7 + s7.under05Pct * 0.3)));
        const underEdge = Math.round((underWinRate - 60) * 10) / 10;
        const underScore = Math.min(99, Math.max(20, Math.round(
            (dist.under04Pct * 0.4) + (s7.under05Pct * 0.35) + (stability === 'STABLE' ? 20 : stability === 'MODERATE' ? 10 : 0)
        )));

        const underStatus: TRealEntryPoint['status'] =
            isStopped && this.selected_direction_tab === 'UNDER 6' ? 'STOPPED' :
            isUnderMet ? 'ENTER_NOW' :
            isUnderForming ? 'FORMING' :
            underScore >= 60 ? 'CONFIRMING' : 'STANDBY';

        const underPoint: TRealEntryPoint = {
            id: 'ep_under_6',
            name: 'UNDER 6 (Low Digits 0–5)',
            contractType: 'DIGITUNDER',
            actionText: 'BUY UNDER 6',
            barrier: 6,
            winningDigits: [0, 1, 2, 3, 4, 5],
            baseWinRatePct: 60,
            estimatedWinRatePct: underWinRate,
            edgePct: underEdge,
            recommendedDuration: '1 – 3 Ticks',
            status: underStatus,
            statusLabel: underStatus === 'ENTER_NOW' ? 'ENTER NOW' : underStatus === 'FORMING' ? 'FORMING' : underStatus === 'STOPPED' ? 'SAFETY STOP' : 'STANDBY',
            confidenceScore: underScore,
            entryRuleReason: `Primary Under is ${Math.round(dist.under04Pct)}%, Last 7 confirms ${s7.under05Count}/7 ticks in digits 0–5`,
            stopLossGuard: 'Exit if 2 consecutive digits >= 6 occur or stability drops to Choppy',
            expectedPayout: '~1.60x – 1.65x (+60% profit on win)',
            isPrimaryRecommended: underStatus === 'ENTER_NOW' || (underScore > 65 && !isOverMet),
        };

        // 2. OVER 3 Entry Point
        const overWinRate = Math.min(88, Math.max(50, Math.round(contract.over49Pct * 0.7 + s7.over49Pct * 0.3)));
        const overEdge = Math.round((overWinRate - 60) * 10) / 10;
        const overScore = Math.min(99, Math.max(20, Math.round(
            (dist.over59Pct * 0.4) + (s7.over49Pct * 0.35) + (stability === 'STABLE' ? 20 : stability === 'MODERATE' ? 10 : 0)
        )));

        const overStatus: TRealEntryPoint['status'] =
            isStopped && this.selected_direction_tab === 'OVER 3' ? 'STOPPED' :
            isOverMet ? 'ENTER_NOW' :
            isOverForming ? 'FORMING' :
            overScore >= 60 ? 'CONFIRMING' : 'STANDBY';

        const overPoint: TRealEntryPoint = {
            id: 'ep_over_3',
            name: 'OVER 3 (High Digits 4–9)',
            contractType: 'DIGITOVER',
            actionText: 'BUY OVER 3',
            barrier: 3,
            winningDigits: [4, 5, 6, 7, 8, 9],
            baseWinRatePct: 60,
            estimatedWinRatePct: overWinRate,
            edgePct: overEdge,
            recommendedDuration: '1 – 3 Ticks',
            status: overStatus,
            statusLabel: overStatus === 'ENTER_NOW' ? 'ENTER NOW' : overStatus === 'FORMING' ? 'FORMING' : overStatus === 'STOPPED' ? 'SAFETY STOP' : 'STANDBY',
            confidenceScore: overScore,
            entryRuleReason: `Primary Over is ${Math.round(dist.over59Pct)}%, Last 7 confirms ${s7.over49Count}/7 ticks in digits 4–9`,
            stopLossGuard: 'Exit if 2 consecutive digits <= 3 occur or stability drops to Choppy',
            expectedPayout: '~1.60x – 1.65x (+60% profit on win)',
            isPrimaryRecommended: overStatus === 'ENTER_NOW' || (overScore > underScore && overScore > 65),
        };

        // 3. PARITY Entry Point
        const parityStreak = parity.currentParityStreak;
        const parityType = parityStreak >= 3
            ? (parity.currentParity === 'EVEN' ? 'ODD' : 'EVEN')
            : (parity.evenPct >= 58 ? 'EVEN' : parity.oddPct >= 58 ? 'ODD' : 'EVEN');

        const parityIsReversion = parityStreak >= 3;
        const parityConfidence = parityIsReversion
            ? Math.min(92, 50 + parityStreak * 9)
            : Math.max(parity.evenPct, parity.oddPct);

        const parityStatus: TRealEntryPoint['status'] =
            parityIsReversion && parityStreak >= 4 ? 'ENTER_NOW' :
            parityIsReversion ? 'FORMING' :
            parityConfidence >= 60 ? 'CONFIRMING' : 'STANDBY';

        const parityPoint: TRealEntryPoint = {
            id: 'ep_parity',
            name: `PARITY ${parityType} (${parityIsReversion ? 'Mean Reversion' : 'Parity Bias'})`,
            contractType: parityType === 'EVEN' ? 'DIGITEVEN' : 'DIGITODD',
            actionText: `BUY ${parityType}`,
            barrier: parityType,
            winningDigits: parityType === 'EVEN' ? [0, 2, 4, 6, 8] : [1, 3, 5, 7, 9],
            baseWinRatePct: 50,
            estimatedWinRatePct: Math.round(parityConfidence),
            edgePct: Math.round((parityConfidence - 50) * 10) / 10,
            recommendedDuration: '1 Tick',
            status: parityStatus,
            statusLabel: parityStatus === 'ENTER_NOW' ? 'ENTER NOW' : parityStatus === 'FORMING' ? 'FORMING' : 'STANDBY',
            confidenceScore: Math.round(parityConfidence),
            entryRuleReason: parityIsReversion
                ? `${parityStreak} consecutive ${parity.currentParity} digits reached — Statistical exhaustion favors ${parityType}`
                : `${parityType} dominance at ${Math.round(parityConfidence)}% over 50 ticks`,
            stopLossGuard: 'Do not chase past 2 consecutive losses',
            expectedPayout: '~1.92x – 1.95x (+95% profit on win)',
            isPrimaryRecommended: parityStatus === 'ENTER_NOW' && !isUnderMet && !isOverMet,
        };

        // 4. DIFFERS Coldest Digit Entry Point
        const differsTarget = coldestDigit;
        const coldPct = freqs.find(f => f.digit === coldestDigit)?.percentage || 5;
        const differsWinRate = Math.round(100 - coldPct);
        const differsScore = Math.min(95, Math.round(80 + (10 - coldPct) * 2));

        const differsPoint: TRealEntryPoint = {
            id: 'ep_differs',
            name: `DIFFERS (Cold Digit ${differsTarget})`,
            contractType: 'DIGITDIFF',
            actionText: `BUY DIFFERS ${differsTarget}`,
            barrier: differsTarget,
            winningDigits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => d !== differsTarget),
            baseWinRatePct: 90,
            estimatedWinRatePct: differsWinRate,
            edgePct: Math.round((differsWinRate - 90) * 10) / 10,
            recommendedDuration: '1 Tick',
            status: differsWinRate >= 92 ? 'ENTER_NOW' : 'CONFIRMING',
            statusLabel: differsWinRate >= 92 ? 'ENTER NOW' : 'WATCHING',
            confidenceScore: differsScore,
            entryRuleReason: `Digit ${differsTarget} is the coldest digit (only ${coldPct.toFixed(1)}% frequency in 50 ticks)`,
            stopLossGuard: 'Halt immediately if cold digit triggers twice within 10 ticks',
            expectedPayout: '~1.09x – 1.11x (+9% profit on win, 9/10 win rate)',
            isPrimaryRecommended: false,
        };

        return [underPoint, overPoint, parityPoint, differsPoint];
    }

    // ── Actions: UI Controls ────────────────────────────────────────────────────
    @action
    public setHighlightDigit(digit: number | null) {
        if (this.selected_highlight_digit === digit) {
            this.selected_highlight_digit = null;
        } else {
            this.selected_highlight_digit = digit;
        }
    }

    @action
    public setLast50ViewMode(mode: 'tape' | 'grid') {
        this.last50_view_mode = mode;
    }

    @action
    public setActiveEngineTab(tab: 'entry_points' | 'distribution' | 'parity_streak' | 'scanner') {
        this.active_engine_tab = tab;
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

