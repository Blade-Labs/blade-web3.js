import {WCConnector} from "./WCConnector";
import {HederaNetwork, SessionParams} from "./models/blade";
import {LedgerId} from "@hashgraph/sdk";
import {getBladeExtension} from "./helpers/interfaceHelpers";
import {getAccountIDsFromSigners} from "./helpers/utils";
import {DAppMetadata} from "@bladelabs/hedera-wallet-connect";
import {SessionTypes} from "@walletconnect/types";

export class ExtensionConnector extends WCConnector {
    constructor(meta?: DAppMetadata) {
        super(meta);
    }
    async createSession(params?: SessionParams): Promise<string[]> {
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

    private async onSessionChange(session: SessionTypes.Struct) {
        await this.dAppConnector.onSessionConnected(session);
        this.signers = this.dAppConnector.getSigners();
        this.activeSigner = this.signers[0] || null;
        await this.selectAccount();
    }
}
