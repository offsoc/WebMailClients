import { FileStorageMemory } from '@proton/pass/lib/file-storage/fs.memory';
import { awaiter } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { uniqueId } from '@proton/pass/utils/string/unique-id';
import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

import { FileStorageIDB, openPassFileDB } from './fs.idb';
import { FileStorageOPFS } from './fs.opfs';
import type { FileStorage } from './types';

export const fileStorageReady = awaiter<boolean>();

/** isSafari() works on web app but not on extension
 * background script, so we have to use BUILD_TARGET */
const isOPFSSupported = () =>
    BUILD_TARGET !== 'safari' &&
    !isSafari() &&
    !isMobile() &&
    Boolean(navigator.storage && navigator.storage.getDirectory);

type StorageOptions = { OPFS: boolean; IDB: boolean };

export const MemoryStorage = new FileStorageMemory();

export const getSupportedFileStorage = (options: StorageOptions) => {
    if (options.OPFS && isOPFSSupported()) return new FileStorageOPFS();
    if (EXTENSION_BUILD && options.IDB && 'indexedDB' in globalThis) return new FileStorageIDB();
    return MemoryStorage;
};

export let fileStorage: FileStorage = getSupportedFileStorage({ OPFS: true, IDB: true });

export const onStorageFallback = async (
    fs: FileStorage,
    onSwitch: (instance: FileStorage) => void,
    onReady: () => void
) => {
    let options: StorageOptions = { OPFS: true, IDB: true };

    try {
        switch (fs.type) {
            case 'OPFS':
                /** Verify OPFS availability by attempting to access and write to storage.
                 * This confirms both API support and necessary permissions. */
                options.OPFS = false;
                const root = await navigator.storage.getDirectory();
                const filename = `test-opfs-${uniqueId()}`;
                const fileHandle = await root.getFileHandle(filename, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.close();
                await root.removeEntry(filename);
                break;
            case 'IDB':
                /** Verify IndexedDB functionality by opening the database.
                 * This catches restrictions in private browsing modes. */
                options.OPFS = false;
                options.IDB = false;
                await openPassFileDB();
                break;
        }
    } catch (err) {
        const unsupported = fs.type;
        const fallback = getSupportedFileStorage(options);
        logger.info(`[fs::${unsupported}] storage not supported - switching to ${fallback.type}`);

        onSwitch(fallback);
        await onStorageFallback(fallback, onSwitch, onReady).catch(noop);
    } finally {
        onReady();
    }
};

if (ENV !== 'test') {
    onStorageFallback(
        fileStorage,
        (instance) => (fileStorage = instance),
        () => fileStorageReady.resolve(true)
    ).catch(noop);
}
