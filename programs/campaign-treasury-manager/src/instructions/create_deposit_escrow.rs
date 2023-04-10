use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::{
    cmp_pubkeys, create_deposit_escrow_account, is_native_mint, CampaignEscrow,
    CampaignTreasuryManagerError, DepositEscrow,
};

#[derive(Accounts)]
#[instruction(deposit_escrow_bump: u8)]
pub struct CreateDepositEscrow<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
        ],
        bump = campaign_escrow.bump,
    )]
    campaign_escrow: Account<'info, CampaignEscrow>,
    #[account()]
    authority: Signer<'info>,
    /// CHECK: Validated in instruction.
    /// This does not use Anchor init because we want to manually initialize this
    /// account as a token account in some cases (this is done in the instruction).
    #[account(
        mut,
        seeds = [
            DepositEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
            deposit_escrow_mint.key().as_ref()
        ],
        bump = deposit_escrow_bump,
    )]
    deposit_escrow: UncheckedAccount<'info>,
    deposit_escrow_mint: Account<'info, Mint>,
    system_program: Program<'info, System>,
    token_program: Program<'info, Token>,
    rent: Sysvar<'info, Rent>,
}

pub fn handle_create_deposit_escrow(
    ctx: Context<CreateDepositEscrow>,
    deposit_escrow_bump: u8,
) -> Result<()> {
    let campaign_escrow = &mut ctx.accounts.campaign_escrow;
    let authority = &ctx.accounts.authority;
    let deposit_escrow = &ctx.accounts.deposit_escrow;
    let deposit_escrow_mint = &ctx.accounts.deposit_escrow_mint;
    let token_program = &ctx.accounts.token_program;
    let system_program = &ctx.accounts.system_program;
    let rent = &ctx.accounts.rent;

    let deposit_matches_treasury_mint = cmp_pubkeys(
        &campaign_escrow.treasury.treasury_mint,
        &deposit_escrow_mint.key(),
    );

    if deposit_matches_treasury_mint {
        msg!(
            "Provided deposit_escrow_mint {} is already set as the treasury escrow.",
            deposit_escrow_mint.key()
        );
        return Err(CampaignTreasuryManagerError::InvalidCreateDepositEscrowIx.into());
    }

    if campaign_escrow
        .get_deposit_escrow_info(&deposit_escrow_mint.key())
        .is_some()
    {
        msg!(
            "deposit_escrow_mint {} already exists for campaign with campaign_uuid {}. This is a no-op.",
            deposit_escrow_mint.key(),
            campaign_escrow.campaign_uuid,
        );
        return Ok(());
    }

    if !is_native_mint(&deposit_escrow_mint.key()) {
        create_deposit_escrow_account(
            campaign_escrow.to_account_info(),
            deposit_escrow.to_account_info(),
            deposit_escrow_mint.to_account_info(),
            authority.to_account_info(),
            token_program,
            system_program,
            rent,
            &[],
            deposit_escrow_bump,
            campaign_escrow.campaign_uuid.clone(),
        )?;
    }

    campaign_escrow.add_deposit_escrow_info(deposit_escrow_mint.key(), deposit_escrow_bump);

    msg!(
        "Created DepositEscrow account for token mint {} for CampaignEscrow with campaign_uuid {}.",
        deposit_escrow_mint.key(),
        campaign_escrow.campaign_uuid
    );

    Ok(())
}
