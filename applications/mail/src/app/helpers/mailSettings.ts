import type { Location } from 'history';

import { isAlwaysMessageLabels } from '@proton/mail/labels/helpers';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { VIEW_LAYOUT, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { isSearch } from './elements';
import { extractSearchParameters } from './mailboxUrl';

export const isColumnMode = ({ ViewLayout = VIEW_LAYOUT.COLUMN }: Partial<MailSettings> = {}) =>
    ViewLayout === VIEW_LAYOUT.COLUMN;

export const isConversationMode = (
    labelID = '',
    { ViewMode = VIEW_MODE.GROUP }: Partial<MailSettings> = {},
    location?: Location
) => {
    const searchParams = location ? extractSearchParameters(location) : {};

    return !isAlwaysMessageLabels(labelID) && ViewMode === VIEW_MODE.GROUP && !isSearch(searchParams);
};
