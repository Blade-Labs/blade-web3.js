## [DEPRECATED]
This package is no longer supported. Please, use the native [WalletConnect](https://docs.walletconnect.com/appkit/javascript/core/installation).

# Blade Web3 JavaScript API

[![npm version](https://badge.fury.io/js/@bladelabs%2Fblade-web3.js.svg)](https://badge.fury.io/js/@bladelabs%2Fblade-web3.js)

A JavaScript/TypeScript library for DApps development using Blade Wallet on Hedera Network.
Blade Wallet uses the Hedera Signature and Wallet Interface as defined [here](https://hips.hedera.com/hip/hip-338).

# Table of contents
- [Demo](#demo)
- [Usage](#usage)
  - [Installation](#installation)
  - [Initialization](#initialization)
  - [Pairing](#pairing)
  - [Disconnecting](#disconnecting)
  - [Handshake](#handshake)
  - [Accounts](#accounts)
    - [Get account ID](#get-account-id)
    - [Get account info](#get-account-info)
    - [Get account balances](#get-account-balances)
  - [Transactions](#transactions)
    - [Signing](#signing)
    - [Getting a receipt](#getting-a-receipt)
    - [Validation](#validation)
- [API](#api)
- [License](#license)

# Demo
For example usage and testing the below APIs using a Demo App, please go here and setup the app locally:
### [Demo App - Local Setup](https://github.com/Blade-Labs/wallet-demo)

The hosted version of the Demo App can be used to try out some API calls:
### [Demo App - Hosted](https://blade-labs.github.io/wallet-demo/)

# Usage
## Installation
This package is available as a [NPM package](https://www.npmjs.com/package/@bladelabs/blade-web3.js).

```bash
# npm
npm install @bladelabs/blade-web3.js

# yarn
yarn add @bladelabs/blade-web3.js
```

Minimum [Hashgraph SDK](https://github.com/hashgraph/hedera-sdk-js) version 2.16 is needed for this library to work
```bash
# npm
npm install -S @hashgraph/sdk@^2.16

# yarn
yarn add @hashgraph/sdk@^2.16
```

Also, it is recommended to look through the Hedera [documentation](https://docs.hedera.com/hedera).

## Initialization
To interact with the Blade Extension programmatically, instantiate a `BladeConnector` object.

It is possible to pass a preferred pairing strategy. By default (`ConnectorStrategy.AUTO`), the pairing is handled as follows:
- If there is Blade Wallet extension, a wallet user will be asked to select needed accounts;
- If there is **no** Blade Wallet extension, a QR code modal will be shown.

If preferred strategy is extension strategy (`ConnectorStrategy.EXTENSION`), the library will throw the error, if the extension was not detected.

If preferred strategy is WalletConnect strategy (`ConnectorStrategy.WALLET_CONNECT`), only the QR code modal will be used.

**Implementation example:**
```javascript
import {BladeConnector, ConnectorStrategy} from '@bladelabs/blade-web3.js';

const bladeConnector = await BladeConnector.init(
  ConnectorStrategy.WALLET_CONNECT, // preferred strategy is optional 
  { // dApp metadata options are optional, but are highly recommended to use
    name: "Awesome DApp",
    description: "DApp description",
    url: "https://awesome-dapp.io/",
    icons: ["some-image-url.png"]
  }
);
```

### Pairing
**Implementation example:**
```javascript
import {HederaNetwork} from '@bladelabs/blade-web3.js';

// params are optional, and Mainnet is used as a default
const params = {
  network: HederaNetwork.Mainnet,
  dAppCode: "SomeAwesomeDApp" // optional while testing, request specific one by contacting us
}

const pairedAccountIds = await bladeConnector.createSession(params);
// retrieving the first available signer to perform all the Hedera operations
const bladeSigner = await bladeConnector.getSigners()[0];
```

### Disconnecting
To disconnect the session, call `.killSession()` method. 

**Implementation example:**
```javascript
await bladeConnector.killSession();
```

### Handshake
Wallet handshake allows to generate an authentication signature for use on a backend side.
It may be useful, when it is important for a backend to make sure, that client user surely has access to a wallet.

Workflow:
1. Client requests backend for payload to sign, and data to sign with;
2. Client performs handshake;
3. Client sends handshake result to backend;
4. Backend checks signatures.

**Implementation example:**
```javascript
// client side
const {signingData, payload} = await fetch('https://domain.com/get-payload').then(res => res.json());

const handshakeResult = await bladeSigner.handshake(
  signingData.serverSigningAccount,
  signingData.serverSignature,
  payload
);

await fetch('http://localhost:8443/get-handshake', {
  method: 'POST',
  mode: 'cors',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(handshakeResult)
});

// backend side (Node.js + express)
const config = {
  clientHost: "some-host-url",
  serverAccountId: "0.0.8281",
  serverPrivateKey: PrivateKey.fromString("3030020100300706052b8104000a042204209c1878c421d7d0c8c460a23db1dad4274b52803ed4bae338eba2c539eb75ca3c")
};

const app = express();

// ... server configuration

app.get('/get-payload', (req, res) => {
  const payload = {
    url: config.clientHost,
    data: {
      token: "fufhr9e84hf9w8fehw9e8fhwo9e8fw938fw3o98fhjw3of"
    }
  };

  const bytes = new Uint8Array(Buffer.from(JSON.stringify(payload)));
  const signature = Buffer.from(config.serverPrivateKey.sign(bytes)).toString('hex');

  const signingData = {
    serverSignature: signature,
    serverSigningAccount: config.serverAccountId
  };

  res.send({signingData, payload});
});

app.post('/get-handshake', async (req, res) => {
  const {originalPayload, serverSignature, userSignature} = req.body;

  const publicKey = config.serverPrivateKey.publicKey;
  const url = "https://testnet.mirrornode.hedera.com/api/v1/accounts/" + userSignature.accountId;
  const accountInfoResponse = await fetch(url, {method: "GET"});

  if (accountInfoResponse.ok) {
    const data = await accountInfoResponse.json();

    const serverSigBuffer = Buffer.from(serverSignature.signature, 'hex');
    const userSigBuffer = Buffer.from(userSignature.signature, 'hex');

    const signedPayload = {
      serverSignature: serverSignature.signature,
      originalPayload
    };

    const serverKeyVerified = verifyData(originalPayload, publicKey.toString(), serverSigBuffer)
    const userKeyVerified = verifyData(signedPayload, data.key.key, userSigBuffer)

    if (serverKeyVerified && userKeyVerified) {
      // successfully authenticated
    } else {
      // failed to authenticate  
    }
  } else {
    // failed to authenticate 
  }
});

const verifyData = (data, publicKey, signature) => {
  const pubKey = PublicKey.fromString(publicKey);
  const bytes = Buffer.from(JSON.stringify(data));
  return pubKey.verify(bytes, signature);
}
```

### Accounts
#### Get account ID
To get an account ID, use `.getAccountId()` method on the needed signer.

**Implementation example:**
```javascript
const bladeSigner = bladeConnector.getSigners()[0];
const accountId = bladeSigner.getAccountId();
```

#### Get account info
To get detailed info about account, use `.getAccountInfo()` method on the needed signer.

**Implementation example:**
```javascript
const bladeSigner = bladeConnector.getSigners()[0];
const accountInfo = bladeSigner.getAccountInfo();
```

#### Get account balances
To get info about all the balances of an account, use `.getAccountBalance()` method on the needed signer.

**Implementation example:**
```javascript
const bladeSigner = bladeConnector.getSigners()[0];
const balances = bladeSigner.getAccountBalance();
```

### Transactions
#### Signing
For signing to be successful, transaction should be actually signed and executed. 
Some transaction types require premature populating — e.g. `TransferTransaction`, `TokenCreateTransaction` etc. 
There are multiple ways to populate and execute transaction. To execute a transaction, you can use the `.call()` method, 
but it is also possible to call the `.executeWithSigner()` on a transaction itself.

**First approach:**
```javascript
import {TransferTransaction} from '@hashgraph/sdk';

const bladeSigner = bladeConnector.getSigners()[0];

const amount = 5;

const transaction = new TransferTransaction()
  .addHbarTransfer(destinationAccountId, amount)
  .addHbarTransfer(bladeSigner.getAccountId(), -amount);

// populate adds transaction ID and node IDs to the transaction
const populatedTransaction = await bladeSigner.populateTransaction(transaction);
const signedTransaction = await bladeSigner.signTransaction(transaction.freeze());

// call executes the transaction
const result = await bladeSigner.call(signedTransaction);
// or
const result = await signedTransaction.executeWithSigner(bladeSigner);
```

**Second approach:**
```javascript
import {TransferTransaction, AccountId} from '@hashgraph/sdk';

const bladeSigner = bladeConnector.getSigners()[0];

const amount = 5;

const transaction = await new TransferTransaction()
  .addHbarTransfer(destinationAccountId, amount)
  .addHbarTransfer(bladeSigner.getAccountId(), -amount)
  .setTransactionId(TransactionId.generate(bladeSigner.getAccountId()))
  .setNodeAccountIds([new AccountId(3)])
  .freeze();

const signedTransaction = await bladeSigner.signTransaction(transaction);

const result = await bladeSigner.call(signedTransaction);
// or
const result = await signedTransaction.executeWithSigner(bladeSigner);
```

**Third approach:**
```javascript
import {TransferTransaction} from '@hashgraph/sdk';

const bladeSigner = bladeConnector.getSigners()[0];

const amount = 5;

const transaction = await new TransferTransaction()
  .addHbarTransfer(destinationAccountId, amount)
  .addHbarTransfer(bladeSigner.getAccountId(), -amount)
  .freezeWithSigner(bladeSigner); // adds transaction ID and node IDs to the transaction as well

const signedTransaction = await bladeSigner.signTransaction(transaction);

const result = await bladeSigner.call(signedTransaction);
// or
const result = await signedTransaction.executeWithSigner(bladeSigner);
```

#### Getting a receipt
It is possible to get a receipt for any executed transaction withing the current network.

**Implementation example:**
```javascript
import {TransactionReceiptQuery} from '@hashgraph/sdk';

const transactionId = "some-tx-id";

const bladeSigner = bladeConnector.getSigners()[0];
const result = await bladeSigner.call(new TransactionReceiptQuery({
  transactionId
}));
```

#### Validation
If there is a need to check transaction validity, `.checkTransaction()` method may be useful for that.
It checks if node accounts are valid for the current network, and if transaction composed with the account signer, which this method is called on.

**Implementation example:**
```javascript
import {TransferTransaction} from '@hashgraph/sdk';

let bladeSigner = bladeConnector.getSigners()[0];

const amount = 5;

const transaction = await new TransferTransaction()
  .addHbarTransfer(destinationAccountId, amount)
  .addHbarTransfer(bladeSigner.getAccountId(), -amount)
  .freezeWithSigner(bladeSigner);

bladeSigner = bladeConnector.getSigners()[1]; // using different account

try {
  await bladeSigner.checkTransaction(transaction); 
} catch (e) {
  // transaction is not valid
}
```

# API
[Read the TypeDoc API documentation](https://blade-labs.github.io/blade-web3.js/)

## BladeConnector
| Method                                                 | Description                                              |
|:-------------------------------------------------------|:---------------------------------------------------------|
| `bladeConnector.createSession(params?: SessionParams)` | Create session with Blade Wallet.                        |
| `bladeConnector.killSession()`                         | Close the session with Blade Wallet.                     |
| `bladeConnector.getSigners()`                          | Get a list of paired BladeSigner objects.                |
| `bladeConnector.onWalletLocked(callback)`              | Execute a callback when wallet is locked.                |
| `bladeConnector.onWalletUnlocked(callback)`            | Execute a callback when wallet is unlocked.              |                                           |
| `bladeConnector.onSessionDisconnect(callback)`         | Execute a callback when a session has been disconnected. |                                           |
| `bladeConnector.onSessionExpire(callback)`             | Execute a callback when a session has expired.           |                                           |

## BladeSigner
| Method                                                                                               | Description                                                      |
|:-----------------------------------------------------------------------------------------------------|:-----------------------------------------------------------------|
| `bladeSigner.getAccountId()`                                                                         | Get accountId of the related account.                            |
| `bladeSigner.getAccountBalance(accountId: AccountId⎮string)`                                         | Retrieve account balance by accountId                            |
| `bladeSigner.getAccountInfo(accountId: AccountId⎮string)`                                            | Get information about a Hedera account on the connected network. |
| `bladeSigner.checkTransaction(transaction: Transaction)`                                             | Check that a transaction is valid.                               |
| `bladeSigner.populateTransaction(transaction: Transaction)`                                          | Set transaction id and node accounts using the related account.  |
| `bladeSigner.call(request: Executable)`                                                              | Execute a transaction with provider account.                     |
| `bladeSigner.sign(message: UInt8Array[])`                                                            | Sign a transaction or a message with the related wallet account. |
| `bladeSigner.signTransaction(transaction: Transaction)`                                              | Sign a transaction with the related wallet account.              |
| `bladeSigner.getLedgerId()`                                                                          | Ledger Id of the currently connected network.                    |
| `bladeSigner.getMirrorNetwork()`                                                                     | Get an array of mirror nodes for the current network.            |
| `bladeSigner.getNetwork()`                                                                           | Get a map of nodes for the current Hedera network.               |
| `bladeSigner.handshake(serverAccountId: string, serverSignature: string, payload: HandshakePayload)` | Make secure client-server handshake                              |

# License
This repository is distributed under the terms of the Apache License (Version 2.0). See [LICENSE](LICENSE) for details.
