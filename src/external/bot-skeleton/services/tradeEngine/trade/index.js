import { applyMiddleware, createStore } from 'redux';
import { thunk } from 'redux-thunk';
import { getLocalizedErrorMessage } from '@/constants/backend-error-messages';
import { createError } from '../../../utils/error';
import { observer as globalObserver } from '../../../utils/observer';
import { api_base } from '../../api/api-base';
import { isFastModeActive, isUltraModeActive, syncFastExecutionOverride } from '../utils/fastMode';
import { checkBlocksForProposalRequest, doUntilDone } from '../utils/helpers';
import { expectInitArg } from '../utils/sanitize';
import { proposalsReady, start } from './state/actions';
import * as constants from './state/constants';
import rootReducer from './state/reducers';
import Balance from './Balance';
import OpenContract from './OpenContract';
import Proposal from './Proposal';
import Purchase from './Purchase';
import Sell from './Sell';
import Ticks from './Ticks';
import Total from './Total';

export { isFastModeActive, isUltraModeActive } from '../utils/fastMode';

export let lastUltraPurchasedTickId = null;
export const resetUltraPurchasedTick = () => {
    lastUltraPurchasedTickId = null;
};

const watchBefore = store => {
    if (typeof window !== 'undefined' && (window.__dbot_stopped || !api_base.is_running)) {
        return Promise.resolve(false);
    }

    if (typeof window !== 'undefined' && window.is_bot_paused) {
        return new Promise(resolve => {
            let resolved = false;
            const onResume = () => {
                if (resolved) return;
                resolved = true;
                globalObserver.unregister('bot.resume', onResume);
                globalObserver.unregister('bot.stop', onStop);
                const state = store.getState();
                if (state.scope === constants.STOP || (typeof window !== 'undefined' && window.__dbot_stopped) || !api_base.is_running) {
                    resolve(false);
                    return;
                }
                resolve(watchBefore(store));
            };
            const onStop = () => {
                if (resolved) return;
                resolved = true;
                globalObserver.unregister('bot.resume', onResume);
                globalObserver.unregister('bot.stop', onStop);
                resolve(false);
            };
            globalObserver.register('bot.resume', onResume);
            globalObserver.register('bot.stop', onStop);
            if (!window.is_bot_paused) onResume();
        });
    }

    // 🚀 ULTRA MODE: Purchase on EVERY tick generated without waiting for previous contract to close!
    if (isUltraModeActive()) {
        const currentState = store.getState();
        // If a purchase was just executed on this tick, exit before-purchase loop immediately
        // so interpreter can pass during (instant) -> after_purchase (trade_again) -> loop
        if (currentState.scope === constants.DURING_PURCHASE) {
            return Promise.resolve(false);
        }

        const currentTickId = currentState.newTickId || currentState.newTick;

        // If this is a fresh tick that hasn't traded yet, fire immediately!
        if (currentTickId && currentTickId !== lastUltraPurchasedTickId) {
            lastUltraPurchasedTickId = currentTickId;
            return Promise.resolve(true);
        }

        // Otherwise wait for the NEXT tick to be dispatched by Ticks.js
        return new Promise(resolve => {
            let isResolved = false;
            const cleanup = () => {
                globalObserver.unregister('bot.stop', onBotStop);
                unsubscribe();
            };
            const onBotStop = () => {
                if (isResolved) return;
                isResolved = true;
                cleanup();
                resolve(false);
            };
            globalObserver.register('bot.stop', onBotStop);

            const unsubscribe = store.subscribe(() => {
                if (isResolved) return;
                if (typeof window !== 'undefined' && (window.__dbot_stopped || !api_base.is_running)) {
                    isResolved = true;
                    cleanup();
                    resolve(false);
                    return;
                }
                const state = store.getState();
                if (state.scope === constants.DURING_PURCHASE || state.scope === constants.STOP) {
                    isResolved = true;
                    cleanup();
                    resolve(false);
                    return;
                }
                const tickId = state.newTickId || state.newTick;
                if (tickId && tickId !== lastUltraPurchasedTickId) {
                    isResolved = true;
                    lastUltraPurchasedTickId = tickId;
                    cleanup();
                    resolve(true);
                }
            });
        });
    }

    const currentState = store.getState();
    if (currentState.scope === constants.DURING_PURCHASE || currentState.scope === constants.STOP) {
        return Promise.resolve(false);
    }

    if (
        currentState.scope === constants.BEFORE_PURCHASE &&
        currentState.proposalsReady &&
        !currentState.hasFiredBefore
    ) {
        store.dispatch({ type: 'BEFORE_FIRED' });
        return Promise.resolve(true);
    }

    return watchScope({
        store,
        stopScope: constants.DURING_PURCHASE,
        passScope: constants.BEFORE_PURCHASE,
        passFlag: 'proposalsReady',
        allowImmediate: true,
    });
};

const watchDuring = store => {
    if (typeof window !== 'undefined' && (window.__dbot_stopped || !api_base.is_running)) {
        return Promise.resolve(false);
    }

    // 🚀 ULTRA MODE: Never block in watchDuring!
    // Exiting immediately allows after_purchase (trade_again) and next tick purchase
    // to execute concurrently while previous contracts are still in flight.
    if (isUltraModeActive()) {
        return Promise.resolve(false);
    }

    return new Promise(resolve => {
        const currentState = store.getState();
        if (currentState.scope === constants.STOP || (typeof window !== 'undefined' && window.__dbot_stopped) || !api_base.is_running) {
            resolve(false);
            return;
        }

        // Check immediately: if fast mode is ON and conditions are already met, pass now.
        const canPassImmediately = state =>
            state.scope === constants.DURING_PURCHASE &&
            state.openContract &&
            !state.hasFiredDuring;

        if (isFastModeActive() && canPassImmediately(currentState)) {
            store.dispatch({ type: 'DURING_FIRED' });
            resolve(true);
            return;
        }

        let isResolved = false;

        const unsubscribe = store.subscribe(() => {
            if (isResolved) return;
            const newState = store.getState();

            if (newState.scope === constants.STOP || (typeof window !== 'undefined' && window.__dbot_stopped) || !api_base.is_running) {
                isResolved = true;
                unsubscribe();
                window.removeEventListener('dbot_speed_mode_changed', onSpeedChange);
                resolve(false);
                return;
            }

            // Re-check fast mode on every state change (supports mid-run toggle)
            if (isFastModeActive() && canPassImmediately(newState)) {
                isResolved = true;
                unsubscribe();
                window.removeEventListener('dbot_speed_mode_changed', onSpeedChange);
                store.dispatch({ type: 'DURING_FIRED' });
                resolve(true);
                return;
            }

            if (newState.newTick === prevTick) return;
            prevTick = newState.newTick;

            if (newState.scope === constants.DURING_PURCHASE && newState.openContract) {
                if (!newState.hasFiredDuring) {
                    isResolved = true;
                    unsubscribe();
                    window.removeEventListener('dbot_speed_mode_changed', onSpeedChange);
                    store.dispatch({ type: 'DURING_FIRED' });
                    resolve(true);
                }
            }
        });

        // Also listen for speed mode toggle mid-run: if user switches to FAST while
        // we are waiting for a tick, immediately unblock the during-purchase phase.
        const onSpeedChange = () => {
            if (isResolved) return;
            const state = store.getState();
            if (isFastModeActive() && canPassImmediately(state)) {
                isResolved = true;
                unsubscribe();
                window.removeEventListener('dbot_speed_mode_changed', onSpeedChange);
                store.dispatch({ type: 'DURING_FIRED' });
                resolve(true);
            }
        };
        window.addEventListener('dbot_speed_mode_changed', onSpeedChange);
    });
};


/* The watchScope function is called randomly and resets the prevTick
 * which leads to the same problem we try to solve. So prevTick is isolated
 */
export let prevTick;
export const resetPrevTick = () => {
    prevTick = undefined;
};

const watchScope = ({
    store,
    stopScope,
    passScope,
    passFlag,
    allowImmediate = false,
    fireOnceFlag = null,
    fireOnceAction = null,
}) => {
    if (typeof window !== 'undefined' && (window.__dbot_stopped || !api_base.is_running)) {
        return Promise.resolve(false);
    }
    const currentState = store.getState();
    if (currentState.scope === stopScope || currentState.scope === constants.STOP) {
        return Promise.resolve(false);
    }

    const canPassNow = state =>
        state.scope === passScope && state[passFlag] && (!fireOnceFlag || !state[fireOnceFlag]);

    if (allowImmediate && canPassNow(currentState)) {
        if (fireOnceAction) {
            store.dispatch({ type: fireOnceAction });
        }
        return Promise.resolve(true);
    }

    return new Promise(resolve => {
        let isResolved = false;

        const cleanup = () => {
            globalObserver.unregister('bot.stop', onBotStop);
            globalObserver.unregister('bot.resume', onBotResume);
            if (typeof window !== 'undefined') {
                window.removeEventListener('bot_resumed', onBotResume);
            }
            unsubscribe();
        };

        const onBotStop = () => {
            if (isResolved) return;
            isResolved = true;
            cleanup();
            resolve(false);
        };

        const onBotResume = () => {
            if (isResolved) return;
            prevTick = undefined;
            const state = store.getState();
            if (state.scope === stopScope || state.scope === constants.STOP || (typeof window !== 'undefined' && window.__dbot_stopped)) {
                isResolved = true;
                cleanup();
                resolve(false);
                return;
            }
            if (canPassNow(state)) {
                isResolved = true;
                cleanup();
                if (fireOnceAction && fireOnceFlag && !state[fireOnceFlag]) {
                    store.dispatch({ type: fireOnceAction });
                }
                resolve(true);
            }
        };

        globalObserver.register('bot.stop', onBotStop);
        globalObserver.register('bot.resume', onBotResume);
        if (typeof window !== 'undefined') {
            window.addEventListener('bot_resumed', onBotResume);
        }

        const unsubscribe = store.subscribe(() => {
            if (isResolved) return;
            const newState = store.getState();

            if (newState.scope === stopScope || newState.scope === constants.STOP || (typeof window !== 'undefined' && window.__dbot_stopped) || !api_base.is_running) {
                isResolved = true;
                cleanup();
                resolve(false);
                return;
            }

            // Fast / immediate / resume: resolve as soon as the flag is set, do not wait for another tick.
            if (allowImmediate && canPassNow(newState)) {
                isResolved = true;
                cleanup();
                if (fireOnceAction) {
                    store.dispatch({ type: fireOnceAction });
                }
                resolve(true);
                return;
            }

            if (newState.newTick === prevTick) return;
            prevTick = newState.newTick;

            if (newState.scope === passScope && newState[passFlag]) {
                isResolved = true;
                cleanup();
                if (fireOnceAction && fireOnceFlag && !newState[fireOnceFlag]) {
                    store.dispatch({ type: fireOnceAction });
                }
                resolve(true);
            }
        });
    });
};

export default class TradeEngine extends Balance(Purchase(Sell(OpenContract(Proposal(Ticks(Total(class {}))))))) {
    constructor($scope) {
        super();
        this.observer = $scope.observer;
        this.$scope = $scope;
        this.observe();
        this.data = {
            contract: {},
            proposals: [],
        };
        this.subscription_id_for_accumulators = null;
        this.is_proposal_requested_for_accumulators = false;
        this.store = createStore(rootReducer, applyMiddleware(thunk));

        // Listen for live speed mode changes from the header toggle while bot is running
        if (typeof window !== 'undefined') {
            this._speedModeListener = () => {
                this.makeDirectPurchaseDecision();
            };
            window.addEventListener('dbot_speed_mode_changed', this._speedModeListener);

            this._stopListener = () => {
                try {
                    resetUltraPurchasedTick();
                    this.store.dispatch({ type: constants.SELL });
                    this.is_contract_buying_in_progress = false;
                    this._clearWatchdog?.();
                    if (this.active_contract_ids) this.active_contract_ids.clear();
                    if (this.bulk_contract_ids) this.bulk_contract_ids.clear();
                    if (this.bulk_sold_contract_ids) this.bulk_sold_contract_ids.clear();
                } catch {}
            };
            globalObserver.register('bot.stop', this._stopListener);

            this._resumeListener = () => {
                resetPrevTick();
                resetUltraPurchasedTick();
                this.makeDirectPurchaseDecision();
            };
            globalObserver.register('bot.resume', this._resumeListener);
        }
    }

    init(...args) {
        const [token, options] = expectInitArg(args);
        const { symbol } = options;

        this.initArgs = args;
        this.options = options;
        this.symbol = symbol;
        this.startPromise = this.loginAndGetBalance(token);

        if (!this.checkTicksPromiseExists()) this.watchTicks(symbol);
    }

    start(tradeOptions) {
        if (!this.options) {
            throw createError('NotInitialized', getLocalizedErrorMessage('NotInitialized'));
        }

        globalObserver.emit('bot.running');

        const validated_trade_options = this.validateTradeOptions(tradeOptions);

        this.tradeOptions = { ...validated_trade_options, symbol: this.options.symbol };
        syncFastExecutionOverride();
        this.store.dispatch(start());
        this.checkLimits(validated_trade_options);

        this.makeDirectPurchaseDecision();
    }

    loginAndGetBalance(token) {
        const activeLoginId =
            (typeof localStorage !== 'undefined' &&
                (localStorage.getItem('active_loginid') || localStorage.getItem('client.loginid'))) ||
            '';

        this.accountInfo = {
            ...api_base.account_info,
            loginid: activeLoginId || api_base.account_info?.loginid || token,
        };
        this.token = activeLoginId || api_base.token || token;

        // ─── Guard against duplicate subscriptions ─────────────────────
        if (!this._txRecoverySubscribed && api_base.api) {
            this._txRecoverySubscribed = true;
            try {
                const subscription = api_base.api.onMessage().subscribe(({ data }) => {
                    if (data?.msg_type === 'transaction' && data.transaction?.action === 'sell') {
                        this.transaction_recovery_timeout = setTimeout(() => {
                            const { contract } = this.data;
                            const is_same_contract = contract?.contract_id === data.transaction?.contract_id;
                            const is_open_contract = contract?.status === 'open';
                            if (is_same_contract && is_open_contract) {
                                doUntilDone(() => {
                                    api_base.api?.send({
                                        proposal_open_contract: 1,
                                        contract_id: contract.contract_id,
                                    });
                                }, ['PriceMoved']);
                            }
                        }, 1500);
                    }
                });
                api_base.pushSubscription(subscription);
            } catch (err) {
                this._txRecoverySubscribed = false;
                console.warn('[TradeEngine] Failed to register transaction recovery subscription:', err);
            }
        }

        return Promise.resolve();
    }

    observe() {
        this.observeOpenContract();
        this.observeBalance();
        this.observeProposals();
    }

    watch(watchName) {
        if (watchName === 'before') {
            return watchBefore(this.store);
        }
        return watchDuring(this.store);
    }

    makeDirectPurchaseDecision() {
        const { has_payout_block, is_basis_payout } = checkBlocksForProposalRequest();
        const isSpeedMode = isFastModeActive();
        this.is_proposal_subscription_required = !isSpeedMode && (has_payout_block || is_basis_payout);

        if (this.is_proposal_subscription_required) {
            this.makeProposals({ ...this.options, ...this.tradeOptions });
            this.checkProposalReady();
        } else {
            this.store.dispatch(proposalsReady());
        }
    }
}
