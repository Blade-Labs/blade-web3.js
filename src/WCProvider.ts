import { SessionTypes } from "@walletconnect/types";
import { getChainByLedgerId, isEncodable, isTransaction } from "./WCHederaUtils";
import {
  AccountBalance,
  AccountId,
  AccountInfo,
  Executable,
  LedgerId,
  Provider, SignerSignature, Transaction, TransactionId, TransactionReceipt, TransactionReceiptQuery,
  TransactionRecord,
  Client as HederaClient,
  TransactionResponse
} from "@hashgraph/sdk";
import Client from "@walletconnect/sign-client";
import { Buffer } from "buffer";

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
    const isTransactionType = isTransaction(request);
    const result = await this.client.request<any>({
      topic: this.topic,
      request: {
        method: "call",
        params: {
          accountId: this.accountId.toString(),
          executable: Buffer.from(request.toBytes()).toString("base64"),
          isTransaction: isTransactionType
        }
      },
      chainId: getChainByLedgerId(this.ledgerId)
    })

    if (result.error) {
      throw new Error(result.error);
    }

    if (!isTransactionType) {
      const responseTypeName = request.constructor.name.replace(/Query$/, "");
      const output = await import("@hashgraph/sdk").then((module: any) => module[responseTypeName]);
      const bytes = Buffer.from(result, "base64");
      return output.fromBytes(bytes);
    } else {
      return TransactionResponse.fromJSON(result) as unknown as OutputT;
    }
  }

  async signTransaction<T extends Transaction>(transaction: T) {
    const encodedTransaction = await this.client.request<string>({
      topic: this.topic,
      request: {
        method: "signTransaction",
        params: {
          accountId: this.accountId.toString(),
          executable: Buffer.from(transaction.toBytes()).toString("base64")
        }
      },
      chainId: getChainByLedgerId(this.ledgerId)
    });

    return Transaction.fromBytes(Buffer.from(encodedTransaction, "base64")) as T;
  }

  async sign(messages: Uint8Array[]): Promise<SignerSignature[]> {
    const result = await this.client.request<SignerSignature[]>({
      topic: this.topic,
      request: {
        method: "sign",
        params: {
          accountId: this.accountId.toString(),
          messages: messages.map(message => Buffer.from(message).toString("base64"))
        }
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
    // return MIRROR_NODES[this.ledgerId.toString()];
    const client = HederaClient.forName(this.ledgerId.toString());
    return client.mirrorNetwork;
  }

  async getTransactionReceipt(transactionId: TransactionId | string): Promise<TransactionReceipt> {
    const receiptQuery = new TransactionReceiptQuery().setTransactionId(transactionId);
    return this.call(receiptQuery);
  }

  getAccountBalance(): Promise<AccountBalance> {
    return this.client.request<AccountBalance>({
      topic: this.topic,
      request: {
        method: "getAccountBalance",
        params: {
          accountId: this.accountId.toString()
        }
      },
      chainId: getChainByLedgerId(this.ledgerId)
    });
  }

  getAccountInfo(): Promise<AccountInfo> {
    return this.client.request<AccountInfo>({
      topic: this.topic,
      request: {
        method: "getAccountInfo",
        params: {
          accountId: this.accountId.toString()
        }
      },
      chainId: getChainByLedgerId(this.ledgerId)
    });
  }

  getNetwork(): { [p: string]: string | AccountId } {
    const client = HederaClient.forName(this.ledgerId.toString());
    return client.network;
  }

  waitForReceipt(response: TransactionResponse): Promise<TransactionReceipt> {
    const receiptQuery = response.getReceiptQuery();
    return this.call(receiptQuery);
  }
}
