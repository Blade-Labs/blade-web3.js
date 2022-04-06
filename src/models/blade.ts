import { Wallet } from "@hashgraph/sdk"

declare global {
    interface Window {
        walletConnect?: BladeExtensionInterface
    }
}

export const WalletLoadedEvent = 'hederaWalletLoaded';

export enum HederaNetwork {
    Mainnet = "Mainnet",
    Testnet = "Testnet"
}


export type ConnectorAccount = {
    id: string;
    publicKey: string;
    network: string;
    metadata: any;
    isHardware: boolean;
}

/**
 * The interface exposed by the Extension for wallet interactions.
 */
export type BladeExtensionInterface = {

    createSession(network?: HederaNetwork): Promise<Wallet>;
    killSession(): Promise<boolean>;

    get hasSession(): boolean;
    getActiveWallet(): Wallet | null;

    addAccount(network: HederaNetwork, id: string, privateKey: string, metadata: string | null): Promise<Wallet>;

}

