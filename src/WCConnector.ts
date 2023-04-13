import type {Executable, Signer} from "@hashgraph/sdk";
import {DAppConnector, DAppMetadata} from "@hashgraph/hedera-wallet-connect";

import {
    HederaNetwork,
    KeyPairSignOptions,
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
import {ExtendedSigner, HandshakePayload, HandshakeResponse, IConnector, WalletEvent} from "./models/interfaces";
import {filter, Subscription} from "rxjs";
import {getAccountIDsFromSigners} from "./helpers/utils";

export class WCConnector implements IConnector {
    protected activeSigner: ExtendedSigner | null = null;
    protected signers: ExtendedSigner[] = [];
    protected dAppConnector: DAppConnector;
    private subscriptions: Subscription[] = [];

    constructor(meta?: DAppMetadata) {
        this.dAppConnector = new DAppConnector(meta);
        this.dAppConnector.init([WalletLoadedEvent, WalletUpdatedEvent, WalletLockedEvent], ['handshake']);
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

    async createSession(params?: SessionParams): Promise<string[]> {
        try {
            const networkName = (params?.network || HederaNetwork.Mainnet).toLowerCase();
            await this.dAppConnector.connect(LedgerId.fromString(networkName))
            this.signers = this.dAppConnector.getSigners();
            this.activeSigner = this.signers[0] || null;
            return getAccountIDsFromSigners(this.signers);
        } catch (e) {
            throw e;
        }
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

    signTransaction<T extends Transaction>(transaction: T): Promise<T> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.signTransaction<T>(transaction);
    }

    sign(messages: Uint8Array[], signOptions?: KeyPairSignOptions): Promise<SignerSignature[]> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.sign(messages, signOptions);
    }

    handshake(
        serverSigningAccount: string,
        serverSignature: string,
        payload: HandshakePayload,
        signOptions?: KeyPairSignOptions
    ): Promise<HandshakeResponse> {
        if (!this.activeSigner) {
            throw noSessionError();
        }
        return this.activeSigner.handshake(serverSigningAccount, serverSignature, payload, signOptions);
    }

    async selectAccount(accountId?: string): Promise<Signer> {
        const account = this.signers.find(s => s.getAccountId().toString() === accountId);
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
