import React from 'react';
import { observer } from 'mobx-react-lite';
import DraggableResizeWrapper from '@/components/draggable/draggable-resize-wrapper';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import ChartWrapper from '../chart-wrapper';

const ChartModalDesktop = observer(() => {
    const { dashboard } = useStore();
    const { is_chart_modal_visible, setChartModalVisibility } = dashboard;

    const modalWidth = typeof window !== 'undefined' ? Math.min(526, window.innerWidth - 16) : 526;
    const modalHeight = typeof window !== 'undefined' ? Math.min(595, window.innerHeight - 60) : 595;

    return (
        <React.Fragment>
            {is_chart_modal_visible && (
                <DraggableResizeWrapper
                    boundary='.main'
                    header={localize('Chart')}
                    onClose={setChartModalVisibility}
                    modalWidth={modalWidth}
                    modalHeight={modalHeight}
                    minWidth={280}
                    minHeight={300}
                    enableResizing
                >
                    <div className='chart-modal-dialog' data-testid='chart-modal-dialog'>
                        <ChartWrapper show_digits_stats={false} />
                    </div>
                </DraggableResizeWrapper>
            )}
        </React.Fragment>
    );
});

export default ChartModalDesktop;
