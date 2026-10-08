import React from 'react';
import {
    Activity,
    Award,
    Compass,
    Pause,
    Play,
    Radio,
    Settings,
    Zap,
} from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';

export const ApexHeader: React.FC = observer(() => {
    const { apex, client, common } = useStore();

    if (!apex) return null;

    const {
        selected_symbol,
        active_symbols,
        switchMarket,
        is_all_markets_mode,
        toggleAllMarketsMode,
        best_market,
        activateBestMarket,
        is_autotrading_enabled,
        is_paused,
        trade_mode,
        setTradeMode,
        openConfirmModal,
        pauseAutotrading,
        resumeAutotrading,
    } = apex;

    const isLoggedIn = client?.is_logged_in;
    const isVirtual = client?.is_virtual;
    const balance = client?.balance;
    const isSocketOpen = common?.is_socket_opened;

    return (
        <header className='apex-header'>
            {/* Brand Logo & Title */}
            <div className='apex-header__brand'>
                <div className='apex-brand-icon'>
                    <Zap size={20} />
                </div>
                <div className='apex-brand-titles'>
                    <span className='apex-title-text'>APEX 3.0</span>
                    <span className='apex-subtitle-text'>Advanced Probability & Execution Engine</span>
                </div>
            </div>

            {/* Quick Action Controls */}
            <div className='apex-header__controls'>
                {/* Mode Selector (Simulation vs Live) */}
                <div
                    style={{
                        display: 'flex',
                        background: 'rgba(255,255,255,0.06)',
                        padding: '3px',
                        borderRadius: '8px',
                        gap: '2px',
                    }}
                >
                    <button
                        className={`apex-btn apex-btn--sm ${trade_mode === 'SIMULATION' ? 'apex-btn--primary' : ''}`}
                        onClick={() => setTradeMode('SIMULATION')}
                        title='Simulation mode processes live ticks without financial execution'
                    >
                        <Compass size={13} />
                        SIMULATION
                    </button>
                    <button
                        className={`apex-btn apex-btn--sm ${trade_mode === 'LIVE' ? 'apex-btn--warning' : ''}`}
                        onClick={() => setTradeMode('LIVE')}
                        title='Live mode executes authenticated orders on Deriv account'
                    >
                        <Zap size={13} />
                        LIVE
                    </button>
                </div>

                {/* All Markets Auto-Scanner Toggle */}
                <button
                    className={`apex-btn apex-btn--sm ${is_all_markets_mode ? 'apex-btn--primary' : ''}`}
                    onClick={toggleAllMarketsMode}
                    title='Scan all Deriv synthetic markets simultaneously'
                >
                    <Radio size={13} />
                    {is_all_markets_mode ? 'SCANNING ALL' : 'AUTO SCAN'}
                </button>

                {/* Best Market Shortcut */}
                {best_market && (
                    <button
                        className='apex-btn apex-btn--sm'
                        style={{ border: '1px solid rgba(16, 185, 129, 0.4)' }}
                        onClick={activateBestMarket}
                        title={`Activate top scoring market: ${best_market.displayName}`}
                    >
                        <Award size={13} color='#10b981' />
                        BEST: {best_market.displayName.replace(' Index', '')} ({best_market.apexScore})
                    </button>
                )}

                {/* Market Selector Dropdown */}
                <select
                    value={selected_symbol}
                    onChange={e => switchMarket(e.target.value)}
                    style={{
                        background: 'rgba(15, 23, 42, 0.9)',
                        color: '#f8fafc',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '8px',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    {active_symbols.map(s => (
                        <option key={s.symbol} value={s.symbol}>
                            {s.display_name}
                        </option>
                    ))}
                </select>

                {/* Risk Settings Button */}
                <button
                    className='apex-btn apex-btn--sm'
                    onClick={() => (apex.is_risk_modal_open = true)}
                    title='Configure risk and execution thresholds'
                >
                    <Settings size={13} />
                </button>
            </div>

            {/* Account & Connection Status Pills */}
            <div className='apex-header__status-pills'>
                {/* Account Type */}
                <span
                    className='apex-badge'
                    style={{
                        background: isVirtual ? 'rgba(56, 189, 248, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: isVirtual ? '#38bdf8' : '#10b981',
                        border: `1px solid ${isVirtual ? '#38bdf8' : '#10b981'}`,
                    }}
                >
                    {isLoggedIn ? (isVirtual ? 'DEMO ACCOUNT' : 'REAL ACCOUNT') : 'OFFLINE'}
                    {isLoggedIn && balance !== undefined && ` ($${Number(balance).toFixed(2)})`}
                </span>

                {/* Connection Status */}
                <span
                    className='apex-badge'
                    style={{
                        background: isSocketOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                        color: isSocketOpen ? '#10b981' : '#f43f5e',
                        border: `1px solid ${isSocketOpen ? '#10b981' : '#f43f5e'}`,
                    }}
                >
                    <Activity size={12} />
                    {isSocketOpen ? 'CONNECTED' : 'DISCONNECTED'}
                </span>

                {/* Autotrade Status Controller Button */}
                {!is_autotrading_enabled ? (
                    <button
                        className='apex-btn apex-btn--sm apex-btn--primary'
                        onClick={openConfirmModal}
                    >
                        <Play size={13} />
                        AUTO TRADE OFF
                    </button>
                ) : is_paused ? (
                    <button
                        className='apex-btn apex-btn--sm apex-btn--warning'
                        onClick={resumeAutotrading}
                    >
                        <Play size={13} />
                        AUTO PAUSED
                    </button>
                ) : (
                    <button
                        className='apex-btn apex-btn--sm apex-btn--danger'
                        onClick={() => pauseAutotrading('Paused by trader')}
                    >
                        <Pause size={13} />
                        AUTO TRADING ON
                    </button>
                )}
            </div>
        </header>
    );
});
