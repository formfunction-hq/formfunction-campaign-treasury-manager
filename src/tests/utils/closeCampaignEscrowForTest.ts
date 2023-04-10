import { Connection, Keypair } from "@solana/web3.js";
import CampaignTreasuryManagerSdk from "sdk/CampaignTreasuryManagerSdk";
import findCampaignEscrowPda from "sdk/pdas/findCampaignEscrowPda";
import sendTransactionForTest from "tests/utils/sendTransactionForTest";

export default async function closeCampaignEscrowForTest({
  campaignUuid,
  authority,
  connection,
  creator,
  sdk,
  signer,
}: {
  authority: Keypair;
  campaignUuid: string;
  connection: Connection;
  creator: Keypair;
  sdk: CampaignTreasuryManagerSdk;
  signer: Keypair;
}): Promise<void> {
  const tx = await sdk.closeEscrowTx(
    {
      authority: authority.publicKey,
      creator: creator.publicKey,
      payer: signer.publicKey,
      receiver: authority.publicKey,
    },
    {
      campaignUuid,
    }
  );

  await sendTransactionForTest(connection, tx, [signer]);

  const [campaignEscrow] = findCampaignEscrowPda(campaignUuid, sdk.programId);

  expect(
    async () => await sdk.fetchCampaignEscrowAccount(campaignEscrow)
  ).rejects.toThrow(`Account does not exist ${campaignEscrow}`);

  // TODO[@bonham000]: Assert CampaignEscrow rent was transferred to receiver account.
}
