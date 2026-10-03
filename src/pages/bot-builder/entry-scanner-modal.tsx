import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import DraggableResizeWrapper from '@/components/draggable/draggable-resize-wrapper';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import EasyTool from '@/pages/easy-tool';
import DigitFlowPage from '@/pages/digitflow/digitflow';
import './entry-scanner-modal.scss';

const EntryScannerModal: React.FC = observer(() => {
    const { entry_scanner } = useStore();
    const { isDesktop } = useDevice();
    const [active_tab, setActiveTab] = useState<'easy-tool' | 'digitflow'>('easy-tool');

    if (!entry_scanner.is_scanner_open) return null;

    const onClose = () => {
        entry_scanner.is_scanner_open = false;
    };

    const modalWidth = typeof window !== 'undefined' ? Math.min(840, window.innerWidth - 20) : 840;
    const modalHeight = typeof window !== 'undefined' ? Math.min(680, window.innerHeight - 40) : 680;

    const content = (
        <div className='entry-scanner-modal-body'>
            <div className='entry-scanner-modal-tabs'>
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
                {active_tab === 'easy-tool' && <EasyTool />}
                {active_tab === 'digitflow' && <DigitFlowPage />}
            </div>
        </div>
    );

    if (!isDesktop) {
        return (
            <MobileFullPageModal
                is_modal_open={entry_scanner.is_scanner_open}
                header={localize('Easy Tool & Digit Flow')}
                onClickClose={onClose}
                height_offset='80px'
            >
                {content}
            </MobileFullPageModal>
        );
    }

    return (
        <DraggableResizeWrapper
            boundary='.main'
            header={localize('Easy Tool & Digit Flow')}
            onClose={onClose}
            modalWidth={modalWidth}
            modalHeight={modalHeight}
            minWidth={360}
            minHeight={400}
            enableResizing
        >
            {content}
        </DraggableResizeWrapper>
    );
});

export default EntryScannerModal;
