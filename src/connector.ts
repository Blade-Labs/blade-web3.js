import {DAppMetadata} from "@hashgraph/hedera-wallet-connect";

import {BladeExtensionInterface, SessionParams} from "./models/blade";
import {BladeSigner, ConnectorStrategy, IConnector} from "./models/interfaces";
import {getBladeExtension, waitForConnector} from "./helpers/interface-helpers";
import {WalletConnectStrategy} from "./strategies/wallet-connect.strategy";
import {ExtensionStrategy} from "./strategies/extension.strategy";
import {BaseConnectorStrategy} from "./strategies/base-connector.strategy";

export class BladeConnector implements IConnector {
    private strategy!: BaseConnectorStrategy;
    private isInitialized = async () => this.strategy?.initialized;

    constructor(preferredStrategy?: ConnectorStrategy, meta?: DAppMetadata) {
        this.init(preferredStrategy, meta);
    }

    /**
     * Returns currently active signer.
     */
    public getSigner(): BladeSigner | null {
        if (!this.initialized) {
            return null;
        }

        return this.strategy.getSigner();
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
     * Makes an account with given {@link accountId} active.
     * All the subsequent operations will be performed with it.
     *
     * @param {string} accountId Account ID to use
     */
    public async selectAccount(accountId: string): Promise<BladeSigner> {
        await waitForConnector(this.isInitialized);
        return this.strategy.selectAccount(accountId);
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
        await waitForConnector(this.isInitialized);
        return this.strategy.killSession();
    }

    /**
     * Checks if the underlying strategy is initialized.
     */
    public get initialized(): boolean {
        return !!this.strategy?.initialized;
    }

    /**
     * Initializes the underlying strategy with {@link preferredStrategy} if passed.
     * Tries {@link ExtensionStrategy} otherwise.
     * If there is no extension installed, {@link WalletConnectStrategy} will be used as a fallback.
     *
     * @param {ConnectorStrategy?} preferredStrategy preferred strategy to use
     * @param {DAppMetadata?} meta dApp metadata to pass to Wallet Connect
     * @private
     */
    private async init(preferredStrategy?: ConnectorStrategy, meta?: DAppMetadata): Promise<void> {
        if (preferredStrategy === ConnectorStrategy.WALLET_CONNECT) {
            this.strategy = new WalletConnectStrategy(meta);
            return;
        }

        let extensionInterface: BladeExtensionInterface | undefined;

        try {
            extensionInterface = await getBladeExtension();
        } catch (e) {
            this.strategy = new WalletConnectStrategy(meta);
            return;
        }

        if (preferredStrategy === ConnectorStrategy.EXTENSION && typeof extensionInterface?.pairWC === "function") {
            this.strategy = new ExtensionStrategy(meta);
        }

        if (!this.strategy) {
            this.strategy = new WalletConnectStrategy(meta);
        }
    }
}
