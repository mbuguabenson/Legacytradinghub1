import React, { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from './megastreak-engine';
import { BestMarketCard } from './components/BestMarketCard';
import { RealEntryPointsCard } from './components/RealEntryPointsCard';
import { Last50DigitCircles } from './components/Last50DigitCircles';
import { DigitCircles } from './components/DigitCircles';
import { AnalysisEnginesPanel } from './components/AnalysisEnginesPanel';
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

    // Switch category and auto-select matching market if current symbol does not belong
    const handleCategoryChange = (category: 'all' | 'continuous' | 'onesec' | 'jump') => {
        setMarketCategory(category);
        if (category === 'continuous' && (!engine.selected_symbol.startsWith('R_') || engine.selected_symbol.includes('1HZ'))) {
            const first = continuousVolatilities[0]?.symbol;
            if (first) engine.selectSymbol(first);
        } else if (category === 'onesec' && !engine.selected_symbol.includes('1HZ')) {
            const first = oneSecVolatilities[0]?.symbol;
            if (first) engine.selectSymbol(first);
        } else if (category === 'jump' && !engine.selected_symbol.startsWith('JD') && !engine.selected_symbol.includes('JUMP')) {
            const first = jumpIndices[0]?.symbol;
            if (first) engine.selectSymbol(first);
        }
    };

    // Filter displayed dropdown options according to category
    let displayedSymbols =
        marketCategory === 'continuous'
            ? continuousVolatilities
            : marketCategory === 'onesec'
            ? oneSecVolatilities
            : marketCategory === 'jump'
            ? jumpIndices
            : engine.available_symbols;

    // Safety guarantee: ensure currently active symbol is ALWAYS in displayed dropdown options
    if (!displayedSymbols.some(s => s.symbol === engine.selected_symbol)) {
        const activeSym = engine.available_symbols.find(s => s.symbol === engine.selected_symbol);
        if (activeSym) {
            displayedSymbols = [activeSym, ...displayedSymbols];
        }
    }

    const onSelectMarket = (sym: string) => {
        if (sym.startsWith('R_') && !sym.includes('1HZ')) {
            if (marketCategory !== 'all' && marketCategory !== 'continuous') setMarketCategory('continuous');
        } else if (sym.includes('1HZ')) {
            if (marketCategory !== 'all' && marketCategory !== 'onesec') setMarketCategory('onesec');
        } else if (sym.startsWith('JD') || sym.includes('JUMP')) {
            if (marketCategory !== 'all' && marketCategory !== 'jump') setMarketCategory('jump');
        }
        engine.selectSymbol(sym);
    };

    // Fast-jump markets for instant switching
    const quickMarkets = [
        { symbol: 'R_100', label: 'Vol 100' },
        { symbol: 'R_75', label: 'Vol 75' },
        { symbol: 'R_50', label: 'Vol 50' },
        { symbol: '1HZ100V', label: '1s 100' },
        { symbol: '1HZ75V', label: '1s 75' },
        { symbol: 'JD100', label: 'Jump 100' },
    ];

    const tickDir = engine.tick_direction;

    return (
        <div className='megastreak-hub-root modern-hub-redesign'>
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
                                <span className='brand-version'>PRO 2.0</span>
                            </div>
                            <span className='brand-desc'>Real-Time Synthetics &amp; Jump Indices Intelligence</span>
                        </div>
                    </div>

                    {/* Spot Price & Last Digit Live Capsule */}
                    <div className='spot-capsule'>
                        <div className='spot-price-group'>
                            <div className='spot-header-row'>
                                <span className='spot-label'>SPOT QUOTE</span>
                                <span className='spot-market-tag'>{engine.selected_symbol}</span>
                                <span className='spot-pip-tag'>{engine.pip_size} dec</span>
                            </div>
                            <div className='spot-value-row'>
                                <span className={`spot-value ${tickDir}`}>
                                    {engine.current_price > 0
                                        ? engine.formatted_price
                                        : engine.is_loading_ticks
                                        ? 'Loading quote...'
                                        : 'Connecting...'}
                                </span>
                                {tickDir === 'up' && <span className='tick-arrow up'>▲</span>}
                                {tickDir === 'down' && <span className='tick-arrow down'>▼</span>}
                            </div>
                        </div>
                        <div className='last-digit-badge' title='Latest Active Digit'>
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
                            className='quick-scan-nav-btn'
                            onClick={() => engine.scanAllMarkets()}
                            disabled={engine.is_scanning_all}
                            title='Scan all markets for top setups'
                        >
                            {engine.is_scanning_all ? `Scanning (${engine.scan_progress}%)` : '⚡ Quick Scan'}
                        </button>

                        <button
                            type='button'
                            className='guide-nav-btn'
                            onClick={() => engine.toggleGuide()}
                            title='How to Trade with Megastreak'
                        >
                            📘 Guide
                        </button>

                        <div className='connection-status-pill'>
                            <span className={`status-dot ${engine.is_connected ? 'online' : 'offline'}`} />
                            <span className='status-text'>
                                {engine.is_connected ? 'Live' : 'Reconnecting...'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Chips & Category Filter */}
                <div className='nav-controls-row'>
                    <div className='segmented-pills-cluster'>
                        <button
                            type='button'
                            className={`seg-pill ${marketCategory === 'all' ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('all')}
                        >
                            All ({engine.available_symbols.length})
                        </button>
                        <button
                            type='button'
                            className={`seg-pill ${marketCategory === 'continuous' ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('continuous')}
                        >
                            Continuous ({continuousVolatilities.length})
                        </button>
                        <button
                            type='button'
                            className={`seg-pill ${marketCategory === 'onesec' ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('onesec')}
                        >
                            1-Sec Vol ({oneSecVolatilities.length})
                        </button>
                        <button
                            type='button'
                            className={`seg-pill ${marketCategory === 'jump' ? 'active' : ''}`}
                            onClick={() => handleCategoryChange('jump')}
                        >
                            Jump ({jumpIndices.length})
                        </button>
                    </div>

                    {/* Quick Market Shortcuts */}
                    <div className='quick-market-chips'>
                        {quickMarkets.map(m => (
                            <button
                                key={m.symbol}
                                type='button'
                                className={`market-chip ${engine.selected_symbol === m.symbol ? 'chip-active' : ''}`}
                                onClick={() => onSelectMarket(m.symbol)}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>

                    <div className='market-selector-pill-group'>
                        <label htmlFor='megastreak-market-select' className='selector-label'>
                            MARKET:
                        </label>
                        <select
                            id='megastreak-market-select'
                            className='market-dropdown-styled'
                            value={engine.selected_symbol}
                            onChange={e => onSelectMarket(e.target.value)}
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

            {/* 2. Best Market Card (Top Algorithmic Pick) */}
            <section className='megastreak-section section-best-market'>
                <BestMarketCard engine={engine} />
            </section>

            {/* 3. Real Entry Points & Trade Signals Card */}
            <section className='megastreak-section section-entry-points'>
                <RealEntryPointsCard engine={engine} />
            </section>

            {/* 4. Last 50 Digits in Circles of Different Colors Each Digit */}
            <section className='megastreak-section section-last50-stream'>
                <Last50DigitCircles engine={engine} />
            </section>

            {/* 5. Official Deriv 0-9 Digit Distribution Frequency Rings */}
            <section className='megastreak-section section-circles'>
                <DigitCircles engine={engine} />
            </section>

            {/* 6. Market & Analysis Engines Hub */}
            <section className='megastreak-section section-engines'>
                <AnalysisEnginesPanel engine={engine} />
            </section>

            {/* 7. Beginner Walkthrough Guide Modal */}
            <BeginnerGuideModal engine={engine} />
        </div>
    );
});

export default MegastreakHub;
