import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";

type CampaignEscrowTreasury = {
  totalDepositAmount: BN;
  totalDepositCount: BN;
  treasuryEscrow: PublicKey;
  treasuryMint: PublicKey;
};

export default CampaignEscrowTreasury;
