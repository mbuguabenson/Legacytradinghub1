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
    { code: 'AI_02', text: 'Loading Neural Trading Models...' },
    { code: 'AUTH_03', text: 'Authenticating Deriv Quantum Gateway...' },
    { code: 'SCAN_04', text: 'Calibrating Multi-Market Scanner...' },
    { code: 'SYNC_05', text: 'Synchronizing Live Orderbook...' },
    { code: 'CORE_06', text: 'Finalizing Legacy Trading Suite...' },
];

const TICKER_ITEMS = [
    { symbol: 'ETH/USD', price: '2,450.20', change: '+0.1%', isUp: true },
    { symbol: 'EUR/USD', price: '1.0874', change: '-0.1%', isUp: false },
    { symbol: 'GBP/USD', price: '1.2854', change: '+0.4%', isUp: true },
    { symbol: 'GOLD', price: '2,345.80', change: '+0.6%', isUp: true },
    { symbol: 'XRP/USD', price: '0.6234', change: '+1.2%', isUp: true },
    { symbol: 'V10 (1s)', price: '1,284.50', change: '+0.1%', isUp: true },
    { symbol: 'V25 (1s)', price: '2,861.35', change: '-0.7%', isUp: false },
    { symbol: 'V75 (1s)', price: '84,320.10', change: '+1.2%', isUp: true },
    { symbol: 'SOL/USD', price: '178.34', change: '+0.8%', isUp: true },
    { symbol: 'OIL/USD', price: '82.47', change: '-1.4%', isUp: false },
    { symbol: 'BTC/USD', price: '67,234.50', change: '+2.1%', isUp: true },
    { symbol: '1HZ100V', price: '1,450.20', change: '+1.5%', isUp: true },
];

const CANDLESTICKS = [
    { isBull: true, height: 65, wickTop: 15, wickBottom: 12 },
    { isBull: false, height: 45, wickTop: 8, wickBottom: 20 },
    { isBull: false, height: 80, wickTop: 18, wickBottom: 15 },
    { isBull: true, height: 95, wickTop: 22, wickBottom: 10 },
    { isBull: false, height: 110, wickTop: 25, wickBottom: 18 },
    { isBull: true, height: 70, wickTop: 14, wickBottom: 16 },
    { isBull: true, height: 85, wickTop: 10, wickBottom: 25 },
    { isBull: false, height: 50, wickTop: 12, wickBottom: 8 },
    { isBull: false, height: 90, wickTop: 20, wickBottom: 22 },
    { isBull: true, height: 120, wickTop: 28, wickBottom: 14 },
    { isBull: false, height: 75, wickTop: 16, wickBottom: 18 },
    { isBull: true, height: 60, wickTop: 12, wickBottom: 10 },
    { isBull: true, height: 105, wickTop: 24, wickBottom: 16 },
    { isBull: false, height: 85, wickTop: 15, wickBottom: 22 },
    { isBull: false, height: 55, wickTop: 10, wickBottom: 12 },
    { isBull: true, height: 90, wickTop: 18, wickBottom: 14 },
    { isBull: true, height: 115, wickTop: 26, wickBottom: 20 },
    { isBull: false, height: 70, wickTop: 14, wickBottom: 16 },
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
        <div className={`welcome-screen ${exiting ? 'welcome-screen--zoom-out' : 'welcome-screen--visible'}`}>
            {/* 1. Cyber Perspective Floor Grid */}
            <div className='ws-cyber-grid' aria-hidden='true' />

            {/* 2. Background Financial Candlesticks */}
            <div className='ws-candlesticks-bg' aria-hidden='true'>
                {CANDLESTICKS.map((candle, idx) => (
                    <div
                        key={idx}
                        className={`candle-item ${candle.isBull ? 'candle--bull' : 'candle--bear'}`}
                        style={{ height: `${candle.height}px` }}
                    >
                        <div className='candle-wick candle-wick--top' style={{ height: `${candle.wickTop}px` }} />
                        <div className='candle-body' />
                        <div className='candle-wick candle-wick--bottom' style={{ height: `${candle.wickBottom}px` }} />
                    </div>
                ))}
            </div>

            {/* 3. Deep Ambient Atmospheric Glows */}
            <div className='ws-vignette-overlay' aria-hidden='true' />
            <div className='ws-ambient-glow ws-ambient-glow-cyan' aria-hidden='true' />
            <div className='ws-ambient-glow ws-ambient-glow-purple' aria-hidden='true' />
            <div className='ws-ambient-glow ws-ambient-glow-gold' aria-hidden='true' />

            {/* 4. Centerpiece Glassmorphic Command Console Card */}
            <div className='welcome-screen__card'>
                {/* Specular Light Sweep Edge */}
                <div className='ws-specular-edge' aria-hidden='true' />

                {/* A. 3D Holographic Crest with Multi-Ring Gyroscope */}
                <div className='ws-crest-section'>
                    <div className='ws-gyro-crest-wrapper'>
                        <div className='ws-radar-ring ws-radar-outer'>
                            <span className='radar-node node-cyan' />
                        </div>
                        <div className='ws-radar-ring ws-radar-mid'>
                            <span className='radar-node node-gold' />
                        </div>
                        <div className='ws-radar-ring ws-radar-inner' />
                        <div className='ws-crest-shield'>
                            <img
                                src='/logo_icon.svg'
                                alt='Legacy Trading Hub'
                                className='ws-crest-image'
                                onError={(e: any) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>
                    </div>

                    {/* Brand Titles with Shimmer */}
                    <div className='ws-brand-title'>
                        <span className='brand-left'>{leftBrand}</span>
                        <span className='brand-right'>{rightBrand}</span>
                    </div>

                    {/* System HUD Status Pill */}
                    <div className='ws-hud-pills'>
                        <div className='hud-pill hud-pill--live'>
                            <span className='pulse-dot' />
                            <span className='hud-label'>SYSTEM ONLINE</span>
                        </div>
                        <div className='hud-pill hud-pill--security'>
                            <Lock size={10} className='text-cyan' />
                            <span className='hud-label'>256-BIT ENCRYPTED</span>
                        </div>
                        <div className='hud-pill hud-pill--gateway'>
                            <Radio size={10} className='text-amber' />
                            <span className='hud-label'>DERIV WS-SECURE</span>
                        </div>
                    </div>
                </div>

                <div className='ws-card-divider' />

                {/* B. Subtitle Greetings */}
                <div className='ws-greetings'>
                    <h2 className='greeting-title'>Institutional Quantum Trading Suite</h2>
                    <p className='greeting-sub'>Next-Generation Algorithmic Execution & Neural Market Analysis</p>
                </div>

                {/* C. Precision Laser Progress Bar & Telemetry */}
                <div className='ws-progress-block'>
                    <div className='progress-meta-row'>
                        <div className='telemetry-status-stream'>
                            <div className='ws-waveform-bars' aria-hidden='true'>
                                <span className='wf-bar wf-1' />
                                <span className='wf-bar wf-2' />
                                <span className='wf-bar wf-3' />
                                <span className='wf-bar wf-4' />
                                <span className='wf-bar wf-5' />
                            </div>
                            <span className='phase-badge'>PHASE 0{activeStep + 1}</span>
                            <span className='status-caption'>{displayStatus}</span>
                        </div>
                        <div className='progress-bracket-value'>
                            <span className='bracket'>[</span>
                            <span className='value'>{roundedProgress}%</span>
                            <span className='bracket'>]</span>
                        </div>
                    </div>

                    <div className='ws-progress-track'>
                        <div className='ws-progress-fill' style={{ width: `${roundedProgress}%` }}>
                            <div className='laser-particle-head' />
                        </div>
                        <div className='ws-track-grid-ticks' aria-hidden='true'>
                            <span /><span /><span /><span /><span />
                        </div>
                    </div>
                </div>

                {/* D. Step Phase Indicators */}
                <div className='ws-dots-row'>
                    {INIT_STEPS.map((step, idx) => (
                        <div
                            key={step.code}
                            className={`dot-pill ${idx === activeStep ? 'dot-pill--active' : idx < activeStep ? 'dot-pill--passed' : ''}`}
                            title={step.text}
                        />
                    ))}
                </div>

                {/* E. 3 High-Tech Glass Feature Pillars */}
                <div className='ws-orbs-grid'>
                    <div className='feature-capsule feature-capsule--cyan'>
                        <div className='capsule-icon-wrap'>
                            <Activity size={18} className='text-cyan' />
                        </div>
                        <div className='capsule-text'>
                            <span className='capsule-title'>Neural Scanners</span>
                            <span className='capsule-desc'>Deep Pattern AI</span>
                        </div>
                    </div>

                    <div className='feature-capsule feature-capsule--gold'>
                        <div className='capsule-icon-wrap'>
                            <Bot size={18} className='text-gold' />
                        </div>
                        <div className='capsule-text'>
                            <span className='capsule-title'>Quantum Bots</span>
                            <span className='capsule-desc'>Automated Execution</span>
                        </div>
                    </div>

                    <div className='feature-capsule feature-capsule--teal'>
                        <div className='capsule-icon-wrap'>
                            <Copy size={18} className='text-teal' />
                        </div>
                        <div className='capsule-text'>
                            <span className='capsule-title'>Copy-Trading</span>
                            <span className='capsule-desc'>Real-time Replication</span>
                        </div>
                    </div>
                </div>

                {/* F. Footer Caption */}
                <div className='ws-card-footer-caption'>
                    <ShieldCheck size={13} className='text-emerald' />
                    <span>Protected by Legacy Quantum Security Gateway • Zero-Knowledge Proofs</span>
                </div>
            </div>

            {/* 5. Bottom Live Financial Ticker Ribbon */}
            <div className='ws-bottom-ticker-bar'>
                <div className='ticker-track'>
                    {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                        <div key={idx} className='ticker-item'>
                            <span className='ticker-symbol'>{item.symbol}</span>
                            <span className='ticker-price'>{item.price}</span>
                            <span className={`ticker-change ${item.isUp ? 'change-up' : 'change-down'}`}>
                                {item.change}
                            </span>
                        </div>
                    ))}
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

    if (!store || !is_api_initialized) return <AppRootLoader />;

    return (
        <Suspense fallback={<AppRootLoader />}>
            <ErrorBoundary root_store={store}>
                <ErrorComponentWrapper />
                <AppContent />
            </ErrorBoundary>
        </Suspense>
    );
};

export default AppRoot;
