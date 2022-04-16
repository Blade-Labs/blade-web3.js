/**
 * Errors related to connecting to the Blade Wallet Extension.
 */
export enum BladeWalletError {

  /**
   * Blade Wallet Extension was not found in Chrome browser.
   */
  ExtensionNotFound = 'ExtensionNotFound',

  /**
   * Signer could not be used because there is no active session with the Blade Wallet Extension.
   */
  NoSession = 'NoActiveSession',
}

export function noExtensionError(): Error {
  const err = new Error(`Blade Extension not found. Please install Blade Wallet Extension.`);
  err.name = BladeWalletError.ExtensionNotFound;
  return err;
}

export function noSessionError(): Error {
  const err = new Error(`User does not have an active Blade session.`);
  err.name = BladeWalletError.NoSession;
  return err;
}