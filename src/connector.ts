import {CoreTypes} from "@walletconnect/types";

import {BladeExtensionInterface, SessionParams} from "./models/blade";
import {BladeSigner, ConnectorStrategy, IConnector} from "./models/interfaces";
import {getBladeExtension, waitForConnector} from "./helpers/interface-helpers";
import {WalletConnectStrategy} from "./strategies/wallet-connect.strategy";
import {ExtensionStrategy} from "./strategies/extension.strategy";
import {BaseConnectorStrategy} from "./strategies/base-connector.strategy";

export class BladeConnector implements IConnector {
    private isInitialized = async (skipWake?: boolean) => {
        if (this.strategy instanceof ExtensionStrategy) {
            const awaken = skipWake ? true : await this.strategy.wakeExtension();
            return awaken && this.strategy.initialized;
        }
        return this.strategy?.initialized;
    };

    private constructor(private readonly strategy: BaseConnectorStrategy) {}

    /**
     * Initializes connector with the underlying strategy with a given {@link preferredStrategy}.
     *
     * @param {ConnectorStrategy} preferredStrategy preferred strategy to use
     * @param {CoreTypes.Metadata?} meta dApp metadata to pass to Wallet Connect
     * @param {string?} projectId dApp WC project ID, default one is a Blade Wallet project ID
     * @private
     */
    public static async init(
      preferredStrategy: ConnectorStrategy,
      meta?: CoreTypes.Metadata,
      projectId?: string
    ): Promise<BladeConnector> {
        if (preferredStrategy === ConnectorStrategy.WALLET_CONNECT) {
            return new BladeConnector(new WalletConnectStrategy(meta, projectId));
        }

        let extensionInterface: BladeExtensionInterface | undefined;

        try {
            extensionInterface = await getBladeExtension();
        } catch (e) {
            if (preferredStrategy === ConnectorStrategy.EXTENSION) {
                throw e;
            }
        }

        if (typeof extensionInterface?.pairWC === "function") { // if AUTO or EXTENSION strategy
            return new BladeConnector(new ExtensionStrategy(meta, projectId));
        }

        return new BladeConnector(new WalletConnectStrategy(meta, projectId));
    }

    /**
     * Returns all the signers approved for the current session.
     */
    public getSigners(): BladeSigner[] {
        if (!this.initialized) {
            return [];
        }

        return this.strategy.getSigners();
    }

    /**
     * Executes a given {@link callback} when the wallet is unlocked.
     *
     * @param {function} callback  Callback to execute
     */
    public async onWalletUnlocked(callback: () => void): Promise<void> {
        await waitForConnector(this.isInitialized);
        this.strategy.onWalletUnlocked(callback);
    }

    /**
     * Executes a given {@link callback} when the wallet is locked.
     *
     * @param {function} callback  Callback to execute
     */
    public async onWalletLocked(callback: () => void): Promise<void> {
        await waitForConnector(this.isInitialized);
        this.strategy.onWalletLocked(callback);
    }

    /**
     * Executes a given {@link callback} when the session has been disconnected.
     *
     * @param {function} callback  Callback to execute
     */
    public onSessionDisconnect(callback: () => void): void {
        this.strategy.onSessionDisconnect(callback);
    }

    /**
     * Executes a given {@link callback} when the session has expired.
     *
     * @param {function} callback  Callback to execute
     */
    public onSessionExpire(callback: () => void): void {
        this.strategy.onSessionExpire(callback);
    }

    /**
     * Triggers the process of pairing with the Blade Wallet.
     * If there is the Blade Wallet extension, wallet user will be asked to select accounts to pair.
     * If there is no extension, QR code modal will be shown.
     *
     * @param {SessionParams} params Params to create a session with. Optional for testing
     */
    public async createSession(params?: SessionParams): Promise<string[]> {
        await waitForConnector(this.isInitialized);
        return this.strategy.createSession(params);
    }

    /**
     * Closes an active session and removes all the event subscriptions.
     */
    public async killSession(): Promise<void> {
        await waitForConnector(this.isInitialized.bind(this, true));
        return this.strategy.killSession();
    }

    /**
     * Checks if the underlying strategy is initialized.
     */
    public get initialized(): boolean {
        return !!this.strategy?.initialized;
    }
}
