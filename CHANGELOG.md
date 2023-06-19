# v1.0.0
- Reworked overall documentation
- General code and library design improvements

## Breaking changes
- `BladeSigner` was renamed to `BladeConnector`
- `ExtendedSigner` was renamed to `BladeSigner`
- Hedera-related methods were removed from the `BladeConnector`. Now `connector.getSigner()` should be used in order to perform those operations.
- Legacy extensions (v0.18.1 and earlier) are no longer supported
