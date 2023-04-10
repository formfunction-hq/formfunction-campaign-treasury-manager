use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::{
    assert_valid_escrow_management_signers, close_system_account, close_token_account,
    constants::PROGRAM_PREFIX, is_native_mint, CampaignEscrow, TreasuryEscrow,
};

#[derive(Accounts)]
#[instruction()]
pub struct CloseEscrow<'info> {
    #[account(
        mut,
        has_one = authority,
        seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
        ],
        close = receiver,
        bump = campaign_escrow.bump,
    )]
    campaign_escrow: Account<'info, CampaignEscrow>,
    /// CHECK: Account validated in instruction.
    /// This account is closed manually in the ix handler.
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
    receiver: SystemAccount<'info>,
    #[account(mut)]
    payer: Signer<'info>,
    #[account()]
    authority: Signer<'info>,
    #[account()]
    creator: SystemAccount<'info>,
    token_program: Program<'info, Token>,
    system_program: Program<'info, System>,
}

// TODO[@bonham000]: The treasury_escrow account also needs to be closed.
pub fn handle_close_escrow(ctx: Context<CloseEscrow>) -> Result<()> {
    let campaign_escrow = &ctx.accounts.campaign_escrow;
    let authority = &ctx.accounts.authority;
    let creator = &ctx.accounts.creator;

    // Currently the authority must sign, but the following validation will be
    // relevant if we choose to also allow the creator to sign.
    assert_valid_escrow_management_signers(creator, authority, Some(campaign_escrow))?;

    campaign_escrow.assert_can_close_campaign_escrow()?;

    let treasury_mint = campaign_escrow.treasury.treasury_mint;
    let treasury_escrow = &ctx.accounts.treasury_escrow;

    if is_native_mint(&treasury_mint) {
        let escrow_signer_seeds = TreasuryEscrow::get_seeds(
            &campaign_escrow.campaign_uuid,
            &campaign_escrow.treasury.bump,
        );

        close_system_account(
            treasury_escrow.to_account_info(),
            ctx.accounts.receiver.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            &escrow_signer_seeds,
        )?;
    } else {
        let ref_data = treasury_escrow.try_borrow_data()?;
        let mut account_data: &[u8] = &ref_data;
        let token_account = TokenAccount::try_deserialize(&mut account_data)?;
        assert_eq!(
            token_account.amount, 0,
            "TreasuryEscrow must have zero tokens if it is a token account."
        );
        // Need to drop the mutable account borrow before trying to close the account below.
        drop(ref_data);

        let campaign_escrow_seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
            &[campaign_escrow.bump],
        ];

        close_token_account(
            treasury_escrow.to_account_info(),
            ctx.accounts.receiver.to_account_info(),
            ctx.accounts.campaign_escrow.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            &campaign_escrow_seeds,
        )?;
    }

    msg!(
        "Closed CampaignEscrow account and associated TreasuryEscrow with uuid {} and sent rent to {}.",
        campaign_escrow.campaign_uuid,
        ctx.accounts.receiver.key()
    );

    Ok(())
}
