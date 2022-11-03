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
import { defer, first, Observable, ObservableInput, repeat, takeWhile } from "rxjs";

import {
  BladeExtensionInterface,
  SessionParams,
  WalletLoadedEvent,
  WalletLockedEvent,
  WalletUpdatedEvent
} from "./models/blade";

import { noExtensionError, noSessionError } from "./models/errors";

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
  private _activeWallet: Signer | null = null;

  /** @hidden */
  private _pollInterface(): Observable<BladeExtensionInterface | undefined> {
    return defer<ObservableInput<BladeExtensionInterface | undefined>>(
      () => new Promise((resolve) =>
        resolve(window.bladeConnect)
      )
    ).pipe(
      repeat({ count: 50, delay: 200 }),
      takeWhile(value => !value, true),
      first(value => !!value, undefined)
    );
  }

  /** @hidden */
  private async _getBladeExtension(): Promise<BladeExtensionInterface> {
    const extensionInterface = window.bladeConnect;

    if (extensionInterface) {
      return extensionInterface;
    }

    return new Promise((resolve, reject) => {
      this._pollInterface().subscribe(extInterface => {
        if (!extInterface) {
          // use of method on BladeSigner before using createSession
          reject(noExtensionError());
          return;
        }

        resolve(extInterface);
      });
    });
  }

  constructor() {
    document.addEventListener(WalletLoadedEvent, async () => {
      this._activeWallet = (await this._getBladeExtension()).getActiveWallet();
    });

    document.addEventListener(WalletUpdatedEvent, async () => {
      this._onAccountChanged?.();
    });

    document.addEventListener(WalletLockedEvent, async () => {
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
    return this._activeWallet?.getNetwork() || {};
  }

  /**
   * @returns Array of Hedera mirror network nodes.
   */
  getMirrorNetwork() {
    return this._activeWallet?.getMirrorNetwork() || [];
  }

  /**
   * Create a new session with the Blade Wallet Extension.
   *
   * All calls will fail until the promise resolves.
   *
   * @returns Promise that resolves when a new session to the Blade Wallet
   * has succeeded.
   */
  async createSession(params?: SessionParams): Promise<void> {
    // store the blade extension here
    // the logic is that some methods on the Signer interface are sync
    this._activeWallet = await (await this._getBladeExtension()).createSession(params?.network, params?.dAppCode);
  }

  /**
   * Kills a session with the Blade Wallet Extension.
   */
  async killSession(): Promise<boolean> {
    return (await this._getBladeExtension()).killSession();
  }

  /**
   * @hidden
   */
  private async _getActiveWallet(): Promise<Signer> {
    const wallet = (await this._getBladeExtension()).getActiveWallet();
    this._activeWallet = wallet;

    if (wallet == null) {
      throw noSessionError();
    }

    return this._activeWallet!;
  }


  /**
   * @param messages Array of messages to sign.
   * @returns Promise that resolves to array of Signed messages.
   */
  async sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
    return (await this._getActiveWallet()).sign(messages);
  }

  /**
   * Sign a hedera transaction with Blade Wallet.
   * @param transaction A Hedera transaction.
   * @returns A promise that resolves to the transaction with the signature appended.
   */
  async signTransaction<T extends  Transaction>(transaction: T): Promise<T> {
    return (await this._getActiveWallet()).signTransaction(transaction);
  }

  async call<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
    return (await this._getActiveWallet()).call(request);
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
  async checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
    return (await this._getActiveWallet()).checkTransaction(transaction);
  }

  /**
   * Sets the transaction ID of the transaction to the current account ID of the signer.
   * @param transaction
   */
  async populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
    return (await this._getActiveWallet()).populateTransaction(transaction);
  }

  /**
   * @returns LedgerId of network currently being used by Blade Wallet.
   */
  getLedgerId(): LedgerId | null {
    return this._activeWallet?.getLedgerId() || null;
  }

  /**
   * @returns AccountId of wallet of active account.
   */
  getAccountId(): AccountId {
    if (!this._activeWallet) {
      throw noSessionError();
    }

    return this._activeWallet.getAccountId();
  }

  /**
   * @returns Promise that resolves to account balance of active account.
   */
  async getAccountBalance(): Promise<AccountBalance> {
    return (await this._getActiveWallet()).getAccountBalance();
  }

  /**
   * @returns Promise that resolves to AccountInfo of the account currently active.
   */
  async getAccountInfo(): Promise<AccountInfo> {
    return (await this._getActiveWallet()).getAccountInfo();
  }

  /**
   * @returns Promise that resolves to array of records of recent account transactions.
   */
  async getAccountRecords(): Promise<TransactionRecord[]> {
    return (await this._getActiveWallet()).getAccountRecords();
  }
}
