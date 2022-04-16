export enum ErrorTypes {
    MALICIOUS = "malicious",
    LOCKED = "locked",
    PROMPT_CLOSED = "prompt_closed",
    UPGRADE_REQUIRED = "upgrade_required",
    NO_ACCOUNT = "no_account",
    LOGIN_REJECTED = "login_rejected",
    INVALID_METADATA = "invalid_metadata",
    INVALID_NETWORK = "invalid_network",
    BAD_PRIVATE_KEY = "bad_private_key",
    INVALID_ID = "invalid_id",
    INVALID_ACCOUNT = "invalid_account",
    ID_EXISTS = "id_exists",
    ERROR_SAVING = "error_saving",
    ACCOUNT_REJECTED = "account_rejected",
    SIGNATURE_REJECTED = "signature_rejected"
}


export enum ErrorCodes {
    NO_SIGNATURE = 402,
    FORBIDDEN = 403,
    TIMED_OUT = 408,
    LOCKED = 423,
    UPGRADE_REQUIRED = 426,
    TOO_MANY_REQUESTS = 429
}

/**
 * Possible error thrown by WalletExtension
 */
export type WalletError = {

    type: ErrorTypes;
    message: string;
    code: ErrorCodes;
    isError: boolean;

}