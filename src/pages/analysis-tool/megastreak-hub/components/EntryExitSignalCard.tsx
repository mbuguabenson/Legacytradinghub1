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
        <div className='megastreak-hero-signals-card'>
            {/* 1. Primary Entry Banner */}
            <div className={`entry-verdict-box ${isUnderMet ? 'state-under' : isOverMet ? 'state-over' : isForming ? 'state-forming' : 'state-idle'}`}>
                <div className='verdict-top-bar'>
                    <div className='verdict-status-badge'>
                        <span className='verdict-dot' />
                        <span className='verdict-title'>
                            {isUnderMet && 'ENTRY SIGNAL: BUY "UNDER 6" NOW'}
                            {isOverMet && 'ENTRY SIGNAL: BUY "OVER 3" NOW'}
                            {isForming && 'SETUP FORMING — PREPARE DTRADER'}
                            {!isUnderMet && !isOverMet && !isForming && 'ENTRY STATUS: STAND BY (WAITING FOR SETUP)'}
                        </span>
                    </div>

                    <div className='verdict-market-pill'>
                        <span className='market-label'>Market:</span>
                        <strong className='market-val'>{marketName}</strong>
                    </div>
                </div>

                <div className='verdict-body'>
                    {isUnderMet && (
                        <div className='action-plan-grid'>
                            <div className='plan-item highlight-under'>
                                <span className='plan-label'>Trade Action</span>
                                <span className='plan-val'>BUY UNDER 6</span>
                                <span className='plan-sub'>60% Baseline Edge</span>
                            </div>

                            <div className='plan-item'>
                                <span className='plan-label'>Trade Type</span>
                                <span className='plan-val'>Under / Over</span>
                                <span className='plan-sub'>1 - 5 Ticks</span>
                            </div>

                            <div className='plan-item'>
                                <span className='plan-label'>Prediction</span>
                                <span className='plan-val target-digit'>6</span>
                                <span className='plan-sub'>Exact Target</span>
                            </div>

                            <div className='plan-item'>
                                <span className='plan-label'>Winning Digits</span>
                                <span className='plan-val win-digits'>0, 1, 2, 3, 4, 5</span>
                                <span className='plan-sub'>6 of 10 Digits Win</span>
                            </div>
                        </div>
                    )}

                    {isOverMet && (
                        <div className='action-plan-grid'>
                            <div className='plan-item highlight-over'>
                                <span className='plan-label'>Trade Action</span>
                                <span className='plan-val'>BUY OVER 3</span>
                                <span className='plan-sub'>60% Baseline Edge</span>
                            </div>

                            <div className='plan-item'>
                                <span className='plan-label'>Trade Type</span>
                                <span className='plan-val'>Under / Over</span>
                                <span className='plan-sub'>1 - 5 Ticks</span>
                            </div>

                            <div className='plan-item'>
                                <span className='plan-label'>Prediction</span>
                                <span className='plan-val target-digit'>3</span>
                                <span className='plan-sub'>Exact Target</span>
                            </div>

                            <div className='plan-item'>
                                <span className='plan-label'>Winning Digits</span>
                                <span className='plan-val win-digits'>4, 5, 6, 7, 8, 9</span>
                                <span className='plan-sub'>6 of 10 Digits Win</span>
                            </div>
                        </div>
                    )}

                    {isForming && (
                        <div className='forming-guidance-box'>
                            <span className='forming-icon'>⏳</span>
                            <div className='forming-text'>
                                <strong>Conditions are aligning on {marketName}.</strong>
                                <span>Keep DTrader open and watch the digit circles. When the green signal triggers, place your manual trade.</span>
                            </div>
                        </div>
                    )}

                    {!isUnderMet && !isOverMet && !isForming && (
                        <div className='idle-guidance-box'>
                            <span className='idle-icon'>🔍</span>
                            <div className='idle-text'>
                                <strong>Market digits are balanced.</strong>
                                <span>No clear directional bias on {marketName} right now. Click "Find Best Market" or select another volatility/jump index above.</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Exit & Stop Safety Guard */}
            <div className={`exit-safety-strip ${isStop ? 'alert-stop' : isUnderMet || isOverMet ? 'alert-safe' : 'alert-idle'}`}>
                {isStop ? (
                    <div className='stop-alert-row'>
                        <span className='stop-icon-pulse'>🛑</span>
                        <div className='stop-details'>
                            <strong className='stop-headline'>EXIT / STOP SIGNAL — DO NOT ENTER NEW TRADES</strong>
                            <span className='stop-desc'>{engine.stop_reason || 'Trend reversed or conditions broke. Pause trading on this market.'}</span>
                        </div>
                    </div>
                ) : (isUnderMet || isOverMet) ? (
                    <div className='safe-alert-row'>
                        <span className='safe-icon'>✅</span>
                        <div className='safe-details'>
                            <strong className='safe-headline'>EXIT GUARD: TREND ACTIVE &amp; STABLE</strong>
                            <span className='safe-desc'>Momentum is holding consistent. Safety monitor is active for any sudden reversal.</span>
                        </div>
                    </div>
                ) : (
                    <div className='idle-alert-row'>
                        <span className='idle-icon'>🛡️</span>
                        <div className='idle-details'>
                            <strong className='idle-headline'>EXIT MONITOR: STANDBY</strong>
                            <span className='idle-desc'>Safety guard will monitor live ticks once an active entry signal is triggered.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
