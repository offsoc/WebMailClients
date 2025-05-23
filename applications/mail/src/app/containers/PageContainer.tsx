import type { Ref } from 'react';
import { forwardRef, memo } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { MailShortcutsModal, useModalState } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import { HUMAN_TO_LABEL_IDS } from '@proton/shared/lib/mail/constants';

import AssistantIframe from 'proton-mail/components/assistant/AssistantIframe';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { useAppShellSideEffects } from 'proton-mail/router/sideEffects/useAppShellSideEffects';

import PrivateLayout from '../components/layout/PrivateLayout';
import { LabelActionsContextProvider } from '../components/sidebar/EditLabelContext';
import type { MailUrlParams } from '../helpers/mailboxUrl';
import { useDeepMemo } from '../hooks/useDeepMemo';
import MailStartupModals from './MailStartupModals';
import MailboxContainer from './mailbox/MailboxContainer';

interface Props {
    params: MailUrlParams;
}

const PageContainer = ({ params: { elementID, labelID, messageID } }: Props, ref: Ref<HTMLDivElement>) => {
    const [userSettings] = useUserSettings();
    const mailSettings = useMailModel('MailSettings');
    const [mailShortcutsProps, setMailShortcutsModalOpen, renderMailShortcutsModal] = useModalState();

    /**
     * Temporary: Page container side effects
     */
    useAppShellSideEffects({ openShortcutsModal: (value: boolean) => setMailShortcutsModalOpen(value) });

    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    return (
        <PrivateLayout ref={ref} labelID={labelID}>
            <MailStartupModals />
            <LabelActionsContextProvider>
                <MailboxContainer
                    labelID={labelID}
                    mailSettings={mailSettings}
                    userSettings={userSettings as UserSettings}
                    elementID={elementID}
                    messageID={messageID}
                />
            </LabelActionsContextProvider>
            {renderMailShortcutsModal && <MailShortcutsModal {...mailShortcutsProps} />}
            <AssistantIframe />
        </PrivateLayout>
    );
};

const MemoPageContainer = memo(forwardRef(PageContainer));

const PageParamsParser = (_p: any, ref: Ref<HTMLDivElement>) => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const match = useRouteMatch<MailUrlParams>();

    const params = useDeepMemo(() => {
        const labelIDs = [...labels, ...folders].map(({ ID }: Label) => ID);
        const { elementID, labelID: currentLabelID = '', messageID } = (match || {}).params || {};
        const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || (labelIDs.includes(currentLabelID) && currentLabelID);
        return { elementID, labelID, messageID };
    }, [match]);

    return <MemoPageContainer ref={ref} params={params} />;
};
export default forwardRef(PageParamsParser);
