import {DAppConnector, DAppMetadata} from "@hashgraph/hedera-wallet-connect";
import {filter, Subscription} from "rxjs";
import {LedgerId} from "@hashgraph/sdk";

import {
  HederaNetwork,
  SessionParams,
  WalletLockedEvent,
  WalletUnlockedEvent,
} from "../models/blade";
import {noSessionError} from "../models/errors";
import {BladeSigner, WalletEvent} from "../models/interfaces";
import {getAccountIDsFromSigners} from "../helpers/utils";
import {BaseConnectorStrategy} from "../strategies/base-connector.strategy";

export class WalletConnectStrategy extends BaseConnectorStrategy {
  protected activeSigner: BladeSigner | null = null;
  protected signers: BladeSigner[] = [];
  protected dAppConnector: DAppConnector;

  private subscriptions: Subscription[] = [];

  constructor(meta?: DAppMetadata) {
    super();
    this.dAppConnector = new DAppConnector(meta);
    this.dAppConnector.init([WalletUnlockedEvent, WalletLockedEvent], ["handshake"]);
  }

  public onWalletLocked(callback: () => void): void {
    const lockedSub = this.dAppConnector.$events
      .pipe(filter((e: WalletEvent) => e.name === WalletLockedEvent))
      .subscribe(callback);
    this.subscriptions.push(lockedSub);
  }

  public onWalletUnlocked(callback: () => void): void {
    const updatedSub = this.dAppConnector.$events
      .pipe(filter((e: WalletEvent) => e.name === WalletUnlockedEvent))
      .subscribe(callback);
    this.subscriptions.push(updatedSub);
  }

  public async createSession(params?: SessionParams): Promise<string[]> {
    try {
      const networkName = (params?.network || HederaNetwork.Mainnet).toLowerCase();
      await this.dAppConnector.connect(LedgerId.fromString(networkName));
      this.signers = this.dAppConnector.getSigners();
      this.activeSigner = this.signers[0] || null;

      return getAccountIDsFromSigners(this.signers);
    } catch (e) {
      throw e;
    }
  }

  public async killSession(): Promise<void> {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    return this.dAppConnector.disconnect();
  }

  public async selectAccount(accountId?: string): Promise<BladeSigner> {
    const account = this.signers.find(s => s.getAccountId().toString() === accountId);

    if (!this.activeSigner || !account && accountId) {
      throw noSessionError();
    }

    this.activeSigner = account || this.activeSigner;

    return this.activeSigner!;
  }

  public get initialized(): boolean {
    return Boolean(this.dAppConnector?.initialized);
  }
}
