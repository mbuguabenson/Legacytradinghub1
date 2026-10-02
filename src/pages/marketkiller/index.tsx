import { useEffect } from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { getGroupedMarkets } from '@/constants/markets';
import MatchesKiller from './components/matches-killer';
import './marketkiller.scss';

const Marketkiller = observer(() => {
    const { marketkiller } = useStore();
    const { current_price, last_digit, symbol, is_connected, is_running } = marketkiller;

    useEffect(() => {
        // Ensure active subtab is dedicated to matches killer
        marketkiller.setActiveSubtab('matches');
        // Kickstart streaming ticks & stats on mount
        marketkiller.subscribeToTicks();
        marketkiller.subscribeToRibbon();

        return () => {
            // Safety cleanup hook
            marketkiller.is_running = false;
            marketkiller.cleanupSubscriptions();
        };
    }, []);

    const marketGroups = getGroupedMarkets();

    return (
        <div className='marketkiller-wrapper'>
            <div className='mk-global-header'>
                <div className='mk-header-left'>
                    <div className='mk-header-title-wrap'>
                        <span className='mk-header-icon'>🔪</span>
                        <div className='mk-header-title-text'>
                            <h2>MATCHES KILLER</h2>
                            <span className='mk-connection-status'>
                                {is_connected ? '● LIVE CONNECTION' : '○ RECONNECTING...'}
                            </span>
                        </div>
                    </div>

                    <div className='mk-market-selector'>
                        <label>ACTIVE STREAM</label>
                        <select value={symbol} onChange={e => marketkiller.setSymbol(e.target.value)}>
                            {marketGroups.map(group => (
                                <optgroup key={group.group} label={group.group}>
                                    {group.items.map(m => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                </div>

                <div className='mk-live-feed'>
                    <div className='price-display'>
                        <span className='label'>TICK QUOTE</span>
                        <span className='value'>{current_price || '0.000'}</span>
                    </div>
                    <div className='digit-display'>{last_digit !== null ? last_digit : '-'}</div>

                    <button
                        className={classNames('mk-btn-primary', { running: is_running })}
                        onClick={() => marketkiller.toggleEngine()}
                    >
                        {is_running ? 'TERMINATE' : 'ACTIVATE KILLER'}
                    </button>
                </div>
            </div>

            <div className='mk-content'>
                <MatchesKiller />
            </div>
        </div>
    );
});

export default Marketkiller;

