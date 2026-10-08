import React from 'react';
import {
    Flame,
    Gauge,
    ShieldCheck,
    TrendingDown,
    TrendingUp,
    Zap,
} from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

export const ApexIntelligencePanel: React.FC = observer(() => {
    const { apex } = useStore();

    if (!apex) return null;

    const {
        current_price,
        last_digit,
        current_snapshot,
        selected_symbol,
        active_symbols,
        engine_state,
        state_reason,
    } = apex;

    const symObj = active_symbols.find(s => s.symbol === selected_symbol);
    const displayName = symObj?.display_name || selected_symbol;

    const snapshot = current_snapshot;
    const apexScore = snapshot?.apexScore ?? 50;
    const scoreClass = snapshot?.scoreClass ?? 'NO TRADE';
    const stabilityScore = snapshot?.stabilityScore ?? 50;
    const stabilityClass = snapshot?.stabilityClass ?? 'MODERATE';
    const momentum = snapshot?.momentum ?? 'STABLE';
    const reversalRisk = snapshot?.reversalRisk ?? 'LOW';
    const dominantSide = snapshot?.dominantSide ?? 'NEUTRAL';
    const signalStatus = snapshot?.signalStatus ?? 'WATCH';

    const isDigitUnder = last_digit <= 4;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Top Market Header Bar */}
            <div
                className='apex-card'
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    padding: '0.85rem 1.25rem',
                }}
            >
                <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        ACTIVE QUANTITATIVE TARGET
                    </span>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
                        {displayName}
                    </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                        className={`apex-badge ${
                            dominantSide === 'UNDER'
                                ? 'apex-badge--under'
                                : dominantSide === 'OVER'
                                ? 'apex-badge--over'
                                : 'apex-badge--good'
                        }`}
                    >
                        {dominantSide === 'UNDER' && <TrendingDown size={14} />}
                        {dominantSide === 'OVER' && <TrendingUp size={14} />}
                        {dominantSide} REGIME
                    </span>

                    <span
                        className={`apex-badge apex-badge--${
                            scoreClass === 'APEX PRIME'
                                ? 'prime'
                                : scoreClass === 'EXCELLENT'
                                ? 'excellent'
                                : scoreClass === 'GOOD'
                                ? 'good'
                                : scoreClass === 'WATCH'
                                ? 'watch'
                                : 'notrade'
                        }`}
                    >
                        {scoreClass}
                    </span>
                </div>
            </div>

            {/* Glowing Last Digit Display HUD */}
            <div className='apex-hud-digit-box'>
                <span className='hud-digit-label'>LAST MEANINGFUL DIGIT</span>
                <div className={`hud-digit-display ${isDigitUnder ? 'digit-under' : 'digit-over'}`}>
                    {last_digit}
                </div>
                <div className='hud-price-row'>
                    <span className='hud-price-label'>CURRENT PRICE:</span>
                    <span className='hud-price-val'>{current_price}</span>
                </div>
            </div>

            {/* Main Intelligence Grid of Indicators */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem',
                }}
            >
                {/* 1. Apex Score */}
                <div className='apex-card' style={{ padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem' }}>
                        <span>APEX SCORE</span>
                        <Gauge size={13} color='#38bdf8' />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc', margin: '0.25rem 0' }}>
                        {apexScore} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 100</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
                        {scoreClass}
                    </span>
                </div>

                {/* 2. Stability Score */}
                <div className='apex-card' style={{ padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem' }}>
                        <span>STABILITY</span>
                        <ShieldCheck size={13} color='#10b981' />
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f8fafc', margin: '0.25rem 0' }}>
                        {stabilityScore} <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ 100</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>
                        {stabilityClass}
                    </span>
                </div>

                {/* 3. Momentum */}
                <div className='apex-card' style={{ padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem' }}>
                        <span>MOMENTUM</span>
                        <Flame size={13} color='#f59e0b' />
                    </div>
                    <div
                        style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            margin: '0.35rem 0',
                            color:
                                momentum === 'INCREASING'
                                    ? '#10b981'
                                    : momentum === 'REVERSING'
                                    ? '#f43f5e'
                                    : '#f59e0b',
                        }}
                    >
                        {momentum}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Reversal Risk: <strong style={{ color: reversalRisk === 'HIGH' ? '#f43f5e' : '#10b981' }}>{reversalRisk}</strong>
                    </span>
                </div>

                {/* 4. Entry Contract */}
                <div className='apex-card' style={{ padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem' }}>
                        <span>CONTRACT TARGET</span>
                        <Zap size={13} color='#8b5cf6' />
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#8b5cf6', margin: '0.35rem 0' }}>
                        {dominantSide === 'UNDER' ? 'DIGITUNDER 6' : dominantSide === 'OVER' ? 'DIGITOVER 3' : 'NO CONTRACT'}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {dominantSide === 'UNDER' ? 'Wins: 0,1,2,3,4,5' : dominantSide === 'OVER' ? 'Wins: 4,5,6,7,8,9' : 'Awaiting bias'}
                    </span>
                </div>
            </div>

            {/* Current State / Decision Explanation Bar */}
            <div
                style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                }}
            >
                <div
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: signalStatus === 'READY' ? '#10b981' : signalStatus === 'FORMING' ? '#38bdf8' : '#f59e0b',
                        boxShadow: `0 0 8px ${signalStatus === 'READY' ? '#10b981' : '#38bdf8'}`,
                    }}
                />
                <div style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                    <strong style={{ color: '#f8fafc', marginRight: '6px' }}>STATE: {engine_state}</strong>
                    <span style={{ color: '#94a3b8' }}>— {state_reason}</span>
                </div>
            </div>
        </div>
    );
});
