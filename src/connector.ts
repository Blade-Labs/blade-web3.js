import { WalletLoadedEvent, BladeExtensionInterface } from './models/blade';

/**
 * Wait for blade extension to be available.
 * @returns 
 */
export function waitExtensionInterface(): Promise<BladeExtensionInterface> {

    return new Promise((resolve, reject) => {


        if (window.bladeConnect != null) {
            resolve(window.bladeConnect as BladeExtensionInterface);
        } else {

            document.addEventListener(WalletLoadedEvent, () => {

                if (window.bladeConnect != null) {
                    resolve(window.bladeConnect as BladeExtensionInterface);
                } else {
                    reject(new Error('Blade Wallet Connector not found.'));
                }
            });
        }

    });

}