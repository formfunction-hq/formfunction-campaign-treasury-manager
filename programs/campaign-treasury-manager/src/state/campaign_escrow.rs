use anchor_lang::prelude::*;

use crate::{
    assert_min_time_buffer,
    buffer_times::{MinBufferTimes, MinBufferTimesTrait},
    cmp_pubkeys,
    constants::ONE_HUNDRED_PERCENT_BASIS_POINTS,
    CampaignTreasuryManagerError, PayoutPhaseEnum, PayoutPhases,
};

// This account is a PDA of the Formfunction campaign UUID.
#[account]
pub struct CampaignEscrow {
    // PDA bump.
    pub bump: u8,
    // Campaign uuid, this is needed to more easily verify the PDA after the
    // account is created.
    pub campaign_uuid: String,
    // Authority pubkey which can update the escrow.
    // This will be a Formfunction managed wallet.
    pub authority: Pubkey,
    // Pubkey of the campaign creator, used to authorize some transactions.
    pub creator: Pubkey,
    // Payout wallet which will receive disbursements.
    // Note: this may be a 'fanout wallet' like Hydra.
    pub payout_wallet: Pubkey,
    // Treasury settings.
    pub treasury: Treasury,
    // Info about the DepositEscrow accounts which are supported for this CampaignEscrow.
    pub deposit_escrow_infos: Vec<DepositEscrowInfo>,
    // Campaign end time.
    pub campaign_end_time: i64,
    // The number of deposits (i.e. campaign sales) which have occurred.
    pub deposit_count: u64,
    // The number of deposits which have been successfully processed.
    pub processed_deposit_count: u64,
    // Counts the number of DepositRecord accounts that have been closed.
    pub closed_deposit_record_count: u64,
    // Marks if payouts can begin or not. This field is updated by the
    // authority account.
    pub payouts_ready: bool,
    // Payout phases.
    pub payout_phases: PayoutPhases,
}

impl CampaignEscrow {
    pub const DEPOSIT_ESCROW_INFOS_MAX_LEN: usize = 4;

    pub const SPACE: usize = 8 + // account discriminator
        1 + // bump
        32 + // campaign_uuid
        32 + // authority
        32 + // creator_authority
        32 + // payout_wallet
        Treasury::SPACE + // treasury
        4 + // 4 bytes of overhead for deposit_escrow_infos vec
        CampaignEscrow::DEPOSIT_ESCROW_INFOS_MAX_LEN * DepositEscrowInfo::SPACE + // deposit_escrow_infos
        8 + // campaign_end_time
        8 + // deposit_count
        8 + // processed_deposit_count
        8 + // closed_deposit_record_count
        1 + // payouts_ready
        PayoutPhases::SPACE + // payout_phases space
        128; // extra padding

    pub const PREFIX: &'static str = "campaign_escrow";

    pub fn increment_deposit_count(&mut self) {
        self.deposit_count = self.deposit_count.checked_add(1).unwrap();
    }

    pub fn increment_processed_deposit_count(&mut self) {
        self.processed_deposit_count = self.processed_deposit_count.checked_add(1).unwrap();
    }

    pub fn increment_total_funds(&mut self, funds_to_add: u64) {
        self.treasury.total_funds = self.treasury.total_funds.checked_add(funds_to_add).unwrap();
    }

    pub fn add_deposit_escrow_info(&mut self, mint: Pubkey, deposit_escrow_bump: u8) {
        self.deposit_escrow_infos.push(DepositEscrowInfo {
            deposit_escrow_bump,
            mint,
            closed: false,
        });
    }

    pub fn mark_deposit_escrow_as_closed(&mut self, mint: &Pubkey) {
        for val in self.deposit_escrow_infos.iter_mut() {
            if cmp_pubkeys(&val.mint, mint) {
                val.closed = true;
            }
        }
    }

    pub fn get_deposit_escrow_info(&self, mint: &Pubkey) -> Option<&DepositEscrowInfo> {
        self.deposit_escrow_infos
            .iter()
            .find(|val| cmp_pubkeys(&val.mint, mint))
    }

    pub fn calculate_payout_amount_from_payout_basis_points(
        &self,
        payout_basis_points: u16,
    ) -> u64 {
        let total_funds = self.treasury.total_funds;
        let basis_points = payout_basis_points as u64;
        let payout_as_percentage: u64 = basis_points
            .checked_div(ONE_HUNDRED_PERCENT_BASIS_POINTS as u64)
            .unwrap();
        total_funds.checked_mul(payout_as_percentage).unwrap()
    }

    pub fn assert_can_close_campaign_escrow(&self) -> Result<()> {
        self.assert_all_payouts_are_complete()?;

        // TODO[@bonham000]: Enable this check after the CloseDepositRecord ix is implemented, and update the closeEscrow tests.
        // if self.closed_deposit_record_count != self.deposit_count {
        //     msg!(
        //         "Cannot close escrow yet. It looks like some DepositRecord accounts have not been closed yet.",
        //     );
        //     return Err(CampaignTreasuryManagerError::InvalidCloseEscrow.into());
        // }

        for val in self.deposit_escrow_infos.iter() {
            if !val.closed {
                msg!(
                    "Cannot close escrow yet as a DepositEscrow still exists for mint {}.",
                    val.mint
                );
                return Err(CampaignTreasuryManagerError::InvalidCloseEscrow.into());
            }
        }

        Ok(())
    }

    pub fn assert_all_payouts_are_complete(&self) -> Result<()> {
        let next_payout = self
            .payout_phases
            .get_current_active_payout_phase_for_payout();
        if next_payout.is_some() {
            msg!("Cannot close escrow yet as a payout still exists.");
            return Err(CampaignTreasuryManagerError::InvalidCloseEscrow.into());
        }

        if let Some(last_payout) = self.payout_phases.to_ordered_list().last() {
            let refund_deadline = PayoutPhaseEnum::get_refund_deadline(last_payout);
            let clock = Clock::get()?;
            assert_min_time_buffer(
                refund_deadline,
                clock.unix_timestamp,
                MinBufferTimes::LAST_REFUND_DEADLINE_TO_CLOSE_ESCROW_IN_SECONDS,
                CampaignTreasuryManagerError::InvalidCloseEscrow,
                String::from("Min time buffer from last payout refund deadline violated, cannot close escrow yet.")
            )?;
        }

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct DepositEscrowInfo {
    // Bump for the associated escrow PDA account.
    pub deposit_escrow_bump: u8,
    // Token mint for this deposit currency.
    pub mint: Pubkey,
    // Marks if the associated DepositEscrow PDA has been closed or not. This
    // is used to ensure all of these accounts are closed before the main escrow
    // account is closed.
    pub closed: bool,
}

impl DepositEscrowInfo {
    pub const SPACE: usize = 1 + // Option memory overhead
    1 + // deposit_escrow_bump
    32 + // mint
    1; // closed
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Treasury {
    // This is the bump for the associated treasury_escrow PDA.
    pub bump: u8,
    // Treasury mint account (e.g. specifies native SOL or USDC).
    pub treasury_mint: Pubkey,
    // Escrow account which holds treasury funds (may be an ATA for non-native treasury mints).
    pub treasury_escrow: Pubkey,
    // Total funds deposited into the escrow. Only incremented when processed
    // deposits occur. This represents the maximum amount deposited.
    pub total_funds: u64,
}

impl Treasury {
    pub const SPACE: usize = 1 + // bump
        32 + // treasury_mint
        32 + // treasury_escrow
        8; // total_funds
}
