import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface BeginnerGuideModalProps {
    engine: MegastreakEngine;
}

export const BeginnerGuideModal: React.FC<BeginnerGuideModalProps> = observer(({ engine }) => {
    if (!engine.is_guide_open) return null;

    return (
        <div className='megastreak-guide-backdrop' onClick={() => engine.toggleGuide()}>
            <div
                className='megastreak-guide-modal'
                onClick={e => e.stopPropagation()}
                role='dialog'
                aria-modal='true'
            >
                <div className='guide-modal-header'>
                    <div className='title-group'>
                        <span className='guide-icon'>📘</span>
                        <h3>Megastreak Hub — Beginner Trading Guide</h3>
                    </div>
                    <button
                        type='button'
                        className='close-btn'
                        onClick={() => engine.toggleGuide()}
                        aria-label='Close guide'
                    >
                        ×
                    </button>
                </div>

                <div className='guide-modal-body'>
                    {/* Section 1: The Core Strategy in Simple Terms */}
                    <div className='guide-section'>
                        <h4>1. What is Megastreak Hub?</h4>
                        <p>
                            Megastreak Hub is your <strong>live assistant</strong> for Deriv Synthetic Indices.
                            Instead of guessing random digits, it analyzes the last 50 ticks to detect when the market
                            is heavily favoring either <strong>lower digits (Under 6)</strong> or <strong>higher digits (Over 3)</strong>.
                        </p>
                    </div>

                    {/* Section 2: Why Under 6 & Over 3? */}
                    <div className='guide-section'>
                        <h4>2. Why Only Under 6 & Over 3?</h4>
                        <div className='cards-compare-row'>
                            <div className='compare-box under'>
                                <h5>UNDER 6</h5>
                                <p><strong>Winning Digits:</strong> 0, 1, 2, 3, 4, 5</p>
                                <p><strong>Losing Digits:</strong> 6, 7, 8, 9</p>
                                <span className='prob-badge'>60% Base Probability</span>
                            </div>
                            <div className='compare-box over'>
                                <h5>OVER 3</h5>
                                <p><strong>Winning Digits:</strong> 4, 5, 6, 7, 8, 9</p>
                                <p><strong>Losing Digits:</strong> 0, 1, 2, 3</p>
                                <span className='prob-badge'>60% Base Probability</span>
                            </div>
                        </div>
                        <p className='section-subtext'>
                            Normal digit trading has only a 10% win rate. By using Under 6 or Over 3, you start with
                            a 60% probability. When Megastreak confirms momentum, the probability is further boosted!
                        </p>
                    </div>

                    {/* Section 3: The 3 Signals to Follow */}
                    <div className='guide-section'>
                        <h4>3. The 3 Signal Lights You Must Follow</h4>
                        <div className='signals-guide-grid'>
                            <div className='signal-card green'>
                                <span className='icon'>🟢</span>
                                <h6>CONDITIONS MET (BUY)</h6>
                                <p>All 6 market checks passed. Open DTrader and execute 1 manual trade as instructed.</p>
                            </div>
                            <div className='signal-card yellow'>
                                <span className='icon'>⏳</span>
                                <h6>FORMING (WAIT)</h6>
                                <p>Trend is building up but not ready. Do not enter trades yet.</p>
                            </div>
                            <div className='signal-card red'>
                                <span className='icon'>🛑</span>
                                <h6>STOP / REVERSAL (HALT)</h6>
                                <p>The streak just broke or opposite digits attacked. Stop trading immediately!</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Exactly How to Trade in DTrader */}
                    <div className='guide-section'>
                        <h4>4. How to Execute in Deriv DTrader</h4>
                        <ol className='steps-list'>
                            <li>Open Deriv DTrader in another tab or window.</li>
                            <li>Select the market currently highlighted in Megastreak (e.g. <em>Volatility 100</em>).</li>
                            <li>Change the trade type from <em>Rise/Fall</em> to <strong>Digits &gt; Over/Under</strong>.</li>
                            <li>If signal says <strong>UNDER 6</strong>: Pick <em>Under</em>, Prediction <em>6</em>, Duration <em>1 Tick</em>.</li>
                            <li>If signal says <strong>OVER 3</strong>: Pick <em>Over</em>, Prediction <em>3</em>, Duration <em>1 Tick</em>.</li>
                            <li>Check your outcome and wait for the next green signal.</li>
                        </ol>
                    </div>

                    {/* Section 5: Golden Money Management Rule */}
                    <div className='guide-section golden-box'>
                        <h4>🛡 Golden Rules for Beginners</h4>
                        <ul>
                            <li><strong>Never use Martingale</strong> (doubling stake after a loss).</li>
                            <li><strong>Trade small</strong>: Stake only 1% to 2% of your account balance per trade.</li>
                            <li><strong>Take your profit and stop</strong>: Aim for 3 to 5 successful trades a day, then close your browser.</li>
                        </ul>
                    </div>
                </div>

                <div className='guide-modal-footer'>
                    <button
                        type='button'
                        className='got-it-btn'
                        onClick={() => engine.toggleGuide()}
                    >
                        Got It, Let's Analyze!
                    </button>
                </div>
            </div>
        </div>
    );
});
