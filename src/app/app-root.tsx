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
    { id: 1, phase: '01/05', label: 'QUANTUM GATEWAY', threshold: 18, status: 'Connecting to Deriv WebSocket Gateway...', sub: 'Establishing 256-bit encrypted enclave session' },
    { id: 2, phase: '02/05', label: 'MARKET SYNC', threshold: 40, status: 'Synchronizing Real-Time Market Ticker...', sub: 'Streaming Forex & Synthetic Volatility index feeds' },
    { id: 3, phase: '03/05', label: 'NEURAL MODELS', threshold: 65, status: 'Calibrating AI Quantitative Models...', sub: 'Pre-caching neural strategy predictors' },
    { id: 4, phase: '04/05', label: 'STRATEGY NODES', threshold: 85, status: 'Arming Automated Strategy Runners...', sub: 'Zero-latency direct execution pipeline active' },
    { id: 5, phase: '05/05', label: 'SYSTEM READY', threshold: 100, status: 'Platform Initialized • System Armed', sub: 'Welcome to Legacy Trading Hub' },
];

const CAPABILITY_PILLS = [
    { id: 'speed', label: 'Ultra Speed', icon: Zap, color: '#ff2e63', minProgress: 15 },
    { id: 'ai', label: 'Neural AI', icon: Cpu, color: '#00f5ff', minProgress: 35 },
    { id: 'bots', label: 'Algo Bots', icon: Bot, color: '#38bdf8', minProgress: 55 },
    { id: 'charts', label: 'Quant Depth', icon: BarChart3, color: '#10b981', minProgress: 75 },
    { id: 'shield', label: 'Risk Guard', icon: ShieldCheck, color: '#f59e0b', minProgress: 90 },
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

            {/* Central Modern Institutional Neumorphic Console */}
            <div className='welcome-screen__card'>
                <div className='ws-card-glow-edge' aria-hidden='true' />

                {/* Top Telemetry Header */}
                <div className='ws-telemetry-topbar'>
                    <div className='ws-node-pill'>
                        <span className='ws-node-dot' />
                        <span className='ws-node-text'>GATEWAY: SECURE 256-BIT</span>
                    </div>
                    <div className='ws-latency-pill'>
                        <Activity size={10} className='ws-latency-icon' />
                        <span>0.8ms • LD4 NODE</span>
                    </div>
                </div>

                {/* Hero Quantum Holographic Emblem */}
                <div className='ws-gyro-emblem-wrap'>
                    <div className='ws-gyro-ring ws-gyro-ring--outer'>
                        <svg viewBox='0 0 100 100' className='ws-gyro-svg'>
                            <circle cx='50' cy='50' r='46' stroke='currentColor' strokeWidth='1.4' strokeDasharray='6 8' fill='none' />
                        </svg>
                    </div>
                    <div className='ws-gyro-ring ws-gyro-ring--inner'>
                        <svg viewBox='0 0 100 100' className='ws-gyro-svg'>
                            <circle cx='50' cy='50' r='38' stroke='currentColor' strokeWidth='1.6' strokeDasharray='22 10 6 10' fill='none' />
                        </svg>
                    </div>
                    <div className='ws-gyro-core'>
                        <div className='ws-gyro-glow-halo' />
                        <img
                            src='/logo_icon.svg'
                            alt={brandLabel || 'Legacy Trading Hub'}
                            className='ws-gyro-logo'
                            onError={(e: any) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Institutional Brand Title */}
                <div className='ws-brand-title'>
                    <span className='brand-white'>{leftBrand}</span>{' '}
                    <span className='brand-gold-cyan'>{rightBrand}</span>
                </div>

                {/* Institutional Badge */}
                <div className='ws-inst-badge'>
                    <span className='ws-badge-dot' />
                    <span>INSTITUTIONAL QUANTUM TERMINAL</span>
                </div>

                {/* Subtitle */}
                <div className='ws-welcome-sub'>
                    Next-Generation Automated Trading & Precision Intelligence
                </div>

                {/* Dynamic Telemetry Stage Box */}
                <div className='ws-telemetry-box'>
                    <div className='ws-telemetry-header'>
                        <span className='ws-telemetry-phase'>PHASE {activeMilestone.phase}</span>
                        <span className='ws-telemetry-label'>{activeMilestone.label}</span>
                    </div>
                    <div className='ws-telemetry-status'>{activeMilestone.status}</div>
                    <div className='ws-telemetry-sub'>{activeMilestone.sub}</div>
                </div>

                {/* Precision Laser Progress Bar */}
                <div className='ws-progress-row'>
                    <div className='ws-progress-track'>
                        <div
                            className='ws-progress-bar'
                            style={{ width: `${roundedProgress}%` }}
                        >
                            <span className='ws-progress-photon' />
                        </div>
                    </div>
                    <div className='ws-progress-val'>
                        <span className='ws-progress-percent'>{roundedProgress}</span>
                        <span className='ws-progress-unit'>%</span>
                    </div>
                </div>

                {/* Streamlined Capability Pill Ribbon */}
                <div className='ws-pills-ribbon'>
                    {CAPABILITY_PILLS.map(pill => {
                        const Icon = pill.icon;
                        const isLit = roundedProgress >= pill.minProgress;
                        return (
                            <div
                                key={pill.id}
                                className={`ws-cap-pill ${isLit ? 'lit' : ''}`}
                                style={{
                                    ['--pill-accent' as any]: pill.color,
                                }}
                            >
                                <Icon size={12} className='ws-pill-icon' />
                                <span>{pill.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Controls & Copyright */}
                <div className='ws-card-footer'>
                    <div className='ws-footer-text'>
                        © 2026 {brandLabel || 'Legacy Trading Hub'} • Powered by Deriv
                    </div>
                    <button
                        type='button'
                        className='ws-enter-btn'
                        onClick={handleSkip}
                        title='Enter platform immediately'
                    >
                        <span>Enter Platform</span>
                        <ArrowRight size={13} className='ws-arrow' />
                    </button>
                </div>
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
