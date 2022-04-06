import { WalletLoadedEvent, BladeExtensionInterface } from './models/blade';


/**
 * Wait for blade extension to be available.
 * @returns 
 */
export function waitExtensionInterface(): Promise<BladeExtensionInterface> {

    console.log(`creating extension promise`);
    return new Promise((resolve, reject) => {

        console.log(`window : ${window} docu: ${document}`);

        if (window.bladeConnect != null) {
            console.log(`window.bladeConnect found`);
            resolve(window.bladeConnect as BladeExtensionInterface);
        } else {

            console.log(`waiting bladeConnect load event.`)

            document.addEventListener(WalletLoadedEvent, () => {

                console.log(`wallet loaded event triggered. document: ${document}`);
                if (window.bladeConnect != null) {
                    resolve(window.bladeConnect as BladeExtensionInterface);
                } else {
                    reject(new Error('Blade Wallet Connector not found.'));
                }
            });
        }

    });

}