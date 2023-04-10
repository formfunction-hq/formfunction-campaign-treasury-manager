import { PublicKey } from "@solana/web3.js";
import CampaignEscrowAccount from "sdk/types/CampaignEscrowAccount";
import CreateCampaignEscrowInput from "sdk/types/CreateCampaignEscrowInput";
import CampaignEscrowSetupOptions from "tests/types/CampaignEscrowSetupOptions";

type CampaignEscrowTestSetupResult = CampaignEscrowSetupOptions & {
  campaignEscrowAccount: CampaignEscrowAccount;
  createCampaignEscrowInput: CreateCampaignEscrowInput;
  depositEscrowCurrencies: Array<PublicKey>;
};

export default CampaignEscrowTestSetupResult;
