import {
  assertUnreachable,
  Environment,
} from "@formfunction-hq/formfunction-program-shared";
import {
  CampaignTreasuryManagerProgramIds,
  DEVNET_PROGRAM_IDS,
  LOCALNET_PROGRAM_IDS,
  MAINNET_PROGRAM_IDS,
  TESTNET_PROGRAM_IDS,
} from "sdk/constants/ProgramIds";

export default function getProgramIdsFromEnvironment(
  environment: Environment
): CampaignTreasuryManagerProgramIds {
  switch (environment) {
    case Environment.Local:
      return LOCALNET_PROGRAM_IDS;
    case Environment.Development:
      return DEVNET_PROGRAM_IDS;
    case Environment.Testnet:
      return TESTNET_PROGRAM_IDS;
    case Environment.Production:
      return MAINNET_PROGRAM_IDS;
    default:
      return assertUnreachable(environment);
  }
}
