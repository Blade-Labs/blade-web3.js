import { WCService } from "./WCService";
import { LedgerId, Signer } from "@hashgraph/sdk";
import { SignClientTypes } from "@walletconnect/types";

export class BladeConnector {
  private readonly WCService: WCService;

  constructor(metadata?: SignClientTypes.Metadata) {
    this.WCService = new WCService(metadata);
  }

  async createSession(forTestnet: boolean = false) {
    if (!this.WCService.initialized) {
      await this.WCService.init();
    }
    const ledgerId: LedgerId = forTestnet ? LedgerId.TESTNET : LedgerId.MAINNET;
    await this.WCService.connect(ledgerId);
  }

  async killSession() {
    await this.WCService.disconnect();
  }

  getSessionAccount(): string[] {
    return this.WCService.accounts;
  }

  setActiveAccount(accountId: string) {
    if (this.WCService.accounts.includes(accountId)) {
      this.WCService.useAccount(accountId);
    }
  }

  getSigner(): Signer {
    return this.WCService.signer as Signer;
  }
}
