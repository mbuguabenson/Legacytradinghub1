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

    return (
        <div className='megastreak-digit-circles-panel curved-card'>
            <div className='megastreak-panel-header'>
                <div className='megastreak-panel-title-group'>
                    <div className='title-icon-wrapper'>
                        <span className='icon'>🎯</span>
                    </div>
                    <div className='title-text-group'>
                        <span className='megastreak-panel-title'>Live Digit Distribution</span>
                        <span className='megastreak-panel-subtitle'>50 Rolling Ticks • Real-Time Pointer</span>
                    </div>
                </div>
                <div className='megastreak-legend'>
                    <span className='megastreak-legend-pill max-pill'>
                        <span className='legend-dot max-dot' /> Max Frequency
                    </span>
                    <span className='megastreak-legend-pill min-pill'>
                        <span className='legend-dot min-dot' /> Min Frequency
                    </span>
                </div>
            </div>

            <div className='megastreak-official-circles-wrapper'>
                <DigitDistributionCircles
                    digits={rawDigits}
                    tick={tickData}
                    selected_digit={engine.latest_digit}
                />
            </div>
        </div>
    );
});
