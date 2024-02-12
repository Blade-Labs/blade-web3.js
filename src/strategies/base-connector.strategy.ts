import {SessionParams} from "../models/blade";
import {BladeSigner, IConnector} from "../models/interfaces";
import {WalletConnectService} from "../wallet-connect/wallet-connect.service";

export abstract class BaseConnectorStrategy implements IConnector {
  public abstract initialized: boolean;

  protected abstract signers: BladeSigner[];
  protected abstract walletConnectService: WalletConnectService;

  public getSigners(): BladeSigner[] {
    return this.signers;
  }

  public onSessionDisconnect(callback: () => void): void {
    this.walletConnectService.getClient()?.on("session_delete", callback);
  }

  public onSessionExpire(callback: () => void): void {
    this.walletConnectService.getClient()?.on("session_expire", callback);
  }

  public abstract createSession(params?: SessionParams): Promise<string[]>;
  public abstract killSession(): Promise<void>;
  public abstract onWalletUnlocked(callback: () => void): void;
  public abstract onWalletLocked(callback: () => void): void;
}
