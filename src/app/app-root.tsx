import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import ErrorBoundary from '@/components/error-component/error-boundary';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { sanitizeAccountsList } from '@/utils/token-bridge';
import { DerivAnalyticsService } from '@/services/deriv-analytics.service';
import { getBrandLabel } from '@/components/shared/utils/brand/brand';
import { ForexChartsBackground } from './ForexChartsBackground';

const MILESTONES = [
    { target: 20, status: 'Initializing your account...' },
    { target: 45, status: 'Connecting to market feeds...' },
    { target: 70, status: 'Loading automated workspaces...' },
    { target: 90, status: 'Calibrating execution engine...' },
    { target: 100, status: 'Account ready. Launching...' },
];

const brandLabel = getBrandLabel();

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

    useEffect(() => {
        if (!isComplete) return;
        const exitTimer = window.setTimeout(() => {
            setExiting(true);
            window.setTimeout(onFinished, 480);
        }, 120);
        return () => window.clearTimeout(exitTimer);
    }, [isComplete, onFinished]);

    const handleSkip = () => {
        setExiting(true);
        window.setTimeout(onFinished, 380);
    };

    const roundedProgress = Math.min(100, Math.round(progress));
    const displayBrand = brandLabel && brandLabel !== 'Legacy Trading Hub' ? brandLabel : 'BinaryTool';
    const title = displayBrand.toUpperCase();
    const subtitle = `${displayBrand} Trading Workspace`;

    return (
        <div
            className={`welcome-screen ${exiting ? 'welcome-screen--exiting' : 'welcome-screen--visible'}`}
            onClick={handleSkip}
            title='Click to enter workspace'
        >
            {/* Dynamic Animated Candlestick Background */}
            <ForexChartsBackground />

            {/* Dark Vignette Overlay for Depth */}
            <div className='bt-backdrop-vignette' aria-hidden='true' />

            {/* Centered Glassmorphic Card (Matches Sample Image) */}
            <div className='bt-welcome-card' onClick={e => e.stopPropagation()}>
                {/* Top Squircle Badge with Monogram */}
                <div className='bt-logo-badge'>
                    <span className='bt-monogram'>BT</span>
                </div>

                {/* Brand Name Typography */}
                <h1 className='bt-card-title'>{title}</h1>

                {/* Subtitle */}
                <div className='bt-card-subtitle'>{subtitle}</div>

                {/* 3 Animated Glowing Pulsating Dots */}
                <div className='bt-dots-wave' aria-hidden='true'>
                    <span className='bt-dot' style={{ animationDelay: '0s' }} />
                    <span className='bt-dot' style={{ animationDelay: '0.2s' }} />
                    <span className='bt-dot' style={{ animationDelay: '0.4s' }} />
                </div>

                {/* Dynamic Status Message */}
                <div className='bt-status-message'>
                    {statusMessage || 'Initializing your account...'}
                </div>

                {/* Slim Glowing Progress Line */}
                <div className='bt-progress-rail'>
                    <div
                        className='bt-progress-fill'
                        style={{ width: `${roundedProgress}%` }}
                    />
                </div>

                {/* Bottom Sequence & Percentage Info */}
                <div className='bt-card-footer'>
                    <span className='bt-footer-sequence'>Boot sequence</span>
                    <span className='bt-footer-percent'>{roundedProgress}%</span>
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
    const [statusIndex, setStatusIndex] = useState(0);
    const [isReducedMotion, setIsReducedMotion] = useState(false);
    const [welcomeForceExit, setWelcomeForceExit] = useState(false);

    const progressRef = useRef(0);
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
