import React, { useState } from 'react';
import { BookOpen, CheckCircle, HelpCircle, Trash2, XCircle } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { TTradeJournalItem } from '../types';

export const ApexTradeJournal: React.FC = observer(() => {
    const { apex } = useStore();
    const [selectedTrade, setSelectedTrade] = useState<TTradeJournalItem | null>(null);

    if (!apex) return null;

    const { trade_journal, clearJournal } = apex;

    const totalTrades = trade_journal.length;
    const wins = trade_journal.filter(t => t.exitResult === 'WIN').length;
    const losses = trade_journal.filter(t => t.exitResult === 'LOSS').length;
    const netProfit = trade_journal.reduce((acc, t) => acc + (t.profit || 0), 0);
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0.0';

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
                    <BookOpen size={17} color='#38bdf8' />
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, letterSpacing: '0.04em' }}>
                        APEX TRADE JOURNAL & EXPLAINABLE REPLAY
                    </span>
                    <span className='apex-badge apex-badge--good' style={{ fontSize: '0.68rem' }}>
                        {totalTrades} TRADES LOGGED
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Win Rate:{' '}
                        <strong style={{ color: Number(winRate) >= 60 ? '#10b981' : '#f8fafc' }}>
                            {winRate}%
                        </strong>{' '}
                        ({wins}W / {losses}L)
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Net P/L:{' '}
                        <strong style={{ color: netProfit >= 0 ? '#10b981' : '#f43f5e' }}>
                            {netProfit >= 0 ? `+$${netProfit.toFixed(2)}` : `-$${Math.abs(netProfit).toFixed(2)}`}
                        </strong>
                    </span>

                    {totalTrades > 0 && (
                        <button
                            className='apex-btn apex-btn--sm'
                            onClick={clearJournal}
                            title='Clear journal history'
                        >
                            <Trash2 size={12} />
                            CLEAR
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            {totalTrades === 0 ? (
                <div
                    style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '0.82rem',
                    }}
                >
                    No trades executed yet in this session. Start autotrading or wait for confirmed signal.
                </div>
            ) : (
                <div className='scanner-table-wrap' style={{ maxHeight: '260px' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Market</th>
                                <th>Type</th>
                                <th>Digit</th>
                                <th>Stake</th>
                                <th>Score</th>
                                <th>Stability</th>
                                <th>Last 10</th>
                                <th>Last 7</th>
                                <th>Result</th>
                                <th>Profit/Loss</th>
                                <th>Explainability</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trade_journal.map(t => {
                                const isWin = t.exitResult === 'WIN';
                                const isLoss = t.exitResult === 'LOSS';
                                const timeStr = new Date(t.timestamp).toLocaleTimeString();

                                return (
                                    <tr key={t.id} onClick={() => setSelectedTrade(t)}>
                                        <td style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{timeStr}</td>
                                        <td style={{ fontWeight: 700 }}>{t.displayName.replace(' Index', '')}</td>
                                        <td>
                                            <span
                                                className={`apex-badge ${
                                                    t.direction === 'UNDER' ? 'apex-badge--under' : 'apex-badge--over'
                                                }`}
                                                style={{ fontSize: '0.68rem', padding: '1px 5px' }}
                                            >
                                                {t.contractType} {t.barrier}
                                            </span>
                                        </td>
                                        <td style={{ fontWeight: 800, textAlign: 'center' }}>{t.entryDigit}</td>
                                        <td>${t.stake.toFixed(2)}</td>
                                        <td>
                                            <span className='apex-badge apex-badge--good' style={{ fontSize: '0.68rem' }}>
                                                {t.apexScore}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: '0.75rem' }}>{t.stabilityScore}</td>
                                        <td>{t.last10}</td>
                                        <td>{t.last7}</td>
                                        <td>
                                            {isWin ? (
                                                <span style={{ color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <CheckCircle size={13} /> WIN
                                                </span>
                                            ) : isLoss ? (
                                                <span style={{ color: '#f43f5e', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <XCircle size={13} /> LOSS
                                                </span>
                                            ) : (
                                                <span style={{ color: '#f59e0b', fontWeight: 600 }}>PENDING</span>
                                            )}
                                        </td>
                                        <td style={{ fontWeight: 800, color: (t.profit || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                                            {t.profit !== undefined ? `${t.profit >= 0 ? '+' : ''}$${t.profit.toFixed(2)}` : '-'}
                                        </td>
                                        <td>
                                            <button
                                                className='apex-btn apex-btn--sm'
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    setSelectedTrade(t);
                                                }}
                                            >
                                                <HelpCircle size={12} />
                                                INSPECT
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Explainable Decision Replay Modal / Detail Popup */}
            {selectedTrade && (
                <div className='apex-modal-overlay' onClick={() => setSelectedTrade(null)}>
                    <div className='apex-modal-box' onClick={e => e.stopPropagation()}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1rem',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                paddingBottom: '0.75rem',
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                                SIGNAL DECISION EXPLAINABILITY REPLAY
                            </h3>
                            <button
                                className='apex-btn apex-btn--sm'
                                onClick={() => setSelectedTrade(null)}
                            >
                                CLOSE
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Target Market:</span>{' '}
                                <strong>{selectedTrade.displayName}</strong> ({selectedTrade.market})
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Execution Order:</span>{' '}
                                <strong style={{ color: selectedTrade.direction === 'UNDER' ? '#10b981' : '#f43f5e' }}>
                                    {selectedTrade.contractType} {selectedTrade.barrier}
                                </strong>
                            </div>
                            <div>
                                <span style={{ color: '#94a3b8' }}>Entry Price & Digit:</span>{' '}
                                <strong>{selectedTrade.entryPrice}</strong> (Last Digit: {selectedTrade.entryDigit})
                            </div>

                            {/* Why trade was allowed */}
                            <div
                                style={{
                                    background: 'rgba(15, 23, 42, 0.8)',
                                    borderRadius: '8px',
                                    padding: '0.85rem',
                                    border: '1px solid rgba(56, 189, 248, 0.3)',
                                }}
                            >
                                <div style={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                                    WHY THE ENGINE AUTHORIZED THIS ENTRY:
                                </div>
                                <p style={{ margin: 0, color: '#e2e8f0', lineHeight: 1.5 }}>
                                    &ldquo;{selectedTrade.entryReason}&rdquo;
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Apex Score:</span>{' '}
                                    <strong>{selectedTrade.apexScore}/100</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Stability Score:</span>{' '}
                                    <strong>{selectedTrade.stabilityScore}/100</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Under 0-4:</span>{' '}
                                    <strong>{selectedTrade.under04}%</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Over 5-9:</span>{' '}
                                    <strong>{selectedTrade.over59}%</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Last 10 Momentum:</span>{' '}
                                    <strong>{selectedTrade.last10}</strong>
                                </div>
                                <div>
                                    <span style={{ color: '#94a3b8' }}>Last 7 Gate:</span>{' '}
                                    <strong>{selectedTrade.last7}</strong>
                                </div>
                            </div>

                            {selectedTrade.exitResult && (
                                <div
                                    style={{
                                        marginTop: '0.5rem',
                                        padding: '0.6rem 0.85rem',
                                        borderRadius: '6px',
                                        background:
                                            selectedTrade.exitResult === 'WIN'
                                                ? 'rgba(16, 185, 129, 0.15)'
                                                : 'rgba(244, 63, 94, 0.15)',
                                        border: `1px solid ${
                                            selectedTrade.exitResult === 'WIN' ? '#10b981' : '#f43f5e'
                                        }`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span>Outcome: <strong>{selectedTrade.exitResult}</strong></span>
                                    <strong style={{ fontSize: '1rem', color: (selectedTrade.profit || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                                        {(selectedTrade.profit || 0) >= 0 ? '+' : ''}${selectedTrade.profit?.toFixed(2)}
                                    </strong>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
