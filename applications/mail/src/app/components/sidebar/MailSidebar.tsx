import { memo, useCallback, useRef } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Tooltip } from '@proton/atoms';
import {
    AppVersion,
    AppsDropdown,
    Icon,
    Sidebar,
    SidebarDrawerItems,
    SidebarLogo,
    SidebarNav,
    useActiveBreakpoint,
    useApi,
    useLocalState,
} from '@proton/components';
import SidebarStorageUpsell from '@proton/components/containers/payments/subscription/SidebarStorageUpsell';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';
import { APPS } from '@proton/shared/lib/constants';
import {
    COLLAPSE_EVENTS,
    SOURCE_EVENT,
    sendRequestCollapsibleSidebarReport,
    useLeftSidebarButton,
} from '@proton/shared/lib/helpers/collapsibleSidebar';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { CHECKLIST_DISPLAY_TYPE } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { useOnCompose } from '../../containers/ComposeProvider';
import { useGetStartedChecklist } from '../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../store/layout/layoutSlice';
import { selectLayoutIsExpanded } from '../../store/layout/layoutSliceSelectors';
import OnboardingChecklistSidebar from '../onboarding/checklist/sidebar/OnboardingChecklistSidebar';
import MailSidebarList from './MailSidebarList';
import MailSidebarPrimaryButton from './MailSidebarPrimaryButton';

interface Props {
    labelID: string;
}

const MailSidebar = ({ labelID }: Props) => {
    const api = useApi();
    const [user] = useUser();
    const [showSideBar, setshowSideBar] = useLocalState(true, `${user.ID}-${APPS.PROTONMAIL}-left-nav-opened`);
    const { viewportWidth } = useActiveBreakpoint();
    const collapsed = !showSideBar && !viewportWidth['<=small'];

    const onCompose = useOnCompose();
    const dispatch = useMailDispatch();
    const expanded = useMailSelector(selectLayoutIsExpanded);
    const { displayState, canDisplayChecklist } = useGetStartedChecklist();
    const handleCompose = useCallback(() => {
        void onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
    }, [onCompose]);

    const logo = <SidebarLogo collapsed={collapsed} to="/inbox" app={APPS.PROTONMAIL} />;

    const displayContactsInHeader = useDisplayContactsWidget();

    const onClickExpandNav = (sourceEvent = SOURCE_EVENT.BUTTON_SIDEBAR) => {
        sendRequestCollapsibleSidebarReport({
            api,
            action: showSideBar ? COLLAPSE_EVENTS.COLLAPSE : COLLAPSE_EVENTS.EXPAND,
            application: APPS.PROTONMAIL,
            sourceEvent,
        });
        setshowSideBar(!showSideBar);
    };

    const navigationRef = useRef<HTMLDivElement>(null);

    const { isScrollPresent } = useLeftSidebarButton({
        navigationRef,
    });

    return (
        <Sidebar
            app={APPS.PROTONMAIL}
            appsDropdown={<AppsDropdown app={APPS.PROTONMAIL} />}
            expanded={expanded}
            onToggleExpand={() => {
                dispatch(layoutActions.toggleSidebarExpand());
            }}
            primary={<MailSidebarPrimaryButton collapsed={collapsed} handleCompose={handleCompose} />}
            logo={logo}
            version={<AppVersion />}
            preFooter={<SidebarStorageUpsell app={APPS.PROTONMAIL} />}
            collapsed={collapsed}
            showStorage={showSideBar}
            navigationRef={navigationRef}
        >
            <SidebarNav className="flex *:min-size-auto">
                <MailSidebarList
                    labelID={labelID}
                    postItems={
                        <>
                            {displayContactsInHeader && (
                                <SidebarDrawerItems
                                    toggleHeaderDropdown={() => {
                                        dispatch(layoutActions.setSidebarExpanded(false));
                                    }}
                                />
                            )}
                            {canDisplayChecklist && displayState === CHECKLIST_DISPLAY_TYPE.REDUCED && !collapsed && (
                                <OnboardingChecklistSidebar />
                            )}
                        </>
                    }
                    collapsed={collapsed}
                    onClickExpandNav={onClickExpandNav}
                />

                {!isElectronApp && (
                    <span
                        className={clsx(
                            'mt-auto',
                            !collapsed && 'absolute bottom-0 right-0 mb-11',
                            isScrollPresent && 'sidebar-collapse-button-container--above-scroll'
                        )}
                    >
                        {collapsed && <div aria-hidden="true" className="border-top my-1 mx-3"></div>}
                        <Tooltip
                            title={
                                showSideBar
                                    ? c('Action').t`Collapse navigation bar`
                                    : c('Action').t`Display navigation bar`
                            }
                            originalPlacement="right"
                        >
                            <button
                                className={clsx(
                                    'hidden md:flex sidebar-collapse-button navigation-link-header-group-control color-weak shrink-0',
                                    !showSideBar && 'sidebar-collapse-button--collapsed',
                                    collapsed ? 'mx-auto' : 'mr-2 ml-auto',
                                    isScrollPresent && 'sidebar-collapse-button--above-scroll'
                                )}
                                onClick={() => onClickExpandNav()}
                                aria-pressed={showSideBar}
                            >
                                <Icon
                                    name={showSideBar ? 'chevrons-left' : 'chevrons-right'}
                                    alt={c('Action').t`Show navigation bar`}
                                />
                            </button>
                        </Tooltip>
                    </span>
                )}
            </SidebarNav>
        </Sidebar>
    );
};

export default memo(MailSidebar);
