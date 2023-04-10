import { Environment } from "@formfunction-hq/formfunction-program-shared";
import parseEnvironmentArg from "scripts/utils/parseEnvironmentArg";
import yargs from "yargs";

type Options = {
  environment: Environment;
};

export default function parseScriptArgs(): Options {
  const { environment } = yargs(process.argv.slice(2))
    .options({
      environment: {
        default: "devnet",
        type: "string",
      },
    })
    .parseSync();

  return {
    environment: parseEnvironmentArg(environment),
  };
}
