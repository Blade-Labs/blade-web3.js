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

| API                                                                | Description                                                      |
|:-------------------------------------------------------------------|:-----------------------------------------------------------------|
| `bladeSigner.createSession(params:SessionParams)`                  | Optional params. Create session with Blade extension.            |
| `bladeSigner.getAccountId()`                                       | Get accountId of active account.                                 |
| `bladeSigner.getAccountBalance( accountId:AccountId⎮string)`       |                                                                  |
| `bladeSigner.getAccountInfo( accountId:AccountId⎮string)`          | Get information about a Hedera account on the connected network. |
| `bladeSigner.checkTransaction(transaction:Transaction)`            | Check that a transaction is valid.                               |
| `bladeSigner.populateTransaction(transaction:Transaction)`         | Set transaction id with active account.                          |
| `bladeSigner.call(request:Executable)`                             | Sign and execute a transaction with provider account.            |
| `bladeSigner.signTransaction(transaction:Transaction)`             | Sign a transaction with active wallet account.                   |
| `bladeSigner.getLedgerId()`                                        | Ledger Id of the currently connected network.                    |
| `bladeSigner.getMirrorNetwork()`                                   | Return array of mirror nodes for the current network.            |
| `bladeSigner.getNetwork()`                                         | Get map of nodes for the current hedera network.                 |
| `bladeSigner.onAccountChanged(callback:Function)`                  | Run callback when the wallet account changes.                    |
| `bladeSigner.onWalletLocked(callback:Function)`                    | Run callback when the wallet is locked.                          |
| `bladeSigner.handshake(serverAccountId, serverSignature, payload)` | Make secure client-server handshake                              |

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

#### Client

``` javascript
const {signingData, payload} = await fetch('http://localhost:8443/getPayload').then(res => res.json());
//signingData == {"serverSignature":"f558951c2715266512eec88d300d52a35976d52261aed4e9f942fb4c06dab4e3860692cc51fd0c5eed46a408d28467615ae15c35287046874766d76f35300b5b","serverSigningAccount":"0.0.8281"}
//payload == {"url":"d084-178-137-139-12.ngrok-free.app","data":{"token":"fufhr9e84hf9w8fehw9e8fhwo9e8fw938fw3o98fhjw3of"}}
console.log(signingData, payload);

const handshakeResult = await this.bladeSigner.handshake(
    signingData.serverSigningAccount,
    signingData.serverSignature,
    payload
)
// handshakeResult = {"originalPayload":{"url":"d084-178-137-139-12.ngrok-free.app","data":{"token":"fufhr9e84hf9w8fehw9e8fhwo9e8fw938fw3o98fhjw3of"}},"serverSignature":{"publicKey":"0275ef107b354472a43421d777ba8c7c079e399c17eef1ce2523a1bf52fcb50bbe","signature":"f558951c2715266512eec88d300d52a35976d52261aed4e9f942fb4c06dab4e3860692cc51fd0c5eed46a408d28467615ae15c35287046874766d76f35300b5b","accountId":"0.0.8281"},"userSignature":{"publicKey":"0326f941301c363f406b81e67df09f85851cc17a379af8a2e8a6c22fb84f71bc2d","signature":"8576bf9f6e3b7d45499d9be4f2afbb922b0d04af8b07b42fac5ef26a593fd5fbde7d2194f810266d28c9c2fc8830039aa9a0bc504e3034193a7c3ef7589fe33b","accountId":"0.0.8299"}}

const { authMessage } = await fetch('http://localhost:8443/getAuth', {
    method: 'POST',
    mode: 'cors',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(handshakeResult)
}).then(res => res.json());

// {"authMessage":"Successfully authenticated"}
console.log("authMessage:", authMessage)
```

#### Server
```javascript
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const fetch = require("node-fetch");
const {PublicKey, PrivateKey} = require("@hashgraph/sdk");

const config = {
    port: 8443,
    clientHost: "d084-178-137-139-12.ngrok-free.app",
    serverAccountId: "0.0.8281",
    serverPrivateKey: PrivateKey.fromString("3030020100300706052b8104000a042204209c1878c421d7d0c8c460a23db1dad4274b52803ed4bae338eba2c539eb75ca3c")
}

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Auth server'))

app.get('/getPayload', (req, res) => {
    const payload = {
        url: config.clientHost,
        data: {
            token: "fufhr9e84hf9w8fehw9e8fhwo9e8fw938fw3o98fhjw3of"
        }
    }

    const signingData = sendAuth(payload);
    res.send({
        signingData,
        payload
    })
});

app.post('/getAuth', async (req, res) => {
    const {originalPayload, serverSignature, userSignature} = req.body
    const authMessage = await receiveAuth(originalPayload, serverSignature, userSignature)
    res.send({authMessage})
})

app.listen(config.port, () => {
    console.log('Running on port:', config.port);
})

const sendAuth = (payload) => {
    const bytes = new Uint8Array(Buffer.from(JSON.stringify(payload)))
    const signature = Buffer.from(config.serverPrivateKey.sign(bytes)).toString('hex')

    return {
        serverSignature: signature,
        serverSigningAccount: config.serverAccountId
    }
}

const receiveAuth = async (originalPayload, serverSignature, userSignature) => {
    const publicKey = config.serverPrivateKey.publicKey
    const url = "https://testnet.mirrornode.hedera.com/api/v1/accounts/" + userSignature.accountId
    const accountInfoResponse = await fetch(url, {method: "GET"})

    if (accountInfoResponse.ok) {
        let data = await accountInfoResponse.json();

        let serverSigBuffer = Buffer.from(serverSignature.signature, 'hex');
        let userSigBuffer = Buffer.from(userSignature.signature, 'hex');

        const signedPayload = {
            serverSignature: serverSignature.signature,
            originalPayload
        }

        let serverKeyVerified = verifyData(originalPayload, publicKey.toString(), serverSigBuffer)
        let userKeyVerified = verifyData(signedPayload, data.key.key, userSigBuffer)

        if (serverKeyVerified && userKeyVerified) {
            return "Successfully authenticated"
        }
    }
    return "Auth failed"
}

const verifyData = (data, publicKey, signature) => {
    const pubKey = PublicKey.fromString(publicKey);
    const bytes = Buffer.from(JSON.stringify(data));
    return pubKey.verify(bytes, signature);
}

```

# License
This repository is distributed under the terms of the Apache License (Version 2.0). See [LICENSE](LICENSE) for details.
