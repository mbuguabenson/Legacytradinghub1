import React from 'react';
import { AlertCircle, ShieldCheck, Zap } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

export const ApexConfirmationModal: React.FC = observer(() => {
    const { apex } = useStore();

    if (!apex || !apex.is_confirm_modal_open) return null;

    const {
        closeConfirmModal,
        startAutotrading,
        selected_symbol,
        active_symbols,
        current_snapshot,
        risk_settings,
        trade_mode,
    } = apex;

    const symObj = active_symbols.find(s => s.symbol === selected_symbol);
    const displayName = symObj?.display_name || selected_symbol;
    const snapshot = current_snapshot;
    const direction = snapshot?.dominantSide || 'UNDER';
    const contract = direction === 'UNDER' ? 'DIGITUNDER 6' : 'DIGITOVER 3';

    return (
        <div className='apex-modal-overlay' onClick={closeConfirmModal}>
            <div className='apex-modal-box' onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                    <ShieldCheck size={24} color='#38bdf8' />
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                        START APEX AUTOTRADING?
                    </h3>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem' }}>
                    Apex 3.0 will continuously monitor this market and execute verified entries when all 10 directional confirmation gates pass.
                </p>

                {/* Strategy Snapshot Details */}
                <div
                    style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.6rem',
                        fontSize: '0.85rem',
                        marginBottom: '1.25rem',
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Target Market:</span>
                        <strong style={{ color: '#f8fafc' }}>{displayName}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Mode:</span>
                        <strong style={{ color: trade_mode === 'LIVE' ? '#f59e0b' : '#38bdf8' }}>
                            {trade_mode === 'LIVE' ? 'REAL MONEY (LIVE)' : 'PAPER SIMULATION'}
                        </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Dominant Direction:</span>
                        <strong style={{ color: direction === 'UNDER' ? '#10b981' : '#f43f5e' }}>
                            {direction}
                        </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Allowed Contract:</span>
                        <strong style={{ color: '#8b5cf6' }}>{contract}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Current Apex Quality:</span>
                        <strong style={{ color: '#38bdf8' }}>{snapshot?.apexScore ?? 0} / 100</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Current Stability:</span>
                        <strong style={{ color: '#10b981' }}>{snapshot?.stabilityScore ?? 0} / 100</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Maximum Sequence Limit:</span>
                        <strong style={{ color: '#f8fafc' }}>{risk_settings.maxRunsPerSequence} Trades</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Stake per Entry:</span>
                        <strong style={{ color: '#f8fafc' }}>${risk_settings.stake.toFixed(2)} (Flat Stake — No Martingale)</strong>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        marginBottom: '1.25rem',
                    }}
                >
                    <AlertCircle size={14} color='#f59e0b' />
                    <span>
                        Engine auto-pauses immediately upon reaching 5 runs or if market momentum degrades.
                    </span>
                </div>

                {/* Modal Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button className='apex-btn' onClick={closeConfirmModal}>
                        CANCEL
                    </button>
                    <button className='apex-btn apex-btn--primary' onClick={startAutotrading}>
                        <Zap size={14} />
                        START AUTO TRADING
                    </button>
                </div>
            </div>
        </div>
    );
});
