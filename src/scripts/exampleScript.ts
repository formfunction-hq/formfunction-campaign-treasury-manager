import parseScriptArgs from "scripts/utils/parseScriptArgs";

function run() {
  const { environment } = parseScriptArgs();
  console.log(`Running example script with environment: ${environment}`);
}

run();
