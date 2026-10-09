import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface SimpleStatsCardProps {
    engine: MegastreakEngine;
}

export const SimpleStatsCard: React.FC<SimpleStatsCardProps> = observer(({ engine }) => {
    const primary = engine.primary_distribution;
    const contract = engine.contract_analysis;
    const totalTicks = engine.ticks.length;
    const stability = engine.market_stability;
    const last10 = engine.rolling_stats_10;

    const u04Pct = Math.round(primary.under04Pct);
    const o59Pct = Math.round(primary.over59Pct);
    const u05Pct = Math.round(contract.under05Pct);
    const o49Pct = Math.round(contract.over49Pct);

    return (
        <div className='megastreak-minimal-stats-strip'>
            <div className='stats-strip-header'>
                <div className='header-left'>
                    <span className='stats-icon'>📊</span>
                    <span className='stats-heading'>Digit Momentum &amp; Distribution</span>
                    <span className='ticks-badge'>({totalTicks}/50 Ticks)</span>
                </div>

                <div className='header-right'>
                    <div className='momentum-pill'>
                        <span className='pill-label'>Last 10 Momentum:</span>
                        <strong className='pill-value'>
                            {last10.dominantDirection === 'UNDER'
                                ? `Low Digits (${last10.under04Count}/10)`
                                : last10.dominantDirection === 'OVER'
                                ? `High Digits (${last10.over59Count}/10)`
                                : 'Balanced (5/5)'}
                        </strong>
                    </div>

                    <div className={`stability-badge ${stability.toLowerCase()}`}>
                        {stability === 'STABLE' && '🛡️ Stable Flow'}
                        {stability === 'MODERATE' && '⚡ Moderate'}
                        {stability === 'UNSTABLE' && '⚠️ Choppy'}
                    </div>
                </div>
            </div>

            <div className='stats-progress-grid'>
                {/* 1. Low Digits [0-4] vs High Digits [5-9] */}
                <div className='stat-bar-card'>
                    <div className='bar-labels'>
                        <span className='label-under'>
                            Low Digits [0 – 4]: <strong>{u04Pct}%</strong> ({primary.under04Count})
                        </span>
                        <span className='label-over'>
                            High Digits [5 – 9]: <strong>{o59Pct}%</strong> ({primary.over59Count})
                        </span>
                    </div>
                    <div className='bar-track'>
                        <div
                            className='bar-fill fill-under'
                            style={{ width: `${u04Pct}%` }}
                            title={`Under 0-4: ${u04Pct}%`}
                        />
                        <div
                            className='bar-fill fill-over'
                            style={{ width: `${o59Pct}%` }}
                            title={`Over 5-9: ${o59Pct}%`}
                        />
                    </div>
                </div>

                {/* 2. Target Under 6 [0-5] vs Target Over 3 [4-9] */}
                <div className='stat-bar-card'>
                    <div className='bar-labels'>
                        <span className='label-under'>
                            Under 6 Target [0 – 5]: <strong>{u05Pct}%</strong> ({contract.under05Count})
                        </span>
                        <span className='label-over'>
                            Over 3 Target [4 – 9]: <strong>{o49Pct}%</strong> ({contract.over49Count})
                        </span>
                    </div>
                    <div className='bar-track'>
                        <div
                            className='bar-fill fill-under-6'
                            style={{ width: `${Math.min(100, (u05Pct / (u05Pct + o49Pct || 1)) * 100)}%` }}
                            title={`Under 0-5: ${u05Pct}%`}
                        />
                        <div
                            className='bar-fill fill-over-3'
                            style={{ width: `${Math.min(100, (o49Pct / (u05Pct + o49Pct || 1)) * 100)}%` }}
                            title={`Over 4-9: ${o49Pct}%`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});
