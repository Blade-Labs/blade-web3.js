import {SessionParams} from "../models/blade";
import {BladeSigner, IConnector} from "../models/interfaces";

export abstract class BaseConnectorStrategy implements IConnector {
  public abstract initialized: boolean;

  protected abstract activeSigner: BladeSigner | null;
  protected abstract signers: BladeSigner[];

  public getSigner(): BladeSigner | null {
    return this.activeSigner;
  }

  public getSigners(): BladeSigner[] {
    return this.signers;
  }

  public abstract createSession(params?: SessionParams): Promise<string[]>;
  public abstract killSession(): Promise<void>;
  public abstract onWalletUnlocked(callback: () => void): void;
  public abstract onWalletLocked(callback: () => void): void;
  public abstract selectAccount(accountId?: string): Promise<BladeSigner>;
}
