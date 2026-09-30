import React from 'react';
import './chunk-loader.scss';

export interface ChunkLoaderProps {
    message?: string;
    subMessage?: string;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export default function ChunkLoader({
    message = 'Loading workspace...',
    subMessage,
    size = 'medium',
    className = '',
}: ChunkLoaderProps) {
    const sizeMap = {
        small: 24,
        medium: 36,
        large: 48,
    };

    const pixelSize = sizeMap[size] || 36;
    const strokeWidth = size === 'small' ? 3 : 3.5;

    return (
        <div
            className={`lth-chunk-loader lth-chunk-loader--${size} ${className}`}
            role='status'
            aria-live='polite'
        >
            <div className='lth-spinner' style={{ width: pixelSize, height: pixelSize }}>
                <svg
                    className='lth-spinner__svg'
                    viewBox='0 0 48 48'
                    width={pixelSize}
                    height={pixelSize}
                >
                    <circle
                        className='lth-spinner__track'
                        cx='24'
                        cy='24'
                        r='20'
                        fill='none'
                        strokeWidth={strokeWidth}
                    />
                    <circle
                        className='lth-spinner__head'
                        cx='24'
                        cy='24'
                        r='20'
                        fill='none'
                        strokeWidth={strokeWidth}
                    />
                </svg>
            </div>

            {message && (
                <div className='lth-loader-text'>
                    <span className='lth-loader-message'>{message}</span>
                    {subMessage && <span className='lth-loader-sub'>{subMessage}</span>}
                </div>
            )}
        </div>
    );
}
