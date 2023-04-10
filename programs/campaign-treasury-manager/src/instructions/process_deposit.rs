use anchor_lang::prelude::*;

use crate::constants::PROGRAM_PREFIX;
use crate::{CampaignEscrow, TreasuryEscrow};

#[derive(Accounts)]
#[instruction()]
pub struct ProcessDeposit<'info> {
    #[account(
        mut,
        constraint = campaign_escrow.treasury.treasury_escrow.key() == treasury_escrow.key(),
        seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
        ],
        bump = campaign_escrow.bump,
    )]
    campaign_escrow: Account<'info, CampaignEscrow>,
    /// CHECK: Validated in instruction.
    #[account(
        seeds = [
            PROGRAM_PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
            TreasuryEscrow::PREFIX.as_bytes()
        ],
        bump = campaign_escrow.treasury.bump,
    )]
    treasury_escrow: UncheckedAccount<'info>,
    #[account(mut)]
    payer: Signer<'info>,
}

/**
 * This instruction will process an existing DepositRecord. It will swap and
 * transfer the deposited funds to the CampaignEscrow treasury escrow account.
 *
 * To do this it needs to CPI to a swap program, probably Jupiter Aggregator.
 * This will generally probably entail:
 * - Determine best swap route/instruction data off-chain using Jupiter SDK
 *   and then pass these parameters to this instruction.
 * - Use those parameters to construct the swap instruction and then CPI to
 *   the Jupiter program.
 * - Once the swap is complete, update the DepositRecord and CampaignEscrow
 *   accounts, marking this deposit as processed.
 *
 * Note: It may be hard to test this locally or on devnet, because in general
 * the various swapping protocols are not maintained very well on devnet
 * (evidence of this can be seen throughout Jupiter Discord). Consequently,
 * we may be able to test this locally by constructing a handle_swap_token
 * helper function which has an alternate implementation behind a feature flag.
 * The alternate implementation can CPI into a custom local program we maintain
 * for local testing, which will arbitrarily swap the tokens and allow us to
 * still test the overall flow.
 *
 * The real Jupiter CPI will then be tested in prod.
 */
pub fn handle_process_deposit(_ctx: Context<ProcessDeposit>) -> Result<()> {
    msg!("handle_process_deposit ix: not implemented yet.");
    Ok(())
}
