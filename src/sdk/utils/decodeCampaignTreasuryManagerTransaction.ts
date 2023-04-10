import {
  decodeTransactionUsingProgramIdl,
  Maybe,
} from "@formfunction-hq/formfunction-program-shared";
import { ParsedTransactionWithMeta, PublicKey } from "@solana/web3.js";
import { CAMPAIGN_TREASURY_MANAGER_IDL } from "sdk/idl";
import DecodedCampaignTreasuryManagerTransactionResult from "sdk/types/DecodedCampaignTreasuryManagerTransactionResult";

export default function decodeCampaignTreasuryManagerTransaction(
  programId: PublicKey,
  parsedTransaction: ParsedTransactionWithMeta
): Maybe<DecodedCampaignTreasuryManagerTransactionResult> {
  for (const idl of [CAMPAIGN_TREASURY_MANAGER_IDL]) {
    const result =
      decodeTransactionUsingProgramIdl<DecodedCampaignTreasuryManagerTransactionResult>(
        idl,
        programId,
        parsedTransaction
      );
    if (result != null) {
      return result;
    }
  }

  return null;
}
