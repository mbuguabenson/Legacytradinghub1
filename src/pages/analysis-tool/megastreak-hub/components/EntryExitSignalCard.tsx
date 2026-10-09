import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface EntryExitSignalCardProps {
    engine: MegastreakEngine;
}

export const EntryExitSignalCard: React.FC<EntryExitSignalCardProps> = observer(({ engine }) => {
    const status = engine.signal_status;
    const isUnderMet = status === 'UNDER CONDITIONS MET';
    const isOverMet = status === 'OVER CONDITIONS MET';
    const isForming = status === 'UNDER FORMING' || status === 'OVER FORMING';
    const isStop =
        status === 'STOP — SIGNAL INVALIDATED' ||
        status === 'REVERSAL DETECTED' ||
        status === 'MARKET UNSTABLE';
    const marketName = engine.display_name;

    return (
        <div className='megastreak-entry-exit-card'>
            {/* 1. ENTRY SIGNAL SECTION */}
            <div className={`signal-section entry-section ${isUnderMet ? 'state-under' : isOverMet ? 'state-over' : isForming ? 'state-forming' : 'state-idle'}`}>
                <div className='section-header'>
                    <span className='section-title-badge'>
                        {isUnderMet && '🟢 ENTRY SIGNAL: BUY UNDER 6'}
                        {isOverMet && '🟣 ENTRY SIGNAL: BUY OVER 3'}
                        {isForming && '⏳ SETUP FORMING — STAND BY'}
                        {!isUnderMet && !isOverMet && !isForming && '⚪ ENTRY STATUS: STAND BY'}
                    </span>
                    <span className='section-market-pill'>{marketName}</span>
                </div>

                <div className='entry-instructions-box'>
                    {isUnderMet && (
                        <div className='instruction-content'>
                            <div className='main-action-callout under'>
                                <span className='callout-verb'>BUY UNDER 6</span>
                                <span className='callout-sub'>60% Base Win Rate • Low Digits Dominating</span>
                            </div>
                            <div className='dtrader-guide-grid'>
                                <div className='guide-item'>
                                    <span className='guide-label'>Contract Type</span>
                                    <span className='guide-val'>Under / Over</span>
                                </div>
                                <div className='guide-item'>
                                    <span className='guide-label'>Prediction</span>
                                    <span className='guide-val under-val'>6</span>
                                </div>
                                <div className='guide-item'>
                                    <span className='guide-label'>Duration</span>
                                    <span className='guide-val'>1 - 5 Ticks</span>
                                </div>
                                <div className='guide-item'>
                                    <span className='guide-label'>Winning Digits</span>
                                    <span className='guide-val win-digits'>0, 1, 2, 3, 4, 5</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {isOverMet && (
                        <div className='instruction-content'>
                            <div className='main-action-callout over'>
                                <span className='callout-verb'>BUY OVER 3</span>
                                <span className='callout-sub'>60% Base Win Rate • High Digits Dominating</span>
                            </div>
                            <div className='dtrader-guide-grid'>
                                <div className='guide-item'>
                                    <span className='guide-label'>Contract Type</span>
                                    <span className='guide-val'>Under / Over</span>
                                </div>
                                <div className='guide-item'>
                                    <span className='guide-label'>Prediction</span>
                                    <span className='guide-val over-val'>3</span>
                                </div>
                                <div className='guide-item'>
                                    <span className='guide-label'>Duration</span>
                                    <span className='guide-val'>1 - 5 Ticks</span>
                                </div>
                                <div className='guide-item'>
                                    <span className='guide-label'>Winning Digits</span>
                                    <span className='guide-val win-digits'>4, 5, 6, 7, 8, 9</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {isForming && (
                        <div className='instruction-content standby'>
                            <p className='standby-text'>
                                ⚡ Setup is currently forming on <strong>{marketName}</strong>. Keep DTrader open and watch for the final green confirmation.
                            </p>
                        </div>
                    )}

                    {!isUnderMet && !isOverMet && !isForming && (
                        <div className='instruction-content standby'>
                            <p className='standby-text'>
                                🔍 No active entry on this market. Digits are currently balanced. Check <strong>Best Market</strong> above for a ready setup.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. EXIT & STOP SIGNAL SECTION */}
            <div className={`signal-section exit-section ${isStop ? 'state-stop-alert' : isUnderMet || isOverMet ? 'state-safe' : 'state-neutral'}`}>
                <div className='section-header'>
                    <span className='section-title-badge'>
                        {isStop && '🛑 EXIT / STOP SIGNAL: DO NOT TRADE'}
                        {(isUnderMet || isOverMet) && '✅ EXIT MONITOR: SAFE & HEALTHY'}
                        {!isStop && !isUnderMet && !isOverMet && '🛡️ EXIT MONITOR: IDLE'}
                    </span>
                </div>

                <div className='exit-content-box'>
                    {isStop ? (
                        <div className='stop-alert-content'>
                            <div className='stop-icon-pulse'>🛑</div>
                            <div className='stop-text-cluster'>
                                <span className='stop-headline'>TREND BROKEN / REVERSAL DETECTED</span>
                                <span className='stop-explanation'>{engine.stop_reason || 'Conditions deteriorated. Do not enter any new trades.'}</span>
                            </div>
                        </div>
                    ) : (isUnderMet || isOverMet) ? (
                        <div className='safe-content'>
                            <span className='safe-icon'>✨</span>
                            <span className='safe-text'>Current trend is strong and consistent. Safe to take signals.</span>
                        </div>
                    ) : (
                        <div className='idle-content'>
                            <span className='idle-text'>Exit guard will activate once an active entry signal is triggered.</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
