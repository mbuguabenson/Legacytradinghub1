import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface BeginnerActionCardProps {
    engine: MegastreakEngine;
}

export const BeginnerActionCard: React.FC<BeginnerActionCardProps> = observer(({ engine }) => {
    const status = engine.signal_status;
    const symbol = engine.display_name;
    const isUnderMet = status === 'UNDER CONDITIONS MET';
    const isOverMet = status === 'OVER CONDITIONS MET';
    const isForming = status === 'UNDER FORMING' || status === 'OVER FORMING';
    const isStop =
        status === 'STOP — SIGNAL INVALIDATED' ||
        status === 'REVERSAL DETECTED' ||
        status === 'MARKET UNSTABLE';

    return (
        <div className={`megastreak-beginner-card ${isUnderMet ? 'state-under' : isOverMet ? 'state-over' : isStop ? 'state-stop' : isForming ? 'state-forming' : 'state-wait'}`}>
            {/* Header with Quick Guide Trigger */}
            <div className='beginner-card-top'>
                <div className='guide-tag-group'>
                    <span className='guide-badge'>BEGINNER QUICK-ACTION GUIDE</span>
                    <span className='subtitle-text'>What you should do in Deriv DTrader right now</span>
                </div>
                <button
                    type='button'
                    className='open-guide-btn'
                    onClick={() => engine.toggleGuide()}
                >
                    📘 How Does This Work?
                </button>
            </div>

            {/* Verdict Hero Banner */}
            <div className='verdict-hero'>
                <div className='verdict-icon'>
                    {isUnderMet ? '🟢' : isOverMet ? '🟣' : isStop ? '🛑' : isForming ? '⏳' : '⏸'}
                </div>
                <div className='verdict-content'>
                    <div className='verdict-headline'>
                        {isUnderMet && 'READY TO TRADE: BUY "UNDER 6" NOW'}
                        {isOverMet && 'READY TO TRADE: BUY "OVER 3" NOW'}
                        {isForming && 'TREND IS FORMING — PLEASE WAIT'}
                        {isStop && 'STOP TRADING NOW — SIGNAL BROKEN'}
                        {!isUnderMet && !isOverMet && !isForming && !isStop && 'STAND BY — SEARCHING FOR BEST SETUP'}
                    </div>
                    <div className='verdict-explanation'>
                        {isUnderMet && `Market ${symbol} has strong low-digit momentum. 6 out of 10 digits win!`}
                        {isOverMet && `Market ${symbol} has strong high-digit momentum. 6 out of 10 digits win!`}
                        {isForming && 'The rules are building up. Keep DTrader ready, but do NOT click buy yet.'}
                        {isStop && `${engine.stop_reason || 'The trend broke.'} Walk away or pause to protect your balance.`}
                        {!isUnderMet && !isOverMet && !isForming && !isStop && 'Neither Under nor Over is dominating. Wait for a clear green signal.'}
                    </div>
                </div>
            </div>

            {/* Step-by-Step DTrader Blueprint */}
            <div className='dtrader-blueprint-grid'>
                <div className='blueprint-col'>
                    <span className='step-number'>STEP 1</span>
                    <span className='step-label'>Market in DTrader</span>
                    <span className='step-value highlight'>{symbol}</span>
                </div>
                <div className='blueprint-col'>
                    <span className='step-number'>STEP 2</span>
                    <span className='step-label'>Trade Type</span>
                    <span className='step-value'>Under / Over (1 Tick)</span>
                </div>
                <div className='blueprint-col'>
                    <span className='step-number'>STEP 3</span>
                    <span className='step-label'>Your Exact Selection</span>
                    <span className={`step-value ${isOverMet ? 'over-pick' : 'under-pick'}`}>
                        {isOverMet ? 'OVER 3 (Prediction: 3)' : 'UNDER 6 (Prediction: 6)'}
                    </span>
                </div>
            </div>

            {/* Winning Digits Visual Strip */}
            <div className='winning-digits-strip'>
                <div className='strip-header'>
                    <span className='strip-title'>
                        {isOverMet
                            ? 'Winning Digits for OVER 3 (60% Baseline Odds)'
                            : 'Winning Digits for UNDER 6 (60% Baseline Odds)'}
                    </span>
                    <span className='strip-odds'>6 of 10 Digits Win</span>
                </div>

                <div className='digits-pill-row'>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
                        const isWinner = isOverMet ? d >= 4 : d <= 5;
                        const isLatest = engine.latest_digit === d;

                        return (
                            <div
                                key={d}
                                className={`beginner-digit-pill ${isWinner ? 'is-winner' : 'is-loser'} ${isLatest ? 'is-latest' : ''}`}
                            >
                                <span className='digit-num'>{d}</span>
                                <span className='digit-outcome'>
                                    {isWinner ? 'WIN' : 'LOSE'}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Beginner Golden Rule Banner */}
            <div className='golden-rule-banner'>
                <span className='rule-icon'>💡</span>
                <span className='rule-text'>
                    <strong>Beginner Rule:</strong> Only place 1 or 2 manual trades per signal in DTrader. If the signal changes to STOP, halt immediately. Never chase losses.
                </span>
            </div>
        </div>
    );
});
