import { addDays } from 'date-fns';

import { DropdownMenu, DropdownMenuButton, SimpleDropdown, useConfig, useForceRefresh } from '@proton/components';
import { setCookie } from '@proton/shared/lib/helpers/cookies';
import { getSecondLevelDomain } from '@proton/shared/lib/helpers/url';
import { localeCode } from '@proton/shared/lib/i18n';
import { loadLocales } from '@proton/shared/lib/i18n/loadLocale';
import type { TtagLocaleMap } from '@proton/shared/lib/interfaces/Locale';

interface Props {
    className?: string;
    locales?: TtagLocaleMap;
}

const cookieDomain = `.${getSecondLevelDomain(window.location.hostname)}`;
const LanguageSelect = ({ className, locales = {} }: Props) => {
    const forceRefresh = useForceRefresh();
    const { LOCALES = {} } = useConfig();
    const handleChange = async (locale: string) => {
        const { localeCode } = await loadLocales({ locale, locales, userSettings: undefined });
        setCookie({
            cookieName: 'Locale',
            cookieValue: localeCode,
            expirationDate: addDays(new Date(), 30).toUTCString(),
            cookieDomain,
            path: '/',
        });
        forceRefresh();
    };
    const languages = Object.keys(LOCALES).map((value) => (
        <DropdownMenuButton className="text-left" key={value} onClick={() => handleChange(value)}>
            {LOCALES[value]}
        </DropdownMenuButton>
    ));

    const selectedLanguage = (
        <>
            <span className="ml-2">{LOCALES[localeCode]}</span>
        </>
    );

    return (
        <SimpleDropdown as="button" type="button" content={selectedLanguage} className={className}>
            <DropdownMenu>{languages}</DropdownMenu>
        </SimpleDropdown>
    );
};

export default LanguageSelect;
