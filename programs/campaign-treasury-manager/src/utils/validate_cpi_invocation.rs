use anchor_lang::prelude::*;

#[cfg(feature = "use-test-env")]
pub fn validate_cpi_invocation<'a>(_instruction_sysvar_account: &AccountInfo<'a>) -> Result<()> {
    Ok(())
}

#[cfg(not(feature = "use-test-env"))]
pub fn validate_cpi_invocation(instruction_sysvar_account: &AccountInfo) -> Result<()> {
    use crate::constants::{
        FORMFN_AUCTION_HOUSE_DEVNET_PROGRAM_ID, FORMFN_AUCTION_HOUSE_PROGRAM_ID,
        FORMFN_AUCTION_HOUSE_TESTNET_PROGRAM_ID, FORMFN_CANDY_MACHINE_PROGRAM_ID,
    };
    use crate::{cmp_pubkeys, CampaignTreasuryManagerError};
    use solana_program::sysvar::instructions::get_instruction_relative;

    let previous_instruction = get_instruction_relative(-1, instruction_sysvar_account)
        .map_err(|_| CampaignTreasuryManagerError::InvalidCpiInvocation)?;

    let previous_ix_program_id = previous_instruction.program_id;

    if ![
        FORMFN_AUCTION_HOUSE_DEVNET_PROGRAM_ID,
        FORMFN_AUCTION_HOUSE_TESTNET_PROGRAM_ID,
        FORMFN_AUCTION_HOUSE_PROGRAM_ID,
        FORMFN_CANDY_MACHINE_PROGRAM_ID,
    ]
    .iter()
    .any(|key| cmp_pubkeys(key, &previous_ix_program_id))
    {
        return Err(CampaignTreasuryManagerError::InvalidCpiInvocation.into());
    }

    Ok(())
}
