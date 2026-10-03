import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import DraggableResizeWrapper from '@/components/draggable/draggable-resize-wrapper';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import AllAnalysis from '@/pages/analysis-tool/all-analysis';
import TickAnalyser from '@/pages/analysis-tool/tick-analyser';
import EasyTool from '@/pages/easy-tool';
import DigitFlowPage from '@/pages/digitflow/digitflow';
import './entry-scanner-modal.scss';

type EntryScannerTab = 'all-analysis' | 'tick-analyser' | 'easy-tool' | 'digitflow';

const EntryScannerModal: React.FC = observer(() => {
    const { entry_scanner } = useStore();
    const [active_tab, setActiveTab] = useState<EntryScannerTab>('all-analysis');

    if (!entry_scanner.is_scanner_open) return null;

    const onClose = () => {
        entry_scanner.is_scanner_open = false;
    };

    const modalWidth = typeof window !== 'undefined' ? Math.min(920, window.innerWidth - 20) : 920;
    const modalHeight = typeof window !== 'undefined' ? Math.min(720, window.innerHeight - 40) : 720;

    const content = (
        <div className='entry-scanner-modal-body'>
            <div className='entry-scanner-modal-tabs'>
                <button
                    type='button'
                    className={`entry-scanner-modal-tab ${active_tab === 'all-analysis' ? 'entry-scanner-modal-tab--active' : ''}`}
                    onClick={() => setActiveTab('all-analysis')}
                >
                    🌐 All Markets
                </button>
                <button
                    type='button'
                    className={`entry-scanner-modal-tab ${active_tab === 'tick-analyser' ? 'entry-scanner-modal-tab--active' : ''}`}
                    onClick={() => setActiveTab('tick-analyser')}
                >
                    ⏱ Tick Analyser
                </button>
                <button
                    type='button'
                    className={`entry-scanner-modal-tab ${active_tab === 'easy-tool' ? 'entry-scanner-modal-tab--active' : ''}`}
                    onClick={() => setActiveTab('easy-tool')}
                >
                    ⚡ Easy Tool
                </button>
                <button
                    type='button'
                    className={`entry-scanner-modal-tab ${active_tab === 'digitflow' ? 'entry-scanner-modal-tab--active' : ''}`}
                    onClick={() => setActiveTab('digitflow')}
                >
                    🔢 Digit Flow
                </button>
            </div>
            <div className='entry-scanner-modal-content'>
                {active_tab === 'all-analysis' && <AllAnalysis />}
                {active_tab === 'tick-analyser' && <TickAnalyser />}
                {active_tab === 'easy-tool' && <EasyTool />}
                {active_tab === 'digitflow' && <DigitFlowPage />}
            </div>
        </div>
    );

    return (
        <DraggableResizeWrapper
            boundary='.main'
            header={localize('Analysis & Entry Scanner')}
            onClose={onClose}
            modalWidth={modalWidth}
            modalHeight={modalHeight}
            minWidth={320}
            minHeight={360}
            enableResizing
        >
            {content}
        </DraggableResizeWrapper>
    );
});

export default EntryScannerModal;
