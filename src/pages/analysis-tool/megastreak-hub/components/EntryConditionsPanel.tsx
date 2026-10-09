import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface EntryConditionsPanelProps {
    engine: MegastreakEngine;
}

export const EntryConditionsPanel: React.FC<EntryConditionsPanelProps> = observer(({ engine }) => {
    const selectedTab = engine.selected_direction_tab;
    const config = engine.config;
    const [showConfigModal, setShowConfigModal] = useState(false);

    const conditions =
        selectedTab === 'UNDER 6' ? engine.under_conditions_check : engine.over_conditions_check;

    const intel = engine.entry_digit_intelligence;
    const passedCount = conditions.filter(c => c.passed).length;
    const allPassed = passedCount === conditions.length;

    return (
        <div className='megastreak-entry-panel'>
            {/* Top Selector & Config Trigger */}
            <div className='entry-panel-header'>
                <div className='direction-toggle-group'>
                    <button
                        type='button'
                        className={`direction-toggle-btn ${selectedTab === 'UNDER 6' ? 'active-under' : ''}`}
                        onClick={() => engine.setDirectionTab('UNDER 6')}
                    >
                        <span className='btn-indicator' />
                        UNDER 6 (Digits 0–5)
                    </button>
                    <button
                        type='button'
                        className={`direction-toggle-btn ${selectedTab === 'OVER 3' ? 'active-over' : ''}`}
                        onClick={() => engine.setDirectionTab('OVER 3')}
                    >
                        <span className='btn-indicator' />
                        OVER 3 (Digits 4–9)
                    </button>
                </div>

                <button
                    type='button'
                    className='config-gear-btn'
                    title='Configure Signal Thresholds'
                    onClick={() => setShowConfigModal(!showConfigModal)}
                >
                    ⚙ Thresholds
                </button>
            </div>

            {/* Config Popover */}
            {showConfigModal && (
                <div className='thresholds-config-box'>
                    <div className='config-box-header'>
                        <span>Signal Threshold Settings</span>
                        <button type='button' className='config-close-btn' onClick={() => setShowConfigModal(false)}>
                            ×
                        </button>
                    </div>
                    <div className='config-inputs-grid'>
                        <label className='config-field'>
                            <span>Under Threshold %</span>
                            <input
                                type='number'
                                min={50}
                                max={80}
                                value={config.underThresholdPct}
                                onChange={e => engine.updateConfig({ underThresholdPct: Number(e.target.value) })}
                            />
                        </label>
                        <label className='config-field'>
                            <span>Over Threshold %</span>
                            <input
                                type='number'
                                min={50}
                                max={80}
                                value={config.overThresholdPct}
                                onChange={e => engine.updateConfig({ overThresholdPct: Number(e.target.value) })}
                            />
                        </label>
                        <label className='config-field'>
                            <span>Last 7 Min Confirm</span>
                            <input
                                type='number'
                                min={4}
                                max={7}
                                value={config.last7ConfirmMin}
                                onChange={e => engine.updateConfig({ last7ConfirmMin: Number(e.target.value) })}
                            />
                        </label>
                        <label className='config-field'>
                            <span>Last 10 Min Favoured</span>
                            <input
                                type='number'
                                min={5}
                                max={9}
                                value={config.last10FavouredMin}
                                onChange={e => engine.updateConfig({ last10FavouredMin: Number(e.target.value) })}
                            />
                        </label>
                    </div>
                </div>
            )}

            {/* Section 7: Entry Digit Intelligence Card */}
            <div className={`entry-intel-card ${selectedTab === 'UNDER 6' ? 'under-glow' : 'over-glow'}`}>
                <div className='intel-top-row'>
                    <div className='intel-left'>
                        <span className='intel-sublabel'>ENTRY CANDIDATE INTELLIGENCE</span>
                        <div className='intel-preferred-row'>
                            <span className='preferred-badge'>
                                {intel.preferredDirection}
                            </span>
                            <span className={`intel-mom-pill ${intel.momentumRating.toLowerCase()}`}>
                                {intel.momentumRating} MOMENTUM
                            </span>
                        </div>
                    </div>

                    <div className='intel-right-digit'>
                        <span className='candidate-digit-label'>TOP CANDIDATE</span>
                        <div className='candidate-digit-circle'>
                            {intel.strongestDigit}
                        </div>
                    </div>
                </div>

                <div className='intel-breakdown-grid'>
                    <div className='intel-stat-cell'>
                        <span className='stat-cell-title'>Weighted Score</span>
                        <span className='stat-cell-value'>{intel.strongestScore} pts</span>
                    </div>
                    <div className='intel-stat-cell'>
                        <span className='stat-cell-title'>50-Tick Freq</span>
                        <span className='stat-cell-value'>{intel.recentFreq50}%</span>
                    </div>
                    <div className='intel-stat-cell'>
                        <span className='stat-cell-title'>10-Tick Freq</span>
                        <span className='stat-cell-value'>{intel.recentFreq10}%</span>
                    </div>
                    <div className='intel-stat-cell'>
                        <span className='stat-cell-title'>7-Tick Freq</span>
                        <span className='stat-cell-value'>{intel.recentFreq7}%</span>
                    </div>
                </div>

                <div className='intel-disclaimer'>
                    Observed entry candidate via recency weighting — not a prediction of the next tick.
                </div>
            </div>

            {/* Section 6: Entry Conditions Checklist */}
            <div className='conditions-checklist-container'>
                <div className='checklist-header'>
                    <span className='checklist-title'>
                        {selectedTab} Entry Checklist ({passedCount}/{conditions.length} Met)
                    </span>
                    <span className={`status-pill ${allPassed ? 'all-met' : 'forming'}`}>
                        {allPassed ? 'ALL CONDITIONS MET' : `${passedCount} MET`}
                    </span>
                </div>

                <div className='checklist-items'>
                    {conditions.map(c => (
                        <div
                            key={c.id}
                            className={`condition-item-row ${c.passed ? 'is-passed' : 'is-failed'}`}
                        >
                            <div className='check-icon-circle'>
                                {c.passed ? '✓' : '✗'}
                            </div>
                            <div className='condition-text-group'>
                                <span className='condition-name'>{c.label}</span>
                                <span className='condition-desc'>{c.description}</span>
                            </div>
                            <div className='condition-values'>
                                <span className={`current-tag ${c.passed ? 'passed-val' : 'failed-val'}`}>
                                    {c.currentValue}
                                </span>
                                <span className='target-tag'>{c.targetValue}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {intel.missingConditions.length > 0 && (
                    <div className='missing-conditions-alert'>
                        <span className='alert-icon'>⚠</span>
                        <span className='alert-msg'>
                            Missing: {intel.missingConditions.join(', ')}
                        </span>
                    </div>
                )}

                <div className='manual-warning-banner'>
                    <span>
                        Manual execution in Deriv DTrader only. Megastreak Hub does not place or guarantee trades.
                    </span>
                </div>
            </div>
        </div>
    );
});
