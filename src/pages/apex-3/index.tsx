import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/hooks/useStore';
import { Apex50DigitChart } from './components/Apex50DigitChart';
import { ApexConfirmationModal } from './components/ApexConfirmationModal';
import { ApexDistributionCards } from './components/ApexDistributionCards';
import { ApexEntryDigitCard } from './components/ApexEntryDigitCard';
import { ApexExecutionPanel } from './components/ApexExecutionPanel';
import { ApexHeader } from './components/ApexHeader';
import { ApexIntelligencePanel } from './components/ApexIntelligencePanel';
import { ApexMarketScanner } from './components/ApexMarketScanner';
import { ApexObservationMode } from './components/ApexObservationMode';
import { ApexRiskSettingsModal } from './components/ApexRiskSettingsModal';
import { ApexTradeJournal } from './components/ApexTradeJournal';
import './apex-3.scss';

const Apex3Page: React.FC = observer(() => {
    const { apex, ui } = useStore();

    useEffect(() => {
        if (apex) {
            apex.discoverSyntheticMarkets();
        }
        return () => {
            // cleanup if needed
        };
    }, [apex]);

    const isDarkMode = ui?.is_dark_mode_on ?? true;

    return (
        <div className={`apex-container ${isDarkMode ? 'apex-container--dark' : 'apex-container--light'}`}>
            {/* Top Navigation & Status Bar */}
            <ApexHeader />

            {/* Desktop 3-Column / Mobile Responsive Grid */}
            <div className='apex-main-grid'>
                {/* LEFT COLUMN: Market Scanner */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <ApexMarketScanner />
                    <ApexObservationMode />
                </div>

                {/* CENTER COLUMN: Main Intelligence HUD, 50-Tick Chart & Distributions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <ApexIntelligencePanel />
                    <Apex50DigitChart />
                    <ApexDistributionCards />
                </div>

                {/* RIGHT COLUMN: Execution Engine, Entry Digit Intelligence */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <ApexExecutionPanel />
                    <ApexEntryDigitCard />
                </div>
            </div>

            {/* BOTTOM SECTION: Full Trade Journal & Explainable Replay */}
            <ApexTradeJournal />

            {/* Modals */}
            <ApexConfirmationModal />
            <ApexRiskSettingsModal />
        </div>
    );
});

export default Apex3Page;
