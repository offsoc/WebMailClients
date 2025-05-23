import type { VaultShareKey } from '@proton/pass/types';
import { ShareType } from '@proton/pass/types';

import { createShareManager } from './share-manager';
import { generateKey, importSymmetricKey } from './utils/crypto-helpers';
import { PassCryptoShareError, PassCryptoVaultError } from './utils/errors';
import { TEST_USER_KEY_ID, createRandomShare } from './utils/testing';

describe('ShareManager', () => {
    test('createShareManager should init manager with share', () => {
        const share = createRandomShare(ShareType.Vault);
        const shareManager = createShareManager(share);

        expect(shareManager.getShare()).toStrictEqual(share);
    });

    test('ShareManager::getLatestRotation should throw if no rotation set', () => {
        const share = createRandomShare(ShareType.Vault);
        const shareManager = createShareManager(share);

        expect(shareManager.getLatestRotation).toThrow(PassCryptoShareError);
    });

    test('ShareManager::setLatestRotation should set the latest rotation', () => {
        const share = createRandomShare(ShareType.Vault);
        const shareManager = createShareManager(share);
        shareManager.setLatestRotation(42);

        expect(shareManager.getLatestRotation()).toStrictEqual(42);
    });

    test('ShareManager::hasVaultShareKey should account for share type and rotation', async () => {
        const key = generateKey();
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const itemShare = createRandomShare(ShareType.Item);
        const itemShareManager = createShareManager(itemShare);

        expect(itemShareManager.hasVaultShareKey(1)).toEqual(false);

        const vaultShare = createRandomShare(ShareType.Vault);
        const vaultShareManager = createShareManager(vaultShare);
        vaultShareManager.addVaultShareKey(vaultKey);

        expect(vaultShareManager.hasVaultShareKey(1)).toEqual(true);
        expect(vaultShareManager.hasVaultShareKey(2)).toEqual(false);
    });

    test('ShareManager::getVaultShareKey should throw on ItemShare', async () => {
        const itemShare = createRandomShare(ShareType.Item);
        const shareManager = createShareManager(itemShare);

        expect(() => shareManager.getVaultShareKey(1)).toThrow(PassCryptoVaultError);
    });

    test('ShareManager::getVaultShareKey should throw if no key for rotation found', () => {
        const vaultShare = createRandomShare(ShareType.Vault);
        const shareManager = createShareManager(vaultShare);

        expect(() => shareManager.getVaultShareKey(1)).toThrow(PassCryptoVaultError);
    });

    test('ShareManager::addVaultShareKey should throw on ItemShare', async () => {
        const key = generateKey();
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 1,
            userKeyId: TEST_USER_KEY_ID,
        };

        const share = createRandomShare(ShareType.Item);
        const shareManager = createShareManager(share);

        expect(() => shareManager.addVaultShareKey(vaultKey)).toThrow(PassCryptoVaultError);
    });

    test('ShareManager::addVaultShareKey should add vault key to share context & update latest rotation', async () => {
        const key = generateKey();
        const vaultKey: VaultShareKey = {
            raw: key,
            key: await importSymmetricKey(key),
            rotation: 42,
            userKeyId: TEST_USER_KEY_ID,
        };

        const share = createRandomShare(ShareType.Vault);
        const shareManager = createShareManager(share);

        expect(() => shareManager.addVaultShareKey(vaultKey)).not.toThrow();
        expect(shareManager.getVaultShareKey(42)).toStrictEqual(vaultKey);
        expect(shareManager.getLatestRotation()).toEqual(42);
    });

    test('ShareManager::serialize result should allow re-hydrating instance', async () => {
        const vaultKeys: VaultShareKey[] = await Promise.all(
            Array.from({ length: 3 }, async (_, i) => {
                const key = generateKey();
                return {
                    raw: key,
                    key: await importSymmetricKey(key),
                    rotation: i + 1,
                    userKeyId: TEST_USER_KEY_ID,
                };
            })
        );

        const share = createRandomShare(ShareType.Vault);
        const shareManager = createShareManager(share);
        vaultKeys.forEach((vaultKey) => shareManager.addVaultShareKey(vaultKey));

        const dump = shareManager.serialize();
        const rehydratedManager = await createShareManager.fromSnapshot(dump);

        expect(rehydratedManager.getShare()).toStrictEqual(share);
        expect(rehydratedManager.getLatestRotation()).toEqual(3);

        vaultKeys.forEach((vaultKey) =>
            expect(rehydratedManager.getVaultShareKey(vaultKey.rotation)).toStrictEqual(vaultKey)
        );
    });
});
