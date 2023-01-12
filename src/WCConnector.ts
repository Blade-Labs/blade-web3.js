import type {Executable, Signer} from "@hashgraph/sdk";
import {DAppConnector, DAppMetadata} from "@bladelabs/hedera-wallet-connect";

import {
    HederaNetwork,
    SessionParams,
    WalletLoadedEvent,
    WalletLockedEvent,
    WalletUpdatedEvent
} from "./models/blade";

import { noSessionError } from "./models/errors";
import {
    AccountBalance,
    AccountId,
    AccountInfo,
    LedgerId,
    SignerSignature,
    Transaction,
    TransactionRecord
} from "@hashgraph/sdk";
import {IConnector, WalletEvent} from "./models/interfaces";
import {filter, Subscription} from "rxjs";

export class WCConnector implements IConnector {
    protected activeSigner: Signer | null = null;
    protected signers: Signer[] = [];
    protected dAppConnector: DAppConnector;
    private subscriptions: Subscription[] = [];

    constructor(meta?: DAppMetadata) {
        this.dAppConnector = new DAppConnector(meta);
        this.dAppConnector.init([WalletLoadedEvent, WalletUpdatedEvent, WalletLockedEvent]);
    }

    /**
     * @param callback synchronous function to run every time wallet is locked
     */
    onWalletLocked(callback: () => void) {
        const lockedSub = this.dAppConnector.$events
            .pipe(filter((e: WalletEvent) => e.name === WalletLockedEvent))
            .subscribe(callback);
        this.subscriptions.push(lockedSub);
    }

    onAccountChanged(callback: () => void): void {
        const updatedSub = this.dAppConnector.$events
            .pipe(filter((e: WalletEvent) => e.name === WalletUpdatedEvent))
            .subscribe(callback);
        this.subscriptions.push(updatedSub);
    }

    async createSession(params?: SessionParams): Promise<void> {
        const networkName = (params?.network || HederaNetwork.Mainnet).toLowerCase();
        await this.dAppConnector.connect(LedgerId.fromString(networkName))
        this.signers = this.dAppConnector.getSigners();
        this.activeSigner = this.signers[0] || null;
    }

    async killSession(): Promise<void> {
        this.subscriptions.forEach(s => s.unsubscribe());
        return this.dAppConnector.disconnect();
    }

    call<RequestT, ResponseT, OutputT>(executable: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.call(executable);
    }

    checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.checkTransaction<T>(transaction);
    }

    getAccountBalance(): Promise<AccountBalance> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.getAccountBalance();
    }

    getAccountId(): AccountId {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.getAccountId();
    }

    getAccountInfo(): Promise<AccountInfo> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.getAccountInfo();
    }

    getAccountRecords(): Promise<TransactionRecord[]> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.getAccountRecords();
    }

    getLedgerId(): LedgerId | null {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.getLedgerId();
    }

    getMirrorNetwork(): string[] {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.getMirrorNetwork();
    }

    getNetwork(): { [p: string]: string | AccountId } {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.getNetwork();
    }

    populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.populateTransaction<T>(transaction);
    }

    sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.sign(messages);
    }

    signTransaction<T extends Transaction>(transaction: T): Promise<T> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.signTransaction<T>(transaction);
    }

    async selectAccount(accountId?: string): Promise<Signer> {
        const account = this.signers.find(s => s.getAccountId.toString() === accountId);
        if (!this.activeSigner || !account && accountId) {
            throw noSessionError();
        }
        this.activeSigner = account || this.activeSigner;
        return this.activeSigner!;
    }

    get initialized(): boolean {
        return Boolean(this.dAppConnector?.initialized);
    }
}
