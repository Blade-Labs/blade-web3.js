import {Signer} from "@hashgraph/sdk";
import {SignerSignature} from "@hashgraph/sdk/lib/Signer";
import {KeyPairSignOptions, SessionParams} from "../models/blade";

export interface IConnector extends ExtendedSigner {
    initialized: boolean;
    onWalletLocked(callback: () => void): void;
    onAccountChanged(callback: () => void): void;
    createSession(params?: SessionParams): Promise<string[]>;
    killSession(): Promise<void>;
    selectAccount(accountId?: string): Promise<Signer>;
}

export interface ExtendedSigner extends Signer {
    sign(messages: Uint8Array[],
         signOptions?: KeyPairSignOptions
    ): Promise<SignerSignature[]>

    handshake(
        serverSigningAccount: string,
        serverSignature: string,
        payload: HandshakePayload,
        signOptions?: KeyPairSignOptions
    ): Promise<HandshakeResponse>;
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
    signingAccount: string,
    auth: {
        signedPayload: {
            serverSignature: Uint8Array,
            originalPayload: HandshakePayload
        },
        userSignature: Uint8Array
    }
}
