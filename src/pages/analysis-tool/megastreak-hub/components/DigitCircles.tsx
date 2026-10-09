import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface DigitCirclesProps {
    engine: MegastreakEngine;
}

export const DigitCircles: React.FC<DigitCirclesProps> = observer(({ engine }) => {
    const frequencies = engine.digit_frequencies;
    const latestDigit = engine.latest_digit;

    return (
        <div className='megastreak-digit-circles-panel'>
            <div className='megastreak-panel-header'>
                <div className='megastreak-panel-title-group'>
                    <span className='megastreak-panel-title'>Live Digit Distribution</span>
                    <span className='megastreak-panel-subtitle'>50 Rolling Ticks • DTrader Style</span>
                </div>
                <div className='megastreak-legend'>
                    <span className='megastreak-legend-item under'>
                        <span className='dot under-dot' /> 0–4 Under
                    </span>
                    <span className='megastreak-legend-item over'>
                        <span className='dot over-dot' /> 5–9 Over
                    </span>
                </div>
            </div>

            <div className='megastreak-circles-grid'>
                {frequencies.map(f => {
                    const isUnder = f.digit <= 4;
                    const isLatest = latestDigit === f.digit;
                    const isTop = f.isTop;

                    return (
                        <div
                            key={f.digit}
                            className={`megastreak-circle-card ${isUnder ? 'is-under' : 'is-over'} ${
                                isTop ? 'is-top' : ''
                            } ${isLatest ? 'is-latest' : ''}`}
                            title={`Digit ${f.digit}: ${f.count} hits (${f.percentage.toFixed(1)}%)`}
                        >
                            {isTop && <span className='top-badge'>TOP</span>}
                            {isLatest && <span className='latest-ping' />}

                            <div
                                className='circle-outer'
                                style={{
                                    borderColor: isTop
                                        ? '#f59e0b'
                                        : isUnder
                                        ? `rgba(16, 185, 129, ${0.3 + f.intensity * 0.7})`
                                        : `rgba(244, 63, 94, ${0.3 + f.intensity * 0.7})`,
                                    boxShadow: isTop
                                        ? '0 0 12px rgba(245, 158, 11, 0.45)'
                                        : isLatest
                                        ? isUnder
                                            ? '0 0 10px rgba(16, 185, 129, 0.4)'
                                            : '0 0 10px rgba(244, 63, 94, 0.4)'
                                        : 'none',
                                }}
                            >
                                <span className='circle-digit'>{f.digit}</span>
                                <span className='circle-count'>{f.count}</span>
                                <span className='circle-pct'>{f.percentage.toFixed(0)}%</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});
