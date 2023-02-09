import {Signer} from "@hashgraph/sdk";

export function getAccountIDsFromSigners(signers: Signer[]): string[]  {
  return signers.map(s => s.getAccountId().toString())
}
