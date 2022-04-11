# BladeConnect

A JavaScript/TypeScript library for development of DApps using Blade Wallet on Hedera Network

# Documentation

[Read the TypeDoc API documentation](https://blade-labs.github.io/bladeconnect/)

For example usage and testing the below APIs using a Demo App, please go here and setup the app locally: [Demo App](https://github.com/Blade-Labs/wallet-demo)


Blade Wallet uses the [Hedera Signature and Wallet Interface](https://hips.hedera.com/hip/hip-338)

The `BladeSigner` class implements the Hashgraph Signer interface and allows access to Blade Wallet operations.

```
import {BladeSigner} from 'blade-web3.js;


initBlade();

async function initBlade() {

    const bladeSigner = new BladeSigner();
    await bladeSigner.createSession();

    // bladeSigner object can now be used.
    bladeSigner.getAccountId();

}

```

| API                                                           | Description                                                      |
| :------------------------------------------------------------ | :--------------------------------------------------------------- |
| `bladeSigner.getAccountId()`                                  | Get accountId of active account.                                 |
| `bladeSigner.getAccountBalance( accountId:AccountId\|string)` |                                                                  |
| `bladeSigner.getAccountInfo( accountId:AccountId\|string)`    | Get information about a Hedera account on the connected network. |
| `bladeSigner.checkTransaction(transaction:Transaction)`       | Check that a transaction is valid.                               |
| `bladeSigner.populateTransaction(transaction:Transaction)`    | Set transaction id with active account.                          |
| `bladeSigner.sendRequest(request:Executable)`                 | Sign and execute a transaction with provider account.            |
| `bladeSigner.signTransaction(transaction:Transaction)`        | Sign a transaction with active wallet account.                   |
| `bladeSigner.getLedgerId()`                                   | Ledger Id of the currently connected network.                    |
| `bladeSigner.getMirrorNetwork()`                              | Return array of mirror nodes for the current network.            |
| `bladeSigner.getNetwork()`                                    | Get map of nodes for the current hedera network.                 |
