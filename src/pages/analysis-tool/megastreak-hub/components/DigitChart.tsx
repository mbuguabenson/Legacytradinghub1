import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface DigitChartProps {
    engine: MegastreakEngine;
}

export const DigitChart: React.FC<DigitChartProps> = observer(({ engine }) => {
    const ticks = engine.ticks;
    const latestDigit = engine.latest_digit;
    const currentPrice = engine.current_price;
    const pipSize = engine.pip_size;
    const isWarmingUp = ticks.length < 50;

    // SVG coordinate calculations (viewBox 0 0 650 220)
    const svgWidth = 650;
    const svgHeight = 220;
    const paddingLeft = 32;
    const paddingRight = 24;
    const paddingTop = 20;
    const paddingBottom = 26;

    const plotWidth = svgWidth - paddingLeft - paddingRight;
    const plotHeight = svgHeight - paddingTop - paddingBottom;

    // Map digit 0..9 to Y (0 is at bottom, 9 is at top)
    const getY = (digit: number) => {
        const clamped = Math.max(0, Math.min(9, digit));
        return paddingTop + plotHeight - (clamped / 9) * plotHeight;
    };

    // Map index 0..49 to X
    const getX = (index: number, count: number) => {
        const total = Math.max(1, count - 1);
        return paddingLeft + (index / total) * plotWidth;
    };

    // Calculate polyline points
    const pointsString = ticks
        .map((t, idx) => `${getX(idx, ticks.length).toFixed(1)},${getY(t.digit).toFixed(1)}`)
        .join(' ');

    const boundaryY = getY(4.5); // Separator between Under (0-4) and Over (5-9)

    return (
        <div className='megastreak-chart-panel'>
            {/* Prominent Header Above Chart */}
            <div className='chart-header'>
                <div className='chart-header-left'>
                    <div className='symbol-badge'>
                        <span className='pulse-indicator' />
                        <span className='symbol-name'>{engine.display_name}</span>
                    </div>
                    <div className='price-display'>
                        <span className='price-label'>SPOT PRICE</span>
                        <span className='price-value'>
                            {currentPrice > 0 ? currentPrice.toFixed(pipSize) : '---'}
                        </span>
                    </div>
                </div>

                <div className='chart-header-right'>
                    <div className='digit-card'>
                        <span className='digit-label'>LAST DIGIT</span>
                        <div
                            className={`digit-badge ${
                                latestDigit !== null && latestDigit <= 4 ? 'is-under' : 'is-over'
                            }`}
                        >
                            {latestDigit !== null ? latestDigit : '-'}
                        </div>
                    </div>
                    <div className='window-counter'>
                        <span className='counter-text'>
                            {isWarmingUp ? `Warming up (${ticks.length}/50)` : 'Rolling 50 Ticks'}
                        </span>
                        <div className='counter-bar'>
                            <div
                                className='counter-fill'
                                style={{ width: `${Math.min(100, (ticks.length / 50) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Live SVG Chart */}
            <div className='chart-svg-container'>
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    preserveAspectRatio='none'
                    className='digit-svg-canvas'
                >
                    <defs>
                        <linearGradient id='overZoneGrad' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='0%' stopColor='rgba(244, 63, 94, 0.14)' />
                            <stop offset='100%' stopColor='rgba(244, 63, 94, 0.02)' />
                        </linearGradient>
                        <linearGradient id='underZoneGrad' x1='0' y1='0' x2='0' y2='1'>
                            <stop offset='0%' stopColor='rgba(16, 185, 129, 0.02)' />
                            <stop offset='100%' stopColor='rgba(16, 185, 129, 0.14)' />
                        </linearGradient>
                    </defs>

                    {/* Zone Backgrounds */}
                    <rect
                        x={paddingLeft}
                        y={paddingTop}
                        width={plotWidth}
                        height={boundaryY - paddingTop}
                        fill='url(#overZoneGrad)'
                    />
                    <rect
                        x={paddingLeft}
                        y={boundaryY}
                        width={plotWidth}
                        height={paddingTop + plotHeight - boundaryY}
                        fill='url(#underZoneGrad)'
                    />

                    {/* Horizontal Gridlines for Digits 0 to 9 */}
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
                        const y = getY(d);
                        return (
                            <g key={d} className='grid-line-group'>
                                <line
                                    x1={paddingLeft}
                                    y1={y}
                                    x2={svgWidth - paddingRight}
                                    y2={y}
                                    stroke='rgba(255, 255, 255, 0.06)'
                                    strokeDasharray={d === 4 ? 'none' : '2,3'}
                                />
                                <text
                                    x={paddingLeft - 8}
                                    y={y + 3.5}
                                    textAnchor='end'
                                    className={`axis-digit-label ${d <= 4 ? 'under-label' : 'over-label'}`}
                                >
                                    {d}
                                </text>
                            </g>
                        );
                    })}

                    {/* 4.5 Boundary Demarcation Line */}
                    <line
                        x1={paddingLeft}
                        y1={boundaryY}
                        x2={svgWidth - paddingRight}
                        y2={boundaryY}
                        stroke='rgba(255, 255, 255, 0.22)'
                        strokeWidth='1.2'
                        strokeDasharray='4,4'
                    />

                    {/* Zone Labels on Right Margin */}
                    <text
                        x={svgWidth - paddingRight + 5}
                        y={paddingTop + 14}
                        className='zone-legend-text over'
                    >
                        OVER
                    </text>
                    <text
                        x={svgWidth - paddingRight + 5}
                        y={paddingTop + plotHeight - 4}
                        className='zone-legend-text under'
                    >
                        UNDER
                    </text>

                    {/* Trend Line */}
                    {ticks.length > 1 && (
                        <polyline
                            points={pointsString}
                            fill='none'
                            stroke='rgba(255, 255, 255, 0.65)'
                            strokeWidth='1.8'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    )}

                    {/* Point Markers */}
                    {ticks.map((t, idx) => {
                        const cx = getX(idx, ticks.length);
                        const cy = getY(t.digit);
                        const isUnder = t.digit <= 4;
                        const isLatest = idx === ticks.length - 1;

                        return (
                            <g key={idx}>
                                <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isLatest ? 4.5 : 2.8}
                                    fill={isUnder ? '#10b981' : '#f43f5e'}
                                    stroke={isLatest ? '#ffffff' : 'rgba(0, 0, 0, 0.4)'}
                                    strokeWidth={isLatest ? 1.5 : 1}
                                />
                                {isLatest && (
                                    <circle
                                        cx={cx}
                                        cy={cy}
                                        r='9'
                                        fill='none'
                                        stroke={isUnder ? '#10b981' : '#f43f5e'}
                                        strokeWidth='1.5'
                                        className='pulse-ring'
                                    />
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
});
