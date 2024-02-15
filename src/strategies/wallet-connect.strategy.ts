import {CoreTypes} from "@walletconnect/types";
import {filter, Subscription} from "rxjs";

import {
  SessionParams,
  WalletLockedEvent,
  WalletUnlockedEvent,
} from "../models/blade";
import {BladeSigner, WalletEvent} from "../models/interfaces";
import {BaseConnectorStrategy} from "../strategies/base-connector.strategy";
import {WalletConnectService} from "../wallet-connect/wallet-connect.service";

export class WalletConnectStrategy extends BaseConnectorStrategy {
  protected signers: BladeSigner[] = [];
  protected walletConnectService: WalletConnectService;

  private subscriptions: Subscription[] = [];

  constructor(meta?: CoreTypes.Metadata, projectId?: string) {
    super();
    this.walletConnectService = new WalletConnectService(meta, projectId);
  }

  public onWalletLocked(callback: () => void): void {
    const lockedSub = this.walletConnectService.$events
      .pipe(filter((e: WalletEvent) => e.name === WalletLockedEvent))
      .subscribe(callback);
    this.subscriptions.push(lockedSub);
  }

  public onWalletUnlocked(callback: () => void): void {
    const updatedSub = this.walletConnectService.$events
      .pipe(filter((e: WalletEvent) => e.name === WalletUnlockedEvent))
      .subscribe(callback);
    this.subscriptions.push(updatedSub);
  }

  public async createSession(params?: SessionParams): Promise<string[]> {
    this.signers = await this.walletConnectService.initWithModal(params?.network);

    return this.signers.map(s => s.getAccountId().toString());
  }

  public async killSession(): Promise<void> {
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];

    await this.walletConnectService.destroySession();
  }

  public get initialized(): boolean {
    return Boolean(this.walletConnectService.getClient());
  }
}
