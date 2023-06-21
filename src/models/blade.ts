import {PairingTypes} from "@walletconnect/types";

declare global {
  interface Window {
    bladeConnect?: BladeExtensionInterface;
  }
}

export const WalletLockedEvent = 'walletLocked';
export const WalletUnlockedEvent = 'walletUnlocked';

export enum HederaNetwork {
  Mainnet = 'mainnet',
  Testnet = 'testnet',
}

export type SessionParams = {
  network?: HederaNetwork,
  dAppCode?: string
}

export type KeyPairSignOptions = {
  canonical?: boolean,
  withHethers?: boolean
}

/**
 * The interface exposed by the Extension for wallet interactions.
 */
export type BladeExtensionInterface = {
  pairWC?(url: string): Promise<PairingTypes.Struct>;
};
