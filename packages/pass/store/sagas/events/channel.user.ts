/* eslint-disable @typescript-eslint/no-throw-literal, curly */
import { all, call, fork, put, select } from 'redux-saga/effects';

import { PassCrypto } from '@proton/pass/lib/crypto';
import type { EventCursor, EventManagerEvent } from '@proton/pass/lib/events/manager';
import { getUserData } from '@proton/pass/lib/user/user.requests';
import {
    getInAppNotifications,
    getUserAccessIntent,
    getUserFeaturesIntent,
    syncIntent,
    userEvent,
    userRefresh,
} from '@proton/pass/store/actions';
import { getOrganizationSettings } from '@proton/pass/store/actions/creators/organization';
import type { HydratedUserState } from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { SyncType } from '@proton/pass/store/sagas/client/sync';
import {
    selectAllAddresses,
    selectLatestEventId,
    selectUser,
    selectUserPlan,
    selectUserSettings,
} from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull, PassPlanResponse, UserEvent } from '@proton/pass/types';
import { type Api } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { notIn } from '@proton/pass/utils/fp/predicates';
import { logId, logger } from '@proton/pass/utils/logger';
import { getEvents, getLatestID } from '@proton/shared/lib/api/events';
import type { Address, User, UserSettings } from '@proton/shared/lib/interfaces';
import identity from '@proton/utils/identity';

import { eventChannelFactory } from './channel.factory';
import { channelEvents, channelInitalize } from './channel.worker';
import type { EventChannel } from './types';

/* If we get the user model from the event or triggered or full user refresh,
 * check if any new active user keys are available. We might be dealing with a
 * user re-activating a disabled user key in which case we want to trigger a full
 * data sync in order to access any previously inactive shares */
function* onUserRefreshed(user: User, keyPassword?: string) {
    if (!keyPassword) return;

    const localUserKeyIds = (PassCrypto.getContext().userKeys ?? []).map(prop('ID'));
    const activeUserKeys = user.Keys.filter(({ Active }) => Active === 1);

    const keysUpdated =
        activeUserKeys.length !== localUserKeyIds.length || activeUserKeys.some(({ ID }) => notIn(localUserKeyIds)(ID));

    if (keysUpdated && keyPassword) {
        logger.info(`[ServerEvents::User] Detected user keys update`);
        const addresses: Address[] = yield select(selectAllAddresses);
        yield PassCrypto.hydrate({ user, keyPassword, addresses, clear: false });
        yield put(syncIntent(SyncType.FULL)); /* trigger a full data sync */
    }
}

function* onUserEvent(
    event: EventManagerEvent<UserEvent>,
    _: EventChannel<UserEvent>,
    { getAuthStore, getTelemetry, onLocaleUpdated }: RootSagaOptions
) {
    const telemetry = getTelemetry();
    if ('error' in event) throw event.error;

    const currentEventId = (yield select(selectLatestEventId)) as MaybeNull<string>;
    const userId = getAuthStore().getUserID()!;
    const userSettings: MaybeNull<UserSettings> = yield select(selectUserSettings);
    const cachedUser: MaybeNull<User> = yield select(selectUser);
    const cachedPlan: MaybeNull<PassPlanResponse> = yield select(selectUserPlan);

    /* dispatch only if there was a change */
    if (currentEventId !== event.EventID) {
        yield put(userEvent(event));
        logger.info(`[ServerEvents::User] event ${logId(event.EventID!)}`);
    }

    const { User: user } = event;
    const keyPassword = getAuthStore().getPassword();

    if (event.Refresh) {
        const data: HydratedUserState = yield getUserData();
        yield put(userRefresh(data));
        yield call(onUserRefreshed, data.user, keyPassword);
        return;
    }

    if (event.UserSettings && telemetry) {
        const { Telemetry } = event.UserSettings;
        if (Telemetry !== userSettings?.Telemetry) telemetry[Telemetry === 1 ? 'start' : 'stop']();
    }

    if (event.UserSettings?.Locale) {
        const { Locale } = event.UserSettings;
        if (Locale !== userSettings?.Locale) yield onLocaleUpdated?.(Locale);
    }

    if (user) yield call(onUserRefreshed, user, keyPassword);

    /* Revalidate the user access if we detect a subscription or plan type change. */
    const revalidateUserAccess =
        (event.User && event.User.Subscribed !== cachedUser?.Subscribed) ||
        (event.Organization && event.Organization.PlanName !== cachedPlan?.InternalName);

    /* Synchronize whenever polling for core user events:
     * · User access
     * · Feature flags
     * · Organization
     * · In-app Notification
     * These actions are throttled via `maxAge` metadata */
    yield put((revalidateUserAccess ? withRevalidate : identity)(getUserAccessIntent(userId)));
    yield put(getUserFeaturesIntent(userId));
    yield put(getOrganizationSettings.intent());
    yield put(getInAppNotifications.intent());
}

export const createUserChannel = (api: Api, eventID: string) =>
    eventChannelFactory<UserEvent>({
        api,
        channelId: 'user',
        initialEventID: eventID,
        query: getEvents,
        getCursor: ({ EventID, More }) => ({ EventID, More: Boolean(More) }),
        getLatestEventID: () => api<EventCursor>(getLatestID()).then(({ EventID }) => EventID),
        onEvent: onUserEvent,
        onClose: () => logger.info(`[ServerEvents::User] closing channel`),
    });

export function* userChannel(api: Api, options: RootSagaOptions) {
    logger.info(`[ServerEvents::User] start polling for user events`);

    const eventID: string = ((yield select(selectLatestEventId)) as ReturnType<typeof selectLatestEventId>) ?? '';
    const eventsChannel = createUserChannel(api, eventID);
    const events = fork(channelEvents<UserEvent>, eventsChannel, options);
    const wakeup = fork(channelInitalize<UserEvent>, eventsChannel, options);

    yield all([events, wakeup]);
}
