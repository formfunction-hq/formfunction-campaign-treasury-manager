use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token},
};

use crate::{
    assert_campaign_end_time_is_valid, assert_valid_escrow_management_signers, cmp_pubkeys,
    constants::PROGRAM_PREFIX, create_treasury_escrow_and_assert_is_valid, CampaignEscrow,
    CampaignTreasuryManagerError, NonVotingPayoutPhaseInput, PayoutPhases, Treasury,
    TreasuryEscrow, VotingPayoutPhaseInput,
};

#[derive(Accounts)]
#[instruction(campaign_uuid: String, treasury_bump: u8)]
pub struct UpdateEscrow<'info> {
    #[account(
        mut,
        has_one = authority,
        constraint = campaign_escrow.treasury.treasury_escrow.key() == treasury_escrow.key(),
        seeds = [
            CampaignEscrow::PREFIX.as_bytes(),
            campaign_escrow.campaign_uuid.as_bytes(),
        ],
        bump = campaign_escrow.bump,
    )]
    campaign_escrow: Account<'info, CampaignEscrow>,
    #[account(mut)]
    payer: Signer<'info>,
    #[account()]
    authority: Signer<'info>,
    #[account()]
    creator: SystemAccount<'info>,
    #[account()]
    treasury_mint: Account<'info, Mint>,
    /// CHECK: Validated in instruction.
    #[account(
        mut,
        seeds = [
            PROGRAM_PREFIX.as_bytes(),
            campaign_uuid.as_bytes(),
            TreasuryEscrow::PREFIX.as_bytes()
        ],
        bump = treasury_bump,
    )]
    treasury_escrow: UncheckedAccount<'info>,
    /// CHECK: Validated in instruction.
    #[account(mut)]
    payout_wallet: UncheckedAccount<'info>,
    #[account()]
    payout_wallet_owner: SystemAccount<'info>,
    token_program: Program<'info, Token>,
    ata_program: Program<'info, AssociatedToken>,
    system_program: Program<'info, System>,
    rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct UpdateCampaignEscrowInput {
    pub authority: Option<Pubkey>,
    pub creator: Option<Pubkey>,
    pub campaign_end_time: Option<i64>,
    pub non_voting_payout_phases: Option<Vec<NonVotingPayoutPhaseInput>>,
    pub voting_payout_phases: Option<Vec<VotingPayoutPhaseInput>>,
}

pub fn handle_update_escrow(
    ctx: Context<UpdateEscrow>,
    campaign_uuid: String,
    treasury_bump: u8,
    update_campaign_escrow_input: UpdateCampaignEscrowInput,
) -> Result<()> {
    let campaign_escrow = &mut ctx.accounts.campaign_escrow;
    let payer = &ctx.accounts.payer;
    let current_authority = &ctx.accounts.authority;
    let creator = &ctx.accounts.creator;
    let treasury_escrow = &ctx.accounts.treasury_escrow;
    let treasury_mint = &ctx.accounts.treasury_mint;
    let payout_wallet = &ctx.accounts.payout_wallet;
    let payout_wallet_owner = &ctx.accounts.payout_wallet_owner;
    let token_program = &ctx.accounts.token_program;
    let ata_program = &ctx.accounts.ata_program;
    let system_program = &ctx.accounts.system_program;
    let rent = &ctx.accounts.rent;

    // Currently the authority must sign, but the following validation will be
    // relevant if we choose to also allow the creator to sign.
    assert_valid_escrow_management_signers(creator, current_authority, Some(campaign_escrow))?;

    let clock = Clock::get()?;
    if clock.unix_timestamp > campaign_escrow.campaign_end_time {
        msg!("Cannot update CampaignEscrow after campaign_end_time.");
        return Err(CampaignTreasuryManagerError::InvalidUpdateEscrow.into());
    }

    let UpdateCampaignEscrowInput {
        authority,
        creator,
        campaign_end_time,
        non_voting_payout_phases,
        voting_payout_phases,
    } = update_campaign_escrow_input;

    create_treasury_escrow_and_assert_is_valid(
        campaign_escrow.to_account_info(),
        treasury_escrow.to_account_info(),
        treasury_mint.to_account_info(),
        payout_wallet.to_account_info(),
        payout_wallet_owner.to_account_info(),
        payer.to_account_info(),
        ata_program,
        token_program,
        system_program,
        rent,
        &[],
        treasury_bump,
        campaign_uuid,
    )?;

    let current_deposits = campaign_escrow.treasury.total_funds;
    let treasury_mint_changed = !cmp_pubkeys(
        &treasury_mint.key(),
        &campaign_escrow.treasury.treasury_mint,
    );
    if treasury_mint_changed {
        if current_deposits.gt(&0) {
            msg!(
                "Cannot update CampaignEscrow treasury_mint if treasury has deposits greater than 0, current deposit amount = {}.",
                current_deposits
            );
            return Err(CampaignTreasuryManagerError::InvalidUpdateEscrow.into());
        }

        msg!(
            "Updating treasury_mint from {} to {}.",
            campaign_escrow.treasury.treasury_mint,
            treasury_mint.key()
        );
        campaign_escrow.treasury = Treasury {
            bump: treasury_bump,
            treasury_mint: treasury_mint.key(),
            treasury_escrow: treasury_escrow.key(),
            total_funds: 0,
        };
    }

    if let Some(authority) = authority {
        msg!(
            "Updating authority from {} to {}.",
            campaign_escrow.authority,
            authority
        );
        campaign_escrow.authority = authority;
    }

    if let Some(creator) = creator {
        msg!(
            "Updating creator from {} to {}.",
            campaign_escrow.creator,
            creator
        );
        campaign_escrow.creator = creator;
    }

    if let Some(campaign_end_time) = campaign_end_time {
        assert_campaign_end_time_is_valid(clock.unix_timestamp, campaign_end_time)?;
        msg!(
            "Updating campaign_end_time from {} to {}.",
            campaign_escrow.campaign_end_time,
            campaign_end_time
        );
        campaign_escrow.campaign_end_time = campaign_end_time;
    }

    if let Some(non_voting_payout_phases) = non_voting_payout_phases {
        msg!("Updating payout_phases.");
        let payout_phases = PayoutPhases::new(
            non_voting_payout_phases,
            voting_payout_phases.unwrap_or_default(),
            campaign_escrow.campaign_end_time,
        )?;

        campaign_escrow.payout_phases = payout_phases;
    }

    msg!(
        "CampaignEscrow account with uuid {} updated by authority {}.",
        campaign_escrow.campaign_uuid,
        current_authority.key()
    );
    Ok(())
}
