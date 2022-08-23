import { catchError, from, timeout } from "rxjs";
import { getRequiredNamespaces } from "./WCHederaUtils";
import WCProvider from "./WCProvider";
import { BladeWCSigner } from "./WCSigner";
import { AccountId, LedgerId } from "@hashgraph/sdk";
import Client from "@walletconnect/sign-client";
import QRCodeModal from "@walletconnect/qrcode-modal";
import { PairingTypes, SessionTypes, SignClientTypes } from "@walletconnect/types";
import { getAppMetadata, getSdkError } from "@walletconnect/utils";

export class WCService {
  private readonly dAppMetadata: SignClientTypes.Metadata;
  private isInitializing: boolean = false;
  private client: Client | null = null;
  private session: SessionTypes.Struct | null = null;
  private ledgerId: LedgerId = LedgerId.MAINNET;
  accounts: string[] = [];
  signer: BladeWCSigner | null = null;
  private pairings: PairingTypes.Struct[] = [];

  constructor(metadata?: SignClientTypes.Metadata) {
    this.dAppMetadata = metadata || getAppMetadata();
  }

  async init() {
    try {
      this.isInitializing = true;
      this.client = await Client.init({
        relayUrl: "wss://relay.walletconnect.com",
        projectId: "ce06497abf4102004138a10edd29c921",
        metadata: this.dAppMetadata
      });
      this.subscribeToEvents();
      this.checkPersistedState();
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
      const sessionCheckPromises: Promise<SessionTypes.Struct | null>[] = this.client.session
        .getAll()
        .map((session: SessionTypes.Struct) => {
          return new Promise((resolve) =>
            from(this.client!.ping({ topic: session.topic }))
              .pipe(
                timeout(3000),
                catchError(async (err) => {
                  // tslint:disable-next-line:no-console
                  console.log("Disconnect", session.topic);
                  await this.client!.disconnect({
                    topic: session.topic,
                    reason: { code: 0, message: "Ping was unsuccessful" }
                  });
                  resolve(null);
                })
              ).subscribe(() => {
              resolve(session);
            })
          );
        });
      const sessionCheckResults: (SessionTypes.Struct | null)[] = await Promise.all(sessionCheckPromises);

      const selectedSession: SessionTypes.Struct | null = sessionCheckResults
        .find((s: SessionTypes.Struct | null) => !!s) || null;

      if (!selectedSession) {
        return;
      }

      await this.onSessionConnected(selectedSession);
      return selectedSession;
    }
  }

  async connect(ledgerId: LedgerId = LedgerId.MAINNET, pairing?: PairingTypes.Struct) {
    if (!this.client) {
      throw new Error("WC is not initialized");
    }

    try {
      const { uri, approval } = await this.client.connect({
        pairingTopic: pairing?.topic,
        requiredNamespaces: getRequiredNamespaces(ledgerId)
      });

      if (uri) {
        QRCodeModal.open(uri, () => {/*TODO: Handle close of the modal*/
        });
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
      reason: getSdkError("USER_DISCONNECTED")
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

  useAccount(account: string) {
    const id = AccountId.fromString(account);
    const provider = new WCProvider(this.client!, this.ledgerId, id, this.session!);
    this.signer = new BladeWCSigner(id, provider);
  }

  private reset() {
    this.session = null;
    this.accounts = [];
    this.signer = null;
  }

  get initialized(): boolean {
    return !!this.client;
  }
}
