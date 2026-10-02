import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import ErrorBoundary from '@/components/error-component/error-boundary';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { sanitizeAccountsList } from '@/utils/token-bridge';
import { DerivAnalyticsService } from '@/services/deriv-analytics.service';
import {
    Activity,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Lock,
    ShieldCheck,
    Sparkles,
    TrendingUp,
} from 'lucide-react';

const FEATURE_INDICATORS = [
    { title: 'Real-Time Charts', icon: TrendingUp },
    { title: 'Advanced Indicators', icon: BarChart3 },
    { title: 'Market Analysis', icon: Activity },
    { title: 'Secure Trading', icon: ShieldCheck },
];

const Deriv3DWelcomeScreen = ({
    onFinished,
    isComplete,
    progress,
}: {
    onFinished: () => void;
    isComplete: boolean;
    progress: number;
}) => {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (!isComplete) return;
        const timer = window.setTimeout(() => {
            setExiting(true);
            window.setTimeout(onFinished, 550);
        }, 150);
        return () => window.clearTimeout(timer);
    }, [isComplete, onFinished]);

    const handleSkip = () => {
        setExiting(true);
        window.setTimeout(onFinished, 420);
    };

    const roundedProgress = Math.min(100, Math.round(progress));

    // Simulated 3D floating candlesticks for dynamic SVG chart
    const candles = useMemo(() => [
        { x: 30, open: 85, close: 60, high: 50, low: 95, isUp: true },
        { x: 55, open: 60, close: 72, high: 55, low: 80, isUp: false },
        { x: 80, open: 72, close: 45, high: 38, low: 78, isUp: true },
        { x: 105, open: 45, close: 58, high: 40, low: 66, isUp: false },
        { x: 130, open: 58, close: 32, high: 26, low: 62, isUp: true },
        { x: 155, open: 32, close: 25, high: 18, low: 38, isUp: true },
        { x: 180, open: 25, close: 36, high: 22, low: 42, isUp: false },
        { x: 205, open: 36, close: 18, high: 12, low: 40, isUp: true },
        { x: 230, open: 18, close: 10, high: 5, low: 22, isUp: true },
    ], []);

    return (
        <div
            className={`d3d-welcome-screen ${exiting ? 'd3d-welcome-screen--exiting' : 'd3d-welcome-screen--visible'}`}
            onClick={handleSkip}
        >
            {/* Cinematic 3D CGI Photorealistic Render Backdrop */}
            <div
                className='d3d-bg-canvas'
                style={{ backgroundImage: "url('/deriv-3d-welcome-bg.jpg')" }}
            />
            <div className='d3d-vignette-overlay' />
            <div className='d3d-ambient-glow d3d-ambient-glow--cyan' />
            <div className='d3d-ambient-glow d3d-ambient-glow--magenta' />

            {/* Floating 3D Holographic Particle Dust */}
            <div className='d3d-particles-container' aria-hidden='true'>
                {Array.from({ length: 18 }).map((_, idx) => (
                    <span
                        key={idx}
                        className='d3d-particle'
                        style={{
                            left: `${(idx * 23 + 11) % 95}%`,
                            top: `${(idx * 37 + 7) % 90}%`,
                            animationDelay: `${(idx * 0.4) % 3}s`,
                            animationDuration: `${3.5 + (idx % 4)}s`,
                        }}
                    />
                ))}
            </div>

            {/* Main 16:9 Cinematic Layout Container */}
            <div className='d3d-main-wrapper' onClick={e => e.stopPropagation()}>
                {/* ════ LEFT SECTION: Institutional Brand & Loading ════ */}
                <div className='d3d-left-col'>
                    {/* Deriv Logo Area */}
                    <div className='d3d-logo-badge'>
                        <span className='d3d-logo-icon-box'>
                            <span className='d3d-logo-d'>D</span>
                        </span>
                        <span className='d3d-logo-text'>DERIV</span>
                        <span className='d3d-logo-chip'>INSTITUTIONAL</span>
                    </div>

                    {/* Welcoming Headline */}
                    <div className='d3d-headline-group'>
                        <h2 className='d3d-sub-headline'>WELCOME TO</h2>
                        <h1 className='d3d-main-headline'>
                            <span className='text-deriv-red'>DERIV</span>
                        </h1>
                        <p className='d3d-tagline'>Smarter Analysis. Better Trading.</p>
                    </div>

                    {/* Subtle Feature Indicators */}
                    <div className='d3d-features-grid'>
                        {FEATURE_INDICATORS.map((feat, idx) => {
                            const Icon = feat.icon;
                            return (
                                <div key={idx} className='d3d-feature-item'>
                                    <div className='d3d-feature-icon-wrap'>
                                        <Icon size={13} className='d3d-feat-icon' />
                                    </div>
                                    <span className='d3d-feature-text'>{feat.title}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sophisticated Animated Loading Section */}
                    <div className='d3d-loading-section'>
                        <div className='d3d-loading-header'>
                            <span className='d3d-loading-status'>Loading your trading dashboard...</span>
                            <span className='d3d-loading-percent'>{roundedProgress}%</span>
                        </div>

                        {/* Glowing Horizontal Progress Bar (Blue-to-Cyan Gradient) */}
                        <div className='d3d-progress-track'>
                            <div
                                className='d3d-progress-fill'
                                style={{ width: `${Math.max(8, roundedProgress)}%` }}
                            >
                                <span className='d3d-progress-laser' />
                            </div>
                        </div>

                        <div className='d3d-loading-footer'>
                            <span className='d3d-footer-detail'>Volumetric Market Feed Active • 0.3ms</span>
                            <button
                                type='button'
                                className='d3d-quick-launch-btn'
                                onClick={handleSkip}
                                title='Launch dashboard immediately'
                            >
                                <span>Launch Now</span>
                                <ArrowRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ════ RIGHT SECTION: 3D Floating Workstation & Bull/Bear ════ */}
                <div className='d3d-right-col'>
                    {/* Floating 3D Holographic Trading Workstation Panel */}
                    <div className='d3d-workstation-panel'>
                        <div className='d3d-panel-glass-header'>
                            <div className='d3d-asset-selector'>
                                <span className='d3d-asset-dot' />
                                <span className='d3d-asset-name'>VOLATILITY 100 (1S)</span>
                                <span className='d3d-asset-change'>+1.42% ▲</span>
                            </div>
                            <div className='d3d-account-toggle'>
                                <span className='toggle-opt active'>REAL</span>
                                <span className='toggle-opt'>DEMO</span>
                            </div>
                        </div>

                        {/* Floating Candlestick Chart Area */}
                        <div className='d3d-chart-container'>
                            <svg viewBox='0 0 260 120' className='d3d-candlestick-svg'>
                                <defs>
                                    <linearGradient id='d3dTrendGrad' x1='0' y1='100%' x2='100%' y2='0%'>
                                        <stop offset='0%' stopColor='#0066ff' />
                                        <stop offset='100%' stopColor='#00f5ff' />
                                    </linearGradient>
                                    <filter id='d3dGlow' x='-20%' y='-20%' width='140%' height='140%'>
                                        <feGaussianBlur stdDeviation='2.5' result='blur' />
                                        <feMerge>
                                            <feMergeNode in='blur' />
                                            <feMergeNode in='SourceGraphic' />
                                        </feMerge>
                                    </filter>
                                </defs>

                                {/* Glowing Trend Line */}
                                <path
                                    d='M 25 80 Q 75 65, 110 50 T 170 30 T 240 12'
                                    fill='none'
                                    stroke='url(#d3dTrendGrad)'
                                    strokeWidth='2.2'
                                    filter='url(#d3dGlow)'
                                    className='d3d-trend-laser'
                                />

                                {/* Interactive Candlesticks */}
                                {candles.map((c, i) => (
                                    <g key={i} className='d3d-candle-group'>
                                        <line
                                            x1={c.x}
                                            y1={c.high}
                                            x2={c.x}
                                            y2={c.low}
                                            stroke={c.isUp ? '#00f2fe' : '#ff2e63'}
                                            strokeWidth='1.2'
                                            opacity='0.85'
                                        />
                                        <rect
                                            x={c.x - 5}
                                            y={Math.min(c.open, c.close)}
                                            width='10'
                                            height={Math.max(4, Math.abs(c.close - c.open))}
                                            rx='1.5'
                                            fill={c.isUp ? '#00f2fe' : '#ff2e63'}
                                            box-shadow={`0 0 8px ${c.isUp ? '#00f2fe' : '#ff2e63'}`}
                                            opacity='0.92'
                                        />
                                    </g>
                                ))}
                            </svg>
                        </div>

                        {/* Market Depth / Order Book Floating Mini Strip */}
                        <div className='d3d-depth-strip'>
                            <div className='depth-cell depth-ask'>
                                <span className='label'>ASK</span>
                                <span className='val text-magenta'>826.45</span>
                            </div>
                            <div className='depth-cell depth-spread'>
                                <span className='label'>SPREAD</span>
                                <span className='val text-cyan'>0.02 PIPS</span>
                            </div>
                            <div className='depth-cell depth-bid'>
                                <span className='label'>BID</span>
                                <span className='val text-cyan'>826.43</span>
                            </div>
                        </div>

                        {/* Buy / Up and Sell / Down Interface Elements */}
                        <div className='d3d-trade-actions'>
                            <button type='button' className='d3d-trade-btn d3d-btn-buy'>
                                <span className='btn-glow' />
                                <span className='btn-text'>BUY / UP</span>
                                <span className='btn-yield'>+95.4%</span>
                            </button>
                            <button type='button' className='d3d-trade-btn d3d-btn-sell'>
                                <span className='btn-glow' />
                                <span className='btn-text'>SELL / DOWN</span>
                                <span className='btn-yield'>+95.4%</span>
                            </button>
                        </div>
                    </div>

                    {/* Illuminated Circular Platform for 3D Bull & Bear */}
                    <div className='d3d-sculpture-halo-platform'>
                        <div className='halo-ring halo-ring--outer' />
                        <div className='halo-ring halo-ring--inner' />
                        <div className='halo-labels'>
                            <span className='halo-bull-label'>BULLISH MOMENTUM (CYAN)</span>
                            <span className='halo-sep'>•</span>
                            <span className='halo-bear-label'>BEARISH VOLATILITY (MAGENTA)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AppContent = lazy(() => import('./app-content'));

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

const AppRoot = () => {
    const store = useStore();
    const api_base_initialized = useRef(false);
    const api_base_initialization_started = useRef(false);
    const [, setIsApiInitialized] = useState(false);

    useTokenRefresh();

    useEffect(() => {
        void DerivAnalyticsService.initialize();
        import('./app-content');
    }, []);

    const [showWelcome, setShowWelcome] = useState(true);
    const [progress, setProgress] = useState(0);
    const [welcomeForceExit, setWelcomeForceExit] = useState(false);

    // Smooth progressive interpolation curve (takes 2.6s to go 0 -> 100%)
    useEffect(() => {
        let animationFrameId: number;
        let startTime: number | null = null;
        const totalDuration = 2600;

        const step = (timestamp: number) => {
            if (startTime === null) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const next = Math.min(100, Math.round((elapsed / totalDuration) * 100));

            setProgress(next);

            if (next < 100) {
                animationFrameId = window.requestAnimationFrame(step);
            }
        };

        animationFrameId = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(animationFrameId);
    }, []);

    // Expose window.__replayWelcome for testing
    useEffect(() => {
        (window as any).__replayWelcome = () => {
            setShowWelcome(true);
            setProgress(0);
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
        const exitTimer = window.setTimeout(() => {
            setWelcomeForceExit(true);
        }, 3400);
        const hardExitTimer = window.setTimeout(() => {
            setShowWelcome(false);
        }, 4200);

        return () => {
            window.clearTimeout(exitTimer);
            window.clearTimeout(hardExitTimer);
        };
    }, []);

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
                <Deriv3DWelcomeScreen
                    onFinished={() => setShowWelcome(false)}
                    isComplete={welcomeComplete}
                    progress={progress}
                />
            )}
        </>
    );
};

export default AppRoot;
