#!/bin/bash

IDL_INPUT_FILE=target/types/campaign_treasury_manager.ts
PREVIOUS_IDL=target/types/previous_campaign_treasury_manager.ts

IDL_OUTPUT_FILE=src/sdk/idl/CampaignTreasuryManager.ts

# Only run if program IDL has changed.
if ! cmp --silent -- "$IDL_INPUT_FILE" "$PREVIOUS_IDL"; then
  echo "Program IDL changed, running script to modify IDL and generate SDK types..."
  cp $IDL_INPUT_FILE $IDL_OUTPUT_FILE
  yarn modify-program-idl
  npx eslint --cache --fix $IDL_OUTPUT_FILE
fi

cp $IDL_INPUT_FILE $PREVIOUS_IDL