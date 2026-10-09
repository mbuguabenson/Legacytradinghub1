import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface StatisticalDistributionProps {
    engine: MegastreakEngine;
}

export const StatisticalDistribution: React.FC<StatisticalDistributionProps> = observer(({ engine }) => {
    const primary = engine.primary_distribution;
    const contract = engine.contract_analysis;
    const s25 = engine.rolling_stats_25;
    const s10 = engine.rolling_stats_10;
    const s7 = engine.rolling_stats_7;
    const mom = engine.momentum_analysis;

    return (
        <div className='megastreak-distribution-container'>
            {/* Card A: Primary Distribution (0-4 vs 5-9) */}
            <div className='megastreak-card primary-dist-card'>
                <div className='card-header'>
                    <div className='card-title-group'>
                        <span className='card-badge primary-badge'>CARD A</span>
                        <h4 className='card-title'>Primary Distribution</h4>
                    </div>
                    <span className='window-tag'>50 Ticks</span>
                </div>

                <div className='dist-metrics-grid'>
                    {/* Under 0-4 */}
                    <div className='metric-box under-box'>
                        <div className='metric-top'>
                            <span className='metric-name'>Under 0–4</span>
                            <span className='metric-count'>{primary.under04Count} / {primary.total}</span>
                        </div>
                        <div className='metric-val-row'>
                            <span className='metric-pct under-text'>{primary.under04Pct.toFixed(1)}%</span>
                            {primary.under04Pct >= 55 && <span className='hot-pill under-pill'>HOT</span>}
                        </div>
                        <div className='progress-track'>
                            <div
                                className='progress-bar under-bar'
                                style={{ width: `${Math.min(100, primary.under04Pct)}%` }}
                            />
                        </div>
                    </div>

                    {/* Over 5-9 */}
                    <div className='metric-box over-box'>
                        <div className='metric-top'>
                            <span className='metric-name'>Over 5–9</span>
                            <span className='metric-count'>{primary.over59Count} / {primary.total}</span>
                        </div>
                        <div className='metric-val-row'>
                            <span className='metric-pct over-text'>{primary.over59Pct.toFixed(1)}%</span>
                            {primary.over59Pct >= 55 && <span className='hot-pill over-pill'>HOT</span>}
                        </div>
                        <div className='progress-track'>
                            <div
                                className='progress-bar over-bar'
                                style={{ width: `${Math.min(100, primary.over59Pct)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Card B: Contract Analysis (0-5 vs 4-9) */}
            <div className='megastreak-card contract-dist-card'>
                <div className='card-header'>
                    <div className='card-title-group'>
                        <span className='card-badge contract-badge'>CARD B</span>
                        <h4 className='card-title'>Contract Analysis</h4>
                    </div>
                    <span className='overlap-tag' title='Groups overlap at digit 4 and 5'>
                        Independent Overlap
                    </span>
                </div>

                <div className='dist-metrics-grid'>
                    {/* Under 0-5 */}
                    <div className='metric-box under-box'>
                        <div className='metric-top'>
                            <span className='metric-name'>Under 0–5 (Under 6)</span>
                            <span className='metric-count'>{contract.under05Count} / {contract.total}</span>
                        </div>
                        <div className='metric-val-row'>
                            <span className='metric-pct under-text'>{contract.under05Pct.toFixed(1)}%</span>
                            {contract.under05Pct >= 60 && <span className='hot-pill under-pill'>DOMINANT</span>}
                        </div>
                        <div className='progress-track'>
                            <div
                                className='progress-bar under-bar'
                                style={{ width: `${Math.min(100, contract.under05Pct)}%` }}
                            />
                        </div>
                    </div>

                    {/* Over 4-9 */}
                    <div className='metric-box over-box'>
                        <div className='metric-top'>
                            <span className='metric-name'>Over 4–9 (Over 3)</span>
                            <span className='metric-count'>{contract.over49Count} / {contract.total}</span>
                        </div>
                        <div className='metric-val-row'>
                            <span className='metric-pct over-text'>{contract.over49Pct.toFixed(1)}%</span>
                            {contract.over49Pct >= 60 && <span className='hot-pill over-pill'>DOMINANT</span>}
                        </div>
                        <div className='progress-track'>
                            <div
                                className='progress-bar over-bar'
                                style={{ width: `${Math.min(100, contract.over49Pct)}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className='overlap-note'>
                    <span>Overlap at digit 4: Each contract evaluated independently</span>
                </div>
            </div>

            {/* Rolling Windows Mini-Card (25, 10, 7 Ticks) */}
            <div className='megastreak-card rolling-stats-card'>
                <div className='card-header'>
                    <h4 className='card-title'>Rolling Windows (25 / 10 / 7 Ticks)</h4>
                    <div className='mom-badges'>
                        <span className={`mom-tag ${mom.under === 'STRENGTHENING' ? 'hot' : ''}`}>
                            U-Mom: {mom.under}
                        </span>
                        <span className={`mom-tag ${mom.over === 'STRENGTHENING' ? 'hot' : ''}`}>
                            O-Mom: {mom.over}
                        </span>
                    </div>
                </div>

                <div className='rolling-rows-container'>
                    {/* 25 Ticks */}
                    <div className='rolling-row'>
                        <div className='rolling-meta'>
                            <span className='rolling-window-title'>Last 25 Ticks</span>
                            <span className='rolling-dominant'>{s25.dominantDirection}</span>
                        </div>
                        <div className='rolling-bar-container'>
                            <div className='rolling-split-bar'>
                                <div
                                    className='split-fill under'
                                    style={{ width: `${s25.under04Pct}%` }}
                                    title={`Under 0-4: ${s25.under04Pct.toFixed(0)}%`}
                                />
                                <div
                                    className='split-fill over'
                                    style={{ width: `${s25.over59Pct}%` }}
                                    title={`Over 5-9: ${s25.over59Pct.toFixed(0)}%`}
                                />
                            </div>
                            <div className='rolling-labels'>
                                <span className='under-text'>{s25.under04Pct.toFixed(0)}% U</span>
                                <span className='over-text'>{s25.over59Pct.toFixed(0)}% O</span>
                            </div>
                        </div>
                    </div>

                    {/* 10 Ticks */}
                    <div className='rolling-row'>
                        <div className='rolling-meta'>
                            <span className='rolling-window-title'>Last 10 Ticks</span>
                            <span className='rolling-dominant'>{s10.dominantDirection}</span>
                        </div>
                        <div className='rolling-bar-container'>
                            <div className='rolling-split-bar'>
                                <div
                                    className='split-fill under'
                                    style={{ width: `${s10.under04Pct}%` }}
                                    title={`Under 0-4: ${s10.under04Pct.toFixed(0)}%`}
                                />
                                <div
                                    className='split-fill over'
                                    style={{ width: `${s10.over59Pct}%` }}
                                    title={`Over 5-9: ${s10.over59Pct.toFixed(0)}%`}
                                />
                            </div>
                            <div className='rolling-labels'>
                                <span className='under-text'>{s10.under05Count}/10 Under 6</span>
                                <span className='over-text'>{s10.over49Count}/10 Over 3</span>
                            </div>
                        </div>
                    </div>

                    {/* 7 Ticks */}
                    <div className='rolling-row highlight-7'>
                        <div className='rolling-meta'>
                            <span className='rolling-window-title'>Last 7 Confirmation</span>
                            <span className='rolling-dominant'>{s7.dominantDirection}</span>
                        </div>
                        <div className='rolling-bar-container'>
                            <div className='rolling-split-bar'>
                                <div
                                    className='split-fill under'
                                    style={{ width: `${(s7.under05Count / 7) * 100}%` }}
                                    title={`Under 0-5: ${s7.under05Count}/7`}
                                />
                                <div
                                    className='split-fill over'
                                    style={{ width: `${(s7.over49Count / 7) * 100}%` }}
                                    title={`Over 4-9: ${s7.over49Count}/7`}
                                />
                            </div>
                            <div className='rolling-labels'>
                                <span className='under-text'>{s7.under05Count}/7 Under (0–5)</span>
                                <span className='over-text'>{s7.over49Count}/7 Over (4–9)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
