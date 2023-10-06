import {DAppConnector, DAppMetadata} from "@hashgraph/hedera-wallet-connect";
import {filter, Subscription} from "rxjs";
import {LedgerId} from "@hashgraph/sdk";
import {WalletConnectModal} from "@walletconnect/modal";

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
import {pairingRejected} from "../models/errors";
import {SessionTypes} from "@walletconnect/types";

export class WalletConnectStrategy extends BaseConnectorStrategy {
  protected activeSigner: BladeSigner | null = null;
  protected signers: BladeSigner[] = [];
  protected dAppConnector: DAppConnector;

  private subscriptions: Subscription[] = [];
  private modal: WalletConnectModal;
  private modalStateCallback?: (state: {open: boolean}) => void;

  constructor(meta?: DAppMetadata, projectId?: string) {
    super();
    this.modal = new WalletConnectModal({
      projectId: projectId ?? "0301c380a9a2a23af77ce32611c158e0"
    });
    this.modal.subscribeModal((state) => {
      this.modalStateCallback?.(state);
    });
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
      const data = await this.dAppConnector.prepareConnectURI(LedgerId.fromString(networkName));
      let closePromise;
      if (data) {
        if (data.uri) {
          await this.modal.openModal({uri: data.uri});
          closePromise =  new Promise((reject) => {
            this.modalStateCallback = ({open}) => {
              if (!open) {
                reject(pairingRejected());
              }
            };
          });
        }

        // @ts-ignore
        const session: SessionTypes.Struct = await Promise.race([data.approval(), closePromise])
        this.modalStateCallback = undefined;
        await this.onSessionChange(session);
        return getAccountIDsFromSigners(this.signers);
      } else {
        const existingSession = await this.dAppConnector.checkPersistedState();
        if (existingSession) {
          await this.onSessionChange(existingSession);
          return getAccountIDsFromSigners(this.signers);
        }

        return [];
      }
    } catch (e) {
      throw e;
    } finally {
      this.modalStateCallback = undefined;
      this.modal.closeModal();
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
