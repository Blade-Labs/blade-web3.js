import { WalletLoadedEvent, BladeExtensionInterface } from './models/blade';
import { noExtensionError } from './errors';

/**
 * Wait for blade extension to be available.
 * @returns
 */
export function waitExtensionInterface(): Promise<BladeExtensionInterface> {
  return new Promise((resolve, reject) => {
    if (window.bladeConnect != null) {
      resolve(window.bladeConnect);
    } else {
      document.addEventListener(WalletLoadedEvent, () => {
        if (window.bladeConnect != null) {
          resolve(window.bladeConnect);
        } else {
          reject(noExtensionError());
        }
      });
    }
  });
}
