import React from 'react';
import { observer } from 'mobx-react-lite';
import DraggableResizeWrapper from '@/components/draggable/draggable-resize-wrapper';
import TradingViewComponent from '@/components/trading-view-chart/trading-view';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';

const TradingViewModal = observer(() => {
    const { dashboard } = useStore();
    const { is_trading_view_modal_visible, setTradingViewModalVisibility } = dashboard;

    const modalWidth = typeof window !== 'undefined' ? Math.min(526, window.innerWidth - 16) : 526;
    const modalHeight = typeof window !== 'undefined' ? Math.min(595, window.innerHeight - 60) : 595;

    return (
        <React.Fragment>
            {is_trading_view_modal_visible && (
                <DraggableResizeWrapper
                    boundary='.main'
                    header={localize('TradingView Chart')}
                    onClose={setTradingViewModalVisibility}
                    modalWidth={modalWidth}
                    modalHeight={modalHeight}
                    minWidth={280}
                    minHeight={300}
                    enableResizing
                >
                    <div style={{ height: 'calc(100% - 6rem)', padding: '0.5rem' }}>
                        <TradingViewComponent />
                    </div>
                </DraggableResizeWrapper>
            )}
        </React.Fragment>
    );
});

export default TradingViewModal;
