import {SessionParams} from "../models/blade";
import {getBladeExtension} from "../helpers/interface-helpers";
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
      this.signers = await this.walletConnectService.initWithExtension(params?.network);

      return this.signers.map(s => s.getAccountId().toString());
    }

    return [];
  }
}
