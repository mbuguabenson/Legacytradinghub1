import React from 'react';
import { Cpu, Info } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

export const ApexEntryDigitCard: React.FC = observer(() => {
    const { apex } = useStore();

    if (!apex) return null;

    const snapshot = apex.current_snapshot;
    if (!snapshot) return null;

    const { underEntryDigit, activeEntryDigit } = snapshot;

    const currentEntry = activeEntryDigit || underEntryDigit;
    const isUnder = currentEntry.eligibleSide === 'UNDER';

    return (
        <div className='apex-card'>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Cpu size={17} color='#f59e0b' />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.04em' }}>
                        APEX ENTRY DIGIT INTELLIGENCE
                    </span>
                </div>
                <span className='apex-badge apex-badge--good' style={{ fontSize: '0.68rem' }}>
                    RECENCY WEIGHTED (60% LAST 10)
                </span>
            </div>

            {/* Glowing Entry Digit Box */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isUnder
                        ? 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.6) 90%)'
                        : 'radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, rgba(15, 23, 42, 0.6) 90%)',
                    border: `1px solid ${isUnder ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                    borderRadius: '12px',
                    padding: '1rem 1.25rem',
                }}
            >
                <div>
                    <span
                        style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isUnder ? '#10b981' : '#f43f5e',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                        }}
                    >
                        {isUnder ? 'OPTIMAL UNDER ENTRY DIGIT' : 'OPTIMAL OVER ENTRY DIGIT'}
                    </span>
                    <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px' }}>
                        Eligible digits: {isUnder ? '[0, 1, 2, 3, 4, 5]' : '[4, 5, 6, 7, 8, 9]'}
                    </div>
                </div>

                <div
                    style={{
                        width: '58px',
                        height: '58px',
                        borderRadius: '12px',
                        background: isUnder ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
                        border: `2px solid ${isUnder ? '#10b981' : '#f43f5e'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2.2rem',
                        fontWeight: 900,
                        fontFamily: 'JetBrains Mono',
                        color: isUnder ? '#10b981' : '#f43f5e',
                        boxShadow: isUnder
                            ? '0 0 20px rgba(16, 185, 129, 0.4)'
                            : '0 0 20px rgba(244, 63, 94, 0.4)',
                    }}
                >
                    {currentEntry.digit}
                </div>
            </div>

            {/* Metrics Breakdown */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.5rem',
                    marginTop: '0.85rem',
                }}
            >
                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '0.5rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>50-Tick Count</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                        {currentEntry.frequency50} / 50
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '0.5rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Last 7 Count</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                        {currentEntry.recentFrequency} / 7
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '0.5rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Momentum</span>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: currentEntry.momentum === 'RISING' ? '#10b981' : '#f59e0b',
                        }}
                    >
                        {currentEntry.momentum}
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '0.5rem 0.6rem',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Confidence</span>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
                        {currentEntry.confidence}%
                    </div>
                </div>
            </div>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.7rem',
                    color: '#64748b',
                    marginTop: '0.75rem',
                    lineHeight: 1.3,
                }}
            >
                <Info size={12} />
                <span>
                    Entry digit evaluates statistical clustering & timing context. Never treated as deterministic prediction.
                </span>
            </div>
        </div>
    );
});
