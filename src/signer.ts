import type {
  AccountId,
  AccountBalance,
  AccountInfo,
  LedgerId,
  Transaction,
  Executable,
  SignerSignature,
  TransactionRecord,
  Signer,
} from '@hashgraph/sdk';

import { 
  BladeExtensionInterface,
  WalletLoadedEvent,
  WalletUpdatedEvent,
  WalletLockedEvent
} from './models/blade';

import { noExtensionError, noSessionError } from './models/errors';

/**
 * Implements Hedera Signer interface.
 * https://hips.hedera.com/hip/hip-338
 *
 * Proxies Extension wallet functions to decouple dApp code from
 * Blade's implementation of the wallet.
 */
export class BladeSigner implements Signer {
  /** @hidden */
  private _onAccountChanged?: () => void;

  /** @hidden */
  private _onWalletLocked?: () => void;

  /** @hidden */
  private _bladeExtension?: BladeExtensionInterface = window.bladeConnect;

  /** @hidden */
  private _getBladeExtension(): BladeExtensionInterface {
    this._bladeExtension = window.bladeConnect;

    if (this._bladeExtension == null) {
      // use of method on BladeSigner before using createSession
      throw noExtensionError();
    }

    return this._bladeExtension;
  }

  constructor() {
    document.addEventListener(WalletLoadedEvent, async () => {
      const blade = window.bladeConnect;
      
      if (blade == null) {
        throw new Error("(BUG) unexpected hederaWalletLoaded received but window.bladeConnect is null");
      }

      this._bladeExtension = blade;
    });

    document.addEventListener(WalletUpdatedEvent, async () => {
      this._onAccountChanged?.();
    });

    document.addEventListener(WalletLockedEvent, async () => {
      try {
        // Try to destroy the user's current session (ok if fails)
        if (this._bladeExtension != null) await this._getBladeExtension().killSession();
      } catch (e) {
        console.error(e);
      }

      this._onWalletLocked?.();
    });
  }

  /**
   * @param callback synchronous function to run at every account change
   */
  onAccountChanged(callback: () => void) {
    this._onAccountChanged = callback;
  }

  /**
   * @param callback synchronous function to run every time wallet is locked
   */
  onWalletLocked(callback: () => void) {
    this._onWalletLocked = callback;
  }

  /**
   * @returns Network map currently in use by Blade Wallet.
   */
  getNetwork() {
    return this._getBladeExtension().getActiveWallet()!.getNetwork();
  }

  /**
   * @returns Array of Hedera mirror network nodes.
   */
  getMirrorNetwork() {
    return this._getBladeExtension().getActiveWallet()!.getMirrorNetwork();
  }

  /**
   * Create a new session with the Blade Wallet Extension.
   *
   * All calls will fail until the promise resolves.
   *
   * @returns Promise that resolves when a new session to the Blade Wallet
   * has succeeded.
   */
  async createSession(): Promise<void> {
    // store the blade extension here
    // the logic is that some methods on the Signer interface are sync
    await this._getBladeExtension().createSession();
  }

  /**
   * @hidden
   */
  private _getActiveWallet() {
    const wallet = this._getBladeExtension().getActiveWallet();

    if (wallet == null) {
      throw noSessionError();
    }

    return wallet;
  }

  /**
   * @param messages Array of messages to sign.
   * @returns Promise that resolves to array of Signed messages.
   */
  async sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
    return this._getActiveWallet().sign(messages);
  }

  /**
   * Sign a hedera transaction with Blade Wallet.
   * @param transaction A Hedera transaction.
   * @returns A promise that resolves to the transaction with the signature appended.
   */
  async signTransaction(transaction: Transaction): Promise<Transaction> {
    return this._getActiveWallet().signTransaction(transaction);
  }

  async sendRequest<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
    return this._getActiveWallet().sendRequest(request);
  }

  /**
   * Determines if all the properties required are set and sets the transaction ID.
   *
   * If the transaction ID was already set it checks if the account ID of it is
   * the same as the users.
   *
   * @param transaction
   * @returns Promise that resolves to Transaction with correct transaction ID.
   */
  async checkTransaction(transaction: Transaction): Promise<Transaction> {
    return this._getActiveWallet().checkTransaction(transaction);
  }

  /**
   * Sets the transaction ID of the transaction to the current account ID of the signer.
   * @param transaction
   */
  async populateTransaction(transaction: Transaction): Promise<Transaction> {
    return this._getActiveWallet().populateTransaction(transaction);
  }

  /**
   * @returns LedgerId of network currently being used by Blade Wallet.
   */
  getLedgerId(): LedgerId {
    return this._getActiveWallet().getLedgerId()!;
  }

  /**
   * @returns AccountId of wallet of active account.
   */
  getAccountId(): AccountId {
    return this._getActiveWallet().getAccountId();
  }

  /**
   * @returns Promise that resolves to account balance of active account.
   */
  async getAccountBalance(): Promise<AccountBalance> {
    return this._getActiveWallet().getAccountBalance();
  }

  /**
   * @returns Promise that resolves to AccountInfo of the account currently active.
   */
  async getAccountInfo(): Promise<AccountInfo> {
    return this._getActiveWallet().getAccountInfo();
  }

  /**
   * @returns Promise that resolves to array of records of recent account transactions.
   */
  async getAccountRecords(): Promise<TransactionRecord[]> {
    return this._getActiveWallet().getAccountRecords();
  }
}
