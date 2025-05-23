import { c } from 'ttag';

import { useCustomDomains } from '@proton/account/domains/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { InlineLinkButton } from '@proton/atoms';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { getSsoAppInfo } from '@proton/components/containers/organization/sso/ssoAppInfo';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { DOMAIN_STATE } from '@proton/shared/lib/interfaces';

import TXTRecordModal from '../../organization/sso/TXTRecordModal';
import TopBanner from '../../topBanners/TopBanner';

const SSODomainUnverifiedBanner = ({ app }: { app: APP_NAMES }) => {
    const [customDomains] = useCustomDomains();
    const [organization] = useOrganization();
    const [modalProps, setModal, renderModal] = useModalState();

    if (!customDomains?.length) {
        return;
    }

    const unverifiedSSODomain = customDomains.find(
        (domain) => domain.Flags['sso-intent'] && domain.State !== DOMAIN_STATE.DOMAIN_STATE_VERIFIED
    );

    if (!unverifiedSSODomain || unverifiedSSODomain.State === DOMAIN_STATE.DOMAIN_STATE_VERIFIED) {
        return;
    }

    const domainStateMap: {
        [key in Exclude<DOMAIN_STATE, DOMAIN_STATE.DOMAIN_STATE_VERIFIED>]: { text: string; bgColor: string };
    } = {
        [DOMAIN_STATE.DOMAIN_STATE_DEFAULT]: {
            text: c('Info').t`Domain ownership not verified.`,
            bgColor: 'bg-warning',
        },
        [DOMAIN_STATE.DOMAIN_STATE_WARN]: {
            text: c('Info').t`Domain ownership failed verification.`,
            bgColor: 'bg-error',
        },
    };

    const { text, bgColor } = domainStateMap[unverifiedSSODomain.State];
    const ssoAppInfo = getSsoAppInfo(app, organization?.PlanName);

    return (
        <>
            <TopBanner className={`${bgColor}`}>
                {text}{' '}
                <InlineLinkButton
                    key="button"
                    onClick={() => {
                        setModal(true);
                    }}
                >
                    {c('Action').t`Verify the domain ${unverifiedSSODomain.DomainName}`}
                </InlineLinkButton>
            </TopBanner>
            {renderModal && <TXTRecordModal domain={unverifiedSSODomain} ssoAppInfo={ssoAppInfo} {...modalProps} />}
        </>
    );
};

export default SSODomainUnverifiedBanner;
