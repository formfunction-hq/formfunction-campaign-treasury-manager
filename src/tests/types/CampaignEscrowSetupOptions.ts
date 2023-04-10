import { Maybe } from "@formfunction-hq/formfunction-program-shared";
import { Keypair, PublicKey } from "@solana/web3.js";

type CampaignEscrowSetupOptions = {
  campaignUuid: string;
  creator: Keypair;
  enableDepositEscrowCurrencies: Maybe<number>;
  payoutWalletOwner: PublicKey;
  treasuryMint: PublicKey;
  useNativeDepositEscrow: boolean;
  useNativeTreasury: boolean;
};

export default CampaignEscrowSetupOptions;
