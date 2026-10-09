import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine, DIGIT_COLOR_MAP } from '../megastreak-engine';

interface Last50DigitCirclesProps {
    engine: MegastreakEngine;
}

export const Last50DigitCircles: React.FC<Last50DigitCirclesProps> = observer(({ engine }) => {
    const digits50 = engine.last_50_digits;
    const parity = engine.parity_analysis;
    const streak = engine.streak_analysis;
    const freqs = engine.digit_frequencies;
    const activeHighlight = engine.selected_highlight_digit;
    const viewMode = engine.last50_view_mode;
    const [hoveredTick, setHoveredTick] = useState<number | null>(null);

    // Count summary
    const totalCount = digits50.length;

    return (
        <div className='megastreak-card megastreak-last50-card'>
            {/* Header: Title, Live Status, Mode Toggle */}
            <div className='card-header-row'>
                <div className='header-title-cluster'>
                    <div className='header-icon-badge color-rainbow'>
                        <span className='icon-glyph'>⚡</span>
                    </div>
                    <div className='header-text'>
                        <div className='title-with-pill'>
                            <h2 className='card-title'>Last 50 Digits Real-Time Stream</h2>
                            <span className='live-pulse-pill'>
                                <span className='pulse-dot' />
                                LIVE TICK FEED ({totalCount}/50)
                            </span>
                        </div>
                        <p className='card-subtitle'>
                            Chronological tick tape with distinct chromatic identification for each digit (0–9)
                        </p>
                    </div>
                </div>

                <div className='header-actions-cluster'>
                    {/* View Mode Toggle */}
                    <div className='mode-toggle-pill-group'>
                        <button
                            type='button'
                            className={`mode-btn ${viewMode === 'tape' ? 'active' : ''}`}
                            onClick={() => engine.setLast50ViewMode('tape')}
                            title='Horizontal flowing timeline'
                        >
                            🌊 Tape Stream
                        </button>
                        <button
                            type='button'
                            className={`mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => engine.setLast50ViewMode('grid')}
                            title='Structured matrix grid'
                        >
                            ▦ 50 Matrix
                        </button>
                    </div>

                    {activeHighlight !== null && (
                        <button
                            type='button'
                            className='clear-filter-btn'
                            onClick={() => engine.setHighlightDigit(null)}
                            title='Clear digit spotlight'
                        >
                            Clear Filter (Digit {activeHighlight}) ×
                        </button>
                    )}
                </div>
            </div>

            {/* Interactive Color Legend & Spotlight Bar */}
            <div className='digit-color-legend-bar'>
                <div className='legend-intro'>
                    <span className='legend-label'>DIGIT PALETTE:</span>
                    <span className='legend-hint'>Click any digit to highlight occurrences</span>
                </div>
                <div className='legend-circles-row'>
                    {Object.entries(DIGIT_COLOR_MAP).map(([digitKey, info]) => {
                        const d = Number(digitKey);
                        const count = freqs[d]?.count || 0;
                        const pct = Math.round(freqs[d]?.percentage || 0);
                        const isSelected = activeHighlight === d;

                        return (
                            <button
                                key={d}
                                type='button'
                                className={`legend-digit-pill ${isSelected ? 'selected' : ''}`}
                                style={{
                                    borderColor: isSelected ? info.color : undefined,
                                    backgroundColor: isSelected ? info.bgGlow : undefined,
                                }}
                                onClick={() => engine.setHighlightDigit(d)}
                                title={`Digit ${d}: ${count} occurrences (${pct}%)`}
                            >
                                <span
                                    className='legend-color-dot'
                                    style={{ backgroundColor: info.color, boxShadow: `0 0 8px ${info.color}` }}
                                />
                                <span className='legend-num' style={{ color: info.color }}>
                                    {d}
                                </span>
                                <span className='legend-count'>{count}x</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Streak & Parity Intelligence Ribbon */}
            <div className='stream-metrics-ribbon'>
                <div className='metric-strip-item streak-highlight'>
                    <span className='metric-icon'>🔥</span>
                    <div className='metric-col'>
                        <span className='metric-lbl'>ACTIVE SEQUENCE</span>
                        <strong className='metric-val'>{streak.currentStreakLabel}</strong>
                    </div>
                </div>

                <div className='metric-strip-item'>
                    <span className='metric-icon'>⚖️</span>
                    <div className='metric-col'>
                        <span className='metric-lbl'>PARITY BREAKDOWN</span>
                        <div className='metric-val-split'>
                            <span className='even-tag'>Even: {parity.evenCount} ({parity.evenPct}%)</span>
                            <span className='split-sep'>•</span>
                            <span className='odd-tag'>Odd: {parity.oddCount} ({parity.oddPct}%)</span>
                        </div>
                    </div>
                </div>

                <div className='metric-strip-item'>
                    <span className='metric-icon'>📊</span>
                    <div className='metric-col'>
                        <span className='metric-lbl'>EXTENDED RUN</span>
                        <strong className='metric-val'>
                            {parity.longestParityStreak}x Longest {parity.longestParityType} Run
                        </strong>
                    </div>
                </div>

                <div className='metric-strip-item'>
                    <span className='metric-icon'>🎯</span>
                    <div className='metric-col'>
                        <span className='metric-lbl'>HOTTEST / COLDEST</span>
                        <strong className='metric-val hot-cold-tags'>
                            <span className='hot-text'>Hot: {freqs.find(f => f.isTop)?.digit ?? '-'}</span>
                            <span className='split-sep'>•</span>
                            <span className='cold-text'>
                                Cold: {freqs.slice().sort((a, b) => a.count - b.count)[0]?.digit ?? '-'}
                            </span>
                        </strong>
                    </div>
                </div>
            </div>

            {/* Main Visualizer: Tape Stream or Grid Matrix */}
            <div className={`digits-stream-viewport ${viewMode}`}>
                {digits50.length === 0 ? (
                    <div className='empty-stream-state'>
                        <span className='spinner-ring' />
                        <span>Connecting to live tick stream for {engine.display_name}...</span>
                    </div>
                ) : (
                    <div className='circles-container-inner'>
                        {digits50.map(item => {
                            const isDimmed = activeHighlight !== null && item.digit !== activeHighlight;
                            const isHighlighted = activeHighlight !== null && item.digit === activeHighlight;
                            const isHovered = hoveredTick === item.index;

                            return (
                                <div
                                    key={`${item.index}-${item.epoch}-${item.digit}`}
                                    className={`digit-circle-node ${item.isLatest ? 'is-latest' : ''} ${isDimmed ? 'is-dimmed' : ''} ${isHighlighted ? 'is-highlighted' : ''}`}
                                    onMouseEnter={() => setHoveredTick(item.index)}
                                    onMouseLeave={() => setHoveredTick(null)}
                                    style={{
                                        borderColor: item.borderColor,
                                        boxShadow: isHighlighted || item.isLatest
                                            ? `0 0 16px ${item.color}, inset 0 0 12px ${item.bgGlow}`
                                            : `0 4px 12px rgba(0, 0, 0, 0.4), inset 0 0 8px ${item.bgGlow}`,
                                    }}
                                >
                                    {/* Latest Tick Animated Pulse Beacon */}
                                    {item.isLatest && (
                                        <div className='latest-beacon-ring' style={{ borderColor: item.color }}>
                                            <span className='latest-text-tag'>NEW</span>
                                        </div>
                                    )}

                                    {/* Sequential Index Tag (#1 newest to #50 oldest) */}
                                    <span className='circle-index-tag'>#{item.index}</span>

                                    {/* Prominent Digit in distinct color */}
                                    <span
                                        className='circle-digit-char'
                                        style={{
                                            color: item.color,
                                            textShadow: `0 0 10px ${item.color}`,
                                        }}
                                    >
                                        {item.digit}
                                    </span>

                                    {/* Sub-label: Parity or Under/Over */}
                                    <span className={`circle-sub-badge ${item.isEven ? 'even' : 'odd'}`}>
                                        {item.isEven ? 'E' : 'O'}
                                    </span>

                                    {/* Hover Micro-Tooltip */}
                                    {isHovered && (
                                        <div className='circle-hover-tooltip' style={{ borderColor: item.color }}>
                                            <div className='tooltip-row'>
                                                <span className='tt-label'>Tick:</span>
                                                <strong className='tt-val'>#{item.index} {item.isLatest ? '(Latest)' : ''}</strong>
                                            </div>
                                            <div className='tooltip-row'>
                                                <span className='tt-label'>Digit:</span>
                                                <strong className='tt-val' style={{ color: item.color }}>
                                                    {item.digit} ({item.isEven ? 'Even' : 'Odd'}, {item.isUnder6 ? 'Under 6' : 'Over 3'})
                                                </strong>
                                            </div>
                                            <div className='tooltip-row'>
                                                <span className='tt-label'>Price:</span>
                                                <strong className='tt-val price'>{item.priceFormatted}</strong>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Viewport Footer Indicator */}
            <div className='stream-footer-indicator'>
                <div className='footer-flow-direction'>
                    <span className='arrow-icon'>←</span>
                    <span className='flow-text'>Newest Ticks (Left) to Historical Ticks (Right)</span>
                    <span className='arrow-icon'>→</span>
                </div>
                <div className='footer-total-status'>
                    <span>Showing last <strong>{totalCount}</strong> ticks • Updates with each live quote</span>
                </div>
            </div>
        </div>
    );
});
