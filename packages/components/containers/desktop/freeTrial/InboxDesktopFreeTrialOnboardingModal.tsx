import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import { APP_UPSELL_REF_PATH, MAIL_APP_NAME, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import protonDesktop from '@proton/styles/assets/img/illustrations/proton-desktop.svg';

import { freeTrialUpgradeClick } from '../openExternalLink';
import useInboxFreeTrial from './useInboxFreeTrial';

export const InboxDesktopFreeTrialOnboardingModal = ({ ...modalState }: ModalProps) => {
    const { onClose } = modalState;
    const { startFreeTrial } = useInboxFreeTrial();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.INBOX_DESKTOP_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.TRIAL_WELCOME,
    });

    const handleClose = () => {
        onClose?.();
        startFreeTrial();
    };

    return (
        <ModalTwo size="small" {...modalState} onClose={startFreeTrial}>
            <ModalTwoContent className="text-center mt-8 mb-4 flex gap-6 flex-column">
                <img src={protonDesktop} alt={c('Free trial desktop').t`${MAIL_APP_NAME} desktop app`} />
                <div>
                    <h1 className="text-bold mb-2 text-2xl">{c('Free trial desktop').t`Try the new desktop app`}</h1>
                    <p className="my-0">{c('Free trial desktop')
                        .t`Enjoy fast, secure, and distraction-free access to your inbox and calendar.`}</p>
                </div>
                <div>
                    <Button color="norm" size="large" onClick={handleClose} fullWidth>{c('Free trial desktop')
                        .t`Start free trial`}</Button>
                    <div className="text-center flex flex-column color-weak text-sm gap-0.5 mt-4">
                        <p className="m-0">{c('Free trial desktop').t`14-day desktop app trial.`}</p>
                        <p className="m-0">{c('Free trial desktop').t`No credit card required.`}</p>
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="flex text-sm text-center mb-8 flex-column mt-0">
                <hr className="mb-4" />
                <p className="m-0 color-weak">{c('Free trial desktop')
                    .t`Get unlimited access with any ${MAIL_APP_NAME} plan.`}</p>
                <Button
                    color="norm"
                    shape="underline"
                    className="m-0 p-0 text-semibold"
                    onClick={() => freeTrialUpgradeClick(upsellRef)}
                >{c('Free trial desktop').t`Upgrade now`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
