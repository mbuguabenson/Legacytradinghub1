import { useEffect, useState } from 'react';
import { BrandLogo } from '@/components/layout/app-logo/BrandLogo';
import './LuxuryWelcomeScreen.scss';

export type TLuxuryWelcomeScreenProps = {
    onFinished: () => void;
    isComplete: boolean;
    progress: number;
};

const STEPS = [
    { label: 'CONNECTION', at: 20, status: 'Establishing secure connection...', hint: 'Linking to Deriv servers' },
    { label: 'MARKET DATA', at: 45, status: 'Syncing live market telemetry...', hint: 'Loading real-time tick feeds' },
    { label: 'AI ENGINE', at: 70, status: 'Calibrating trading engines...', hint: 'Warming up predictive models' },
    { label: 'TRADING BOTS', at: 90, status: 'Preparing automated strategies...', hint: 'Optimizing execution runtime' },
    { label: 'FINAL SETUP', at: 101, status: 'Almost ready...', hint: 'Loading charts' },
];

/* ─── 3D Vector Icons ──────────────────────────────────────────────────────── */

const Icon3DRobot = () => (
    <svg viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg' className='lux-3d-svg'>
        <defs>
            <radialGradient id='botHeadGrad' cx='40%' cy='35%' r='65%'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='30%' stopColor='#e0f2fe' />
                <stop offset='75%' stopColor='#94a3b8' />
                <stop offset='100%' stopColor='#475569' />
            </radialGradient>
            <linearGradient id='botVisorGrad' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#0284c7' />
                <stop offset='50%' stopColor='#0369a1' />
                <stop offset='100%' stopColor='#0c4a6e' />
            </linearGradient>
            <radialGradient id='botEyeGlow' cx='40%' cy='40%' r='60%'>
                <stop offset='0%' stopColor='#a5f3fc' />
                <stop offset='60%' stopColor='#00f5ff' />
                <stop offset='100%' stopColor='#0284c7' />
            </radialGradient>
            <filter id='botGlow' x='-20%' y='-20%' width='140%' height='140%'>
                <feDropShadow dx='0' dy='2' stdDeviation='2' floodColor='#00f5ff' floodOpacity='0.6' />
            </filter>
        </defs>
        <line x1='24' y1='10' x2='24' y2='4' stroke='#94a3b8' strokeWidth='2.5' strokeLinecap='round' />
        <circle cx='24' cy='4' r='3.5' fill='#00f5ff' filter='url(#botGlow)' />
        <rect x='6' y='21' width='4' height='10' rx='2' fill='#64748b' />
        <rect x='38' y='21' width='4' height='10' rx='2' fill='#64748b' />
        <rect x='9' y='11' width='30' height='27' rx='10' fill='url(#botHeadGrad)' />
        <rect x='13' y='18' width='22' height='13' rx='5' fill='url(#botVisorGrad)' />
        <path d='M15 20 Q 24 18 33 20' stroke='#38bdf8' strokeWidth='1' opacity='0.6' fill='none' />
        <circle cx='19' cy='24.5' r='3' fill='url(#botEyeGlow)' filter='url(#botGlow)' />
        <circle cx='29' cy='24.5' r='3' fill='url(#botEyeGlow)' filter='url(#botGlow)' />
        <circle cx='18' cy='23.5' r='1' fill='#ffffff' />
        <circle cx='28' cy='23.5' r='1' fill='#ffffff' />
        <rect x='20' y='33' width='8' height='2' rx='1' fill='#64748b' />
    </svg>
);

const Icon3DBrain = () => (
    <svg viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg' className='lux-3d-svg'>
        <defs>
            <radialGradient id='brainCortexGrad' cx='40%' cy='30%' r='70%'>
                <stop offset='0%' stopColor='#fbcfe8' />
                <stop offset='25%' stopColor='#f472b6' />
                <stop offset='65%' stopColor='#db2777' />
                <stop offset='100%' stopColor='#831843' />
            </radialGradient>
            <filter id='brainGlow' x='-20%' y='-20%' width='140%' height='140%'>
                <feDropShadow dx='0' dy='3' stdDeviation='3' floodColor='#ec4899' floodOpacity='0.5' />
            </filter>
        </defs>
        <g filter='url(#brainGlow)'>
            <path
                d='M23 12 C18 10 12 14 12 21 C10 23 10 27 12 30 C11 34 14 38 18 37 C20 40 23 39 23 37 Z'
                fill='url(#brainCortexGrad)'
            />
            <path
                d='M25 12 C30 10 36 14 36 21 C38 23 38 27 36 30 C37 34 34 38 30 37 C28 40 25 39 25 37 Z'
                fill='url(#brainCortexGrad)'
            />
            <path d='M15 21 Q 19 22 23 20' stroke='#fdf2f8' strokeWidth='1.8' strokeLinecap='round' opacity='0.85' />
            <path d='M14 28 Q 18 29 23 27' stroke='#fdf2f8' strokeWidth='1.8' strokeLinecap='round' opacity='0.85' />
            <path d='M19 34 Q 22 34 23 32' stroke='#fdf2f8' strokeWidth='1.6' strokeLinecap='round' opacity='0.75' />
            <path d='M33 21 Q 29 22 25 20' stroke='#fdf2f8' strokeWidth='1.8' strokeLinecap='round' opacity='0.85' />
            <path d='M34 28 Q 30 29 25 27' stroke='#fdf2f8' strokeWidth='1.8' strokeLinecap='round' opacity='0.85' />
            <path d='M29 34 Q 26 34 25 32' stroke='#fdf2f8' strokeWidth='1.6' strokeLinecap='round' opacity='0.75' />
            <circle cx='18' cy='18' r='2' fill='#00f5ff' />
            <circle cx='30' cy='24' r='2' fill='#00f5ff' />
            <circle cx='21' cy='31' r='1.5' fill='#d7f23a' />
        </g>
    </svg>
);

const Icon3DChart = () => (
    <svg viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg' className='lux-3d-svg'>
        <defs>
            <linearGradient id='bar1Front' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#38bdf8' />
                <stop offset='100%' stopColor='#0369a1' />
            </linearGradient>
            <linearGradient id='bar2Front' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#a855f7' />
                <stop offset='100%' stopColor='#6b21a8' />
            </linearGradient>
            <linearGradient id='bar3Front' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#34d399' />
                <stop offset='100%' stopColor='#047857' />
            </linearGradient>
            <filter id='chartShadow' x='-20%' y='-20%' width='140%' height='140%'>
                <feDropShadow dx='0' dy='3' stdDeviation='3' floodColor='#000000' floodOpacity='0.4' />
            </filter>
        </defs>
        <g filter='url(#chartShadow)'>
            <rect x='10' y='26' width='7' height='14' rx='2' fill='url(#bar1Front)' />
            <polygon points='10,26 13,23 20,23 17,26' fill='#7dd3fc' />
            <polygon points='17,26 20,23 20,37 17,40' fill='#0284c7' />

            <rect x='20' y='18' width='7' height='22' rx='2' fill='url(#bar2Front)' />
            <polygon points='20,18 23,15 30,15 27,18' fill='#c084fc' />
            <polygon points='27,18 30,15 30,37 27,40' fill='#7e22ce' />

            <rect x='30' y='10' width='7' height='30' rx='2' fill='url(#bar3Front)' />
            <polygon points='30,10 33,7 40,7 37,10' fill='#6ee7b7' />
            <polygon points='37,10 40,7 40,37 37,40' fill='#059669' />

            <path d='M8 29 L18 21 L26 25 L37 10' stroke='#ffffff' strokeWidth='3.2' strokeLinecap='round' strokeLinejoin='round' />
            <path d='M8 29 L18 21 L26 25 L37 10' stroke='#00f5ff' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
            <polygon points='33,8 39,8 39,14' fill='#00f5ff' />
        </g>
    </svg>
);

const Icon3DSparkle = () => (
    <svg viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg' className='lux-3d-svg'>
        <defs>
            <linearGradient id='starGradTopLeft' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#fef08a' />
                <stop offset='100%' stopColor='#f59e0b' />
            </linearGradient>
            <linearGradient id='starGradTopRight' x1='1' y1='0' x2='0' y2='1'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='100%' stopColor='#fbbf24' />
            </linearGradient>
            <linearGradient id='starGradBottomLeft' x1='0' y1='1' x2='1' y2='0'>
                <stop offset='0%' stopColor='#d97706' />
                <stop offset='100%' stopColor='#b45309' />
            </linearGradient>
            <linearGradient id='starGradBottomRight' x1='1' y1='1' x2='0' y2='0'>
                <stop offset='0%' stopColor='#f59e0b' />
                <stop offset='100%' stopColor='#78350f' />
            </linearGradient>
            <filter id='starGlow' x='-30%' y='-30%' width='160%' height='160%'>
                <feDropShadow dx='0' dy='2' stdDeviation='4' floodColor='#f59e0b' floodOpacity='0.7' />
            </filter>
        </defs>
        <g filter='url(#starGlow)'>
            <polygon points='24,6 24,24 12,24' fill='url(#starGradTopLeft)' />
            <polygon points='24,6 36,24 24,24' fill='url(#starGradTopRight)' />
            <polygon points='12,24 24,24 24,42' fill='url(#starGradBottomLeft)' />
            <polygon points='24,24 36,24 24,42' fill='url(#starGradBottomRight)' />
            <circle cx='24' cy='24' r='3.2' fill='#ffffff' />
            <circle cx='38' cy='12' r='2' fill='#fef08a' />
            <circle cx='9' cy='36' r='1.5' fill='#fef08a' />
        </g>
    </svg>
);

const Icon3DCopy = () => (
    <svg viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg' className='lux-3d-svg'>
        <defs>
            <linearGradient id='docBackGrad' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#334155' />
                <stop offset='100%' stopColor='#0f172a' />
            </linearGradient>
            <linearGradient id='docFrontGrad' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stopColor='#ffffff' />
                <stop offset='40%' stopColor='#e2e8f0' />
                <stop offset='100%' stopColor='#94a3b8' />
            </linearGradient>
            <filter id='docShadow' x='-20%' y='-20%' width='140%' height='140%'>
                <feDropShadow dx='0' dy='3' stdDeviation='3' floodColor='#000000' floodOpacity='0.5' />
            </filter>
        </defs>
        <g filter='url(#docShadow)'>
            <rect x='16' y='8' width='22' height='28' rx='4' fill='url(#docBackGrad)' stroke='rgba(255,255,255,0.2)' strokeWidth='1' />
            <rect x='10' y='14' width='22' height='28' rx='4' fill='url(#docFrontGrad)' />
            <polygon points='26,14 32,20 26,20' fill='#cbd5e1' />
            <line x1='15' y1='22' x2='23' y2='22' stroke='#0284c7' strokeWidth='2' strokeLinecap='round' />
            <line x1='15' y1='27' x2='27' y2='27' stroke='#64748b' strokeWidth='1.8' strokeLinecap='round' />
            <line x1='15' y1='32' x2='25' y2='32' stroke='#64748b' strokeWidth='1.8' strokeLinecap='round' />
            <circle cx='27' cy='36' r='6' fill='#10b981' />
            <polyline points='24 36 26.5 38.5 30 34' stroke='#ffffff' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' fill='none' />
        </g>
    </svg>
);

const Icon3DSignals = () => (
    <svg viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg' className='lux-3d-svg'>
        <defs>
            <radialGradient id='dishGrad' cx='45%' cy='45%' r='55%'>
                <stop offset='0%' stopColor='#38bdf8' />
                <stop offset='50%' stopColor='#0284c7' />
                <stop offset='100%' stopColor='#0f172a' />
            </radialGradient>
            <filter id='signalGlow' x='-20%' y='-20%' width='140%' height='140%'>
                <feDropShadow dx='0' dy='2' stdDeviation='3' floodColor='#00f5ff' floodOpacity='0.5' />
            </filter>
        </defs>
        <g filter='url(#signalGlow)'>
            <path d='M16 38 L22 30 L26 30 L32 38' stroke='#64748b' strokeWidth='2.5' strokeLinecap='round' />
            <line x1='13' y1='38' x2='35' y2='38' stroke='#475569' strokeWidth='2.5' strokeLinecap='round' />
            <ellipse cx='21' cy='23' rx='12' ry='9' transform='rotate(-28 21 23)' fill='url(#dishGrad)' stroke='#e0f2fe' strokeWidth='1.5' />
            <line x1='21' y1='23' x2='29' y2='14' stroke='#ffffff' strokeWidth='2' strokeLinecap='round' />
            <circle cx='29' cy='14' r='2.5' fill='#00f5ff' />
            <path d='M32 9 Q 36 13 36 18' stroke='#00f5ff' strokeWidth='2' strokeLinecap='round' fill='none' />
            <path d='M37 5 Q 43 11 43 19' stroke='#38bdf8' strokeWidth='2.2' strokeLinecap='round' fill='none' opacity='0.7' />
        </g>
    </svg>
);

const FEATURES = [
    { icon: <Icon3DRobot />, name: 'Free Bots', color: 'radial-gradient(circle at 35% 30%, #38bdf8 0%, #0369a1 70%, #082f49 100%)', border: 'rgba(56, 189, 248, 0.45)' },
    { icon: <Icon3DBrain />, name: 'AI Bots', color: 'radial-gradient(circle at 35% 30%, #f472b6 0%, #db2777 70%, #500724 100%)', border: 'rgba(236, 72, 153, 0.45)' },
    { icon: <Icon3DChart />, name: 'Analysis Tool', color: 'radial-gradient(circle at 35% 30%, #818cf8 0%, #4f46e5 70%, #1e1b4b 100%)', border: 'rgba(99, 102, 241, 0.45)' },
    { icon: <Icon3DSparkle />, name: 'Smart Analysis', color: 'radial-gradient(circle at 35% 30%, #fbbf24 0%, #d97706 70%, #451a03 100%)', border: 'rgba(245, 158, 11, 0.45)' },
    { icon: <Icon3DCopy />, name: 'Copy Trading', color: 'radial-gradient(circle at 35% 30%, #34d399 0%, #059669 70%, #022c22 100%)', border: 'rgba(16, 185, 129, 0.45)' },
    { icon: <Icon3DSignals />, name: 'Signals', color: 'radial-gradient(circle at 35% 30%, #22d3ee 0%, #0891b2 70%, #083344 100%)', border: 'rgba(14, 165, 233, 0.45)' },
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
            {/* ─── Original Emerald & Ambient Glowing Rings Background ─── */}
            <div className='lux-glow lux-glow--top' />
            <div className='lux-glow lux-glow--ring' />
            <div className='lux-glow lux-glow--ring lux-glow--ring-2' />

            {/* ─── Translucent Glass Card ─── */}
            <div className='lux-card' onClick={e => e.stopPropagation()}>
                {/* Header: Official App Logo (BrandLogo) */}
                <div className='lux-card__header-badge'>
                    <BrandLogo height={38} />
                </div>

                {/* Welcome Heading */}
                <h1 className='lux-card__welcome-title'>
                    Welcome to <span className='lux-highlight'>Legacy Trading Hub</span>
                </h1>
                <p className='lux-card__subtitle'>Automated Precision Trading System</p>

                {/* Step Indicator (5 Steps) */}
                <div className='lux-steps'>
                    {STEPS.map((s, i) => {
                        const isDone = i < activeIndex;
                        const isActive = i === activeIndex;
                        return (
                            <div
                                key={s.label}
                                className={`lux-step-node ${isDone ? 'lux-step-node--done' : ''} ${
                                    isActive ? 'lux-step-node--active' : ''
                                }`}
                            >
                                <div className='lux-step-circle'>
                                    {isDone ? (
                                        <svg className='lux-check-icon' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='3'>
                                            <polyline points='20 6 9 17 4 12' />
                                        </svg>
                                    ) : (
                                        <span>{i + 1}</span>
                                    )}
                                </div>
                                <span className='lux-step-label'>{s.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* 6 Feature Tiles with 3D Icons */}
                <div className='lux-feature-grid'>
                    {FEATURES.map((item, idx) => (
                        <div key={item.name} className='lux-feature-card' style={{ animationDelay: `${0.2 + idx * 0.06}s` }}>
                            <div className='lux-feature-icon-wrapper' style={{ background: item.color, borderColor: item.border }}>
                                {item.icon}
                            </div>
                            <span className='lux-feature-title'>{item.name}</span>
                        </div>
                    ))}
                </div>

                {/* Connection Status Text */}
                <div className='lux-status-container'>
                    <span className='lux-status-main'>{current.status}</span>
                    <span className='lux-status-sub'>{current.hint}</span>
                </div>

                {/* Progress Bar & Percentage */}
                <div className='lux-progress-wrap'>
                    <div
                        className='lux-progress-track'
                        role='progressbar'
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    >
                        <div className='lux-progress-fill' style={{ width: `${pct}%` }} />
                    </div>
                    <div className='lux-progress-info'>
                        <span className='lux-pct-label'>{pct}%</span>
                    </div>
                </div>

                {/* Footer: Official Deriv Logo & Copyright */}
                <div className='lux-footer-wrapper'>
                    <div className='lux-powered-badge'>
                        <span>Powered by</span>
                        <svg
                            className='lux-deriv-logo'
                            viewBox='0 0 24 24'
                            fill='none'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path
                                d='M0 9.333A9.333 9.333 0 0 1 9.333 0h5.334A9.333 9.333 0 0 1 24 9.333v5.334A9.333 9.333 0 0 1 14.667 24H9.333A9.333 9.333 0 0 1 0 14.667V9.333Z'
                                fill='#FF444F'
                            />
                            <path
                                d='m15.056 4.972-.774 4.389h-2.686c-2.507 0-4.895 2.03-5.338 4.537l-.188 1.066c-.44 2.507 1.232 4.537 3.738 4.537h2.24c1.827 0 3.567-1.479 3.889-3.305L18 4.972h-2.944Zm-1.89 10.742c-.097.558-.6 1.013-1.157 1.013h-1.348c-1.11 0-1.857-.904-1.66-2.02l.115-.658c.197-1.11 1.26-2.02 2.37-2.02h2.327l-.647 3.685Z'
                                fill='#fff'
                            />
                        </svg>
                        <span className='lux-deriv-text'>deriv</span>
                    </div>
                    <p className='lux-copyright'>
                        © {new Date().getFullYear()} Legacy Trading Hub. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LuxuryWelcomeScreen;
