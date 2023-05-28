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

``` bash
npm install @bladelabs/blade-web3.js
```

Minimum [Hashgraph SDK](https://github.com/hashgraph/hedera-sdk-js) version 2.16 is needed for connector  `npm i -S @hashgraph/sdk@^2.16`

## Usage
The `BladeSigner` class implements the Hashgraph Signer interface and allows access to Blade Wallet operations.

To interact with the Blade Extension programmatically, instantiate a BladeSigner object and create a new session.

``` javascript
import {BladeSigner, HederaNetwork} from '@bladelabs/blade-web3.js';

initBlade();

async function initBlade() {
    const bladeSigner = new BladeSigner();
    const params = {
      network: HederaNetwork.Mainnet,
      // dAppCode - optional while testing, request specific one by contacting us.
      dAppCode: "yourAwesomeApp"
    }
    // create session with optional parameters.
    await bladeSigner.createSession(params);

    // bladeSigner object can now be used.
    bladeSigner.getAccountId();
}
```

you can then communicate with the Extension using the BladeSigner object using the Hedera Signer interface:

| API                                                        | Description                                                      |
|:-----------------------------------------------------------| :--------------------------------------------------------------- |
| `bladeSigner.createSession(params:SessionParams)`| Optional params. Create session with Blade extension.                                 |
| `bladeSigner.getAccountId()`                               | Get accountId of active account.                                 |
| `bladeSigner.getAccountBalance( accountId:AccountId⎮string)` |                                                               |
| `bladeSigner.getAccountInfo( accountId:AccountId⎮string)`    | Get information about a Hedera account on the connected network. |
| `bladeSigner.checkTransaction(transaction:Transaction)`    | Check that a transaction is valid.                               |
| `bladeSigner.populateTransaction(transaction:Transaction)` | Set transaction id with active account.                          |
| `bladeSigner.call(request:Executable)`                     | Sign and execute a transaction with provider account.            |
| `bladeSigner.signTransaction(transaction:Transaction)`     | Sign a transaction with active wallet account.                   |
| `bladeSigner.getLedgerId()`                                | Ledger Id of the currently connected network.                    |
| `bladeSigner.getMirrorNetwork()`                           | Return array of mirror nodes for the current network.            |
| `bladeSigner.getNetwork()`                                 | Get map of nodes for the current hedera network.                 |
| `bladeSigner.onAccountChanged(callback:Function)`          | Run callback when the wallet account changes.                    |
| `bladeSigner.onWalletLocked(callback:Function)`            | Run callback when the wallet is locked.                          |

### Executing a Transfer:

``` javascript
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

const result = await bladeSigner.call(transaction);
```

### Getting a transaction receipt:
``` javascript
import { TransactionReceiptQuery } from '@hashgraph/sdk';

const result = await bladeSigner.call( new TransactionReceiptQuery({transactionId:transactionId}));
```

### Secure handshake:

``` javascript
let payload = {
    url: window.location.hostname,
    data: {
        token: "fufhr9e84hf9w8fehw9e8fhwo9e8fw938fw3o98fhjw3of"
    }
};

const {signingData} = await fetch('http://localhost:8443/sendAuth').then(res => res.json());
// {"signingData":{"serverSignature":"51c55348003676a1a753d5f10c31a42f16430784053a08e6368f79e666a7d6f053014e8e33f0fca808941f3c2be5975597815ab48d22868196e43fc443affcb9","serverSigningAccount":"0.0.8281"}}

const handshakeResult = await bladeSigner.handshake(
    signingData.serverSigningAccount,
    signingData.serverSignature,
    payload
)

const body = JSON.stringify(handshakeResult);
// {originalPayload: {"url":"b344-178-137-139-12.ngrok-free.app","data":{"token":"fufhr9e84hf9w8fehw9e8fhwo9e8fw938fw3o98fhjw3of"}},serverSignature: {publicKey: "7dca406e2ffa2cd473bdb5b7b0bb6283e6eac02cf41a604e701960d11c0953be",signature: "51c55348003676a1a753d5f10c31a42f16430784053a08e6368f79e666a7d6f053014e8e33f0fca808941f3c2be5975597815ab48d22868196e43fc443affcb9",accountId: "0.0.8281"},userSignature: {publicKey: "cce9430742d838b68fd286b280bee5a31b2b1249075270022d0c8d09893e6e67",signature: "fda3cee1956caa0b76e17bcd28f7a69161c55b0baa02f8abf6fb83baf9a3c51b4dd4f5978093073bc5b8ed1289661b4ca8b34081364827efab4d79e684955e1d",accountId: "0.0.8235"}}

const { authMessage } = await fetch('http://localhost:8443/getAuth', {
    method: 'POST',
    mode: 'cors',
    headers: {
        'Content-Type': 'application/json'
    },
    body
}).then(res => res.json())
// {"authMessage":"Successfully authenticated"}

console.log("authMessage:", authMessage)
```

# License
This repository is distributed under the terms of the Apache License (Version 2.0). See [LICENSE](LICENSE) for details.
