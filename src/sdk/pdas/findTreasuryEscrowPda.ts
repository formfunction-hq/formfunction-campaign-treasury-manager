import {
  convertUuidToPdaSeed,
  PdaResult,
} from "@formfunction-hq/formfunction-program-shared";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_PREFIX, TREASURY_PREFIX } from "sdk/constants/AccountPrefixes";

export default function findTreasuryEscrowPda(
  campaignUuid: string,
  campaignTreasuryManagerProgramId: PublicKey
): PdaResult {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(PROGRAM_PREFIX),
      Buffer.from(convertUuidToPdaSeed(campaignUuid), "utf-8"),
      Buffer.from(TREASURY_PREFIX),
    ],
    campaignTreasuryManagerProgramId
  );
}
