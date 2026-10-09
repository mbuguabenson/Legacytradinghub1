import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from './megastreak-engine';
import { BestMarketCard } from './components/BestMarketCard';
import { DigitCircles } from './components/DigitCircles';
import { SimpleStatsCard } from './components/SimpleStatsCard';
import { EntryExitSignalCard } from './components/EntryExitSignalCard';
import { BeginnerGuideModal } from './components/BeginnerGuideModal';
import './megastreak-hub.scss';

export const MegastreakHub: React.FC = observer(() => {
    // Instantiate singleton MobX engine for life of the component
    const engine = useMemo(() => new MegastreakEngine(), []);
    const [marketCategory, setMarketCategory] = useState<'all' | 'continuous' | 'onesec' | 'jump'>('all');

    useEffect(() => {
        return () => {
            engine.destroy();
        };
    }, [engine]);

    // Group symbols into Volatilities (Continuous & 1s) and Jump Indices
    const continuousVolatilities = engine.available_symbols.filter(
        s => s.symbol.startsWith('R_') && !s.symbol.includes('1HZ')
    );
    const oneSecVolatilities = engine.available_symbols.filter(
        s => s.symbol.includes('1HZ')
    );
    const jumpIndices = engine.available_symbols.filter(
        s => s.symbol.startsWith('JD') || s.symbol.includes('JUMP')
    );

    // Filter displayed dropdown options according to category
    const displayedSymbols =
        marketCategory === 'continuous'
            ? continuousVolatilities
            : marketCategory === 'onesec'
            ? oneSecVolatilities
            : marketCategory === 'jump'
            ? jumpIndices
            : engine.available_symbols;

    return (
        <div className='megastreak-hub-root simple-mode curved-design-system'>
            {/* 1. Header Navigation Bar & Market Selector */}
            <header className='megastreak-top-nav'>
                <div className='nav-top-row'>
                    <div className='brand-cluster'>
                        <div className='brand-icon-gem'>
                            <span className='gem-spark'>⚡</span>
                        </div>
                        <div className='brand-text'>
                            <div className='brand-title-row'>
                                <span className='brand-title'>MEGASTREAK</span>
                                <span className='brand-version'>LIVE</span>
                            </div>
                            <span className='brand-desc'>Volatilities & Jump Indices Intelligence</span>
                        </div>
                    </div>

                    {/* Spot Price & Last Digit Live Capsule */}
                    <div className='spot-capsule'>
                        <div className='spot-price-group'>
                            <span className='spot-label'>SPOT PRICE</span>
                            <span className='spot-value'>
                                {engine.current_price > 0
                                    ? engine.current_price.toFixed(engine.pip_size)
                                    : 'Loading...'}
                            </span>
                        </div>
                        <div className='last-digit-badge' title='Most Recent Digit'>
                            <span className='digit-badge-label'>DIGIT</span>
                            <span className='digit-badge-num'>
                                {engine.latest_digit !== null ? engine.latest_digit : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Actions & Connection Status */}
                    <div className='top-actions-cluster'>
                        <button
                            type='button'
                            className='guide-nav-btn'
                            onClick={() => engine.toggleGuide()}
                            title='How to Trade with Megastreak'
                        >
                            📘 How to Trade
                        </button>

                        <div className='connection-status-pill'>
                            <span className={`status-dot ${engine.is_connected ? 'online' : 'offline'}`} />
                            <span className='status-text'>
                                {engine.is_connected ? 'Live' : 'Reconnecting...'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Segmented Pill Category Bar & Market Dropdown */}
                <div className='nav-controls-row'>
                    <div className='segmented-pills-cluster'>
                        <button
                            type='button'
                            className={`seg-pill ${marketCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setMarketCategory('all')}
                        >
                            All ({engine.available_symbols.length})
                        </button>
                        <button
                            type='button'
                            className={`seg-pill ${marketCategory === 'continuous' ? 'active' : ''}`}
                            onClick={() => setMarketCategory('continuous')}
                        >
                            Continuous ({continuousVolatilities.length})
                        </button>
                        <button
                            type='button'
                            className={`seg-pill ${marketCategory === 'onesec' ? 'active' : ''}`}
                            onClick={() => setMarketCategory('onesec')}
                        >
                            1-Sec Vol ({oneSecVolatilities.length})
                        </button>
                        <button
                            type='button'
                            className={`seg-pill ${marketCategory === 'jump' ? 'active' : ''}`}
                            onClick={() => setMarketCategory('jump')}
                        >
                            Jump ({jumpIndices.length})
                        </button>
                    </div>

                    <div className='market-selector-pill-group'>
                        <label htmlFor='megastreak-market-select' className='selector-label'>
                            ACTIVE MARKET:
                        </label>
                        <select
                            id='megastreak-market-select'
                            className='market-dropdown-styled'
                            value={engine.selected_symbol}
                            onChange={e => engine.selectSymbol(e.target.value)}
                        >
                            {displayedSymbols.map(s => (
                                <option key={s.symbol} value={s.symbol}>
                                    {s.display_name} ({s.symbol})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {/* 2. Best Market Card (Top Recommendation) */}
            <section className='megastreak-section section-best-market'>
                <BestMarketCard engine={engine} />
            </section>

            {/* 3. Official Deriv Digit Distribution Circles */}
            <section className='megastreak-section section-circles'>
                <DigitCircles engine={engine} />
            </section>

            {/* 4. Minimal Stats Bar */}
            <section className='megastreak-section section-stats'>
                <SimpleStatsCard engine={engine} />
            </section>

            {/* 5. Entry & Exit Action Center */}
            <section className='megastreak-section section-signals'>
                <EntryExitSignalCard engine={engine} />
            </section>

            {/* 5. Beginner Walkthrough Guide Modal */}
            <BeginnerGuideModal engine={engine} />
        </div>
    );
});

export default MegastreakHub;
