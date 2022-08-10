import { SessionTypes } from "@walletconnect/types";
import { getChainByLedgerId, isEncodable, isTransaction, MIRROR_NODES } from "./WCHederaUtils";
import {
  AccountBalance, AccountBalanceQuery,
  AccountId,
  AccountInfo, AccountInfoQuery,
  Executable,
  LedgerId,
  Provider, SignerSignature, Transaction, TransactionId, TransactionReceipt, TransactionReceiptQuery,
  TransactionRecord
} from "@hashgraph/sdk";
import Client from "@walletconnect/sign-client";
import { Buffer } from "buffer";
export type TransactionResponse = import("@hashgraph/sdk/lib/transaction/TransactionResponse.js").default;

export default class WCProvider implements Provider {
  private readonly client: Client;
  private readonly topic: string;
  private readonly ledgerId: LedgerId;
  private readonly accountId: AccountId | string;

  constructor(client: Client, ledgerId: LedgerId, accountId: AccountId | string, session: SessionTypes.Struct) {
    this.client = client;
    this.topic = session.topic;
    this.ledgerId = ledgerId;
    this.accountId = accountId;
  }

  async call<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
    if (!isEncodable(request)) {
      throw new Error("Argument is not executable");
    }
    const result = await this.client.request<OutputT>({
      topic: this.topic,
      request: {
        method: "call",
        params: {
          accountId: this.accountId,
          chainId: this.ledgerId,
          executable: Buffer.from(request.toBytes()).toString("hex"),
          isTransaction: isTransaction(request)
        }
      },
      chainId: getChainByLedgerId(this.ledgerId)
    })
    return Promise.resolve(result);
  }

  async signTransaction<T extends Transaction>(transaction: T) {
    const result = await this.client.request<T>({
      topic: this.topic,
      request: {
        method: "signTransaction",
        params: Buffer.from(transaction.toBytes()).toString("hex")
      },
      chainId: getChainByLedgerId(this.ledgerId)
    })
    return Promise.resolve(result);
  }

  async sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
    const result = await this.client.request<SignerSignature[]>({
      topic: this.topic,
      request: {
        method: "sign",
        params: messages.toString()
      },
      chainId: getChainByLedgerId(this.ledgerId)
    })
    return Promise.resolve(result);
  }

  getAccountRecords(accountId: AccountId | string): Promise<TransactionRecord[]> {
    return Promise.resolve([]);
  }

  getLedgerId(): LedgerId | null {
    return this.ledgerId;
  }

  getMirrorNetwork(): string[] {
    return MIRROR_NODES[this.ledgerId.toString()];
  }

  getTransactionReceipt(transactionId: TransactionId | string): Promise<TransactionReceipt> {
    const receiptQuery = new TransactionReceiptQuery().setTransactionId(transactionId);
    return this.call(receiptQuery);
  }

  getAccountBalance(accountId: AccountId | string): Promise<AccountBalance> {
    const query = new AccountBalanceQuery().setAccountId(accountId);
    return this.call(query);
  }

  getAccountInfo(accountId: AccountId | string): Promise<AccountInfo> {
    const query = new AccountInfoQuery().setAccountId(accountId);
    return this.call(query);
  }

  getNetwork(): { [p: string]: string | AccountId } {
    return {};
  }

  waitForReceipt(response: TransactionResponse): Promise<TransactionReceipt> {
    const receiptQuery = response.getReceiptQuery();
    return this.call(receiptQuery);
  }
}
