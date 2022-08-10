import {getRequiredNamespaces} from "./WCHederaUtils";
import WCProvider from "./WCProvider";
import {BladeWCSigner} from "./WCSigner";
import {AccountId, LedgerId} from "@hashgraph/sdk";
import Client from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import {PairingTypes, SessionTypes} from "@walletconnect/types";
import {getAppMetadata, getSdkError} from "@walletconnect/utils";

export class WCService {
  private isInitializing: boolean = false;
  private client: Client | null = null;
  private session: SessionTypes.Struct | null = null;
  private accounts: string[] = [];
  private ledgerId: LedgerId = LedgerId.MAINNET;
  private signer: BladeWCSigner | null = null;
  private pairings: PairingTypes.Struct[] = [];

  constructor() {
    this.init();
  }

  async init() {
    try {
      this.isInitializing = true;
      this.client = await Client.init({
        logger: "debug",
        relayUrl: "wss://relay.walletconnect.com",
        projectId: "3c398378706f57f538324834a69ba554",
        metadata: getAppMetadata() || {
          name: "Blade Web3 Lib",
          description: "Blade Wallet Wallet Connect",
          url: "https://bladewallet.io",
          icons: ["https://www.bladewallet.io/wp-content/uploads/2022/04/BladeWalletWhite.svg"],
        },
      });
      this.subscribeToEvents();
      await this.checkPersistedState();
    } finally {
      this.isInitializing = false;
    }
  }

  private subscribeToEvents() {
    if (!this.client) {
      throw new Error("WC is not initialized");
    }

    // this.client.on("session_ping", this.onSessionPing.bind(this));
    // this.client.on("session_event", this.onSessionEvent.bind(this));
    this.client.on("session_update", ({ topic, params }) => {
      const { namespaces } = params;
      const session = this.client!.session.get(topic);
      const updatedSession = { ...session, namespaces };
      this.onSessionConnected(updatedSession);
    });
    // this.client.on("session_delete", this.onSessionDelete.bind(this));
  }

  private async checkPersistedState() {
      if (!this.client) {
        throw new Error("WC is not initialized");
      }

      this.pairings = this.client.pairing.getAll({ active: true });

      if (this.session) {
        return;
      }

      if (this.client.session.length) {
        const lastKeyIndex = this.client.session.keys.length - 1;
        const session = this.client.session.get(this.client.session.keys[lastKeyIndex]);

        await this.onSessionConnected(session);
        return session;
      }
    }

  async connect(ledgerId: LedgerId = LedgerId.MAINNET, pairing?: PairingTypes.Struct) {
    if (!this.client) {
      throw new Error("WC is not initialized");
    }

    try {
      const { uri, approval } = await this.client.connect({
        pairingTopic: pairing?.topic,
        requiredNamespaces: getRequiredNamespaces(ledgerId),
      });

      if (uri) {
        QRCodeModal.open(uri, () => {/*TODO: Handle close of the modal*/});
      }

      const session = await approval();
      this.ledgerId = ledgerId;
      this.pairings = this.client.pairing.getAll({ active: true });
      await this.onSessionConnected(session);
    } finally {
      QRCodeModal.close();
    }
  }

  async disconnect() {
    if (!this.client) {
      throw new Error("WC is not initialized");
    }
    if (!this.session) {
      throw new Error("Session is not connected");
    }
    await this.client.disconnect({
      topic: this.session.topic,
      reason: getSdkError("USER_DISCONNECTED"),
    });
    this.reset();
  }

  private async onSessionConnected(session: SessionTypes.Struct) {
    const allNamespaceAccounts = Object.values(session.namespaces)
      .map(namespace => namespace.accounts.map(acc => acc.split(":")[2]))
      .flat();

    this.session = session;
    this.accounts = allNamespaceAccounts;
    this.useAccount(this.accounts[0]);
  }

  private useAccount(account: string) {
    const id = AccountId.fromString(account);
    const provider = new WCProvider(this.client!, this.ledgerId, this.session!);
    this.signer = new BladeWCSigner(id, provider);
  }

  private reset() {
    this.session = null;
    this.accounts = [];
    this.signer = null;
  }
}
