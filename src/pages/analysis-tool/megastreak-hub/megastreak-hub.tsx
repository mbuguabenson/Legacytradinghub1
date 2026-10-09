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
import './megastreak-hub.scss';

export const MegastreakHub: React.FC = observer(() => {
    // Instantiate singleton MobX engine for life of the component
    const engine = useMemo(() => new MegastreakEngine(), []);

    useEffect(() => {
        return () => {
            engine.destroy();
        };
    }, [engine]);

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
                            <span className='brand-version'>v2.0 PRO</span>
                        </div>
                        <span className='brand-desc'>Live Digit Analysis & Market Intelligence</span>
                    </div>
                </div>

                <div className='top-status-group'>
                    <div className='connection-status-pill'>
                        <span className={`status-dot ${engine.is_connected ? 'online' : 'offline'}`} />
                        <span className='status-text'>
                            {engine.is_connected ? 'Deriv Stream Live' : 'Reconnecting...'}
                        </span>
                    </div>

                    <div className='active-symbol-indicator'>
                        <span className='indicator-label'>MARKET</span>
                        <span className='indicator-name'>{engine.display_name}</span>
                    </div>
                </div>
            </div>

            {/* Desktop 3-Column + Bottom Log Layout */}
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
        </div>
    );
});

export default MegastreakHub;
