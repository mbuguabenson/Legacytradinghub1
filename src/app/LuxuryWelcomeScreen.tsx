import { useEffect, useMemo, useState } from 'react';
import {
    Activity,
    ArrowRight,
    CheckCircle2,
    Cpu,
    Eye,
    Lock,
    ShieldCheck,
    Sparkles,
    Wallet,
    Zap,
} from 'lucide-react';
import './LuxuryWelcomeScreen.scss';

export type TLuxuryWelcomeScreenProps = {
    onFinished: () => void;
    isComplete: boolean;
    progress: number;
};

interface IInitStage {
    threshold: number;
    phase: string;
    title: string;
    detail: string;
    color: string;
    activeCardIndex: number;
}

const INITIALIZATION_STAGES: IInitStage[] = [
    {
        threshold: 33,
        phase: 'STAGE 01 / 03 • MARKET SCANNER',
        title: 'Verifying Signal Feeds & Market Telemetry',
        detail: 'Connecting high-frequency price feeds & tick database',
        color: '#38bdf8',
        activeCardIndex: 0,
    },
    {
        threshold: 68,
        phase: 'STAGE 02 / 03 • QUANTUM CORE',
        title: 'Calibrating Algorithmic Execution Engines',
        detail: 'Digit Cracker & Circles neural matrix armed',
        color: '#818cf8',
        activeCardIndex: 1,
    },
    {
        threshold: 100,
        phase: 'STAGE 03 / 03 • SETTLEMENT PROTOCOL',
        title: 'Syncing Institutional Settlement Gateway',
        detail: 'Deriv cryptographic bridge verified • Ready to trade',
        color: '#34d399',
        activeCardIndex: 2,
    },
];

interface IFeaturePillar {
    key: 'check' | 'execute' | 'withdraw';
    stepNumber: string;
    name: string;
    subtitle: string;
    description: string;
    tag: string;
    icon: typeof Eye;
    accentColor: string;
}

const FEATURE_PILLARS: IFeaturePillar[] = [
    {
        key: 'check',
        stepNumber: '01',
        name: 'Check',
        subtitle: 'Market Intelligence',
        description: 'Digit Cracker AI, real-time tick patterns & predictive probability filters.',
        tag: 'SCAN & ANALYZE',
        icon: Eye,
        accentColor: '#38bdf8',
    },
    {
        key: 'execute',
        stepNumber: '02',
        name: 'Execute',
        subtitle: 'Precision Trading',
        description: 'Sub-millisecond order placement with dynamic stake & automated stop loss.',
        tag: 'SPEED & ACCURACY',
        icon: Zap,
        accentColor: '#818cf8',
    },
    {
        key: 'withdraw',
        stepNumber: '03',
        name: 'Withdraw',
        subtitle: 'Instant Settlement',
        description: 'Real-time account balance synchronization and secure, zero-friction settlement.',
        tag: 'LIQUIDITY & SECURITY',
        icon: ShieldCheck,
        accentColor: '#34d399',
    },
];

export const LuxuryWelcomeScreen = ({
    onFinished,
    isComplete,
    progress,
}: TLuxuryWelcomeScreenProps) => {
    const [exiting, setExiting] = useState(false);

    const roundedProgress = Math.min(100, Math.max(0, Math.round(progress)));

    useEffect(() => {
        if (!isComplete) return;
        const timer = window.setTimeout(() => {
            setExiting(true);
            window.setTimeout(onFinished, 500);
        }, 260);
        return () => window.clearTimeout(timer);
    }, [isComplete, onFinished]);

    const handleSkip = () => {
        setExiting(true);
        window.setTimeout(onFinished, 420);
    };

    const currentStage = useMemo(() => {
        for (const stage of INITIALIZATION_STAGES) {
            if (roundedProgress <= stage.threshold) return stage;
        }
        return INITIALIZATION_STAGES[INITIALIZATION_STAGES.length - 1];
    }, [roundedProgress]);

    return (
        <div
            className={`lux-welcome-screen ${exiting ? 'lux-welcome-screen--exiting' : 'lux-welcome-screen--visible'}`}
            onClick={handleSkip}
            role='dialog'
            aria-label='Loading Trading Suite'
        >
            {/* ── Atmospheric Ambient Lighting & Vignette ────────── */}
            <div className='lux-bg-vignette' />
            <div className='lux-ambient-mesh' />
            <div className='lux-bg-grid' />

            {/* Subtle floating cyber dust motes */}
            <div className='lux-particles-container' aria-hidden='true'>
                {Array.from({ length: 18 }).map((_, idx) => (
                    <span
                        key={idx}
                        className='lux-particle'
                        style={{
                            left: `${(idx * 23 + 11) % 94}%`,
                            top: `${(idx * 29 + 7) % 92}%`,
                            animationDelay: `${(idx * 0.35) % 3.6}s`,
                            animationDuration: `${3.5 + (idx % 3.5)}s`,
                        }}
                    />
                ))}
            </div>

            {/* ── Main Neumorphic-Glassmorphic Container ──────────── */}
            <div className='lux-card-container' onClick={e => e.stopPropagation()}>
                <div className='lux-welcome-card'>
                    {/* Top Institutional Badge */}
                    <div className='lux-top-badge'>
                        <div className='lux-status-beacon'>
                            <span className='lux-beacon-ring' />
                            <span className='lux-beacon-dot' />
                        </div>
                        <span className='lux-badge-title'>INSTITUTIONAL QUANTUM PLATFORM</span>
                        <span className='lux-badge-sep'>•</span>
                        <span className='lux-badge-sub'>v2.4 SECURE</span>
                        <span className='lux-badge-ping'>0.3ms</span>
                    </div>

                    {/* Emblem Showcase with Breathing Radial Halo */}
                    <div className='lux-emblem-wrap'>
                        <div className='lux-emblem-halo' />
                        <svg
                            xmlns='http://www.w3.org/2000/svg'
                            viewBox='0 0 120 120'
                            fill='none'
                            className='lux-brand-emblem'
                            aria-hidden='true'
                        >
                            <defs>
                                <linearGradient id='luxEmblemGlassBg' x1='0%' y1='0%' x2='100%' y2='100%'>
                                    <stop offset='0%' stopColor='#1e293b' stopOpacity='0.95' />
                                    <stop offset='60%' stopColor='#0f172a' stopOpacity='0.92' />
                                    <stop offset='100%' stopColor='#020617' stopOpacity='0.98' />
                                </linearGradient>
                                <linearGradient id='luxEmblemGlassRim' x1='0%' y1='0%' x2='100%' y2='100%'>
                                    <stop offset='0%' stopColor='#38bdf8' stopOpacity='0.95' />
                                    <stop offset='30%' stopColor='#34d399' stopOpacity='0.85' />
                                    <stop offset='70%' stopColor='#10b981' stopOpacity='0.75' />
                                    <stop offset='100%' stopColor='#064e3b' stopOpacity='0.4' />
                                </linearGradient>
                                <linearGradient id='luxEmblemSheen' x1='0%' y1='0%' x2='100%' y2='100%'>
                                    <stop offset='0%' stopColor='#ffffff' stopOpacity='0.35' />
                                    <stop offset='25%' stopColor='#ffffff' stopOpacity='0.08' />
                                    <stop offset='50%' stopColor='#ffffff' stopOpacity='0' />
                                </linearGradient>

                                {/* 3D Isometric Bar Gradients */}
                                <linearGradient id='luxBar1' x1='0%' y1='0%' x2='0%' y2='100%'>
                                    <stop offset='0%' stopColor='#0ea5e9' />
                                    <stop offset='100%' stopColor='#0369a1' />
                                </linearGradient>
                                <linearGradient id='luxBarTop1' x1='0%' y1='0%' x2='100%' y2='100%'>
                                    <stop offset='0%' stopColor='#7dd3fc' />
                                    <stop offset='100%' stopColor='#38bdf8' />
                                </linearGradient>
                                <linearGradient id='luxBarSide1' x1='0%' y1='0%' x2='100%' y2='0%'>
                                    <stop offset='0%' stopColor='#0284c7' />
                                    <stop offset='100%' stopColor='#075985' />
                                </linearGradient>

                                <linearGradient id='luxBar2' x1='0%' y1='0%' x2='0%' y2='100%'>
                                    <stop offset='0%' stopColor='#10b981' />
                                    <stop offset='100%' stopColor='#047857' />
                                </linearGradient>
                                <linearGradient id='luxBarTop2' x1='0%' y1='0%' x2='100%' y2='100%'>
                                    <stop offset='0%' stopColor='#6ee7b7' />
                                    <stop offset='100%' stopColor='#34d399' />
                                </linearGradient>
                                <linearGradient id='luxBarSide2' x1='0%' y1='0%' x2='100%' y2='0%'>
                                    <stop offset='0%' stopColor='#059669' />
                                    <stop offset='100%' stopColor='#065f46' />
                                </linearGradient>

                                <linearGradient id='luxBar3' x1='0%' y1='0%' x2='0%' y2='100%'>
                                    <stop offset='0%' stopColor='#22d3ee' />
                                    <stop offset='50%' stopColor='#10b981' />
                                    <stop offset='100%' stopColor='#059669' />
                                </linearGradient>
                                <linearGradient id='luxBarTop3' x1='0%' y1='0%' x2='100%' y2='100%'>
                                    <stop offset='0%' stopColor='#e0f2fe' />
                                    <stop offset='100%' stopColor='#38bdf8' />
                                </linearGradient>
                                <linearGradient id='luxBarSide3' x1='0%' y1='0%' x2='100%' y2='0%'>
                                    <stop offset='0%' stopColor='#0891b2' />
                                    <stop offset='100%' stopColor='#0e7490' />
                                </linearGradient>

                                {/* 3D Growth Arrow Gradient */}
                                <linearGradient id='luxSurgeArrow' x1='0%' y1='100%' x2='100%' y2='0%'>
                                    <stop offset='0%' stopColor='#059669' />
                                    <stop offset='35%' stopColor='#10b981' />
                                    <stop offset='75%' stopColor='#06b6d4' />
                                    <stop offset='100%' stopColor='#38bdf8' />
                                </linearGradient>

                                <filter id='luxEmblemShadow' x='-25%' y='-25%' width='150%' height='150%'>
                                    <feDropShadow dx='0' dy='8' stdDeviation='8' floodColor='#000000' floodOpacity='0.55' />
                                </filter>
                                <filter id='luxGlowFilter' x='-30%' y='-30%' width='160%' height='160%'>
                                    <feDropShadow dx='0' dy='2' stdDeviation='4' floodColor='#10b981' floodOpacity='0.55' />
                                </filter>
                            </defs>

                            <g filter='url(#luxEmblemShadow)'>
                                <rect
                                    x='8'
                                    y='8'
                                    width='104'
                                    height='104'
                                    rx='26'
                                    fill='url(#luxEmblemGlassBg)'
                                    stroke='url(#luxEmblemGlassRim)'
                                    strokeWidth='1.8'
                                />
                                <path
                                    d='M12 46 L46 12 C62 12 82 20 98 36 L36 98 C20 82 12 62 12 46 Z'
                                    fill='url(#luxEmblemSheen)'
                                    opacity='0.75'
                                />
                                <path
                                    d='M24 16 C42 10 78 10 96 16'
                                    stroke='#ffffff'
                                    strokeWidth='2'
                                    strokeLinecap='round'
                                    strokeOpacity='0.85'
                                    fill='none'
                                />
                                <g filter='url(#luxGlowFilter)'>
                                    <rect x='26' y='62' width='15' height='34' rx='3' fill='url(#luxBar1)' />
                                    <polygon points='26,62 33,55 48,55 41,62' fill='url(#luxBarTop1)' />
                                    <polygon points='41,62 48,55 48,89 41,96' fill='url(#luxBarSide1)' opacity='0.9' />
                                </g>
                                <g filter='url(#luxGlowFilter)'>
                                    <rect x='49' y='44' width='15' height='52' rx='3' fill='url(#luxBar2)' />
                                    <polygon points='49,44 56,37 71,37 64,44' fill='url(#luxBarTop2)' />
                                    <polygon points='64,44 71,37 71,89 64,96' fill='url(#luxBarSide2)' opacity='0.9' />
                                </g>
                                <g filter='url(#luxGlowFilter)'>
                                    <rect x='72' y='28' width='15' height='68' rx='3' fill='url(#luxBar3)' />
                                    <polygon points='72,28 79,21 94,21 87,28' fill='url(#luxBarTop3)' />
                                    <polygon points='87,28 94,21 94,89 87,96' fill='url(#luxBarSide3)' opacity='0.9' />
                                </g>
                                <path
                                    d='M20 87 L46 55 L64 67 L94 27'
                                    stroke='#047857'
                                    strokeWidth='5.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    fill='none'
                                />
                                <path
                                    d='M20 85 L46 53 L64 65 L94 25'
                                    stroke='url(#luxSurgeArrow)'
                                    strokeWidth='3.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    fill='none'
                                />
                                <polygon
                                    points='80,18 102,20 96,42 91,32 83,34'
                                    fill='url(#luxSurgeArrow)'
                                    filter='url(#luxGlowFilter)'
                                />
                                <circle cx='100' cy='21' r='3.2' fill='#ffffff' />
                            </g>
                        </svg>
                    </div>

                    {/* Brand Typography Hierarchy with Standard Montserrat */}
                    <div className='lux-brand-info'>
                        <h1 className='lux-brand-title'>LEGACY TRADING HUB</h1>
                        <p className='lux-brand-subtitle'>INSTITUTIONAL ALGORITHMIC SUITE</p>
                    </div>

                    {/* Kerned Motto on Regular Font: CHECK | EXECUTE | WITHDRAW */}
                    <div className='lux-motto-banner' aria-label='Core workflow: Check, Execute, Withdraw'>
                        <span className='lux-motto-item'>CHECK</span>
                        <span className='lux-motto-sep'>|</span>
                        <span className='lux-motto-item'>EXECUTE</span>
                        <span className='lux-motto-sep'>|</span>
                        <span className='lux-motto-item'>WITHDRAW</span>
                    </div>

                    {/* ── Feature Cards (Cottoned Neumorphic + Glassmorphic) ────── */}
                    <div className='lux-feature-cards'>
                        {FEATURE_PILLARS.map((pillar, idx) => {
                            const IconComponent = pillar.icon;
                            const isActive = currentStage.activeCardIndex === idx;

                            return (
                                <div
                                    key={pillar.key}
                                    className={`lux-feature-card ${isActive ? 'lux-feature-card--active' : ''}`}
                                    style={{
                                        ['--card-accent' as any]: pillar.accentColor,
                                    }}
                                >
                                    <div className='lux-card-glow-edge' />
                                    <div className='lux-card-top-row'>
                                        <div className='lux-card-icon-box'>
                                            <IconComponent size={16} className='lux-card-icon' />
                                        </div>
                                        <span className='lux-card-step-badge'>{pillar.tag}</span>
                                    </div>

                                    <div className='lux-card-body'>
                                        <h3 className='lux-card-title'>{pillar.name}</h3>
                                        <p className='lux-card-subtitle'>{pillar.subtitle}</p>
                                        <p className='lux-card-desc'>{pillar.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Active Telemetry Stage Tile */}
                    <div className='lux-stage-tile' key={currentStage.phase}>
                        <div
                            className='lux-stage-indicator'
                            style={{ background: currentStage.color, boxShadow: `0 0 10px ${currentStage.color}` }}
                        />
                        <div className='lux-stage-text-block'>
                            <span className='lux-stage-phase'>{currentStage.phase}</span>
                            <span className='lux-stage-title'>{currentStage.title}</span>
                            <span className='lux-stage-detail'>{currentStage.detail}</span>
                        </div>
                    </div>

                    {/* ── Active Colorful Loader Progress Bar ───────────── */}
                    <div className='lux-progress-block'>
                        <div className='lux-progress-header'>
                            <span className='lux-progress-label'>
                                <span className='lux-label-dot' />
                                SYSTEM SYNCHRONIZATION
                            </span>
                            <span className='lux-progress-val'>{roundedProgress}%</span>
                        </div>
                        <div className='lux-progress-track'>
                            <div
                                className='lux-progress-fill'
                                style={{ width: `${Math.max(6, roundedProgress)}%` }}
                            >
                                <span className='lux-progress-laser' />
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom Section: Powered by Deriv & Quick Launch ── */}
                    <div className='lux-card-footer'>
                        {/* Powered by Deriv Official Logo */}
                        <div className='lux-powered-by' title='Powered by Deriv High-Frequency API'>
                            <span className='lux-powered-label'>POWERED BY</span>
                            <div className='lux-deriv-pill'>
                                <svg
                                    xmlns='http://www.w3.org/2000/svg'
                                    width='16'
                                    height='16'
                                    viewBox='0 0 24 24'
                                    fill='none'
                                    className='lux-deriv-logo'
                                    aria-hidden='true'
                                >
                                    <path
                                        d='M0 9.333A9.333 9.333 0 0 1 9.333 0h5.334A9.333 9.333 0 0 1 24 9.333v5.334A9.333 9.333 0 0 1 14.667 24H9.333A9.333 9.333 0 0 1 0 14.667V9.333Z'
                                        fill='#FF444F'
                                    />
                                    <path
                                        d='m15.056 4.972-.774 4.389h-2.686c-2.507 0-4.895 2.03-5.338 4.537l-.188 1.066c-.44 2.507 1.232 4.537 3.738 4.537h2.24c1.827 0 3.567-1.479 3.889-3.305L18 4.499l-2.944.473Zm-1.906 10.81c-.1.564-.607 1.023-1.171 1.023h-1.362c-1.126 0-1.88-.914-1.682-2.043l.117-.665c.2-1.126 1.275-2.042 2.402-2.042h2.353l-.657 3.727Z'
                                        fill='#fff'
                                    />
                                </svg>
                                <span className='lux-deriv-text'>deriv</span>
                            </div>
                        </div>

                        {/* Instant Workspace Launch Button */}
                        <button
                            type='button'
                            className='lux-launch-btn'
                            onClick={handleSkip}
                            title='Enter trading workspace immediately'
                        >
                            <span>Enter Workspace</span>
                            <ArrowRight size={13} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LuxuryWelcomeScreen;
