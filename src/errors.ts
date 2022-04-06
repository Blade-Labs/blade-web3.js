export enum ErrorCodes {
    NO_SIGNATURE = 402,
    FORBIDDEN = 403,
    TIMED_OUT = 408,
    LOCKED = 423,
    UPGRADE_REQUIRED = 426,
    TOO_MANY_REQUESTS = 429
}

export enum BladeWalletError {
    ExtensionNotFound = 'ExtensionNotFound',
    NoSession = 'NoActiveSession'
}

export function noExtensionError(): Error {
    const err = new Error(`Blade Extension not found. Please install Blade Wallet Extension.`);
    err.name = BladeWalletError.ExtensionNotFound;
    return err;
}

export function noSessionError(): Error {
    const err = new Error(`Blade login failed. User has failed to authenticate with extension.`);
    err.name = BladeWalletError.NoSession;
    return err;
}