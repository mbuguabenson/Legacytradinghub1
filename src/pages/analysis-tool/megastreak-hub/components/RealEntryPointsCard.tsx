import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';
import { TRealEntryPoint } from '../types';

interface RealEntryPointsCardProps {
    engine: MegastreakEngine;
}

export const RealEntryPointsCard: React.FC<RealEntryPointsCardProps> = observer(({ engine }) => {
    const entryPoints = engine.real_entry_points;
    const [selectedPointId, setSelectedPointId] = useState<string>('ep_under_6');

    // Currently selected entry strategy
    const activePoint: TRealEntryPoint =
        entryPoints.find(ep => ep.id === selectedPointId) || entryPoints[0];

    const currentSymbol = engine.display_name;
    const tickDir = engine.tick_direction;

    const conditions =
        activePoint.id === 'ep_over_3'
            ? engine.over_conditions_check
            : engine.under_conditions_check;

    const passedConditionsCount = conditions.filter(c => c.passed).length;
    const totalConditionsCount = conditions.length;

    // Status helpers
    const isEnterNow = activePoint.status === 'ENTER_NOW';
    const isForming = activePoint.status === 'FORMING';
    const isStopped = activePoint.status === 'STOPPED';

    return (
        <div className='megastreak-card megastreak-entry-points-card'>
            {/* Header: Title, Live Status */}
            <div className='card-header-row'>
                <div className='header-title-cluster'>
                    <div className='header-icon-badge color-emerald'>
                        <span className='icon-glyph'>🎯</span>
                    </div>
                    <div className='header-text'>
                        <div className='title-with-pill'>
                            <h2 className='card-title'>Real Entry Points &amp; Trade Signals</h2>
                            <span className={`signal-state-capsule state-${activePoint.status.toLowerCase()}`}>
                                <span className='capsule-dot' />
                                {activePoint.statusLabel}
                            </span>
                        </div>
                        <p className='card-subtitle'>
                            Algorithmic barrier calculations with verified mathematical win-rate probability
                        </p>
                    </div>
                </div>

                <div className='header-market-capsule'>
                    <span className='market-lbl'>ACTIVE MARKET:</span>
                    <strong className='market-name'>{currentSymbol}</strong>
                    <span className={`price-tag ${tickDir}`}>
                        {engine.current_price > 0 ? engine.formatted_price : 'Loading...'}
                        {tickDir === 'up' && ' ▲'}
                        {tickDir === 'down' && ' ▼'}
                    </span>
                </div>
            </div>

            {/* Entry Strategy Switcher Tabs */}
            <div className='entry-strategies-selector-bar'>
                {entryPoints.map(ep => {
                    const isSelected = ep.id === selectedPointId;
                    return (
                        <button
                            key={ep.id}
                            type='button'
                            className={`strategy-pill-btn ${isSelected ? 'active' : ''} ${ep.status.toLowerCase()}`}
                            onClick={() => setSelectedPointId(ep.id)}
                        >
                            <span className={`status-bubble ${ep.status.toLowerCase()}`} />
                            <span className='strategy-name'>{ep.name}</span>
                            {ep.isPrimaryRecommended && <span className='recommended-badge'>TOP PICK</span>}
                            <span className='strategy-winrate'>{ep.estimatedWinRatePct}% Edge</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Action Banner */}
            <div
                className={`entry-hero-banner ${isEnterNow ? 'banner-active' : isForming ? 'banner-forming' : isStopped ? 'banner-stopped' : 'banner-standby'}`}
            >
                <div className='banner-left'>
                    <div className='verdict-action-row'>
                        <span className='action-icon'>
                            {isEnterNow ? '🚀' : isForming ? '⏳' : isStopped ? '🛑' : '🛡️'}
                        </span>
                        <div className='action-text-col'>
                            <span className='action-super'>EXECUTION VERDICT:</span>
                            <h3 className='action-headline'>{activePoint.actionText}</h3>
                        </div>
                    </div>
                    <p className='action-reason-desc'>{activePoint.entryRuleReason}</p>
                </div>

                <div className='banner-right'>
                    <div className='confidence-metric-box'>
                        <span className='conf-label'>CONFIDENCE SCORE</span>
                        <strong className='conf-score-num'>{activePoint.confidenceScore}</strong>
                        <span className='conf-max'>/ 100</span>
                    </div>
                    <div className='edge-metric-box'>
                        <span className='edge-label'>STATISTICAL EDGE</span>
                        <strong className='edge-pct'>
                            {activePoint.edgePct >= 0 ? `+${activePoint.edgePct}%` : `${activePoint.edgePct}%`}
                        </strong>
                        <span className='edge-base'>vs {activePoint.baseWinRatePct}% standard</span>
                    </div>
                </div>
            </div>

            {/* Real Trade Execution Specifications Grid */}
            <div className='trade-specs-grid'>
                <div className='spec-card highlight-card'>
                    <span className='spec-label'>Contract Type</span>
                    <strong className='spec-value'>{activePoint.contractType}</strong>
                    <span className='spec-sub'>Options Under / Over</span>
                </div>

                <div className='spec-card'>
                    <span className='spec-label'>Prediction Barrier</span>
                    <strong className='spec-value target-accent'>{activePoint.barrier}</strong>
                    <span className='spec-sub'>Exact Deriv Barrier</span>
                </div>

                <div className='spec-card'>
                    <span className='spec-label'>Winning Digits</span>
                    <strong className='spec-value digits-accent'>{activePoint.winningDigits.join(', ')}</strong>
                    <span className='spec-sub'>{activePoint.winningDigits.length} of 10 Digits Win</span>
                </div>

                <div className='spec-card'>
                    <span className='spec-label'>Estimated Win Rate</span>
                    <strong className='spec-value winrate-accent'>{activePoint.estimatedWinRatePct}%</strong>
                    <span className='spec-sub'>Dynamic calculated</span>
                </div>

                <div className='spec-card'>
                    <span className='spec-label'>Optimal Duration</span>
                    <strong className='spec-value duration-accent'>{activePoint.recommendedDuration}</strong>
                    <span className='spec-sub'>Fast exit strategy</span>
                </div>

                <div className='spec-card'>
                    <span className='spec-label'>Expected Payout</span>
                    <strong className='spec-value payout-accent'>{activePoint.expectedPayout}</strong>
                    <span className='spec-sub'>Payout multiplier</span>
                </div>
            </div>

            {/* Verification Checklist & Safety Guard Grid */}
            <div className='validation-guard-row'>
                {/* Left: 6-Point Verification Checklist */}
                <div className='validation-checklist-card'>
                    <div className='card-sub-header'>
                        <div className='sub-title-wrap'>
                            <span className='sub-icon'>📋</span>
                            <h4 className='sub-title'>Real Entry Verification Matrix</h4>
                        </div>
                        <span className='passed-ratio-tag'>
                            {passedConditionsCount} / {totalConditionsCount} Verified
                        </span>
                    </div>

                    <div className='conditions-list'>
                        {conditions.map(c => (
                            <div key={c.id} className={`condition-item ${c.passed ? 'passed' : 'failed'}`}>
                                <span className='cond-check-bubble'>{c.passed ? '✓' : '✗'}</span>
                                <div className='cond-text-col'>
                                    <strong className='cond-label'>{c.label}</strong>
                                    <span className='cond-desc'>{c.description}</span>
                                </div>
                                <div className='cond-values-col'>
                                    <span className='cond-val-current'>{c.currentValue}</span>
                                    <span className='cond-val-target'>Req: {c.targetValue}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Safety Exit Guard & Execution Steps */}
                <div className='safety-execution-card'>
                    <div className='card-sub-header'>
                        <div className='sub-title-wrap'>
                            <span className='sub-icon'>🛡️</span>
                            <h4 className='sub-title'>Exit &amp; Stop Safety Monitor</h4>
                        </div>
                        <span className={`guard-status-tag ${isStopped ? 'alert' : 'active'}`}>
                            {isStopped ? 'STOP TRIGGERED' : 'GUARD ARMED'}
                        </span>
                    </div>

                    <div className='safety-notice-box'>
                        <div className='notice-header'>
                            <span className='notice-icon'>{isStopped ? '⚠️' : '🔒'}</span>
                            <strong>Stop-Loss &amp; Invalidation Rule:</strong>
                        </div>
                        <p className='notice-body'>{activePoint.stopLossGuard}</p>
                        {engine.stop_reason && (
                            <div className='live-stop-reason'>
                                <span>Recent Flag:</span> {engine.stop_reason}
                            </div>
                        )}
                    </div>

                    <div className='execution-steps-box'>
                        <div className='steps-header'>
                            <span className='steps-icon'>⚡</span>
                            <strong>DTrader Execution Guide:</strong>
                        </div>
                        <ol className='steps-numbered-list'>
                            <li>
                                Navigate to <strong>DTrader</strong> and select <strong>{currentSymbol}</strong>.
                            </li>
                            <li>
                                Set Trade Type to <strong>Under / Over</strong> with Duration <strong>{activePoint.recommendedDuration}</strong>.
                            </li>
                            <li>
                                Set Prediction barrier to <strong>{activePoint.barrier}</strong>.
                            </li>
                            <li>
                                Enter trade immediately when status displays <strong>ENTER NOW</strong>.
                            </li>
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
});
