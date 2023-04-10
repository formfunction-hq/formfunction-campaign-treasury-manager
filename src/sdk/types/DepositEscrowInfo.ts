import { PublicKey } from "@solana/web3.js";

// Note: Keep in sync with program.
type DepositEscrowInfo = {
  deposit_escrow_bump: number;
  mint: PublicKey;
};

export default DepositEscrowInfo;
