import React, { useMemo } from 'react';
import { LineChart } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

// Chart dimensions
const WIDTH = 800;
const HEIGHT = 220;
const PADDING_LEFT = 36;
const PADDING_RIGHT = 20;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 26;

const PLOT_WIDTH = WIDTH - PADDING_LEFT - PADDING_RIGHT;
const PLOT_HEIGHT = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

// Y values: 0 to 9 (top is 9, bottom is 0)
const getY = (digit: number) => {
    const clamped = Math.max(0, Math.min(9, digit));
    return PADDING_TOP + PLOT_HEIGHT - (clamped / 9) * PLOT_HEIGHT;
};

export const Apex50DigitChart: React.FC = observer(() => {
    const { apex } = useStore();

    if (!apex) return null;

    const { ticks_buffer } = apex;

    // X values: 1 to 50
    const points = useMemo(() => {
        return ticks_buffer.map((item, idx) => {
            const x = PADDING_LEFT + (idx / 49) * PLOT_WIDTH;
            const y = getY(item.digit);
            return { x, y, digit: item.digit, epoch: item.epoch };
        });
    }, [ticks_buffer]);

    // Path string for smooth or polyline connecting the digits
    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    // Zone boundaries:
    // Digits 0 to 4 is Y range from getY(0) to getY(4.5)
    // Digits 5 to 9 is Y range from getY(4.5) to getY(9)
    const splitY = getY(4.5);

    return (
        <div className='apex-card apex-chart-card'>
            <div className='chart-header'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LineChart size={17} color='#38bdf8' />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                        LIVE 50-TICK DIGIT BEHAVIORAL SEQUENCE
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        ({ticks_buffer.length}/50 ticks active)
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.4)' }} />
                        <span style={{ color: '#10b981', fontWeight: 600 }}>0-4 (UNDER)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'rgba(244, 63, 94, 0.4)' }} />
                        <span style={{ color: '#f43f5e', fontWeight: 600 }}>5-9 (OVER)</span>
                    </div>
                </div>
            </div>

            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className='digit-chart-svg'
                preserveAspectRatio='none'
            >
                <defs>
                    <linearGradient id='apexLineGrad' x1='0%' y1='0%' x2='100%' y2='0%'>
                        <stop offset='0%' stopColor='#38bdf8' stopOpacity='0.4' />
                        <stop offset='70%' stopColor='#38bdf8' stopOpacity='0.9' />
                        <stop offset='100%' stopColor='#10b981' stopOpacity='1' />
                    </linearGradient>

                    <linearGradient id='underZoneGrad' x1='0%' y1='0%' x2='0%' y2='100%'>
                        <stop offset='0%' stopColor='#10b981' stopOpacity='0.03' />
                        <stop offset='100%' stopColor='#10b981' stopOpacity='0.12' />
                    </linearGradient>

                    <linearGradient id='overZoneGrad' x1='0%' y1='0%' x2='0%' y2='100%'>
                        <stop offset='0%' stopColor='#f43f5e' stopOpacity='0.12' />
                        <stop offset='100%' stopColor='#f43f5e' stopOpacity='0.03' />
                    </linearGradient>
                </defs>

                {/* Subtle Zone Highlights (0-4 Under vs 5-9 Over) */}
                {/* Over Zone (5-9): from PADDING_TOP down to splitY */}
                <rect
                    x={PADDING_LEFT}
                    y={PADDING_TOP}
                    width={PLOT_WIDTH}
                    height={splitY - PADDING_TOP}
                    fill='url(#overZoneGrad)'
                />
                {/* Under Zone (0-4): from splitY down to PADDING_TOP + PLOT_HEIGHT */}
                <rect
                    x={PADDING_LEFT}
                    y={splitY}
                    width={PLOT_WIDTH}
                    height={PADDING_TOP + PLOT_HEIGHT - splitY}
                    fill='url(#underZoneGrad)'
                />

                {/* Horizontal Digit Gridlines & Labels (0 to 9) */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
                    const y = getY(d);
                    const isBarrierLine = d === 4;
                    return (
                        <g key={d}>
                            <line
                                x1={PADDING_LEFT}
                                y1={y}
                                x2={PADDING_LEFT + PLOT_WIDTH}
                                y2={y}
                                stroke={isBarrierLine ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)'}
                                strokeDasharray={isBarrierLine ? '4,4' : '2,4'}
                                strokeWidth='1'
                            />
                            <text
                                x={PADDING_LEFT - 10}
                                y={y + 4}
                                fill={d <= 4 ? '#10b981' : '#f43f5e'}
                                fontSize='11'
                                fontWeight='700'
                                textAnchor='end'
                                fontFamily='JetBrains Mono, monospace'
                            >
                                {d}
                            </text>
                        </g>
                    );
                })}

                {/* Middle Boundary Marker (Between 4 and 5) */}
                <line
                    x1={PADDING_LEFT}
                    y1={splitY}
                    x2={PADDING_LEFT + PLOT_WIDTH}
                    y2={splitY}
                    stroke='rgba(56, 189, 248, 0.4)'
                    strokeWidth='1.5'
                    strokeDasharray='5,5'
                />

                {/* Sequence Path */}
                {polylinePoints && (
                    <polyline
                        fill='none'
                        stroke='url(#apexLineGrad)'
                        strokeWidth='2.2'
                        strokeLinejoin='round'
                        strokeLinecap='round'
                        points={polylinePoints}
                    />
                )}

                {/* Plot Tick Dots */}
                {points.map((p, i) => {
                    const isLatest = i === points.length - 1;
                    const isUnder = p.digit <= 4;
                    return (
                        <g key={i}>
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={isLatest ? 5.5 : 2.5}
                                fill={isUnder ? '#10b981' : '#f43f5e'}
                                stroke={isLatest ? '#ffffff' : 'rgba(0,0,0,0.5)'}
                                strokeWidth={isLatest ? 2 : 0.8}
                            />
                            {isLatest && (
                                <circle
                                    cx={p.x}
                                    cy={p.y}
                                    r='10'
                                    fill='none'
                                    stroke={isUnder ? '#10b981' : '#f43f5e'}
                                    strokeWidth='1.5'
                                    opacity='0.6'
                                >
                                    <animate
                                        attributeName='r'
                                        values='6;14;6'
                                        dur='1.5s'
                                        repeatCount='indefinite'
                                    />
                                    <animate
                                        attributeName='opacity'
                                        values='0.8;0.1;0.8'
                                        dur='1.5s'
                                        repeatCount='indefinite'
                                    />
                                </circle>
                            )}
                        </g>
                    );
                })}

                {/* X Axis Sequence Labels */}
                <g fill='#64748b' fontSize='9' textAnchor='middle'>
                    <text x={PADDING_LEFT} y={HEIGHT - 8}>Tick 1</text>
                    <text x={PADDING_LEFT + PLOT_WIDTH * 0.25} y={HEIGHT - 8}>Tick 12</text>
                    <text x={PADDING_LEFT + PLOT_WIDTH * 0.5} y={HEIGHT - 8}>Tick 25</text>
                    <text x={PADDING_LEFT + PLOT_WIDTH * 0.75} y={HEIGHT - 8}>Tick 37</text>
                    <text x={PADDING_LEFT + PLOT_WIDTH} y={HEIGHT - 8}>Tick 50</text>
                </g>
            </svg>
        </div>
    );
});
