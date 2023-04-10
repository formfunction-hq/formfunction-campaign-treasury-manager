import {
  convertUuidToPdaSeed,
  PdaResult,
} from "@formfunction-hq/formfunction-program-shared";
import { PublicKey } from "@solana/web3.js";
import { CAMPAIGN_ESCROW_PREFIX } from "sdk/constants/AccountPrefixes";

export default function findCampaignEscrowPda(
  campaignUuid: string,
  campaignTreasuryManagerProgramId: PublicKey
): PdaResult {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(CAMPAIGN_ESCROW_PREFIX),
      Buffer.from(convertUuidToPdaSeed(campaignUuid), "utf-8"),
    ],
    campaignTreasuryManagerProgramId
  );
}
