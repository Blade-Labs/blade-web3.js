# v1.3.1
- Fix conflicting @hashgraph/sdk typings

# v1.3.0
- Native WalletConnect implementation is used instead of relying on Hedera WalletConnect

### Breaking changes:
- `getSigner()` was removed in favor of using `getSigners()`. There is no concept of an active signer anymore, and all signers are active simultaneously 

# v1.2.2
- Fix an issue, when session requests could be sent earlier, than the wallet received the session approval 

# v1.2.1
- Add ability to subscribe to session disconnect or session expiration

# v1.2.0
- Fix that allows to use `handshake` method with mobile devices.

# v1.1.0
- `BladeConnector` constructor is now private. `BladeConnector.init` async method should be used instead.

# v1.0.4
- `ConnectorStrategy.EXTENSION` will now throw an error, if the extension was not detected

# v1.0.0
- Reworked overall documentation
- General code and library design improvements

## Breaking changes
- `BladeSigner` was renamed to `BladeConnector`
- `ExtendedSigner` was renamed to `BladeSigner`
- Hedera-related methods were removed from the `BladeConnector`. Now `connector.getSigner()` should be used in order to perform those operations.
- Legacy extensions (v0.18.1 and earlier) are no longer supported
- `onAccountChanged` method was renamed to `onWalletUnlocked`
