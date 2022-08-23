import { LedgerId, Transaction } from "@hashgraph/sdk";
import {ProposalTypes} from "@walletconnect/types";

const chainsMap = new Map();
chainsMap.set(LedgerId.MAINNET.toString(), 295);
chainsMap.set(LedgerId.TESTNET.toString(), 296);
chainsMap.set(LedgerId.PREVIEWNET.toString(), 297);

export const MIRROR_NODES = {
  [LedgerId.MAINNET.toString()]: ["https://mainnet-public.mirrornode.hedera.com"],
  [LedgerId.TESTNET.toString()]: ["https://testnet.mirrornode.hedera.com"],
  [LedgerId.PREVIEWNET.toString()]: ["https://previewnet.mirrornode.hedera.com"]
};

export enum METHODS {
  SIGN_TRANSACTION = "signTransaction",
  CALL = "call",
  GET_ACCOUNT_BALANCE = "getAccountBalance",
  GET_ACCOUNT_INFO = "getAccountInfo"
}

export enum EVENTS {
  ACCOUNTS_CHANGED = "accountsChanged",
}

export const getChainByLedgerId = (ledgerId: LedgerId): string => {
  return `hedera:${chainsMap.get(ledgerId.toString())}`;
}

export const getRequiredNamespaces = (ledgerId: LedgerId): ProposalTypes.RequiredNamespaces => {
  return {
    hedera: {
      chains: [getChainByLedgerId(ledgerId)],
      methods: Object.values(METHODS),
      events: Object.values(EVENTS),
    }
  };
};

type Encodable = {
  toBytes(): Uint8Array
}

export const isEncodable = (obj: any): obj is Encodable => {
  return ("toBytes" in obj) &&
    (typeof (obj as Encodable).toBytes === "function");
};

export const isTransaction = (obj: any): obj is Transaction => {
  if (obj instanceof Transaction) {
    return true;
  } else if ("transactionId" in obj && "sign" in obj) {
    return true;
  }
  return false;
};
