import {LedgerId} from "@hashgraph/sdk";
import {SessionTypes} from "@walletconnect/types";
import {HederaNetwork, SessionParams} from "../models/blade";
import {getBladeExtension} from "../helpers/interface-helpers";
import {getAccountIDsFromSigners} from "../helpers/utils";
import {WalletConnectStrategy} from "../strategies/wallet-connect.strategy";

export class ExtensionStrategy extends WalletConnectStrategy {

  public async wakeExtension(): Promise<boolean> {
    const extensionInterface = await getBladeExtension();
    if (extensionInterface && typeof extensionInterface.wake === "function") {
      return await extensionInterface.wake();
    }
    return true;
  }

  public async createSession(params?: SessionParams): Promise<string[]> {
    const extension = await getBladeExtension();

    if (extension) {
      const networkName = (params?.network || HederaNetwork.Mainnet).toLowerCase();
      const data = await this.dAppConnector.prepareConnectURI(LedgerId.fromString(networkName));

      if (data) {
        await extension.pairWC!(data.uri!);
        const session = await data.approval();
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
    }

    return [];
  }

  private async onSessionChange(session: SessionTypes.Struct): Promise<void> {
    await this.dAppConnector.onSessionConnected(session);
    this.signers = this.dAppConnector.getSigners();
    this.activeSigner = this.signers[0] || null;
    await this.selectAccount();
  }
}
