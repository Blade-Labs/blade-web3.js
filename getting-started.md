# Getting Started

Blade Wallet uses the [Hedera Signature and Wallet Interface](https://hips.hedera.com/hip/hip-338) as defined here.

### Installation

This package is available as a [NPM package](https://www.npmjs.com/package/@bladelabs/blade-web3.js).

```bash
npm install @bladelabs/blade-web3.js
```

Minimum [Hashgraph SDK](https://github.com/hashgraph/hedera-sdk-js) version 2.16 is needed for connector `npm i -S @hashgraph/sdk@^2.16`

### Usage

The `BladeSigner` class implements the Hashgraph Signer interface and allows access to Blade Wallet operations.

To interact with the Blade Extension programmatically, instantiate a BladeSigner object and create a new session.

```javascript
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

| API                                                          | Description                                                      |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `bladeSigner.createSession(params:SessionParams)`            | Optional params. Create session with Blade extension.            |
| `bladeSigner.getAccountId()`                                 | Get accountId of active account.                                 |
| `bladeSigner.getAccountBalance( accountId:AccountId⎮string)` |                                                                  |
| `bladeSigner.getAccountInfo( accountId:AccountId⎮string)`    | Get information about a Hedera account on the connected network. |
| `bladeSigner.checkTransaction(transaction:Transaction)`      | Check that a transaction is valid.                               |
| `bladeSigner.populateTransaction(transaction:Transaction)`   | Set transaction id with active account.                          |
| `bladeSigner.call(request:Executable)`                       | Sign and execute a transaction with provider account.            |
| `bladeSigner.signTransaction(transaction:Transaction)`       | Sign a transaction with active wallet account.                   |
| `bladeSigner.getLedgerId()`                                  | Ledger Id of the currently connected network.                    |
| `bladeSigner.getMirrorNetwork()`                             | Return array of mirror nodes for the current network.            |
| `bladeSigner.getNetwork()`                                   | Get map of nodes for the current hedera network.                 |
| `bladeSigner.onAccountChanged(callback:Function)`            | Run callback when the wallet account changes.                    |
| `bladeSigner.onWalletLocked(callback:Function)`              | Run callback when the wallet is locked.                          |

#### Executing a Transfer:

```javascript
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

#### Getting a transaction receipt:

```javascript
import { TransactionReceiptQuery } from '@hashgraph/sdk';

const result = await bladeSigner.call( new TransactionReceiptQuery({transactionId:transactionId}));
```

##
