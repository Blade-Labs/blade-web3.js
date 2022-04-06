import { WalletLoadedEvent, BladeExtensionInterface } from './models/blade';


/**
 * Wait for blade extension to be available.
 * @returns 
 */
export function waitExtensionInterface(): Promise<BladeExtensionInterface> {

    return new Promise((resolve, reject) => {

        if (window.walletConnect != null) {
            resolve(window.walletConnect as BladeExtensionInterface);
        } else {

            const walletLoaded = () => {

                document.removeEventListener(WalletLoadedEvent, walletLoaded);
                if (window.walletConnect != null) {
                    resolve(window.walletConnect as BladeExtensionInterface);
                } else {
                    reject(new Error('Blade Wallet Connector not found.'));
                }
            }
            document.addEventListener(WalletLoadedEvent, walletLoaded);
        }

    });

}