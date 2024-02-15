/**
 * Errors related to connecting to the Blade Wallet Extension.
 */
export enum BladeWalletError {

  /**
   * Blade Wallet Extension was not found in Chrome browser.
   */
  ExtensionNotFound = 'ExtensionNotFound',

  WalletConnectNotInitialized = 'WalletConnectNotInitialized',

  /**
   * User rejected the pairing request.
   */
  PairingRejected = 'PairingRejected',

  ArgumentIsNotExecutable = 'ArgumentIsNotExecutable',

  WalletIsClosedOrLocked = 'WalletIsClosedOrLocked',

  InvalidTransactionAccountId = 'InvalidTransactionAccountId',

  InvalidTransactionNodeAccountIds = 'InvalidTransactionNodeAccountIds'
}

export function noExtensionError(): Error {
  const err = new Error(`Blade Extension not found. Please install Blade Wallet Extension.`);
  err.name = BladeWalletError.ExtensionNotFound;
  return err;
}

export function walletConnectIsNotInitialized(): Error {
  const err = new Error(`WalletConnect is not initialized. Try to initialize it first.`);
  err.name = BladeWalletError.WalletConnectNotInitialized;
  return err;
}

export function pairingRejected(): Error {
  const err = new Error(`User rejected pairing request.`);
  err.name = BladeWalletError.PairingRejected;
  return err;
}

export function argumentIsNotExecutable(): Error {
  const err = new Error(`Argument is not executable.`);
  err.name = BladeWalletError.ArgumentIsNotExecutable;
  return err;
}

export function walletIsClosedOrLocked(): Error {
  const err = new Error(`Wallet is closed or locked.`);
  err.name = BladeWalletError.WalletIsClosedOrLocked;
  return err;
}

export function invalidTransactionAccountId(): Error {
  const err = new Error(`Transaction's ID constructed with a different account ID.`);
  err.name = BladeWalletError.InvalidTransactionAccountId;
  return err;
}

export function invalidTransactionNodeAccountIds(): Error {
  const err = new Error(`Transaction already set node account IDs to values not within the current network.`);
  err.name = BladeWalletError.InvalidTransactionNodeAccountIds;
  return err;
}
