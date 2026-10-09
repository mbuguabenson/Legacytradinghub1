import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface SimpleStatsCardProps {
    engine: MegastreakEngine;
}

export const SimpleStatsCard: React.FC<SimpleStatsCardProps> = observer(({ engine }) => {
    const primary = engine.primary_distribution;
    const contract = engine.contract_analysis;
    const freqs = engine.digit_frequencies;
    const totalTicks = engine.ticks.length;
    const stability = engine.market_stability;
    const last10 = engine.rolling_stats_10;

    // Find hottest (highest frequency) and coldest (lowest frequency) digits
    let hottest = freqs[0];
    let coldest = freqs[0];
    freqs.forEach(f => {
        if (f.percentage > (hottest?.percentage || 0)) hottest = f;
        if (f.percentage < (coldest?.percentage || 100)) coldest = f;
    });

    const u04Pct = Math.round(primary.under04Pct);
    const o59Pct = Math.round(primary.over59Pct);
    const u05Pct = Math.round(contract.under05Pct);
    const o49Pct = Math.round(contract.over49Pct);

    return (
        <div className='megastreak-simple-stats-card'>
            <div className='stats-card-header'>
                <div className='stats-title-group'>
                    <span className='stats-title-icon'>📊</span>
                    <span className='stats-title'>Market Statistics</span>
                    <span className='stats-tick-count'>({totalTicks}/50 Ticks)</span>
                </div>
                <div className={`stability-tag ${stability.toLowerCase()}`}>
                    {stability === 'STABLE' && '🛡️ Stable Flow'}
                    {stability === 'MODERATE' && '⚡ Moderate'}
                    {stability === 'UNSTABLE' && '⚠️ Choppy'}
                </div>
            </div>

            <div className='stats-bars-container'>
                {/* 1. Low vs High (Under 0-4 vs Over 5-9) */}
                <div className='stat-bar-block'>
                    <div className='stat-bar-label-row'>
                        <span className='label-left under-color'>
                            Low Digits [0-4]: <strong>{u04Pct}%</strong> ({primary.under04Count})
                        </span>
                        <span className='label-right over-color'>
                            High Digits [5-9]: <strong>{o59Pct}%</strong> ({primary.over59Count})
                        </span>
                    </div>
                    <div className='split-progress-track'>
                        <div
                            className='progress-fill fill-under'
                            style={{ width: `${u04Pct}%` }}
                            title={`Under 0-4: ${u04Pct}%`}
                        />
                        <div
                            className='progress-fill fill-over'
                            style={{ width: `${o59Pct}%` }}
                            title={`Over 5-9: ${o59Pct}%`}
                        />
                    </div>
                </div>

                {/* 2. Contract Under 0-5 vs Over 4-9 */}
                <div className='stat-bar-block'>
                    <div className='stat-bar-label-row'>
                        <span className='label-left under-color'>
                            Under 6 Target [0-5]: <strong>{u05Pct}%</strong> ({contract.under05Count})
                        </span>
                        <span className='label-right over-color'>
                            Over 3 Target [4-9]: <strong>{o49Pct}%</strong> ({contract.over49Count})
                        </span>
                    </div>
                    <div className='split-progress-track'>
                        <div
                            className='progress-fill fill-under'
                            style={{ width: `${Math.min(100, (u05Pct / (u05Pct + o49Pct || 1)) * 100)}%` }}
                            title={`Under 0-5: ${u05Pct}%`}
                        />
                        <div
                            className='progress-fill fill-over'
                            style={{ width: `${Math.min(100, (o49Pct / (u05Pct + o49Pct || 1)) * 100)}%` }}
                            title={`Over 4-9: ${o49Pct}%`}
                        />
                    </div>
                </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className='stats-quick-grid'>
                <div className='quick-stat-pill hot'>
                    <span className='pill-label'>🔥 Hot Digit</span>
                    <span className='pill-value'>Digit {hottest?.digit ?? '-'}</span>
                    <span className='pill-sub'>({Math.round(hottest?.percentage || 0)}%)</span>
                </div>

                <div className='quick-stat-pill cold'>
                    <span className='pill-label'>❄️ Cold Digit</span>
                    <span className='pill-value'>Digit {coldest?.digit ?? '-'}</span>
                    <span className='pill-sub'>({Math.round(coldest?.percentage || 0)}%)</span>
                </div>

                <div className='quick-stat-pill momentum'>
                    <span className='pill-label'>📈 Last 10 Ticks</span>
                    <span className='pill-value'>
                        {last10.dominantDirection === 'UNDER'
                            ? `Low (${last10.under04Count}/10)`
                            : last10.dominantDirection === 'OVER'
                            ? `High (${last10.over59Count}/10)`
                            : 'Balanced'}
                    </span>
                    <span className='pill-sub'>Momentum</span>
                </div>
            </div>
        </div>
    );
});
