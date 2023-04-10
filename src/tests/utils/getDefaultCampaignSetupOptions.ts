import { Keypair, PublicKey } from "@solana/web3.js";
import CampaignEscrowSetupOptions from "tests/types/CampaignEscrowSetupOptions";
import CampaignEscrowSetupOptionsInput from "tests/types/CampaignEscrowSetupOptionsInput";
import uuid from "tests/utils/uuid";

export default function getDefaultCampaignSetupOptions(
  treasuryMint: PublicKey,
  setupOptions?: CampaignEscrowSetupOptionsInput
): CampaignEscrowSetupOptions {
  const defaultOptions: CampaignEscrowSetupOptions = {
    campaignUuid: uuid(),
    creator: setupOptions?.creatorKeypair ?? Keypair.generate(),
    enableDepositEscrowCurrencies:
      setupOptions?.enableDepositEscrowCurrencies ?? null,
    payoutWalletOwner: Keypair.generate().publicKey,
    treasuryMint,
    useNativeDepositEscrow: false,
    useNativeTreasury: true,
  };

  return {
    ...defaultOptions,
    ...setupOptions,
  };
}
