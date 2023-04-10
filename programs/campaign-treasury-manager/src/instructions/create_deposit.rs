use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use solana_program::sysvar;

use crate::{
    assert_keys_equal, cmp_pubkeys, transfer_funds, validate_cpi_invocation, CampaignEscrow,
    DepositEscrow, DepositRecord, ID,
};

#[derive(Accounts)]
#[instruction(deposit_escrow_bump: u8)]
pub struct CreateDeposit<'info> {
    #[account(
        mut,
        seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
        ],
        bump = campaign_escrow.bump,
    )]
    campaign_escrow: Account<'info, CampaignEscrow>,
    #[account(
        init,
        seeds = [
            DepositRecord::PREFIX.as_bytes(),
            depositor.key().as_ref(),
            mint.key().as_ref(),
        ],
        bump,
        payer = depositor,
        space = DepositRecord::SPACE,
    )]
    deposit_record: Account<'info, DepositRecord>,
    /// CHECK: Validated in instruction.
    /// This account may be the treasury_escrow or a DepositEscrow account, depending
    /// on the nature of the deposit. The client SDK will pass in the right account,
    /// which will be validated in the instruction handler below.
    #[account(mut)]
    deposit_escrow: UncheckedAccount<'info>,
    deposit_escrow_mint: Account<'info, Mint>,
    #[account(mut)]
    depositor: Signer<'info>,
    /// CHECK: Validated in instruction.
    #[account(mut)]
    depositor_payment_account: UncheckedAccount<'info>,
    mint: Account<'info, Mint>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    /// CHECK: Validated by the address constraint.
    #[account(address = sysvar::instructions::id())]
    instruction_sysvar_account: UncheckedAccount<'info>,
}

// TODO[@bonham000]: Add CPI validation. This instruction should only be callable by CPI
// from our other programs.
pub fn handle_create_deposit(ctx: Context<CreateDeposit>, deposit_amount: u64) -> Result<()> {
    let campaign_escrow = &mut ctx.accounts.campaign_escrow;
    let token_program = &ctx.accounts.token_program;
    let system_program = &ctx.accounts.system_program;
    let mint = &ctx.accounts.mint;
    let depositor = &ctx.accounts.depositor;
    let deposit_escrow = &ctx.accounts.deposit_escrow;
    let deposit_record = &mut ctx.accounts.deposit_record;
    let depositor_payment_account = &ctx.accounts.depositor_payment_account;
    let deposit_escrow_mint = &ctx.accounts.deposit_escrow_mint;
    let instruction_sysvar_account = &ctx.accounts.instruction_sysvar_account;

    // This instruction may only be called via CPI from other formfn programs.
    validate_cpi_invocation(instruction_sysvar_account)?;

    let deposit_matches_treasury_mint = cmp_pubkeys(
        &campaign_escrow.treasury.treasury_mint,
        &deposit_escrow_mint.key(),
    );

    if deposit_matches_treasury_mint {
        assert_keys_equal(
            &deposit_escrow.key(),
            &campaign_escrow.treasury.treasury_escrow,
            None,
        )?;

        transfer_funds(
            depositor.to_account_info(),
            deposit_escrow.to_account_info(),
            depositor_payment_account.to_account_info(),
            deposit_escrow_mint.to_account_info(),
            token_program,
            system_program,
            deposit_amount,
        )?;
    } else {
        let deposit_escrow_currency = campaign_escrow
            .get_deposit_escrow_info(&deposit_escrow_mint.key())
            .unwrap();

        let expected_deposit_escrow_pda = Pubkey::create_program_address(
            &[
                DepositEscrow::PREFIX.as_bytes(),
                campaign_escrow.campaign_uuid.as_bytes(),
                &deposit_escrow_mint.key().to_bytes(),
                &[deposit_escrow_currency.deposit_escrow_bump],
            ],
            &ID,
        )
        .unwrap();

        assert_keys_equal(&expected_deposit_escrow_pda, &deposit_escrow.key(), None)?;

        transfer_funds(
            depositor.to_account_info(),
            deposit_escrow.to_account_info(),
            depositor_payment_account.to_account_info(),
            deposit_escrow_mint.to_account_info(),
            token_program,
            system_program,
            deposit_amount,
        )?;
    }

    deposit_record.bump = *ctx.bumps.get(DepositRecord::PREFIX).unwrap();
    deposit_record.mint = mint.key();
    deposit_record.depositor = depositor.key();
    deposit_record.deposit_escrow_mint = deposit_escrow_mint.key();
    deposit_record.initial_deposit_amount = deposit_amount;

    campaign_escrow.increment_deposit_count();

    // If deposit matched treasury escrow then it is now fully processed.
    if deposit_matches_treasury_mint {
        campaign_escrow.increment_processed_deposit_count();
        campaign_escrow.increment_total_funds(deposit_amount);
        deposit_record.deposit_processed = true;
        deposit_record.processed_deposit_amount = deposit_amount;
    }

    msg!(
        "Deposit of {} in currency mint {} created by {} for NFT mint {}.",
        deposit_amount,
        deposit_escrow_mint.key(),
        depositor.key(),
        mint.key(),
    );
    Ok(())
}
