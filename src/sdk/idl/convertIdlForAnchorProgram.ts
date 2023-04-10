import { CampaignTreasuryManager, IDL } from "sdk/idl/CampaignTreasuryManager";

const TYPE_NAMES_TO_EXCLUDE_FROM_IDL = new Set(["PayoutPhaseEnum"]);

/**
 * When upgrading Anchor from version 24 to 26, the client side code which initializes
 * an Anchor Program with the generated IDL breaks because of the PayoutPhaseEnum
 * type, with the following error:
 *
 *   IdlError: Type not found: {"type":{"defined":"&'aVotingPayoutPhase"},"name":"0"}
 *
 *   57 |     this._programId = programIds.programId;
 *   58 |
 * > 59 |     this._program = new Program<CampaignTreasuryManager>(
 *       |                     ^
 *   60 |       CAMPAIGN_TREASURY_MANAGER_IDL,
 *   61 |       programIds.programId,
 *   62 |       provider
 *
 *   at Function.fieldLayout (node_modules/@project-serum/anchor/src/coder/borsh/idl.ts:100:19)
 *   at node_modules/@project-serum/anchor/src/coder/borsh/idl.ts:141:31
 *       at Array.map (<anonymous>)
 *
 * Apparently, this is an issue with Anchor that doesn't have any great workarounds
 * at the moment, see Discord discussion for details:
 * https://discord.com/channels/889577356681945098/889577399308656662/1068264242987421716
 *
 * For now, we can just manually remove the offending enum types before passing
 * the IDL into our SDK which is what this function does...
 */
export default function convertIdlForAnchorProgram(): CampaignTreasuryManager {
  const idl = {
    ...IDL,
    types: IDL.types.filter(
      (val) => !TYPE_NAMES_TO_EXCLUDE_FROM_IDL.has(val.name)
    ),
  };

  return idl as CampaignTreasuryManager;
}
