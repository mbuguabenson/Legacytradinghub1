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
import {
    Activity,
    BarChart3,
    Bot,
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

const INIT_STEPS = [
    { code: 'NET_01', text: 'Connecting to Volatility Markets...' },
    { code: 'AI_02', text: 'Loading Algorithmic Trading Models...' },
    { code: 'AUTH_03', text: 'Authenticating Deriv Quantum Gateway...' },
    { code: 'SCAN_04', text: 'Calibrating Multi-Market Scanner...' },
    { code: 'SYNC_05', text: 'Synchronizing Live Orderbook...' },
    { code: 'CORE_06', text: 'Finalizing Trading Suite...' },
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
    const [activeStep, setActiveStep] = useState(0);

    // Dynamic step cycling for telemetry stream
    useEffect(() => {
        const stepTimer = window.setInterval(() => {
            setActiveStep(prev => (prev + 1) % INIT_STEPS.length);
        }, 750);
        return () => window.clearInterval(stepTimer);
    }, []);

    // Instant smooth exit transition when initialization completes
    useEffect(() => {
        if (!isComplete) return;
        const exitTimer = window.setTimeout(() => {
            setExiting(true);
            window.setTimeout(onFinished, 480);
        }, 50);
        return () => window.clearTimeout(exitTimer);
    }, [isComplete, onFinished]);

    const roundedProgress = Math.min(100, Math.round(progress));

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

    const currentStepObj = INIT_STEPS[activeStep] || INIT_STEPS[0];
    const displayStatus = statusMessage || currentStepObj.text;

    return (
        <div className={`welcome-screen ${exiting ? 'welcome-screen--exiting' : 'welcome-screen--visible'}`}>
            {/* Ambient Lighting Spheres */}
            <div className='ws-ambient-glow ws-ambient-glow--cyan' aria-hidden='true' />
            <div className='ws-ambient-glow ws-ambient-glow--amber' aria-hidden='true' />
            <div className='ws-vignette' aria-hidden='true' />

            {/* Central Institutional Console Card */}
            <div className='welcome-screen__card'>
                <div className='ws-card-glow-edge' aria-hidden='true' />

                {/* Sleek Orbital Brand Emblem */}
                <div className='ws-emblem-wrapper'>
                    <div className='ws-orbit-ring ws-orbit-ring--outer'>
                        <div className='ws-orbit-dot' />
                    </div>
                    <div className='ws-orbit-ring ws-orbit-ring--inner' />
                    <div className='ws-emblem-core'>
                        <img
                            src='/logo_icon.svg'
                            alt='Legacy Trading Hub'
                            className='ws-emblem-logo'
                            onError={(e: any) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                </div>

                {/* Brand Title */}
                <div className='ws-brand-header'>
                    <span className='brand-white'>{leftBrand}</span>
                    <span className='brand-gold-cyan'>{rightBrand}</span>
                </div>

                {/* Institutional Badge */}
                <div className='ws-hud-badge'>
                    <span className='live-beacon-dot' />
                    <span className='badge-text'>INSTITUTIONAL QUANTUM PLATFORM</span>
                </div>

                {/* Subtitle */}
                <p className='ws-subtitle'>Next-Gen Algorithmic Execution & Neural Market Suite</p>

                {/* Hairline Precision Progress & Telemetry */}
                <div className='ws-telemetry-container'>
                    <div className='ws-progress-track'>
                        <div
                            className='ws-progress-bar'
                            style={{ width: `${roundedProgress}%` }}
                        >
                            <span className='ws-progress-photon' />
                        </div>
                    </div>

                    <div className='ws-telemetry-footer'>
                        <span className='ws-status-text'>{displayStatus}</span>
                        <span className='ws-status-percent'>{roundedProgress}%</span>
                    </div>
                </div>

                {/* Security Tag */}
                <div className='ws-security-tag'>
                    <ShieldCheck size={12} className='ws-security-icon' />
                    <span>256-Bit Quantum Enclave • End-to-End WebSocket Encryption</span>
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
            setStatusIndex(prev => (prev + 1) % INIT_STEPS.length);
        }, 900);
        return () => {
            if (statusIntervalRef.current) {
                window.clearInterval(statusIntervalRef.current);
            }
        };
    }, []);

    // Snappy, ultra-fast smooth interpolation curve
    useEffect(() => {
        let animationFrameId: number;
        const step = () => {
            const current = progressRef.current;
            const target = targetProgressRef.current;
            const increment = isReducedMotion ? 5 : Math.max(1.6, (target - current) * 0.22);
            const next = Math.min(100, current + increment);
            progressRef.current = next;
            setProgress(next);
            if (next < 100) {
                animationFrameId = window.requestAnimationFrame(step);
            }
        };
        animationFrameId = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(animationFrameId);
    }, [isReducedMotion]);

    useEffect(() => {
        if (is_api_initialized) {
            targetProgressRef.current = 100;
        } else {
            targetProgressRef.current = 75;
        }
    }, [is_api_initialized]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            if (!api_base_initialized.current) {
                console.warn('API initialization timeout reached; proceeding to app content.');
                setIsApiInitialized(true);
                targetProgressRef.current = 100;
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
                targetProgressRef.current = 100;
                window.clearTimeout(timeoutId);
            }
        };
        initializeApi();
        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        welcomeTimeoutRef.current = window.setTimeout(() => {
            setWelcomeForceExit(true);
            setShowWelcome(false);
        }, 1600);

        welcomeHardExitRef.current = window.setTimeout(() => {
            setShowWelcome(false);
        }, 2200);

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
        INIT_STEPS[statusIndex % INIT_STEPS.length]?.text || 'Connecting to Volatility Markets...';
    const welcomeComplete = (is_api_initialized && progress >= 95) || welcomeForceExit;

    if (showWelcome) {
        return (
            <WelcomeScreen
                onFinished={() => setShowWelcome(false)}
                isComplete={welcomeComplete}
                progress={progress}
                statusMessage={statusMessage}
            />
        );
    }

    if (!store || !is_api_initialized) return null;

    return (
        <Suspense fallback={null}>
            <ErrorBoundary root_store={store}>
                <ErrorComponentWrapper />
                <AppContent />
            </ErrorBoundary>
        </Suspense>
    );
};

export default AppRoot;
