import {
  assertUnreachable,
  Environment,
} from "@formfunction-hq/formfunction-program-shared";

export default function getRpcFromEnvironmentForTest(
  environment: Environment
): string {
  switch (environment) {
    case Environment.Testnet:
      return "https://api.testnet.solana.com";
    case Environment.Development:
      return "https://api.devnet.solana.com";
    case Environment.Local:
      return "http://localhost:8899";
    case Environment.Production:
      return "https://api.mainnet-beta.solana.com";
    default: {
      return assertUnreachable(environment);
    }
  }
}
