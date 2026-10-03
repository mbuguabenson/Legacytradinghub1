import { useEffect, useState } from 'react';
import './LuxuryWelcomeScreen.scss';

export type TLuxuryWelcomeScreenProps = {
    onFinished: () => void;
    isComplete: boolean;
    progress: number;
};

const STEPS = [
    { label: 'CONNECTION', at: 20, status: 'Establishing secure connection...', hint: 'Linking to Deriv servers' },
    { label: 'MARKET DATA', at: 45, status: 'Syncing live market feeds...', hint: 'Loading ticks & symbols' },
    { label: 'AI ENGINE', at: 70, status: 'Calibrating trading engines...', hint: 'Warming up analysis models' },
    { label: 'TRADING BOTS', at: 90, status: 'Preparing your trading bots...', hint: 'Loading strategies' },
    { label: 'FINAL SETUP', at: 101, status: 'Almost ready...', hint: 'Loading charts' },
];

const FEATURES = [
    { icon: '🤖', name: 'Free Bots' },
    { icon: '🧠', name: 'Digit Cracker' },
    { icon: '📊', name: 'Analysis Tool' },
    { icon: '✨', name: 'Smart Auto' },
    { icon: '🎯', name: 'Easy Tool' },
    { icon: '📡', name: 'Market Killer' },
];

export const LuxuryWelcomeScreen = ({ onFinished, isComplete, progress }: TLuxuryWelcomeScreenProps) => {
    const [exiting, setExiting] = useState(false);
    const [displayProgress, setDisplayProgress] = useState(0);

    const target = isComplete ? 100 : Math.min(100, Math.max(0, Math.round(progress)));

    // Smoothly ease the bar toward the real progress so it never looks stuck or jumpy
    useEffect(() => {
        const id = window.setInterval(() => {
            setDisplayProgress(p => (p >= target ? p : Math.min(target, p + Math.max(1, (target - p) * 0.12))));
        }, 40);
        return () => window.clearInterval(id);
    }, [target]);

    useEffect(() => {
        if (!isComplete) return;
        let inner: number | undefined;
        const timer = window.setTimeout(() => {
            setExiting(true);
            inner = window.setTimeout(onFinished, 500);
        }, 350);
        return () => {
            window.clearTimeout(timer);
            if (inner) window.clearTimeout(inner);
        };
    }, [isComplete, onFinished]);

    const handleSkip = () => {
        setExiting(true);
        window.setTimeout(onFinished, 420);
    };

    const pct = Math.round(displayProgress);
    const activeIndex = Math.max(
        0,
        STEPS.findIndex(s => pct < s.at)
    );
    const current = STEPS[activeIndex];

    return (
        <div
            className={`lux-welcome-screen ${exiting ? 'lux-welcome-screen--exiting' : 'lux-welcome-screen--visible'}`}
            onClick={handleSkip}
            role='dialog'
            aria-label='Loading Legacy Trading Hub'
        >
            <div className='lux-bg' />
            <div className='lux-bg-overlay' />

            <div className='lux-card'>
                <div className='lux-card__head'>
                    <div className='lux-card__logo' aria-hidden='true'>
                        <svg viewBox='0 0 64 64' fill='none'>
                            <defs>
                                <linearGradient id='luxBarA' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='0' stopColor='#6ee7ff' />
                                    <stop offset='1' stopColor='#2b8cff' />
                                </linearGradient>
                                <linearGradient id='luxBarB' x1='0' y1='0' x2='0' y2='1'>
                                    <stop offset='0' stopColor='#7dffb8' />
                                    <stop offset='1' stopColor='#1f9a6a' />
                                </linearGradient>
                            </defs>
                            <rect x='10' y='34' width='11' height='20' rx='3' fill='url(#luxBarB)' className='lux-bar-a' />
                            <rect x='26' y='22' width='11' height='32' rx='3' fill='url(#luxBarA)' className='lux-bar-b' />
                            <rect x='42' y='10' width='11' height='44' rx='3' fill='url(#luxBarB)' className='lux-bar-c' />
                        </svg>
                    </div>
                    <div className='lux-card__titles'>
                        <span className='lux-card__brand'>LEGACY</span>
                        <span className='lux-card__brand-sub'>TRADING HUB</span>
                    </div>
                </div>

                <h1 className='lux-card__welcome'>
                    Welcome to <strong>Legacy Trading Hub</strong>
                </h1>
                <p className='lux-card__tagline'>Automated Precision Trading System</p>

                <ol className='lux-steps'>
                    {STEPS.map((s, i) => {
                        const state = i < activeIndex ? 'done' : i === activeIndex ? 'active' : 'idle';
                        return (
                            <li key={s.label} className={`lux-steps__item lux-steps__item--${state}`}>
                                <span className='lux-steps__dot'>{state === 'done' ? '✓' : i + 1}</span>
                                <span className='lux-steps__label'>{s.label}</span>
                            </li>
                        );
                    })}
                </ol>

                <div className='lux-grid'>
                    {FEATURES.map((f, i) => (
                        <div key={f.name} className='lux-grid__tile' style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
                            <span className='lux-grid__icon'>{f.icon}</span>
                            <span className='lux-grid__name'>{f.name}</span>
                        </div>
                    ))}
                </div>

                <p className='lux-status'>{current.status}</p>
                <p className='lux-hint'>{current.hint}</p>

                <div
                    className='lux-progress__track'
                    role='progressbar'
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                >
                    <div className='lux-progress__fill' style={{ width: `${pct}%` }} />
                </div>
                <span className='lux-progress__pct'>{pct}%</span>

                <div className='lux-powered'>
                    <span>Powered by</span>
                    <img src='/deriv-logo.svg' alt='Deriv' className='lux-powered__logo' />
                    <strong>Deriv</strong>
                </div>
                <p className='lux-copy'>© {new Date().getFullYear()} Legacy Trading Hub. All rights reserved.</p>
            </div>
        </div>
    );
};

export default LuxuryWelcomeScreen;
