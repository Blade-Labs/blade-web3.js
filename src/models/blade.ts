import type { Signer, Wallet } from '@hashgraph/sdk';

declare global {
  interface Window {
    bladeConnect?: BladeExtensionInterface;
  }
}

export const WalletLoadedEvent = 'hederaWalletLoaded';
export const WalletUpdatedEvent = 'hederaWalletUpdated';
export const WalletLockedEvent = 'hederaWalletLocked';

export enum HederaNetwork {
  Mainnet = 'Mainnet',
  Testnet = 'Testnet',
}

/**
 * The interface exposed by the Extension for wallet interactions.
 */
export type BladeExtensionInterface = {
  createSession(network?: HederaNetwork): Promise<Signer>;
  killSession(): Promise<boolean>;

  get hasSession(): boolean;
  getActiveWallet(): Wallet | null;

  addAccount(network: HederaNetwork | null, id: string, privateKey: string, metadata: string | null): Promise<Signer>;
};
