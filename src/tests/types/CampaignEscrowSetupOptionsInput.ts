import { Keypair, PublicKey } from "@solana/web3.js";
import PayoutPhasesTestInput from "tests/types/PayoutPhasesTestInput";

type CampaignEscrowSetupOptionsInput = {
  campaignUuid?: string;
  creatorKeypair?: Keypair;
  enableDepositEscrowCurrencies?: number;
  payoutPhases?: PayoutPhasesTestInput;
  payoutWalletOwner?: PublicKey;
  useNativeDepositEscrow?: boolean;
  useNativeTreasury?: boolean;
};

export default CampaignEscrowSetupOptionsInput;
