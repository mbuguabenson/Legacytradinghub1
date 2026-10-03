type TTabsTitle = {
    [key: string]: string | number;
};

type TDashboardTabIndex = {
    [key: string]: number;
};

export const tabs_title: TTabsTitle = Object.freeze({
    WORKSPACE: 'Workspace',
    CHART: 'Chart',
});

export const DBOT_TABS: TDashboardTabIndex = Object.freeze({
    DASHBOARD: 0,
    BOT_BUILDER: 1,
    CHART: 2,
    TRADING_BOTS: 3,
    ANALYSIS_TOOL: 4,
    TRADINGVIEW: 5,
    SIGNALS: 6,
    SCANNER: 7,
    EASY_TOOL: 8,
    MARKETKILLER: 9,
    MARKET_HUNTER_PRO: 10,
    AI_TRADING_ENGINE: 11,
    DIGITFLOW: 12,
    ELITE_PRO: 13,
    POVERTY_HUNTER: 14,
    AUTO_X_EO: 15,
    OVERLORD_AI: 16,
    B254: 17,
    COPY_TRADING: 18,
    DTRADER: 19,
    AUTOFLIPPER: 20,
    RISE_FALL: 21,
    MANUAL_TRADING: 22,
    AUTOTRADES: 23,
});

export const MAX_STRATEGIES = 10;

export const TAB_IDS = [
    'id-dbot-dashboard',
    'id-bot-builder',
    'id-charts',
    'id-trading-bots',
    'id-analysis-tool',
    'id-tradingview',
    'id-signals',
    'id-scanner',
    'id-easy-tool',
    'id-marketkiller',
    'id-market-hunter-pro',
    'id-ai-trading-engine',
    'id-digitflow',
    'id-elite-pro',
    'id-poverty-hunter',
    'id-auto-x-eo',
    'id-overlord-ai',
    'id-b254',
    'id-copy-trading',
    'id-dtrader',
    'id-autoflipper',
    'id-rise-fall',
    'id-autotrades',
];
