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

import {SessionParams} from "./models/blade";

import {WCConnector} from "./WCConnector";
import {DAppMetadata} from "@hashgraph/hedera-wallet-connect";
import {HandshakePayload, HandshakeResponse, IConnector} from "./models/interfaces";
import {LegacyConnector} from "./legacyConnector";
import {getBladeExtension, waitForConnector} from "./helpers/interfaceHelpers";
import {ExtensionConnector} from "./extensionConnector";

export class BladeSigner implements IConnector {
    private connector!: IConnector;

    constructor(meta?: DAppMetadata) {
        getBladeExtension().then(extensionInterface => {
            if (!extensionInterface) {
                this.connector = new WCConnector(meta);
                return;
            }

            if (typeof extensionInterface.pairWC === "function") {
                this.connector = new ExtensionConnector(meta);
                return;
            }

            this.connector = new LegacyConnector();
        }).catch(() => {
            this.connector = new WCConnector(meta);
            return;
        });
    }

    private isInitialized = async (): Promise<boolean> => {
        return Boolean(this.connector?.initialized);
    }

    async selectAccount(accountId: string): Promise<Signer> {
        await waitForConnector(this.isInitialized);
        return this.connector.selectAccount(accountId);
    }
    getAccountKey?: (() => Key) | undefined;

    onAccountChanged(callback: () => void) {
        waitForConnector(this.isInitialized).then(() => {
            this.connector.onAccountChanged(callback);
        });
    }

    onWalletLocked(callback: () => void) {
        waitForConnector(this.isInitialized).then(() => {
            this.connector.onWalletLocked(callback);
        });
    }

    async createSession(params?: SessionParams): Promise<string[]> {
        await waitForConnector(this.isInitialized);
        return this.connector.createSession(params);
    }

    async killSession(): Promise<void> {
        await waitForConnector(this.isInitialized);
        return this.connector.killSession();
    }

    getNetwork() {
        return this.connector?.getNetwork() || {};
    }

    getMirrorNetwork() {
        return this.connector?.getMirrorNetwork() || [];
    }

    async sign(
      messages: Uint8Array[],
      signOptions?: {canonical: boolean, likeHethers: boolean}
    ): Promise<SignerSignature[]> {
        await waitForConnector(this.isInitialized);
        return this.connector.sign(messages, signOptions);
    }

    async signTransaction<T extends  Transaction>(transaction: T): Promise<T> {
        await waitForConnector(this.isInitialized);
        return this.connector.signTransaction(transaction);
    }

    async handshake(
        serverSigningAccount: string,
        serverSignature: string,
        payload: HandshakePayload,
        signOptions?: {canonical: boolean, likeHethers: boolean}
    ): Promise<HandshakeResponse> {
        await waitForConnector(this.isInitialized);
        return this.connector.handshake(serverSigningAccount, serverSignature, payload, signOptions);
    }

    async call<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
        await waitForConnector(this.isInitialized);
        return this.connector.call(request);
    }

    async checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
        await waitForConnector(this.isInitialized);
        return this.connector.checkTransaction(transaction);
    }

    async populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
        await waitForConnector(this.isInitialized);
        return this.connector.populateTransaction(transaction);
    }

    getLedgerId(): LedgerId | null {
        return this.connector?.getLedgerId() || null;
    }

    getAccountId(): AccountId {
        return this.connector?.getAccountId();
    }

    async getAccountBalance(): Promise<AccountBalance> {
        await waitForConnector(this.isInitialized);
        return this.connector.getAccountBalance();
    }

    async getAccountInfo(): Promise<AccountInfo> {
        await waitForConnector(this.isInitialized);
        return this.connector.getAccountInfo();
    }

    async getAccountRecords(): Promise<TransactionRecord[]> {
        await waitForConnector(this.isInitialized);
        return this.connector.getAccountRecords();
    }

    get initialized(): boolean {
        return Boolean(this.connector);
    }
}
