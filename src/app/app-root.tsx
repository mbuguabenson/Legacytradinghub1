import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import ErrorBoundary from '@/components/error-component/error-boundary';
import ChunkLoader from '@/components/loader/chunk-loader';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { sanitizeAccountsList } from '@/utils/token-bridge';
import { DerivAnalyticsService } from '@/services/deriv-analytics.service';
import { getBrandLabel } from '@/components/shared/utils/brand/brand';
import { ForexChartsBackground } from './ForexChartsBackground';
import {
    Activity,
    ArrowRight,
    BarChart3,
    Bot,
    Check,
    Copy,
    Cpu,
    Loader2,
    Lock,
    Radio,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    Zap,
} from 'lucide-react';
import './app-root.scss';

const AppContent = lazy(() => import('./app-content'));

const brandLabel = getBrandLabel();

const AppRootLoader = () => {
    return <ChunkLoader message={`Loading ${brandLabel}...`} />;
};

const ErrorComponentWrapper = observer(() => {
    const { common } = useStore();

    if (!common.error || !common.has_error) return null;

    const handleClearError = () => {
        common.setError(false, {});
    };

    return (
        <div className='error-wrapper-backdrop'>
            <div className='error-wrapper-modal'>
                <h3 className='error-wrapper-title'>{common.error?.header || 'Notice'}</h3>
                <p className='error-wrapper-msg'>
                    {common.error?.message || 'A temporary connection update occurred.'}
                </p>
                <div className='error-wrapper-actions'>
                    <button onClick={handleClearError} className='btn-primary'>
                        Continue to Trading
                    </button>
                    <button onClick={() => window.location.reload()} className='btn-secondary'>
                        Refresh Page
                    </button>
                </div>
            </div>
        </div>
    );
});

const MILESTONES = [
    { id: 1, label: 'CONNECTION', threshold: 18, status: 'Establishing secure connection...', sub: 'Connecting to Deriv WebSocket Gateway...' },
    { id: 2, label: 'MARKET DATA', threshold: 40, status: 'Streaming live market data...', sub: 'Synchronizing Forex & Volatility Ticks...' },
    { id: 3, label: 'AI ENGINE', threshold: 64, status: 'Initializing AI quantitative models...', sub: 'Calibrating Neural Prediction Engine...' },
    { id: 4, label: 'TRADING BOTS', threshold: 85, status: 'Mounting automated strategy bots...', sub: 'Configuring Risk Management Blocks...' },
    { id: 5, label: 'FINAL SETUP', threshold: 100, status: 'Finalizing quantum environment...', sub: 'Trading Platform Ready' },
];

const FEATURE_CARDS = [
    {
        id: 'free-bots',
        name: 'Free Bots',
        icon: Bot,
        color: '#00f5ff',
        bg: 'rgba(0, 245, 255, 0.14)',
        borderColor: 'rgba(0, 245, 255, 0.28)',
    },
    {
        id: 'ai-bots',
        name: 'AI Bots',
        icon: Cpu,
        color: '#d946ef',
        bg: 'rgba(217, 70, 239, 0.14)',
        borderColor: 'rgba(217, 70, 239, 0.28)',
    },
    {
        id: 'analysis-tool',
        name: 'Analysis Tool',
        icon: BarChart3,
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.14)',
        borderColor: 'rgba(16, 185, 129, 0.28)',
    },
    {
        id: 'smart-analysis',
        name: 'Smart Analysis',
        icon: Sparkles,
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.14)',
        borderColor: 'rgba(245, 158, 11, 0.28)',
    },
    {
        id: 'copy-trading',
        name: 'Copy Trading',
        icon: Copy,
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.14)',
        borderColor: 'rgba(56, 189, 248, 0.28)',
    },
    {
        id: 'signals',
        name: 'Signals',
        icon: Radio,
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.14)',
        borderColor: 'rgba(52, 211, 153, 0.28)',
    },
];

const WelcomeScreen = ({
    onFinished,
    isComplete,
    progress,
    statusMessage,
}: {
    onFinished: () => void;
    isComplete: boolean;
    progress: number;
    statusMessage: string;
}) => {
    const [exiting, setExiting] = useState(false);

    // Cinematic smooth zoom exit transition when initialization completes
    useEffect(() => {
        if (!isComplete) return;
        const exitTimer = window.setTimeout(() => {
            setExiting(true);
            window.setTimeout(onFinished, 620); // 620ms allows smooth camera zoom-in to complete
        }, 80);
        return () => window.clearTimeout(exitTimer);
    }, [isComplete, onFinished]);

    const handleSkip = () => {
        setExiting(true);
        window.setTimeout(onFinished, 500);
    };

    const roundedProgress = Math.min(100, Math.round(progress));

    // Determine current milestone
    const currentMilestoneIndex = useMemo(() => {
        for (let i = 0; i < MILESTONES.length; i++) {
            if (roundedProgress <= MILESTONES[i].threshold) {
                return i;
            }
        }
        return MILESTONES.length - 1;
    }, [roundedProgress]);

    const activeMilestone = MILESTONES[currentMilestoneIndex] || MILESTONES[0];

    // Dynamic split brand representation
    const { leftBrand, rightBrand } = useMemo(() => {
        const full = (brandLabel || 'LEGACY TRADING HUB').trim();
        const parts = full.split(' ');
        if (parts.length >= 2) {
            return { leftBrand: parts[0], rightBrand: parts.slice(1).join(' ') };
        }
        const mid = Math.ceil(full.length / 2);
        return { leftBrand: full.slice(0, mid), rightBrand: full.slice(mid) };
    }, []);

    return (
        <div className={`welcome-screen ${exiting ? 'welcome-screen--exiting' : 'welcome-screen--visible'}`}>
            {/* Dynamic Animated Forex Candlestick & Technical Charts Background */}
            <ForexChartsBackground />

            {/* Central Modern Institutional Card matching reference */}
            <div className='welcome-screen__card'>
                <div className='ws-card-glow-edge' aria-hidden='true' />

                {/* Top Brand Header */}
                <div className='ws-brand-header'>
                    <div className='ws-brand-emblem'>
                        <img
                            src='/logo_icon.svg'
                            alt={brandLabel || 'Legacy Trading Hub'}
                            className='ws-brand-logo'
                            onError={(e: any) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    <div className='ws-brand-text-block'>
                        <div className='ws-brand-title'>
                            <span className='brand-white'>{leftBrand}</span>{' '}
                            <span className='brand-gold-cyan'>{rightBrand}</span>
                        </div>
                    </div>
                </div>

                {/* Welcome Heading & Subtitle */}
                <div className='ws-welcome-heading'>
                    Welcome to <span className='brand-cyan'>{brandLabel || 'Legacy Trading Hub'}</span>
                </div>
                <div className='ws-welcome-sub'>
                    Automated Precision Trading System
                </div>

                {/* 5-Step Milestone Stepper */}
                <div className='ws-stepper'>
                    <div className='ws-stepper-track-bg'>
                        <div
                            className='ws-stepper-track-fill'
                            style={{
                                width: `${Math.min(100, Math.max(0, (roundedProgress / 100) * 100))}%`,
                            }}
                        />
                    </div>
                    {MILESTONES.map((step, idx) => {
                        const isDone = roundedProgress >= step.threshold;
                        const isActive = !isDone && (idx === 0 || roundedProgress >= MILESTONES[idx - 1].threshold);

                        return (
                            <div
                                key={step.id}
                                className={`ws-step-node ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                            >
                                <div className='ws-step-circle'>
                                    {isDone ? (
                                        <Check size={11} strokeWidth={3} className='ws-check-icon' />
                                    ) : (
                                        <span className='ws-step-number'>{step.id}</span>
                                    )}
                                </div>
                                <span className='ws-step-label'>{step.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* 6 Modern Feature Cards (3x2 Grid) */}
                <div className='ws-cards-grid'>
                    {FEATURE_CARDS.map((card, idx) => {
                        const Icon = card.icon;
                        const isCardLit = roundedProgress >= (idx + 1) * 15;

                        return (
                            <div
                                key={card.id}
                                className={`ws-feature-card ${isCardLit ? 'lit' : ''}`}
                                style={{
                                    ['--card-accent' as any]: card.color,
                                    ['--card-bg' as any]: card.bg,
                                    ['--card-border' as any]: card.borderColor,
                                }}
                            >
                                <div className='ws-card-icon-bubble'>
                                    <Icon size={18} style={{ color: card.color }} />
                                </div>
                                <span className='ws-card-name'>{card.name}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Status Readout */}
                <div className='ws-status-line'>
                    <span className='ws-status-main'>
                        {activeMilestone.status}
                    </span>
                    <span className='ws-status-sub'>
                        {activeMilestone.sub}
                    </span>
                </div>

                {/* Precision Progress Bar & Percentage */}
                <div className='ws-progress-row'>
                    <div className='ws-progress-track'>
                        <div
                            className='ws-progress-bar'
                            style={{ width: `${roundedProgress}%` }}
                        >
                            <span className='ws-progress-photon' />
                        </div>
                    </div>
                    <span className='ws-progress-percent'>{roundedProgress}%</span>
                </div>

                {/* Card Footer Copyright */}
                <div className='ws-footer-text'>
                    © 2026 {brandLabel || 'Legacy Trading Hub'}. Powered by Deriv. All rights reserved.
                </div>

                {/* Skip / Enter platform button */}
                <button
                    type='button'
                    className='ws-enter-btn'
                    onClick={handleSkip}
                    title='Enter platform immediately'
                >
                    <span>Enter Platform</span>
                    <ArrowRight size={12} />
                </button>
            </div>
        </div>
    );
};

const AppRoot = () => {
    const store = useStore();
    const api_base_initialized = useRef(false);
    const api_base_initialization_started = useRef(false);
    const [is_api_initialized, setIsApiInitialized] = useState(false);

    useTokenRefresh();

    useEffect(() => {
        void DerivAnalyticsService.initialize();
        import('./app-content');
    }, []);

    const [showWelcome, setShowWelcome] = useState(true);
    const [progress, setProgress] = useState(0);
    const [statusIndex, setStatusIndex] = useState(0);
    const [isReducedMotion, setIsReducedMotion] = useState(false);
    const [welcomeForceExit, setWelcomeForceExit] = useState(false);

    const progressRef = useRef(0);
    const targetProgressRef = useRef(0);
    const statusIntervalRef = useRef<number | null>(null);
    const welcomeTimeoutRef = useRef<number | null>(null);
    const welcomeHardExitRef = useRef<number | null>(null);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setIsReducedMotion(mediaQuery.matches);
        const handleMotionChange = (event: MediaQueryListEvent) => {
            setIsReducedMotion(event.matches);
        };
        mediaQuery.addEventListener('change', handleMotionChange);
        return () => mediaQuery.removeEventListener('change', handleMotionChange);
    }, []);

    useEffect(() => {
        statusIntervalRef.current = window.setInterval(() => {
            setStatusIndex(prev => (prev + 1) % MILESTONES.length);
        }, 900);
        return () => {
            if (statusIntervalRef.current) {
                window.clearInterval(statusIntervalRef.current);
            }
        };
    }, []);

    // Smooth, progressive interpolation curve (takes 2.4s to go 0 -> 100%)
    useEffect(() => {
        let animationFrameId: number;
        let startTime: number | null = null;
        const totalDuration = isReducedMotion ? 600 : 2400;

        const step = (timestamp: number) => {
            if (startTime === null) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const next = Math.min(100, Math.round((elapsed / totalDuration) * 100));

            progressRef.current = next;
            setProgress(next);

            if (next < 100) {
                animationFrameId = window.requestAnimationFrame(step);
            }
        };

        animationFrameId = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(animationFrameId);
    }, [isReducedMotion]);

    // Expose window.__replayWelcome for testing
    useEffect(() => {
        (window as any).__replayWelcome = () => {
            setShowWelcome(true);
            setProgress(0);
            progressRef.current = 0;
        };
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (!api_base_initialized.current) {
                console.warn('API initialization timeout reached; proceeding to app content.');
                setIsApiInitialized(true);
            }
        }, 1400);

        const initializeApi = async () => {
            if (api_base_initialization_started.current) return;
            api_base_initialization_started.current = true;
            try {
                sanitizeAccountsList();
                await api_base.init();
                api_base_initialized.current = true;
            } catch (error) {
                console.error('API initialization failed:', error);
                api_base_initialized.current = false;
            } finally {
                setIsApiInitialized(true);
                window.clearTimeout(timeoutId);
            }
        };
        initializeApi();
        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        welcomeTimeoutRef.current = window.setTimeout(() => {
            setWelcomeForceExit(true);
        }, 3000);

        welcomeHardExitRef.current = window.setTimeout(() => {
            setShowWelcome(false);
        }, 3800);

        return () => {
            if (welcomeTimeoutRef.current) {
                window.clearTimeout(welcomeTimeoutRef.current);
            }
            if (welcomeHardExitRef.current) {
                window.clearTimeout(welcomeHardExitRef.current);
            }
        };
    }, []);

    const statusMessage =
        MILESTONES[statusIndex % MILESTONES.length]?.status || 'Connecting to Volatility & Forex Markets...';
    const welcomeComplete = progress >= 100 || welcomeForceExit;

    if (!store) return null;

    return (
        <>
            <Suspense fallback={null}>
                <ErrorBoundary root_store={store}>
                    <ErrorComponentWrapper />
                    <AppContent />
                </ErrorBoundary>
            </Suspense>

            {showWelcome && (
                <WelcomeScreen
                    onFinished={() => setShowWelcome(false)}
                    isComplete={welcomeComplete}
                    progress={progress}
                    statusMessage={statusMessage}
                />
            )}
        </>
    );
};

export default AppRoot;
