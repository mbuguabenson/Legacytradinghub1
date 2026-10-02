import { BridgeStateMachine, BridgeState } from './bridge-state-machine';
import { SessionManager as _SessionManager, sessionManager } from './session-manager';
import { BridgeEvent, BridgeMessage, createMessage, isValidBridgeMessage } from './protocol';
import { secureSessionService } from '@/services/secure-session.service';
import { getAppId } from '@/components/shared/utils/config/config';
import { makeBridgeLogger, generateInstanceId } from './bridge-diagnostics';
import { getAccountsList, getActiveToken, getLegacyDTraderToken, resolveValidDerivWSToken } from '@/utils/token-bridge';
import { OAuthTokenExchangeService } from '@/services/oauth-token-exchange.service';

export interface BridgeDiagnosticInfo {
    state: BridgeState;
    appId: string;
    parentOrigin: string;
    iframeOrigin: string;
    sessionStatus: 'valid' | 'invalid' | 'none';
    lastEvent: BridgeEvent | string | null;
    lastError: string | null;
    reconnects: number;
    pendingMessages: number;
    messageHistory: Array<{ direction: 'in' | 'out'; msg: BridgeMessage; time: Date }>;
}

export class ParentBridgeClient {
    public stateMachine: BridgeStateMachine;
    private iframeWindow: Window | null = null;
    private iframeOrigin: string = 'https://profhubdtrader.vercel.app';
    private reconnectAttempts: number = 0;
    private maxReconnects: number = 5;
    private instanceId: string;
    private logger: ReturnType<typeof makeBridgeLogger>;
    private retryIntervalId: any = null;
    private cachedOtpUrl: string = '';

    // Diagnostics
    private diagnostics: BridgeDiagnosticInfo = {
        state: BridgeState.IDLE,
        appId: getAppId() || '121856',
        parentOrigin: typeof window !== 'undefined' ? window.location.origin : 'unknown',
        iframeOrigin: 'https://profhubdtrader.vercel.app',
        sessionStatus: 'none',
        lastEvent: null,
        lastError: null,
        reconnects: 0,
        pendingMessages: 0,
        messageHistory: [],
    };

    private listeners: Set<() => void> = new Set();
    private sessionUnsubscribe: (() => void) | null = null;
    private activeTimeouts: Set<any> = new Set();

    private safeTimeout(fn: () => void, delay: number) {
        const id = setTimeout(() => {
            this.activeTimeouts.delete(id);
            if (!this.iframeWindow) return;
            fn();
        }, delay);
        this.activeTimeouts.add(id);
        return id;
    }

    constructor() {
        this.stateMachine = new BridgeStateMachine(BridgeState.IDLE);
        this.diagnostics.state = this.stateMachine.getState();
        this.instanceId = generateInstanceId();
        this.logger = makeBridgeLogger(this.instanceId);
        this.logger.debug('BRIDGE_INIT', {
            appId: this.diagnostics.appId,
            parentOrigin: this.diagnostics.parentOrigin,
        });

        this.stateMachine.subscribe(state => {
            const previous = this.diagnostics.state;
            this.diagnostics.state = state;
            this.logger.stateChange(previous, state as string, 'stateMachine.subscribe');
            this.notifyDiagnosticListeners();
        });

        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.handleMessage);
        }
    }

    public attach(iframe: HTMLIFrameElement, expectedOrigin: string, initialOtpUrl?: string) {
        const targetOrigin = expectedOrigin && expectedOrigin !== '*' ? expectedOrigin : 'https://profhubdtrader.vercel.app';
        this.iframeWindow = iframe.contentWindow;
        this.iframeOrigin = targetOrigin;
        this.diagnostics.iframeOrigin = targetOrigin;
        if (initialOtpUrl) {
            this.cachedOtpUrl = initialOtpUrl;
        }
        this.logger.debug('IFRAME_ATTACH', { iframeOrigin: targetOrigin });

        this.stateMachine.transitionTo(BridgeState.LOADING_IFRAME);

        this.sessionUnsubscribe = sessionManager.subscribe(session => {
            this.handleSessionChange(session);
        });

        // Prefetch authenticated OTP WebSocket URL for DTrader iframe so WebSocket connects immediately
        const targetLoginId =
            sessionManager.getSession()?.loginid ||
            localStorage.getItem('active_loginid') ||
            localStorage.getItem('client.loginid') ||
            '';
        const targetToken =
            getActiveToken(targetLoginId) ||
            getActiveToken() ||
            OAuthTokenExchangeService.getAccessToken() ||
            localStorage.getItem('bot_new_api_token') ||
            '';
        if (targetToken && !this.cachedOtpUrl) {
            import('@/services/derivws-accounts.service')
                .then(({ DerivWSAccountsService }) => {
                    DerivWSAccountsService.fetchOTPWebSocketURL(targetToken, targetLoginId)
                        .catch(() => DerivWSAccountsService.getAuthenticatedWebSocketURL(targetToken))
                        .then(url => {
                            if (url) {
                                this.cachedOtpUrl = url;
                                if (this.iframeWindow) {
                                    const currency = sessionManager.getSession()?.currency || localStorage.getItem('client.currency') || 'USD';
                                    const appIdStr = String(sessionManager.getSession()?.appId || getAppId() || '121856');
                                    this.sendAuthPayloadToWindow(
                                        this.iframeWindow,
                                        targetToken,
                                        targetLoginId,
                                        currency,
                                        appIdStr,
                                        url
                                    );
                                }
                            }
                        })
                        .catch(err => {
                            console.warn('[ParentBridge] OTP prefetch note:', err);
                        });
                })
                .catch(() => {});
        }

        // Proactively send auth handshakes to iframe continuously
        this.startProactiveAuthLoop();

        // Also hook iframe load event to immediately push auth when DOM is ready
        try {
            iframe.addEventListener('load', () => {
                this.dispatchAuth();
            });
        } catch {}

        this.safeTimeout(() => {
            if (this.stateMachine.getState() === BridgeState.LOADING_IFRAME) {
                this.stateMachine.transitionTo(BridgeState.WAITING_READY);
            }
        }, 500);
    }

    public dispatchAuth(wsUrlParam?: string) {
        if (wsUrlParam) {
            this.cachedOtpUrl = wsUrlParam;
        }
        if (this.iframeWindow) {
            const session = sessionManager.getSession();
            const loginid =
                session?.loginid ||
                localStorage.getItem('active_loginid') ||
                localStorage.getItem('client.loginid') ||
                '';
            const syncToken =
                getActiveToken(loginid) ||
                getActiveToken() ||
                OAuthTokenExchangeService.getAccessToken() ||
                localStorage.getItem('bot_new_api_token') ||
                '';
            const currency = session?.currency || localStorage.getItem('client.currency') || 'USD';
            const appIdStr = String(session?.appId || getAppId() || '121856');
            this.sendAuthPayloadToWindow(
                this.iframeWindow,
                syncToken,
                loginid,
                currency,
                appIdStr,
                this.cachedOtpUrl
            );
        }
    }

    private sendAuthPayloadToWindow(
        targetWindow: Window,
        tok: string,
        loginid: string,
        currency: string,
        appIdStr: string,
        otpUrlParam: string = ''
    ) {
        if (!targetWindow || targetWindow === window) return;
        try {
            // For Deriv DTrader iframe, if legacy token is available prefer it, otherwise use active token (OAuth2 or PAT)
            let tokenToUse = tok;
            if (tok && tok.startsWith('ey')) {
                const legacy = getLegacyDTraderToken(loginid) || localStorage.getItem('token1');
                if (legacy) {
                    tokenToUse = legacy;
                }
            }

            const effectiveOtpUrl = otpUrlParam || this.cachedOtpUrl || '';

            const hasToken =
                Boolean(tokenToUse && !isInvalidBearerToken(tokenToUse));

            // CRITICAL FIX: If there is no real token or no valid account (or fake DOT100000/CR100000), NEVER send auth payloads!
            // Sending fake/empty auth payloads breaks DTrader's WebSocket and triggers "Proposal error" on every trade!
            if (!hasToken || !loginid || loginid.includes('100000')) {
                return;
            }

            const authMode = hasToken ? 'derivws_otp' : 'none';
            const effectiveToken = tokenToUse;

            const accountsList = getAccountsList();
            const isDemo =
                loginid.startsWith('VR') ||
                loginid.startsWith('VRT') ||
                loginid.startsWith('DEM');

            const accounts =
                Object.keys(accountsList).length > 0
                    ? Object.entries(accountsList).map(([id]) => ({
                          account_id: id,
                          account_type: (id.startsWith('VR') ||
                          id.startsWith('VRT') ||
                          id.startsWith('DEM')
                              ? 'demo'
                              : 'real') as 'demo' | 'real',
                          currency: currency || 'USD',
                          balance: '10000.00',
                          status: 'active',
                      }))
                    : [
                          {
                              account_id: loginid,
                              account_type: isDemo ? ('demo' as const) : ('real' as const),
                              currency: currency || 'USD',
                              balance: '10000.00',
                              status: 'active',
                          },
                      ];

            const activeAccId = loginid;
            const profileCountry =
                localStorage.getItem('residence') ||
                localStorage.getItem('country') ||
                localStorage.getItem('client.country') ||
                'ke';

            // Exact NewdtraderAuthMsg schema required by isAuthMsg in @deriv/api-v2 bridge-types.ts
            const v2AuthMsg = {
                type: 'deriv:dtrader:auth',
                version: 'v2',
                auth: {
                    access_token: effectiveToken,
                    token_type: 'Bearer',
                    expires_at: Date.now() + 86400000,
                },
                activeAccountId: activeAccId,
                accounts,
                otpUrl: effectiveOtpUrl,
                ws_url: effectiveOtpUrl,
                userProfile: {
                    country: profileCountry.toLowerCase(),
                    currency: currency || 'USD',
                    email: 'user@profithub.co.ke',
                    fullname: 'Profithub Trader',
                },
                clientId: appIdStr || '121856',
                apiBase: 'https://api.derivws.com',
                authBase: 'https://auth.deriv.com',
            };

            const legacyV2AuthMsg = {
                ...v2AuthMsg,
                type: 'newdtrader:auth',
            };

            const payloadInner = {
                status: 'success',
                tokenPresent: hasToken,
                token: effectiveToken,
                token1: effectiveToken,
                access_token: effectiveToken,
                loginid: activeAccId,
                loginId: activeAccId,
                acct1: activeAccId,
                account_id: activeAccId,
                accounts,
                otpUrl: effectiveOtpUrl,
                otp_url: effectiveOtpUrl,
                ws_url: effectiveOtpUrl,
                currency: currency || 'USD',
                cur1: currency || 'USD',
                accountType: 'ZOOM',
                account_type: 'ZOOM',
                appId: Number(appIdStr) || 121856,
                app_id: appIdStr,
                server: 'green',
                timestamp: Date.now(),
                authMode,
                defaultSymbol: '1HZ100V',
                embedBase: this.iframeOrigin && this.iframeOrigin !== '*' ? this.iframeOrigin : 'https://profhubdtrader.vercel.app',
            };

            const rawClientAccounts = localStorage.getItem('client.accounts');
            const activeLoginId = localStorage.getItem('active_loginid') || activeAccId;

            const payloadData = {
                ...payloadInner,
                payload: payloadInner,
                'client.accounts': rawClientAccounts,
                active_loginid: activeLoginId,
            };

            const structuredMsg = createMessage('NEWDTRADER_BRIDGE_AUTH', appIdStr, 'parent', payloadInner);

            const postBoth = (msg: any) => {
                try {
                    // Use '*' as target origin: the parent doesn't know the
                    // iframe's actual current origin (it may differ from
                    // expectedOrigin during navigations/redirects). Specifying a
                    // wrong origin causes a DOMException that floods the console.
                    // This is safe because `targetWindow` is our own iframe
                    // reference, not an arbitrary window.
                    targetWindow.postMessage(msg, '*');
                    if (typeof msg === 'object') {
                        try {
                            targetWindow.postMessage(JSON.stringify(msg), '*');
                        } catch {}
                    }
                } catch {
                    // ignore
                }
            };

            postBoth(v2AuthMsg);
            postBoth(legacyV2AuthMsg);
            postBoth(structuredMsg);
            // 1. Dispatch expected NewdtraderBridge Auth Handshake
            postBoth({
                type: 'NEWDTRADER_BRIDGE_AUTH',
                msg_type: 'authorization',
                token: effectiveToken,
                accountName: activeAccId,
                appId: appIdStr || '121856',
                currency: currency || 'USD',
                'client.accounts': rawClientAccounts,
                active_loginid: activeLoginId,
                ...payloadData,
            });
            // 2. Dispatch legacy authorize fallback
            postBoth({
                action: 'authorize',
                token: effectiveToken,
                loginid: activeAccId,
                'client.accounts': rawClientAccounts,
                active_loginid: activeLoginId,
            });
            postBoth({
                type: 'SYNC_CREDENTIALS',
                'client.accounts': rawClientAccounts,
                active_loginid: activeLoginId,
            });
            postBoth({ action: 'NEWDTRADER_BRIDGE_AUTH', msg_type: 'authorization', ...payloadData });
            postBoth({ type: 'NEWDTRADER_BRIDGE_AUTH_RESPONSE', ...payloadData });
            postBoth({ type: 'NEW_DTRADER_BRIDGE_AUTH', ...payloadData });
            postBoth({ type: 'SESSION_DATA', ...payloadData });
            postBoth({ type: 'DERIV_AUTH', ...payloadData });
            postBoth({ type: 'AUTH_TOKEN', ...payloadData });
            postBoth({ type: 'HANDSHAKE_RESPONSE', ...payloadData });
            postBoth({ type: 'BRIDGE_AUTH_SUCCESS', ...payloadData });
            postBoth({ type: 'AUTH_SUCCESS', ...payloadData });
            postBoth({ action: 'setToken', ...payloadData });
            postBoth({ action: 'AUTHORIZE', ...payloadData });
        } catch {
            // ignore
        }
    }

    /**
     * Sends AUTH_INIT to the iframe: loginid + expiresAt ONLY, NO raw token.
     * The iframe will reply with REQUEST_TOKEN, which triggers sendOTT().
     */
    private sendAuthInit() {
        if (!this.iframeWindow) return;
        const meta = secureSessionService.getSessionMeta();
        if (!meta?.loggedIn || !meta.loginid) return;

        try {
            this.iframeWindow.postMessage({
                type:      'AUTH_INIT',
                source:    'parent',
                loginid:   meta.loginid,
                currency:  meta.currency,
                expiresAt: meta.expiresAt,
            }, '*');
        } catch (e) {
            this.logger.debug('AUTH_INIT_SEND_FAILED', { error: String(e) });
        }
    }

    /**
     * Fetches a One-Time Token from the server and posts it to the iframe.
     * Called when the iframe sends REQUEST_TOKEN.
     */
    private async sendOTT(targetWindow: Window, replyOrigin: string) {
        const ott = await secureSessionService.getOTT();
        if (!ott) {
            this.logger.debug('OTT_FETCH_FAILED', {});
            return;
        }
        try {
            targetWindow.postMessage({ type: 'OTT', ott }, '*');
        } catch (e) {
            this.logger.debug('OTT_SEND_FAILED', { error: String(e) });
        }
    }

    private startProactiveAuthLoop() {
        if (this.retryIntervalId) clearInterval(this.retryIntervalId);

        let attempts = 0;
        const maxAttempts = 6; // ~6s @ 1000ms

        const postAuth = async () => {
            if (!this.iframeWindow) return;
            try {
                const session = sessionManager.getSession();
                const loginid =
                    session?.loginid ||
                    localStorage.getItem('active_loginid') ||
                    localStorage.getItem('client.loginid') ||
                    '';
                const syncToken =
                    getActiveToken(loginid) ||
                    getActiveToken() ||
                    OAuthTokenExchangeService.getAccessToken() ||
                    getLegacyDTraderToken(loginid) ||
                    localStorage.getItem('bot_new_api_token') ||
                    '';
                const currency = session?.currency || localStorage.getItem('client.currency') || 'USD';
                const appIdStr = String(session?.appId || getAppId() || '121856');

                if (syncToken) {
                    this.sendAuthPayloadToWindow(this.iframeWindow, syncToken, loginid, currency, appIdStr, this.cachedOtpUrl);
                }
                this.sendAuthInit();

                if (!syncToken) {
                    const resolvedToken = await resolveValidDerivWSToken(loginid);
                    if (resolvedToken && resolvedToken !== syncToken && this.iframeWindow) {
                        this.sendAuthPayloadToWindow(this.iframeWindow, resolvedToken, loginid, currency, appIdStr, this.cachedOtpUrl);
                    }
                }
            } catch {
                // ignore
            }
        };

        postAuth();
        this.retryIntervalId = setInterval(() => {
            attempts++;
            if (!this.iframeWindow || attempts >= maxAttempts) {
                if (this.retryIntervalId) clearInterval(this.retryIntervalId);
                return;
            }
            postAuth();
        }, 1000);
    }

    public detach() {
        if (this.retryIntervalId) {
            clearInterval(this.retryIntervalId);
            this.retryIntervalId = null;
        }
        this.activeTimeouts.forEach(id => clearTimeout(id));
        this.activeTimeouts.clear();
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.handleMessage);
        }
        if (this.sessionUnsubscribe) {
            this.sessionUnsubscribe();
            this.sessionUnsubscribe = null;
        }
        this.iframeWindow = null;
        this.logger.debug('IFRAME_DETACH');
        this.stateMachine.transitionTo(BridgeState.IDLE);
    }

    public getDiagnostics(): BridgeDiagnosticInfo {
        return this.diagnostics;
    }

    public subscribeDiagnostics(listener: () => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyDiagnosticListeners() {
        this.listeners.forEach(listener => {
            try {
                listener();
            } catch (e) {
                console.error(e);
            }
        });
    }

    private logMessage(direction: 'in' | 'out', msg: BridgeMessage) {
        this.diagnostics.messageHistory.unshift({ direction, msg, time: new Date() });
        if (this.diagnostics.messageHistory.length > 50) {
            this.diagnostics.messageHistory.pop();
        }
        this.diagnostics.lastEvent = msg.type;
        this.notifyDiagnosticListeners();
    }

    private sendMessage<T>(type: BridgeEvent | string, payload: T) {
        if (!this.iframeWindow) return;

        const session = sessionManager.getSession();
        const appId = session?.appId || getAppId() || '121856';
        this.diagnostics.appId = appId;

        const msg = createMessage(type, appId, 'parent', payload);
        this.logMessage('out', msg);
        this.logger.messageSent(this.iframeOrigin, msg.type as string);
        try {
            this.iframeWindow.postMessage(msg, '*');
        } catch (error) {
            console.error('[ParentBridge] Failed to send message', error);
        }
    }

    public ingestSessionFromIframe(data: any): boolean {
        if (!data || typeof data !== 'object') return false;

        const payload = data.payload || data;
        const incomingToken =
            payload.token1 ||
            payload.token ||
            payload.access_token ||
            payload.authToken ||
            payload.auth?.access_token ||
            data.token1 ||
            data.token ||
            data.access_token;

        const incomingLoginId =
            payload.acct1 ||
            payload.loginid ||
            payload.loginId ||
            payload.account_id ||
            payload.account ||
            payload.activeAccountId ||
            data.acct1 ||
            data.loginid ||
            data.loginId ||
            data.account_id;

        if (
            incomingToken &&
            !isInvalidBearerToken(incomingToken) &&
            incomingLoginId &&
            typeof incomingLoginId === 'string' &&
            !incomingLoginId.includes('100000')
        ) {
            console.log('[ParentBridge] Ingested authenticated session from DTrader:', incomingLoginId);

            localStorage.setItem('active_loginid', incomingLoginId);
            localStorage.setItem('client.loginid', incomingLoginId);
            localStorage.setItem('token1', incomingToken);
            localStorage.setItem('acct1', incomingLoginId);
            localStorage.setItem('token', incomingToken);
            localStorage.setItem('authToken', incomingToken);
            localStorage.setItem('active_token', incomingToken);
            localStorage.setItem('legacy_dtrader_token', incomingToken);

            const accounts = payload.accounts || payload.accountsList || payload['client.accounts'] || data.accounts;
            if (accounts && typeof accounts === 'object') {
                if (typeof accounts === 'string') {
                    localStorage.setItem('client.accounts', accounts);
                } else if (Array.isArray(accounts)) {
                    const accMap: Record<string, string> = {};
                    accounts.forEach((acc: any) => {
                        if (acc.account_id && acc.token) accMap[acc.account_id] = acc.token;
                    });
                    if (Object.keys(accMap).length > 0) {
                        localStorage.setItem('accountsList', JSON.stringify(accMap));
                    }
                } else {
                    localStorage.setItem('accountsList', JSON.stringify(accounts));
                }
            } else {
                const currentList = getAccountsList();
                currentList[incomingLoginId] = incomingToken;
                localStorage.setItem('accountsList', JSON.stringify(currentList));
            }

            const currency = payload.currency || payload.cur1 || 'USD';
            localStorage.setItem('client.currency', currency);
            const isDemo = incomingLoginId.startsWith('VR') || incomingLoginId.startsWith('VRT');
            localStorage.setItem('account_type', isDemo ? 'demo' : 'real');

            sessionManager.setSession({
                loginid: incomingLoginId,
                token: incomingToken,
                currency,
                appId: getAppId() || '121856',
            });

            window.dispatchEvent(
                new CustomEvent('account_switched', {
                    detail: { loginid: incomingLoginId, token: incomingToken },
                })
            );
            window.dispatchEvent(new Event('storage'));

            import('@/external/bot-skeleton')
                .then(({ api_base }) => {
                    api_base.init(true);
                })
                .catch(err => {
                    console.error('[ParentBridge] Failed to initialize api_base:', err);
                });

            return true;
        }
        return false;
    }

    private handleMessage = (event: MessageEvent) => {
        // Prevent postMessage feedback loops from window itself
        if (!event.source || event.source === window) {
            return;
        }

        // Accept messages from the configured iframe origin or known Deriv iframe origins
        const validOrigins = new Set([
            this.iframeOrigin,
            'https://profhubdtrader.vercel.app',
            'https://deriv-dtrader.vercel.app',
        ]);
        if (!validOrigins.has(event.origin)) {
            return;
        }

        const data = event.data;
        if (!data || (typeof data !== 'object' && typeof data !== 'string')) {
            return;
        }

        let parsedData: any = data;
        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
            } catch {
                return;
            }
        }

        // 1. Ingest session from DTrader if it sent auth credentials
        this.ingestSessionFromIframe(parsedData);

        // On message from the iframe, only reply with auth if we have a real session
        if (event.source && typeof (event.source as Window).postMessage === 'function') {
            const msgType = parsedData?.type || parsedData?.action || '';
            const session = sessionManager.getSession();
            const loginid =
                session?.loginid ||
                localStorage.getItem('active_loginid') ||
                localStorage.getItem('client.loginid') ||
                '';
            const syncToken = getActiveToken(loginid) || getActiveToken() || '';
            const currency = session?.currency || localStorage.getItem('client.currency') || 'USD';
            const appIdStr = String(session?.appId || getAppId() || '121856');

            if (syncToken && loginid && !loginid.includes('100000')) {
                this.sendAuthPayloadToWindow(event.source as Window, syncToken, loginid, currency, appIdStr);
            }

            if (msgType === 'REQUEST_TOKEN') {
                // Iframe is explicitly asking for an OTT — fetch and relay it
                this.sendOTT(event.source as Window, event.origin);
            } else if (msgType === 'NEWDTRADER_BRIDGE_AUTH_SUCCESS') {
                console.log('[ParentBridge] DTrader Bridge authenticated successfully.');
                if (this.retryIntervalId) {
                    clearInterval(this.retryIntervalId);
                    this.retryIntervalId = null;
                }
                this.stateMachine.transitionTo(BridgeState.AUTHENTICATED);
                this.safeTimeout(() => this.stateMachine.transitionTo(BridgeState.CONNECTED), 100);
                return;
            } else if (msgType === 'NEWDTRADER_BRIDGE_AUTH_FAILED') {
                console.error('[ParentBridge] Bridge rejected credentials:', parsedData?.error);
                if (this.retryIntervalId) {
                    clearInterval(this.retryIntervalId);
                    this.retryIntervalId = null;
                }
                this.diagnostics.lastError = parsedData?.error?.message || 'Bridge Auth Failed';
                this.stateMachine.transitionTo(BridgeState.FAILED);
                return;
            } else if (syncToken && loginid && !loginid.includes('100000')) {
                this.sendAuthInit();
            }
        }

        if (!isValidBridgeMessage(parsedData)) {
            return;
        }

        if (parsedData.source !== 'iframe') {
            return;
        }

        this.logMessage('in', parsedData);

        switch (parsedData.type as BridgeEvent) {
            case BridgeEvent.BRIDGE_READY:
                this.handleBridgeReady();
                break;
            case BridgeEvent.REQUEST_SESSION:
                this.handleSessionRequest();
                break;
            case BridgeEvent.AUTH_SUCCESS:
                this.stateMachine.transitionTo(BridgeState.AUTHENTICATED);
                this.safeTimeout(() => this.stateMachine.transitionTo(BridgeState.CONNECTED), 100);
                this.reconnectAttempts = 0;
                break;
            case BridgeEvent.AUTH_FAILED:
                this.diagnostics.lastError = parsedData.payload?.message || 'Authentication Failed';
                this.stateMachine.transitionTo(BridgeState.FAILED);
                this.attemptRecovery();
                break;
            case BridgeEvent.LOGOUT:
                this.stateMachine.transitionTo(BridgeState.LOGGED_OUT);
                break;
            case BridgeEvent.ERROR:
                this.diagnostics.lastError = parsedData.payload?.message || 'Unknown Error';
                break;
        }
    };

    private handleBridgeReady() {
        if (this.stateMachine.transitionTo(BridgeState.READY)) {
            this.handleSessionRequest();
        }
    }

    private handleSessionRequest = () => {
        const session = sessionManager.getSession();
        const loginid =
            session?.loginid || localStorage.getItem('active_loginid') || localStorage.getItem('client.loginid') || '';
        const token = session?.token || getActiveToken(loginid) || getActiveToken() || localStorage.getItem('token') || '';
        const currency = session?.currency || localStorage.getItem('client.currency') || 'USD';
        const appIdStr = String(session?.appId || getAppId() || '121856');

        if (this.iframeWindow && token && loginid && !loginid.includes('100000')) {
            this.sendAuthPayloadToWindow(this.iframeWindow, token, loginid, currency, appIdStr);
            this.sendAuthInit();
            this.stateMachine.transitionTo(BridgeState.AUTHENTICATING);
            this.sendMessage(BridgeEvent.AUTH_START, { timestamp: Date.now() });

            this.safeTimeout(() => {
                this.stateMachine.transitionTo(BridgeState.AUTHENTICATED);
                this.safeTimeout(() => {
                    this.stateMachine.transitionTo(BridgeState.CONNECTED);
                }, 100);
            }, 300);
        }
    };

    private handleSessionChange = (session: any) => {
        if (!session) {
            this.diagnostics.sessionStatus = 'none';
            return;
        }
        this.diagnostics.sessionStatus = 'valid';
        // Re-send AUTH_INIT when session changes (e.g. account switch)
        this.sendAuthInit();
    };

    private attemptRecovery() {
        if (this.reconnectAttempts < this.maxReconnects) {
            this.reconnectAttempts++;
            this.stateMachine.transitionTo(BridgeState.RECOVERING);

            const backoff = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            setTimeout(() => {
                this.stateMachine.transitionTo(BridgeState.WAITING_READY);
                this.sendMessage(BridgeEvent.PING, { timestamp: Date.now() });
                setTimeout(() => this.handleSessionRequest(), 500);
            }, backoff);
        }
    }
}
