import React, { Suspense, useEffect, useState } from 'react';
import { lazyRetry } from '@/utils/lazy-retry';
import { TabErrorBoundary } from '@/components/shared/TabErrorBoundary';
import ChunkLoader from '@/components/loader/chunk-loader';
import { localize } from '@deriv-com/translations';
import './autotrades.scss';

const EliteProPage = lazyRetry(() => import('../elite-pro/elite-pro'), 'elite_pro');
const AutoXEoPage = lazyRetry(() => import('../auto-x-eo'), 'auto_x_eo');
const PovertyHunterPage = lazyRetry(() => import('../poverty-hunter'), 'poverty_hunter');
const OverlordAiPage = lazyRetry(() => import('../overlord-ai'), 'overlord_ai');
const AutoflipperPage = lazyRetry(() => import('../autoflipper/autoflipper'), 'autoflipper');

export type TAutoTradeSubTab = 'elite_pro' | 'auto_x_eo' | 'poverty_hunter' | 'overlord_ai' | 'autoflipper';

interface AutoTradeDescriptor {
    id: TAutoTradeSubTab;
    label: string;
    subtitle: string;
    badge: string;
    icon: string;
}

const AUTO_TRADE_TABS: AutoTradeDescriptor[] = [
    {
        id: 'elite_pro',
        label: 'Elite Pro',
        subtitle: 'Over 3 / Under 6 AI Engine',
        badge: 'AI Momentum',
        icon: '⚡',
    },
    {
        id: 'auto_x_eo',
        label: 'Auto X E/O',
        subtitle: 'Even/Odd Reversal Algo',
        badge: 'High Frequency',
        icon: '🚀',
    },
    {
        id: 'poverty_hunter',
        label: 'Poverty Hunter',
        subtitle: 'Precision Differs & Martingale',
        badge: 'Safe Differs',
        icon: '🎯',
    },
    {
        id: 'overlord_ai',
        label: 'Overlord AI',
        subtitle: 'Institutional Neural Matrix',
        badge: 'Neural Core',
        icon: '👑',
    },
    {
        id: 'autoflipper',
        label: 'AutoFlipper',
        subtitle: 'Adaptive Momentum Switcher',
        badge: 'Auto-Switch',
        icon: '🔄',
    },
];

export const AutoTrades: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TAutoTradeSubTab>(() => {
        const rawHash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '').toLowerCase();
        const validIds: TAutoTradeSubTab[] = ['elite_pro', 'auto_x_eo', 'poverty_hunter', 'overlord_ai', 'autoflipper'];
        if (validIds.includes(rawHash as TAutoTradeSubTab)) {
            return rawHash as TAutoTradeSubTab;
        }
        const saved = sessionStorage.getItem('legacy_autotrades_subtab');
        if (saved && validIds.includes(saved as TAutoTradeSubTab)) {
            return saved as TAutoTradeSubTab;
        }
        return 'elite_pro';
    });

    useEffect(() => {
        const handleHashChange = () => {
            const rawHash = window.location.hash.replace('#', '').toLowerCase();
            const validIds: TAutoTradeSubTab[] = ['elite_pro', 'auto_x_eo', 'poverty_hunter', 'overlord_ai', 'autoflipper'];
            if (validIds.includes(rawHash as TAutoTradeSubTab)) {
                setActiveTab(rawHash as TAutoTradeSubTab);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleSelectTab = (tabId: TAutoTradeSubTab) => {
        setActiveTab(tabId);
        sessionStorage.setItem('legacy_autotrades_subtab', tabId);
        window.dispatchEvent(
            new CustomEvent('PH_AUTOTRADES_SUBTAB_CHANGE', {
                detail: { subtab: tabId },
            })
        );
    };

    const renderActiveContent = () => {
        switch (activeTab) {
            case 'elite_pro':
                return (
                    <TabErrorBoundary tabId='id-elite-pro' tabName='Elite Pro'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Elite Pro...')} />}>
                            <EliteProPage />
                        </Suspense>
                    </TabErrorBoundary>
                );
            case 'auto_x_eo':
                return (
                    <TabErrorBoundary tabId='id-auto-x-eo' tabName='AUTO X E/O'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading AUTO X E/O...')} />}>
                            <AutoXEoPage />
                        </Suspense>
                    </TabErrorBoundary>
                );
            case 'poverty_hunter':
                return (
                    <TabErrorBoundary tabId='id-poverty-hunter' tabName='Poverty Hunter'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading Poverty Hunter...')} />}>
                            <PovertyHunterPage />
                        </Suspense>
                    </TabErrorBoundary>
                );
            case 'overlord_ai':
                return (
                    <TabErrorBoundary tabId='id-overlord-ai' tabName='OVERLORD AI'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading OVERLORD AI...')} />}>
                            <OverlordAiPage />
                        </Suspense>
                    </TabErrorBoundary>
                );
            case 'autoflipper':
                return (
                    <TabErrorBoundary tabId='id-autoflipper' tabName='AutoFlipper'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading AutoFlipper...')} />}>
                            <AutoflipperPage />
                        </Suspense>
                    </TabErrorBoundary>
                );
            default:
                return null;
        }
    };

    return (
        <div className='autotrades-page'>
            <div className='autotrades-header'>
                <div className='autotrades-nav' role='tablist'>
                    {AUTO_TRADE_TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type='button'
                                role='tab'
                                aria-selected={isActive}
                                className={`autotrades-nav__item ${isActive ? 'autotrades-nav__item--active' : ''}`}
                                onClick={() => handleSelectTab(tab.id)}
                            >
                                <span className='autotrades-nav__item-icon'>{tab.icon}</span>
                                <div className='autotrades-nav__item-text'>
                                    <div className='autotrades-nav__item-label-row'>
                                        <span className='autotrades-nav__item-label'>{tab.label}</span>
                                        <span className='autotrades-nav__item-badge'>{tab.badge}</span>
                                    </div>
                                    <span className='autotrades-nav__item-subtitle'>{tab.subtitle}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className='autotrades-body'>{renderActiveContent()}</div>
        </div>
    );
};

export default AutoTrades;
