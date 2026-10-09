import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface BestMarketCardProps {
    engine: MegastreakEngine;
}

export const BestMarketCard: React.FC<BestMarketCardProps> = observer(({ engine }) => {
    const pick = engine.megastreak_pick;
    const isScanning = engine.is_scanning_all;
    const progress = engine.scan_progress;
    const currentSymbol = engine.selected_symbol;

    return (
        <div className='megastreak-best-market-card curved-card'>
            <div className='best-market-left'>
                <div className='best-market-badge-pill'>
                    <span className='star-icon'>⭐</span>
                    <span className='badge-text'>BEST MARKET PICK</span>
                </div>

                {pick ? (
                    <div className='best-market-info'>
                        <div className='market-titles'>
                            <span className='market-name'>{pick.displayName}</span>
                            <span className='market-code'>{pick.symbol}</span>
                        </div>
                        <div className='market-metrics-pills'>
                            <span className={`direction-pill ${pick.preferredDirection.startsWith('UNDER') ? 'under' : 'over'}`}>
                                {pick.preferredDirection === 'UNDER 6' ? '🟢 BUY UNDER 6' : '🟣 BUY OVER 3'}
                            </span>
                            <span className='score-pill'>
                                <span className='score-icon'>🎯</span> Score {pick.score}/100
                            </span>
                            <span className={`stability-pill ${pick.stability.toLowerCase()}`}>
                                🛡️ {pick.stability}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className='best-market-empty'>
                        <span>{isScanning ? `Scanning Volatilities & Jumps (${progress}%)...` : 'Searching for the best setup among Volatilities & Jump Indices...'}</span>
                    </div>
                )}
            </div>

            <div className='best-market-right'>
                {pick && pick.symbol !== currentSymbol ? (
                    <button
                        type='button'
                        className='load-best-pill-btn'
                        onClick={() => engine.selectSymbol(pick.symbol)}
                    >
                        <span>⚡ Switch to {pick.symbol}</span>
                        <span className='btn-arrow'>→</span>
                    </button>
                ) : pick && pick.symbol === currentSymbol ? (
                    <div className='currently-loaded-pill'>
                        <span className='check-icon'>✓</span> Active Market
                    </div>
                ) : null}

                <button
                    type='button'
                    className={`scan-pill-btn ${isScanning ? 'scanning' : ''}`}
                    onClick={() => engine.scanAllMarkets()}
                    disabled={isScanning}
                >
                    {isScanning ? `Scanning (${progress}%)` : '🔍 Find Best Market'}
                </button>
            </div>
        </div>
    );
});
