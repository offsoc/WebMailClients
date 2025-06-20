import type { PropsWithChildren } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Pill } from '@proton/atoms';
import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { DESKTOP_PLATFORMS } from '@proton/shared/lib/constants';
import type { DesktopVersion } from '@proton/shared/lib/desktop/DesktopVersion';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import useInboxDesktopVersion from './useInboxDesktopVersion';

interface DownloadSectionProps extends PropsWithChildren {
    version: string;
    icon: IconName;
    platform: DESKTOP_PLATFORMS;
    isBeta?: boolean;
}

const DownloadDropdown = ({ app }: { app: DesktopVersion }) => {
    const debUrl = app.File.find((file) => file.Url.endsWith('.deb'))!.Url;
    const debText = c('Download link').t`.deb for Debian / Ubuntu`;
    const rpmUrl = app.File.find((file) => file.Url.endsWith('.rpm'))!.Url;
    const rpmText = c('Download link').t`.rpm for Fedora / Red Hat`;

    const [value, setValue] = useState(debUrl);

    const handleClick = () => {
        if (isElectronMail) {
            void invokeInboxDesktopIPC({ type: 'openExternal', payload: value });
        } else {
            window.open(value, '_self');
        }
    };

    return (
        <div className="flex gap-2 w-full">
            <SelectTwo
                value={value}
                onChange={({ value }) => setValue(value)}
                id="download-button-description"
                aria-description={c('Label').t`Select Linux package format`}
            >
                <Option value={debUrl} title={debText}>
                    {debText}
                </Option>
                <Option value={rpmUrl} title={rpmText}>
                    {rpmText}
                </Option>
            </SelectTwo>
            <Button color="norm" onClick={handleClick} fullWidth aria-describedby="download-button-description">{c(
                'Action'
            ).t`Download`}</Button>
        </div>
    );
};

const DownloadButton = ({ link, ariaLabel }: { link?: string; ariaLabel?: string }) => {
    if (isElectronMail && link) {
        const handleClick = () => {
            void invokeInboxDesktopIPC({ type: 'openExternal', payload: link });
        };

        return (
            <Button color="norm" onClick={handleClick} fullWidth aria-label={ariaLabel}>{c('Action')
                .t`Download`}</Button>
        );
    }

    return (
        <ButtonLike as="a" color="norm" shape="solid" fullWidth href={link} target="_self" aria-label={ariaLabel}>
            {c('Action').t`Download`}
        </ButtonLike>
    );
};

const getPlatformCopy = (platform: DESKTOP_PLATFORMS) => {
    switch (platform) {
        case DESKTOP_PLATFORMS.WINDOWS:
            return c('Title').t`For Windows`;
        case DESKTOP_PLATFORMS.MACOS:
            return c('Title').t`For macOS`;
        case DESKTOP_PLATFORMS.LINUX:
            return c('Title').t`For Linux`;
    }
};

const DownloadCard = ({ version, icon, platform, isBeta, children }: DownloadSectionProps) => {
    return (
        <div className="flex">
            <div className="border p-7 flex-1 rounded flex flex-column items-center">
                <Icon size={12} name={icon} className="mb-4" />
                <h3 className="text-bold text-xl m-0 text-center">{getPlatformCopy(platform)}</h3>
                {version.length ? (
                    <div className="flex gap-2 items-baseline">
                        {isBeta && <Pill className="mt-2">{c('Label').t`Beta`}</Pill>}
                        <span className="text-center">{version}</span>
                    </div>
                ) : null}

                <div className="mt-4 w-full">{children}</div>
            </div>
        </div>
    );
};

export const InboxDesktopSettingsSection = () => {
    const { windowsApp, macosApp, linuxApp } = useInboxDesktopVersion();

    return (
        <SettingsSectionWide>
            <SettingsParagraph
                inlineLearnMore
                className="mt-0 mb-4"
                learnMoreUrl={getKnowledgeBaseUrl('/mail-desktop-app')}
            >
                {c('Info').t`Fast and focused. Email and calendar, right on your desktop.`}
            </SettingsParagraph>

            <div className="mt-8 grid-column-2 grid-auto-fill gap-4">
                <DownloadCard
                    version={windowsApp.Version}
                    icon="brand-windows"
                    platform={DESKTOP_PLATFORMS.WINDOWS}
                    isBeta={windowsApp.CategoryName === 'EarlyAccess'}
                >
                    <DownloadButton link={windowsApp.File[0]!.Url} ariaLabel={c('Action').t`Download for Windows`} />
                </DownloadCard>
                <DownloadCard
                    version={macosApp.Version}
                    icon="brand-apple"
                    platform={DESKTOP_PLATFORMS.MACOS}
                    isBeta={macosApp.CategoryName === 'EarlyAccess'}
                >
                    <DownloadButton link={macosApp.File[0]!.Url} ariaLabel={c('Action').t`Download for macOS`} />
                </DownloadCard>
                <DownloadCard version={linuxApp.Version} icon="brand-linux" platform={DESKTOP_PLATFORMS.LINUX}>
                    {linuxApp.Version && <DownloadDropdown app={linuxApp} />}
                </DownloadCard>
            </div>
        </SettingsSectionWide>
    );
};
