use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use solana_program::program::invoke_signed;
use solana_program::system_instruction;

use crate::constants::PROGRAM_PREFIX;
use crate::{is_native_mint, CampaignEscrow, CampaignTreasuryManagerError, TreasuryEscrow};

#[derive(Accounts)]
#[instruction()]
pub struct PayOutFunds<'info> {
    #[account(
        mut,
        has_one = payout_wallet,
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
        mut,
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
    /// CHECK: Validated in instruction.
    #[account(mut)]
    payout_wallet: UncheckedAccount<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

pub fn handle_pay_out_funds(ctx: Context<PayOutFunds>) -> Result<()> {
    let campaign_escrow = &mut ctx.accounts.campaign_escrow;
    let treasury_escrow = &ctx.accounts.treasury_escrow;
    let payout_wallet = &ctx.accounts.payout_wallet;
    let token_program = &ctx.accounts.token_program;
    let system_program = &ctx.accounts.system_program;

    let next_payout = campaign_escrow
        .payout_phases
        .get_current_active_payout_phase_for_payout();

    if next_payout.is_none() {
        msg!("There is no next payout available.");
        return Err(CampaignTreasuryManagerError::InvalidPayoutRequest.into());
    }

    let next_payout = next_payout.unwrap();

    let payout_time = next_payout.get_payout_time();
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;
    if now < payout_time {
        msg!("Payout time has not been reached yet.");
        return Err(CampaignTreasuryManagerError::InvalidPayoutRequest.into());
    }

    let is_vetoed_by_authority = next_payout.get_is_vetoed_by_authority();
    if is_vetoed_by_authority {
        msg!("Payout has been vetoed by authority.");
        return Err(CampaignTreasuryManagerError::InvalidPayoutRequest.into());
    }

    let payout_index = next_payout.get_index();

    let next_payout_basis_points = next_payout.get_payout_basis_points();
    let payout_amount =
        campaign_escrow.calculate_payout_amount_from_payout_basis_points(next_payout_basis_points);

    if is_native_mint(&campaign_escrow.treasury.treasury_mint) {
        let treasury_escrow_seeds = TreasuryEscrow::get_seeds(
            &campaign_escrow.campaign_uuid,
            &campaign_escrow.treasury.bump,
        );

        invoke_signed(
            &system_instruction::transfer(
                &treasury_escrow.key(),
                &payout_wallet.key(),
                payout_amount,
            ),
            &[
                treasury_escrow.to_account_info(),
                payout_wallet.to_account_info(),
                system_program.to_account_info(),
            ],
            &[&treasury_escrow_seeds],
        )?;
    } else {
        let campaign_escrow_seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
            &[campaign_escrow.bump],
        ];

        invoke_signed(
            &spl_token::instruction::transfer(
                token_program.key,
                &treasury_escrow.key(),
                &payout_wallet.key(),
                &campaign_escrow.key(),
                &[],
                payout_amount,
            )?,
            &[
                treasury_escrow.to_account_info(),
                payout_wallet.to_account_info(),
                token_program.to_account_info(),
                campaign_escrow.to_account_info(),
            ],
            &[&campaign_escrow_seeds],
        )?;
    }

    campaign_escrow
        .payout_phases
        .mark_current_active_payout_phase_as_disbursed();

    msg!(
        "Paid out {} tokens to payout_wallet {} for payout with index {}.",
        payout_amount,
        payout_wallet.key(),
        payout_index,
    );

    Ok(())
}
