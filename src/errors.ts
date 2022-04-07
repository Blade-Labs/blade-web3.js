export enum BladeWalletError {
  ExtensionNotFound = 'ExtensionNotFound',
  WalletNotReady = 'WalletNotReady',
  NoSession = 'NoActiveSession',
}

export function noExtensionError(): Error {
  const err = new Error(`Blade Extension not found. Please install Blade Wallet Extension.`);
  err.name = BladeWalletError.ExtensionNotFound;
  return err;
}

export function noSessionError(): Error {
  const err = new Error(`User does not have an active Blade Wallet session.`);
  err.name = BladeWalletError.NoSession;
  return err;
}
