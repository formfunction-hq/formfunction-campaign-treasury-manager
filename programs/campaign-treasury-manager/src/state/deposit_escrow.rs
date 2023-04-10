use anchor_lang::prelude::*;
use bytemuck::bytes_of;

// This account escrows deposit funds if the funds do not initially match
// the treasury currency. Each CampaignEscrow will have 1 of these PDAs for
// each deposit_escrow_currency that does not match the treasury currency.
#[account]
pub struct DepositEscrow {}

impl DepositEscrow {
    pub const PREFIX: &'static str = "deposit_escrow";

    pub fn get_seeds<'a>(
        campaign_uuid: &'a String,
        deposit_escrow_mint: &'a Pubkey,
        bump: &'a u8,
    ) -> [&'a [u8]; 4] {
        let seeds = [
            DepositEscrow::PREFIX.as_bytes(),
            campaign_uuid.as_ref(),
            deposit_escrow_mint.as_ref(),
            bytes_of(bump),
        ];

        seeds
    }
}
