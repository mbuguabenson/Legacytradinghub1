import React from 'react';
import { observer } from 'mobx-react-lite';
import DigitDistributionCircles from '@/pages/chart/digit-distribution-circles';
import { MegastreakEngine } from '../megastreak-engine';

interface DigitCirclesProps {
    engine: MegastreakEngine;
}

export const DigitCircles: React.FC<DigitCirclesProps> = observer(({ engine }) => {
    // Pass the rolling ticks digits array to DigitDistributionCircles
    const rawDigits = engine.ticks.map(t => t.digit);
    const tickData =
        engine.current_price > 0
            ? {
                  quote: engine.current_price,
                  pip_size: engine.pip_size,
                  last_digit: engine.latest_digit,
              }
            : undefined;

    const freqs = engine.digit_frequencies;
    let hottest = freqs[0];
    let coldest = freqs[0];
    freqs.forEach(f => {
        if (f.percentage > (hottest?.percentage || 0)) hottest = f;
        if (f.percentage < (coldest?.percentage || 100)) coldest = f;
    });

    return (
        <div className='megastreak-hero-circles-card'>
            <div className='hero-circles-header'>
                <div className='circles-title-cluster'>
                    <div className='circles-badge-icon'>🎯</div>
                    <div className='circles-headings'>
                        <h2 className='circles-main-title'>Live Digit Distribution (0 – 9)</h2>
                        <span className='circles-sub-title'>
                            Last 50 Ticks • Real-Time Pointer &amp; Percentage Rings
                        </span>
                    </div>
                </div>

                <div className='circles-legend-pills'>
                    <div className='legend-stat-pill hot'>
                        <span className='pill-dot hot-dot' />
                        <span className='pill-label'>Max Frequency:</span>
                        <strong className='pill-val'>Digit {hottest?.digit ?? '-'} ({Math.round(hottest?.percentage || 0)}%)</strong>
                    </div>

                    <div className='legend-stat-pill cold'>
                        <span className='pill-dot cold-dot' />
                        <span className='pill-label'>Min Frequency:</span>
                        <strong className='pill-val'>Digit {coldest?.digit ?? '-'} ({Math.round(coldest?.percentage || 0)}%)</strong>
                    </div>
                </div>
            </div>

            <div className='hero-circles-canvas'>
                <DigitDistributionCircles
                    digits={rawDigits}
                    tick={tickData}
                    selected_digit={engine.latest_digit}
                    dimension={60}
                />
            </div>
        </div>
    );
});
