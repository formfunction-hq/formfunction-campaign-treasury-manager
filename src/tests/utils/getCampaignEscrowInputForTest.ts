import {
  createSplToken,
  range,
} from "@formfunction-hq/formfunction-program-shared";
import { NATIVE_MINT } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import CreateCampaignEscrowInput from "sdk/types/CreateCampaignEscrowInput";
import CampaignEscrowSetupOptions from "tests/types/CampaignEscrowSetupOptions";
import CampaignEscrowSetupOptionsInput from "tests/types/CampaignEscrowSetupOptionsInput";
import getDefaultCampaignSetupOptions from "tests/utils/getDefaultCampaignSetupOptions";
import getSecondsAheadUnixTime from "tests/utils/getSecondsAheadUnixTime";
import getPayoutPhasesForTest from "tests/utils/payout-phases/getPayoutPhasesForTest";
import invariant from "tiny-invariant";

type EscrowSetupResult = {
  campaignUuid: string;
  createCampaignEscrowInput: CreateCampaignEscrowInput;
  depositEscrowCurrencies: Array<PublicKey>;
  setupOptions: CampaignEscrowSetupOptions;
};

export default async function getCampaignEscrowInputForTest(
  connection: Connection,
  authority: Keypair,
  setupOptions?: CampaignEscrowSetupOptionsInput
): Promise<EscrowSetupResult> {
  const treasuryMint =
    setupOptions?.useNativeTreasury ?? true
      ? NATIVE_MINT
      : await createSplToken(connection, authority);

  const options = getDefaultCampaignSetupOptions(treasuryMint, setupOptions);

  invariant(
    !(
      options.useNativeTreasury === true &&
      options.useNativeDepositEscrow === true
    ),
    "Cannot use native treasury and native deposit escrow."
  );

  let depositEscrowCurrencies: Array<PublicKey> = [];
  if (options.enableDepositEscrowCurrencies != null) {
    depositEscrowCurrencies = await Promise.all(
      range(0, options.enableDepositEscrowCurrencies).map(() =>
        createSplToken(connection, authority)
      )
    );
  }
  if (options.useNativeDepositEscrow) {
    depositEscrowCurrencies.push(NATIVE_MINT);
  }

  const payoutPhasesInput =
    setupOptions?.payoutPhases ?? getPayoutPhasesForTest().valid[0];
  const { campaignUuid } = options;
  const createCampaignEscrowInput: CreateCampaignEscrowInput = {
    campaignEndTime: getSecondsAheadUnixTime(5),
    nonVotingPayoutPhases: payoutPhasesInput.nonVotingPayoutPhases,
    votingPayoutPhases: payoutPhasesInput.votingPayoutPhases,
  };

  return {
    campaignUuid,
    createCampaignEscrowInput,
    depositEscrowCurrencies,
    setupOptions: options,
  };
}
