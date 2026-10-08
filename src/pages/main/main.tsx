import React, { Suspense, useEffect, useState, useMemo } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSiteConfig } from '@/utils/supabase-copy';
import ChunkLoader from '@/components/loader/chunk-loader';
import { generateOAuthURL } from '@/components/shared';
import Dialog from '@/components/shared_ui/dialog';
import Tabs from '@/components/shared_ui/tabs/tabs';
import TradingViewModal from '@/components/trading-view-chart/trading-view-modal';
import ProfihubModal from '@/components/profihub-analysis/profihub-modal';
import { DBOT_TABS, TAB_IDS } from '@/constants/bot-contents';
import { contract_stages } from '@/constants/contract-stage';
import { updateWorkspaceName } from '@/external/bot-skeleton';
import { CONNECTION_STATUS } from '@/external/bot-skeleton/services/api/observables/connection-status-stream';
import { isDbotRTL } from '@/external/bot-skeleton/utils/workspace';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import {
    disableUrlParameterApplication,
    enableUrlParameterApplication,
    setupTradeTypeChangeListener,
} from '@/utils/blockly-url-param-handler';
import {
    checkAndShowTradeTypeModal,
    getModalState,
    handleTradeTypeCancel,
    handleTradeTypeConfirm,
    resetUrlParamProcessing,
    setModalStateChangeCallback,
} from '@/utils/trade-type-modal-handler';
import TradeTypeConfirmationModal from '@/components/trade-type-confirmation-modal';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import RunPanel from '../../components/run-panel';
import ChartModal from '../chart/chart-modal';
import Dashboard from '../dashboard';
import TopBarTradeController from '@/components/topbar-trade-controller';
import Scanner from '../bot-builder/scanner/scanner';
import { TabIcon } from './tab-icons';
import './main.scss';

import { lazyRetry } from '@/utils/lazy-retry';

const ChartWrapper = lazyRetry(() => import('../chart/chart-wrapper'), 'charts');

const TradingView = lazyRetry(() => import('../tradingview'), 'tradingview');
const AnalysisTools = lazyRetry(() => import('../analysis-tool'), 'analysis_tool');
const Signals = lazyRetry(() => import('../signals'), 'signals');
const Marketkiller = lazyRetry(() => import('../marketkiller'), 'marketkiller');
const TradingBots = lazyRetry(() => import('../free-bots/trading-bots'), 'trading_bots');
const CopyTradingPage = lazyRetry(() => import('../copy-trading/copy-trading'), 'copy_trading');
const DTraderPage = lazyRetry(() => import('../dtrader'), 'dtrader');
const AutoTrades = lazyRetry(() => import('../autotrades'), 'autotrades');
const AiIntelligence = lazyRetry(() => import('../ai-intelligence'), 'ai_intelligence');
const Apex3Page = lazyRetry(() => import('../apex-3'), 'apex_3');

import { TabErrorBoundary } from '@/components/shared/TabErrorBoundary';
import { copyTradingService } from '@/pages/copy-trading/services/copy-trading.service';
import { initNetworkInterceptor } from '@/services/network-interceptor';
import { initWebSocketMonitor } from '@/services/websocket-monitor';

import { useInvalidTokenHandler } from '@/hooks/useInvalidTokenHandler';

const AppWrapper = observer(() => {
    useInvalidTokenHandler(); // Initialize global token handler
    const { connectionStatus } = useApiBase();
    const store = useStore();

    const { dashboard, load_modal, run_panel, quick_strategy, blockly_store } = store || {};
    const { is_loading = false } = blockly_store || {};
    const {
        active_tab = 0,
        active_tour = '',
        is_chart_modal_visible = false,
        is_trading_view_modal_visible = false,
        setActiveTab = () => {},
        setWebSocketState = () => {},
        setActiveTour = () => {},
        setTourDialogVisibility = () => {},
        setSystemCenterVisibility = () => {},
    } = dashboard || {};
    const { dashboard_strategies = [] } = load_modal || {};
    const {
        is_dialog_open = false,
        is_drawer_open = true,
        dialog_options = {},
        onCancelButtonClick,
        onCloseDialog,
        onOkButtonClick,
    } = run_panel || {};
    const { is_open = false } = quick_strategy || {};
    const {
        cancel_button_text = '',
        ok_button_text = '',
        title = '',
        message = '',
        dismissable = false,
        is_closed_on_cancel = false,
    } = (dialog_options as {
        [key: string]: string;
    }) || {};

    const { DASHBOARD, BOT_BUILDER } = DBOT_TABS;
    const init_render = React.useRef(true);
    const pollTimeoutId = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const hash = [
        'dashboard',
        'bot_builder',
        'chart',
        'trading_bots',
        'analysis_tool',
        'tradingview',
        'signals',
        'ai_intelligence',
        'scanner',
        'easy_tool',
        'marketkiller',
        'market_hunter_pro',
        'ai_trading_engine',
        'digitflow',
        'elite_pro',
        'poverty_hunter',
        'auto_x_eo',
        'overlord_ai',
        'copy_trading',
        'dtrader',
        'autoflipper',
        'autotrades',
        'apex_3',
    ];
    const { isDesktop } = useDevice();
    const location = useLocation();
    const navigate = useNavigate();

    const LAST_TAB_STORAGE_KEY = 'profithub_last_active_tab';

    // Automatic page memory restoration across reloads
    React.useEffect(() => {
        const rawHash = location.hash?.replace('#', '')?.toLowerCase();
        if (rawHash && hash.includes(rawHash)) {
            localStorage.setItem(LAST_TAB_STORAGE_KEY, rawHash);
            const targetIdx = hash.indexOf(rawHash);
            if (targetIdx > -1 && targetIdx !== active_tab) {
                setActiveTab(targetIdx);
            }
        } else {
            const rememberedTab = localStorage.getItem(LAST_TAB_STORAGE_KEY)?.toLowerCase();
            if (rememberedTab && hash.includes(rememberedTab)) {
                window.location.hash = rememberedTab;
                const targetIdx = hash.indexOf(rememberedTab);
                if (targetIdx > -1 && targetIdx !== active_tab) {
                    setActiveTab(targetIdx);
                }
            }
        }
        // Initialize institutional copy trading engine globally across all tabs
        try {
            copyTradingService.init();
        } catch (e) {
            console.warn('[CopyTrading] Global init notice:', e);
        }
    }, []);

    // Listen to hash changes to update memory
    React.useEffect(() => {
        const handleHashMemorySync = () => {
            const currentHash = window.location.hash?.replace('#', '')?.toLowerCase();
            if (currentHash && hash.includes(currentHash)) {
                localStorage.setItem(LAST_TAB_STORAGE_KEY, currentHash);
                const targetIdx = hash.indexOf(currentHash);
                if (targetIdx > -1 && targetIdx !== active_tab) {
                    setActiveTab(targetIdx);
                }
            }
        };
        window.addEventListener('hashchange', handleHashMemorySync);
        return () => window.removeEventListener('hashchange', handleHashMemorySync);
    }, [active_tab, setActiveTab]);

    const [siteConfig, setSiteConfig] = useState(() => getSiteConfig());

    useEffect(() => {
        // Initialize NOC interceptors
        initNetworkInterceptor();
        initWebSocketMonitor();

        const handler = () => {
            setSiteConfig(getSiteConfig());
        };
        const handleOpenSystemCenter = () => setSystemCenterVisibility(true);
        const handleCloseSystemCenter = () => setSystemCenterVisibility(false);

        window.addEventListener('profithub_config_changed', handler);
        window.addEventListener('open_system_center', handleOpenSystemCenter);
        window.addEventListener('close_system_center', handleCloseSystemCenter);

        return () => {
            window.removeEventListener('profithub_config_changed', handler);
            window.removeEventListener('open_system_center', handleOpenSystemCenter);
            window.removeEventListener('close_system_center', handleCloseSystemCenter);
        };
    }, []);

    const [tradeTypeModalState, setTradeTypeModalState] = useState(getModalState());

    const getTradeTypeModalProps = () => {
        const { tradeTypeData } = tradeTypeModalState;

        return {
            is_visible: tradeTypeModalState.isVisible,
            trade_type_display_name: tradeTypeData?.displayName || '',
            current_trade_type: tradeTypeData?.currentTradeType
                ? `${tradeTypeData.currentTradeType.tradeTypeCategory}/${tradeTypeData.currentTradeType.tradeType}`
                : 'N/A',
            current_trade_type_display_name: tradeTypeData?.currentTradeTypeDisplayName || 'N/A',
            onConfirm: handleTradeTypeConfirm,
            onCancel: handleTradeTypeCancel,
        };
    };

    let tab_value: number | string = active_tab;
    const GetHashedValue = (tab: number) => {
        tab_value = location.hash?.split('#')[1];
        if (!tab_value) return tab;
        return Number(hash.indexOf(String(tab_value)));
    };
    const active_hash_tab = GetHashedValue(active_tab);

    React.useEffect(() => {
        setModalStateChangeCallback(new_state => {
            setTradeTypeModalState(new_state);
        });
    }, [is_loading]);

    React.useEffect(() => {
        resetUrlParamProcessing();
    }, [location.search]);

    const prevConnectionStatus = React.useRef(connectionStatus);
    const isAccountSwitching = React.useRef(false);

    React.useEffect(() => {
        const onAccountSwitch = () => {
            isAccountSwitching.current = true;
            setWebSocketState(true);
            setTimeout(() => {
                isAccountSwitching.current = false;
            }, 3000);
        };

        window.addEventListener('account_switched', onAccountSwitch);
        return () => {
            window.removeEventListener('account_switched', onAccountSwitch);
        };
    }, [setWebSocketState]);

    React.useEffect(() => {
        const wasDisconnected = prevConnectionStatus.current === CONNECTION_STATUS.CLOSED;
        const isConnectedNow = connectionStatus === CONNECTION_STATUS.OPENED;

        if (wasDisconnected && isConnectedNow) {
            // Check if there was an actual trade in progress at the time of disconnection
            const hasRealActiveTrade =
                run_panel.is_running &&
                (run_panel.contract_stage === contract_stages.PURCHASE_SENT ||
                    run_panel.contract_stage === contract_stages.PURCHASE_RECEIVED);

            // Only show bot stopped dialog if bot was running a real open contract and NOT switching accounts
            if (hasRealActiveTrade && !isAccountSwitching.current) {
                setWebSocketState(false);
                if (typeof run_panel.stopBot === 'function') {
                    run_panel.stopBot();
                }
            } else {
                setWebSocketState(true);
            }
        } else if (connectionStatus !== CONNECTION_STATUS.OPENED) {
            // Keep the dialog hidden while offline or in unknown states
            setWebSocketState(true);
        }

        prevConnectionStatus.current = connectionStatus;
    }, [connectionStatus, setWebSocketState, run_panel.is_running, run_panel.contract_stage]);

    React.useEffect(() => {
        if (active_tab === BOT_BUILDER) {
            requestAnimationFrame(() => {
                disableUrlParameterApplication();
                setupTradeTypeChangeListener();

                const handleTradeTypeModal = () => {
                    checkAndShowTradeTypeModal(
                        () => {
                            enableUrlParameterApplication();
                        },
                        () => {}
                    );
                };

                if (!blockly_store.is_loading) {
                    setTimeout(() => {
                        handleTradeTypeModal();
                    }, 500);
                } else {
                    let pollAttempts = 0;
                    const maxPollAttempts = 10;

                    const checkBlocklyLoaded = () => {
                        if (!blockly_store.is_loading) {
                            handleTradeTypeModal();
                            return;
                        }

                        if (pollAttempts < maxPollAttempts) {
                            pollAttempts++;
                            pollTimeoutId.current = setTimeout(checkBlocklyLoaded, 500);
                        }
                    };

                    checkBlocklyLoaded();
                }
            });
        }

        return () => {
            if (pollTimeoutId.current) {
                clearTimeout(pollTimeoutId.current);
                pollTimeoutId.current = null;
            }
        };
    }, [active_tab, is_loading, blockly_store.is_loading]);

    React.useEffect(() => {
        if (is_open) {
            setTourDialogVisibility(false);
        }
        if (init_render.current) {
            setActiveTab(Number(active_hash_tab));
            if (!isDesktop) handleTabChange(Number(active_hash_tab));
            init_render.current = false;
        } else {
            const currentSearch = window.location.search;
            navigate(`${currentSearch}#${hash[active_tab] || hash[0]}`);
        }
        if (active_tour !== '') {
            setActiveTour('');
        }

        const mainElement = document.querySelector('.main__container');
        if (run_panel.is_drawer_open && !isDesktop) {
            document.body.style.overflow = 'hidden';
            if (mainElement instanceof HTMLElement) {
                mainElement.classList.add('no-scroll');
            }
        } else {
            document.body.style.overflow = '';
            if (mainElement instanceof HTMLElement) {
                mainElement.classList.remove('no-scroll');
            }
        }
    }, [active_tab, run_panel.is_drawer_open]);

    React.useEffect(() => {
        const trashcan_init_id = setTimeout(() => {
            if (active_tab === BOT_BUILDER && (Blockly as any)?.derivWorkspace?.trashcan) {
                const trashcanY = window.innerHeight - 250;
                let trashcanX;
                if (is_drawer_open) {
                    trashcanX = isDbotRTL() ? 380 : window.innerWidth - 460;
                } else {
                    trashcanX = isDbotRTL() ? 20 : window.innerWidth - 100;
                }
                (Blockly as any)?.derivWorkspace?.trashcan?.setTrashcanPosition(trashcanX, trashcanY);
            }
        }, 100);

        return () => {
            clearTimeout(trashcan_init_id);
        };
    }, [active_tab, is_drawer_open]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (dashboard_strategies.length > 0) {
            timer = setTimeout(() => {
                updateWorkspaceName();
            });
        }
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [dashboard_strategies, active_tab]);

    const handleTabChange = React.useCallback(
        (tab_index: number) => {
            setActiveTab(tab_index);
            const el_id = TAB_IDS[tab_index];
            if (el_id) {
                const el_tab = document.getElementById(el_id);
                setTimeout(() => {
                    el_tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }, 10);
            }
        },
        [active_tab]
    );

    const handleLoginGeneration = async () => {
        const oauthUrl = await generateOAuthURL();
        if (oauthUrl) {
            window.location.replace(oauthUrl);
        } else {
            console.error('Failed to generate OAuth URL');
        }
    };

    const allTabDescriptors = useMemo(
        () => [
            {
                key: 'dashboard',
                id: 'id-dbot-dashboard',
                label: <TabIcon iconKey='dashboard' label='Dashboard' />,
                content: (
                    <TabErrorBoundary tabId='id-dbot-dashboard' tabName='Dashboard'>
                        <Dashboard handleTabChange={handleTabChange} />
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'bot_builder',
                id: 'id-bot-builder',
                label: <TabIcon iconKey='bot_builder' label='Bot Builder' />,
                content: null,
            },
            {
                key: 'chart',
                id: is_chart_modal_visible || is_trading_view_modal_visible ? 'id-charts--disabled' : 'id-charts',
                label: <TabIcon iconKey='chart' label='Charts' />,
                content: (
                    <TabErrorBoundary tabId='id-charts' tabName='Charts'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading chart...')} />}>
                            <ChartWrapper show_digits_stats={false} />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'trading_bots',
                id: 'id-trading-bots',
                label: <TabIcon iconKey='trading_bots' label='Trading Bots' />,
                content: (
                    <TabErrorBoundary tabId='id-trading-bots' tabName='Trading Bots'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Trading Bots...')} />}>
                            <TradingBots />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'analysis_tool',
                id: 'id-analysis-tool',
                label: <TabIcon iconKey='analysis_tool' label='Analysis Tool' />,
                content: (
                    <TabErrorBoundary tabId='id-analysis-tool' tabName='Analysis Tool'>
                        <Suspense
                            fallback={<ChunkLoader message={localize('Please wait, loading Analysis Tool...')} />}
                        >
                            <AnalysisTools />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'tradingview',
                id: 'id-tradingview',
                label: <TabIcon iconKey='tradingview' label='TradingView' />,
                content: (
                    <TabErrorBoundary tabId='id-tradingview' tabName='TradingView'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading TradingView...')} />}>
                            <TradingView />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'signals',
                id: 'id-signals',
                label: <TabIcon iconKey='signals' label='Signals' />,
                content: (
                    <TabErrorBoundary tabId='id-signals' tabName='Signals'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Signals...')} />}>
                            <Signals />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'ai_intelligence',
                id: 'id-ai-intelligence',
                label: <TabIcon iconKey='ai_intelligence' label='AI Intelligence Hub' />,
                content: (
                    <TabErrorBoundary tabId='id-ai-intelligence' tabName='AI Intelligence Hub'>
                        <Suspense
                            fallback={<ChunkLoader message={localize('Please wait, loading AI Intelligence Hub...')} />}
                        >
                            <AiIntelligence />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'marketkiller',
                id: 'id-marketkiller',
                label: <TabIcon iconKey='marketkiller' label='Marketkiller' />,
                content: (
                    <TabErrorBoundary tabId='id-marketkiller' tabName='Marketkiller'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Marketkiller...')} />}>
                            <Marketkiller />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'autotrades',
                id: 'id-autotrades',
                label: <TabIcon iconKey='autotrades' label='Auto Trades' />,
                content: (
                    <TabErrorBoundary tabId='id-autotrades' tabName='Auto Trades'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Auto Trades Suite...')} />}>
                            <AutoTrades />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'copy_trading',
                id: 'id-copy-trading',
                label: <TabIcon iconKey='copy_trading' label='Copy Trading' />,
                content: (
                    <TabErrorBoundary tabId='id-copy-trading' tabName='Copy Trading'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Copy Trading...')} />}>
                            <CopyTradingPage />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'dtrader',
                id: 'id-dtrader',
                label: <TabIcon iconKey='dtrader' label='DTrader' />,
                content: (
                    <TabErrorBoundary tabId='id-dtrader' tabName='DTrader'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading DTrader...')} />}>
                            <DTraderPage />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
            {
                key: 'apex_3',
                id: 'id-apex-3',
                label: <TabIcon iconKey='apex_3' label='APEX 3.0' />,
                content: (
                    <TabErrorBoundary tabId='id-apex-3' tabName='APEX 3.0'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading APEX 3.0 Engine...')} />}>
                            <Apex3Page />
                        </Suspense>
                    </TabErrorBoundary>
                ),
            },
        ],
        [is_chart_modal_visible, is_trading_view_modal_visible, handleTabChange]
    );

    const activeTabsList = useMemo(() => {
        const list = [...allTabDescriptors];
        const configs = siteConfig?.tabConfig || [];
        const orderMap = new Map<string, number>();
        const enabledMap = new Map<string, boolean>();

        if (Array.isArray(configs)) {
            configs.forEach(c => {
                if (c && c.key) {
                    orderMap.set(c.key, c.order);
                    enabledMap.set(c.key, c.enabled);
                }
            });
        }

        return list
            .filter(tab => enabledMap.get(tab.key) !== false)
            .sort((a, b) => {
                const orderA = orderMap.has(a.key) ? orderMap.get(a.key)! : 99;
                const orderB = orderMap.has(b.key) ? orderMap.get(b.key)! : 99;
                return orderA - orderB;
            });
    }, [siteConfig, allTabDescriptors]);

    const rawTabKey = (
        hash[active_hash_tab] ??
        location.hash?.replace('#', '') ??
        hash[0] ??
        'dashboard'
    ).toLowerCase();

    const currentTabKey = React.useMemo(() => {
        const autoTradeSubtabs = ['elite_pro', 'auto_x_eo', 'poverty_hunter', 'overlord_ai', 'autoflipper', 'autotrades'];
        const aiIntelligenceSubtabs = ['market_hunter_pro', 'ai_trading_engine', 'scanner', 'ai_intelligence', 'ai_intelligence_hub'];
        const analysisSubtabs = ['easy_tool', 'easy-tool', 'digitflow'];
        if (autoTradeSubtabs.includes(rawTabKey)) return 'autotrades';
        if (aiIntelligenceSubtabs.includes(rawTabKey)) return 'ai_intelligence';
        if (analysisSubtabs.includes(rawTabKey)) return 'analysis_tool';
        return rawTabKey;
    }, [rawTabKey]);

    const filteredActiveIndex = Math.max(
        0,
        activeTabsList.findIndex(t => t.key.toLowerCase() === currentTabKey)
    );

    const handleFilteredTabChange = React.useCallback(
        (filteredIndex: number) => {
            const targetTab = activeTabsList[filteredIndex];
            if (targetTab) {
                const globalIndex = hash.indexOf(targetTab.key);
                if (globalIndex > -1) {
                    setActiveTab(globalIndex);
                    window.location.hash = targetTab.key;
                    localStorage.setItem('profithubexpert_last_active_tab', targetTab.key);
                    const el_id = targetTab.id;
                    if (el_id) {
                        const el_tab = document.getElementById(el_id);
                        setTimeout(() => {
                            el_tab?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                        }, 10);
                    }
                }
            }
        },
        [activeTabsList, setActiveTab]
    );

    if (!store) return null;

    // 1. Remove run panel and drawer from dashboard, trading bots, dtrader, and autotrades
    const shouldHideRunPanelAndDrawer = [
        'dashboard',
        'trading_bots',
        'free_bots',
        'trading-bots',
        'dtrader',
        'autotrades',
        'apex_3',
    ].includes(currentTabKey);

    return (
        <React.Fragment>
            <div className='main'>
                <div
                    className={classNames('main__container', {
                        'main__container--active': active_tour && active_tab === DASHBOARD && !isDesktop,
                        'main__container--drawer-open': isDesktop && is_drawer_open && !shouldHideRunPanelAndDrawer,
                    })}
                    data-active-tab={currentTabKey}
                >
                    <Tabs
                        active_index={filteredActiveIndex}
                        className='main__tabs'
                        onTabItemClick={handleFilteredTabChange}
                        history={window.history as any}
                        top
                        keep_alive={true}
                    >
                        {activeTabsList.map(tab => (
                            <div key={tab.key} label={tab.label as any} id={tab.id}>
                                {tab.content}
                            </div>
                        ))}
                    </Tabs>
                </div>
            </div>

            {isDesktop ? (
                <>
                    {!shouldHideRunPanelAndDrawer && (
                        <div
                            style={{
                                position: 'fixed',
                                top: '5rem',
                                right: '1.6rem',
                                width: '35.8rem',
                                height: '5rem',
                                zIndex: 990,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'var(--general-main-2)',
                                borderBottom: '1px solid var(--general-section-1)',
                                padding: '0 1.6rem',
                                boxSizing: 'border-box',
                            }}
                        >
                            <TopBarTradeController currentTabKey={currentTabKey} />
                        </div>
                    )}
                    {!shouldHideRunPanelAndDrawer && <RunPanel />}
                </>
            ) : (
                !is_open && !shouldHideRunPanelAndDrawer && <RunPanel />
            )}

            <ChartModal />
            <TradingViewModal />
            <ProfihubModal />

            <Dialog
                cancel_button_text={cancel_button_text || localize('Cancel')}
                className='dc-dialog__wrapper--fixed'
                confirm_button_text={ok_button_text || localize('Ok')}
                has_close_icon
                is_mobile_full_width={false}
                is_visible={is_dialog_open}
                onCancel={onCancelButtonClick || undefined}
                onClose={onCloseDialog}
                onConfirm={onOkButtonClick || onCloseDialog}
                portal_element_id='modal_root'
                title={title}
                login={handleLoginGeneration}
                dismissable={dismissable as unknown as boolean}
                is_closed_on_cancel={is_closed_on_cancel as unknown as boolean}
            >
                {message}
            </Dialog>
            <TradeTypeConfirmationModal
                is_visible={getTradeTypeModalProps().is_visible}
                trade_type_display_name={getTradeTypeModalProps().trade_type_display_name}
                current_trade_type={getTradeTypeModalProps().current_trade_type}
                current_trade_type_display_name={getTradeTypeModalProps().current_trade_type_display_name}
                onConfirm={getTradeTypeModalProps().onConfirm}
                onCancel={getTradeTypeModalProps().onCancel}
            />
            <Scanner />
        </React.Fragment>
    );
});

export default AppWrapper;
