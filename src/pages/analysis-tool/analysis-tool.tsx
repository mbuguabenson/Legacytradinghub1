import React from 'react';
import { observer } from 'mobx-react-lite';
import { MegastreakHub } from './megastreak-hub/megastreak-hub';
import './analysis-tool.scss';

const AnalysisTool: React.FC = observer(() => {
    return (
        <div className='analysis-tools-wrapper' style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <MegastreakHub />
        </div>
    );
});

export default AnalysisTool;
