import React from 'react';
import { BarChart3, Info } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

export const ApexDistributionCards: React.FC = observer(() => {
    const { apex } = useStore();

    if (!apex) return null;

    const snapshot = apex.current_snapshot;
    if (!snapshot) return null;

    const {
        under04Pct,
        over59Pct,
        under04Count,
        over59Count,
        under05Pct,
        over49Pct,
        under05Count,
        over49Count,
        last20,
        last10,
        last7,
        last5,
        last3,
        digitFrequencies,
        ticks50,
    } = snapshot;

    const totalTicks = Math.max(ticks50.length, 1);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Primary Distribution Cards (Window A & Window B) */}
            <div className='distribution-grid'>
                {/* CARD 1: WINDOW A (0-4 vs 5-9) */}
                <div className='distribution-card'>
                    <div className='dist-title'>
                        <span>PRIMARY WINDOW A (0-4 vs 5-9)</span>
                        <span style={{ color: '#38bdf8' }}>50 TICKS</span>
                    </div>

                    <div className='dist-row'>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>UNDER 0-4</span>
                        <span className='dist-val' style={{ color: '#10b981' }}>
                            {under04Count} / {totalTicks} ({under04Pct}%)
                        </span>
                    </div>
                    <div className='dist-bar-track'>
                        <div
                            className='dist-bar-fill fill-under'
                            style={{ width: `${Math.min(100, under04Pct)}%` }}
                        />
                    </div>

                    <div className='dist-row'>
                        <span style={{ color: '#f43f5e', fontWeight: 600 }}>OVER 5-9</span>
                        <span className='dist-val' style={{ color: '#f43f5e' }}>
                            {over59Count} / {totalTicks} ({over59Pct}%)
                        </span>
                    </div>
                    <div className='dist-bar-track'>
                        <div
                            className='dist-bar-fill fill-over'
                            style={{ width: `${Math.min(100, over59Pct)}%` }}
                        />
                    </div>

                    <div className='dist-overlap-note'>
                        Standard binary partition: Digits [0,1,2,3,4] vs [5,6,7,8,9].
                    </div>
                </div>

                {/* CARD 2: WINDOW B (0-5 vs 4-9 Overlapping) */}
                <div className='distribution-card'>
                    <div className='dist-title'>
                        <span>EXECUTION WINDOW B (0-5 vs 4-9)</span>
                        <span style={{ color: '#8b5cf6' }}>DERIV TARGETS</span>
                    </div>

                    <div className='dist-row'>
                        <span style={{ color: '#34d399', fontWeight: 600 }}>UNDER 0-5 (UNDER 6)</span>
                        <span className='dist-val' style={{ color: '#34d399' }}>
                            {under05Count} / {totalTicks} ({under05Pct}%)
                        </span>
                    </div>
                    <div className='dist-bar-track'>
                        <div
                            className='dist-bar-fill fill-under'
                            style={{ width: `${Math.min(100, under05Pct)}%` }}
                        />
                    </div>

                    <div className='dist-row'>
                        <span style={{ color: '#fb7185', fontWeight: 600 }}>OVER 4-9 (OVER 3)</span>
                        <span className='dist-val' style={{ color: '#fb7185' }}>
                            {over49Count} / {totalTicks} ({over49Pct}%)
                        </span>
                    </div>
                    <div className='dist-bar-track'>
                        <div
                            className='dist-bar-fill fill-over'
                            style={{ width: `${Math.min(100, over49Pct)}%` }}
                        />
                    </div>

                    <div className='dist-overlap-note' style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={12} color='#38bdf8' />
                        <span>
                            Digit 4 is intentionally included in BOTH groups. Total does NOT equal 100%.
                        </span>
                    </div>
                </div>
            </div>

            {/* Recency Momentum Windows (Last 20, 10, 7, 5, 3) */}
            <div className='apex-card'>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={16} color='#38bdf8' />
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            RECENCY MOMENTUM SPECTRUM
                        </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        Under (0-4) vs Over (5-9)
                    </span>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                        gap: '0.75rem',
                    }}
                >
                    {[
                        { label: 'LAST 20', data: last20 },
                        { label: 'LAST 10', data: last10 },
                        { label: 'LAST 7', data: last7 },
                        { label: 'LAST 5', data: last5 },
                        { label: 'LAST 3', data: last3 },
                    ].map(w => {
                        const isUnderDominant = w.data.underCount >= w.data.overCount;
                        return (
                            <div
                                key={w.label}
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '8px',
                                    padding: '0.6rem 0.75rem',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.7rem',
                                        color: '#94a3b8',
                                        fontWeight: 700,
                                        marginBottom: '0.35rem',
                                    }}
                                >
                                    <span>{w.label}</span>
                                    <span style={{ color: isUnderDominant ? '#10b981' : '#f43f5e' }}>
                                        {isUnderDominant ? 'UNDER' : 'OVER'}
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.85rem',
                                        fontFamily: 'JetBrains Mono',
                                        fontWeight: 700,
                                        marginBottom: '0.35rem',
                                    }}
                                >
                                    <span style={{ color: '#10b981' }}>{w.data.underCount}U</span>
                                    <span style={{ color: '#f43f5e' }}>{w.data.overCount}O</span>
                                </div>

                                <div
                                    style={{
                                        height: '4px',
                                        background: 'rgba(244, 63, 94, 0.8)',
                                        borderRadius: '2px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            height: '100%',
                                            background: '#10b981',
                                            width: `${w.data.underPct}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Digit Frequency 0-9 Distribution Grid */}
            <div className='apex-card'>
                <div
                    style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '0.6rem',
                    }}
                >
                    DIGIT FREQUENCY DISTRIBUTION (0–9)
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(10, 1fr)',
                        gap: '0.4rem',
                    }}
                >
                    {digitFrequencies.map(df => {
                        const isUnder = df.digit <= 4;
                        const isSelected = apex.last_digit === df.digit;

                        return (
                            <div
                                key={df.digit}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    padding: '0.5rem 0.2rem',
                                    background: isSelected
                                        ? 'rgba(56, 189, 248, 0.2)'
                                        : 'rgba(15, 23, 42, 0.5)',
                                    borderRadius: '6px',
                                    border: isSelected
                                        ? '1px solid #38bdf8'
                                        : '1px solid rgba(255, 255, 255, 0.05)',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 900,
                                        color: isUnder ? '#10b981' : '#f43f5e',
                                        fontFamily: 'JetBrains Mono',
                                    }}
                                >
                                    {df.digit}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#f8fafc', fontWeight: 700 }}>
                                    {df.count}
                                </span>
                                <span style={{ fontSize: '0.62rem', color: '#64748b' }}>
                                    {df.percentage}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});
