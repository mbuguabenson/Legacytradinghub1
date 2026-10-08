import React from 'react';
import { Eye, Lightbulb, Pause, Play } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

export const ApexObservationMode: React.FC = observer(() => {
    const { apex } = useStore();

    if (!apex) return null;

    const {
        is_observation_mode_active,
        observation_elapsed_seconds,
        target_observation_seconds,
        toggleObservationMode,
        regime_duration_seconds,
        reversal_count,
        regime_durations_history,
        current_snapshot,
    } = apex;

    const formatTimer = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate average regime duration
    const avgDuration =
        regime_durations_history.length > 0
            ? Math.round(
                  regime_durations_history.reduce((acc, curr) => acc + curr.duration, 0) /
                      regime_durations_history.length
              )
            : regime_duration_seconds;

    // Generate human-like synthesized market understanding text (Section 52)
    const snapshot = current_snapshot;
    let marketUnderstanding = 'Market is warming up ticks. Observing initial distribution...';

    if (snapshot && snapshot.ticks50.length >= 25) {
        const isUnder = snapshot.dominantSide === 'UNDER';
        const isOver = snapshot.dominantSide === 'OVER';
        const isReversing = snapshot.momentum === 'REVERSING';
        const isIncreasing = snapshot.momentum === 'INCREASING';
        const isStable = snapshot.stabilityScore >= 65;

        if (isReversing) {
            marketUnderstanding = `Historical ${isUnder ? 'Under' : 'Over'} dominance remains in the 50-tick buffer, but recent 10 and 7 tick momentum has shifted sharply toward ${isUnder ? 'Over' : 'Under'}. Regime change in progress. No trade authorized. Waiting for fresh confirmation.`;
        } else if ((isUnder || isOver) && isIncreasing && isStable) {
            marketUnderstanding = `${isUnder ? 'Under' : 'Over'} remains dominant across the 50 and 25 tick windows (${isUnder ? snapshot.under04Pct : snapshot.over59Pct}%). Recent 10 and 7 tick momentum confirms the direction. Current regime is stable (${formatTimer(regime_duration_seconds)}). Entry timing is favourable for ${isUnder ? 'DIGITUNDER 6' : 'DIGITOVER 3'}.`;
        } else if ((isUnder || isOver) && !isStable) {
            marketUnderstanding = `${isUnder ? 'Under' : 'Over'} shows directional bias, but market stability (${snapshot.stabilityScore}/100) is insufficient. Regime has reversed ${reversal_count} times. Waiting for sustained clustering.`;
        } else {
            marketUnderstanding = `Digit distribution is balanced between Under (${snapshot.under04Pct}%) and Over (${snapshot.over59Pct}%). No clear directional regime detected. Engine is maintaining observation.`;
        }
    }

    const progressPct = Math.min(
        100,
        Math.round((observation_elapsed_seconds / target_observation_seconds) * 100)
    );

    return (
        <div className='apex-card'>
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Eye size={17} color='#38bdf8' />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                        30-MINUTE HUMAN ANALYSIS MODE
                    </span>
                </div>

                <button
                    className={`apex-btn apex-btn--sm ${
                        is_observation_mode_active ? 'apex-btn--warning' : 'apex-btn--primary'
                    }`}
                    onClick={toggleObservationMode}
                >
                    {is_observation_mode_active ? <Pause size={12} /> : <Play size={12} />}
                    {is_observation_mode_active ? 'PAUSE OBSERVATION' : 'START 30M OBSERVATION'}
                </button>
            </div>

            {/* Stopwatch & Metrics Grid */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.65rem',
                    marginBottom: '0.85rem',
                }}
            >
                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>OBSERVATION TIME</span>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            fontFamily: 'JetBrains Mono',
                            color: '#38bdf8',
                            marginTop: '2px',
                        }}
                    >
                        {formatTimer(observation_elapsed_seconds)}{' '}
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            / {formatTimer(target_observation_seconds)}
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>CURRENT REGIME DURATION</span>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            fontFamily: 'JetBrains Mono',
                            color: '#10b981',
                            marginTop: '2px',
                        }}
                    >
                        {formatTimer(regime_duration_seconds)}
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>AVG REGIME DURATION</span>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            fontFamily: 'JetBrains Mono',
                            color: '#f8fafc',
                            marginTop: '2px',
                        }}
                    >
                        {formatTimer(avgDuration)}
                    </div>
                </div>

                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        padding: '0.65rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>REVERSALS DETECTED</span>
                    <div
                        style={{
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            fontFamily: 'JetBrains Mono',
                            color: reversal_count > 3 ? '#f43f5e' : '#f59e0b',
                            marginTop: '2px',
                        }}
                    >
                        {reversal_count}
                    </div>
                </div>
            </div>

            {/* Observation Target Progress Bar */}
            <div style={{ marginBottom: '0.85rem' }}>
                <div
                    style={{
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #38bdf8, #10b981)',
                            width: `${progressPct}%`,
                            transition: 'width 0.4s ease',
                        }}
                    />
                </div>
            </div>

            {/* Synthesized Market Understanding Text */}
            <div
                style={{
                    background: 'rgba(15, 23, 42, 0.5)',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '8px',
                    padding: '0.85rem 1rem',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        marginBottom: '0.35rem',
                    }}
                >
                    <Lightbulb size={14} />
                    MARKET UNDERSTANDING SYNTHESIS
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                    &ldquo;{marketUnderstanding}&rdquo;
                </p>
            </div>
        </div>
    );
});
