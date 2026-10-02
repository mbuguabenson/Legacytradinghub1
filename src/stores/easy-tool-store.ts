import { action, computed, makeObservable, observable, reaction, runInAction } from 'mobx';
import { api_base, observer as globalObserver } from '@/external/bot-skeleton';
import { getGroupedMarkets } from '@/constants/markets';
import { subscribeTicks } from '@/services/deriv-tick-manager.service';
import { getLastDigitFromQuote, getMarketPipSize } from '@/utils/market-data';
import RootStore from './root-store';

const DEFAULT_MARKETS = getGroupedMarkets();

export type TMarketItem = {
    value: string;
    label: string;
    market?: string;
    submarket?: string;
};

export type TMarketGroup = {
    group: string;
    items: TMarketItem[];
};

export default class EasyToolStore {
    root_store: RootStore;

    @observable accessor symbol: string = 'R_100';
    @observable accessor current_price: number | null = null;
    @observable accessor last_digit: number | null = null;
    @observable accessor ticks: number[] = []; // Array of last digits (0-9)
    @observable accessor raw_prices: number[] = []; // Array of quote prices
    @observable accessor pip_size: number = 2;
    @observable accessor stats_sample_size: number = 1000;
    @observable accessor markets: TMarketGroup[] = DEFAULT_MARKETS;
    @observable accessor is_loading_markets: boolean = false;
    @observable accessor is_loading_ticks: boolean = false;
    @observable accessor is_connected: boolean = false;

    private _tick_sub: { unsubscribe: () => void } | null = null;
    private _sub_request_id: number = 0;

    constructor(root_store: RootStore) {
        makeObservable(this);
        this.root_store = root_store;

        // Auto-fetch markets & subscribe when socket connects
        reaction(
            () => this.root_store.common?.is_socket_opened,
            is_socket_opened => {
                this.is_connected = !!is_socket_opened;
                if (is_socket_opened) {
                    this.fetchMarkets();
                    this.subscribeToActiveSymbol();
                } else {
                    this.unsubscribe();
                }
            }
        );

        // Account switch or token authorization
        if (typeof window !== 'undefined') {
            window.addEventListener('account_switched', () => {
                this.fetchMarkets();
                this.subscribeToActiveSymbol();
            });
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && (!this.ticks || this.ticks.length === 0)) {
                    this.subscribeToActiveSymbol();
                }
            });
        }

        globalObserver.register('api.authorize', () => {
            this.fetchMarkets();
            this.subscribeToActiveSymbol();
        });

        // Initialize immediately
        this.initWebSocketConnection();
    }

    @computed
    get formatted_price(): string {
        if (this.current_price === null || this.current_price === undefined) return '---';
        return this.current_price.toFixed(this.pip_size);
    }

    @action
    private initWebSocketConnection = async () => {
        // If api_base has cached active_symbols from WebSocket, populate immediately
        if (api_base.active_symbols && Array.isArray(api_base.active_symbols) && api_base.active_symbols.length > 0) {
            this.processWebSocketSymbols(api_base.active_symbols);
        }

        // Poll/wait for ready WebSocket
        const checkConnection = () => {
            if (api_base.api) {
                runInAction(() => {
                    this.is_connected = true;
                });
                this.fetchMarkets();
                this.subscribeToActiveSymbol();
            } else {
                setTimeout(checkConnection, 800);
            }
        };
        checkConnection();
    };

    @action
    setSymbol = (symbol: string) => {
        if (this.symbol === symbol) return;
        this.symbol = symbol;
        this.pip_size = getMarketPipSize(symbol, 2);
        this.ticks = [];
        this.raw_prices = [];
        this.current_price = null;
        this.last_digit = null;
        this.subscribeToActiveSymbol();
    };

    @action
    setStatsSampleSize = (size: number) => {
        if (this.stats_sample_size === size) return;
        this.stats_sample_size = size;
        if (this.ticks.length < size) {
            this.subscribeToActiveSymbol();
        }
    };

    /**
     * Group raw active_symbols from Deriv WebSocket by submarket/market display names
     */
    @action
    processWebSocketSymbols = (rawSymbols: any[]) => {
        if (!rawSymbols || !Array.isArray(rawSymbols) || rawSymbols.length === 0) return;

        const groupMap = new Map<string, TMarketItem[]>();

        rawSymbols.forEach((s: any) => {
            if (s.is_trading_suspended) return;
            const sym = s.symbol || s.underlying_symbol;
            if (!sym) return;

            const label = s.display_name || s.symbol_display_name || sym;
            const groupName =
                s.submarket_display_name ||
                s.market_display_name ||
                (s.market === 'synthetic_index' ? 'Derived Indices' : s.market) ||
                'Markets';

            if (!groupMap.has(groupName)) {
                groupMap.set(groupName, []);
            }

            groupMap.get(groupName)!.push({
                value: sym,
                label,
                market: s.market,
                submarket: s.submarket,
            });
        });

        const grouped: TMarketGroup[] = [];
        groupMap.forEach((items, group) => {
            grouped.push({
                group,
                items: items.sort((a, b) => a.label.localeCompare(b.label)),
            });
        });

        // Sort groups with Derived / Continuous first
        grouped.sort((a, b) => {
            if (a.group.toLowerCase().includes('continuous')) return -1;
            if (b.group.toLowerCase().includes('continuous')) return 1;
            if (a.group.toLowerCase().includes('derived')) return -1;
            if (b.group.toLowerCase().includes('derived')) return 1;
            return a.group.localeCompare(b.group);
        });

        runInAction(() => {
            this.markets = grouped;
            this.is_loading_markets = false;

            // If current symbol is not in available symbols, select the first one
            const allValues = grouped.flatMap(g => g.items.map(i => i.value));
            if (allValues.length > 0 && !allValues.includes(this.symbol)) {
                this.symbol = allValues[0];
                this.subscribeToActiveSymbol();
            }
        });
    };

    /**
     * Fetch active_symbols directly over Deriv WebSocket
     */
    @action
    fetchMarkets = async (_retryCount = 0) => {
        this.is_loading_markets = true;
        let symbols: any[] = [];

        try {
            symbols = await api_base.getActiveSymbols();
        } catch (error) {
            console.debug('[EasyToolStore] getActiveSymbols notice:', error);
        }

        if (symbols && symbols.length > 0) {
            this.processWebSocketSymbols(symbols);
        } else {
            this.markets = DEFAULT_MARKETS;
        }

        this.is_loading_markets = false;
    };

    @action
    unsubscribe = () => {
        if (this._tick_sub) {
            try {
                this._tick_sub.unsubscribe();
            } catch (e) {}
            this._tick_sub = null;
        }
    };

    /**
     * Stream live ticks directly from Deriv WebSocket for active symbol
     */
    @action
    subscribeToActiveSymbol = async (retryCount = 0) => {
        this.unsubscribe();
        const reqId = ++this._sub_request_id;
        const sym = this.symbol;
        this.is_loading_ticks = true;

        const pip = getMarketPipSize(sym, 2);
        runInAction(() => {
            this.pip_size = pip;
        });

        // 1. Centralized live tick stream subscription (multiplexed & handles reconnection)
        this._tick_sub = subscribeTicks(sym, (data: any) => {
            if (this.symbol !== sym || reqId !== this._sub_request_id) return;
            if (data?.tick && data.tick.symbol === sym) {
                const quote = Number(data.tick.quote);
                const tickPip = Number(data.tick.pip_size) ?? this.pip_size ?? pip;
                const digit = getLastDigitFromQuote(quote, sym, tickPip);

                runInAction(() => {
                    this.pip_size = tickPip;
                    this.current_price = quote;
                    this.last_digit = digit;
                    this.ticks = [...this.ticks, digit].slice(-2000);
                    this.raw_prices = [...this.raw_prices, quote].slice(-2000);
                });
            }
        });

        // 2. Fetch history from Deriv WebSocket
        try {
            if (!api_base.api || (api_base.api as any)?.connection?.readyState !== 1) {
                try {
                    await api_base.waitForConnection(3000);
                } catch {}
            }

            if (!api_base.api) {
                if (retryCount < 8) {
                    setTimeout(() => {
                        if (reqId === this._sub_request_id) {
                            this.subscribeToActiveSymbol(retryCount + 1);
                        }
                    }, 1000);
                } else {
                    runInAction(() => {
                        this.is_loading_ticks = false;
                    });
                }
                return;
            }

            const count = Math.max(this.stats_sample_size || 1000, 1000);
            const res: any = await api_base.api.send({
                ticks_history: sym,
                end: 'latest',
                count,
                style: 'ticks',
            });

            if (this.symbol !== sym || reqId !== this._sub_request_id) return;

            const history = res?.history || res?.ticks_history;
            if (history?.prices && Array.isArray(history.prices) && history.prices.length > 0) {
                const historyPip = Number(res?.pip_size) || this.pip_size || pip;
                const prices: number[] = history.prices.map((p: any) => Number(p));
                const digits: number[] = prices.map(p => getLastDigitFromQuote(p, sym, historyPip));

                runInAction(() => {
                    this.pip_size = historyPip;
                    if (this.ticks.length === 0) {
                        this.raw_prices = prices;
                        this.ticks = digits;
                        const last = prices[prices.length - 1];
                        this.current_price = last;
                        this.last_digit = digits[digits.length - 1] ?? null;
                    } else {
                        // Merge recent live ticks with historical ticks
                        this.ticks = [...digits, ...this.ticks].slice(-2000);
                        this.raw_prices = [...prices, ...this.raw_prices].slice(-2000);
                    }
                    this.is_loading_ticks = false;
                });
            }
        } catch (e) {
            console.debug('[EasyToolStore] ticks_history notice:', e);
        } finally {
            if (reqId === this._sub_request_id) {
                runInAction(() => {
                    this.is_loading_ticks = false;
                });
            }
        }
    };
}
