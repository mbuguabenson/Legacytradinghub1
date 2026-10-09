import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface MarketScannerProps {
    engine: MegastreakEngine;
}

export const MarketScanner: React.FC<MarketScannerProps> = observer(({ engine }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

    const pick = engine.megastreak_pick;
    const isScanning = engine.is_scanning_all;
    const progress = engine.scan_progress;
    const markets = engine.all_markets_stats;
    const availableSymbols = engine.available_symbols;
    const selectedSymbol = engine.selected_symbol;
    const isBestMarketExpanded = engine.is_best_market_expanded;

    // Filter available symbols or scanned markets by search
    const filteredAvailable = availableSymbols.filter(
        m =>
            m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.display_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleRow = (sym: string) => {
        setExpandedSymbol(expandedSymbol === sym ? null : sym);
    };

    return (
        <div className='megastreak-scanner-panel'>
            {/* Header & Market Quick Selector */}
            <div className='scanner-top-bar'>
                <div className='scanner-title-group'>
                    <span className='scanner-title'>Market Scanner</span>
                    <span className='scanner-count'>{availableSymbols.length} Synthetics</span>
                </div>

                <div className='scanner-actions'>
                    <button
                        type='button'
                        className={`scan-all-btn ${isScanning ? 'scanning' : ''}`}
                        onClick={() => engine.scanAllMarkets()}
                        disabled={isScanning}
                    >
                        {isScanning ? `Scanning (${progress}%)` : '⚡ Scan All Markets'}
                    </button>
                </div>
            </div>

            {/* Individual Market Quick Dropdown & Search */}
            <div className='scanner-controls-row'>
                <div className='select-wrapper'>
                    <select
                        className='market-dropdown'
                        value={selectedSymbol}
                        onChange={e => engine.selectSymbol(e.target.value)}
                    >
                        {availableSymbols.map(s => (
                            <option key={s.symbol} value={s.symbol}>
                                {s.display_name} ({s.symbol})
                            </option>
                        ))}
                    </select>
                </div>
                <input
                    type='text'
                    className='market-search-input'
                    placeholder='Filter...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Scan Progress Bar */}
            {isScanning && (
                <div className='scan-progress-strip'>
                    <div className='progress-bar-fill' style={{ width: `${progress}%` }} />
                </div>
            )}

            {/* Section 9: Collapsed Best Market Summary Card by Default */}
            <div className='megastreak-pick-card'>
                <div
                    className='pick-header'
                    onClick={() => engine.toggleBestMarketExpanded()}
                >
                    <div className='pick-title-group'>
                        <span className='pick-badge'>MEGASTREAK PICK</span>
                        <span className='pick-symbol-name'>
                            {pick ? `${pick.displayName} (${pick.symbol})` : 'Scanning / Evaluating'}
                        </span>
                    </div>
                    <div className='pick-header-right'>
                        {pick && (
                            <span className={`pick-score-tag ${pick.score >= 80 ? 'high' : 'medium'}`}>
                                Score {pick.score}/100
                            </span>
                        )}
                        <span className='accordion-arrow'>{isBestMarketExpanded ? '▲' : '▼'}</span>
                    </div>
                </div>

                {/* Collapsible Content */}
                {isBestMarketExpanded && (
                    <div className='pick-body'>
                        {pick ? (
                            <div className='pick-details-grid'>
                                <div className='detail-cell'>
                                    <span className='detail-label'>Market:</span>
                                    <span className='detail-val highlight'>{pick.symbol}</span>
                                </div>
                                <div className='detail-cell'>
                                    <span className='detail-label'>Direction:</span>
                                    <span className={`detail-val ${pick.preferredDirection.startsWith('UNDER') ? 'under-text' : 'over-text'}`}>
                                        {pick.preferredDirection}
                                    </span>
                                </div>
                                <div className='detail-cell'>
                                    <span className='detail-label'>Last Digit:</span>
                                    <span className='detail-val'>{pick.latestDigit}</span>
                                </div>
                                <div className='detail-cell'>
                                    <span className='detail-label'>Market Score:</span>
                                    <span className='detail-val font-bold'>{pick.score}/100</span>
                                </div>
                                <div className='detail-cell'>
                                    <span className='detail-label'>Stability:</span>
                                    <span className={`detail-val ${pick.stability.toLowerCase()}`}>{pick.stability}</span>
                                </div>
                                <div className='detail-cell'>
                                    <span className='detail-label'>Signal:</span>
                                    <span className='detail-val signal-badge'>{pick.signalStatus}</span>
                                </div>

                                <div className='pick-action-row'>
                                    <button
                                        type='button'
                                        className='load-market-btn'
                                        onClick={() => engine.selectSymbol(pick.symbol)}
                                    >
                                        ➔ Load Market into Main Analysis
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className='no-pick-placeholder'>
                                <span className='no-pick-icon'>⏸</span>
                                <span className='no-pick-text'>
                                    NO CLEAR SIGNAL — WAIT FOR BETTER CONDITIONS.
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Scanned Markets Table or Quick List */}
            <div className='scanner-rows-container'>
                {markets.length > 0 ? (
                    <div className='scanned-markets-list'>
                        {markets
                            .filter(
                                m =>
                                    m.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    m.displayName.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .map(m => {
                                const isCurrent = m.symbol === selectedSymbol;
                                const isExpanded = expandedSymbol === m.symbol;

                                return (
                                    <div
                                        key={m.symbol}
                                        className={`market-scanner-row ${isCurrent ? 'is-active-market' : ''}`}
                                    >
                                        {/* Compact Main Row */}
                                        <div
                                            className='row-summary'
                                            onClick={() => toggleRow(m.symbol)}
                                        >
                                            <div className='col-symbol'>
                                                <span className='symbol-code'>{m.symbol}</span>
                                                <span className='symbol-name'>{m.displayName}</span>
                                            </div>

                                            <div className='col-price-digit'>
                                                <span className='spot-price'>
                                                    {m.currentPrice.toFixed(m.pipSize)}
                                                </span>
                                                <span
                                                    className={`digit-pill ${
                                                        m.latestDigit <= 4 ? 'is-under' : 'is-over'
                                                    }`}
                                                >
                                                    {m.latestDigit}
                                                </span>
                                            </div>

                                            <div className='col-dist-bars'>
                                                <span className='under-text'>{m.under04Pct.toFixed(0)}% U</span>
                                                <span className='slash'>/</span>
                                                <span className='over-text'>{m.over59Pct.toFixed(0)}% O</span>
                                            </div>

                                            <div className='col-status'>
                                                <span className={`status-micro-pill ${m.signalStatus.includes('MET') ? 'met' : m.signalStatus.includes('FORMING') ? 'forming' : 'wait'}`}>
                                                    {m.signalStatus.includes('MET') ? 'MET' : m.signalStatus.includes('FORMING') ? 'FORMING' : 'WAIT'}
                                                </span>
                                                <button
                                                    type='button'
                                                    className='row-select-btn'
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        engine.selectSymbol(m.symbol);
                                                    }}
                                                    title='Select this market'
                                                >
                                                    {isCurrent ? '✓' : '➔'}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expandable Statistics */}
                                        {isExpanded && (
                                            <div className='row-expanded-stats'>
                                                <div className='stat-chip'>
                                                    <span className='label'>Under 0–4:</span>
                                                    <span className='val under-text'>{m.under04Pct}%</span>
                                                </div>
                                                <div className='stat-chip'>
                                                    <span className='label'>Over 5–9:</span>
                                                    <span className='val over-text'>{m.over59Pct}%</span>
                                                </div>
                                                <div className='stat-chip'>
                                                    <span className='label'>Under 0–5:</span>
                                                    <span className='val under-text'>{m.under05Pct}%</span>
                                                </div>
                                                <div className='stat-chip'>
                                                    <span className='label'>Over 4–9:</span>
                                                    <span className='val over-text'>{m.over49Pct}%</span>
                                                </div>
                                                <div className='stat-chip'>
                                                    <span className='label'>Last 10 Mom:</span>
                                                    <span className='val'>{m.last10Momentum}</span>
                                                </div>
                                                <div className='stat-chip'>
                                                    <span className='label'>Last 7 Confirm:</span>
                                                    <span className='val'>U:{m.last7ConfirmUnder}/7, O:{m.last7ConfirmOver}/7</span>
                                                </div>
                                                <div className='stat-chip'>
                                                    <span className='label'>Strongest Digit:</span>
                                                    <span className='val gold-text'>{m.strongestDigit}</span>
                                                </div>
                                                <div className='stat-chip'>
                                                    <span className='label'>Stability:</span>
                                                    <span className={`val ${m.stability.toLowerCase()}`}>{m.stability}</span>
                                                </div>
                                                <div className='stat-chip'>
                                                    <span className='label'>Signal Status:</span>
                                                    <span className='val'>{m.signalStatus}</span>
                                                </div>
                                                <div className='stat-chip full-width'>
                                                    <button
                                                        type='button'
                                                        className='expand-load-btn'
                                                        onClick={() => engine.selectSymbol(m.symbol)}
                                                    >
                                                        Load {m.displayName}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div className='unscanned-list'>
                        <div className='unscanned-hint'>
                            <span>Click <strong>Scan All Markets</strong> to analyze all {availableSymbols.length} synthetic indices or choose a market from the list below:</span>
                        </div>
                        {filteredAvailable.map(s => (
                            <div
                                key={s.symbol}
                                className={`quick-market-item ${s.symbol === selectedSymbol ? 'is-selected' : ''}`}
                                onClick={() => engine.selectSymbol(s.symbol)}
                            >
                                <span className='q-name'>{s.display_name}</span>
                                <span className='q-code'>{s.symbol}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});
