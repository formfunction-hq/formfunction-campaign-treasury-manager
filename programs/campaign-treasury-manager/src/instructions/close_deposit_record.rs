use anchor_lang::prelude::*;

use crate::constants::PROGRAM_PREFIX;
use crate::{CampaignEscrow, TreasuryEscrow};

#[derive(Accounts)]
#[instruction()]
pub struct CloseDepositRecord<'info> {
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

pub fn handle_close_deposit_record(_ctx: Context<CloseDepositRecord>) -> Result<()> {
    msg!("handle_close_deposit_record");
    Ok(())
}
