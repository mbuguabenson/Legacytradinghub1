// Updated to include WhatsApp contact link and ensure theme toggle is always present
// Controls language settings and theme toggle via brand.config.json
import brandConfig from '@/../brand.config.json';
import { useApiBase } from '@/hooks/useApiBase';
import useModalManager from '@/hooks/useModalManager';
import { getActiveTabUrl } from '@/utils/getActiveTabUrl';
import { FILTERED_LANGUAGES } from '@/utils/languages';
import { isLoggedIn } from '@/utils/token-bridge';
import { useTranslations } from '@deriv-com/translations';
import { DesktopLanguagesModal, Tooltip } from '@deriv-com/ui';
import ChangeTheme from './ChangeTheme';
import FullScreen from './FullScreen';
import LanguageSettings from './LanguageSettings';
import LogoutFooter from './LogoutFooter';
import NetworkStatus from './NetworkStatus';
import ServerTime from './ServerTime';
import { FooterContactPopover } from './footer-contact-popover';
import './footer.scss';


// ─────────────────────────────────────────────────────────────────────────────
// Account icon button
// ─────────────────────────────────────────────────────────────────────────────
const AccountFooterButton = () => (
    <button
        type='button'
        className='app-footer__account'
        onClick={() => window.dispatchEvent(new Event('open_account_info'))}
        title='Account Details & Settings'
        aria-label='Account Details'
    >
        <svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
            <circle cx='12' cy='7' r='4' />
        </svg>
    </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Risk Disclaimer button (Desktop)
// ─────────────────────────────────────────────────────────────────────────────
const RiskDisclaimerFooterButton = () => (
    <button
        type='button'
        className='app-footer__risk-btn'
        onClick={() => window.dispatchEvent(new Event('open_risk_disclaimer'))}
        title='Risk Disclaimer & Regulatory Warning'
        aria-label='Risk Disclaimer'
    >
        <svg viewBox='0 0 24 24' width='13' height='13' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
            <line x1='12' y1='8' x2='12' y2='12' />
            <line x1='12' y1='16' x2='12.01' y2='16' />
        </svg>
        <span>Risk Disclaimer</span>
    </button>
);

// ─────────────────────────────────────────────────────────────────────────────
// Statement & Historical Transactions button
// ─────────────────────────────────────────────────────────────────────────────
const StatementFooterButton = () => (
    <button
        type='button'
        id='footer-statement-btn'
        className='app-footer__statement-btn'
        onClick={() => window.dispatchEvent(new Event('open_statement_report'))}
        title='View Account Statement & Transactions (Deriv Live & Options Legacy)'
        aria-label='Account Statement'
    >
        <svg viewBox='0 0 24 24' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
            <polyline points='14 2 14 8 20 8' />
            <line x1='16' y1='13' x2='8' y2='13' />
            <line x1='16' y1='17' x2='8' y2='17' />
            <polyline points='10 9 9 9 8 9' />
        </svg>
        <span>Statement</span>
    </button>
);

const Footer = () => {
    const { currentLang = 'EN', localize, switchLanguage } = useTranslations();
    const { hideModal, isModalOpenFor, showModal } = useModalManager();
    const { isAuthorized } = useApiBase();

    // Get footer configuration from brand.config.json
    const enableLanguageSettings = brandConfig.platform.footer?.enable_language_settings ?? true;
    const enableThemeToggle = brandConfig.platform.footer?.enable_theme_toggle ?? true;

    const openLanguageSettingModal = () => showModal('DesktopLanguagesModal');

    return (
        <footer className='app-footer'>
            <FullScreen />
            <div className='app-footer__vertical-line' />
            <StatementFooterButton />
            <div className='app-footer__vertical-line' />
            <FooterContactPopover />
            <div className='app-footer__vertical-line' />
            <RiskDisclaimerFooterButton />
            {(isAuthorized || isLoggedIn()) && (
                <>
                    <div className='app-footer__vertical-line' />
                    <LogoutFooter />
                    <div className='app-footer__vertical-line' />
                    <AccountFooterButton />
                </>
            )}
            <div className='app-footer__vertical-line' />

            {/* Language settings */}
            {enableLanguageSettings && (
                <>
                    <LanguageSettings openLanguageSettingModal={openLanguageSettingModal} />
                    <div className='app-footer__vertical-line' />
                </>
            )}

            {/* Theme toggle */}
            {enableThemeToggle && (
                <>
                    <ChangeTheme />
                    <div className='app-footer__vertical-line' />
                </>
            )}

            <ServerTime />
            <div className='app-footer__vertical-line' />
            <NetworkStatus />

            {/* Language modal */}
            {enableLanguageSettings && isModalOpenFor('DesktopLanguagesModal') && (
                <DesktopLanguagesModal
                    headerTitle={localize('Select Language')}
                    isModalOpen
                    languages={FILTERED_LANGUAGES as any}
                    onClose={hideModal}
                    onLanguageSwitch={code => {
                        try {
                            switchLanguage(code);
                            hideModal();
                            window.location.replace(getActiveTabUrl());
                        } catch (error) {
                            console.error('Failed to switch language:', error);
                            hideModal();
                        }
                    }}
                    selectedLanguage={currentLang}
                />
            )}
        </footer>
    );
};

export default Footer;
