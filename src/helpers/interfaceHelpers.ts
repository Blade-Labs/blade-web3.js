import {defer, first, lastValueFrom, Observable, ObservableInput, repeat, takeWhile} from "rxjs";
import {BladeExtensionInterface} from "../models/blade";
import {noExtensionError} from "../models/errors";
import {Signer} from "@hashgraph/sdk";

function pollExtensionInterface(): Observable<BladeExtensionInterface | undefined> {
    return defer<ObservableInput<BladeExtensionInterface | undefined>>(
        () => new Promise((resolve) =>
            resolve(window.bladeConnect)
        )
    ).pipe(
        repeat({ count: 10, delay: 200 }),
        takeWhile(value => !value, true),
        first(value => !!value, undefined)
    );
}

function browserSupportsExtension(): boolean {
    // @ts-ignore
    return Boolean(self.chrome);
}

export async function getBladeExtension(): Promise<BladeExtensionInterface | undefined> {
    const extensionInterface = window.bladeConnect;

    if (!browserSupportsExtension()) {
       return;
    }

    if (extensionInterface) {
        return extensionInterface;
    }

    return new Promise((resolve, reject) => {
        pollExtensionInterface().subscribe(extInterface => {
            if (!extInterface) {
                // use of method on BladeSigner before using createSession
                reject(noExtensionError());
                return;
            }

            resolve(extInterface);
        });
    });
}

export async function waitForConnector(checkFn: () => Promise<boolean>): Promise<boolean> {
    return lastValueFrom(
        defer<ObservableInput<boolean>>(checkFn)
            .pipe(
                repeat({delay: 200}),
                takeWhile(value => !value, true),
                first(value => !!value)
            )
    );
}

export function getAccountIDsFromSigners(signers: Signer[]): string[]  {
    return signers.map(s => s.getAccountId().toString())
}