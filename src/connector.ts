import type {
    AccountBalance,
    AccountId,
    AccountInfo,
    Executable,
    Key,
    LedgerId,
    Signer,
    SignerSignature,
    Transaction,
    TransactionRecord
} from "@hashgraph/sdk";

import {KeyPairSignOptions, SessionParams} from "./models/blade";

import {WCConnector} from "./wc-connector";
import {DAppMetadata} from "@hashgraph/hedera-wallet-connect";
import {HandshakePayload, HandshakeResponse, IConnector} from "./models/interfaces";
import {LegacyConnector} from "./legacy-connector";
import {getBladeExtension, waitForConnector} from "./helpers/interface-helpers";
import {ExtensionConnector} from "./extension-connector";

export class BladeSigner implements IConnector {
    public getAccountKey?: (() => Key);

    private connector!: IConnector;
    private isInitialized = async () => !!this.connector?.initialized;

    constructor(meta?: DAppMetadata) {
        getBladeExtension().then(extensionInterface => {
            if (!extensionInterface) { // QR code case
                this.connector = new WCConnector(meta);
                return;
            }

            if (typeof extensionInterface.pairWC === "function") { // extension case
                this.connector = new ExtensionConnector(meta);
                return;
            }

            this.connector = new LegacyConnector(); // legacy (v0.18.1 and earlier) extension case
        }).catch(() => {
            this.connector = new WCConnector(meta);
        });
    }

    /**
     * Makes an account with given {@link accountId} active.
     * All the subsequent operations will be performed with it.
     *
     * @param {string} accountId Account ID to use
     */
    public async selectAccount(accountId: string): Promise<Signer> {
        await waitForConnector(this.isInitialized);
        return this.connector.selectAccount(accountId);
    }

    /**
     * Executes a given {@link callback} when the wallet is unlocked.
     *
     * @param {function} callback  Callback to execute
     */
    public async onAccountChanged(callback: () => void): Promise<void> {
        await waitForConnector(this.isInitialized);
        this.connector.onAccountChanged(callback);
    }

    /**
     * Executes a given {@link callback} when the wallet is locked.
     *
     * @param {function} callback  Callback to execute
     */
    public async onWalletLocked(callback: () => void): Promise<void> {
        await waitForConnector(this.isInitialized);
        this.connector.onWalletLocked(callback);
    }

    /**
     * Triggers the process of pairing with the Blade Wallet.
     * If there is the Blade Wallet extension, wallet user will be asked to select accounts to pair.
     * If there is no extension, QR code modal will be shown.
     *
     * @param {SessionParams} params Params to create a session with. Optional for testing
     */
    public async createSession(params?: SessionParams): Promise<string[]> {
        await waitForConnector(this.isInitialized);
        return this.connector.createSession(params);
    }

    /**
     * Closes an active session and removes all the event subscriptions.
     */
    public async killSession(): Promise<void> {
        await waitForConnector(this.isInitialized);
        return this.connector.killSession();
    }

    /**
     * Returns a map of Hedera node accounts.
     */
    public getNetwork(): Record<string, string | AccountId> {
        return this.connector?.getNetwork() || {};
    }

    /**
     * Returns a list of Hedera mirror node accounts for the current network.
     */
    public getMirrorNetwork(): string[] {
        return this.connector?.getMirrorNetwork() || [];
    }

    /**
     * Prompts a wallet user to sign given {@link messages}.
     * If signed successfully, returns a list of signatures.
     *
     * @param {Uint8Array[]} messages Messages to sign
     * @param {KeyPairSignOptions} signOptions Optional params to sign with
     */
    public async sign(
      messages: Uint8Array[],
      signOptions?: KeyPairSignOptions
    ): Promise<SignerSignature[]> {
        await waitForConnector(this.isInitialized);
        return this.connector.sign(messages, signOptions);
    }

    /**
     * Prompts a wallet user to sign a given {@link transaction}.
     * If signed successfully, returns the signed transaction.
     *
     * @param {Transaction} transaction Transaction to sign
     */
    public async signTransaction<T extends Transaction>(transaction: T): Promise<T> {
        await waitForConnector(this.isInitialized);
        return this.connector.signTransaction(transaction);
    }

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
    public async handshake(
        serverSigningAccount: string,
        serverSignature: string,
        payload: HandshakePayload,
        signOptions?: KeyPairSignOptions
    ): Promise<HandshakeResponse> {
        await waitForConnector(this.isInitialized);
        return this.connector.handshake(serverSigningAccount, serverSignature, payload, signOptions);
    }

    /**
     * Executes a given {@link request}. The request might be a transaction, a query, or a contract.
     * If executed successfully, returns the result of the request.
     *
     * @param {Executable} request Request to execute
     */
    public async call<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
        await waitForConnector(this.isInitialized);
        return this.connector.call(request);
    }

    /**
     * Validates a given {@link transaction} by checking the following:
     * 1. Transaction ID was created with the active account;
     * 2. Node account IDs belong to the current network.
     *
     * @param {Transaction} transaction Transaction to validate
     */
    public async checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
        await waitForConnector(this.isInitialized);
        return this.connector.checkTransaction(transaction);
    }

    /**
     * Modifies the {@link transaction} with transaction ID and Node account IDs using the active account.
     *
     * @param {Transaction} transaction Transaction to validate
     */
    public async populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
        await waitForConnector(this.isInitialized);
        return this.connector.populateTransaction(transaction);
    }

    /**
     * Returns Hedera network ID (i.e. Mainnet, Testnet etc).
     */
    public getLedgerId(): LedgerId | null {
        return this.connector?.getLedgerId() || null;
    }

    /**
     * Returns active account ID.
     */
    public getAccountId(): AccountId {
        return this.connector?.getAccountId();
    }

    /**
     * Returns {@link AccountBalance} object with balance info.
     */
    public async getAccountBalance(): Promise<AccountBalance> {
        await waitForConnector(this.isInitialized);
        return this.connector.getAccountBalance();
    }

    /**
     * Returns {@link AccountInfo} object with detailed account info.
     */
    public async getAccountInfo(): Promise<AccountInfo> {
        await waitForConnector(this.isInitialized);
        return this.connector.getAccountInfo();
    }

    /**
     * Returns a list of {@link TransactionRecord} objects, which contain detailed info about active account transactions.
     */
    public async getAccountRecords(): Promise<TransactionRecord[]> {
        await waitForConnector(this.isInitialized);
        return this.connector.getAccountRecords();
    }

    /**
     * Checks if the underlying connector is initialized.
     */
    public get initialized(): boolean {
        return !!this.connector?.initialized;
    }
}
