#!/bin/bash
set -e 
set -o pipefail

ENVIRONMENT=$1
SKIP_CHECKS_FLAG=$2
SHOULD_SKIP_CHECKS=false

PROGRAM_ID="Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

if [[ "$SKIP_CHECKS_FLAG" == "skip-checks" ]]; then
  echo -e "\nSkipping pre-deploy checks before deployment!"
  SHOULD_SKIP_CHECKS=true
fi

if [ $SHOULD_SKIP_CHECKS == false ]; then
  # Run build and tests first.
  echo -e "\nRunning tests prior to $ENVIRONMENT deployment...\n"
  yarn build-program
  yarn test-program || { echo -e "\nTests failed! Please ensure tests are passing before attempting to deploy the program.\n"; exit 1; }

  # Make sure there aren't any changes that result from building and copying IDL.
  if [[ `git status --porcelain` ]]; then
    echo -e "\nThere are working tree changes! Aborting...\n";
    exit 1;
  fi

  echo -e "All checks passed! Building program...\n"
fi

if [[ "$ENVIRONMENT" == "devnet" ]]
then
  cp scripts/anchor-configs/Anchor-dev.toml Anchor.toml
elif [[ "$ENVIRONMENT" == "testnet" ]]
then
  cp scripts/anchor-configs/Anchor-test.toml Anchor.toml
else
  echo -e "\nUnrecognized environment. Only 'devnet' or 'testnet' is allowed.\n"
  exit 1
fi

echo -e "\nBuilding program ID $PROGRAM_ID for Solana $ENVIRONMENT.\n"

# Build program.
cargo +bpf build --package campaign-treasury-manager --target bpfel-unknown-unknown --release  --features use-test-anti-bot-authority
echo -e "\nBuild finished!\n"

DEPLOYER_ADDRESS=$(solana-keygen pubkey keys/devnet/deployer-keypair.json)
DEPLOYER_ADDRESS_BALANCE=$(solana balance $DEPLOYER_ADDRESS -u $ENVIRONMENT)
echo -e "Deployer address $DEPLOYER_ADDRESS has $DEPLOYER_ADDRESS_BALANCE\n"

function reset {
  cp scripts/anchor-configs/Anchor-local.toml Anchor.toml
}

read -p "Enter y/Y to confirm and proceed with the $ENVIRONMENT program deployment to program ID $PROGRAM_ID" -n 1 -r
echo    # (optional) move to a new line.
if [[ $REPLY =~ ^[Yy]$ ]]
then
  # Deploy program.
  echo -e "Calling solana program deploy target/deploy/campaign_treasury_manager.so -u $ENVIRONMENT -k ./keys/$ENVIRONMENT/deployer-keypair.json --program-id ./keys/$ENVIRONMENT/program-keypair.json\n"
  echo -e "This will take a moment...\n"
  solana program deploy ./target/deploy/campaign_treasury-manager.so -u $ENVIRONMENT -k ./keys/$ENVIRONMENT/deployer-keypair.json --program-id ./keys/$ENVIRONMENT/program-keypair.json

  reset
  echo -e "Program deploy to $ENVIRONMENT finished successfully! Don't forget to update the Program Versions document.\n"
  exit 0
fi

reset
echo -e "\nAborting deployment...\n"
exit 1
