import React, { useEffect, useMemo, useState } from 'react';
import './ForexChartsBackground.scss';

interface CandlestickData {
    x: number;
    open: number;
    close: number;
    high: number;
    low: number;
    isUp: boolean;
    volume: number;
}

const TICKER_ITEMS = [
    { pair: 'EUR/USD', price: '1.08456', change: '+0.38%', up: true },
    { pair: 'GBP/USD', price: '1.29824', change: '+0.54%', up: true },
    { pair: 'USD/JPY', price: '153.340', change: '-0.21%', up: false },
    { pair: 'XAU/USD', price: '2,686.80', change: '+1.32%', up: true },
    { pair: 'BTC/USD', price: '66,850.0', change: '+3.42%', up: true },
    { pair: 'Volatility 100 (1s)', price: '826.40', change: '+0.94%', up: true },
    { pair: 'Crash 500', price: '3,410.20', change: '-0.38%', up: false },
    { pair: 'Boom 1000', price: '9,864.50', change: '+1.12%', up: true },
    { pair: 'AUD/USD', price: '0.65520', change: '+0.25%', up: true },
    { pair: 'USD/CAD', price: '1.38880', change: '-0.14%', up: false },
    { pair: 'Volatility 75', price: '314.15', change: '+0.82%', up: true },
    { pair: 'Step Index', price: '8,426.80', change: '+0.36%', up: true },
    { pair: 'Jump 100', price: '1,248.90', change: '+1.45%', up: true },
    { pair: 'ETH/USD', price: '2,642.10', change: '+2.18%', up: true },
];

export const ForexChartsBackground: React.FC = () => {
    // Live ticking micro-simulation
    const [liveTickOffset, setLiveTickOffset] = useState<number>(0);
    const [livePrice, setLivePrice] = useState<string>('1.08456');
    const [isTickUp, setIsTickUp] = useState<boolean>(true);
    const [orderbookRatios, setOrderbookRatios] = useState<number[]>([65, 82, 45, 92, 74, 58]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            const delta = (Math.random() - 0.47) * 4;
            setLiveTickOffset(prev => Math.max(-16, Math.min(16, prev + delta)));
            const randomVal = (1.08450 + (Math.random() * 0.00022 - 0.00010)).toFixed(5);
            setLivePrice(randomVal);
            setIsTickUp(delta >= 0);

            // Subtle live orderbook fluctuations
            setOrderbookRatios(prev =>
                prev.map(val => Math.max(30, Math.min(96, Math.round(val + (Math.random() * 8 - 4)))))
            );
        }, 320);

        return () => window.clearInterval(interval);
    }, []);

    // Generate realistic institutional candlestick pattern data (36 candles)
    const candles: CandlestickData[] = useMemo(() => {
        const data: CandlestickData[] = [];
        const basePrice = 300;
        let currentPrice = basePrice;
        const totalCandles = 36;
        const spacing = 32;
        const startX = 20;

        // Controlled random walk simulating healthy bullish breakout & consolidation pattern
        const priceDeltas = [
            -6, 12, 16, -8, 14, 20, -10, 16, 8, -12, 18, 22, -10, 14, 26, -16,
            20, 14, -6, 18, 24, -10, 16, 10, -6, 20, 16, 8, 16, 12, -6, 14,
            22, -8, 18, 24
        ];

        for (let i = 0; i < totalCandles; i++) {
            const delta = priceDeltas[i % priceDeltas.length];
            const open = currentPrice;
            const close = open - delta; // SVG Y coordinates: lower Y = higher price
            const high = Math.min(open, close) - (Math.abs(delta) * 0.38 + 5);
            const low = Math.max(open, close) + (Math.abs(delta) * 0.35 + 5);
            const isUp = close < open;
            const volume = 22 + Math.abs(delta) * 2.4;

            data.push({
                x: startX + i * spacing,
                open,
                close,
                high,
                low,
                isUp,
                volume,
            });

            currentPrice = close;
        }

        return data;
    }, []);

    // Generate smooth bezier curves for Moving Averages
    const ema9Path = useMemo(() => {
        if (!candles.length) return '';
        let d = `M ${candles[0].x} ${candles[0].close - 2}`;
        for (let i = 1; i < candles.length; i++) {
            const prev = candles[i - 1];
            const curr = candles[i];
            const cX = (prev.x + curr.x) / 2;
            d += ` C ${cX} ${prev.close - 2}, ${cX} ${curr.close - 2}, ${curr.x} ${curr.close - 2}`;
        }
        return d;
    }, [candles]);

    const ema21Path = useMemo(() => {
        if (!candles.length) return '';
        let d = `M ${candles[0].x} ${candles[0].close + 10}`;
        for (let i = 1; i < candles.length; i++) {
            const prev = candles[i - 1];
            const curr = candles[i];
            const cX = (prev.x + curr.x) / 2;
            d += ` C ${cX} ${prev.close + 8}, ${cX} ${curr.close + 8}, ${curr.x} ${curr.close + 8}`;
        }
        return d;
    }, [candles]);

    const ema50Path = useMemo(() => {
        if (!candles.length) return '';
        let d = `M ${candles[0].x} ${candles[0].close + 28}`;
        for (let i = 1; i < candles.length; i++) {
            const prev = candles[i - 1];
            const curr = candles[i];
            const cX = (prev.x + curr.x) / 2;
            d += ` C ${cX} ${prev.close + 24}, ${cX} ${curr.close + 24}, ${curr.x} ${curr.close + 24}`;
        }
        return d;
    }, [candles]);

    // Area fill gradient under EMA 9
    const areaFillPath = useMemo(() => {
        if (!candles.length) return '';
        let d = `M ${candles[0].x} ${candles[0].close - 2}`;
        for (let i = 1; i < candles.length; i++) {
            const prev = candles[i - 1];
            const curr = candles[i];
            const cX = (prev.x + curr.x) / 2;
            d += ` C ${cX} ${prev.close - 2}, ${cX} ${curr.close - 2}, ${curr.x} ${curr.close - 2}`;
        }
        const last = candles[candles.length - 1];
        d += ` L ${last.x} 540 L ${candles[0].x} 540 Z`;
        return d;
    }, [candles]);

    const lastCandle = candles[candles.length - 1];
    const currentPriceY = (lastCandle ? lastCandle.close : 210) + liveTickOffset;

    // Floating particles data
    const particles = useMemo(() => {
        return Array.from({ length: 18 }, (_, idx) => ({
            id: idx,
            x: (idx * 58 + 42) % 1120,
            y: (idx * 31 + 75) % 520,
            r: idx % 3 === 0 ? 2 : 1.2,
            opacity: 0.15 + (idx % 5) * 0.08,
            dur: 3 + (idx % 4) * 1.5,
        }));
    }, []);

    return (
        <div className='forex-charts-bg' aria-hidden='true'>
            {/* Ambient Multi-Hue Radiant Glows */}
            <div className='fc-glow fc-glow--cyan' />
            <div className='fc-glow fc-glow--emerald' />
            <div className='fc-glow fc-glow--indigo' />
            <div className='fc-glow fc-glow--gold' />

            {/* Continuous Marquee Forex & Synthetics Live Ticker Tape */}
            <div className='fc-ticker-tape'>
                <div className='fc-ticker-track'>
                    {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                        <div key={`${item.pair}-${idx}`} className='fc-ticker-item'>
                            <span className='pair'>{item.pair}</span>
                            <span className='price'>{item.price}</span>
                            <span className={`change ${item.up ? 'up' : 'down'}`}>
                                {item.up ? '▲' : '▼'} {item.change}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Institutional HUD Meta Badges */}
            <div className='fc-hud-meta fc-hud-meta--top-left'>
                <div className='fc-hud-chip'>
                    <span className='dot live' />
                    <span>FEED: EUR/USD [M15] • INSTITUTIONAL DEPTH</span>
                </div>
                <div className='fc-hud-sub'>SPREAD: 0.1 PIP • VOLATILITY 84.6% • GLOBAL POOL $6.6T/DAY</div>
            </div>

            <div className='fc-hud-meta fc-hud-meta--top-right'>
                <div className='fc-hud-chip'>
                    <span className='dot green' />
                    <span>QUANTUM FEED: DERIV WEBSOCKET V3</span>
                </div>
                <div className='fc-hud-sub'>STREAM LATENCY: 11MS • 256-BIT ENCLAVE ACTIVE</div>
            </div>

            {/* Right-Hand Orderbook Depth Indicator Strip */}
            <div className='fc-orderbook-depth'>
                <div className='depth-header'>LEVEL II DEPTH</div>
                <div className='depth-row ask'>
                    <span className='level'>1.08475</span>
                    <span className='bar bar--ask' style={{ width: `${orderbookRatios[0]}%` }} />
                </div>
                <div className='depth-row ask'>
                    <span className='level'>1.08470</span>
                    <span className='bar bar--ask' style={{ width: `${orderbookRatios[1]}%` }} />
                </div>
                <div className='depth-row ask'>
                    <span className='level'>1.08465</span>
                    <span className='bar bar--ask' style={{ width: `${orderbookRatios[2]}%` }} />
                </div>
                <div className='depth-spread'>
                    <span className='spread-text'>SPREAD 0.1 PIPS</span>
                </div>
                <div className='depth-row bid'>
                    <span className='level'>1.08455</span>
                    <span className='bar bar--bid' style={{ width: `${orderbookRatios[3]}%` }} />
                </div>
                <div className='depth-row bid'>
                    <span className='level'>1.08450</span>
                    <span className='bar bar--bid' style={{ width: `${orderbookRatios[4]}%` }} />
                </div>
                <div className='depth-row bid'>
                    <span className='level'>1.08445</span>
                    <span className='bar bar--bid' style={{ width: `${orderbookRatios[5]}%` }} />
                </div>
            </div>

            {/* Bottom Technical Indicators Strip */}
            <div className='fc-tech-indicators'>
                <div className='tech-item'>
                    <span className='label'>RSI (14)</span>
                    <span className='val positive'>64.2 [BULLISH]</span>
                </div>
                <div className='tech-divider' />
                <div className='tech-item'>
                    <span className='label'>MACD (12, 26, 9)</span>
                    <span className='val positive'>+0.00142 [EXPANDING]</span>
                </div>
                <div className='tech-divider' />
                <div className='tech-item'>
                    <span className='label'>ATR (14)</span>
                    <span className='val gold'>0.0034 [HIGH VOL]</span>
                </div>
                <div className='tech-divider' />
                <div className='tech-item'>
                    <span className='label'>EMA RIBBON</span>
                    <span className='val cyan'>9 / 21 / 50 BULL STACK</span>
                </div>
            </div>

            {/* SVG Forex Technical Candlestick Canvas */}
            <svg
                className='fc-chart-svg'
                viewBox='0 0 1180 540'
                preserveAspectRatio='xMidYMid slice'
            >
                <defs>
                    <linearGradient id='fcAreaGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#00f5ff' stopOpacity='0.18' />
                        <stop offset='40%' stopColor='#10b981' stopOpacity='0.06' />
                        <stop offset='100%' stopColor='#060911' stopOpacity='0' />
                    </linearGradient>

                    <linearGradient id='fcBullGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#34d399' />
                        <stop offset='100%' stopColor='#059669' />
                    </linearGradient>

                    <linearGradient id='fcBearGrad' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#f87171' />
                        <stop offset='100%' stopColor='#dc2626' />
                    </linearGradient>

                    <filter id='fcNeonGlowCyan' x='-25%' y='-25%' width='150%' height='150%'>
                        <feGaussianBlur stdDeviation='3.5' result='blur' />
                        <feMerge>
                            <feMergeNode in='blur' />
                            <feMergeNode in='SourceGraphic' />
                        </feMerge>
                    </filter>

                    <filter id='fcNeonGlowGold' x='-25%' y='-25%' width='150%' height='150%'>
                        <feGaussianBlur stdDeviation='3' result='blur' />
                        <feMerge>
                            <feMergeNode in='blur' />
                            <feMergeNode in='SourceGraphic' />
                        </feMerge>
                    </filter>
                </defs>

                {/* Ambient Subtle Background Watermark */}
                <text
                    x='590'
                    y='280'
                    textAnchor='middle'
                    fill='rgba(255, 255, 255, 0.025)'
                    fontSize='84'
                    fontWeight='900'
                    fontFamily='system-ui, sans-serif'
                    letterSpacing='0.18em'
                >
                    LEGACY QUANTUM
                </text>

                {/* Horizontal Technical Price Grid Lines with Price Scale */}
                {[90, 160, 230, 300, 370, 440].map((y, idx) => (
                    <g key={`grid-h-${idx}`}>
                        <line
                            x1='0'
                            y1={y}
                            x2='1180'
                            y2={y}
                            stroke='rgba(255, 255, 255, 0.04)'
                            strokeDasharray='4 8'
                        />
                        <text
                            x='1160'
                            y={y - 4}
                            textAnchor='end'
                            fill='rgba(148, 163, 184, 0.35)'
                            fontSize='10'
                            fontFamily='monospace'
                        >
                            {(1.0965 - idx * 0.0035).toFixed(4)}
                        </text>
                    </g>
                ))}

                {/* Fibonacci Retracement Guidelines */}
                {/* 0.618 Golden Ratio */}
                <g className='fc-fib-line'>
                    <line x1='0' y1='175' x2='1180' y2='175' stroke='rgba(245, 158, 11, 0.28)' strokeDasharray='6 5' strokeWidth='1' />
                    <text x='40' y='170' fill='rgba(245, 158, 11, 0.6)' fontSize='9' fontFamily='monospace' fontWeight='700'>
                        FIB 0.618 [GOLDEN POCKET] 1.08740
                    </text>
                </g>

                {/* 0.500 Equilibrium */}
                <g className='fc-fib-line'>
                    <line x1='0' y1='235' x2='1180' y2='235' stroke='rgba(0, 245, 255, 0.22)' strokeDasharray='5 6' strokeWidth='1' />
                    <text x='40' y='230' fill='rgba(0, 245, 255, 0.55)' fontSize='9' fontFamily='monospace' fontWeight='700'>
                        FIB 0.500 [EQUILIBRIUM] 1.08580
                    </text>
                </g>

                {/* 0.382 Support */}
                <g className='fc-fib-line'>
                    <line x1='0' y1='295' x2='1180' y2='295' stroke='rgba(16, 185, 129, 0.22)' strokeDasharray='5 6' strokeWidth='1' />
                    <text x='40' y='290' fill='rgba(16, 185, 129, 0.55)' fontSize='9' fontFamily='monospace' fontWeight='700'>
                        FIB 0.382 [SUPPORT] 1.08420
                    </text>
                </g>

                {/* Vertical Time Division Grid Lines */}
                {[140, 310, 480, 650, 820, 990, 1140].map((x, idx) => (
                    <g key={`grid-v-${idx}`}>
                        <line
                            x1={x}
                            y1='0'
                            x2={x}
                            y2='540'
                            stroke='rgba(255, 255, 255, 0.025)'
                        />
                        <text
                            x={x}
                            y='515'
                            textAnchor='middle'
                            fill='rgba(148, 163, 184, 0.25)'
                            fontSize='9'
                            fontFamily='monospace'
                        >
                            {`${String(9 + idx).padStart(2, '0')}:00`}
                        </text>
                    </g>
                ))}

                {/* Area Gradient Fill under EMA 9 */}
                <path d={areaFillPath} fill='url(#fcAreaGrad)' />

                {/* Volume Histogram along bottom */}
                {candles.map((c, idx) => (
                    <rect
                        key={`vol-${idx}`}
                        x={c.x - 7}
                        y={495 - c.volume}
                        width={14}
                        height={c.volume}
                        rx='2'
                        fill={c.isUp ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}
                    />
                ))}

                {/* Candlestick Wicks and Bodies */}
                {candles.map((c, idx) => {
                    const top = Math.min(c.open, c.close);
                    const height = Math.max(5, Math.abs(c.close - c.open));
                    const isLast = idx === candles.length - 1;

                    return (
                        <g key={`candle-${idx}`} className={isLast ? 'fc-active-candle' : ''}>
                            {/* High/Low Wick Line */}
                            <line
                                x1={c.x}
                                y1={isLast ? c.high + liveTickOffset * 0.45 : c.high}
                                x2={c.x}
                                y2={isLast ? c.low + liveTickOffset * 0.45 : c.low}
                                stroke={c.isUp ? '#10b981' : '#ef4444'}
                                strokeWidth='1.6'
                                strokeLinecap='round'
                                opacity='0.85'
                            />

                            {/* Candle Real Body */}
                            <rect
                                x={c.x - 7.5}
                                y={isLast ? top + liveTickOffset : top}
                                width={15}
                                height={isLast ? Math.max(5, height + Math.abs(liveTickOffset)) : height}
                                rx='2.5'
                                fill={c.isUp ? 'url(#fcBullGrad)' : 'url(#fcBearGrad)'}
                                stroke={c.isUp ? '#34d399' : '#f87171'}
                                strokeWidth='1'
                                opacity={isLast ? '1' : '0.88'}
                            />
                        </g>
                    );
                })}

                {/* 50 EMA Trendline (Neon Amber Dashed) */}
                <path
                    d={ema50Path}
                    fill='none'
                    stroke='#f59e0b'
                    strokeWidth='2'
                    strokeDasharray='6 5'
                    opacity='0.65'
                    filter='url(#fcNeonGlowGold)'
                />

                {/* 21 EMA Trendline (Electric Indigo Soft Glow) */}
                <path
                    d={ema21Path}
                    fill='none'
                    stroke='#818cf8'
                    strokeWidth='2'
                    opacity='0.75'
                />

                {/* 9 EMA Trendline (Neon Cyan Leading Laser Line) */}
                <path
                    d={ema9Path}
                    fill='none'
                    stroke='#00f5ff'
                    strokeWidth='2.8'
                    filter='url(#fcNeonGlowCyan)'
                    opacity='0.9'
                    className='fc-ema-laser'
                />

                {/* Current Active Bid/Ask Price Ray */}
                <line
                    x1='0'
                    y1={currentPriceY}
                    x2='1180'
                    y2={currentPriceY}
                    stroke={isTickUp ? '#10b981' : '#00f5ff'}
                    strokeWidth='1.5'
                    strokeDasharray='6 4'
                    opacity='0.9'
                />

                {/* Pulsing Beacon at Current Price Coordinate */}
                {lastCandle && (
                    <g transform={`translate(${lastCandle.x}, ${currentPriceY})`}>
                        <circle r='14' fill={isTickUp ? 'rgba(16, 185, 129, 0.35)' : 'rgba(0, 245, 255, 0.35)'} className='fc-pulse-ring' />
                        <circle r='5' fill='#ffffff' stroke={isTickUp ? '#10b981' : '#00f5ff'} strokeWidth='2.5' />
                    </g>
                )}

                {/* Glowing Price Tag Pill */}
                <g transform={`translate(1040, ${currentPriceY - 13})`}>
                    <rect
                        x='0'
                        y='0'
                        width='115'
                        height='26'
                        rx='6'
                        fill={isTickUp ? '#10b981' : '#00f5ff'}
                        filter='url(#fcNeonGlowCyan)'
                    />
                    <text
                        x='57.5'
                        y='17'
                        textAnchor='middle'
                        fill='#060911'
                        fontWeight='900'
                        fontSize='12'
                        fontFamily='monospace'
                    >
                        {livePrice} {isTickUp ? '▲ LIVE' : '▼ LIVE'}
                    </text>
                </g>

                {/* Floating Constellation Particles */}
                {particles.map(p => (
                    <circle
                        key={`particle-${p.id}`}
                        cx={p.x}
                        cy={p.y}
                        r={p.r}
                        fill='#00f5ff'
                        opacity={p.opacity}
                        style={{
                            animation: `fcParticleFloat ${p.dur}s ease-in-out infinite alternate`,
                        }}
                    />
                ))}
            </svg>

            {/* Radial Vignette Mask */}
            <div className='fc-vignette' />
        </div>
    );
};

export default ForexChartsBackground;
