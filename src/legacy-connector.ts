import type {
    AccountBalance,
    AccountId,
    AccountInfo,
    Executable,
    LedgerId,
    Signer,
    SignerSignature,
    Transaction,
    TransactionRecord
} from "@hashgraph/sdk";

import {
    SessionParams,
    WalletLoadedEvent,
    WalletLockedEvent,
    WalletUpdatedEvent
} from "./models/blade";

import {noSessionError } from "./models/errors";
import {HandshakeResponse, IConnector} from "./models/interfaces";
import {getBladeExtension} from "./helpers/interface-helpers";

export class LegacyConnector implements IConnector {
    private _onAccountChanged?: () => void;
    private _onWalletLocked?: () => void;
    private _activeWallet: Signer | null = null;

    constructor() {
        document.addEventListener(WalletLoadedEvent, async () => {
            this._activeWallet = (await getBladeExtension())?.getActiveWallet() || null;
        });

        document.addEventListener(WalletUpdatedEvent, async () => {
            this._onAccountChanged?.();
        });

        document.addEventListener(WalletLockedEvent, async () => {
            this._onWalletLocked?.();
        });
    }

    public onAccountChanged(callback: () => void): void {
        this._onAccountChanged = callback;
    }

    public onWalletLocked(callback: () => void): void {
        this._onWalletLocked = callback;
    }

    public getNetwork(): Record<string, string | AccountId> {
        return this._activeWallet?.getNetwork() || {};
    }

    public getMirrorNetwork(): string[] {
        return this._activeWallet?.getMirrorNetwork() || [];
    }

    public async createSession(params?: SessionParams): Promise<string[]> {
        // store the blade extension here
        // the logic is that some methods on the Signer interface are sync
        this._activeWallet = await (await getBladeExtension())?.createSession(params?.network, params?.dAppCode) || null;
        const availableAccounts = []
        if (this._activeWallet) {
            availableAccounts.push(this._activeWallet.getAccountId().toString());
        }
        return availableAccounts;
    }

    public async killSession(): Promise<void> {
        await (await getBladeExtension())?.killSession();

        this._onAccountChanged = undefined;
        this._onWalletLocked = undefined;
    }

    public async sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
        return (await this._getActiveWallet()).sign(messages);
    }

    public async signTransaction<T extends  Transaction>(transaction: T): Promise<T> {
        return (await this._getActiveWallet()).signTransaction(transaction);
    }

    public async handshake(): Promise<HandshakeResponse> {
        throw new Error(`This method not implemented in LegacyConnector. Please use WCConnector instead.`);
    }

    public async call<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
        return (await this._getActiveWallet()).call(request);
    }

    public async checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
        return (await this._getActiveWallet()).checkTransaction(transaction);
    }

    public async populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
        return (await this._getActiveWallet()).populateTransaction(transaction);
    }

    public getLedgerId(): LedgerId | null {
        return this._activeWallet?.getLedgerId() || null;
    }

    public getAccountId(): AccountId {
        if (!this._activeWallet) {
            throw noSessionError();
        }

        return this._activeWallet.getAccountId();
    }

    public async getAccountBalance(): Promise<AccountBalance> {
        return (await this._getActiveWallet()).getAccountBalance();
    }

    public async getAccountInfo(): Promise<AccountInfo> {
        return (await this._getActiveWallet()).getAccountInfo();
    }

    public async getAccountRecords(): Promise<TransactionRecord[]> {
        return (await this._getActiveWallet()).getAccountRecords();
    }

    public async selectAccount(accountId?: string): Promise<Signer> {
        if (!this._activeWallet) {
            throw noSessionError();
        }
        if (accountId && this._activeWallet.getAccountId().toString() !== accountId) {
            throw noSessionError();
        }
        return this._activeWallet;
    }

    public get initialized(): boolean {
        return true;
    }

    private async _getActiveWallet(): Promise<Signer> {
        const wallet = (await getBladeExtension())?.getActiveWallet() || null;
        this._activeWallet = wallet;

        if (wallet == null) {
            throw noSessionError();
        }

        return this._activeWallet!;
    }
}
