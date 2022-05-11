# Blade Web3 JavaScript API

[![npm version](https://badge.fury.io/js/@bladelabs%2Fblade-web3.js.svg)](https://badge.fury.io/js/@bladelabs%2Fblade-web3.js)

A JavaScript/TypeScript library for development of DApps using Blade Wallet on Hedera Network

# Documentation
[Read the TypeDoc API documentation](https://blade-labs.github.io/blade-web3.js/)

# Example Usage

For example usage and testing the below APIs using a Demo App, please go here and setup the app locally:
### [Demo App - Local Setup](https://github.com/Blade-Labs/wallet-demo)

The hosted version of the Demo App can be used to try out some API calls: 
### [Demo App - Hosted](https://blade-labs.github.io/wallet-demo/)

# Getting Started
Blade Wallet uses the [Hedera Signature and Wallet Interface](https://hips.hedera.com/hip/hip-338) as defined here.

## Installation
This package is available as a [NPM package](https://www.npmjs.com/package/@bladelabs/blade-web3.js).

```
npm install @bladelabs/blade-web3.js
```

## Usage
The `BladeSigner` class implements the Hashgraph Signer interface and allows access to Blade Wallet operations.

To interact with the Blade Extension programmatically, instantiate a BladeSigner object and create a new session.

```
import {BladeSigner} from 'blade-web3.js';


initBlade();

async function initBlade() {

    const bladeSigner = new BladeSigner();
    await bladeSigner.createSession();

    // bladeSigner object can now be used.
    bladeSigner.getAccountId();

}
```

you can then communicate with the Extension using the BladeSigner object using the Hedera Signer interface:

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
| `bladeSigner.onAccountChanged(callback:Function)`             | Run callback when the wallet account changes.                    |
| `bladeSigner.onWalletLocked(callback:Function)`               | Run callback when the wallet is locked.                          |

### Executing a Transfer:

```
import { TransferTransaction } from '@hashgraph/sdk';

 const amount = new BigNumber(5);

 const transaction = new TransferTransaction(
    {
          hbarTransfers: [{
            accountId: destinationAccountId,
            amount: amount
          },
          {
            accountId: bladeSigner.getAccountId(),
            amount: amount.negated()
          }
          ]
        }

      );

const result = await bladeSigner.sendRequest(transaction);
```

### Getting a transaction receipt:
```
import { TransactionReceiptQuery } from '@hashgraph/sdk';

const result = await bladeSigner.sendRequest( new TransactionReceiptQuery({transactionId:transactionId}));
```
# License
This repository is distributed under the terms of the Apache License (Version 2.0). See [LICENSE](LICENSE) for details.
