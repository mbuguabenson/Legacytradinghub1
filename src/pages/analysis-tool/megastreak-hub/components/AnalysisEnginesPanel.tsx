import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface AnalysisEnginesPanelProps {
    engine: MegastreakEngine;
}

export const AnalysisEnginesPanel: React.FC<AnalysisEnginesPanelProps> = observer(({ engine }) => {
    const activeTab = engine.active_engine_tab;
    const primary = engine.primary_distribution;
    const contract = engine.contract_analysis;
    const parity = engine.parity_analysis;
    const streak = engine.streak_analysis;
    const freqs = engine.digit_frequencies;
    const s7 = engine.rolling_stats_7;
    const s10 = engine.rolling_stats_10;
    const s25 = engine.rolling_stats_25;
    const stability = engine.market_stability;
    const mom = engine.momentum_analysis;
    const markets = engine.all_markets_stats;
    const isScanning = engine.is_scanning_all;
    const progress = engine.scan_progress;
    const currentSymbol = engine.selected_symbol;

    // Hot & cold calculations
    const sortedFreqs = [...freqs].sort((a, b) => b.count - a.count);
    const hottest = sortedFreqs[0];
    const coldest = sortedFreqs[sortedFreqs.length - 1];

    return (
        <div className='megastreak-card megastreak-engines-card'>
            {/* Header: Title & Engine Navigation Tabs */}
            <div className='card-header-row'>
                <div className='header-title-cluster'>
                    <div className='header-icon-badge color-cyan'>
                        <span className='icon-glyph'>⚙️</span>
                    </div>
                    <div className='header-text'>
                        <div className='title-with-pill'>
                            <h2 className='card-title'>Market &amp; Analysis Engines Hub</h2>
                            <span className='engine-count-pill'>4 REAL-TIME ENGINES</span>
                        </div>
                        <p className='card-subtitle'>
                            Multi-dimensional statistical intelligence tracking barriers, parity, anomalies, and cross-market setups
                        </p>
                    </div>
                </div>

                {/* Engine Selector Tabs */}
                <div className='engine-tab-pills'>
                    <button
                        type='button'
                        className={`engine-tab-btn ${activeTab === 'entry_points' ? 'active' : ''}`}
                        onClick={() => engine.setActiveEngineTab('entry_points')}
                    >
                        <span>📊 Barriers &amp; Momentum</span>
                    </button>
                    <button
                        type='button'
                        className={`engine-tab-btn ${activeTab === 'parity_streak' ? 'active' : ''}`}
                        onClick={() => engine.setActiveEngineTab('parity_streak')}
                    >
                        <span>⚖️ Parity &amp; Streaks</span>
                    </button>
                    <button
                        type='button'
                        className={`engine-tab-btn ${activeTab === 'distribution' ? 'active' : ''}`}
                        onClick={() => engine.setActiveEngineTab('distribution')}
                    >
                        <span>🔥 Hot/Cold Anomalies</span>
                    </button>
                    <button
                        type='button'
                        className={`engine-tab-btn ${activeTab === 'scanner' ? 'active' : ''}`}
                        onClick={() => engine.setActiveEngineTab('scanner')}
                    >
                        <span>🔍 Multi-Market Scanner</span>
                    </button>
                </div>
            </div>

            {/* ENGINE 1: BARRIERS & ROLLING MOMENTUM */}
            {activeTab === 'entry_points' && (
                <div className='engine-content-pane pane-barriers'>
                    {/* Primary Distribution Comparison */}
                    <div className='pane-subgrid-2'>
                        <div className='metric-gauge-card'>
                            <div className='gauge-header'>
                                <h4>Primary Distribution: Low [0–4] vs High [5–9]</h4>
                                <span className='total-ticks-badge'>50 Ticks</span>
                            </div>
                            <div className='dual-progress-track'>
                                <div
                                    className='progress-bar fill-under-emerald'
                                    style={{ width: `${primary.under04Pct}%` }}
                                >
                                    <span>Low 0–4: {Math.round(primary.under04Pct)}% ({primary.under04Count})</span>
                                </div>
                                <div
                                    className='progress-bar fill-over-violet'
                                    style={{ width: `${primary.over59Pct}%` }}
                                >
                                    <span>High 5–9: {Math.round(primary.over59Pct)}% ({primary.over59Count})</span>
                                </div>
                            </div>
                            <div className='gauge-footer-notes'>
                                <span>Under 0–4 Flow: <strong>{mom.under}</strong></span>
                                <span>Over 5–9 Flow: <strong>{mom.over}</strong></span>
                            </div>
                        </div>

                        <div className='metric-gauge-card'>
                            <div className='gauge-header'>
                                <h4>Target Barriers: Under 6 [0–5] vs Over 3 [4–9]</h4>
                                <span className='overlapping-badge'>60% Base Probability</span>
                            </div>
                            <div className='dual-progress-track'>
                                <div
                                    className='progress-bar fill-under-6'
                                    style={{ width: `${Math.min(100, (contract.under05Pct / (contract.under05Pct + contract.over49Pct || 1)) * 100)}%` }}
                                >
                                    <span>Under 6: {Math.round(contract.under05Pct)}% ({contract.under05Count})</span>
                                </div>
                                <div
                                    className='progress-bar fill-over-3'
                                    style={{ width: `${Math.min(100, (contract.over49Pct / (contract.under05Pct + contract.over49Pct || 1)) * 100)}%` }}
                                >
                                    <span>Over 3: {Math.round(contract.over49Pct)}% ({contract.over49Count})</span>
                                </div>
                            </div>
                            <div className='gauge-footer-notes'>
                                <span>Under 6 Edge: <strong>+{Math.round(contract.under05Pct - 60)}%</strong></span>
                                <span>Over 3 Edge: <strong>+{Math.round(contract.over49Pct - 60)}%</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* Multi-Window Momentum Matrix */}
                    <div className='rolling-windows-grid'>
                        <div className='window-stat-box'>
                            <span className='window-title'>LAST 7 TICKS (Trigger Speed)</span>
                            <div className='window-nums-row'>
                                <span className='under-val'>{s7.under05Count}/7 Under</span>
                                <span className='sep-dot'>•</span>
                                <span className='over-val'>{s7.over49Count}/7 Over</span>
                            </div>
                            <span className='window-ratio-bar'>
                                Under: {Math.round(s7.under05Pct)}% | Over: {Math.round(s7.over49Pct)}%
                            </span>
                        </div>

                        <div className='window-stat-box'>
                            <span className='window-title'>LAST 10 TICKS (Confirmation)</span>
                            <div className='window-nums-row'>
                                <span className='under-val'>{s10.under05Count}/10 Under</span>
                                <span className='sep-dot'>•</span>
                                <span className='over-val'>{s10.over49Count}/10 Over</span>
                            </div>
                            <span className='window-ratio-bar'>
                                Dominant: <strong>{s10.dominantDirection}</strong>
                            </span>
                        </div>

                        <div className='window-stat-box'>
                            <span className='window-title'>LAST 25 TICKS (Trend Baseline)</span>
                            <div className='window-nums-row'>
                                <span className='under-val'>{s25.under05Count}/25 Under</span>
                                <span className='sep-dot'>•</span>
                                <span className='over-val'>{s25.over49Count}/25 Over</span>
                            </div>
                            <span className='window-ratio-bar'>
                                Under: {Math.round(s25.under05Pct)}% | Over: {Math.round(s25.over49Pct)}%
                            </span>
                        </div>

                        <div className='window-stat-box'>
                            <span className='window-title'>MARKET STABILITY RATING</span>
                            <div className='window-nums-row'>
                                <span className={`stability-tag ${stability.toLowerCase()}`}>
                                    🛡️ {stability} FLOW
                                </span>
                            </div>
                            <span className='window-ratio-bar'>
                                Noise filter: {stability === 'STABLE' ? 'Clear trend' : stability === 'MODERATE' ? 'Normal variance' : 'Choppy, take care'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ENGINE 2: PARITY & STREAK ANALYSIS */}
            {activeTab === 'parity_streak' && (
                <div className='engine-content-pane pane-parity'>
                    <div className='parity-hero-grid'>
                        <div className='parity-card even-side'>
                            <div className='side-header'>
                                <span className='side-glyph'>🟢</span>
                                <h4>EVEN DIGITS (0, 2, 4, 6, 8)</h4>
                            </div>
                            <div className='side-main-stat'>
                                <strong className='stat-large'>{parity.evenCount}</strong>
                                <span className='stat-pct'>({parity.evenPct}%)</span>
                            </div>
                            <span className='side-sub'>Theoretical Fair Expectation: 50%</span>
                        </div>

                        <div className='parity-center-gauge'>
                            <span className='gauge-center-title'>LIVE PARITY BALANCE</span>
                            <div className='parity-gauge-track'>
                                <div className='track-fill-even' style={{ width: `${parity.evenPct}%` }} />
                                <div className='track-fill-odd' style={{ width: `${parity.oddPct}%` }} />
                            </div>
                            <div className='active-parity-status-pill'>
                                <span>Current: <strong>{parity.currentParity}</strong></span>
                                <span className='pill-sep'>•</span>
                                <span>Streak: <strong>{parity.currentParityStreak}x</strong></span>
                            </div>
                        </div>

                        <div className='parity-card odd-side'>
                            <div className='side-header'>
                                <span className='side-glyph'>🟣</span>
                                <h4>ODD DIGITS (1, 3, 5, 7, 9)</h4>
                            </div>
                            <div className='side-main-stat'>
                                <strong className='stat-large'>{parity.oddCount}</strong>
                                <span className='stat-pct'>({parity.oddPct}%)</span>
                            </div>
                            <span className='side-sub'>Theoretical Fair Expectation: 50%</span>
                        </div>
                    </div>

                    <div className='streak-details-strip'>
                        <div className='streak-box'>
                            <span className='box-label'>Active Parity Streak</span>
                            <strong className='box-value'>{parity.streakDescription}</strong>
                        </div>
                        <div className='streak-box'>
                            <span className='box-label'>Longest Parity Run</span>
                            <strong className='box-value'>
                                {parity.longestParityStreak}x Consecutive {parity.longestParityType}
                            </strong>
                        </div>
                        <div className='streak-box'>
                            <span className='box-label'>Longest Under Run</span>
                            <strong className='box-value'>{streak.longestUnderStreak}x Ticks (Digits 0–5)</strong>
                        </div>
                        <div className='streak-box'>
                            <span className='box-label'>Longest Over Run</span>
                            <strong className='box-value'>{streak.longestOverStreak}x Ticks (Digits 4–9)</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* ENGINE 3: HOT & COLD ANOMALY ENGINE */}
            {activeTab === 'distribution' && (
                <div className='engine-content-pane pane-anomalies'>
                    <div className='anomalies-summary-row'>
                        <div className='hot-cold-capsule hot-capsule'>
                            <span className='capsule-icon'>🔥</span>
                            <div className='capsule-text'>
                                <span className='lbl'>HOTTEST DIGIT</span>
                                <strong className='val'>
                                    Digit {hottest?.digit ?? '-'} — {hottest?.count ?? 0} Hits ({Math.round(hottest?.percentage || 0)}%)
                                </strong>
                            </div>
                        </div>

                        <div className='hot-cold-capsule cold-capsule'>
                            <span className='capsule-icon'>❄️</span>
                            <div className='capsule-text'>
                                <span className='lbl'>COLDEST DIGIT (BEST FOR DIFFERS)</span>
                                <strong className='val'>
                                    Digit {coldest?.digit ?? '-'} — {coldest?.count ?? 0} Hits ({Math.round(coldest?.percentage || 0)}%)
                                </strong>
                            </div>
                        </div>
                    </div>

                    {/* 0 to 9 Ranked Distribution Grid */}
                    <div className='ranked-digits-matrix'>
                        {freqs.map(f => {
                            const isHot = f.digit === hottest?.digit;
                            const isCold = f.digit === coldest?.digit;
                            const deviation = Math.round(f.percentage - 10);

                            return (
                                <div
                                    key={f.digit}
                                    className={`digit-stat-tile ${isHot ? 'is-hot' : ''} ${isCold ? 'is-cold' : ''}`}
                                >
                                    <div className='tile-top-row'>
                                        <span className='tile-digit-num'>Digit {f.digit}</span>
                                        {isHot && <span className='tile-tag hot-tag'>HOT</span>}
                                        {isCold && <span className='tile-tag cold-tag'>COLD</span>}
                                    </div>

                                    <div className='tile-bar-wrap'>
                                        <div
                                            className='tile-bar-fill'
                                            style={{
                                                height: `${Math.min(100, Math.max(12, f.percentage * 3.5))}%`,
                                            }}
                                        />
                                    </div>

                                    <div className='tile-bottom-row'>
                                        <strong className='tile-count'>{f.count} hits</strong>
                                        <span className='tile-pct'>{Math.round(f.percentage)}%</span>
                                        <span className={`tile-dev ${deviation >= 0 ? 'pos' : 'neg'}`}>
                                            {deviation >= 0 ? `+${deviation}%` : `${deviation}%`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ENGINE 4: MULTI-MARKET SCANNER */}
            {activeTab === 'scanner' && (
                <div className='engine-content-pane pane-scanner'>
                    <div className='scanner-top-bar'>
                        <div className='scanner-info'>
                            <span className='scanner-title'>Live Synthetic Markets Screener</span>
                            <span className='scanner-sub'>
                                Ranked by Composite Score (Directional Bias, Momentum &amp; Stability)
                            </span>
                        </div>

                        <button
                            type='button'
                            className={`rescan-action-btn ${isScanning ? 'scanning' : ''}`}
                            onClick={() => engine.scanAllMarkets()}
                            disabled={isScanning}
                        >
                            {isScanning ? `Scanning Markets (${progress}%)...` : '🔄 Rescan All Markets'}
                        </button>
                    </div>

                    {markets.length === 0 ? (
                        <div className='scanner-loading-state'>
                            <span>{isScanning ? `Scanning Volatilities & Jump Indices (${progress}%)...` : 'Click "Rescan All Markets" to initialize scanner.'}</span>
                        </div>
                    ) : (
                        <div className='markets-table-wrapper'>
                            <table className='markets-screener-table'>
                                <thead>
                                    <tr>
                                        <th>Market</th>
                                        <th>Score</th>
                                        <th>Setup Direction</th>
                                        <th>Under [0–5]</th>
                                        <th>Over [4–9]</th>
                                        <th>Last 7 Run</th>
                                        <th>Stability</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {markets.map(m => {
                                        const isCurrent = m.symbol === currentSymbol;
                                        const isUnderPref = m.preferredDirection === 'UNDER 6';

                                        return (
                                            <tr key={m.symbol} className={isCurrent ? 'current-market-row' : ''}>
                                                <td>
                                                    <div className='table-market-name'>
                                                        <strong>{m.displayName}</strong>
                                                        <span className='market-symbol-code'>{m.symbol}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`score-badge score-${m.score >= 70 ? 'high' : m.score >= 50 ? 'med' : 'low'}`}>
                                                        {m.score}/100
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`direction-badge ${isUnderPref ? 'under' : 'over'}`}>
                                                        {isUnderPref ? '🟢 BUY UNDER 6' : '🟣 BUY OVER 3'}
                                                    </span>
                                                </td>
                                                <td>{m.under05Pct}%</td>
                                                <td>{m.over49Pct}%</td>
                                                <td>
                                                    {isUnderPref ? `${m.last7ConfirmUnder}/7 Under` : `${m.last7ConfirmOver}/7 Over`}
                                                </td>
                                                <td>
                                                    <span className={`stab-cell ${m.stability.toLowerCase()}`}>
                                                        {m.stability}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`status-cell ${m.signalStatus.includes('MET') ? 'met' : m.signalStatus.includes('FORMING') ? 'forming' : 'wait'}`}>
                                                        {m.signalStatus.replace('CONDITIONS ', '')}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isCurrent ? (
                                                        <span className='active-tag'>Active</span>
                                                    ) : (
                                                        <button
                                                            type='button'
                                                            className='switch-market-btn'
                                                            onClick={() => engine.selectSymbol(m.symbol)}
                                                        >
                                                            Switch →
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
