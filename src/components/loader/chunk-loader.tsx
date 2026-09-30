import React from 'react';
import { Cpu, Zap } from 'lucide-react';
import './chunk-loader.scss';

export interface ChunkLoaderProps {
    message?: string;
    subMessage?: string;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

export default function ChunkLoader({
    message = 'Loading workspace...',
    subMessage = 'Synchronizing algorithmic matrix',
    size = 'medium',
    className = '',
}: ChunkLoaderProps) {
    return (
        <div
            className={`lth-chunk-loader lth-chunk-loader--${size} ${className}`}
            role='status'
            aria-live='polite'
        >
            {/* Ambient Background Aura */}
            <div className='lth-loader-ambient-glow' aria-hidden='true' />

            {/* 3D Quantum Gyroscope Core */}
            <div className='lth-quantum-gyro'>
                {/* Outer Hologram Halo with Orbiting Photon */}
                <div className='lth-ring lth-ring--outer'>
                    <div className='lth-photon lth-photon--cyan' />
                </div>

                {/* Mid Tilted Energy Gimbal Ring */}
                <div className='lth-ring lth-ring--mid'>
                    <div className='lth-photon lth-photon--purple' />
                </div>

                {/* Inner High-Frequency Laser Ring */}
                <div className='lth-ring lth-ring--inner'>
                    <div className='lth-photon lth-photon--emerald' />
                </div>

                {/* Central Crystalline Reactor Core */}
                <div className='lth-reactor-core'>
                    <div className='lth-core-flare' />
                    <Zap className='lth-core-icon' />
                </div>
            </div>

            {/* Interactive Telemetry Capsule */}
            <div className='lth-telemetry-capsule'>
                {/* Live Data Throughput Waveform (5 Frequency Bars) */}
                <div className='lth-waveform' aria-hidden='true'>
                    <span className='wave-bar bar-1' />
                    <span className='wave-bar bar-2' />
                    <span className='wave-bar bar-3' />
                    <span className='wave-bar bar-4' />
                    <span className='wave-bar bar-5' />
                </div>

                {/* Message and Status Indicator */}
                <div className='lth-telemetry-text'>
                    <span className='lth-msg-primary'>{message}</span>
                    {subMessage && <span className='lth-msg-sub'>{subMessage}</span>}
                </div>

                {/* Live Quantum Beacon Badge */}
                <div className='lth-status-badge'>
                    <span className='lth-beacon-dot' />
                    <span className='lth-beacon-label'>LIVE SYNC</span>
                </div>
            </div>
        </div>
    );
}
