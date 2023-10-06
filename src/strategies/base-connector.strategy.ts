import {SessionParams} from "../models/blade";
import {BladeSigner, IConnector} from "../models/interfaces";
import {SessionTypes} from "@walletconnect/types";
import {DAppConnector} from "@hashgraph/hedera-wallet-connect";

export abstract class BaseConnectorStrategy implements IConnector {
  public abstract initialized: boolean;

  protected abstract activeSigner: BladeSigner | null;
  protected abstract signers: BladeSigner[];
  protected abstract dAppConnector: DAppConnector;

  public getSigner(): BladeSigner | null {
    return this.activeSigner;
  }

  public getSigners(): BladeSigner[] {
    return this.signers;
  }

  public async onSessionChange(session: SessionTypes.Struct): Promise<void> {
    await this.dAppConnector.onSessionConnected(session);
    this.signers = this.dAppConnector.getSigners();
    this.activeSigner = this.signers[0] || null;
    await this.selectAccount();
  }

  public abstract createSession(params?: SessionParams): Promise<string[]>;
  public abstract killSession(): Promise<void>;
  public abstract onWalletUnlocked(callback: () => void): void;
  public abstract onWalletLocked(callback: () => void): void;
  public abstract selectAccount(accountId?: string): Promise<BladeSigner>;
}
