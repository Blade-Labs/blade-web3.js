import WCProvider from "./WCProvider";
import type {Signer,} from '@hashgraph/sdk';
import {
  AccountBalance,
  AccountBalanceQuery,
  AccountId,
  AccountInfo,
  AccountInfoQuery,
  AccountRecordsQuery,
  Executable,
  Key,
  LedgerId,
  SignerSignature,
  Transaction,
  TransactionId,
  TransactionRecord
} from "@hashgraph/sdk";

/**
 * Implements Hedera Signer interface.
 * https://hips.hedera.com/hip/hip-338
 *
 * Proxies Extension wallet functions to decouple dApp code from
 * Blade's implementation of the wallet.
 */
export class BladeWCSigner implements Signer {
  private readonly accountId: AccountId;
  private readonly provider: WCProvider;

  constructor(accountId: AccountId, provider: WCProvider) {
    this.accountId = accountId;
    this.provider = provider;
  }

  getAccountId(): AccountId {
    return this.accountId;
  }

  getAccountKey(): Key {
    return new Key();
  }

  getLedgerId(): LedgerId | null {
    return this.provider == null ? null : this.provider.getLedgerId();
  }

  getNetwork(): {[key: string]: (string | AccountId)} {
    return this.provider == null ? {} : this.provider.getNetwork();
  }

  getMirrorNetwork(): string[] {
    return this.provider == null ? [] : this.provider.getMirrorNetwork();
  }

  sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
    return this.provider.sign(messages);
  }

  getAccountBalance(): Promise<AccountBalance> {
    return this.call(
      new AccountBalanceQuery().setAccountId(this.accountId)
    );
  }

  getAccountInfo(): Promise<AccountInfo> {
    return this.call(new AccountInfoQuery().setAccountId(this.accountId));
  }

  getAccountRecords(): Promise<TransactionRecord[]> {
    return this.call(
      new AccountRecordsQuery().setAccountId(this.accountId)
    );
  }

  async signTransaction<T extends Transaction>(transaction: T): Promise<T> {
    return this.provider.signTransaction<T>(transaction);
  }

  checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
    const transactionId = transaction.transactionId;
    if (
      transactionId != null &&
      transactionId.accountId != null &&
      transactionId.accountId.compare(this.accountId) !== 0
    ) {
      throw new Error(
        "transaction's ID constructed with a different account ID"
      );
    }

    if (this.provider == null) {
      return Promise.resolve(transaction);
    }

    const nodeAccountIds = (
      transaction.nodeAccountIds != null ? transaction.nodeAccountIds : []
    ).map((nodeAccountId) => nodeAccountId.toString());
    const network = Object.values(this.provider.getNetwork()).map(
      (nodeAccountId) => nodeAccountId.toString()
    );

    if (
      !nodeAccountIds.reduce(
        (previous, current) => previous && network.includes(current),
        true
      )
    ) {
      throw new Error(
        "Transaction already set node account IDs to values not within the current network"
      );
    }

    return Promise.resolve(transaction);
  }

  populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
    transaction.setTransactionId(TransactionId.generate(this.accountId));
    const network = Object.values(this.provider.getNetwork()).map(
      (nodeAccountId) =>
        typeof nodeAccountId === "string"
          ? AccountId.fromString(nodeAccountId)
          : new AccountId(nodeAccountId)
    );
    transaction.setNodeAccountIds(network);
    return Promise.resolve(transaction);
  }

  call<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
    if (this.provider == null) {
      throw new Error(
        "cannot send request with an wallet that doesn't contain a provider"
      );
    }

    return this.provider.call(request);
  }
}
