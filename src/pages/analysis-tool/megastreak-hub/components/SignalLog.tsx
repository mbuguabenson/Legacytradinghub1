import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakEngine } from '../megastreak-engine';

interface SignalLogProps {
    engine: MegastreakEngine;
}

export const SignalLog: React.FC<SignalLogProps> = observer(({ engine }) => {
    const [filter, setFilter] = useState<'ALL' | 'SIGNALS' | 'STOPS'>('ALL');
    const logs = engine.signal_logs;

    const filteredLogs = logs.filter(log => {
        if (filter === 'SIGNALS') {
            return log.status.includes('CONDITIONS MET') || log.status.includes('FORMING');
        }
        if (filter === 'STOPS') {
            return log.status.includes('STOP') || log.status.includes('REVERSAL') || log.status.includes('UNSTABLE');
        }
        return true;
    });

    const formatTime = (ts: number) => {
        const d = new Date(ts);
        return d.toTimeString().split(' ')[0];
    };

    return (
        <div className='megastreak-signal-log-panel'>
            <div className='log-header'>
                <div className='log-title-group'>
                    <span className='log-title'>Regime History & Signal Transition Log</span>
                    <span className='log-count'>({filteredLogs.length} Events)</span>
                </div>

                <div className='log-controls'>
                    <div className='filter-btn-group'>
                        <button
                            type='button'
                            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                            onClick={() => setFilter('ALL')}
                        >
                            All
                        </button>
                        <button
                            type='button'
                            className={`filter-btn ${filter === 'SIGNALS' ? 'active' : ''}`}
                            onClick={() => setFilter('SIGNALS')}
                        >
                            Signals
                        </button>
                        <button
                            type='button'
                            className={`filter-btn ${filter === 'STOPS' ? 'active' : ''}`}
                            onClick={() => setFilter('STOPS')}
                        >
                            Stops
                        </button>
                    </div>

                    <button
                        type='button'
                        className='clear-log-btn'
                        onClick={() => engine.clearLog()}
                        title='Clear log history'
                    >
                        Clear
                    </button>
                </div>
            </div>

            <div className='log-entries-scroll'>
                {filteredLogs.length > 0 ? (
                    <div className='log-table'>
                        {filteredLogs.map(item => {
                            const isStop =
                                item.status.includes('STOP') ||
                                item.status.includes('REVERSAL') ||
                                item.status.includes('UNSTABLE');
                            const isMet = item.status.includes('CONDITIONS MET');

                            return (
                                <div
                                    key={item.id}
                                    className={`log-row ${isStop ? 'row-stop' : isMet ? 'row-met' : 'row-neutral'}`}
                                >
                                    <span className='log-time'>{formatTime(item.timestamp)}</span>
                                    <span className='log-symbol'>{item.symbol}</span>
                                    <span className={`log-status-badge ${isStop ? 'badge-stop' : isMet ? 'badge-met' : ''}`}>
                                        {item.status}
                                    </span>
                                    <span className='log-reason'>{item.reason}</span>
                                    {item.digit !== undefined && (
                                        <span className='log-digit'>Digit {item.digit}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className='empty-log-state'>
                        <span>No signal transitions recorded yet. Live ticks are being evaluated.</span>
                    </div>
                )}
            </div>
        </div>
    );
});
