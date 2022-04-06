For example usage and testing the below APIs using a Demo App, please go here and setup the app locally: [Demo App](https://github.com/Blade-Labs/wallet-demo)


Blade Wallet uses the [Hedera Wallet Interface](https://hips.hedera.com/hip/hip-338)

Create new wallet:

```
import {BladeWallet} from 'bladeconnect;

const wallet = new BladeWallet();

```

| API | Description |
| :--- | :--- |
| `bladeWallet.getAccountId()` | Get accountId of active account. |
| `bladeWallet.getAccountBalance( accountId:AccountId\|string)` |  |
| `bladeWallet.getAccountInfo( accountId:AccountId\|string)` | Get information about a Hedera account on the connected network. |
| `bladeWallet.getProvider()` | Get the **Provider** which gives access to the underlying Ledger network. |
| `bladeWallet.getAccountKey()` | Get the public key used by this wallet. |
| `bladeWallet.checkTransaction(transaction:Transaction)` | Check that a transaction is valid. |
| `bladeWallet.populateTransaction(transaction:Transaction)` | Set transaction id with active account. |
| `bladeWallet.sendRequest(request:Executable)` | Sign and execute a transaction with provider account. |
| `bladeWallet.signTransaction(transaction:Transaction)` | Sign a transaction with active wallet account. |
| `bladeWallet.getLedgerId()` | Ledger Id of the currently connected network. |
| `bladeWallet.getMirrorNetwork()` | Return array of mirror nodes for the current network. |
| `bladeWallet.getNetwork()` | Get map of nodes for the current hedera network. |


| API | Description |
| :--- | :--- |
| `provider.getAccountBalance( accountId:AccountId\|string)` | Get balance information for Hedera account.|
| `provider.getAccountInfo( accountId:AccountId\|string)` | Get information about a Hedera account on the connected network. |
| `provider.getTransactionReceipt(transactionId:TransactionId)` | Query network for receipt of a transaction. |
| `provider.waitForReceipt(response:TransactionResponse)` | Wait for a submitted transaction to resolve with a receipt. |
| `provider.getLedgerId()` | Ledger Id of the currently connected network. |
| `provider.getMirrorNetwork()` | Return array of mirror nodes for the current network. |
| `provider.getNetwork()` | Get map of nodes for the current hedera network. |