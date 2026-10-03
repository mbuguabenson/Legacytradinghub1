import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import ErrorBoundary from '@/components/error-component/error-boundary';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { useTokenRefresh } from '@/hooks/useTokenRefresh';
import { sanitizeAccountsList } from '@/utils/token-bridge';
import { DerivAnalyticsService } from '@/services/deriv-analytics.service';
import LuxuryWelcomeScreen from './LuxuryWelcomeScreen';

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
                <LuxuryWelcomeScreen
                    onFinished={() => setShowWelcome(false)}
                    isComplete={welcomeComplete}
                    progress={progress}
                />
            )}
        </>
    );
};

export default AppRoot;
