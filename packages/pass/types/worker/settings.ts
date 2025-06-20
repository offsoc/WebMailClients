export type AutoFillSettings = {
    /** Removal optional after 1.24.0 */
    login?: boolean;
    identity: boolean;
    twofa: boolean;
    basicAuth?: boolean;
    /** @deprecated Kept for >=1.24.0 migrations */
    inject?: boolean;
    /** @deprecated Kept for >=1.24.0 migrations */
    openOnFocus?: boolean;
};

export type AutoSaveSettings = { prompt: boolean; shareId?: string; passwordSuggest: boolean };
export type AutoSuggestSettings = { password: boolean; email: boolean; passwordCopy: boolean };
export type PasskeySettings = { create: boolean; get: boolean };

export type PauseListEntry = { hostname: string; criteria: CriteriaMasks };

export type CriteriaMask = number;
export type CriteriaMasks = keyof typeof CRITERIA_MASKS;
export type DomainCriterias = Record<string, CriteriaMask>;

export type OfflineModeDTO = { loginPassword: string; enabled: boolean };

export const CRITERIA_MASKS = {
    Autofill: 1 << 0,
    Autofill2FA: 1 << 1,
    Autosuggest: 1 << 2,
    Autosave: 1 << 3,
    Passkey: 1 << 4,
};

export const CRITERIAS_SETTING_CREATE = Object.values(CRITERIA_MASKS).reduce((acc, curr) => acc ^ curr, 0);
