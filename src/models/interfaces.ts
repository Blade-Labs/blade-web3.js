import {Signer} from "@hashgraph/sdk";
import {SessionParams} from "../models/blade";

export interface IConnector extends Signer {
    initialized: boolean;
    onWalletLocked(callback: () => void): void;
    onAccountChanged(callback: () => void): void;
    createSession(params?: SessionParams): Promise<void>;
    killSession(): Promise<void>;
    selectAccount(accountId?: string): Promise<Signer>
}

export type WalletEvent = {
    name: string,
    data: any
}