import React from 'react';
import {
    AlertCircle,
    Compass,
    Pause,
    Play,
    RefreshCw,
    Shield,
    StopCircle,
    Timer,
    Zap,
} from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

export const ApexExecutionPanel: React.FC = observer(() => {
    const { apex } = useStore();

    if (!apex) return null;

    const {
        is_autotrading_enabled,
        is_paused,
        pause_reason,
        trade_mode,
        sequence_runs,
        risk_settings,
        cooldown_seconds_remaining,
        daily_session_pl,
        openConfirmModal,
        pauseAutotrading,
        resumeAutotrading,
        stopAutotrading,
        resetSequenceRuns,
    } = apex;

    const isLive = trade_mode === 'LIVE';
    const maxRuns = risk_settings.maxRunsPerSequence;
    const isRunLimitReached = sequence_runs >= maxRuns;

    return (
        <div className='apex-card' style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header: Autotrading Master Switch */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Shield size={18} color={is_autotrading_enabled ? '#10b981' : '#94a3b8'} />
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                        EXECUTION ENGINE
                    </span>
                </div>

                <span
                    className={`apex-badge ${
                        is_autotrading_enabled
                            ? is_paused
                                ? 'apex-badge--watch'
                                : 'apex-badge--prime'
                            : 'apex-badge--good'
                    }`}
                >
                    {is_autotrading_enabled
                        ? is_paused
                            ? 'PAUSED'
                            : 'ACTIVE TRADING'
                        : 'IDLE'}
                </span>
            </div>

            {/* Mode Banner (Live vs Simulation) */}
            <div
                style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: isLive ? 'rgba(245, 158, 11, 0.12)' : 'rgba(56, 189, 248, 0.12)',
                    border: `1px solid ${isLive ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isLive ? <Zap size={16} color='#f59e0b' /> : <Compass size={16} color='#38bdf8' />}
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc' }}>
                        {isLive ? 'REAL DERIV EXECUTION' : 'PAPER SIMULATION MODE'}
                    </span>
                </div>
                <span
                    style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: isLive ? '#f59e0b' : '#38bdf8',
                    }}
                >
                    {isLive ? 'Live Capital' : 'Virtual P/L'}
                </span>
            </div>

            {/* Sequence 5-Run Tracker */}
            <div
                style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        marginBottom: '0.5rem',
                    }}
                >
                    <span>SEQUENCE PROGRESS</span>
                    <strong style={{ color: isRunLimitReached ? '#f43f5e' : '#f8fafc' }}>
                        RUN {sequence_runs} OF {maxRuns}
                    </strong>
                </div>

                {/* Visual Progress Steps */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '0.5rem' }}>
                    {Array.from({ length: maxRuns }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                flex: 1,
                                height: '6px',
                                borderRadius: '3px',
                                background:
                                    i < sequence_runs
                                        ? '#10b981'
                                        : 'rgba(255, 255, 255, 0.08)',
                            }}
                        />
                    ))}
                </div>

                {isRunLimitReached && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginTop: '0.5rem',
                        }}
                    >
                        <span style={{ fontSize: '0.72rem', color: '#f43f5e', fontWeight: 600 }}>
                            Sequence limit reached.
                        </span>
                        <button
                            className='apex-btn apex-btn--sm apex-btn--success'
                            onClick={resetSequenceRuns}
                        >
                            <RefreshCw size={12} />
                            APPROVE NEXT 5 RUNS
                        </button>
                    </div>
                )}
            </div>

            {/* Live Metrics: Cooldown & P/L */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>COOLDOWN</span>
                    <div
                        style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: cooldown_seconds_remaining > 0 ? '#f59e0b' : '#10b981',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '2px',
                        }}
                    >
                        <Timer size={14} />
                        {cooldown_seconds_remaining > 0 ? `${cooldown_seconds_remaining}s` : 'READY'}
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        padding: '0.6rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>SESSION P/L</span>
                    <div
                        style={{
                            fontSize: '1rem',
                            fontWeight: 800,
                            color: daily_session_pl >= 0 ? '#10b981' : '#f43f5e',
                            marginTop: '2px',
                        }}
                    >
                        {daily_session_pl >= 0 ? `+$${daily_session_pl.toFixed(2)}` : `-$${Math.abs(daily_session_pl).toFixed(2)}`}
                    </div>
                </div>
            </div>

            {/* Blocked or Paused Notice if Any */}
            {is_paused && pause_reason && (
                <div
                    style={{
                        background: 'rgba(244, 63, 94, 0.1)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        display: 'flex',
                        alignItems: 'start',
                        gap: '0.5rem',
                    }}
                >
                    <AlertCircle size={16} color='#f43f5e' style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ fontSize: '0.75rem', color: '#f8fafc' }}>
                        <strong style={{ color: '#f43f5e' }}>AUTO PAUSED:</strong> {pause_reason}
                    </div>
                </div>
            )}

            {/* Master Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                {!is_autotrading_enabled ? (
                    <button
                        className='apex-btn apex-btn--primary'
                        style={{ flex: 1, padding: '0.75rem' }}
                        onClick={openConfirmModal}
                    >
                        <Play size={16} />
                        START APEX AUTOTRADE
                    </button>
                ) : is_paused ? (
                    <>
                        <button
                            className='apex-btn apex-btn--success'
                            style={{ flex: 1, padding: '0.75rem' }}
                            onClick={resumeAutotrading}
                        >
                            <Play size={16} />
                            RESUME
                        </button>
                        <button
                            className='apex-btn apex-btn--danger'
                            style={{ padding: '0.75rem' }}
                            onClick={stopAutotrading}
                        >
                            <StopCircle size={16} />
                            STOP
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            className='apex-btn apex-btn--warning'
                            style={{ flex: 1, padding: '0.75rem' }}
                            onClick={() => pauseAutotrading('Paused by trader')}
                        >
                            <Pause size={16} />
                            PAUSE
                        </button>
                        <button
                            className='apex-btn apex-btn--danger'
                            style={{ padding: '0.75rem' }}
                            onClick={stopAutotrading}
                        >
                            <StopCircle size={16} />
                            STOP
                        </button>
                    </>
                )}
            </div>
        </div>
    );
});
