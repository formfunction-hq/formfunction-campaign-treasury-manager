import {
  Environment,
  generateKeypairArray,
  requestAirdrops,
} from "@formfunction-hq/formfunction-program-shared";
import { Wallet as AnchorWallet } from "@project-serum/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import CampaignTreasuryManagerSdk from "sdk/CampaignTreasuryManagerSdk";
import getRpcFromEnvironmentForTest from "tests/utils/getRpcFromEnvironmentForTest";

type Result = {
  authority: Keypair;
  connection: Connection;
  creatorKeypair: Keypair;
  environment: Environment;
  otherKeypair: Keypair;
  sdk: CampaignTreasuryManagerSdk;
  wallet: Keypair;
};

export default async function getConnectionAndSdkForTest(
  environment: Environment = Environment.Local
): Promise<Result> {
  const keypairs = generateKeypairArray(4);
  const [walletKeypair, authorityKeypair, creatorKeypair, otherKeypair] =
    keypairs;

  const wallet = new AnchorWallet(walletKeypair);
  const connection = new Connection(
    getRpcFromEnvironmentForTest(environment),
    "processed"
  );

  await requestAirdrops({
    connection,
    environment,
    wallets: keypairs,
  });

  const sdk = new CampaignTreasuryManagerSdk({
    connection,
    environment,
    wallet,
  });
  return {
    authority: authorityKeypair,
    connection,
    creatorKeypair,
    environment,
    otherKeypair,
    sdk,
    wallet: walletKeypair,
  };
}
