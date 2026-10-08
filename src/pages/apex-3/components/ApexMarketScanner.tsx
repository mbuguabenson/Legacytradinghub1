import React, { useState } from 'react';
import { Award, ChevronDown, ChevronUp, Crosshair, Sparkles } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

export const ApexMarketScanner: React.FC = observer(() => {
    const { apex } = useStore();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!apex) return null;

    const {
        ranked_markets,
        best_market,
        selected_symbol,
        switchMarket,
        activateBestMarket,
    } = apex;

    return (
        <div className='apex-card apex-scanner-card'>
            {/* Header with expand/collapse and best market controls */}
            <div className='scanner-header'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Crosshair size={18} color='#38bdf8' />
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                        MARKET SCANNER
                    </span>
                    <span className='apex-badge apex-badge--good' style={{ fontSize: '0.68rem' }}>
                        {ranked_markets.length} SYNTHETICS
                    </span>
                </div>

                <div className='scanner-actions'>
                    {best_market && (
                        <button
                            className='apex-btn apex-btn--sm'
                            style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: '#10b981',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                            }}
                            onClick={activateBestMarket}
                            title='Activate best market'
                        >
                            <Sparkles size={12} />
                            BEST MARKET
                        </button>
                    )}

                    <button
                        className='apex-btn apex-btn--sm'
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        title={isCollapsed ? 'Expand scanner' : 'Collapse scanner'}
                    >
                        {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                        {isCollapsed ? 'EXPAND' : 'COLLAPSE'}
                    </button>
                </div>
            </div>

            {/* Collapsed Mode: Only show strongest market and key statistics */}
            {isCollapsed ? (
                <div
                    style={{
                        padding: '0.85rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: '10px',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                                #1 Strongest Market
                            </span>
                            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                                {best_market?.displayName || 'Scanning...'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className='apex-badge apex-badge--prime'>
                                SCORE {best_market?.apexScore || 0}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px' }}>
                                Stability: {best_market?.stabilityScore || 0}/100
                            </div>
                        </div>
                    </div>

                    {best_market && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '0.5rem',
                                marginTop: '0.75rem',
                                fontSize: '0.75rem',
                            }}
                        >
                            <div>
                                <span style={{ color: '#64748b' }}>Last Digit:</span>{' '}
                                <strong style={{ color: '#38bdf8' }}>{best_market.lastDigit}</strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Direction:</span>{' '}
                                <strong
                                    style={{
                                        color: best_market.dominantSide === 'UNDER' ? '#10b981' : '#f43f5e',
                                    }}
                                >
                                    {best_market.dominantSide}
                                </strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Entry:</span>{' '}
                                <strong style={{ color: '#f59e0b' }}>
                                    {best_market.activeEntryDigit?.digit ?? '-'}
                                </strong>
                            </div>
                            <div>
                                <span style={{ color: '#64748b' }}>Status:</span>{' '}
                                <strong style={{ color: '#10b981' }}>{best_market.signalStatus}</strong>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Expanded Mode: Full Scanner Table */
                <div className='scanner-table-wrap'>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Market</th>
                                <th>Price</th>
                                <th>Digit</th>
                                <th>Direction</th>
                                <th>U 0-4 %</th>
                                <th>O 5-9 %</th>
                                <th>U 0-5 %</th>
                                <th>O 4-9 %</th>
                                <th>Last 10</th>
                                <th>Last 7</th>
                                <th>Entry</th>
                                <th>Score</th>
                                <th>Stability</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ranked_markets.map((m, idx) => {
                                const isSelected = m.symbol === selected_symbol;
                                const isBest = idx === 0;

                                return (
                                    <tr
                                        key={m.symbol}
                                        className={`${isSelected ? 'selected' : ''} ${isBest ? 'best-market-row' : ''}`}
                                        onClick={() => switchMarket(m.symbol)}
                                    >
                                        <td style={{ fontWeight: 700, color: isBest ? '#10b981' : '#64748b' }}>
                                            {isBest ? <Award size={14} color='#10b981' /> : idx + 1}
                                        </td>
                                        <td style={{ fontWeight: 700 }}>
                                            {m.displayName.replace(' Index', '')}
                                            {isSelected && (
                                                <span style={{ fontSize: '0.65rem', color: '#38bdf8', marginLeft: '4px' }}>
                                                    ●
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ fontFamily: 'JetBrains Mono', fontSize: '0.76rem' }}>
                                            {m.currentPrice}
                                        </td>
                                        <td style={{ fontWeight: 900, textAlign: 'center' }}>
                                            <span
                                                style={{
                                                    color: m.lastDigit <= 4 ? '#10b981' : '#f43f5e',
                                                    fontSize: '0.85rem',
                                                }}
                                            >
                                                {m.lastDigit}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className={`apex-badge ${
                                                    m.dominantSide === 'UNDER'
                                                        ? 'apex-badge--under'
                                                        : m.dominantSide === 'OVER'
                                                        ? 'apex-badge--over'
                                                        : 'apex-badge--good'
                                                }`}
                                                style={{ fontSize: '0.68rem', padding: '1px 5px' }}
                                            >
                                                {m.dominantSide}
                                            </span>
                                        </td>
                                        <td style={{ color: '#10b981', fontWeight: 600 }}>{m.under04Pct}%</td>
                                        <td style={{ color: '#f43f5e', fontWeight: 600 }}>{m.over59Pct}%</td>
                                        <td style={{ color: '#34d399' }}>{m.under05Pct}%</td>
                                        <td style={{ color: '#fb7185' }}>{m.over49Pct}%</td>
                                        <td>
                                            {m.last10.underCount}U / {m.last10.overCount}O
                                        </td>
                                        <td>
                                            {m.last7.underCount}U / {m.last7.overCount}O
                                        </td>
                                        <td style={{ fontWeight: 800, color: '#f59e0b', textAlign: 'center' }}>
                                            {m.activeEntryDigit?.digit ?? '-'}
                                        </td>
                                        <td>
                                            <span
                                                className={`apex-badge apex-badge--${
                                                    m.apexScore >= 90
                                                        ? 'prime'
                                                        : m.apexScore >= 80
                                                        ? 'excellent'
                                                        : m.apexScore >= 70
                                                        ? 'good'
                                                        : m.apexScore >= 60
                                                        ? 'watch'
                                                        : 'notrade'
                                                }`}
                                                style={{ fontSize: '0.68rem', padding: '1px 6px' }}
                                            >
                                                {m.apexScore}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.75rem' }}>{m.stabilityScore}/100</td>
                                        <td>
                                            <span
                                                style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 700,
                                                    color:
                                                        m.signalStatus === 'READY'
                                                            ? '#10b981'
                                                            : m.signalStatus === 'FORMING'
                                                            ? '#38bdf8'
                                                            : '#64748b',
                                                }}
                                            >
                                                {m.signalStatus}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
});
