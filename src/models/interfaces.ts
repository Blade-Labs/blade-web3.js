import {Executable, Signer, Transaction} from "@hashgraph/sdk";
import {
    AccountBalance,
    AccountId,
    AccountInfo,
    Key,
    LedgerId,
    SignerSignature,
    TransactionRecord
} from "@hashgraph/sdk/lib/Signer";
import {KeyPairSignOptions, SessionParams} from "@/models/blade";

export interface IConnector {
    initialized: boolean;
    getSigner(): BladeSigner | null;
    getSigners(): BladeSigner[];
    onWalletLocked(callback: () => void): void;
    onWalletUnlocked(callback: () => void): void;
    createSession(params?: SessionParams): Promise<string[]>;
    killSession(): Promise<void>;
    selectAccount(accountId?: string): Promise<Signer>;
}

export interface BladeSigner extends Signer {
    /**
     * Prompts a wallet user to sign given {@link messages}.
     * If signed successfully, returns a list of signatures.
     *
     * @param {Uint8Array[]} messages Messages to sign
     * @param {KeyPairSignOptions} signOptions Optional params to sign with
     */
    sign(messages: Uint8Array[],
         signOptions?: KeyPairSignOptions
    ): Promise<SignerSignature[]>

    /**
     * Prompts a wallet user to authorize a given {@link payload}.
     * Typically, should be used, if backend needs to make sure, that wallet user surely has access to a wallet.
     * Returns {@link HandshakeResponse} object with wallet user's signature and incoming data.
     *
     * @param {string} serverSigningAccount Backend account ID to perform a handshake by
     * @param {string} serverSignature Backend signature to authorize by wallet user
     * @param {HandshakePayload} payload Payload to authorize by wallet user
     * @param {KeyPairSignOptions} signOptions Optional params to authorize with
     */
    handshake(
        serverSigningAccount: string,
        serverSignature: string,
        payload: HandshakePayload,
        signOptions?: KeyPairSignOptions
    ): Promise<HandshakeResponse>;

    /**
     * Returns Hedera network ID (i.e. Mainnet, Testnet etc).
     */
    getLedgerId: () => LedgerId | null;

    /**
     * Returns account ID associated with the signer.
     */
    getAccountId: () => AccountId;

    /**
     * Returns account key.
     */
    getAccountKey?: (() => Key) | undefined;

    /**
     * Returns a map of Hedera node accounts.
     */
    getNetwork: () => Record<string, string | AccountId>;

    /**
     * Returns a list of Hedera mirror node accounts for the current network.
     */
    getMirrorNetwork: () => string[];

    /**
     * Returns {@link AccountBalance} object with balance info.
     */
    getAccountBalance: () => Promise<AccountBalance>;

    /**
     * Returns {@link AccountInfo} object with detailed account info.
     */
    getAccountInfo: () => Promise<AccountInfo>;

    /**
     * Returns a list of {@link TransactionRecord} objects, which contain detailed info about active account transactions.
     */
    getAccountRecords: () => Promise<TransactionRecord[]>;

    /**
     * Prompts a wallet user to sign a given {@link transaction}.
     * If signed successfully, returns the signed transaction.
     *
     * @param {Transaction} transaction Transaction to sign
     */
    signTransaction: <T extends Transaction>(transaction: T) => Promise<T>;

    /**
     * Validates a given {@link transaction} by checking the following:
     * 1. Transaction ID was created with the active account;
     * 2. Node account IDs belong to the current network.
     *
     * @param {Transaction} transaction Transaction to validate
     */
    checkTransaction: <T_1 extends Transaction>(transaction: T_1) => Promise<T_1>;

    /**
     * Modifies the {@link transaction} with transaction ID and Node account IDs using the active account.
     *
     * @param {Transaction} transaction Transaction to validate
     */
    populateTransaction: <T_2 extends Transaction>(transaction: T_2) => Promise<T_2>;

    /**
     * Executes a given {@link request}. The request might be a transaction, a query, or a contract.
     * If executed successfully, returns the result of the request.
     *
     * @param {Executable} request Request to execute
     */
    call: <RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>) => Promise<OutputT>;
}

export type WalletEvent = {
    name: string,
    data: any
}

export interface HandshakePayload {
    url: string,
    data: any
}

export interface HandshakeResponse {
    originalPayload: HandshakePayload,
    serverSignature: {
        publicKey: string,
        signature: string,
        accountId: string
    },
    userSignature: {
        publicKey: string,
        signature: string,
        accountId: string
    }
}

export enum ConnectorStrategy {
    EXTENSION,
    WALLET_CONNECT
}
