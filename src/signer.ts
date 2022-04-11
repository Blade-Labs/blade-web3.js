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

import { BladeExtensionInterface } from './models/blade';
import { waitExtensionInterface } from './connector';
import { noExtensionError, noSessionError } from './errors';

export type MessageSigner = (message: Uint8Array) => Promise<Uint8Array>;

/**
 * Publicly exposed wallet interface.
 *
 * BladeSigner proxies Extension wallet functions to decouple dApp code from
 * Blade's actual implementation of the wallet.
 */
export class BladeSigner implements Signer {

  private _bladeInterface: BladeExtensionInterface | null = null;

  getNetwork() {
    return this._bladeInterface!.getActiveWallet()!.getNetwork();
  }

  getMirrorNetwork() {
    return this._bladeInterface!.getActiveWallet()!.getMirrorNetwork();
  }

  async createSession(): Promise<void> {
    this._bladeInterface = await waitExtensionInterface();
    await this._bladeInterface.createSession();
  }

  /**
   * Check no Extension and no Session error conditions.
   */
  private _getActiveWallet() {
    if (this._bladeInterface == null) {
      throw noExtensionError();
    }
    const wallet = this._bladeInterface.getActiveWallet();
    if (wallet == null) {
      throw noSessionError();
    }
    return wallet;
  }

  async sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
    return this._getActiveWallet().sign(messages);
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    return this._getActiveWallet().signTransaction(transaction);
  }

  async sendRequest<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
    return this._getActiveWallet().sendRequest(request);
  }

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

  getLedgerId(): LedgerId {
    return this._getActiveWallet().getLedgerId()!;
  }

  getAccountId(): AccountId {
    return this._getActiveWallet().getAccountId();
  }

  async getAccountBalance(): Promise<AccountBalance> {
    return this._getActiveWallet().getAccountBalance();
  }

  async getAccountInfo(): Promise<AccountInfo> {
    return this._getActiveWallet().getAccountInfo();
  }

  async getAccountRecords(): Promise<TransactionRecord[]> {
    return this._getActiveWallet().getAccountRecords();
  }

}
