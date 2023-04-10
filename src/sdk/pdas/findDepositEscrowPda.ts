import {
  convertUuidToPdaSeed,
  PdaResult,
} from "@formfunction-hq/formfunction-program-shared";
import { PublicKey } from "@solana/web3.js";
import { DEPOSIT_RECORD_ESCROW_PREFIX } from "sdk/constants/AccountPrefixes";

export default function findDepositEscrowPda(
  campaignUuid: string,
  depositEscrowMint: PublicKey,
  campaignTreasuryManagerProgramId: PublicKey
): PdaResult {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(DEPOSIT_RECORD_ESCROW_PREFIX),
      Buffer.from(convertUuidToPdaSeed(campaignUuid), "utf-8"),
      depositEscrowMint.toBuffer(),
    ],
    campaignTreasuryManagerProgramId
  );
}
