import React from 'react';
import { observer } from 'mobx-react-lite';
import { DTraderIframeContainer } from '@/components/dtrader-iframe';
import { useStore } from '@/hooks/useStore';
import {
    getAccountsList,
    getActiveLoginId,
    getActiveToken,
    getLegacyDTraderToken,
} from '@/utils/token-bridge';
import { OAuthTokenExchangeService } from '@/services/oauth-token-exchange.service';
import './dtrader.scss';

const DTraderPage: React.FC = observer(() => {
    const { client, ui } = useStore() ?? {};

    const activeLoginId =
        client?.loginid ||
        localStorage.getItem('active_loginid') ||
        localStorage.getItem('client.loginid') ||
        getActiveLoginId();

    const token =
        getActiveToken(activeLoginId) ||
        OAuthTokenExchangeService.getAccessToken() ||
        getLegacyDTraderToken(activeLoginId) ||
        getAccountsList()[activeLoginId] ||
        localStorage.getItem('bot_new_api_token') ||
        localStorage.getItem('token1') ||
        localStorage.getItem('active_token') ||
        localStorage.getItem('authToken') ||
        '';
    const theme = ui?.is_dark_mode_on ? 'dark' : 'light';

    return (
        <div className='dtrader-page-wrapper'>
            <DTraderIframeContainer
                baseUrl='https://profhubdtrader.vercel.app'
                token={token || undefined}
                loginId={activeLoginId || undefined}
                theme={theme}
                height='100%'
                showToolbar={false}
            />
        </div>
    );
});

export default DTraderPage;
