import { api_base } from '@/external/bot-skeleton';

export const MARKET_PIP_SIZE: Record<string, number> = {
    // 1-Second Volatilities
    '1HZ10V': 2,
    '1HZ15V': 3,
    '1HZ20V': 2,
    '1HZ25V': 2,
    '1HZ30V': 3,
    '1HZ50V': 2,
    '1HZ75V': 2,
    '1HZ90V': 3,
    '1HZ100V': 2,
    '1HZ150V': 2,
    '1HZ200V': 2,
    '1HZ250V': 2,
    '1HZ300V': 2,
    // Continuous Volatilities
    R_10: 3,
    R_25: 3,
    R_50: 4,
    R_75: 4,
    R_100: 2,
    R_150: 2,
    R_200: 2,
    R_250: 2,
    R_300: 2,
    // Jump Indices
    JD10: 2,
    JD25: 2,
    JD50: 2,
    JD75: 2,
    JD100: 2,
    JD150: 2,
    JD200: 2,
    // Step & Range
    stpRNG: 5,
};

export const getMarketPipSize = (symbol: string, fallback = 2): number => {
    if (!symbol) return fallback;

    // 1. Check api_base.pip_sizes (populated by active_symbols from WebSocket)
    const api_pip_size = Number((api_base.pip_sizes as Record<string, number | undefined>)?.[symbol]);
    if (Number.isFinite(api_pip_size) && api_pip_size >= 0) return api_pip_size;

    // 2. Check cached active_symbols in api_base
    if (api_base.active_symbols && Array.isArray(api_base.active_symbols)) {
        const found = api_base.active_symbols.find((s: any) => s.symbol === symbol);
        if (found) {
            const raw = found.pip_size ?? found.pip;
            if (raw !== undefined && raw !== null) {
                const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
                if (Number.isFinite(num) && num >= 0) {
                    if (num >= 1 && Number.isInteger(num)) return Math.min(num, 20);
                    if (num < 1 && num > 0) {
                        const str = num.toString();
                        const dec = str.split('.')[1];
                        return dec ? dec.length : fallback;
                    }
                }
            }
        }
    }

    // 3. Static authoritative lookup
    if (MARKET_PIP_SIZE[symbol] !== undefined) {
        return MARKET_PIP_SIZE[symbol];
    }

    return fallback;
};

export const getLastDigitFromQuote = (quote: number | string, symbol: string, fallback_pip_size = 2): number => {
    const pip_size = Math.max(0, Math.min(getMarketPipSize(symbol, fallback_pip_size), 20));
    const normalized_quote = Number(quote).toFixed(pip_size);
    const digit = normalized_quote.replace(/\D/g, '').slice(-1);

    return Number(digit || 0);
};

export const isExpectedStreamInterruption = (error: unknown) => {
    const api_error = (error as any)?.error ?? error;
    const message = String(
        (api_error as any)?.message ?? (api_error as Error)?.message ?? api_error ?? ''
    ).toLowerCase();
    const code = String((api_error as any)?.code ?? '').toLowerCase();

    return (
        code.includes('interrupted') ||
        code.includes('disconnect') ||
        code.includes('closed') ||
        message.includes('interrupted') ||
        message.includes('disconnect') ||
        message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('network') ||
        message.includes('aborted') ||
        message.includes('connection closed') ||
        message.includes('socket closed') ||
        message.includes('subscription not found')
    );
};
