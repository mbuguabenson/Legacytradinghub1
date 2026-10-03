import React, { Suspense, useEffect, useState } from 'react';
import { lazyRetry } from '@/utils/lazy-retry';
import { TabErrorBoundary } from '@/components/shared/TabErrorBoundary';
import ChunkLoader from '@/components/loader/chunk-loader';
import { localize } from '@deriv-com/translations';
import './ai-intelligence.scss';

const MarketHunterPro = lazyRetry(() => import('../market-hunter-pro'), 'market_hunter_pro');
const EntryScanner = lazyRetry(
    () => import('../entry-scanner/entry-scanner').then(m => ({ default: m.EntryScanner })),
    'entry_scanner'
);
const ScannerPage = lazyRetry(() => import('../scanner/scanner'), 'scanner');

export type TAiIntelligenceSubTab = 'market_hunter_pro' | 'ai_trading_engine' | 'scanner';

interface AiIntelligenceDescriptor {
    id: TAiIntelligenceSubTab;
    label: string;
    subtitle: string;
    badge: string;
    icon: string;
}

const AI_INTELLIGENCE_TABS: AiIntelligenceDescriptor[] = [
    {
        id: 'market_hunter_pro',
        label: 'MARKET HUNTER PRO',
        subtitle: 'Autonomous Multi-Market Hunter',
        badge: 'Auto-Hunter',
        icon: '🏹',
    },
    {
        id: 'ai_trading_engine',
        label: 'AI TRADING ENGINE',
        subtitle: 'Multi-Tick Analysis & Execution',
        badge: 'Neural Engine',
        icon: '🤖',
    },
    {
        id: 'scanner',
        label: 'AI STRATEGY SCANNER',
        subtitle: 'Pattern & Signal Scanner Matrix',
        badge: 'Strategy Matrix',
        icon: '⚡',
    },
];

export const AiIntelligence: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TAiIntelligenceSubTab>(() => {
        const rawHash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '').toLowerCase();
        const validIds: TAiIntelligenceSubTab[] = ['market_hunter_pro', 'ai_trading_engine', 'scanner'];
        if (validIds.includes(rawHash as TAiIntelligenceSubTab)) {
            return rawHash as TAiIntelligenceSubTab;
        }
        const saved = typeof window !== 'undefined' ? sessionStorage.getItem('legacy_ai_intelligence_subtab') : null;
        if (saved && validIds.includes(saved as TAiIntelligenceSubTab)) {
            return saved as TAiIntelligenceSubTab;
        }
        return 'market_hunter_pro';
    });

    useEffect(() => {
        const handleHashChange = () => {
            const rawHash = window.location.hash.replace('#', '').toLowerCase();
            const validIds: TAiIntelligenceSubTab[] = ['market_hunter_pro', 'ai_trading_engine', 'scanner'];
            if (validIds.includes(rawHash as TAiIntelligenceSubTab)) {
                setActiveTab(rawHash as TAiIntelligenceSubTab);
            }
        };

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleSelectTab = (tabId: TAiIntelligenceSubTab) => {
        setActiveTab(tabId);
        sessionStorage.setItem('legacy_ai_intelligence_subtab', tabId);
        window.location.hash = tabId;
        window.dispatchEvent(
            new CustomEvent('PH_AI_INTELLIGENCE_SUBTAB_CHANGE', {
                detail: { subtab: tabId },
            })
        );
    };

    const renderActiveContent = () => {
        switch (activeTab) {
            case 'market_hunter_pro':
                return (
                    <TabErrorBoundary tabId='id-market-hunter-pro' tabName='Market Hunter Pro'>
                        <Suspense
                            fallback={<ChunkLoader message={localize('Please wait, loading Market Hunter Pro...')} />}
                        >
                            <MarketHunterPro />
                        </Suspense>
                    </TabErrorBoundary>
                );
            case 'ai_trading_engine':
                return (
                    <TabErrorBoundary tabId='id-ai-trading-engine' tabName='AI Trading Engine'>
                        <Suspense
                            fallback={<ChunkLoader message={localize('Please wait, loading AI Trading Engine...')} />}
                        >
                            <EntryScanner />
                        </Suspense>
                    </TabErrorBoundary>
                );
            case 'scanner':
                return (
                    <TabErrorBoundary tabId='id-scanner' tabName='AI Strategy Scanner'>
                        <Suspense fallback={<ChunkLoader message={localize('Please wait, loading AI Strategy Scanner...')} />}>
                            <ScannerPage forceShow />
                        </Suspense>
                    </TabErrorBoundary>
                );
            default:
                return null;
        }
    };

    return (
        <div className='ai-intelligence-page'>
            <div className='ai-intelligence-header'>
                <div className='ai-intelligence-nav' role='tablist'>
                    {AI_INTELLIGENCE_TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type='button'
                                role='tab'
                                aria-selected={isActive}
                                className={`ai-intelligence-nav__item ${isActive ? 'ai-intelligence-nav__item--active' : ''}`}
                                onClick={() => handleSelectTab(tab.id)}
                            >
                                <span className='ai-intelligence-nav__item-icon'>{tab.icon}</span>
                                <div className='ai-intelligence-nav__item-text'>
                                    <div className='ai-intelligence-nav__item-label-row'>
                                        <span className='ai-intelligence-nav__item-label'>{tab.label}</span>
                                        <span className='ai-intelligence-nav__item-badge'>{tab.badge}</span>
                                    </div>
                                    <span className='ai-intelligence-nav__item-subtitle'>{tab.subtitle}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className='ai-intelligence-body'>{renderActiveContent()}</div>
        </div>
    );
};

export default AiIntelligence;
