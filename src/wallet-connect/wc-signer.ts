import {
  Executable,
  LedgerId,
  AccountBalance,
  AccountId,
  AccountInfo,
  SignerSignature,
  TransactionRecord,
  Transaction,
  TransactionResponse,
  TransactionId,
  AccountBalanceQuery,
  AccountInfoQuery,
  AccountRecordsQuery, PublicKey
} from "@hashgraph/sdk";
import {catchError, defer, delay, filter, from, lastValueFrom, takeUntil, throwIfEmpty, timeout} from "rxjs";

import {BladeSigner, HandshakePayload, HandshakeResponse} from "../models/interfaces";
import {KeyPairSignOptions} from "../models/blade";
import {RequestParams, WalletConnectService} from "./wallet-connect.service";
import {
  argumentIsNotExecutable,
  invalidTransactionAccountId,
  invalidTransactionNodeAccountIds,
  walletIsClosedOrLocked
} from "../models/errors";

import {Buffer} from "buffer";

export class WCSigner implements BladeSigner {

  constructor(
    private readonly walletConnectService: WalletConnectService,
    private readonly accountId: AccountId,
    private readonly ledgerId: LedgerId
  ) {}

  public async call<RequestT, ResponseT, OutputT>(request: Executable<RequestT, ResponseT, OutputT>): Promise<OutputT> {
    const inEncodable = ("toBytes" in request && typeof request.toBytes === "function");

    if (!inEncodable) {
      throw argumentIsNotExecutable();
    }

    const isTransactionType = this.isTransaction(request);

    const params: any = {};

    if (!isTransactionType) {
      params.signerAccountId = `hedera:${this.ledgerId.toString()}:${this.accountId.toString()}`;
    }

    const field = isTransactionType ? "transactionList" : "query";
    params[field] = Buffer.from(request.toBytes()).toString("base64");

    const result = await this.sendRequest<any>({
      request: {
        method: isTransactionType ? "hedera_executeTransaction" : "hedera_signAndExecuteQuery",
        params
      }
    })

    if (result.error) {
      throw new Error(result.error);
    }

    if (isTransactionType) {
      return TransactionResponse.fromJSON(result) as unknown as OutputT;
    } else {
      const responseTypeName = request.constructor.name.replace(/Query$/, "").replace("_", "");
      const output = await import("@hashgraph/sdk").then((module: any) => module[responseTypeName]);
      const bytes = Buffer.from(result.response, "base64");
      return output.fromBytes(bytes);
    }
  }

  public async checkTransaction<T extends Transaction>(transaction: T): Promise<T> {
    const transactionId = transaction.transactionId;
    if (
      transactionId != null &&
      transactionId.accountId != null &&
      transactionId.accountId.compare(this.accountId) !== 0
    ) {
      throw invalidTransactionAccountId();
    }

    const nodeAccountIds = (
      transaction.nodeAccountIds != null ? transaction.nodeAccountIds : []
    ).map((nodeAccountId) => nodeAccountId.toString());
    const network = Object.values(await this.getNetwork()).map(
      (nodeAccountId) => (nodeAccountId as string).toString()
    );

    if (
      !nodeAccountIds.reduce(
        (previous, current) => previous && network.includes(current),
        true
      )
    ) {
      throw invalidTransactionNodeAccountIds();
    }

    return Promise.resolve(transaction);
  }

  public async getAccountBalance(): Promise<AccountBalance> {
    const query = new AccountBalanceQuery().setAccountId(this.accountId);

    return await this.call(query);
  }

  public getAccountId(): AccountId {
    return this.accountId;
  }

  public async getAccountInfo(): Promise<AccountInfo> {
    const query = new AccountInfoQuery().setAccountId(this.accountId);

    return await this.call(query);
  }

  public getAccountKey(): any {
    return this.sendRequest<string>({
      request: {
        method: "getAccountKey",
        params: {
          accountId: this.accountId.toString()
        }
      }
    }).then(key => PublicKey.fromString(key))
  }

  public async getAccountRecords(): Promise<TransactionRecord[]> {
    const query = new AccountRecordsQuery().setAccountId(this.accountId);

    return await this.call(query);
  }

  public getLedgerId(): LedgerId | null {
    return this.ledgerId;
  }

  public getMirrorNetwork(): any {
    return this.sendRequest<string[]>({
      request: {
        method: "getMirrorNetwork",
        params: {
          accountId: this.accountId.toString()
        }
      }
    });
  }

  public getNetwork(): any {
    return this.sendRequest<Record<string, string>>({
      request: {
        method: "getNetwork",
        params: {
          accountId: this.accountId.toString()
        }
      }
    });
  }

  public async populateTransaction<T extends Transaction>(transaction: T): Promise<T> {
    transaction.setTransactionId(TransactionId.generate(this.accountId));

    const network = Object.values(await this.getNetwork()).map(
      (nodeAccountId) =>
        typeof nodeAccountId === "string"
          ? AccountId.fromString(nodeAccountId)
          : new AccountId(nodeAccountId)
    );

    transaction.setNodeAccountIds(network);

    return transaction;
  }

  public async signTransaction<T extends Transaction>(transaction: T): Promise<T> {
    const result = await this.sendRequest<string>({
      request: {
        method: "signTransaction",
        params: {
          accountId: this.accountId.toString(),
          executable: Buffer.from(transaction.toBytes()).toString("base64")
        }
      }
    });

    return Transaction.fromBytes(Buffer.from(result, "base64")) as T;
  }

  public async handshake(serverSigningAccount: string, serverSignature: string, payload: HandshakePayload, signOptions?: KeyPairSignOptions): Promise<HandshakeResponse> {
    return await this.sendRequest({
      request: {
        method: "handshake",
        params: {
          accountId: this.accountId.toString(),
          args: [serverSigningAccount, serverSignature, payload, signOptions]
        }
      }
    });
  }

  public async sign(messages: Uint8Array[], signOptions?: KeyPairSignOptions): Promise<SignerSignature[]> {
    return await this.sendRequest({
      request: {
        method: "sign",
        params: {
          accountId: this.accountId.toString(),
          messages,
          signOptions
        }
      }
    });
  }

  private async sendRequest<T>(params: RequestParams): Promise<T> {
    const cancelWithPing$ = defer(() => this.walletConnectService.pingCurrentTopic())
      .pipe(
        delay(5000),
        timeout(10000),
        catchError(async () => true),
        filter(error => !!error)
      );

    return lastValueFrom<T>(
      from(this.walletConnectService.request<T>(params))
        .pipe(
          takeUntil(cancelWithPing$),
          throwIfEmpty(() => walletIsClosedOrLocked())
        )
    );
  }

  private isTransaction(obj: any): obj is Transaction {
    if (obj instanceof Transaction) {
      return true;
    } else if ("transactionId" in obj && "sign" in obj) {
      return true;
    }

    return false;
  };
}
