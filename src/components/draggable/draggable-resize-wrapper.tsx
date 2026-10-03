import React, { useState } from 'react';
import debounce from 'debounce';
import Draggable from './draggable';

type DraggableResizeWrapperProps = {
    boundary: string;
    children: React.ReactNode;
    onClose: () => void;
    enableResizing?: boolean;
    enableDragging?: boolean;
    header?: string | React.ReactNode;
    minHeight?: number;
    minWidth?: number;
    modalHeight?: number;
    modalWidth?: number;
};

const DraggableResizeWrapper: React.FC<DraggableResizeWrapperProps> = ({
    boundary,
    children,
    onClose,
    enableResizing = false,
    enableDragging = true,
    header = '',
    minHeight = 100,
    minWidth = 100,
    modalHeight = 400,
    modalWidth = 400,
}) => {
    const [show, setShow] = useState(false);
    const getInitialBounds = () => {
        const winW = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const winH = typeof window !== 'undefined' ? window.innerHeight : 800;
        const effectiveMinWidth = Math.min(minWidth, winW - 16);
        const effectiveMinHeight = Math.min(minHeight, winH - 60);
        const maxW = Math.max(effectiveMinWidth, winW - 16);
        const maxH = Math.max(effectiveMinHeight, winH - 60);
        const width = Math.max(effectiveMinWidth, Math.min(modalWidth, maxW));
        const height = Math.max(effectiveMinHeight, Math.min(modalHeight, maxH));
        const xAxis = Math.max(8, Math.round((winW - width) / 2));
        const yAxis = Math.max(8, Math.round((winH - height) / 2));
        return { width, height, xAxis, yAxis, effectiveMinWidth, effectiveMinHeight };
    };

    const [initialValues, setInitialValues] = React.useState(getInitialBounds());

    const handleResize = debounce(() => {
        setInitialValues(getInitialBounds());
        setShow(true);
    }, 0);

    React.useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [handleResize]);

    return (
        <div id='draggable_resize_container'>
            {show && (
                <Draggable
                    boundary={boundary}
                    initialValues={initialValues}
                    minWidth={initialValues.effectiveMinWidth ?? minWidth}
                    minHeight={initialValues.effectiveMinHeight ?? minHeight}
                    enableResizing={enableResizing}
                    enableDragging={enableDragging}
                    header={header}
                    onClose={onClose}
                >
                    {children}
                </Draggable>
            )}
        </div>
    );
};

export default DraggableResizeWrapper;
