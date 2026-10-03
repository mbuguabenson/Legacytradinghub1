import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import GoogleDrive from '@/components/load-modal/google-drive';
import Dialog from '@/components/shared_ui/dialog';
import MobileFullPageModal from '@/components/shared_ui/mobile-full-page-modal';
import { DBOT_TABS } from '@/constants/bot-contents';
import { useApiBase } from '@/hooks/useApiBase';
import { useStore } from '@/hooks/useStore';
import { localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';
import DashboardBotList from './bot-list/dashboard-bot-list';
import {
    Bot,
    Cpu,
    Zap,
    ArrowUpRight,
    FolderPlus,
    FolderUp,
    Radio,
    Sparkles,
    MessageCircle,
    Compass,
    ShieldCheck,
} from 'lucide-react';

type TCardProps = {
    has_dashboard_strategies: boolean;
    is_mobile: boolean;
};

const DERIV_SIGNUP_URL = 'https://track.deriv.com/_b_FkYd-u53x-m-sZlUf1gWNd7ZgqdRLk/1/';
const WHATSAPP_COMMUNITY_URL = 'https://chat.whatsapp.com/L1n7hNl9ZJ8ErYVvXk1z6D';

const Cards = observer(({ is_mobile, has_dashboard_strategies }: TCardProps) => {
    const { dashboard, load_modal, client } = useStore();
    const { toggleLoadModal, setActiveTabIndex } = load_modal;
    const { isDesktop } = useDevice();
    const { onCloseDialog, dialog_options, is_dialog_open, setActiveTab, setPreviewOnPopup } = dashboard;
    const { accountList, activeLoginid } = useApiBase();

    // Resolve active account details
    const activeAccount =
        accountList?.find(acc => acc.loginid === activeLoginid) ||
        client?.account_list?.find(acc => acc.loginid === (client?.loginid || activeLoginid));

    const accountName =
        activeAccount?.loginid ||
        client?.loginid ||
        activeLoginid ||
        localStorage.getItem('active_loginid') ||
        '';

    const isVirtual = Boolean(activeAccount?.is_virtual || client?.is_virtual || accountName.startsWith('VR'));

    const openFileLoader = () => {
        toggleLoadModal();
        setActiveTabIndex(is_mobile ? 0 : 1);
        setActiveTab(DBOT_TABS.BOT_BUILDER);
    };

    // ─── 5 Small Cards (Upload, Smart Trading, AI Trading, Free Bots, Signal Tools) ─
    // Reduced up to 4x in size: compact, sleek micro-cards
    const smallCards = [
        {
            id: 'upload-bot',
            title: 'Upload Bot',
            subtitle: 'XML & Drive bots',
            icon: <FolderUp size={18} className='micro-icon-svg text-blue' />,
            theme: 'micro--blue',
            callback: () => openFileLoader(),
        },
        {
            id: 'smart-trading',
            title: 'Smart Trading',
            subtitle: 'Intelligent trade tools',
            icon: <Cpu size={18} className='micro-icon-svg text-cyan' />,
            theme: 'micro--cyan',
            callback: () => setActiveTab(DBOT_TABS.DTRADER),
        },
        {
            id: 'ai-trading',
            title: 'AI Trading',
            subtitle: 'Neural pattern engine',
            icon: <Sparkles size={18} className='micro-icon-svg text-purple' />,
            theme: 'micro--purple',
            callback: () => setActiveTab(DBOT_TABS.AI_TRADING_ENGINE),
        },
        {
            id: 'free-bots',
            title: 'Free Bots',
            subtitle: '24+ verified bots',
            icon: <Zap size={18} className='micro-icon-svg text-amber' />,
            theme: 'micro--amber',
            callback: () => setActiveTab(DBOT_TABS.TRADING_BOTS),
        },
        {
            id: 'signal-tools',
            title: 'Signal Tools',
            subtitle: 'Live market radar',
            icon: <Radio size={18} className='micro-icon-svg text-rose' />,
            theme: 'micro--rose',
            callback: () => setActiveTab(DBOT_TABS.SIGNALS),
        },
    ];

    // ─── Platform Pillars / Technical Telemetry ──────────────────────────────
    const telemetryItems = [
        {
            value: '< 20ms',
            label: 'WebSocket Latency',
            color: 'text-cyan',
        },
        {
            value: '24+ Bots',
            label: 'Verified Algorithms',
            color: 'text-emerald',
        },
        {
            value: '100% Private',
            label: 'Browser Sandbox',
            color: 'text-purple',
        },
        {
            value: '5,000+',
            label: 'Active Traders',
            color: 'text-amber',
        },
    ];

    return React.useMemo(
        () => (
            <div
                className={classNames('dash-cockpit', {
                    'dash-cockpit--minimized': has_dashboard_strategies && is_mobile,
                })}
            >
                {/* ═══════════════════════════════════════════════════════════════
                    1. BRAND HEADER (Typographic wordmark without logo tile)
                ═══════════════════════════════════════════════════════════════ */}
                <div className='dash-brand-header'>
                    <div className='dash-brand-header__halo-1' />
                    <div className='dash-brand-header__halo-2' />

                    <div className='dash-brand-header__top-row'>
                        <div className='dash-brand-wordmark'>
                            <span className='dash-brand-legacy'>LEGACY</span>
                            <span className='dash-brand-hub'>TRADING HUB</span>
                        </div>

                        {accountName ? (
                            <div className='dash-brand-header__badge-wrap'>
                                <span className={classNames('dash-pill-acc', isVirtual ? 'dash-pill-acc--demo' : 'dash-pill-acc--real')}>
                                    <span className='dash-pill-acc__indicator' />
                                    {isVirtual ? 'DEMO ACCOUNT' : 'LIVE ACCOUNT'} • {accountName}
                                </span>
                            </div>
                        ) : (
                            <div className='dash-brand-header__badge-wrap'>
                                <span className='dash-pill-acc dash-pill-acc--institutional'>
                                    <span className='dash-pill-acc__indicator' />
                                    INSTITUTIONAL TRADING SUITE
                                </span>
                            </div>
                        )}
                    </div>

                    <div className='dash-brand-header__divider' />

                    <div className='dash-brand-header__message'>
                        <h1 className='dash-brand-welcome-title'>Welcome to Legacy Trading Hub</h1>
                        <p className='dash-brand-welcome-sub'>
                            Advanced tools, smart trading and powerful bots — all in one place.
                        </p>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    2. MAIN DECK: CREATE ACCOUNT ON FAR LEFT + 5 SMALL CARDS
                ═══════════════════════════════════════════════════════════════ */}
                <div className='dash-main-deck'>
                    {/* Far Left Card: Create Account */}
                    <div className='dash-account-left-card'>
                        <div className='dash-account-left-card__halo' />

                        <div className='dash-account-left-card__top'>
                            <div className='dash-account-left-card__icon-wrap'>
                                <ShieldCheck size={20} className='text-amber' />
                            </div>
                            <span className='dash-account-left-card__badge'>OFFICIAL DERIV</span>
                        </div>

                        <div className='dash-account-left-card__body'>
                            <h3 className='dash-account-left-card__title'>Don't have an account?</h3>
                            <p className='dash-account-left-card__desc'>
                                Use this link to create your account with Deriv.
                            </p>
                        </div>

                        <div className='dash-account-left-card__action'>
                            <a
                                href={DERIV_SIGNUP_URL}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='dash-btn-puffy dash-btn-puffy--cyan'
                                aria-label='Open Account with Deriv'
                            >
                                <span>OPEN ACCOUNT</span>
                                <ArrowUpRight size={15} />
                            </a>
                        </div>
                    </div>

                    {/* Right: 5 Small Cards (Upload, Smart Trading, AI Trading, Free Bots, Signal Tools) */}
                    <div className='dash-small-cards-deck'>
                        <div className='dash-small-cards-grid'>
                            {smallCards.map(card => (
                                <div
                                    key={card.id}
                                    className={classNames('dash-micro-card', card.theme)}
                                    onClick={card.callback}
                                    role='button'
                                    tabIndex={0}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            card.callback();
                                        }
                                    }}
                                >
                                    <div className='dash-card-halo' />

                                    <div className='dash-micro-card__left'>
                                        <div className='dash-micro-squircle'>
                                            {card.icon}
                                        </div>
                                        <div className='dash-micro-card__info'>
                                            <h4 className='dash-micro-card__title'>{card.title}</h4>
                                            <span className='dash-micro-card__sub'>{card.subtitle}</span>
                                        </div>
                                    </div>

                                    <div className='dash-micro-card__arrow'>
                                        <ArrowUpRight size={13} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    3. COMMUNITY CARD (Join the Legacy Trading Hub Community)
                ═══════════════════════════════════════════════════════════════ */}
                <div className='dash-community-section'>
                    <div className='dash-community-card'>
                        <div className='dash-community-card__halo' />

                        <div className='dash-community-card__left'>
                            <div className='dash-community-icon-squircle'>
                                <MessageCircle size={18} className='whatsapp-icon-svg text-emerald' />
                            </div>
                            <div className='dash-community-card__text-block'>
                                <h3 className='dash-community-title'>
                                    Join the Legacy Trading Hub Community
                                </h3>
                                <p className='dash-community-quote'>
                                    “Get daily insights, trading tools and connect with our trading community.”
                                </p>
                            </div>
                        </div>

                        <div className='dash-community-card__right'>
                            <a
                                href={WHATSAPP_COMMUNITY_URL}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='dash-btn-puffy dash-btn-puffy--whatsapp'
                                aria-label='Join WhatsApp Group'
                            >
                                <MessageCircle size={14} />
                                <span>JOIN WHATSAPP GROUP</span>
                                <ArrowUpRight size={13} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    4. TELEMETRY PERFORMANCE TICKER
                ═══════════════════════════════════════════════════════════════ */}
                <div className='dash-telemetry-row'>
                    {telemetryItems.map((item, idx) => (
                        <div key={idx} className='telemetry-pill'>
                            <span className={classNames('telemetry-value', item.color)}>{item.value}</span>
                            <span className='telemetry-label'>{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    5. STRATEGY WORKSPACE & LOCAL SAVED BOTS (FUNCTIONALITY PRESERVED)
                ═══════════════════════════════════════════════════════════════ */}
                <div className='dash-workspace-card'>
                    <div className='dash-card-halo' />
                    <div className='dash-workspace-card__header'>
                        <div className='dash-workspace-card__title-wrap'>
                            <div className='dash-workspace-icon-wrap'>
                                <Compass size={17} className='text-emerald' />
                            </div>
                            <div>
                                <h4 className='dash-workspace-card__title'>Strategy Workspace & Local Bots</h4>
                                <span className='dash-workspace-card__sub'>
                                    Saved strategies stored locally in your browser cache
                                </span>
                            </div>
                        </div>
                        <div className='dash-workspace-card__btns'>
                            <button
                                type='button'
                                className='dash-btn-tactile'
                                onClick={() => openFileLoader()}
                            >
                                <FolderPlus size={13} />
                                <span>Import XML</span>
                            </button>
                            <button
                                type='button'
                                className='dash-btn-tactile dash-btn-tactile--highlight'
                                onClick={() => setActiveTab(DBOT_TABS.TRADING_BOTS)}
                            >
                                <Sparkles size={13} />
                                <span>24+ Free Bots</span>
                            </button>
                        </div>
                    </div>

                    {has_dashboard_strategies ? (
                        <div className='dash-bot-list-area'>
                            <DashboardBotList />
                        </div>
                    ) : (
                        <div className='dash-workspace-empty'>
                            <div className='dash-empty-icon'>
                                <Bot size={24} />
                            </div>
                            <p className='empty-title'>No Custom Strategies Saved Yet</p>
                            <p className='empty-text'>
                                Create custom logic in the Blockly Bot Builder, or choose from our 24+ free institutional strategies to get started.
                            </p>
                        </div>
                    )}
                </div>

                {/* ═══════════════════════════════════════════════════════════════
                    6. GOOGLE DRIVE MODAL DIALOG
                ═══════════════════════════════════════════════════════════════ */}
                {!isDesktop ? (
                    <Dialog
                        title={dialog_options.title}
                        is_visible={is_dialog_open}
                        onCancel={onCloseDialog}
                        onConfirm={() => {}}
                        is_mobile_full_width
                        className='dc-dialog__wrapper--google-drive'
                        has_close_icon
                    >
                        <GoogleDrive />
                    </Dialog>
                ) : (
                    <MobileFullPageModal
                        is_modal_open={is_dialog_open}
                        className='load-strategy__wrapper'
                        header={localize('Load strategy')}
                        onClickClose={() => {
                            setPreviewOnPopup(false);
                            onCloseDialog();
                        }}
                        height_offset='80px'
                    >
                        <div label='Google Drive' className='google-drive-label'>
                            <GoogleDrive />
                        </div>
                    </MobileFullPageModal>
                )}
            </div>
        ),
        [
            is_dialog_open,
            has_dashboard_strategies,
            is_mobile,
            isDesktop,
            accountName,
            isVirtual,
            dialog_options.title,
            onCloseDialog,
            openFileLoader,
            setActiveTab,
            setPreviewOnPopup
        ]
    );
});

export default Cards;
