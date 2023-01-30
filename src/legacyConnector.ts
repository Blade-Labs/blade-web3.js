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
import {IConnector} from "./models/interfaces";
import {getBladeExtension} from "./helpers/interfaceHelpers";

export class LegacyConnector implements IConnector  {
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

    onAccountChanged(callback: () => void) {
        this._onAccountChanged = callback;
    }

    onWalletLocked(callback: () => void) {
        this._onWalletLocked = callback;
    }

    getNetwork() {
        return this._activeWallet?.getNetwork() || {};
    }

    getMirrorNetwork() {
        return this._activeWallet?.getMirrorNetwork() || [];
    }

    async createSession(params?: SessionParams): Promise<string[]> {
        // store the blade extension here
        // the logic is that some methods on the Signer interface are sync
        this._activeWallet = await (await getBladeExtension())?.createSession(params?.network, params?.dAppCode) || null;
        const availableAccounts = []
        if (this._activeWallet) {
            availableAccounts.push(this._activeWallet.getAccountId().toString());
        }
        return availableAccounts;
    }

    async killSession(): Promise<void> {
        await (await getBladeExtension())?.killSession()
        return;
    }

    private async _getActiveWallet(): Promise<Signer> {
        const wallet = (await getBladeExtension())?.getActiveWallet() || null;
        this._activeWallet = wallet;

        if (wallet == null) {
            throw noSessionError();
        }

        return this._activeWallet!;
    }

    async sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
        return (await this._getActiveWallet()).sign(messages);
    }

    async signTransaction<T extends  Transaction>(transaction: T): Promise<T> {
        return (await this._getActiveWallet()).signTransaction(transaction);
    }

    async call<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
        return (await this._getActiveWallet()).call(request);
    }

    async checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
        return (await this._getActiveWallet()).checkTransaction(transaction);
    }

    async populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
        return (await this._getActiveWallet()).populateTransaction(transaction);
    }

    getLedgerId(): LedgerId | null {
        return this._activeWallet?.getLedgerId() || null;
    }

    getAccountId(): AccountId {
        if (!this._activeWallet) {
            throw noSessionError();
        }

        return this._activeWallet.getAccountId();
    }

    async getAccountBalance(): Promise<AccountBalance> {
        return (await this._getActiveWallet()).getAccountBalance();
    }

    async getAccountInfo(): Promise<AccountInfo> {
        return (await this._getActiveWallet()).getAccountInfo();
    }

    async getAccountRecords(): Promise<TransactionRecord[]> {
        return (await this._getActiveWallet()).getAccountRecords();
    }

    async selectAccount(accountId?: string): Promise<Signer> {
        if (!this._activeWallet) {
            throw noSessionError();
        }
        if (accountId && this._activeWallet.getAccountId().toString() !== accountId) {
            throw noSessionError();
        }
        return this._activeWallet;
    }

    get initialized(): boolean {
        return true;
    }
}
