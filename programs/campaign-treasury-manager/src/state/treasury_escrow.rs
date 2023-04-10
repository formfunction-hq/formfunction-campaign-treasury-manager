use anchor_lang::prelude::*;
use bytemuck::bytes_of;

use crate::constants::PROGRAM_PREFIX;

// This account is the main treasury escrow for the campaign.
#[account]
pub struct TreasuryEscrow {}

impl TreasuryEscrow {
    pub const PREFIX: &'static str = "treasury_escrow";

    pub fn get_seeds<'a>(campaign_uuid: &'a String, bump: &'a u8) -> [&'a [u8]; 4] {
        let seeds = [
            PROGRAM_PREFIX.as_bytes(),
            campaign_uuid.as_ref(),
            TreasuryEscrow::PREFIX.as_bytes(),
            bytes_of(bump),
        ];

        seeds
    }
}
