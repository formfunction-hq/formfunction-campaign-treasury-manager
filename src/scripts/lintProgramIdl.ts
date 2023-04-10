import lintProgramIdlScript from "@formfunction-hq/formfunction-program-shared/dist/scripts/lintProgramIdlScript";

function lintProgramIdl() {
  lintProgramIdlScript("src/sdk/idl/CampaignTreasuryManager.ts");
}

lintProgramIdl();
