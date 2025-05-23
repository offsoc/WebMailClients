import { put, select, takeLeading } from 'redux-saga/effects';

import { hasAttachments } from '@proton/pass/lib/items/item.predicates';
import { getUserAccess } from '@proton/pass/lib/user/user.requests';
import {
    aliasSyncPending,
    getUserAccessFailure,
    getUserAccessIntent,
    getUserAccessSuccess,
    importReport,
    itemCreate,
    itemDelete,
    itemDeleteRevisions,
    itemEdit,
    vaultDeleteSuccess,
} from '@proton/pass/store/actions';
import type { HydratedAccessState } from '@proton/pass/store/reducers';
import { withRevalidate } from '@proton/pass/store/request/enhancers';
import { selectUser } from '@proton/pass/store/selectors';
import type { RootSagaOptions } from '@proton/pass/store/types';
import type { MaybeNull } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
import type { User } from '@proton/shared/lib/interfaces';

function* userAccessWorker({ getAuthStore }: RootSagaOptions, { meta }: ReturnType<typeof getUserAccessIntent>) {
    try {
        const loggedIn = getAuthStore().hasSession();
        const locked = getAuthStore().getLocked();
        const user: MaybeNull<User> = yield select(selectUser);
        if (!loggedIn || locked || !user) throw new Error('Cannot fetch user plan');

        const access: HydratedAccessState = yield getUserAccess();

        /* Sync pending aliases from SimpleLogin */
        const { aliasSyncEnabled, pendingAliasToSync } = access.userData;
        if (aliasSyncEnabled && pendingAliasToSync > 0) yield put(aliasSyncPending.intent());

        yield put(getUserAccessSuccess(meta.request.id, access));
    } catch (error) {
        yield put(getUserAccessFailure(meta.request.id, error));
    }
}

const matchRevalidateUserAccess = (action: unknown) => {
    if (importReport.match(action)) return true;
    if (itemDeleteRevisions.success.match(action)) return true;
    if (vaultDeleteSuccess.match(action)) return true;
    if (or(itemEdit.success.match, itemCreate.success.match)(action)) return hasAttachments(action.payload.item);
    if (itemDelete.success.match(action)) return action.payload.hadFiles;

    return false;
};

export default function* watcher(options: RootSagaOptions) {
    yield takeLeading(getUserAccessIntent.match, userAccessWorker, options);

    /** Revalidates the user storage everytime files are linked */
    yield takeLeading(matchRevalidateUserAccess, function* () {
        const userID = options.getAuthStore().getUserID();
        if (userID) yield put(withRevalidate(getUserAccessIntent(userID)));
    });
}
