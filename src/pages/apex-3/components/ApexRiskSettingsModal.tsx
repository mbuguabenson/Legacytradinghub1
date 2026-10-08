import React, { useState } from 'react';
import { Settings, X } from 'lucide-react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { TRiskSettings } from '../types';

export const ApexRiskSettingsModal: React.FC = observer(() => {
    const { apex } = useStore();

    if (!apex || !apex.is_risk_modal_open) return null;

    const { risk_settings, updateRiskSettings } = apex;
    const [localSettings, setLocalSettings] = useState<TRiskSettings>({ ...risk_settings });

    const handleSave = () => {
        updateRiskSettings(localSettings);
        apex.is_risk_modal_open = false;
    };

    return (
        <div className='apex-modal-overlay' onClick={() => (apex.is_risk_modal_open = false)}>
            <div className='apex-modal-box' onClick={e => e.stopPropagation()}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1.25rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        paddingBottom: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={20} color='#38bdf8' />
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                            APEX RISK & GATE SETTINGS
                        </h3>
                    </div>
                    <button
                        className='apex-btn apex-btn--sm'
                        onClick={() => (apex.is_risk_modal_open = false)}
                    >
                        <X size={14} />
                    </button>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.85rem',
                        fontSize: '0.82rem',
                    }}
                >
                    <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Trade Stake ($)
                        </label>
                        <input
                            type='number'
                            step='0.05'
                            min='0.35'
                            value={localSettings.stake}
                            onChange={e =>
                                setLocalSettings({ ...localSettings, stake: Number(e.target.value) })
                            }
                            style={{
                                width: '100%',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Max Runs / Sequence
                        </label>
                        <input
                            type='number'
                            min='1'
                            max='20'
                            value={localSettings.maxRunsPerSequence}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    maxRunsPerSequence: Number(e.target.value),
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Max Consecutive Losses
                        </label>
                        <input
                            type='number'
                            min='1'
                            value={localSettings.maxConsecutiveLosses}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    maxConsecutiveLosses: Number(e.target.value),
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Max Daily Loss ($)
                        </label>
                        <input
                            type='number'
                            min='5'
                            value={localSettings.maxDailyLoss}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    maxDailyLoss: Number(e.target.value),
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Min Apex Score Gate
                        </label>
                        <input
                            type='number'
                            min='50'
                            max='95'
                            value={localSettings.minApexScore}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    minApexScore: Number(e.target.value),
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Min Stability Score
                        </label>
                        <input
                            type='number'
                            min='40'
                            max='95'
                            value={localSettings.minStabilityScore}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    minStabilityScore: Number(e.target.value),
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Min 7-Tick Gate (out of 7)
                        </label>
                        <input
                            type='number'
                            min='4'
                            max='7'
                            value={localSettings.minLast7Confirmation}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    minLast7Confirmation: Number(e.target.value),
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                            Cooldown (Seconds)
                        </label>
                        <input
                            type='number'
                            min='1'
                            max='60'
                            value={localSettings.cooldownSeconds}
                            onChange={e =>
                                setLocalSettings({
                                    ...localSettings,
                                    cooldownSeconds: Number(e.target.value),
                                })
                            }
                            style={{
                                width: '100%',
                                padding: '0.45rem',
                                borderRadius: '6px',
                                background: '#1e293b',
                                border: '1px solid #334155',
                                color: '#f8fafc',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                        type='checkbox'
                        id='autoSwitchMarket'
                        checked={localSettings.autoSwitchMarket}
                        onChange={e =>
                            setLocalSettings({
                                ...localSettings,
                                autoSwitchMarket: e.target.checked,
                            })
                        }
                    />
                    <label htmlFor='autoSwitchMarket' style={{ fontSize: '0.8rem', color: '#f8fafc', cursor: 'pointer' }}>
                        Auto-switch to top scoring market if current market degrades
                    </label>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.5rem',
                        marginTop: '1.5rem',
                    }}
                >
                    <button
                        className='apex-btn'
                        onClick={() => (apex.is_risk_modal_open = false)}
                    >
                        CANCEL
                    </button>
                    <button className='apex-btn apex-btn--primary' onClick={handleSave}>
                        SAVE SETTINGS
                    </button>
                </div>
            </div>
        </div>
    );
});
