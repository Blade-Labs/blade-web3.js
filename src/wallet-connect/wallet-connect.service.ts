import {AccountId, LedgerId} from "@hashgraph/sdk";
import SignClient from "@walletconnect/sign-client";
import {getSdkError} from "@walletconnect/utils";
import type {SignClientTypes, SessionTypes, EngineTypes} from "@walletconnect/types";
import {WalletConnectModal} from "@walletconnect/modal";
import {catchError, from, Subject, timeout} from "rxjs";

import {pairingRejected, walletConnectIsNotInitialized} from "../models/errors";
import {HederaNetwork, WalletLockedEvent, WalletUnlockedEvent} from "../models/blade";
import {getBladeExtension} from "../helpers/interface-helpers";
import {WCSigner} from "./wc-signer";
import {WalletEvent} from "../models/interfaces";

export type RequestParams = Omit<EngineTypes.RequestParams, "topic" | "chainId">;

export class WalletConnectService {
  public $events = new Subject<WalletEvent>();

  private client: SignClient | null = null;
  private currentTopic: string | null = null;
  private currentChainId: string | null = null;
  private modal?: WalletConnectModal;
  private initialized = false;

  constructor(
    private readonly dAppMetadata?: SignClientTypes.Metadata,
    private readonly projectId = "ce06497abf4102004138a10edd29c921"
  ) {
    this.initClient();
  }

  public async initWithExtension(network?: HederaNetwork): Promise<WCSigner[]> {
    let session = await this.getPersistedSession();

    if (!session) {
      const { uri, approval } = await this.prepareConnection(network);
      const extension = await getBladeExtension();
      await extension!.pairWC!(uri!);
      session = await approval();
    }

    this.currentTopic = session.topic;
    this.currentChainId = session.requiredNamespaces.hedera.chains![0];

    return await this.prepareSigners(session);
  }

  public async initWithModal(network?: HederaNetwork): Promise<WCSigner[]> {
    let session = await this.getPersistedSession();

    if (!session) {
      const {uri, approval} = await this.prepareConnection(network);

      this.modal = new WalletConnectModal({
        projectId: this.projectId
      });

      let modalStateCallback: (state: {open: boolean}) => void;

      this.modal.subscribeModal((state) => {
        modalStateCallback?.(state);
      });

      await this.modal.openModal({uri});

      const closePromise: Promise<never> =  new Promise((resolve, reject) => {
        modalStateCallback = ({open}) => {
          if (!open) {
            reject(pairingRejected());
          }
        };
      });

      session = await Promise.race([approval(), closePromise]);
    }

    this.currentTopic = session.topic;
    this.currentChainId = session.requiredNamespaces.hedera.chains![0];

    return await this.prepareSigners(session);
  }

  public getClient(): SignClient | null {
    return this.client;
  }

  public async request<T>(params: RequestParams): Promise<T> {
    if (!this.initialized) {
      throw walletConnectIsNotInitialized();
    }

    const p = Object.assign({}, params, {
      topic: this.currentTopic!,
      chainId: this.currentChainId!
    });

    return await this.client!.request<T>(p);
  }

  public async pingCurrentTopic(): Promise<void> {
    if (!this.initialized) {
      throw walletConnectIsNotInitialized();
    }

    await this.client!.ping({topic: this.currentTopic!});
  }

  public async destroySession(): Promise<void> {
    if (!this.initialized) {
      throw walletConnectIsNotInitialized();
    }

    await this.client!.disconnect({
      topic: this.currentTopic!,
      reason: getSdkError("USER_DISCONNECTED")
    });

    this.currentTopic = null;
    this.currentChainId = null;
  }

  private async initClient(): Promise<void> {
    this.client = await SignClient.init({
      relayUrl: "wss://relay.walletconnect.com",
      projectId: this.projectId,
      metadata: this.dAppMetadata
    });

    this.client.on("session_event", ({topic, params}) => {
      if (topic === this.currentTopic) {
        this.$events.next(params.event);
      }
    });

    this.initialized = true;
  }

  private async prepareConnection(network?: HederaNetwork): Promise<{
    uri?: string;
    approval: () => Promise<SessionTypes.Struct>;
  }> {
    const networkName = (network || HederaNetwork.Mainnet).toLowerCase();

    return await this.client!.connect({
      requiredNamespaces: {
        "hedera": {
          chains: [`hedera:${networkName}`],
          methods: [
            "hedera_executeTransaction",
            "hedera_signAndExecuteQuery",
            "getNetwork",
            "getMirrorNetwork",
            "getAccountKey",
            "handshake",
            "sign",
            "signTransaction"
          ],
          events: [WalletUnlockedEvent, WalletLockedEvent]
        }
      }
    });
  }

  private async prepareSigners(session: SessionTypes.Struct): Promise<WCSigner[]> {
    return session.namespaces.hedera.accounts.map(a => {
      const [, chainId, accountId] = a.split(":");

      return new WCSigner(this, AccountId.fromString(accountId), LedgerId.fromString(chainId));
    });
  }

  private async getPersistedSession(): Promise<SessionTypes.Struct | null> {
    if (!this.initialized) {
      throw walletConnectIsNotInitialized();
    }

    if (this.client!.session.length) {
      const sessionCheckPromises: Promise<SessionTypes.Struct>[] = this.client!.session
        .getAll()
        .map((session: SessionTypes.Struct) => {
          if (session.expiry * 1000 <= Date.now()) {
            try {
              this.client!.disconnect({
                topic: session.topic,
                reason: { code: 0, message: "Session expired" }
              });
            } catch (e) {
              // tslint:disable-next-line
              console.log("Non existing session with topic:", session.topic)
            }

            return Promise.reject("Session expired");
          }

          return new Promise((resolve, reject) =>
            from(this.client!.ping({ topic: session.topic }))
              .pipe(
                timeout(3000),
                catchError(async () => {
                  try {
                    await this.client!.disconnect({
                      topic: session.topic,
                      reason: { code: 0, message: "Ping was unsuccessful" }
                    });
                  } catch (e) {
                    // tslint:disable-next-line
                    console.log("Non existing session with topic:", session.topic)
                  }

                  reject("Non existing session");
                })
              )
              .subscribe(() => resolve(session))
          );
        });

      return await Promise.any(sessionCheckPromises).catch(() => null);
    }

    return null;
  }
}
