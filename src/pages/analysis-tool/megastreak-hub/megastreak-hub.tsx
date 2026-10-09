import React, { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from './megastreak-engine';
import { MarketScanner } from './components/MarketScanner';
import { DigitCircles } from './components/DigitCircles';
import { DigitChart } from './components/DigitChart';
import { StatisticalDistribution } from './components/StatisticalDistribution';
import { EntryConditionsPanel } from './components/EntryConditionsPanel';
import { SignalMonitorPanel } from './components/SignalMonitorPanel';
import { SignalLog } from './components/SignalLog';
import { BeginnerActionCard } from './components/BeginnerActionCard';
import { BeginnerGuideModal } from './components/BeginnerGuideModal';
import './megastreak-hub.scss';

export const MegastreakHub: React.FC = observer(() => {
    // Instantiate singleton MobX engine for life of the component
    const engine = useMemo(() => new MegastreakEngine(), []);

    useEffect(() => {
        return () => {
            engine.destroy();
        };
    }, [engine]);

    const isBeginner = engine.view_mode === 'beginner';

    return (
        <div className='megastreak-hub-root'>
            {/* Top Navigation / Brand Ribbon */}
            <div className='megastreak-top-nav'>
                <div className='brand-cluster'>
                    <div className='brand-icon-gem'>
                        <span className='gem-spark'>⚡</span>
                    </div>
                    <div className='brand-text'>
                        <div className='brand-title-row'>
                            <span className='brand-title'>MEGASTREAK HUB</span>
                            <span className='brand-version'>v2.0</span>
                        </div>
                        <span className='brand-desc'>Live Digit Analysis & Signal Assistant</span>
                    </div>
                </div>

                {/* Beginner vs Pro View Mode Switcher */}
                <div className='nav-middle-cluster'>
                    <div className='mode-switcher-group'>
                        <button
                            type='button'
                            className={`mode-btn ${isBeginner ? 'active-beginner' : ''}`}
                            onClick={() => engine.setViewMode('beginner')}
                            title='Simple step-by-step layout for new traders'
                        >
                            ⚡ Beginner Mode
                        </button>
                        <button
                            type='button'
                            className={`mode-btn ${!isBeginner ? 'active-pro' : ''}`}
                            onClick={() => engine.setViewMode('pro')}
                            title='Full technical metrics, distributions, and logs'
                        >
                            📊 Pro Analytics
                        </button>
                    </div>

                    <button
                        type='button'
                        className='guide-nav-btn'
                        onClick={() => engine.toggleGuide()}
                        title='How to use Megastreak Hub'
                    >
                        📘 How to Trade
                    </button>
                </div>

                <div className='top-status-group'>
                    <div className='connection-status-pill'>
                        <span className={`status-dot ${engine.is_connected ? 'online' : 'offline'}`} />
                        <span className='status-text'>
                            {engine.is_connected ? 'Live' : 'Reconnecting...'}
                        </span>
                    </div>

                    <div className='active-symbol-indicator'>
                        <span className='indicator-label'>MARKET</span>
                        <span className='indicator-name'>{engine.display_name}</span>
                    </div>
                </div>
            </div>

            {/* Beginner Mode: Prominent Action Blueprint on top */}
            {isBeginner && (
                <div className='megastreak-beginner-banner-wrapper'>
                    <BeginnerActionCard engine={engine} />
                </div>
            )}

            {/* Main Grid Layout */}
            <div className='megastreak-main-grid'>
                {/* Column 1: Market Scanner (Left) */}
                <aside className='megastreak-column col-scanner'>
                    <MarketScanner engine={engine} />
                </aside>

                {/* Column 2: Center Visuals (Digit Circles & Live Chart) */}
                <main className='megastreak-column col-center'>
                    <DigitCircles engine={engine} />
                    <DigitChart engine={engine} />
                </main>

                {/* Column 3: Intelligence & Signals (Right) */}
                <aside className='megastreak-column col-signals'>
                    <SignalMonitorPanel engine={engine} />
                    <StatisticalDistribution engine={engine} />
                    <EntryConditionsPanel engine={engine} />
                </aside>
            </div>

            {/* Bottom Row: Regime History & Signal Transition Log */}
            <footer className='megastreak-bottom-row'>
                <SignalLog engine={engine} />
            </footer>

            {/* Beginner Interactive Walkthrough Guide Modal */}
            <BeginnerGuideModal engine={engine} />
        </div>
    );
});

export default MegastreakHub;
