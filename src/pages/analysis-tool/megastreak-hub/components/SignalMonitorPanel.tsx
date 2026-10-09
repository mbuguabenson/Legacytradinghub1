import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';
import { TSignalStatus } from '../types';

interface SignalMonitorPanelProps {
    engine: MegastreakEngine;
}

export const SignalMonitorPanel: React.FC<SignalMonitorPanelProps> = observer(({ engine }) => {
    const status = engine.signal_status;
    const stopReason = engine.stop_reason;
    const stability = engine.market_stability;
    const confirmCount = engine.fresh_confirmation_count;

    // Helper to get visual theme and icon for the 10 status states
    const getStatusConfig = (s: TSignalStatus) => {
        switch (s) {
            case 'UNDER CONDITIONS MET':
                return {
                    className: 'status-under-met',
                    badgeText: 'SIGNAL ACTIVE',
                    icon: '🚀',
                    accentColor: '#10b981',
                    actionHint: 'Manual Entry: Execute UNDER 6 on Deriv DTrader',
                };
            case 'OVER CONDITIONS MET':
                return {
                    className: 'status-over-met',
                    badgeText: 'SIGNAL ACTIVE',
                    icon: '🚀',
                    accentColor: '#f43f5e',
                    actionHint: 'Manual Entry: Execute OVER 3 on Deriv DTrader',
                };
            case 'UNDER FORMING':
                return {
                    className: 'status-under-forming',
                    badgeText: 'FORMING',
                    icon: '⏳',
                    accentColor: '#06b6d4',
                    actionHint: 'Under bias building — awaiting final confirmation',
                };
            case 'OVER FORMING':
                return {
                    className: 'status-over-forming',
                    badgeText: 'FORMING',
                    icon: '⏳',
                    accentColor: '#a855f7',
                    actionHint: 'Over bias building — awaiting final confirmation',
                };
            case 'STOP — SIGNAL INVALIDATED':
                return {
                    className: 'status-stop-invalidated',
                    badgeText: 'STOPPED',
                    icon: '🛑',
                    accentColor: '#ef4444',
                    actionHint: 'DO NOT ENTER: Prior signal invalidated by deterioration',
                };
            case 'REVERSAL DETECTED':
                return {
                    className: 'status-reversal',
                    badgeText: 'REVERSAL',
                    icon: '⚡',
                    accentColor: '#f97316',
                    actionHint: 'Sudden counter-trend burst detected — stay out',
                };
            case 'MARKET UNSTABLE':
                return {
                    className: 'status-unstable',
                    badgeText: 'UNSTABLE',
                    icon: '🌪',
                    accentColor: '#e11d48',
                    actionHint: 'High alternation chop — wait for smooth trend',
                };
            case 'DATA INSUFFICIENT':
                return {
                    className: 'status-insufficient',
                    badgeText: 'WARMING UP',
                    icon: '📡',
                    accentColor: '#64748b',
                    actionHint: 'Buffering 50 rolling ticks from Deriv API...',
                };
            case 'OBSERVING':
                return {
                    className: 'status-observing',
                    badgeText: 'OBSERVING',
                    icon: '👁',
                    accentColor: '#3b82f6',
                    actionHint: 'Monitoring live synthetic tick streams',
                };
            case 'WAIT — CONDITIONS NOT MET':
            default:
                return {
                    className: 'status-wait',
                    badgeText: 'WAIT',
                    icon: '⏸',
                    accentColor: '#71717a',
                    actionHint: 'Neither Under nor Over meets required threshold',
                };
        }
    };

    const cfg = getStatusConfig(status);

    return (
        <div className={`megastreak-signal-monitor-panel ${cfg.className}`}>
            <div className='monitor-top-row'>
                <div className='monitor-status-badge'>
                    <span className='status-icon'>{cfg.icon}</span>
                    <span className='status-badge-text'>{cfg.badgeText}</span>
                </div>

                <div className='stability-meter'>
                    <span className='meter-label'>STABILITY</span>
                    <span className={`stability-val ${stability.toLowerCase()}`}>
                        {stability}
                    </span>
                </div>
            </div>

            {/* Prominent Signal Status Display */}
            <div className='monitor-main-status'>
                <h3 className='status-heading'>{status}</h3>
                {stopReason && <p className='status-reason'>{stopReason}</p>}
            </div>

            {/* Action Guidance & Stop Confirmation */}
            <div className='monitor-action-box'>
                <div className='action-hint-text'>
                    {cfg.actionHint}
                </div>

                {confirmCount > 0 && confirmCount < 3 && (
                    <div className='fresh-confirm-bar'>
                        <span>Fresh confirmation required: {confirmCount}/3 ticks</span>
                        <div className='confirm-track'>
                            <div
                                className='confirm-fill'
                                style={{ width: `${(confirmCount / 3) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className='monitor-disclaimer-note'>
                Analysis stop signal only — does not execute, modify, or purchase any Deriv contract.
            </div>
        </div>
    );
});
