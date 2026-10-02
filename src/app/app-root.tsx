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
    CheckCircle2,
    Clock,
    Cpu,
    Flame,
    Gauge,
    Globe,
    Layers,
    Lock,
    Radio,
    Shield,
    ShieldCheck,
    Sparkles,
    Terminal,
    TrendingUp,
    Wifi,
    Zap,
} from 'lucide-react';

const SYSTEM_ENGINES = [
    {
        id: 'ws_gateway',
        name: 'DERIV QUANTUM GATEWAY',
        detail: 'Direct WebSocket • 0.3ms Ping',
        icon: Wifi,
        color: '#00f5ff',
        threshold: 15,
    },
    {
        id: 'ultra_engine',
        name: 'CONTINUOUS TICK REACTOR',
        detail: 'Ultra Speed • Concurrency Armed',
        icon: Flame,
        color: '#ff6b00',
        threshold: 35,
    },
    {
        id: 'neural_ai',
        name: 'QUANT PREDICTIVE ENGINE',
        detail: 'Neural Matrix • 21 Bot Kernels',
        icon: Cpu,
        color: '#a855f7',
        threshold: 65,
    },
    {
        id: 'risk_arbiter',
        name: 'INSTITUTIONAL RISK ARBITER',
        detail: 'Autonomous Stop & Margin Enclave',
        icon: ShieldCheck,
        color: '#10b981',
        threshold: 85,
    },
];

const LIVE_RADAR_PAIRS = [
    { symbol: 'VOLATILITY 100 (1S)', price: '826.40', change: '+0.94%', up: true, tag: 'SYNTHETIC' },
    { symbol: 'BOOM 1000 INDEX', price: '9,864.50', change: '+1.12%', up: true, tag: 'CRASH/BOOM' },
    { symbol: 'XAU/USD (GOLD)', price: '2,686.80', change: '+1.32%', up: true, tag: 'COMMODITY' },
    { symbol: 'BTC/USD', price: '66,850.0', change: '+3.42%', up: true, tag: 'CRYPTO' },
    { symbol: 'EUR/USD', price: '1.08456', change: '+0.38%', up: true, tag: 'FOREX' },
];

const SYSTEM_LOGS = [
    { min: 5, text: '[SYS_BOOT] Initializing Quantum Core v4.8 kernel...' },
    { min: 20, text: '[GATEWAY] Connected to Deriv High-Throughput WSS cluster.' },
    { min: 40, text: '[TICK_FEED] Sub-second continuous tick pipeline synchronized.' },
    { min: 60, text: '[ALGO_CORE] 21 automated trading bots pre-compiled.' },
    { min: 80, text: '[DMA_EXEC] Ultra tick-by-tick execution active (0 settlement latency).' },
    { min: 95, text: '[SYSTEM_READY] All nodes synchronized. Terminal armed.' },
];

const MILESTONES = [
    { target: 15, status: 'Authenticating Deriv Quantum WebSocket Gateway...' },
    { target: 35, status: 'Arming Continuous Ultra Tick Execution Engine...' },
    { target: 60, status: 'Calibrating 21 Quantitative Algorithmic Bots...' },
    { target: 85, status: 'Synchronizing High-Frequency Market Radar Feeds...' },
    { target: 100, status: 'Direct Market Access Enclave Online. Launching Terminal...' },
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
    const [currentTime, setCurrentTime] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(11, 23) + ' UTC';
    });

    // Real-time live cyber clock ticker
    useEffect(() => {
        const timer = window.setInterval(() => {
            const now = new Date();
            setCurrentTime(now.toISOString().slice(11, 23) + ' UTC');
        }, 80);
        return () => window.clearInterval(timer);
    }, []);

    // Cinematic smooth zoom exit transition when initialization completes
    useEffect(() => {
        if (!isComplete) return;
        const exitTimer = window.setTimeout(() => {
            setExiting(true);
            window.setTimeout(onFinished, 550);
        }, 80);
        return () => window.clearTimeout(exitTimer);
    }, [isComplete, onFinished]);

    const handleSkip = () => {
        setExiting(true);
        window.setTimeout(onFinished, 450);
    };

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

    // Arc reactor circular progress calculation (r = 104, circumference = 2 * PI * 104 ≈ 653.45)
    const arcCircumference = 653.45;
    const strokeDashoffset = arcCircumference - (arcCircumference * roundedProgress) / 100;

    // Segmented laser bar (24 segments)
    const totalSegments = 24;
    const activeSegments = Math.round((roundedProgress / 100) * totalSegments);

    // Spectrum Equalizer bars (28 bars with deterministic dynamic heights)
    const spectrumBars = useMemo(() => {
        return Array.from({ length: 28 }, (_, i) => {
            const base = Math.sin((i / 28) * Math.PI) * 28 + 8;
            return { id: i, baseHeight: Math.round(base) };
        });
    }, []);

    return (
        <div className={`welcome-screen ${exiting ? 'welcome-screen--exiting' : 'welcome-screen--visible'}`}>
            {/* Dynamic Animated Candlestick Background */}
            <ForexChartsBackground />

            {/* Dark Cyber Mesh Matrix Overlay */}
            <div className='ws-cyber-grid-mesh' aria-hidden='true' />

            {/* Full Panoramic Cockpit Bridge */}
            <div className='welcome-cockpit'>
                {/* ═══ 1. TOP AVIONICS / TELEMETRY STATUS HUD BAR ═══ */}
                <header className='ws-avionics-bar'>
                    <div className='ws-avionics-left'>
                        <div className='ws-status-beacon'>
                            <span className='ws-beacon-pulse' />
                            <span className='ws-beacon-dot' />
                        </div>
                        <div className='ws-avionics-meta'>
                            <div className='ws-meta-primary'>GATEWAY ONLINE • ENCLAVE 256-BIT</div>
                            <div className='ws-meta-secondary'>EQUINIX LD4 LONDON • DERIV DIRECT API</div>
                        </div>
                    </div>

                    <div className='ws-avionics-center'>
                        <div className='ws-hud-brand-chip'>
                            <span className='ws-brand-mono-lead'>SYS//</span>
                            <span className='ws-brand-mono-name'>{brandLabel || 'LEGACY TRADING HUB'}</span>
                            <span className='ws-brand-mono-ver'>v4.8 DMA</span>
                        </div>
                    </div>

                    <div className='ws-avionics-right'>
                        <div className='ws-clock-chip'>
                            <Clock size={11} className='ws-clock-icon' />
                            <span className='ws-clock-digits'>{currentTime}</span>
                        </div>
                        <div className='ws-ping-chip'>
                            <Activity size={11} className='ws-ping-icon' />
                            <span>0.3ms</span>
                        </div>
                        <button
                            type='button'
                            className='ws-quick-enter-btn'
                            onClick={handleSkip}
                            title='Skip and enter terminal immediately'
                        >
                            <span>Enter Platform</span>
                            <ArrowRight size={12} className='ws-enter-arrow' />
                        </button>
                    </div>
                </header>

                {/* ═══ 2. TRI-PANEL PANORAMIC COMMAND DECK ═══ */}
                <main className='ws-command-deck'>
                    {/* ── LEFT WING: Subsystem Telemetry & Terminal Logs ── */}
                    <section className='ws-deck-wing ws-deck-wing--left'>
                        <div className='ws-panel-glass'>
                            <div className='ws-panel-header'>
                                <div className='ws-panel-title-wrap'>
                                    <Terminal size={14} className='ws-panel-title-icon' />
                                    <span className='ws-panel-title'>SYSTEM DIAGNOSTICS</span>
                                </div>
                                <span className='ws-panel-badge'>4/4 NODES</span>
                            </div>

                            {/* 4 Cyber Engine Matrix Cards */}
                            <div className='ws-engine-matrix'>
                                {SYSTEM_ENGINES.map(engine => {
                                    const Icon = engine.icon;
                                    const isArmed = roundedProgress >= engine.threshold;
                                    return (
                                        <div
                                            key={engine.id}
                                            className={`ws-engine-card ${isArmed ? 'armed' : 'standby'}`}
                                            style={{ ['--engine-accent' as any]: engine.color }}
                                        >
                                            <div className='ws-engine-icon-wrap'>
                                                <Icon size={14} className='ws-engine-icon' />
                                            </div>
                                            <div className='ws-engine-info'>
                                                <div className='ws-engine-name'>{engine.name}</div>
                                                <div className='ws-engine-detail'>{engine.detail}</div>
                                            </div>
                                            <div className='ws-engine-status-tag'>
                                                {isArmed ? (
                                                    <span className='tag-armed'>
                                                        <Check size={10} /> ARMED
                                                    </span>
                                                ) : (
                                                    <span className='tag-sync'>SYNCING</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Live Terminal Log Feed */}
                            <div className='ws-terminal-console'>
                                <div className='ws-terminal-bar'>
                                    <span className='ws-term-dot ws-term-dot--red' />
                                    <span className='ws-term-dot ws-term-dot--yellow' />
                                    <span className='ws-term-dot ws-term-dot--green' />
                                    <span className='ws-terminal-bar-title'>telemetry.log</span>
                                </div>
                                <div className='ws-terminal-logs'>
                                    {SYSTEM_LOGS.filter(log => roundedProgress >= log.min).map((log, index) => (
                                        <div key={index} className='ws-term-line'>
                                            <span className='ws-term-prompt'>&gt;</span>
                                            <span className='ws-term-text'>{log.text}</span>
                                        </div>
                                    ))}
                                    <div className='ws-term-cursor-line'>
                                        <span className='ws-term-prompt'>&gt;</span>
                                        <span className='ws-term-active-status'>{statusMessage}</span>
                                        <span className='ws-term-caret' />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── CENTER WING: The Quantum Arc Reactor Core ── */}
                    <section className='ws-deck-center'>
                        <div className='ws-reactor-stage'>
                            {/* Ambient Flare Behind Reactor */}
                            <div className='ws-reactor-flare' aria-hidden='true' />

                            {/* 3D Holographic Speedometer / Arc Reactor */}
                            <div className='ws-reactor-orb'>
                                <svg viewBox='0 0 240 240' className='ws-reactor-svg'>
                                    <defs>
                                        <linearGradient id='reactorGrad' x1='0%' y1='0%' x2='100%' y2='100%'>
                                            <stop offset='0%' stopColor='#00f5ff' />
                                            <stop offset='50%' stopColor='#ff6b00' />
                                            <stop offset='100%' stopColor='#ff2e63' />
                                        </linearGradient>
                                        <linearGradient id='ringGrad' x1='0%' y1='0%' x2='100%' y2='0%'>
                                            <stop offset='0%' stopColor='rgba(0, 245, 255, 0.15)' />
                                            <stop offset='100%' stopColor='rgba(255, 107, 0, 0.15)' />
                                        </linearGradient>
                                        <filter id='neonGlow' x='-20%' y='-20%' width='140%' height='140%'>
                                            <feGaussianBlur stdDeviation='3.5' result='blur' />
                                            <feMerge>
                                                <feMergeNode in='blur' />
                                                <feMergeNode in='SourceGraphic' />
                                            </feMerge>
                                        </filter>
                                    </defs>

                                    {/* Outer Ticking Compass Track */}
                                    <circle
                                        cx='120'
                                        cy='120'
                                        r='114'
                                        stroke='rgba(255, 255, 255, 0.08)'
                                        strokeWidth='1.5'
                                        strokeDasharray='3 8'
                                        fill='none'
                                        className='ws-reactor-ticks-outer'
                                    />

                                    {/* Middle Static Guide Ring */}
                                    <circle
                                        cx='120'
                                        cy='120'
                                        r='104'
                                        stroke='url(#ringGrad)'
                                        strokeWidth='6'
                                        fill='none'
                                    />

                                    {/* Active Glowing Progress Arc */}
                                    <circle
                                        cx='120'
                                        cy='120'
                                        r='104'
                                        stroke='url(#reactorGrad)'
                                        strokeWidth='7'
                                        strokeLinecap='round'
                                        strokeDasharray={arcCircumference}
                                        strokeDashoffset={strokeDashoffset}
                                        fill='none'
                                        filter='url(#neonGlow)'
                                        className='ws-reactor-progress-arc'
                                        transform='rotate(-90 120 120)'
                                    />

                                    {/* Inner Counter-Rotating Reticle */}
                                    <circle
                                        cx='120'
                                        cy='120'
                                        r='90'
                                        stroke='rgba(0, 245, 255, 0.3)'
                                        strokeWidth='1.2'
                                        strokeDasharray='18 12 4 12'
                                        fill='none'
                                        className='ws-reactor-reticle'
                                    />
                                </svg>

                                {/* Reactor Core Digital Center */}
                                <div className='ws-reactor-core'>
                                    <div className='ws-core-brand-icon-wrap'>
                                        <img
                                            src='/logo_icon.svg'
                                            alt='Logo'
                                            className='ws-core-logo'
                                            onError={(e: any) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className='ws-core-metric'>
                                        <span className='ws-core-number'>{roundedProgress}</span>
                                        <span className='ws-core-percent'>%</span>
                                    </div>
                                    <div className='ws-core-label'>QUANTUM BOOT</div>
                                </div>
                            </div>

                            {/* High-Frequency Spectrum Equalizer Arc */}
                            <div className='ws-spectrum-equalizer'>
                                {spectrumBars.map(bar => {
                                    const isLit = (bar.id / 28) * 100 <= roundedProgress;
                                    return (
                                        <span
                                            key={bar.id}
                                            className={`ws-eq-bar ${isLit ? 'lit' : ''}`}
                                            style={{
                                                height: `${isLit ? Math.max(6, bar.baseHeight) : 4}px`,
                                            }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Core Identity Typography */}
                            <div className='ws-reactor-brand-title'>
                                <span className='brand-glow-white'>{leftBrand}</span>{' '}
                                <span className='brand-glow-gradient'>{rightBrand}</span>
                            </div>
                            <div className='ws-reactor-brand-sub'>
                                INSTITUTIONAL QUANTITATIVE SUITE • ZERO-LATENCY EXECUTION
                            </div>
                        </div>
                    </section>

                    {/* ── RIGHT WING: Live Market Stream & Key Capabilities ── */}
                    <section className='ws-deck-wing ws-deck-wing--right'>
                        <div className='ws-panel-glass'>
                            <div className='ws-panel-header'>
                                <div className='ws-panel-title-wrap'>
                                    <Globe size={14} className='ws-panel-title-icon' />
                                    <span className='ws-panel-title'>MARKET RADAR PULSE</span>
                                </div>
                                <span className='ws-panel-badge ws-panel-badge--green'>FEED LIVE</span>
                            </div>

                            {/* Live Financial Radar Pairs */}
                            <div className='ws-radar-list'>
                                {LIVE_RADAR_PAIRS.map((pair, idx) => (
                                    <div key={idx} className='ws-radar-row'>
                                        <div className='ws-radar-symbol-info'>
                                            <span className='ws-radar-symbol'>{pair.symbol}</span>
                                            <span className='ws-radar-tag'>{pair.tag}</span>
                                        </div>
                                        <div className='ws-radar-price-info'>
                                            <span className='ws-radar-price'>{pair.price}</span>
                                            <span className={`ws-radar-change ${pair.up ? 'up' : 'down'}`}>
                                                {pair.change}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Platform Institutional Specs */}
                            <div className='ws-specs-grid'>
                                <div className='ws-spec-box'>
                                    <div className='ws-spec-key'>EXECUTION SPEED</div>
                                    <div className='ws-spec-val text-fire'>ULTRA • EVERY TICK</div>
                                </div>
                                <div className='ws-spec-box'>
                                    <div className='ws-spec-key'>LATENCY TARGET</div>
                                    <div className='ws-spec-val text-cyan'>&lt; 0.4ms DIRECT</div>
                                </div>
                                <div className='ws-spec-box'>
                                    <div className='ws-spec-key'>BOT REPERTOIRE</div>
                                    <div className='ws-spec-val text-white'>21 KERNEL ALGORITHMS</div>
                                </div>
                                <div className='ws-spec-box'>
                                    <div className='ws-spec-key'>AUTHENTICATION</div>
                                    <div className='ws-spec-val text-emerald'>TLS 1.3 SECURE</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                {/* ═══ 3. BOTTOM LASER HUD PROGRESS RAIL & CONTROLS ═══ */}
                <footer className='ws-bottom-bar'>
                    <div className='ws-bottom-left'>
                        <div className='ws-progress-caption'>
                            <span className='ws-caption-prefix'>STAGE PROTOCOL:</span>
                            <span className='ws-caption-status'>{statusMessage}</span>
                        </div>
                        {/* 24-Segmented Laser LED Track */}
                        <div className='ws-laser-segmented-track'>
                            {Array.from({ length: totalSegments }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`ws-laser-segment ${i < activeSegments ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className='ws-bottom-right'>
                        <div className='ws-completion-percent'>
                            <span className='val'>{roundedProgress}</span>
                            <span className='unit'>% ARMED</span>
                        </div>
                        <button
                            type='button'
                            className='ws-terminal-enter-btn'
                            onClick={handleSkip}
                            title='Enter trading platform immediately'
                        >
                            <span>LAUNCH TERMINAL</span>
                            <ArrowRight size={14} className='ws-launch-icon' />
                        </button>
                    </div>
                </footer>
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
